import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameRoom,
} from './types.js';
import type { PuzzleBase } from './puzzles/puzzleBase.js';
import { createPuzzle } from './puzzles/puzzleRegistry.js';
import { ROOMS, TOTAL_ROOMS, getRoomConfig, isLastRoom, areAllRoomPuzzlesSolved } from './gameFlow.js';
import { preGenerateAllRoomNarratives, preGenerateUpcomingRoom, getCachedRoomNarrative, getCachedPuzzleNarrative } from './services/narrativeCache.js';
import { clearHintsForRoom, getTotalHintsUsed } from './services/hintService.js';
import { generateCompletionNarrative } from './services/narrativeService.js';
import type { RoomNarrativeEvent, CompletionNarrativeEvent } from '../../shared/types/narrative.js';
import {
  startGameTracking,
  startRoomTracking,
  startPuzzleTracking,
  recordHintUsed,
  recordWrongAttempt,
  scorePuzzleCompletion,
  calculateFinalScore,
  cleanupGame,
  getCumulativeScore,
} from './services/scoringService.js';
import { saveSession, deleteSession } from './services/sessionService.js';

// Ensure puzzles are registered
import './puzzles/cipherLock.js';
import './puzzles/splitScreen.js';
import './puzzles/wireConnection.js';
import './puzzles/sequenceMemory.js';
import './puzzles/mapNavigator.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Map<roomId, Map<puzzleType, PuzzleBase>>
const activePuzzles = new Map<string, Map<string, PuzzleBase>>();

export function getPuzzleInstance(roomId: string, puzzleType: string): PuzzleBase | undefined {
  return activePuzzles.get(roomId)?.get(puzzleType);
}

export function removePuzzleInstances(roomId: string): void {
  activePuzzles.delete(roomId);
}

function setupRoomPuzzles(room: GameRoom, roomIndex: number, playerIds: string[]): void {
  const config = getRoomConfig(roomIndex);
  if (!config) throw new Error(`No room config for index ${roomIndex}`);

  const roomPuzzles = new Map<string, PuzzleBase>();

  for (const puzzleType of config.puzzles) {
    const puzzle = createPuzzle(puzzleType);
    if (!puzzle) throw new Error(`Puzzle type "${puzzleType}" not registered`);

    const puzzleData = puzzle.generate(playerIds);
    roomPuzzles.set(puzzleType, puzzle);

    room.puzzles[puzzleType] = {
      id: puzzle.id,
      type: puzzle.type,
      solved: false,
      data: { ...puzzleData },
    };

    startPuzzleTracking(room.id, puzzleType);
  }

  activePuzzles.set(room.id, roomPuzzles);
}

export function startGame(io: TypedServer, room: GameRoom): void {
  room.state = 'playing';
  room.startedAt = Date.now();
  room.puzzleSolveTimes = {};
  room.currentRoomIndex = 0;
  room.roomPausedAt = null;
  room.totalPausedMs = 0;
  room.puzzles = {};

  const playerIds = room.players.map((p) => p.id);
  setupRoomPuzzles(room, 0, playerIds);

  const config = getRoomConfig(0)!;

  // Trigger narrative pre-generation for all rooms
  preGenerateAllRoomNarratives();

  // Start scoring tracking
  startGameTracking(room.id);

  // Send room narrative for the first room
  sendRoomNarrative(io, room, 0);

  io.to(room.id).emit('game-event', {
    type: 'game-started',
    message: `Entering ${config.name}...`,
    timestamp: Date.now(),
  });

  io.to(room.id).emit('room-updated', room);
  saveSession(room, getCumulativeScore(room.id));
}

export function handlePuzzleSolved(
  io: TypedServer,
  room: GameRoom,
  puzzleType: string,
): void {
  const solveTime = getElapsedPlayTime(room);
  room.puzzleSolveTimes[puzzleType] = solveTime;

  const seconds = (solveTime / 1000).toFixed(1);

  // Score the puzzle completion
  const scoreUpdate = scorePuzzleCompletion(room.id, puzzleType, room.currentRoomIndex);
  io.to(room.id).emit('score-update', scoreUpdate);

  // Try to get narrative success message
  const currentConfig = getRoomConfig(room.currentRoomIndex);
  const puzzleNarrative = currentConfig
    ? getCachedPuzzleNarrative(puzzleType)
    : null;
  const successMessage = puzzleNarrative?.successMessage ?? `Puzzle solved in ${seconds}s!`;

  io.to(room.id).emit('game-event', {
    type: 'puzzle-solved',
    message: successMessage,
    timestamp: Date.now(),
  });

  saveSession(room, getCumulativeScore(room.id));
  checkRoomCompletion(io, room);
}

function checkRoomCompletion(io: TypedServer, room: GameRoom): void {
  if (!areAllRoomPuzzlesSolved(room.currentRoomIndex, room.puzzles)) {
    io.to(room.id).emit('room-updated', room);
    return;
  }

  if (isLastRoom(room.currentRoomIndex)) {
    room.state = 'completed';
    room.completedAt = Date.now();

    const totalTime = getElapsedPlayTime(room);
    const totalTimeSeconds = (totalTime / 1000).toFixed(1);
    const puzzlesSolved = Object.values(room.puzzles).filter((p) => p.solved).length;
    const totalPuzzles = Object.keys(room.puzzles).length;
    const hintsUsed = getTotalHintsUsed(room.id);
    const playerNames = room.players.map((p) => p.name);

    // Emit final score
    const finalScore = calculateFinalScore(room.id, totalTime);
    io.to(room.id).emit('final-score', finalScore);

    io.to(room.id).emit('game-event', {
      type: 'game-completed',
      message: `Congratulations! You escaped in ${totalTimeSeconds}s!`,
      timestamp: Date.now(),
    });

    // Generate and send AI completion narrative
    generateCompletionNarrative(totalTime, puzzlesSolved, hintsUsed, playerNames)
      .then((message) => {
        const completionData: CompletionNarrativeEvent = {
          message,
          totalTime,
          puzzlesSolved,
          totalPuzzles,
          hintsUsed,
        };
        io.to(room.id).emit('completion-narrative', completionData);
      })
      .catch(() => {
        // Fallback: still send stats without AI narrative
        const completionData: CompletionNarrativeEvent = {
          message: `In ${totalTimeSeconds}s, ${playerNames.join(' and ')} conquered all ${puzzlesSolved} puzzles and escaped to freedom.`,
          totalTime,
          puzzlesSolved,
          totalPuzzles,
          hintsUsed,
        };
        io.to(room.id).emit('completion-narrative', completionData);
      });

    io.to(room.id).emit('room-updated', room);
    deleteSession(room.id);
    return;
  }

  room.state = 'transitioning';
  room.roomPausedAt = Date.now();

  const nextIndex = room.currentRoomIndex + 1;
  const nextConfig = getRoomConfig(nextIndex)!;

  // Pre-generate narrative for the upcoming room
  preGenerateUpcomingRoom(room.currentRoomIndex);

  io.to(room.id).emit('room-transition', {
    roomIndex: nextIndex,
    roomName: nextConfig.name,
    roomDescription: nextConfig.description,
    countdown: 3,
  });

  io.to(room.id).emit('room-updated', room);
  saveSession(room, getCumulativeScore(room.id));
}

export function advanceToNextRoom(io: TypedServer, room: GameRoom): void {
  if (room.state !== 'transitioning') return;

  // Accumulate pause time
  if (room.roomPausedAt) {
    room.totalPausedMs += Date.now() - room.roomPausedAt;
    room.roomPausedAt = null;
  }

  const nextIndex = room.currentRoomIndex + 1;
  room.currentRoomIndex = nextIndex;
  room.state = 'playing';

  // Clear previous room's puzzle instances and hints
  activePuzzles.delete(room.id);
  clearHintsForRoom(room.id);

  // Start scoring for the new room
  startRoomTracking(room.id, nextIndex);

  const playerIds = room.players.map((p) => p.id);
  setupRoomPuzzles(room, nextIndex, playerIds);

  const config = getRoomConfig(nextIndex)!;

  // Send narrative for the new room
  sendRoomNarrative(io, room, nextIndex);

  io.to(room.id).emit('game-event', {
    type: 'room-entered',
    message: `You have entered ${config.name}.`,
    timestamp: Date.now(),
  });

  io.to(room.id).emit('room-updated', room);
}

export function getElapsedPlayTime(room: GameRoom): number {
  if (!room.startedAt) return 0;
  const end = room.completedAt ?? room.roomPausedAt ?? Date.now();
  return end - room.startedAt - room.totalPausedMs;
}

function sendRoomNarrative(io: TypedServer, room: GameRoom, roomIndex: number): void {
  const config = getRoomConfig(roomIndex);
  if (!config) return;

  const roomNarrative = getCachedRoomNarrative(roomIndex);
  if (!roomNarrative) return;

  const puzzleNarratives: RoomNarrativeEvent['puzzleNarratives'] = {};
  for (const puzzleType of config.puzzles) {
    const pn = getCachedPuzzleNarrative(puzzleType);
    if (pn) puzzleNarratives[puzzleType] = pn;
  }

  io.to(room.id).emit('room-narrative', {
    roomNarrative,
    puzzleNarratives,
  });
}

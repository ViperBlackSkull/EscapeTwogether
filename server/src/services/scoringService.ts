import type {
  PuzzleMetrics,
  PuzzleScore,
  RoomScore,
  GameScore,
  CommunicationStats,
  CommunicationRating,
  RelationshipTier,
  ScoreUpdateEvent,
  FinalScoreEvent,
} from '../../../shared/types/scoring.js';
import { DIFFICULTY_PROGRESSION, ROOMS, getTargetDuration } from '../config/gameScenario.js';

// Per-puzzle tracking
interface PuzzleTracker {
  startedAt: number;
  hintsUsed: number;
  wrongAttempts: number;
  messagesExchanged: number;
  pausedMs: number;
  pausedAt: number | null;
}

// Per-room tracking
interface RoomTracker {
  startedAt: number;
  puzzleTrackers: Map<string, PuzzleTracker>;
  completedPuzzleScores: PuzzleScore[];
  totalMessages: number;
  messageTimestamps: number[];
  playerMessageCounts: Map<string, number>;
}

// Per-game tracking
const gameTrackers = new Map<string, RoomTracker[]>();
const cumulativeScores = new Map<string, number>();

function getGameTracker(roomId: string): RoomTracker[] {
  if (!gameTrackers.has(roomId)) {
    gameTrackers.set(roomId, []);
  }
  return gameTrackers.get(roomId)!;
}

function getCurrentRoomTracker(roomId: string): RoomTracker | undefined {
  const trackers = getGameTracker(roomId);
  return trackers[trackers.length - 1];
}

// --- Lifecycle hooks ---

export function startGameTracking(roomId: string): void {
  gameTrackers.delete(roomId);
  cumulativeScores.delete(roomId);
  getGameTracker(roomId); // initialize empty array
  startRoomTracking(roomId, 0);
}

export function startRoomTracking(roomId: string, _roomIndex: number): void {
  const trackers = getGameTracker(roomId);
  trackers.push({
    startedAt: Date.now(),
    puzzleTrackers: new Map(),
    completedPuzzleScores: [],
    totalMessages: 0,
    messageTimestamps: [],
    playerMessageCounts: new Map(),
  });
}

export function startPuzzleTracking(roomId: string, puzzleType: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  roomTracker.puzzleTrackers.set(puzzleType, {
    startedAt: Date.now(),
    hintsUsed: 0,
    wrongAttempts: 0,
    messagesExchanged: 0,
    pausedMs: 0,
    pausedAt: null,
  });
}

export function recordHintUsed(roomId: string, puzzleType: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  const tracker = roomTracker.puzzleTrackers.get(puzzleType);
  if (tracker) tracker.hintsUsed++;
}

export function recordWrongAttempt(roomId: string, puzzleType: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  const tracker = roomTracker.puzzleTrackers.get(puzzleType);
  if (tracker) tracker.wrongAttempts++;
}

export function recordMessage(roomId: string, playerId: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  roomTracker.totalMessages++;
  roomTracker.messageTimestamps.push(Date.now());
  roomTracker.playerMessageCounts.set(
    playerId,
    (roomTracker.playerMessageCounts.get(playerId) ?? 0) + 1,
  );
  // Increment messages for all active puzzles
  for (const tracker of roomTracker.puzzleTrackers.values()) {
    if (!tracker.pausedAt) {
      tracker.messagesExchanged++;
    }
  }
}

export function pausePuzzleTracking(roomId: string, puzzleType: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  const tracker = roomTracker.puzzleTrackers.get(puzzleType);
  if (tracker && !tracker.pausedAt) {
    tracker.pausedAt = Date.now();
  }
}

export function resumePuzzleTracking(roomId: string, puzzleType: string): void {
  const roomTracker = getCurrentRoomTracker(roomId);
  if (!roomTracker) return;
  const tracker = roomTracker.puzzleTrackers.get(puzzleType);
  if (tracker?.pausedAt) {
    tracker.pausedMs += Date.now() - tracker.pausedAt;
    tracker.pausedAt = null;
  }
}

// --- Scoring calculations ---

export function calculatePuzzleScore(
  puzzleType: string,
  roomIndex: number,
  metrics: PuzzleMetrics,
  targetDurationMinutes: number,
): PuzzleScore {
  const targetMs = targetDurationMinutes * 60 * 1000;
  const basePoints = 100;

  // Deductions
  const hintDeduction = metrics.hintsUsed * DIFFICULTY_PROGRESSION.hintCost;
  const wrongDeduction = metrics.wrongAttempts * DIFFICULTY_PROGRESSION.wrongAttemptPenalty;
  const deductions = hintDeduction + wrongDeduction;

  // Speed bonus
  let bonusPoints = 0;
  const timeRatio = metrics.timeElapsed / targetMs;
  if (timeRatio < DIFFICULTY_PROGRESSION.speedBonusThreshold) {
    bonusPoints = 30;
  } else if (timeRatio < 1.0) {
    bonusPoints = 15;
  }

  const finalScore = Math.max(0, basePoints - deductions + bonusPoints);

  return {
    puzzleType,
    roomIndex,
    metrics,
    basePoints,
    deductions,
    bonusPoints,
    finalScore,
  };
}

export function scorePuzzleCompletion(
  roomId: string,
  puzzleType: string,
  roomIndex: number,
): ScoreUpdateEvent {
  const roomTracker = getCurrentRoomTracker(roomId);
  const tracker = roomTracker?.puzzleTrackers.get(puzzleType);

  const targetDuration = getTargetDuration(roomIndex);

  const metrics: PuzzleMetrics = tracker
    ? {
        timeElapsed: Date.now() - tracker.startedAt - tracker.pausedMs,
        hintsUsed: tracker.hintsUsed,
        wrongAttempts: tracker.wrongAttempts,
        messagesExchanged: tracker.messagesExchanged,
      }
    : { timeElapsed: 0, hintsUsed: 0, wrongAttempts: 0, messagesExchanged: 0 };

  const puzzleScore = calculatePuzzleScore(puzzleType, roomIndex, metrics, targetDuration);

  if (roomTracker) {
    roomTracker.completedPuzzleScores.push(puzzleScore);
  }

  const cumulative = (cumulativeScores.get(roomId) ?? 0) + puzzleScore.finalScore;
  cumulativeScores.set(roomId, cumulative);

  return {
    puzzleScore,
    cumulativeScore: cumulative,
    relationshipTier: getRelationshipTier(cumulative),
  };
}

export function calculateRoomScore(roomId: string, roomIndex: number): RoomScore {
  const roomTracker = getCurrentRoomTracker(roomId);
  const roomConfig = ROOMS[roomIndex];

  const puzzleScores = roomTracker?.completedPuzzleScores ?? [];
  const totalScore = puzzleScores.reduce((sum, ps) => sum + ps.finalScore, 0);
  const actualDurationMs = roomTracker
    ? Date.now() - roomTracker.startedAt
    : 0;

  return {
    roomIndex,
    roomName: roomConfig?.name ?? `Room ${roomIndex + 1}`,
    puzzleScores,
    totalScore,
    targetDurationMinutes: roomConfig?.targetDurationMinutes ?? 15,
    actualDurationMs,
  };
}

export function calculateCommunicationStats(
  roomId: string,
  totalTimeMs: number,
): CommunicationStats {
  const allTimestamps: number[] = [];
  let totalMessages = 0;

  const trackers = getGameTracker(roomId);
  for (const rt of trackers) {
    totalMessages += rt.totalMessages;
    allTimestamps.push(...rt.messageTimestamps);
  }

  allTimestamps.sort((a, b) => a - b);

  // Average response time (time between consecutive messages from different players)
  let totalResponseTime = 0;
  let responseCount = 0;
  for (let i = 1; i < allTimestamps.length; i++) {
    totalResponseTime += allTimestamps[i]! - allTimestamps[i - 1]!;
    responseCount++;
  }
  const averageResponseTimeMs = responseCount > 0
    ? totalResponseTime / responseCount
    : 0;

  const totalMinutes = totalTimeMs / 60_000;
  const messagesPerMinute = totalMinutes > 0 ? totalMessages / totalMinutes : 0;

  let rating: CommunicationRating;
  if (messagesPerMinute < 0.5) {
    rating = 'Silent Partners';
  } else if (messagesPerMinute < 1.5) {
    rating = 'Occasional Check-ins';
  } else if (messagesPerMinute < 3) {
    rating = 'Good Communicators';
  } else {
    rating = 'Great Communicators';
  }

  return {
    totalMessages,
    averageResponseTimeMs,
    messagesPerMinute,
    rating,
  };
}

export function calculateCooperationScore(roomId: string): number {
  const trackers = getGameTracker(roomId);
  const playerTotals = new Map<string, number>();

  for (const rt of trackers) {
    for (const [playerId, count] of rt.playerMessageCounts) {
      playerTotals.set(playerId, (playerTotals.get(playerId) ?? 0) + count);
    }
  }

  const counts = Array.from(playerTotals.values());
  if (counts.length < 2) return 50; // default

  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 50;

  // Perfect balance = 100, one person doing all = 0
  const ideal = total / counts.length;
  const deviation = counts.reduce((sum, c) => sum + Math.abs(c - ideal), 0);
  const maxDeviation = total; // worst case: one person sends all
  return Math.round(100 * (1 - deviation / maxDeviation));
}

export function getRelationshipTier(cumulativeScore: number): RelationshipTier {
  if (cumulativeScore >= 400) return 'Soulmates';
  if (cumulativeScore >= 280) return 'Trusted Allies';
  if (cumulativeScore >= 150) return 'Good Partners';
  return 'New Acquaintances';
}

export function calculateFinalScore(
  roomId: string,
  totalTimeMs: number,
): FinalScoreEvent {
  const trackers = getGameTracker(roomId);
  const roomScores: RoomScore[] = [];

  for (let i = 0; i < trackers.length; i++) {
    const rt = trackers[i]!;
    const roomConfig = ROOMS[i];
    roomScores.push({
      roomIndex: i,
      roomName: roomConfig?.name ?? `Room ${i + 1}`,
      puzzleScores: rt.completedPuzzleScores,
      totalScore: rt.completedPuzzleScores.reduce((s, ps) => s + ps.finalScore, 0),
      targetDurationMinutes: roomConfig?.targetDurationMinutes ?? 15,
      actualDurationMs: rt.startedAt ? (rt.messageTimestamps[rt.messageTimestamps.length - 1] ?? Date.now()) - rt.startedAt : 0,
    });
  }

  const totalScore = cumulativeScores.get(roomId) ?? 0;
  const communicationStats = calculateCommunicationStats(roomId, totalTimeMs);
  const cooperationScore = calculateCooperationScore(roomId);

  const gameScore: GameScore = {
    roomScores,
    totalScore,
    totalTimeMs,
    communicationStats,
    relationshipTier: getRelationshipTier(totalScore),
    cooperationScore,
  };

  return { gameScore };
}

export function getCumulativeScore(roomId: string): number {
  return cumulativeScores.get(roomId) ?? 0;
}

export function getSerializableScoringState(roomId: string): {
  cumulativeScore: number;
  completedPuzzleScores: Array<{ puzzleType: string; roomIndex: number; finalScore: number }>;
} | null {
  const score = cumulativeScores.get(roomId);
  const trackers = gameTrackers.get(roomId);
  if (score === undefined || !trackers) return null;

  const completedPuzzleScores: Array<{ puzzleType: string; roomIndex: number; finalScore: number }> = [];
  for (let i = 0; i < trackers.length; i++) {
    for (const ps of trackers[i]!.completedPuzzleScores) {
      completedPuzzleScores.push({ puzzleType: ps.puzzleType, roomIndex: ps.roomIndex, finalScore: ps.finalScore });
    }
  }

  return { cumulativeScore: score, completedPuzzleScores };
}

export function restoreScoringState(roomId: string, cumulativeScore: number): void {
  cumulativeScores.set(roomId, cumulativeScore);
}

export function cleanupGame(roomId: string): void {
  gameTrackers.delete(roomId);
  cumulativeScores.delete(roomId);
}

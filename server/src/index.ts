import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { v4 as uuidv4 } from 'uuid';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameRoom,
  Player,
  ChatMessage,
  JoinRoomPayload,
  PuzzleActionPayload,
} from './types.js';
import {
  startGame,
  handlePuzzleSolved,
  getPuzzleInstance,
  removePuzzleInstances,
  advanceToNextRoom,
} from './gameOrchestrator.js';
import { GAME_CONFIG } from './config.js';
import { getHint as getAiHint } from './services/hintService.js';
import { recordMessage, recordHintUsed, recordWrongAttempt, cleanupGame, restoreScoringState, getRelationshipTier, getCumulativeScore as getCumulativeScoreScoring } from './services/scoringService.js';

function saveSessionWithScore(room: GameRoom): void {
  saveSession(room, getCumulativeScoreScoring(room.id));
}
import {
  saveSession,
  loadSession,
  deleteSession,
  trackDisconnectedPlayer,
  validateReconnection,
  clearDisconnectedPlayer,
  addChatToHistory,
  getChatHistory,
  clearChatHistory,
  cleanupStaleDisconnections,
  cleanupExpiredSessions,
} from './services/sessionService.js';
import imagesRouter from './routes/images.js';
import { httpRateLimiter, roomCreationExceeded, socketRateExceeded } from './middleware/rateLimiter.js';
import {
  validatePlayerName,
  validateRoomCode,
  validateChatMessage,
  validatePuzzleAction,
} from './middleware/validation.js';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3001', 10);

const ALLOWED_ORIGINS = isProduction
  ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
  : [];

function getCorsOrigin(): string[] | RegExp {
  if (isProduction && ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS;
  }
  if (!isProduction) {
    return /^http:\/\/localhost:\d+$/;
  }
  return [];
}

const app = express();

function resolveClientDist(): string {
  const candidates = [
    join(__dirname, '../../client/dist'),
    join(__dirname, '../../../../client/dist'),
    join(process.cwd(), 'client/dist'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'index.html'))) return dir;
  }
  return candidates[candidates.length - 1]!;
}

if (isProduction) {
  app.use(express.static(resolveClientDist()));
  app.use(cors({ origin: getCorsOrigin() }));
} else {
  app.use(cors({ origin: getCorsOrigin() }));
}

app.use(httpRateLimiter);
app.use('/api/images', imagesRouter);

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: getCorsOrigin() },
  maxHttpBufferSize: 1e6,
  pingTimeout: 10000,
  pingInterval: 5000,
  connectTimeout: 10000,
});

// In-memory state
const rooms = new Map<string, GameRoom>();
const players = new Map<string, Player>();

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CONFIG.roomCodeLength; i++) {
    code +=
      GAME_CONFIG.roomCodeChars[
        Math.floor(Math.random() * GAME_CONFIG.roomCodeChars.length)
      ];
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

function broadcastRoomUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('room-updated', room);
}

function removePlayerFromRoom(socketId: string, voluntary = false) {
  const player = players.get(socketId);
  if (!player || !player.currentRoom) return;

  const room = rooms.get(player.currentRoom);
  if (!room) return;

  if (voluntary) {
    // Player intentionally left — remove from room entirely
    room.players = room.players.filter((p) => p.socketId !== socketId);
    player.currentRoom = null;

    if (room.players.length === 0) {
      rooms.delete(room.id);
      removePuzzleInstances(room.id);
      cleanupGame(room.id);
      deleteSession(room.id);
      clearChatHistory(room.id);
    } else {
      io.to(room.id).emit('game-event', {
        type: 'player-left',
        message: `${player.name} left the room`,
        timestamp: Date.now(),
      });
      broadcastRoomUpdate(room.id);
      // Save session when a player leaves mid-game
      if (room.state === 'playing' || room.state === 'transitioning') {
        saveSessionWithScore(room);
      }
    }
  } else {
    // Disconnection — keep room alive for reconnection window
    const reconnectionToken = trackDisconnectedPlayer(
      player.id,
      player.name,
      room.id,
    );

    // Notify partner
    io.to(room.id).emit('partner-disconnected', player.name);

    // Save session for potential reconnection
    if (room.state === 'playing' || room.state === 'transitioning') {
      saveSessionWithScore(room);
    }

    // Send reconnection token back to the disconnecting client
    // (They may reconnect before the socket fully closes)
    io.to(player.socketId).emit('reconnection-offer', {
      playerId: player.id,
      playerName: player.name,
      roomId: room.id,
      reconnectionToken,
    });
  }
}

function handlePuzzleAction(
  room: GameRoom,
  player: Player,
  payload: PuzzleActionPayload,
) {
  const puzzleState = room.puzzles[payload.puzzleId];
  if (!puzzleState || puzzleState.solved) return;

  const puzzleInstance = getPuzzleInstance(room.id, puzzleState.type);
  if (!puzzleInstance) {
    // Fallback for puzzles without registered instances
    puzzleState.data = { ...puzzleState.data, ...payload.data };
    io.to(room.id).emit('puzzle-updated', { ...puzzleState });
    broadcastRoomUpdate(room.id);
    return;
  }

  const result = puzzleInstance.validateAction(player.id, {
    type: payload.action,
    playerRole: '',
    data: payload.data,
  });

  if (result.updatedState) {
    Object.assign(puzzleState.data, result.updatedState);
  }

  if (result.solved) {
    puzzleState.solved = true;
    puzzleInstance.markSolved();
    handlePuzzleSolved(io, room, puzzleState.type);
  } else {
    // Track wrong attempts for scoring
    if (payload.action === 'submit' || payload.action === 'check') {
      recordWrongAttempt(room.id, puzzleState.type);
    }
    io.to(room.id).emit('puzzle-updated', { ...puzzleState });
    broadcastRoomUpdate(room.id);
  }

  // Handle hint requests separately to emit game events
  if (payload.action === 'request-hint' && result.success) {
    recordHintUsed(room.id, puzzleState.type);
    const currentLevel = puzzleState.data.hintLevel || 0;
    getAiHint(room.id, puzzleState.type, currentLevel).then((hint) => {
      if (hint.cooldownRemaining > 0) {
        const playerSocket = room.players.find((p) => p.id === player.id);
        if (playerSocket) {
          io.to(playerSocket.socketId).emit('game-event', {
            type: 'hint',
            message: `Hint cooldown: ${hint.cooldownRemaining}s remaining`,
            timestamp: Date.now(),
          });
        }
        return;
      }

      puzzleState.data.hintLevel = hint.level;

      const playerSocket = room.players.find((p) => p.id === player.id);
      if (playerSocket) {
        io.to(playerSocket.socketId).emit('game-event', {
          type: 'hint',
          message: `Hint (${hint.level}/${hint.maxLevel}): ${hint.text}`,
          timestamp: Date.now(),
        });
      }

      io.to(room.id).emit('puzzle-updated', { ...puzzleState });
      broadcastRoomUpdate(room.id);
    }).catch(() => {
      const hintLevel = puzzleState.data.hintLevel || 0;
      const fallback = puzzleInstance.getHint(hintLevel - 1);
      const playerSocket = room.players.find((p) => p.id === player.id);
      if (playerSocket) {
        io.to(playerSocket.socketId).emit('game-event', {
          type: 'hint',
          message: `Hint: ${fallback}`,
          timestamp: Date.now(),
        });
      }
      io.to(room.id).emit('puzzle-updated', { ...puzzleState });
      broadcastRoomUpdate(room.id);
    });
  }
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create-room', (playerName: string) => {
    const nameCheck = validatePlayerName(playerName);
    if (!nameCheck.valid) {
      socket.emit('error', nameCheck.error!);
      return;
    }

    if (roomCreationExceeded(socket.handshake.address || 'unknown')) {
      socket.emit('error', 'Too many rooms created. Please wait a minute.');
      return;
    }

    const roomId = generateRoomCode();
    const player: Player = {
      id: uuidv4(),
      name: nameCheck.sanitized!,
      socketId: socket.id,
      currentRoom: roomId,
    };

    const room: GameRoom = {
      id: roomId,
      players: [player],
      state: 'waiting',
      puzzles: {},
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      puzzleSolveTimes: {},
      currentRoomIndex: 0,
      roomPausedAt: null,
      totalPausedMs: 0,
    };

    players.set(socket.id, player);
    rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('player-assigned', player.id);
    socket.emit('room-joined', room, player);
  });

  socket.on('join-room', (payload: JoinRoomPayload) => {
    const { roomId, playerName } = payload;

    const codeCheck = validateRoomCode(roomId);
    if (!codeCheck.valid) {
      socket.emit('error', codeCheck.error!);
      return;
    }

    const nameCheck = validatePlayerName(playerName);
    if (!nameCheck.valid) {
      socket.emit('error', nameCheck.error!);
      return;
    }

    const room = rooms.get(roomId.toUpperCase());

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= GAME_CONFIG.maxPlayersPerRoom) {
      socket.emit('error', 'Room is full');
      return;
    }

    if (room.state !== 'waiting') {
      socket.emit('error', 'Game already in progress');
      return;
    }

    const player: Player = {
      id: uuidv4(),
      name: nameCheck.sanitized!,
      socketId: socket.id,
      currentRoom: roomId.toUpperCase(),
    };

    players.set(socket.id, player);
    room.players.push(player);
    socket.join(room.id);

    socket.emit('player-assigned', player.id);
    socket.emit('room-joined', room, player);

    io.to(room.id).emit('game-event', {
      type: 'player-joined',
      message: `${nameCheck.sanitized!} joined the room`,
      timestamp: Date.now(),
    });

    broadcastRoomUpdate(room.id);
  });

  socket.on('leave-room', () => {
    removePlayerFromRoom(socket.id, true);
  });

  socket.on('start-game', () => {
    const player = players.get(socket.id);
    if (!player || !player.currentRoom) {
      socket.emit('error', 'You are not in a room');
      return;
    }

    const room = rooms.get(player.currentRoom);
    if (!room) return;

    if (room.players[0]?.socketId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }

    if (room.players.length < GAME_CONFIG.maxPlayersPerRoom) {
      socket.emit('error', 'Need 2 players to start');
      return;
    }

    startGame(io, room);
  });

  socket.on('puzzle-action', (payload: PuzzleActionPayload) => {
    if (socketRateExceeded(socket.id, 'puzzle-action')) {
      socket.emit('error', 'Too many puzzle actions. Slow down.');
      return;
    }

    const actionCheck = validatePuzzleAction(payload);
    if (!actionCheck.valid) {
      socket.emit('error', actionCheck.error!);
      return;
    }

    const player = players.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = rooms.get(player.currentRoom);
    if (!room || room.state !== 'playing') return;

    handlePuzzleAction(room, player, payload);
  });

  socket.on('advance-room', () => {
    const player = players.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = rooms.get(player.currentRoom);
    if (!room) return;

    advanceToNextRoom(io, room);
  });

  socket.on('chat-message', (message: string) => {
    if (socketRateExceeded(socket.id, 'message')) {
      socket.emit('error', 'Too many messages. Slow down.');
      return;
    }

    const msgCheck = validateChatMessage(message);
    if (!msgCheck.valid) {
      socket.emit('error', msgCheck.error!);
      return;
    }

    const player = players.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = rooms.get(player.currentRoom);
    if (!room) return;

    const chatMsg: ChatMessage = {
      sender: player.name,
      senderId: player.id,
      message: msgCheck.sanitized!,
      timestamp: Date.now(),
      type: 'chat',
    };

    // Track messages for scoring
    recordMessage(room.id, player.id);

    // Track chat history for reconnection replay
    addChatToHistory(room.id, chatMsg);

    io.to(room.id).emit('chat-message', chatMsg);
  });

  socket.on('typing', () => {
    const player = players.get(socket.id);
    if (!player || !player.currentRoom) return;

    const room = rooms.get(player.currentRoom);
    if (!room) return;

    socket.to(room.id).emit('partner-typing');
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    removePlayerFromRoom(socket.id, false);
    players.delete(socket.id);
  });

  socket.on('reconnect', (token: string) => {
    const info = validateReconnection(token);
    if (!info) {
      socket.emit('error', 'Reconnection failed: invalid or expired token');
      return;
    }

    const room = rooms.get(info.roomId);
    if (!room) {
      // Try to restore from saved session
      const session = loadSession(info.roomId);
      if (!session) {
        socket.emit('error', 'Reconnection failed: game session expired');
        clearDisconnectedPlayer(info.playerId);
        return;
      }

      // Restore room to memory — the player will get room-updated event
      // Note: puzzle instances won't be restored (players will need to interact
      // with puzzles through the standard puzzle-action flow, which handles missing instances)
      const restoredRoom = session.room;
      // Re-map the player entries with new socket IDs
      restoredRoom.players = [];
      rooms.set(restoredRoom.id, restoredRoom);
      socket.join(restoredRoom.id);

      // Restore scoring state from session
      restoreScoringState(restoredRoom.id, session.cumulativeScore);

      // The reconnecting player
      const reconnectedPlayer: Player = {
        id: info.playerId,
        name: info.playerName,
        socketId: socket.id,
        currentRoom: restoredRoom.id,
      };
      restoredRoom.players.push(reconnectedPlayer);
      players.set(socket.id, reconnectedPlayer);

      // Send full state back
      socket.emit('player-assigned', info.playerId);
      socket.emit('room-joined', restoredRoom, reconnectedPlayer);

      // Send current score state
      const restoredScore = getCumulativeScoreScoring(restoredRoom.id);
      if (restoredScore > 0) {
        socket.emit('score-update', {
          puzzleScore: { puzzleType: 'restored', roomIndex: 0, metrics: { timeElapsed: 0, hintsUsed: 0, wrongAttempts: 0, messagesExchanged: 0 }, basePoints: 0, deductions: 0, bonusPoints: 0, finalScore: 0 },
          cumulativeScore: restoredScore,
          relationshipTier: getRelationshipTier(restoredScore),
        });
      }

      // Replay chat history
      const history = getChatHistory(info.roomId);
      if (history.length > 0) {
        socket.emit('chat-history', history as ChatMessage[]);
      }

      clearDisconnectedPlayer(info.playerId);

      if (restoredRoom.players.length === 1) {
        // Still waiting for partner
        io.to(restoredRoom.id).emit('game-event', {
          type: 'player-reconnected',
          message: `${info.playerName} reconnected. Waiting for partner...`,
          timestamp: Date.now(),
        });
      }

      return;
    }

    // Room is still in memory — just reassign socket
    const reconnectedPlayer: Player = {
      id: info.playerId,
      name: info.playerName,
      socketId: socket.id,
      currentRoom: room.id,
    };

    // Check if player is already in the room (stale entry)
    const existingIdx = room.players.findIndex((p) => p.id === info.playerId);
    if (existingIdx !== -1) {
      room.players[existingIdx].socketId = socket.id;
    } else {
      room.players.push(reconnectedPlayer);
    }

    players.set(socket.id, reconnectedPlayer);
    socket.join(room.id);

    // Send full state back
    socket.emit('player-assigned', info.playerId);
    socket.emit('room-joined', room, reconnectedPlayer);

    // Send current score state
    const rejoinScore = getCumulativeScoreScoring(room.id);
    if (rejoinScore > 0) {
      socket.emit('score-update', {
        puzzleScore: { puzzleType: 'restored', roomIndex: 0, metrics: { timeElapsed: 0, hintsUsed: 0, wrongAttempts: 0, messagesExchanged: 0 }, basePoints: 0, deductions: 0, bonusPoints: 0, finalScore: 0 },
        cumulativeScore: rejoinScore,
        relationshipTier: getRelationshipTier(rejoinScore),
      });
    }

    // Replay recent chat history
    const history = getChatHistory(room.id);
    if (history.length > 0) {
      socket.emit('chat-history', history as ChatMessage[]);
    }

    // Notify partner
    io.to(room.id).emit('partner-reconnected', info.playerName);
    io.to(room.id).emit('game-event', {
      type: 'player-reconnected',
      message: `${info.playerName} reconnected!`,
      timestamp: Date.now(),
    });

    broadcastRoomUpdate(room.id);
    clearDisconnectedPlayer(info.playerId);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, players: players.size });
});

if (isProduction) {
  const clientHtml = join(resolveClientDist(), 'index.html');
  app.get('{*path}', (_req, res) => {
    res.sendFile(clientHtml);
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);

  // Cleanup stale sessions every 10 minutes
  setInterval(() => {
    const cleaned = cleanupExpiredSessions();
    cleanupStaleDisconnections();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired session(s)`);
    }
  }, 10 * 60 * 1000);
});

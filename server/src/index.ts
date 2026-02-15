import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const PORT = 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO event handlers
interface PlayerSocket extends Socket {
  playerId?: string;
  playerName?: string;
  roomCode?: string;
}

// Chat message interface
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  roomCode: string;
}

io.on('connection', (socket: PlayerSocket) => {
  console.log(`New client connected: ${socket.id}`);
  socket.playerId = socket.id;

  // Handle create-room event
  socket.on('create-room', (data: { playerName: string }, callback) => {
    try {
      const { playerName } = data;
      if (!playerName || typeof playerName !== 'string') {
        callback({ success: false, error: 'Player name is required' });
        return;
      }

      socket.playerName = playerName;
      const room = roomManager.createRoom(socket.playerId!, playerName);
      socket.join(room.code);

      console.log(`Room created: ${room.code} by player ${playerName}`);

      callback({
        success: true,
        room: {
          code: room.code,
          players: room.players,
          hostId: room.hostId
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Handle join-room event
  socket.on('join-room', (data: { roomCode: string; playerName: string }, callback) => {
    try {
      const { roomCode, playerName } = data;
      if (!roomCode || typeof roomCode !== 'string') {
        callback({ success: false, error: 'Room code is required' });
        return;
      }
      if (!playerName || typeof playerName !== 'string') {
        callback({ success: false, error: 'Player name is required' });
        return;
      }

      socket.playerName = playerName;
      const room = roomManager.joinRoom(roomCode, socket.playerId!, playerName);
      socket.join(room.code);

      // Notify other players in the room
      socket.to(room.code).emit('player-joined', {
        player: {
          id: socket.playerId,
          name: playerName,
          isHost: false
        }
      });

      console.log(`Player ${playerName} joined room ${room.code}`);

      callback({
        success: true,
        room: {
          code: room.code,
          players: room.players,
          hostId: room.hostId
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      const message = error instanceof Error ? error.message : 'Failed to join room';
      callback({ success: false, error: message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const room = roomManager.getPlayerRoom(socket.playerId!);
    if (room) {
      // Mark player as disconnected
      roomManager.setPlayerConnected(socket.playerId!, false);

      // Notify other players
      socket.to(room.code).emit('player-left', {
        playerId: socket.playerId,
        playerName: socket.playerName
      });

      // Don't remove player, allow for reconnection
      // roomManager.removePlayer(socket.playerId!);
    }
  });

  // Handle pause game event
  socket.on('pause-game', (data: { roomCode: string }, callback) => {
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Verify player is in this room
      const isPlayerInRoom = room.players.some(p => p.id === socket.playerId);
      if (!isPlayerInRoom) {
        callback({ success: false, error: 'Not authorized' });
        return;
      }

      const result = roomManager.pauseRoom(roomCode, socket.playerId!);

      if (result.success) {
        // Broadcast pause to all players in room
        io.to(roomCode).emit('game-paused', {
          pausedBy: socket.playerId,
          pausedByName: socket.playerName,
          pausedAt: new Date(),
          roomCode
        });

        console.log(`Game paused in room ${roomCode} by ${socket.playerName}`);
      }

      callback(result);
    } catch (error) {
      console.error('Error pausing game:', error);
      callback({ success: false, error: 'Failed to pause game' });
    }
  });

  // Handle resume game event
  socket.on('resume-game', (data: { roomCode: string }, callback) => {
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Verify player is in this room
      const isPlayerInRoom = room.players.some(p => p.id === socket.playerId);
      if (!isPlayerInRoom) {
        callback({ success: false, error: 'Not authorized' });
        return;
      }

      const result = roomManager.resumeRoom(roomCode);

      if (result.success) {
        // Broadcast resume to all players in room
        io.to(roomCode).emit('game-resumed', {
          resumedBy: socket.playerId,
          resumedByName: socket.playerName,
          pausedDuration: result.pausedDuration,
          roomCode
        });

        console.log(`Game resumed in room ${roomCode} by ${socket.playerName}`);
      }

      callback(result);
    } catch (error) {
      console.error('Error resuming game:', error);
      callback({ success: false, error: 'Failed to resume game' });
    }
  });

  // Handle get pause state event
  socket.on('get-pause-state', (data: { roomCode: string }, callback) => {
    try {
      const { roomCode } = data;
      const pauseState = roomManager.getPauseState(roomCode);

      if (!pauseState) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      callback({ success: true, pauseState });
    } catch (error) {
      console.error('Error getting pause state:', error);
      callback({ success: false, error: 'Failed to get pause state' });
    }
  });

  // Handle game action event - broadcast game actions to other player
  socket.on('game:action', (data: { roomCode: string; action: string; payload: any }) => {
    try {
      const { roomCode, action, payload } = data;

      if (!socket.playerId || !socket.playerName) {
        return;
      }

      // Verify player is in this room
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        return;
      }

      const isPlayerInRoom = room.players.some(p => p.id === socket.playerId);
      if (!isPlayerInRoom) {
        return;
      }

      console.log(`Game action in room ${roomCode} from ${socket.playerName}: ${action}`);

      // Broadcast to other players in the room (not sender)
      socket.to(roomCode).emit('game:action', {
        playerId: socket.playerId,
        playerName: socket.playerName,
        action,
        payload,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error handling game action:', error);
    }
  });

  // Handle game state sync - broadcast full state updates
  socket.on('game:sync', (data: { roomCode: string; state: any }) => {
    try {
      const { roomCode, state } = data;

      if (!socket.playerId) {
        return;
      }

      const room = roomManager.getRoom(roomCode);
      if (!room) {
        return;
      }

      // Broadcast to other players in the room (not sender)
      socket.to(roomCode).emit('game:sync', {
        playerId: socket.playerId,
        state,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error handling game sync:', error);
    }
  });

  // Handle start game event
  socket.on('start-game', (data: { roomCode: string }, callback) => {
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode);

      if (!room) {
        callback?.({ success: false, error: 'Room not found' });
        return;
      }

      // Only host can start the game
      if (room.hostId !== socket.playerId) {
        callback?.({ success: false, error: 'Only the host can start the game' });
        return;
      }

      // Check if there are 2 players
      if (room.players.length < 2) {
        callback?.({ success: false, error: 'Need 2 players to start' });
        return;
      }

      console.log(`Game starting in room ${roomCode}`);

      // Broadcast game start to all players in room
      io.to(roomCode).emit('game:start', {
        roomCode,
        players: room.players,
        timestamp: Date.now()
      });

      callback?.({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback?.({ success: false, error: 'Failed to start game' });
    }
  });

  // Handle send-message event (chat)
  socket.on('send-message', (data: { message: string; roomCode: string }) => {
    try {
      const { message, roomCode } = data;

      if (!message || typeof message !== 'string') {
        return; // Silently ignore invalid messages
      }

      if (!socket.playerName || !socket.playerId) {
        return; // Player not properly identified
      }

      // Verify player is in this room
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        return; // Room doesn't exist
      }

      const isPlayerInRoom = room.players.some(p => p.id === socket.playerId);
      if (!isPlayerInRoom) {
        return; // Player not in this room
      }

      // Create chat message
      const chatMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: socket.playerId,
        senderName: socket.playerName,
        message: message.trim(),
        timestamp: new Date(),
        roomCode: roomCode
      };

      console.log(`Chat message in room ${roomCode} from ${socket.playerName}: ${message}`);

      // Broadcast to all players in the room (including sender)
      io.to(roomCode).emit('receive-message', chatMessage);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io, roomManager };

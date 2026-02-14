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
      // Notify other players
      socket.to(room.code).emit('player-left', {
        playerId: socket.playerId,
        playerName: socket.playerName
      });

      roomManager.removePlayer(socket.playerId!);
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

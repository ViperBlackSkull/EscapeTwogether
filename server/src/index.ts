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
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io, roomManager };

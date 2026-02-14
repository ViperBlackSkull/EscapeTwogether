export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  createdAt: Date;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map();

  // Characters allowed in room codes (excluding 0/O, 1/I/l to avoid confusion)
  private static readonly ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /**
   * Generate a unique 4-character room code
   */
  generateRoomCode(): string {
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * RoomManager.ALLOWED_CHARS.length);
        code += RoomManager.ALLOWED_CHARS[randomIndex];
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < maxAttempts);

    if (this.rooms.has(code)) {
      throw new Error('Unable to generate unique room code');
    }

    return code;
  }

  /**
   * Create a new room with the host player
   */
  createRoom(hostPlayerId: string, hostPlayerName: string): Room {
    const code = this.generateRoomCode();
    const room: Room = {
      code,
      hostId: hostPlayerId,
      players: [{
        id: hostPlayerId,
        name: hostPlayerName,
        isHost: true
      }],
      createdAt: new Date()
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostPlayerId, code);

    return room;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomCode: string, playerId: string, playerName: string): Room {
    const upperCode = roomCode.toUpperCase();
    const room = this.rooms.get(upperCode);

    if (!room) {
      throw new Error('Room not found');
    }

    // Check if player is already in this room
    if (room.players.some(p => p.id === playerId)) {
      return room;
    }

    // Check if player is in another room
    const currentRoom = this.playerRooms.get(playerId);
    if (currentRoom && currentRoom !== upperCode) {
      throw new Error('Player is already in another room');
    }

    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false
    });

    this.playerRooms.set(playerId, upperCode);

    return room;
  }

  /**
   * Get a room by code
   */
  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  /**
   * Get the room a player is in
   */
  getPlayerRoom(playerId: string): Room | undefined {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode);
  }

  /**
   * Remove a player from their room
   */
  removePlayer(playerId: string): void {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    } else if (room.hostId === playerId && room.players.length > 0) {
      // Transfer host to next player
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }
  }

  /**
   * Get all rooms (for debugging/admin purposes)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

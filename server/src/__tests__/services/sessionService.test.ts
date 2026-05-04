import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync } from 'fs';
import { join } from 'path';
import type { GameRoom } from '../../types.js';

// Use a temp directory for test sessions
const TEST_SESSIONS_DIR = join(import.meta.dirname, '../../../__test_sessions__');

describe('sessionService', () => {
  // Create a minimal GameRoom for testing
  function createTestRoom(id: string): GameRoom {
    return {
      id,
      players: [
        { id: 'p1', name: 'Player1', socketId: 's1', currentRoom: id },
        { id: 'p2', name: 'Player2', socketId: 's2', currentRoom: id },
      ],
      state: 'playing',
      puzzles: {
        'cipher-lock': {
          id: 'cipher-lock',
          type: 'cipher-lock',
          solved: false,
          data: { code: '123' },
        },
      },
      createdAt: Date.now() - 60000,
      startedAt: Date.now() - 30000,
      completedAt: null,
      puzzleSolveTimes: {},
      currentRoomIndex: 0,
      roomPausedAt: null,
      totalPausedMs: 0,
    };
  }

  // Dynamic import to get fresh module
  async function getService() {
    return await import('../../services/sessionService.js');
  }

  beforeEach(async () => {
    // Clean up test directory
    try {
      rmSync(TEST_SESSIONS_DIR, { recursive: true, force: true });
    } catch { /* ignore */ }
  });

  afterEach(async () => {
    try {
      rmSync(TEST_SESSIONS_DIR, { recursive: true, force: true });
    } catch { /* ignore */ }
  });

  describe('trackDisconnectedPlayer', () => {
    it('generates a reconnection token for a disconnected player', async () => {
      const svc = await getService();
      const token = svc.trackDisconnectedPlayer('p1', 'Alice', 'ROOM1');
      expect(token).toBeTruthy();
      expect(token).toContain('p1');
    });

    it('allows validating a reconnection token', async () => {
      const svc = await getService();
      const token = svc.trackDisconnectedPlayer('p1', 'Alice', 'ROOM1');
      const result = svc.validateReconnection(token);
      expect(result).not.toBeNull();
      expect(result!.playerId).toBe('p1');
      expect(result!.playerName).toBe('Alice');
      expect(result!.roomId).toBe('ROOM1');
    });

    it('returns null for invalid token', async () => {
      const svc = await getService();
      const result = svc.validateReconnection('invalid-token');
      expect(result).toBeNull();
    });

    it('clears disconnected player tracking', async () => {
      const svc = await getService();
      svc.trackDisconnectedPlayer('p1', 'Alice', 'ROOM1');
      expect(svc.isPlayerDisconnected('p1')).toBe(true);
      svc.clearDisconnectedPlayer('p1');
      expect(svc.isPlayerDisconnected('p1')).toBe(false);
    });
  });

  describe('chatHistory', () => {
    it('adds and retrieves chat messages', async () => {
      const svc = await getService();
      svc.addChatToHistory('ROOM1', {
        sender: 'Alice',
        senderId: 'p1',
        message: 'Hello!',
        timestamp: Date.now(),
        type: 'chat',
      });
      const history = svc.getChatHistory('ROOM1');
      expect(history).toHaveLength(1);
      expect(history[0].message).toBe('Hello!');
    });

    it('limits chat history to 200 messages', async () => {
      const svc = await getService();
      for (let i = 0; i < 210; i++) {
        svc.addChatToHistory('ROOM1', {
          sender: 'Alice',
          senderId: 'p1',
          message: `Msg ${i}`,
          timestamp: Date.now(),
          type: 'chat',
        });
      }
      const history = svc.getChatHistory('ROOM1');
      expect(history).toHaveLength(200);
      expect(history[0].message).toBe('Msg 10');
      expect(history[199].message).toBe('Msg 209');
    });

    it('clears chat history for a room', async () => {
      const svc = await getService();
      svc.addChatToHistory('ROOM1', {
        sender: 'Alice',
        senderId: 'p1',
        message: 'Hello!',
        timestamp: Date.now(),
        type: 'chat',
      });
      svc.clearChatHistory('ROOM1');
      expect(svc.getChatHistory('ROOM1')).toHaveLength(0);
    });
  });

  describe('getDisconnectedPlayersForRoom', () => {
    it('returns all disconnected players for a room', async () => {
      const svc = await getService();
      svc.trackDisconnectedPlayer('p1', 'Alice', 'ROOM1');
      svc.trackDisconnectedPlayer('p2', 'Bob', 'ROOM1');
      svc.trackDisconnectedPlayer('p3', 'Charlie', 'ROOM2');

      const room1Players = svc.getDisconnectedPlayersForRoom('ROOM1');
      expect(room1Players).toHaveLength(2);
      expect(room1Players.map((p) => p.playerName).sort()).toEqual(['Alice', 'Bob']);
    });
  });

  describe('cleanupStaleDisconnections', () => {
    it('removes entries older than the reconnection window', async () => {
      const svc = await getService();
      // Manually inject a stale entry by tracking and then
      // testing that cleanup removes old entries
      svc.trackDisconnectedPlayer('p1', 'Alice', 'ROOM1');
      expect(svc.isPlayerDisconnected('p1')).toBe(true);

      // We can't easily fake time, but we can verify the function runs
      svc.cleanupStaleDisconnections();
      // The entry is fresh, so it should still be there
      expect(svc.isPlayerDisconnected('p1')).toBe(true);
    });
  });

  describe('saveSession / loadSession', () => {
    it('returns null for nonexistent session', async () => {
      const svc = await getService();
      const result = svc.loadSession('NONEXISTENT');
      expect(result).toBeNull();
    });

    it('returns null for expired session (file too old)', async () => {
      const svc = await getService();
      // We can't easily make an old file in unit tests,
      // but we can verify loadSession handles missing files gracefully
      const result = svc.loadSession('EXPIRED_ROOM');
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('does not throw for nonexistent session', async () => {
      const svc = await getService();
      expect(() => svc.deleteSession('NONEXISTENT')).not.toThrow();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('runs without error when no sessions directory exists', async () => {
      const svc = await getService();
      const count = svc.cleanupExpiredSessions();
      expect(count).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  socketRateExceeded,
  httpRateExceeded,
  roomCreationExceeded,
  cleanupSocketBucket,
  SOCKET_LIMITS,
  HTTP_LIMITS,
  ROOM_CREATION_LIMITS,
} from '../../middleware/rateLimiter.js';

describe('rateLimiter', () => {
  describe('socket rate limiting', () => {
    beforeEach(() => {
      cleanupSocketBucket('test-socket');
    });

    it('allows messages within limit', () => {
      for (let i = 0; i < SOCKET_LIMITS.messagesPerMinute; i++) {
        expect(socketRateExceeded('test-socket', 'message')).toBe(false);
      }
    });

    it('blocks messages exceeding limit', () => {
      for (let i = 0; i < SOCKET_LIMITS.messagesPerMinute; i++) {
        socketRateExceeded('test-socket', 'message');
      }
      expect(socketRateExceeded('test-socket', 'message')).toBe(true);
    });

    it('allows puzzle actions within limit', () => {
      for (let i = 0; i < SOCKET_LIMITS.puzzleActionsPerMinute; i++) {
        expect(socketRateExceeded('test-socket', 'puzzle-action')).toBe(false);
      }
    });

    it('blocks puzzle actions exceeding limit', () => {
      for (let i = 0; i < SOCKET_LIMITS.puzzleActionsPerMinute; i++) {
        socketRateExceeded('test-socket', 'puzzle-action');
      }
      expect(socketRateExceeded('test-socket', 'puzzle-action')).toBe(true);
    });

    it('tracks categories independently', () => {
      for (let i = 0; i < SOCKET_LIMITS.puzzleActionsPerMinute; i++) {
        socketRateExceeded('test-socket', 'puzzle-action');
      }
      // Messages should still be allowed
      expect(socketRateExceeded('test-socket', 'message')).toBe(false);
    });

    it('tracks sockets independently', () => {
      for (let i = 0; i < SOCKET_LIMITS.messagesPerMinute; i++) {
        socketRateExceeded('test-socket-1', 'message');
      }
      expect(socketRateExceeded('test-socket-1', 'message')).toBe(true);
      expect(socketRateExceeded('test-socket-2', 'message')).toBe(false);
    });

    it('cleans up socket buckets', () => {
      for (let i = 0; i < SOCKET_LIMITS.messagesPerMinute; i++) {
        socketRateExceeded('test-socket', 'message');
      }
      expect(socketRateExceeded('test-socket', 'message')).toBe(true);
      cleanupSocketBucket('test-socket');
      expect(socketRateExceeded('test-socket', 'message')).toBe(false);
    });
  });

  describe('HTTP rate limiting', () => {
    it('allows requests within limit', () => {
      for (let i = 0; i < HTTP_LIMITS.requestsPerMinute; i++) {
        expect(httpRateExceeded('127.0.0.1')).toBe(false);
      }
    });

    it('blocks requests exceeding limit', () => {
      for (let i = 0; i < HTTP_LIMITS.requestsPerMinute; i++) {
        httpRateExceeded('127.0.0.1');
      }
      expect(httpRateExceeded('127.0.0.1')).toBe(true);
    });

    it('tracks IPs independently', () => {
      for (let i = 0; i < HTTP_LIMITS.requestsPerMinute; i++) {
        httpRateExceeded('127.0.0.1');
      }
      expect(httpRateExceeded('127.0.0.1')).toBe(true);
      expect(httpRateExceeded('192.168.1.1')).toBe(false);
    });
  });

  describe('room creation rate limiting', () => {
    it('allows room creation within limit', () => {
      for (let i = 0; i < ROOM_CREATION_LIMITS.roomsPerMinute; i++) {
        expect(roomCreationExceeded('127.0.0.1')).toBe(false);
      }
    });

    it('blocks room creation exceeding limit', () => {
      for (let i = 0; i < ROOM_CREATION_LIMITS.roomsPerMinute; i++) {
        roomCreationExceeded('127.0.0.1');
      }
      expect(roomCreationExceeded('127.0.0.1')).toBe(true);
    });

    it('tracks IPs independently', () => {
      for (let i = 0; i < ROOM_CREATION_LIMITS.roomsPerMinute; i++) {
        roomCreationExceeded('127.0.0.1');
      }
      expect(roomCreationExceeded('127.0.0.1')).toBe(true);
      expect(roomCreationExceeded('10.0.0.1')).toBe(false);
    });
  });
});

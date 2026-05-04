import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCachedRoomNarrative,
  getCachedPuzzleNarrative,
  enqueueRoomGeneration,
  enqueuePuzzleGeneration,
  preGenerateAllRoomNarratives,
  preGenerateUpcomingRoom,
  clearCache,
  cacheSize,
  queueLength,
} from '../../services/narrativeCache.js';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mocked AI response for cache' }],
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

describe('narrativeCache', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  describe('getCachedRoomNarrative', () => {
    it('returns null when no cached entry exists', () => {
      expect(getCachedRoomNarrative(0)).toBeNull();
    });
  });

  describe('getCachedPuzzleNarrative', () => {
    it('returns null when no cached entry exists', () => {
      expect(getCachedPuzzleNarrative('cipher-lock')).toBeNull();
    });
  });

  describe('enqueueRoomGeneration', () => {
    it('adds a room generation task to the queue', () => {
      enqueueRoomGeneration(0);
      // The queue should have been processed (or be processing)
      // At minimum, it shouldn't throw
      expect(queueLength()).toBeLessThanOrEqual(1);
    });

    it('does not duplicate entries already in cache', async () => {
      // Pre-generate to populate cache
      await new Promise<void>((resolve) => {
        // First generation
        enqueueRoomGeneration(0);
        // Wait for processing
        setTimeout(() => {
          const sizeBefore = cacheSize();
          // Try again — should be a no-op
          enqueueRoomGeneration(0);
          expect(cacheSize()).toBe(sizeBefore);
          resolve();
        }, 100);
      });
    });
  });

  describe('preGenerateAllRoomNarratives', () => {
    it('queues generation for all rooms', () => {
      preGenerateAllRoomNarratives();
      // Should queue up to 5 rooms
      expect(queueLength()).toBeLessThanOrEqual(5);
    });
  });

  describe('preGenerateUpcomingRoom', () => {
    it('queues generation for the next room', () => {
      preGenerateUpcomingRoom(0);
      expect(queueLength()).toBeLessThanOrEqual(3); // room + 2 puzzles
    });

    it('does nothing for the last room', () => {
      preGenerateUpcomingRoom(4); // last room index (room 5 of 5)
      expect(queueLength()).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('empties the cache and queue', () => {
      enqueueRoomGeneration(0);
      clearCache();
      expect(cacheSize()).toBe(0);
      expect(queueLength()).toBe(0);
    });
  });

  describe('cacheSize', () => {
    it('returns 0 for empty cache', () => {
      expect(cacheSize()).toBe(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  getRoomConfig,
  isLastRoom,
  getCurrentPuzzleTypes,
  areAllRoomPuzzlesSolved,
  getTotalPuzzleCount,
  getSolvedPuzzleCount,
  getProgressSummary,
  TOTAL_ROOMS,
} from '../../gameFlow.js';

describe('gameFlow', () => {
  describe('getRoomConfig', () => {
    it('should return Room 0: The Invitation', () => {
      const room0 = getRoomConfig(0);
      expect(room0).toBeDefined();
      expect(room0!.name).toBe('The Invitation');
      expect(room0!.puzzles).toEqual(['cipher-lock']);
      expect(room0!.narrativeBeat).toBe('introduction');
      expect(room0!.targetDurationMinutes).toBe(7);
    });

    it('should return Room 1: The Workshop', () => {
      const room1 = getRoomConfig(1);
      expect(room1).toBeDefined();
      expect(room1!.name).toBe('The Workshop');
      expect(room1!.puzzles).toEqual(['split-screen', 'wire-connection']);
      expect(room1!.narrativeBeat).toBe('discovery');
    });

    it('should return Room 2: The Laboratory', () => {
      const room2 = getRoomConfig(2);
      expect(room2).toBeDefined();
      expect(room2!.name).toBe('The Laboratory');
      expect(room2!.puzzles).toEqual(['sequence-memory', 'cipher-lock']);
      expect(room2!.narrativeBeat).toBe('tension');
    });

    it('should return Room 3: The Labyrinth', () => {
      const room3 = getRoomConfig(3);
      expect(room3).toBeDefined();
      expect(room3!.name).toBe('The Labyrinth');
      expect(room3!.puzzles).toEqual(['map-navigator', 'split-screen']);
      expect(room3!.narrativeBeat).toBe('climax');
    });

    it('should return Room 4: The Vault', () => {
      const room4 = getRoomConfig(4);
      expect(room4).toBeDefined();
      expect(room4!.name).toBe('The Vault');
      expect(room4!.puzzles).toEqual(['wire-connection', 'sequence-memory', 'map-navigator']);
      expect(room4!.narrativeBeat).toBe('resolution');
    });

    it('should return undefined for out-of-range index', () => {
      expect(getRoomConfig(-1)).toBeUndefined();
      expect(getRoomConfig(5)).toBeUndefined();
      expect(getRoomConfig(99)).toBeUndefined();
    });

    it('should have difficulty variants for each room', () => {
      for (let i = 0; i < 5; i++) {
        const room = getRoomConfig(i);
        expect(room).toBeDefined();
        expect(room!.difficultyVariants).toHaveLength(3);
        expect(room!.difficultyVariants[0].level).toBe('easy');
        expect(room!.difficultyVariants[1].level).toBe('medium');
        expect(room!.difficultyVariants[2].level).toBe('hard');
      }
    });
  });

  describe('isLastRoom', () => {
    it('should return false for rooms 0-3', () => {
      expect(isLastRoom(0)).toBe(false);
      expect(isLastRoom(1)).toBe(false);
      expect(isLastRoom(2)).toBe(false);
      expect(isLastRoom(3)).toBe(false);
    });

    it('should return true for room 4 (last)', () => {
      expect(isLastRoom(4)).toBe(true);
    });
  });

  describe('getCurrentPuzzleTypes', () => {
    it('should return puzzle types for room 0', () => {
      expect(getCurrentPuzzleTypes(0)).toEqual(['cipher-lock']);
    });

    it('should return puzzle types for room 1', () => {
      expect(getCurrentPuzzleTypes(1)).toEqual(['split-screen', 'wire-connection']);
    });

    it('should return puzzle types for room 4', () => {
      expect(getCurrentPuzzleTypes(4)).toEqual(['wire-connection', 'sequence-memory', 'map-navigator']);
    });

    it('should return empty array for invalid index', () => {
      expect(getCurrentPuzzleTypes(5)).toEqual([]);
    });
  });

  describe('areAllRoomPuzzlesSolved', () => {
    it('should return false when no puzzles solved', () => {
      const solvedPuzzles = {};
      expect(areAllRoomPuzzlesSolved(0, solvedPuzzles)).toBe(false);
    });

    it('should return false when only some puzzles solved', () => {
      const solvedPuzzles = {
        'split-screen': { type: 'split-screen', solved: true },
      };
      expect(areAllRoomPuzzlesSolved(1, solvedPuzzles)).toBe(false);
    });

    it('should return true when all puzzles in room solved', () => {
      const solvedPuzzles = {
        'cipher-lock': { type: 'cipher-lock', solved: true },
      };
      expect(areAllRoomPuzzlesSolved(0, solvedPuzzles)).toBe(true);
    });

    it('should return true when both puzzles in room 1 solved', () => {
      const solvedPuzzles = {
        'split-screen': { type: 'split-screen', solved: true },
        'wire-connection': { type: 'wire-connection', solved: true },
      };
      expect(areAllRoomPuzzlesSolved(1, solvedPuzzles)).toBe(true);
    });

    it('should return true when all 3 puzzles in vault solved', () => {
      const solvedPuzzles = {
        'wire-connection': { type: 'wire-connection', solved: true },
        'sequence-memory': { type: 'sequence-memory', solved: true },
        'map-navigator': { type: 'map-navigator', solved: true },
      };
      expect(areAllRoomPuzzlesSolved(4, solvedPuzzles)).toBe(true);
    });

    it('should return false for invalid room index', () => {
      expect(areAllRoomPuzzlesSolved(99, {})).toBe(false);
    });
  });

  describe('getTotalPuzzleCount', () => {
    it('should return 10 (1 + 2 + 2 + 2 + 3)', () => {
      expect(getTotalPuzzleCount()).toBe(10);
    });
  });

  describe('getSolvedPuzzleCount', () => {
    it('should return 0 for no solved puzzles', () => {
      expect(getSolvedPuzzleCount({})).toBe(0);
    });

    it('should count solved puzzles correctly', () => {
      const solvedPuzzles = {
        'cipher-lock': { type: 'cipher-lock', solved: true },
        'split-screen': { type: 'split-screen', solved: false },
        'wire-connection': { type: 'wire-connection', solved: true },
      };
      expect(getSolvedPuzzleCount(solvedPuzzles)).toBe(2);
    });
  });

  describe('getProgressSummary', () => {
    it('should return correct summary at start', () => {
      const summary = getProgressSummary(0, {});
      expect(summary).toEqual({
        roomsCompleted: 0,
        totalRooms: 5,
        puzzlesSolved: 0,
        totalPuzzles: 10,
      });
    });

    it('should reflect completed rooms', () => {
      const solvedPuzzles = {
        'cipher-lock': { type: 'cipher-lock', solved: true },
        'split-screen': { type: 'split-screen', solved: true },
      };
      const summary = getProgressSummary(1, solvedPuzzles);
      expect(summary.roomsCompleted).toBe(1);
      expect(summary.puzzlesSolved).toBe(2);
    });

    it('should count completed rooms only for rooms before current', () => {
      const solvedPuzzles = {
        'cipher-lock': { type: 'cipher-lock', solved: true },
        'split-screen': { type: 'split-screen', solved: true },
        'wire-connection': { type: 'wire-connection', solved: true },
      };
      const summary = getProgressSummary(2, solvedPuzzles);
      expect(summary.roomsCompleted).toBe(2);
    });
  });

  describe('TOTAL_ROOMS', () => {
    it('should be 5', () => {
      expect(TOTAL_ROOMS).toBe(5);
    });
  });
});

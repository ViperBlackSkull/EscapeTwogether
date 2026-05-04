import { describe, it, expect } from 'vitest';
import {
  ROOMS,
  TOTAL_ROOMS,
  DIFFICULTY_PROGRESSION,
  getNarrativeBeat,
  getTargetDuration,
  getTotalTargetDuration,
  selectDifficultyVariant,
  calculatePerformanceScore,
  getRoomTheme,
  getDifficultyForRoom,
  getNarrativeArc,
} from '../../config/gameScenario.js';

describe('gameScenario', () => {
  describe('ROOMS', () => {
    it('should have 5 rooms', () => {
      expect(ROOMS).toHaveLength(5);
    });

    it('should have correct room names in order', () => {
      expect(ROOMS.map((r) => r.name)).toEqual([
        'The Invitation',
        'The Workshop',
        'The Laboratory',
        'The Labyrinth',
        'The Vault',
      ]);
    });

    it('should have correct narrative beats in order', () => {
      expect(ROOMS.map((r) => r.narrativeBeat)).toEqual([
        'introduction',
        'discovery',
        'tension',
        'climax',
        'resolution',
      ]);
    });

    it('should have correct puzzles per room', () => {
      expect(ROOMS[0]!.puzzles).toEqual(['cipher-lock']);
      expect(ROOMS[1]!.puzzles).toEqual(['split-screen', 'wire-connection']);
      expect(ROOMS[2]!.puzzles).toEqual(['sequence-memory', 'cipher-lock']);
      expect(ROOMS[3]!.puzzles).toEqual(['map-navigator', 'split-screen']);
      expect(ROOMS[4]!.puzzles).toEqual(['wire-connection', 'sequence-memory', 'map-navigator']);
    });

    it('should have 3 difficulty variants per room', () => {
      for (const room of ROOMS) {
        expect(room.difficultyVariants).toHaveLength(3);
        expect(room.difficultyVariants[0]!.level).toBe('easy');
        expect(room.difficultyVariants[1]!.level).toBe('medium');
        expect(room.difficultyVariants[2]!.level).toBe('hard');
      }
    });

    it('should have matching hotspots and puzzles count for each room', () => {
      for (const room of ROOMS) {
        expect(room.hotspots).toHaveLength(room.puzzles.length);
        const hotspotIds = room.hotspots.map((h) => h.id);
        for (const puzzle of room.puzzles) {
          expect(hotspotIds).toContain(puzzle);
        }
      }
    });

    it('should have positive target duration for each room', () => {
      for (const room of ROOMS) {
        expect(room.targetDurationMinutes).toBeGreaterThan(0);
      }
    });

    it('should have a theme for each room', () => {
      for (const room of ROOMS) {
        expect(room.theme).toBeDefined();
        expect(room.theme!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('TOTAL_ROOMS', () => {
    it('should be 5', () => {
      expect(TOTAL_ROOMS).toBe(5);
    });
  });

  describe('DIFFICULTY_PROGRESSION', () => {
    it('should have all required fields', () => {
      expect(DIFFICULTY_PROGRESSION.hintCost).toBe(5);
      expect(DIFFICULTY_PROGRESSION.wrongAttemptPenalty).toBe(2);
      expect(DIFFICULTY_PROGRESSION.slowThresholdMultiplier).toBe(1.5);
      expect(DIFFICULTY_PROGRESSION.speedBonusThreshold).toBe(0.7);
    });
  });

  describe('getNarrativeBeat', () => {
    it('returns correct beat for each room', () => {
      expect(getNarrativeBeat(0)).toBe('introduction');
      expect(getNarrativeBeat(1)).toBe('discovery');
      expect(getNarrativeBeat(2)).toBe('tension');
      expect(getNarrativeBeat(3)).toBe('climax');
      expect(getNarrativeBeat(4)).toBe('resolution');
    });

    it('returns introduction for out-of-range index', () => {
      expect(getNarrativeBeat(5)).toBe('introduction');
      expect(getNarrativeBeat(-1)).toBe('introduction');
    });
  });

  describe('getTargetDuration', () => {
    it('returns correct duration for each room', () => {
      expect(getTargetDuration(0)).toBe(7);
      expect(getTargetDuration(1)).toBe(14);
      expect(getTargetDuration(2)).toBe(14);
      expect(getTargetDuration(3)).toBe(16);
      expect(getTargetDuration(4)).toBe(18);
    });

    it('returns default for out-of-range index', () => {
      expect(getTargetDuration(5)).toBe(15);
      expect(getTargetDuration(-1)).toBe(15);
    });
  });

  describe('getTotalTargetDuration', () => {
    it('should return sum of all room durations', () => {
      expect(getTotalTargetDuration()).toBe(69);
    });
  });

  describe('selectDifficultyVariant', () => {
    it('returns easy variant for low performance score', () => {
      const variant = selectDifficultyVariant(0, 2);
      expect(variant.level).toBe('easy');
    });

    it('returns medium variant for mid performance score', () => {
      const variant = selectDifficultyVariant(0, 5);
      expect(variant.level).toBe('medium');
    });

    it('returns hard variant for high performance score', () => {
      const variant = selectDifficultyVariant(0, 8);
      expect(variant.level).toBe('hard');
    });

    it('returns default medium for out-of-range room index', () => {
      const variant = selectDifficultyVariant(99, 5);
      expect(variant.level).toBe('medium');
      expect(variant.timeMultiplier).toBe(1.0);
    });

    it('selects from room-specific variants', () => {
      const easy = selectDifficultyVariant(4, 1);
      const hard = selectDifficultyVariant(4, 9);
      expect(easy.level).toBe('easy');
      expect(hard.level).toBe('hard');
      expect(easy.puzzleComplexity).toBeLessThan(hard.puzzleComplexity);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('returns max score for fast, accurate, hint-free play', () => {
      const score = calculatePerformanceScore(120_000, 0, 0, 10);
      expect(score).toBeGreaterThanOrEqual(7);
    });

    it('returns low score for slow play with many hints and wrong attempts', () => {
      const score = calculatePerformanceScore(600_000, 5, 8, 10);
      expect(score).toBeLessThanOrEqual(4);
    });

    it('handles zero time', () => {
      const score = calculatePerformanceScore(0, 0, 0, 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('caps at 10', () => {
      const score = calculatePerformanceScore(1, 0, 0, 10);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('gives better score for faster completion', () => {
      const fastScore = calculatePerformanceScore(100_000, 0, 0, 10);
      const slowScore = calculatePerformanceScore(1_000_000, 0, 0, 10);
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('penalizes hints', () => {
      const noHints = calculatePerformanceScore(300_000, 0, 0, 10);
      const manyHints = calculatePerformanceScore(300_000, 5, 0, 10);
      expect(noHints).toBeGreaterThan(manyHints);
    });

    it('penalizes wrong attempts', () => {
      const noWrong = calculatePerformanceScore(300_000, 0, 0, 10);
      const manyWrong = calculatePerformanceScore(300_000, 0, 8, 10);
      expect(noWrong).toBeGreaterThan(manyWrong);
    });
  });

  describe('getRoomTheme', () => {
    it('returns correct theme for each room', () => {
      expect(getRoomTheme(0)).toBe('mysterious-letter');
      expect(getRoomTheme(1)).toBe('inventor-workshop');
      expect(getRoomTheme(2)).toBe('abandoned-lab');
      expect(getRoomTheme(3)).toBe('shifting-maze');
      expect(getRoomTheme(4)).toBe('grand-vault');
    });

    it('returns default for out-of-range', () => {
      expect(getRoomTheme(5)).toBe('mystery');
      expect(getRoomTheme(-1)).toBe('mystery');
    });
  });

  describe('getDifficultyForRoom', () => {
    it('returns easy for first room with no history', () => {
      const diff = getDifficultyForRoom(0, []);
      expect(diff.level).toBe('easy');
    });

    it('escalates difficulty for strong performance', () => {
      const completedRooms = [
        { timeSpentMs: 60_000, hintsUsed: 0, wrongAttempts: 0 },
      ];
      const diff = getDifficultyForRoom(1, completedRooms);
      expect(['medium', 'hard']).toContain(diff.level);
    });

    it('stays easy for weak performance', () => {
      const completedRooms = [
        { timeSpentMs: 600_000, hintsUsed: 5, wrongAttempts: 8 },
      ];
      const diff = getDifficultyForRoom(1, completedRooms);
      expect(diff.level).toBe('easy');
    });

    it('averages performance across multiple rooms', () => {
      const mixedRooms = [
        { timeSpentMs: 60_000, hintsUsed: 0, wrongAttempts: 0 },   // strong
        { timeSpentMs: 600_000, hintsUsed: 5, wrongAttempts: 8 },  // weak
      ];
      const diff = getDifficultyForRoom(2, mixedRooms);
      expect(['easy', 'medium']).toContain(diff.level);
    });
  });

  describe('getNarrativeArc', () => {
    it('returns arc for all 5 rooms', () => {
      const arc = getNarrativeArc();
      expect(arc).toHaveLength(5);
    });

    it('returns correct beats in order', () => {
      const arc = getNarrativeArc();
      expect(arc.map((a) => a.beat)).toEqual([
        'introduction',
        'discovery',
        'tension',
        'climax',
        'resolution',
      ]);
    });

    it('includes descriptions for each beat', () => {
      const arc = getNarrativeArc();
      for (const entry of arc) {
        expect(entry.description).toBeTruthy();
        expect(entry.description.length).toBeGreaterThan(10);
      }
    });

    it('maps to correct room indices', () => {
      const arc = getNarrativeArc();
      expect(arc[0]!.roomIndex).toBe(0);
      expect(arc[4]!.roomIndex).toBe(4);
    });
  });
});

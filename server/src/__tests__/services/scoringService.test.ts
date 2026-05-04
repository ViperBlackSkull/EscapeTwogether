import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startGameTracking,
  startRoomTracking,
  startPuzzleTracking,
  recordHintUsed,
  recordWrongAttempt,
  recordMessage,
  scorePuzzleCompletion,
  calculateFinalScore,
  calculateCommunicationStats,
  calculateCooperationScore,
  calculatePuzzleScore,
  getCumulativeScore,
  cleanupGame,
} from '../../services/scoringService.js';

// Mock gameScenario to avoid transitive import issues
vi.mock('../../config/gameScenario.js', () => ({
  DIFFICULTY_PROGRESSION: {
    hintCost: 5,
    wrongAttemptPenalty: 2,
    slowThresholdMultiplier: 1.5,
    speedBonusThreshold: 0.7,
  },
  ROOMS: [
    { name: 'The Invitation', targetDurationMinutes: 10 },
    { name: 'The Workshop', targetDurationMinutes: 14 },
    { name: 'The Laboratory', targetDurationMinutes: 14 },
    { name: 'The Labyrinth', targetDurationMinutes: 14 },
    { name: 'The Vault', targetDurationMinutes: 18 },
  ],
  getTargetDuration: (roomIndex: number) => [10, 14, 14, 14, 18][roomIndex] ?? 15,
}));

describe('scoringService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanupGame('test-room');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculatePuzzleScore', () => {
    it('awards base points with no deductions or bonuses', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 10 * 60 * 1000,
        hintsUsed: 0,
        wrongAttempts: 0,
        messagesExchanged: 5,
      }, 10);

      expect(score.basePoints).toBe(100);
      expect(score.deductions).toBe(0);
      expect(score.bonusPoints).toBe(0);
      expect(score.finalScore).toBe(100);
    });

    it('deducts for hints used', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 10 * 60 * 1000,
        hintsUsed: 2,
        wrongAttempts: 0,
        messagesExchanged: 5,
      }, 10);

      expect(score.deductions).toBe(10);
      expect(score.finalScore).toBe(90);
    });

    it('deducts for wrong attempts', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 10 * 60 * 1000,
        hintsUsed: 0,
        wrongAttempts: 3,
        messagesExchanged: 5,
      }, 10);

      expect(score.deductions).toBe(6);
      expect(score.finalScore).toBe(94);
    });

    it('awards speed bonus for fast completion', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 5 * 60 * 1000,
        hintsUsed: 0,
        wrongAttempts: 0,
        messagesExchanged: 5,
      }, 10);

      expect(score.bonusPoints).toBe(30);
      expect(score.finalScore).toBe(130);
    });

    it('awards partial speed bonus', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 8 * 60 * 1000,
        hintsUsed: 0,
        wrongAttempts: 0,
        messagesExchanged: 5,
      }, 10);

      expect(score.bonusPoints).toBe(15);
      expect(score.finalScore).toBe(115);
    });

    it('clamps score to minimum 0', () => {
      const score = calculatePuzzleScore('cipher-lock', 0, {
        timeElapsed: 10 * 60 * 1000,
        hintsUsed: 25,
        wrongAttempts: 30,
        messagesExchanged: 0,
      }, 10);

      expect(score.finalScore).toBe(0);
    });
  });

  describe('game lifecycle', () => {
    it('tracks puzzle scoring through full game flow', () => {
      startGameTracking('test-room');

      const scoreEvent = scorePuzzleCompletion('test-room', 'cipher-lock', 0);

      expect(scoreEvent.puzzleScore.puzzleType).toBe('cipher-lock');
      expect(scoreEvent.puzzleScore.roomIndex).toBe(0);
      expect(scoreEvent.cumulativeScore).toBe(scoreEvent.puzzleScore.finalScore);
      expect(scoreEvent.relationshipTier).toBe('New Acquaintances');
      expect(getCumulativeScore('test-room')).toBe(scoreEvent.puzzleScore.finalScore);
    });

    it('accumulates scores across multiple puzzles', () => {
      startGameTracking('test-room');

      const event1 = scorePuzzleCompletion('test-room', 'cipher-lock', 0);
      const event2 = scorePuzzleCompletion('test-room', 'split-screen', 1);

      expect(event2.cumulativeScore).toBe(
        event1.puzzleScore.finalScore + event2.puzzleScore.finalScore,
      );
    });
  });

  describe('relationship tiers', () => {
    it('starts at New Acquaintances', () => {
      startGameTracking('test-room');
      const event = scorePuzzleCompletion('test-room', 'cipher-lock', 0);
      expect(event.relationshipTier).toBe('New Acquaintances');
    });
  });

  describe('communication tracking', () => {
    it('calculates communication stats', () => {
      startGameTracking('test-room');

      vi.setSystemTime(1000);
      recordMessage('test-room', 'player1');
      vi.setSystemTime(30000);
      recordMessage('test-room', 'player2');
      vi.setSystemTime(60000);
      recordMessage('test-room', 'player1');
      vi.setSystemTime(90000);
      recordMessage('test-room', 'player2');

      const stats = calculateCommunicationStats('test-room', 2 * 60 * 1000);

      expect(stats.totalMessages).toBe(4);
      expect(stats.messagesPerMinute).toBe(2);
      expect(stats.rating).toBe('Good Communicators');
    });

    it('rates silent partners correctly', () => {
      startGameTracking('test-room');

      vi.setSystemTime(0);
      recordMessage('test-room', 'player1');

      const stats = calculateCommunicationStats('test-room', 10 * 60 * 1000);

      expect(stats.totalMessages).toBe(1);
      expect(stats.messagesPerMinute).toBeLessThan(0.5);
      expect(stats.rating).toBe('Silent Partners');
    });

    it('rates great communicators correctly', () => {
      startGameTracking('test-room');

      for (let i = 0; i < 20; i++) {
        vi.setSystemTime(i * 15_000);
        recordMessage('test-room', i % 2 === 0 ? 'p1' : 'p2');
      }

      const stats = calculateCommunicationStats('test-room', 5 * 60 * 1000);

      expect(stats.messagesPerMinute).toBe(4);
      expect(stats.rating).toBe('Great Communicators');
    });
  });

  describe('cooperation score', () => {
    it('returns 100 for perfectly balanced communication', () => {
      startGameTracking('test-room');

      for (let i = 0; i < 10; i++) {
        recordMessage('test-room', 'p1');
        recordMessage('test-room', 'p2');
      }

      const score = calculateCooperationScore('test-room');
      expect(score).toBe(100);
    });

    it('returns lower score for imbalanced communication', () => {
      startGameTracking('test-room');

      for (let i = 0; i < 10; i++) {
        recordMessage('test-room', 'p1');
      }
      recordMessage('test-room', 'p2');

      const score = calculateCooperationScore('test-room');
      expect(score).toBeLessThan(50);
    });
  });

  describe('final score', () => {
    it('calculates final score with all components', () => {
      startGameTracking('test-room');

      vi.setSystemTime(0);
      recordMessage('test-room', 'p1');
      vi.setSystemTime(5000);
      recordMessage('test-room', 'p2');

      vi.setSystemTime(30_000);
      scorePuzzleCompletion('test-room', 'cipher-lock', 0);

      const finalEvent = calculateFinalScore('test-room', 5 * 60 * 1000);

      expect(finalEvent.gameScore.totalScore).toBeGreaterThan(0);
      expect(finalEvent.gameScore.communicationStats.totalMessages).toBe(2);
      expect(finalEvent.gameScore.cooperationScore).toBeGreaterThanOrEqual(0);
      expect(finalEvent.gameScore.relationshipTier).toBeDefined();
      expect(finalEvent.gameScore.roomScores.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cleanup', () => {
    it('clears all tracking data', () => {
      startGameTracking('test-room');
      recordMessage('test-room', 'p1');
      scorePuzzleCompletion('test-room', 'cipher-lock', 0);

      expect(getCumulativeScore('test-room')).toBeGreaterThan(0);

      cleanupGame('test-room');

      expect(getCumulativeScore('test-room')).toBe(0);
    });
  });
});

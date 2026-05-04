import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHint,
  getHintUsage,
  clearHintsForRoom,
  COOLDOWN_MS,
  MAX_HINT_LEVEL,
} from '../../services/hintService.js';

vi.mock('../../services/aiService.js', () => ({
  generateHint: vi.fn().mockResolvedValue('AI generated hint text'),
}));

describe('hintService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearHintsForRoom('test-room');
    clearHintsForRoom('other-room');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getHint', () => {
    it('returns a level 1 hint when no hints used yet', async () => {
      const hint = await getHint('test-room', 'cipher-lock', 0);
      expect(hint.level).toBe(1);
      expect(hint.maxLevel).toBe(MAX_HINT_LEVEL);
      expect(hint.text).toBeTruthy();
      expect(hint.cooldownRemaining).toBe(0);
      expect(hint.relationshipPointsCost).toBe(5);
    });

    it('returns level 2 hint after level 1', async () => {
      await getHint('test-room', 'cipher-lock', 0);
      vi.advanceTimersByTime(COOLDOWN_MS + 1);
      const hint = await getHint('test-room', 'cipher-lock', 1);
      expect(hint.level).toBe(2);
      expect(hint.relationshipPointsCost).toBe(10);
    });

    it('returns level 3 hint as max', async () => {
      await getHint('test-room', 'cipher-lock', 0);
      vi.advanceTimersByTime(COOLDOWN_MS + 1);
      await getHint('test-room', 'cipher-lock', 1);
      vi.advanceTimersByTime(COOLDOWN_MS + 1);
      const hint = await getHint('test-room', 'cipher-lock', 2);
      expect(hint.level).toBe(3);
      expect(hint.relationshipPointsCost).toBe(15);
    });

    it('returns max-level message when all hints used', async () => {
      const hint = await getHint('test-room', 'cipher-lock', 3);
      expect(hint.text).toContain('all available hints');
      expect(hint.level).toBe(3);
    });

    it('enforces cooldown between hints', async () => {
      await getHint('test-room', 'cipher-lock', 0);

      const hint = await getHint('test-room', 'cipher-lock', 1);
      expect(hint.cooldownRemaining).toBeGreaterThan(0);
      expect(hint.text).toBe('');
    });

    it('tracks usage per room and puzzle independently', async () => {
      await getHint('test-room', 'cipher-lock', 0);
      const otherHint = await getHint('test-room', 'wire-connection', 0);
      expect(otherHint.level).toBe(1);
      expect(otherHint.cooldownRemaining).toBe(0);
    });

    it('falls back when AI generation fails', async () => {
      const { generateHint } = await import('../../services/aiService.js');
      (generateHint as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const hint = await getHint('test-room', 'cipher-lock', 0);
      expect(hint.text).toBeTruthy();
      expect(hint.level).toBe(1);
    });
  });

  describe('getHintUsage', () => {
    it('returns undefined when no hints used', () => {
      expect(getHintUsage('test-room', 'cipher-lock')).toBeUndefined();
    });

    it('returns usage after hint requested', async () => {
      await getHint('test-room', 'cipher-lock', 0);
      const usage = getHintUsage('test-room', 'cipher-lock');
      expect(usage).toBeDefined();
      expect(usage!.level).toBe(1);
      expect(usage!.totalHintsUsed).toBe(1);
      expect(usage!.relationshipPointsSpent).toBe(5);
    });
  });

  describe('clearHintsForRoom', () => {
    it('clears all hint usage for a room', async () => {
      await getHint('test-room', 'cipher-lock', 0);
      await getHint('test-room', 'wire-connection', 0);

      clearHintsForRoom('test-room');

      expect(getHintUsage('test-room', 'cipher-lock')).toBeUndefined();
      expect(getHintUsage('test-room', 'wire-connection')).toBeUndefined();
    });

    it('does not affect other rooms', async () => {
      await getHint('other-room', 'cipher-lock', 0);
      clearHintsForRoom('test-room');
      expect(getHintUsage('other-room', 'cipher-lock')).toBeDefined();
    });
  });

  describe('constants', () => {
    it('has correct cooldown', () => {
      expect(COOLDOWN_MS).toBe(30_000);
    });

    it('has 3 max hint levels', () => {
      expect(MAX_HINT_LEVEL).toBe(3);
    });
  });
});

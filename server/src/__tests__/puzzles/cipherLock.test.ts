import { describe, it, expect, beforeEach } from 'vitest';
import { CipherLockPuzzle } from '../../puzzles/cipherLock.js';

describe('CipherLockPuzzle', () => {
  let puzzle: CipherLockPuzzle;
  const playerIds = ['player-1', 'player-2'];

  beforeEach(() => {
    puzzle = new CipherLockPuzzle();
  });

  describe('generation', () => {
    it('should generate valid puzzle data for both roles', () => {
      const data = puzzle.generate(playerIds);

      expect(data.roles['player-1']).toBe('decoder');
      expect(data.roles['player-2']).toBe('lock-holder');
    });

    it('should produce an encoded message with 4 hyphen-separated letters', () => {
      const data = puzzle.generate(playerIds);

      expect(data.encodedMessage).toBeDefined();
      const letters = data.encodedMessage.split('-');
      expect(letters).toHaveLength(4);
      letters.forEach((l: string) => {
        expect(l).toMatch(/^[A-K]$/);
        expect(l).not.toBe('I');
      });
    });

    it('should produce a cipher key mapping 10 letters to digits', () => {
      const data = puzzle.generate(playerIds);

      const keys = Object.keys(data.cipherKey);
      expect(keys).toHaveLength(10);
      Object.values(data.cipherKey).forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(9);
      });
    });

    it('should initialize current digits to [0,0,0,0]', () => {
      const data = puzzle.generate(playerIds);
      expect(data.currentDigits).toEqual([0, 0, 0, 0]);
    });

    it('should store the correct solution', () => {
      const data = puzzle.generate(playerIds);
      const solution = puzzle.getSolution() as number[];

      const letters = (data.encodedMessage as string).split('-');
      const expected = letters.map((l: string) => (data.cipherKey as Record<string, number>)[l]);
      expect(solution).toEqual(expected);
    });
  });

  describe('validateAction', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should accept correct code submission', () => {
      const solution = puzzle.getSolution() as number[];
      const result = puzzle.validateAction('player-2', {
        type: 'submit-code',
        playerRole: 'lock-holder',
        data: { digits: solution },
      });

      expect(result.success).toBe(true);
      expect(result.solved).toBe(true);
    });

    it('should reject wrong code submission', () => {
      const result = puzzle.validateAction('player-2', {
        type: 'submit-code',
        playerRole: 'lock-holder',
        data: { digits: [9, 9, 9, 9] },
      });

      expect(result.success).toBe(false);
      expect(result.solved).toBeUndefined();
      expect(result.message).toBe('Incorrect code');
    });

    it('should update digits', () => {
      const result = puzzle.validateAction('player-2', {
        type: 'update-digits',
        playerRole: 'lock-holder',
        data: { digits: [1, 2, 3, 4] },
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.currentDigits).toEqual([1, 2, 3, 4]);
    });

    it('should reject unknown actions', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'unknown',
        playerRole: 'decoder',
        data: {},
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown action');
    });

    it('should reject actions from players without a role', () => {
      const result = puzzle.validateAction('stranger', {
        type: 'submit-code',
        playerRole: 'decoder',
        data: { digits: [1, 2, 3, 4] },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('no role');
    });
  });

  describe('hint system', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should return a basic hint at level 0', () => {
      const hint = puzzle.getHint(0);
      expect(hint).toContain('cipher key');
    });

    it('should reveal the first digit at level 1', () => {
      const data = puzzle.getState().data;
      const letters = data.encodedMessage.split('-');
      const hint = puzzle.getHint(1);
      expect(hint).toContain(letters[0]);
    });

    it('should reveal first two digits at level 2', () => {
      const hint = puzzle.getHint(2);
      expect(hint).toContain('first two');
    });

    it('should reveal the full code at level 3+', () => {
      const solution = puzzle.getSolution() as number[];
      const hint = puzzle.getHint(3);
      expect(hint).toContain('full code');
      solution.forEach((d) => {
        expect(hint).toContain(String(d));
      });
    });

    it('should increment hint level on request-hint action', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'request-hint',
        playerRole: 'decoder',
        data: {},
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.hintLevel).toBe(1);
    });

    it('should cap hint level at 4', () => {
      for (let i = 0; i < 6; i++) {
        puzzle.validateAction('player-1', {
          type: 'request-hint',
          playerRole: 'decoder',
          data: {},
        });
      }
      const state = puzzle.getState();
      expect(state.data.hintLevel).toBe(4);
    });
  });

  describe('solve flow', () => {
    it('should mark puzzle as solved after correct code', () => {
      puzzle.generate(playerIds);
      const solution = puzzle.getSolution() as number[];

      expect(puzzle.isSolved()).toBe(false);

      puzzle.validateAction('player-2', {
        type: 'submit-code',
        playerRole: 'lock-holder',
        data: { digits: solution },
      });
      puzzle.markSolved();

      expect(puzzle.isSolved()).toBe(true);
    });
  });
});

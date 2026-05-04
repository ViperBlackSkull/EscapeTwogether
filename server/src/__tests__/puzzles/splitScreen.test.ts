import { describe, it, expect, beforeEach } from 'vitest';
import { SplitScreenPuzzle } from '../../puzzles/splitScreen.js';
import type { GridCell } from '../../puzzles/splitScreen.js';

describe('SplitScreenPuzzle', () => {
  let puzzle: SplitScreenPuzzle;
  const playerIds = ['player-1', 'player-2'];

  beforeEach(() => {
    puzzle = new SplitScreenPuzzle();
  });

  describe('generation', () => {
    it('should generate a valid 4x4 grid', () => {
      const data = puzzle.generate(playerIds);

      expect(data.fullGrid).toBeDefined();
      expect(data.fullGrid).toHaveLength(4);
      data.fullGrid.forEach((row: { symbol: string; color: string }[]) => {
        expect(row).toHaveLength(4);
        row.forEach((cell: { symbol: string; color: string }) => {
          expect(cell).toHaveProperty('symbol');
          expect(cell).toHaveProperty('color');
        });
      });
    });

    it('should assign roles correctly', () => {
      const data = puzzle.generate(playerIds);
      expect(data.roles['player-1']).toBe('player-a');
      expect(data.roles['player-2']).toBe('player-b');
    });

    it('should give player-a the left half (columns 0-1)', () => {
      const data = puzzle.generate(playerIds);

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = data.playerAView[r][c];
          if (c < 2) {
            expect(cell).not.toBeNull();
            expect(cell!.symbol).toBe(data.fullGrid[r][c].symbol);
            expect(cell!.color).toBe(data.fullGrid[r][c].color);
          } else {
            expect(cell).toBeNull();
          }
        }
      }
    });

    it('should give player-b the right half (columns 2-3)', () => {
      const data = puzzle.generate(playerIds);

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = data.playerBView[r][c];
          if (c >= 2) {
            expect(cell).not.toBeNull();
            expect(cell!.symbol).toBe(data.fullGrid[r][c].symbol);
            expect(cell!.color).toBe(data.fullGrid[r][c].color);
          } else {
            expect(cell).toBeNull();
          }
        }
      }
    });

    it('should initialize empty placement grids', () => {
      const data = puzzle.generate(playerIds);

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          expect(data.playerAPlacements[r][c]).toBeNull();
          expect(data.playerBPlacements[r][c]).toBeNull();
        }
      }
    });

    it('should store the full grid as the solution', () => {
      puzzle.generate(playerIds);
      const solution = puzzle.getSolution() as GridCell[][];

      expect(solution).toHaveLength(4);
      solution.forEach((row) => expect(row).toHaveLength(4));
    });
  });

  describe('validateAction', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should allow sending cell info', () => {
      const cell: GridCell = { symbol: '★', color: '#fff' };
      const result = puzzle.validateAction('player-1', {
        type: 'send-cell',
        playerRole: 'player-a',
        data: { row: 0, col: 0, cell },
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.communicationLog).toHaveLength(1);
    });

    it('should reject send-cell with missing data', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'send-cell',
        playerRole: 'player-a',
        data: { row: 0 },
      });

      expect(result.success).toBe(false);
    });

    it('should allow player-a to place cells', () => {
      const cell: GridCell = { symbol: '★', color: '#fff' };
      const result = puzzle.validateAction('player-1', {
        type: 'place-cell',
        playerRole: 'player-a',
        data: { row: 0, col: 2, cell },
      });

      expect(result.success).toBe(true);
      const state = puzzle.getState();
      expect(state.data.playerAPlacements[0][2]).toEqual(cell);
    });

    it('should allow player-b to place cells', () => {
      const cell: GridCell = { symbol: '◆', color: '#000' };
      const result = puzzle.validateAction('player-2', {
        type: 'place-cell',
        playerRole: 'player-b',
        data: { row: 1, col: 0, cell },
      });

      expect(result.success).toBe(true);
      const state = puzzle.getState();
      expect(state.data.playerBPlacements[1][0]).toEqual(cell);
    });

    it('should reject unknown actions', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'foobar',
        playerRole: 'player-a',
        data: {},
      });

      expect(result.success).toBe(false);
    });
  });

  describe('solution validation', () => {
    it('should solve when merged placements match full grid', () => {
      const data = puzzle.generate(playerIds);
      const fullGrid = data.fullGrid;

      // Player-a places left-half cells (cols 0-1) — the merge reads cols 0-1 from player-a
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          puzzle.validateAction('player-1', {
            type: 'place-cell',
            playerRole: 'player-a',
            data: { row: r, col: c, cell: fullGrid[r][c] },
          });
        }
      }

      // Player-b places right-half cells (cols 2-3) — the merge reads cols 2-3 from player-b
      for (let r = 0; r < 4; r++) {
        for (let c = 2; c < 4; c++) {
          puzzle.validateAction('player-2', {
            type: 'place-cell',
            playerRole: 'player-b',
            data: { row: r, col: c, cell: fullGrid[r][c] },
          });
        }
      }

      const result = puzzle.validateAction('player-1', {
        type: 'check-solution',
        playerRole: 'player-a',
        data: {},
      });

      expect(result.success).toBe(true);
      expect(result.solved).toBe(true);
    });

    it('should report partial correctness on wrong placements', () => {
      const data = puzzle.generate(playerIds);
      const fullGrid = data.fullGrid;

      // Place some wrong cells
      const wrongCell: GridCell = { symbol: '★', color: '#fff' };
      puzzle.validateAction('player-1', {
        type: 'place-cell',
        playerRole: 'player-a',
        data: { row: 0, col: 2, cell: wrongCell },
      });

      const result = puzzle.validateAction('player-1', {
        type: 'check-solution',
        playerRole: 'player-a',
        data: {},
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/\d+\/16 cells are correct/);
    });
  });

  describe('hint system', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should return a hint at level 0', () => {
      const hint = puzzle.getHint(0);
      expect(hint.length).toBeGreaterThan(0);
    });

    it('should return a hint at level 1 with a specific cell', () => {
      const hint = puzzle.getHint(1);
      expect(hint).toContain('row 1, column 3');
    });

    it('should return a hint at level 2', () => {
      const hint = puzzle.getHint(2);
      expect(hint).toContain('row 4, column 1');
    });

    it('should increment hint level on request-hint', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'request-hint',
        playerRole: 'player-a',
        data: {},
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.hintLevel).toBe(1);
    });
  });
});

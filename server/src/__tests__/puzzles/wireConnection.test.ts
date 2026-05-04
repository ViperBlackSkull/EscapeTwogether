import { describe, it, expect, beforeEach } from 'vitest';
import { WireConnectionPuzzle } from '../../puzzles/wireConnection.js';
import type { WireMapping } from '../../puzzles/wireConnection.js';

describe('WireConnectionPuzzle', () => {
  let puzzle: WireConnectionPuzzle;
  const playerIds = ['player-1', 'player-2'];

  beforeEach(() => {
    puzzle = new WireConnectionPuzzle();
  });

  describe('generation', () => {
    it('should generate 6 wire mappings', () => {
      const data = puzzle.generate(playerIds);

      expect(data.wires).toHaveLength(6);
      data.wires.forEach((w: { color: string; outputIndex: number }) => {
        expect(w).toHaveProperty('color');
        expect(w).toHaveProperty('outputIndex');
        expect(w.outputIndex).toBeGreaterThanOrEqual(1);
        expect(w.outputIndex).toBeLessThanOrEqual(6);
      });
    });

    it('should assign roles correctly', () => {
      const data = puzzle.generate(playerIds);
      expect(data.roles['player-1']).toBe('player-a');
      expect(data.roles['player-2']).toBe('player-b');
    });

    it('should provide 6 player-a colors', () => {
      const data = puzzle.generate(playerIds);
      expect(data.playerAColors).toHaveLength(6);
    });

    it('should provide 6 player-b outputs', () => {
      const data = puzzle.generate(playerIds);
      expect(data.playerBOutputs).toHaveLength(6);
    });

    it('should initialize all connections as null', () => {
      const data = puzzle.generate(playerIds);
      for (let i = 1; i <= 6; i++) {
        expect(data.connections[i]).toBeNull();
      }
    });

    it('should use all 6 standard colors', () => {
      const data = puzzle.generate(playerIds);
      const expectedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
      const sortedColors = [...data.playerAColors].sort();
      expect(sortedColors).toEqual([...expectedColors].sort());
    });

    it('should use all output indices 1-6', () => {
      const data = puzzle.generate(playerIds);
      const sortedOutputs = [...data.playerBOutputs].sort((a, b) => a - b);
      expect(sortedOutputs).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should store solution matching wires', () => {
      const data = puzzle.generate(playerIds);
      const solution = puzzle.getSolution() as WireMapping[];
      expect(solution).toEqual(data.wires);
    });
  });

  describe('validateAction — connect-wire', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should allow player-b to connect a wire', () => {
      const result = puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 1, color: 'red' },
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.connections[1]).toBe('red');
    });

    it('should reject player-a from connecting wires', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'connect-wire',
        playerRole: 'player-a',
        data: { outputIndex: 1, color: 'red' },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only the output operator');
    });

    it('should reject invalid output index', () => {
      const result = puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 7, color: 'red' },
      });

      expect(result.success).toBe(false);
    });

    it('should remove previous connection when same color reassigned', () => {
      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 1, color: 'red' },
      });

      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 2, color: 'red' },
      });

      const state = puzzle.getState();
      expect(state.data.connections[1]).toBeNull();
      expect(state.data.connections[2]).toBe('red');
    });
  });

  describe('validateAction — disconnect-wire', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should allow player-b to disconnect a wire', () => {
      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 1, color: 'red' },
      });

      const result = puzzle.validateAction('player-2', {
        type: 'disconnect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.connections[1]).toBeNull();
    });

    it('should reject player-a from disconnecting', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'disconnect-wire',
        playerRole: 'player-a',
        data: { outputIndex: 1 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateAction — send-color-info', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should allow sending color info', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'send-color-info',
        playerRole: 'player-a',
        data: { message: 'The first wire is red' },
      });

      expect(result.success).toBe(true);
      expect(result.updatedState?.communicationLog).toHaveLength(1);
    });

    it('should reject empty messages', () => {
      const result = puzzle.validateAction('player-1', {
        type: 'send-color-info',
        playerRole: 'player-a',
        data: { message: '   ' },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('check-connections', () => {
    it('should solve when all 6 connections are correct', () => {
      const data = puzzle.generate(playerIds);
      const wires = puzzle.getSolution() as WireMapping[];

      for (const wire of wires) {
        puzzle.validateAction('player-2', {
          type: 'connect-wire',
          playerRole: 'player-b',
          data: { outputIndex: wire.outputIndex, color: wire.color },
        });
      }

      const result = puzzle.validateAction('player-2', {
        type: 'check-connections',
        playerRole: 'player-b',
        data: {},
      });

      expect(result.success).toBe(true);
      expect(result.solved).toBe(true);
    });

    it('should reject if not all wires connected', () => {
      puzzle.generate(playerIds);

      // Only connect 3 wires
      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 1, color: 'red' },
      });
      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 2, color: 'blue' },
      });
      puzzle.validateAction('player-2', {
        type: 'connect-wire',
        playerRole: 'player-b',
        data: { outputIndex: 3, color: 'green' },
      });

      const result = puzzle.validateAction('player-2', {
        type: 'check-connections',
        playerRole: 'player-b',
        data: {},
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connect all 6');
    });

    it('should report correct count on wrong connections', () => {
      puzzle.generate(playerIds);

      // Connect all 6 but with wrong colors
      const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
      for (let i = 1; i <= 6; i++) {
        puzzle.validateAction('player-2', {
          type: 'connect-wire',
          playerRole: 'player-b',
          data: { outputIndex: i, color: colors[i - 1] },
        });
      }

      const result = puzzle.validateAction('player-2', {
        type: 'check-connections',
        playerRole: 'player-b',
        data: {},
      });

      // Might be correct by random chance, but usually won't be
      if (!result.solved) {
        expect(result.message).toMatch(/\d+\/6 wires/);
      }
    });
  });

  describe('hint system', () => {
    beforeEach(() => {
      puzzle.generate(playerIds);
    });

    it('should return a basic hint at level 0', () => {
      const hint = puzzle.getHint(0);
      expect(hint.length).toBeGreaterThan(0);
    });

    it('should reveal the first wire at level 1', () => {
      const wires = puzzle.getSolution() as WireMapping[];
      const hint = puzzle.getHint(1);
      expect(hint).toContain(wires[0].color);
      expect(hint).toContain(String(wires[0].outputIndex));
    });

    it('should reveal the fourth wire at level 2', () => {
      const wires = puzzle.getSolution() as WireMapping[];
      const hint = puzzle.getHint(2);
      expect(hint).toContain(wires[3].color);
      expect(hint).toContain(String(wires[3].outputIndex));
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateNarrative,
  generateDialogue,
  generateHint,
  generateScenario,
  isAiAvailable,
} from '../../services/aiService.js';
import type { GameContext } from '../../services/aiTypes.js';

// Mock the Anthropic SDK so tests don't need a real API key
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mocked AI response' }],
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

const baseContext: GameContext = {
  roomName: 'The Workshop',
  roomIndex: 0,
  playerNames: ['Alice', 'Bob'],
  previousEvents: [],
  puzzlesSolved: 0,
  totalPuzzles: 5,
  elapsedTimeMs: 0,
};

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the module-level cache by reimporting is tricky,
    // so we test the public API which handles caching internally
  });

  describe('isAiAvailable', () => {
    it('returns a boolean', () => {
      expect(typeof isAiAvailable()).toBe('boolean');
    });

    it('returns true when ANTHROPIC_AUTH_TOKEN is set', () => {
      // Token is available in this test environment
      expect(isAiAvailable()).toBe(true);
    });
  });

  describe('generateNarrative', () => {
    it('returns a non-empty string', async () => {
      const result = await generateNarrative('Describe the room', baseContext);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateDialogue', () => {
    it('returns a non-empty string', async () => {
      const result = await generateDialogue('Guard', 'Players enter the room', []);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateHint', () => {
    it('returns a non-empty string for any level', async () => {
      const result = await generateHint('cipher-lock', {}, 1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns valid strings for levels 1 through 3', async () => {
      for (const level of [1, 2, 3]) {
        const hint = await generateHint('cipher-lock', { testVar: `run${level}` }, level);
        expect(typeof hint).toBe('string');
        expect(hint.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateScenario', () => {
    it('returns a well-formed scenario object', async () => {
      const result = await generateScenario('Workshop', 'medium', []);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('theme');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('entranceText');
      expect(result).toHaveProperty('ambientDescriptions');
      expect(result).toHaveProperty('puzzleSuggestions');
      expect(result).toHaveProperty('difficulty');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRoomNarrative,
  generatePuzzleNarrative,
  generateCompletionNarrative,
} from '../../services/narrativeService.js';
import type { GameEvent } from '../../../../shared/types/narrative.js';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mocked AI narrative response' }],
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

describe('narrativeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRoomNarrative', () => {
    it('returns a RoomNarrative with required fields', async () => {
      const result = await generateRoomNarrative(0, 'The Workshop', []);

      expect(result).toHaveProperty('roomName', 'The Workshop');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('entranceText');
      expect(result).toHaveProperty('ambientDescriptions');
      expect(result).toHaveProperty('characterDialogue');
      expect(typeof result.description).toBe('string');
      expect(result.description.length).toBeGreaterThan(0);
    });

    it('returns fallback content for room 1', async () => {
      // Force AI failure by making mock throw
      const { default: sdk } = await import('@anthropic-ai/sdk');
      vi.mocked(sdk).mockImplementationOnce(() => {
        throw new Error('Forced failure');
      });

      const result = await generateRoomNarrative(0, 'The Workshop', []);
      expect(result.roomName).toBe('The Workshop');
      expect(result.entranceText.length).toBeGreaterThan(0);
    });

    it('uses previousEvents for story continuity', async () => {
      const events: GameEvent[] = [
        { type: 'puzzle-solved', message: 'Cipher lock solved', timestamp: Date.now() },
      ];
      const result = await generateRoomNarrative(1, 'The Laboratory', events);
      expect(result).toHaveProperty('roomName', 'The Laboratory');
    });

    it('returns fallback for unknown room index', async () => {
      const { default: sdk } = await import('@anthropic-ai/sdk');
      vi.mocked(sdk).mockImplementationOnce(() => {
        throw new Error('Forced failure');
      });

      const result = await generateRoomNarrative(99, 'Unknown Room', []);
      expect(result.roomName).toBe('Unknown Room');
      expect(result.description.length).toBeGreaterThan(0);
    });
  });

  describe('generatePuzzleNarrative', () => {
    it('returns a PuzzleNarrative with required fields', async () => {
      const result = await generatePuzzleNarrative('cipher-lock', 'The Workshop');

      expect(result).toHaveProperty('backstory');
      expect(result).toHaveProperty('clueText');
      expect(result).toHaveProperty('successMessage');
      expect(result).toHaveProperty('hintFlavorTexts');
      expect(Array.isArray(result.hintFlavorTexts)).toBe(true);
    });

    it('returns fallback content when AI fails', async () => {
      const { default: sdk } = await import('@anthropic-ai/sdk');
      vi.mocked(sdk).mockImplementationOnce(() => {
        throw new Error('Forced failure');
      });

      const result = await generatePuzzleNarrative('cipher-lock', 'The Workshop');
      expect(result.backstory.length).toBeGreaterThan(0);
      expect(result.successMessage.length).toBeGreaterThan(0);
    });

    it('returns fallback for unknown puzzle type', async () => {
      const { default: sdk } = await import('@anthropic-ai/sdk');
      vi.mocked(sdk).mockImplementationOnce(() => {
        throw new Error('Forced failure');
      });

      const result = await generatePuzzleNarrative('unknown-puzzle', 'The Lab');
      expect(result.backstory.length).toBeGreaterThan(0);
      expect(result.hintFlavorTexts.length).toBeGreaterThan(0);
    });
  });

  describe('generateCompletionNarrative', () => {
    it('returns a non-empty string', async () => {
      const result = await generateCompletionNarrative(120_000, 5, 2, ['Alice', 'Bob']);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns fallback when AI fails', async () => {
      const { default: sdk } = await import('@anthropic-ai/sdk');
      vi.mocked(sdk).mockImplementationOnce(() => {
        throw new Error('Forced failure');
      });

      const result = await generateCompletionNarrative(300_000, 5, 0);
      expect(result.length).toBeGreaterThan(0);
    });

    it('works without player names', async () => {
      const result = await generateCompletionNarrative(60_000, 3, 1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

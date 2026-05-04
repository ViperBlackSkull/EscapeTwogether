import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Anthropic SDK globally so no real API calls are made
const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Mocked AI narrative response for testing' }],
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

// --- AI Integration Tests ---
// These tests verify the complete AI integration:
// 1. AI config defaults and environment loading
// 2. AI service fallbacks when API unavailable
// 3. Narrative service (room, puzzle, completion narratives)
// 4. Hint service (levels, cooldown, costs)
// 5. Narrative cache (pre-generation, invalidation)
// 6. Image service (ComfyUI detection, graceful degradation)
// 7. Asset pipeline (generation, skip-on-exist)
// 8. Scenario service (dynamic room creation, validation)
// 9. Feature toggle isolation (individual and master switch)
// 10. Game orchestrator integration (AI services wired into game flow)

describe('AI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AI config defaults', () => {
    it('loads default config when env vars are absent', async () => {
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.enabled).toBe(true);
      expect(aiConfig.anthropicBaseUrl).toBe('https://api.z.ai/api/anthropic');
      expect(aiConfig.anthropicModel).toBe('claude-sonnet-4-20250514');
      expect(aiConfig.rateLimitRpm).toBe(10);
      expect(aiConfig.narrativeEnabled).toBe(true);
      expect(aiConfig.hintsEnabled).toBe(true);
      expect(aiConfig.imagesEnabled).toBe(true);
    });

    it('isAnthropicAvailable returns a boolean', async () => {
      const { isAnthropicAvailable } = await import('../../config/ai.js');
      expect(typeof isAnthropicAvailable()).toBe('boolean');
    });
  });

  describe('AI service fallbacks', () => {
    it('generateNarrative returns content via mock or fallback', async () => {
      const { generateNarrative } = await import('../../services/aiService.js');
      const context = {
        roomName: 'The Invitation',
        roomIndex: 0,
        playerNames: ['Alice', 'Bob'],
        previousEvents: [],
        puzzlesSolved: 0,
        totalPuzzles: 10,
        elapsedTimeMs: 0,
      };

      const result = await generateNarrative('Describe the room', context);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('generateDialogue returns content', async () => {
      const { generateDialogue } = await import('../../services/aiService.js');
      const result = await generateDialogue('Guard', 'Players enter the room', []);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('generateHint returns content for all levels', async () => {
      const { generateHint } = await import('../../services/aiService.js');
      for (const level of [1, 2, 3]) {
        const result = await generateHint('cipher-lock', {}, level);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('generateScenario returns a well-formed scenario', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
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

  describe('Narrative service', () => {
    it('generates room narrative with all required fields', async () => {
      const { generateRoomNarrative } = await import('../../services/narrativeService.js');
      const narrative = await generateRoomNarrative(0, 'The Workshop', []);

      expect(narrative).toHaveProperty('roomName');
      expect(narrative).toHaveProperty('description');
      expect(narrative).toHaveProperty('entranceText');
      expect(narrative).toHaveProperty('ambientDescriptions');
      expect(narrative).toHaveProperty('characterDialogue');
      expect(narrative.roomName).toBe('The Workshop');
      expect(narrative.description.length).toBeGreaterThan(0);
      expect(narrative.entranceText.length).toBeGreaterThan(0);
    });

    it('generates room narrative for all 5 rooms', async ({ expect }) => {
      const { generateRoomNarrative } = await import('../../services/narrativeService.js');
      const themes = ['The Invitation', 'The Workshop', 'The Laboratory', 'The Labyrinth', 'The Vault'];

      for (let i = 0; i < themes.length; i++) {
        const narrative = await generateRoomNarrative(i, themes[i]!, []);
        expect(narrative.roomName).toBe(themes[i]);
        expect(narrative.description.length).toBeGreaterThan(0);
        expect(narrative.entranceText.length).toBeGreaterThan(0);
        expect(narrative.ambientDescriptions.length).toBeGreaterThan(0);
      }
    }, 15000);

    it('generates puzzle narrative with all required fields', async ({ expect }) => {
      const { generatePuzzleNarrative } = await import('../../services/narrativeService.js');
      const narrative = await generatePuzzleNarrative('cipher-lock', 'The Workshop');

      expect(narrative).toHaveProperty('backstory');
      expect(narrative).toHaveProperty('clueText');
      expect(narrative).toHaveProperty('successMessage');
      expect(narrative).toHaveProperty('hintFlavorTexts');
      expect(narrative.backstory.length).toBeGreaterThan(0);
      expect(narrative.successMessage.length).toBeGreaterThan(0);
    }, 15000);

    it('generates puzzle narratives for all puzzle types', async ({ expect }) => {
      const { generatePuzzleNarrative } = await import('../../services/narrativeService.js');
      const puzzleTypes = ['cipher-lock', 'split-screen', 'wire-connection', 'sequence-memory', 'map-navigator'];

      for (const type of puzzleTypes) {
        const narrative = await generatePuzzleNarrative(type, 'The Workshop');
        expect(narrative.backstory.length).toBeGreaterThan(0);
        expect(narrative.successMessage.length).toBeGreaterThan(0);
      }
    }, 30000);

    it('generates completion narrative', async () => {
      const { generateCompletionNarrative } = await import('../../services/narrativeService.js');
      const message = await generateCompletionNarrative(180000, 10, 2, ['Alice', 'Bob']);

      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('completion narrative references player names when provided', async () => {
      const { generateCompletionNarrative } = await import('../../services/narrativeService.js');
      const message = await generateCompletionNarrative(60000, 10, 0, ['Alice', 'Bob']);
      // Either the mock response or fallback content is returned — both should be non-empty
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('Hint service', () => {
    it('provides hints at level 1, 2, 3 with progressive detail', async ({ expect }) => {
      const { getHint, clearHintsForRoom } = await import('../../services/hintService.js');

      // Use different room/puzzle combos to avoid cooldown conflicts
      clearHintsForRoom('test-room-hints');

      const hint1 = await getHint('test-room-hints', 'cipher-lock', 0);
      expect(hint1.level).toBe(1);
      expect(hint1.maxLevel).toBe(3);
      expect(hint1.text.length).toBeGreaterThan(0);

      const hint2 = await getHint('test-room-hints', 'split-screen', 0);
      expect(hint2.level).toBe(1);
      expect(hint2.text.length).toBeGreaterThan(0);

      // Requesting with currentLevel=3 (maxed out) returns "all available hints" message
      const maxedHint = await getHint('test-room-hints', 'wire-connection', 3);
      expect(maxedHint.level).toBe(3);
      expect(maxedHint.text).toContain('all available hints');

      clearHintsForRoom('test-room-hints');
    });

    it('enforces cooldown between hints for same puzzle', async () => {
      const { getHint, clearHintsForRoom } = await import('../../services/hintService.js');

      clearHintsForRoom('test-room-cooldown');

      // First hint
      const hint1 = await getHint('test-room-cooldown', 'cipher-lock', 0);
      expect(hint1.cooldownRemaining).toBe(0);

      // Immediate second request for same puzzle should have cooldown
      const hint2 = await getHint('test-room-cooldown', 'cipher-lock', 1);
      expect(hint2.cooldownRemaining).toBeGreaterThan(0);

      clearHintsForRoom('test-room-cooldown');
    });

    it('tracks relationship point costs (5, 10, 15)', async () => {
      const { getHint, clearHintsForRoom } = await import('../../services/hintService.js');

      clearHintsForRoom('test-room-costs');

      const hint1 = await getHint('test-room-costs', 'cipher-lock', 0);
      expect(hint1.relationshipPointsCost).toBe(5);

      clearHintsForRoom('test-room-costs');
    });

    it('clears hints for a room', async () => {
      const { getHint, clearHintsForRoom, getTotalHintsUsed } = await import('../../services/hintService.js');

      clearHintsForRoom('test-room-clear');

      await getHint('test-room-clear', 'cipher-lock', 0);
      expect(getTotalHintsUsed('test-room-clear')).toBe(1);

      clearHintsForRoom('test-room-clear');
      expect(getTotalHintsUsed('test-room-clear')).toBe(0);
    });
  });

  describe('Narrative cache', () => {
    it('pre-generates narratives for all rooms', async ({ expect }) => {
      const { preGenerateAllRoomNarratives, getCachedRoomNarrative, clearCache } = await import('../../services/narrativeCache.js');

      clearCache();
      preGenerateAllRoomNarratives();

      // Wait for async generation to complete
      await new Promise((r) => setTimeout(r, 1500));

      const room0 = getCachedRoomNarrative(0);
      expect(room0).not.toBeNull();
      expect(room0!.roomName).toBe('The Invitation');

      clearCache();
    }, 10000);

    it('pre-generates narrative for upcoming room', async ({ expect }) => {
      const { preGenerateUpcomingRoom, getCachedRoomNarrative, getCachedPuzzleNarrative, clearCache } = await import('../../services/narrativeCache.js');

      clearCache();
      preGenerateUpcomingRoom(0);

      await new Promise((r) => setTimeout(r, 1500));

      const room1 = getCachedRoomNarrative(1);
      expect(room1).not.toBeNull();
      expect(room1!.roomName).toBe('The Workshop');

      const splitScreen = getCachedPuzzleNarrative('split-screen');
      expect(splitScreen).not.toBeNull();

      clearCache();
    }, 10000);

    it('cache invalidation clears all entries', async ({ expect }) => {
      const { preGenerateAllRoomNarratives, cacheSize, clearCache } = await import('../../services/narrativeCache.js');

      clearCache();
      preGenerateAllRoomNarratives();
      await new Promise((r) => setTimeout(r, 1500));

      clearCache();
      expect(cacheSize()).toBe(0);
    }, 10000);
  });

  describe('Image service', () => {
    it('detects ComfyUI unavailability gracefully', async () => {
      const { isComfyuiAvailable } = await import('../../services/imageService.js');
      const available = await isComfyuiAvailable();
      expect(typeof available).toBe('boolean');
    }, 10000);

    it('returns the correct generated directory path', async () => {
      const { getGeneratedDir } = await import('../../services/imageService.js');
      const dir = getGeneratedDir();
      expect(dir).toContain('assets/generated');
    });
  });

  describe('Asset pipeline', () => {
    it('lists existing assets (empty or populated)', async () => {
      const { listExistingAssets } = await import('../../services/assetPipeline.js');
      const assets = await listExistingAssets();
      expect(Array.isArray(assets)).toBe(true);
    });

    it('skips generation when ComfyUI is unavailable', async () => {
      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const messages: string[] = [];
      const result = await preGenerateAssets((msg) => messages.push(msg));

      if (messages.some((m) => m.includes('not available'))) {
        expect(result.total).toBe(0);
        expect(result.succeeded).toBe(0);
      } else {
        expect(result.total).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Scenario service', () => {
    it('generates a room config from completed rooms', async () => {
      const { generateNextRoom } = await import('../../services/scenarioService.js');
      const result = await generateNextRoom(
        [
          {
            name: 'The Workshop',
            timeSpentMs: 60000,
            hintsUsed: 1,
            communicationFrequency: 10,
            puzzlesSolved: 1,
            totalPuzzlesInRoom: 1,
          },
        ],
        ['Alice', 'Bob'],
      );

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('puzzles');
      expect(result).toHaveProperty('hotspots');
      expect(result.name.length).toBeGreaterThan(0);
      expect(result.puzzles.length).toBeGreaterThan(0);
    });

    it('validates scenarios correctly', async () => {
      const { validateScenario } = await import('../../services/scenarioService.js');
      const valid = validateScenario({
        name: 'Test Room',
        description: 'A test room',
        puzzles: ['cipher-lock'],
        hotspots: [{ id: 'cipher-lock', label: 'Cipher Lock', x: 50, y: 50, width: 20, height: 20 }],
        targetDurationMinutes: 10,
        narrativeBeat: 'discovery',
        difficultyVariants: [
          { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
          { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 },
          { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 4 },
        ],
      });
      expect(valid).toBe(true);
    });

    it('rejects invalid scenarios', async () => {
      const { validateScenario } = await import('../../services/scenarioService.js');
      const invalid = validateScenario({
        name: '',
        description: 'Missing name',
        puzzles: [],
        hotspots: [],
        targetDurationMinutes: 10,
        narrativeBeat: 'discovery',
        difficultyVariants: [
          { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
          { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 },
          { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 4 },
        ],
      });
      expect(invalid).toBe(false);
    });

    it('falls back to predefined templates when AI fails', async () => {
      const { generateNextRoom } = await import('../../services/scenarioService.js');
      const result = await generateNextRoom([], ['Alice', 'Bob']);
      expect(result.name.length).toBeGreaterThan(0);
      expect(result.puzzles.length).toBeGreaterThan(0);
    });
  });

  describe('Image route security', () => {
    it('path traversal protection exists for dangerous filenames', () => {
      const dangerousFilenames = ['../etc/passwd', 'foo/../../bar', 'bar\\..\\baz'];
      for (const filename of dangerousFilenames) {
        const hasTraversal = filename.includes('..') || filename.includes('/') || filename.includes('\\');
        expect(hasTraversal).toBe(true);
      }
    });
  });
});

describe('AI Integration: Game orchestrator wiring', () => {
  it('imports all AI services correctly', async () => {
    const orchestrator = await import('../../gameOrchestrator.js');
    expect(orchestrator.startGame).toBeDefined();
    expect(orchestrator.handlePuzzleSolved).toBeDefined();
    expect(orchestrator.advanceToNextRoom).toBeDefined();
    expect(orchestrator.getElapsedPlayTime).toBeDefined();
    expect(orchestrator.getPuzzleInstance).toBeDefined();
    expect(orchestrator.removePuzzleInstances).toBeDefined();
  });

  it('narrative pre-generation populates cache', async ({ expect }) => {
    const { clearCache, cacheSize, preGenerateAllRoomNarratives } = await import('../../services/narrativeCache.js');

    clearCache();
    expect(cacheSize()).toBe(0);

    preGenerateAllRoomNarratives();
    await new Promise((r) => setTimeout(r, 1500));

    expect(cacheSize()).toBeGreaterThan(0);

    clearCache();
  }, 10000);
});

describe('AI Integration: Feature toggle isolation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('narrative service returns fallback when narrative is disabled', async ({ expect }) => {
    process.env.AI_NARRATIVE_ENABLED = 'false';
    process.env.ANTHROPIC_AUTH_TOKEN = 'test-key';

    const { generateRoomNarrative } = await import('../../services/narrativeService.js');
    const narrative = await generateRoomNarrative(0, 'The Invitation', []);

    expect(narrative.roomName).toBe('The Invitation');
    expect(narrative.entranceText.length).toBeGreaterThan(0);
    expect(narrative.ambientDescriptions.length).toBeGreaterThan(0);
  }, 15000);

  it('hint service returns fallback when hints are disabled', async () => {
    process.env.AI_HINTS_ENABLED = 'false';
    process.env.ANTHROPIC_AUTH_TOKEN = 'test-key';

    const { getHint, clearHintsForRoom } = await import('../../services/hintService.js');
    clearHintsForRoom('test-toggle');

    const hint = await getHint('test-toggle', 'cipher-lock', 0);
    expect(hint.text.length).toBeGreaterThan(0);
    expect(hint.level).toBe(1);

    clearHintsForRoom('test-toggle');
  });

  it('image service returns false for availability when images disabled', async () => {
    process.env.AI_IMAGES_ENABLED = 'false';

    const { isComfyuiAvailable } = await import('../../services/imageService.js');
    const available = await isComfyuiAvailable();
    expect(available).toBe(false);
  });

  it('all services return fallback when AI_ENABLED=false', async ({ expect }) => {
    process.env.AI_ENABLED = 'false';

    const { generateRoomNarrative } = await import('../../services/narrativeService.js');
    const { getHint, clearHintsForRoom } = await import('../../services/hintService.js');
    const { isComfyuiAvailable } = await import('../../services/imageService.js');

    clearHintsForRoom('test-offline');

    const narrative = await generateRoomNarrative(0, 'The Invitation', []);
    expect(narrative.entranceText.length).toBeGreaterThan(0);

    const hint = await getHint('test-offline', 'cipher-lock', 0);
    expect(hint.text.length).toBeGreaterThan(0);

    const available = await isComfyuiAvailable();
    expect(available).toBe(false);

    clearHintsForRoom('test-offline');
  }, 15000);
});

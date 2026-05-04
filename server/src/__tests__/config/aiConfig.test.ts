import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config/ai', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('aiConfig defaults', () => {
    it('provides sensible defaults when no env vars are set', async () => {
      delete process.env.AI_ENABLED;
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      delete process.env.ANTHROPIC_BASE_URL;
      delete process.env.ANTHROPIC_MODEL;
      delete process.env.COMFYUI_URL;
      delete process.env.AI_NARRATIVE_ENABLED;
      delete process.env.AI_HINTS_ENABLED;
      delete process.env.AI_IMAGES_ENABLED;
      delete process.env.AI_RATE_LIMIT_RPM;

      const { aiConfig } = await import('../../config/ai.js');

      expect(aiConfig.enabled).toBe(true);
      expect(aiConfig.anthropicAuthToken).toBe('');
      expect(aiConfig.anthropicBaseUrl).toBe('https://api.z.ai/api/anthropic');
      expect(aiConfig.anthropicModel).toBe('claude-sonnet-4-20250514');
      expect(aiConfig.comfyuiUrl).toBe('https://806ba3e40.hacktive.olares.local');
      expect(aiConfig.narrativeEnabled).toBe(true);
      expect(aiConfig.hintsEnabled).toBe(true);
      expect(aiConfig.imagesEnabled).toBe(true);
      expect(aiConfig.rateLimitRpm).toBe(10);
    });
  });

  describe('env var overrides', () => {
    it('reads AI_ENABLED=false', async () => {
      process.env.AI_ENABLED = 'false';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.enabled).toBe(false);
    });

    it('reads AI_ENABLED=1 as true', async () => {
      process.env.AI_ENABLED = '1';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.enabled).toBe(true);
    });

    it('reads custom Anthropic settings', async () => {
      process.env.ANTHROPIC_AUTH_TOKEN = 'sk-test-123';
      process.env.ANTHROPIC_BASE_URL = 'https://custom.api.com';
      process.env.ANTHROPIC_MODEL = 'claude-opus-4-20250514';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.anthropicAuthToken).toBe('sk-test-123');
      expect(aiConfig.anthropicBaseUrl).toBe('https://custom.api.com');
      expect(aiConfig.anthropicModel).toBe('claude-opus-4-20250514');
    });

    it('reads custom ComfyUI URL', async () => {
      process.env.COMFYUI_URL = 'http://localhost:8188';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.comfyuiUrl).toBe('http://localhost:8188');
    });

    it('reads granular toggles', async () => {
      process.env.AI_NARRATIVE_ENABLED = 'false';
      process.env.AI_HINTS_ENABLED = 'true';
      process.env.AI_IMAGES_ENABLED = '0';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.narrativeEnabled).toBe(false);
      expect(aiConfig.hintsEnabled).toBe(true);
      expect(aiConfig.imagesEnabled).toBe(false);
    });

    it('reads AI_RATE_LIMIT_RPM as integer', async () => {
      process.env.AI_RATE_LIMIT_RPM = '30';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.rateLimitRpm).toBe(30);
    });

    it('falls back to default RPM for non-numeric values', async () => {
      process.env.AI_RATE_LIMIT_RPM = 'abc';
      const { aiConfig } = await import('../../config/ai.js');
      expect(aiConfig.rateLimitRpm).toBe(10);
    });
  });

  describe('convenience functions', () => {
    it('isNarrativeEnabled requires master switch AND narrative toggle', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.AI_NARRATIVE_ENABLED = 'false';
      const { isNarrativeEnabled } = await import('../../config/ai.js');
      expect(isNarrativeEnabled()).toBe(false);
    });

    it('isHintsEnabled is false when master switch is off', async () => {
      process.env.AI_ENABLED = 'false';
      process.env.AI_HINTS_ENABLED = 'true';
      const { isHintsEnabled } = await import('../../config/ai.js');
      expect(isHintsEnabled()).toBe(false);
    });

    it('isImagesEnabled requires both master and toggle', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.AI_IMAGES_ENABLED = 'true';
      const { isImagesEnabled } = await import('../../config/ai.js');
      expect(isImagesEnabled()).toBe(true);
    });

    it('isAnthropicAvailable requires token AND master switch', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.ANTHROPIC_AUTH_TOKEN = '';
      const { isAnthropicAvailable } = await import('../../config/ai.js');
      expect(isAnthropicAvailable()).toBe(false);
    });

    it('isAnthropicAvailable returns true with token and enabled', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.ANTHROPIC_AUTH_TOKEN = 'sk-test';
      const { isAnthropicAvailable } = await import('../../config/ai.js');
      expect(isAnthropicAvailable()).toBe(true);
    });
  });
});

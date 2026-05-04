function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  return val === 'true' || val === '1';
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const aiConfig = {
  /** Master switch — when false all AI calls short-circuit to fallbacks */
  enabled: envBool('AI_ENABLED', true),

  /** Anthropic API credentials */
  anthropicAuthToken: process.env.ANTHROPIC_AUTH_TOKEN ?? '',
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.z.ai/api/anthropic',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',

  /** ComfyUI image generation */
  comfyuiUrl: process.env.COMFYUI_URL ?? 'https://806ba3e40.hacktive.olares.local',

  /** Granular feature toggles */
  narrativeEnabled: envBool('AI_NARRATIVE_ENABLED', true),
  hintsEnabled: envBool('AI_HINTS_ENABLED', true),
  imagesEnabled: envBool('AI_IMAGES_ENABLED', true),

  /** Requests-per-minute cap shared across AI services */
  rateLimitRpm: envInt('AI_RATE_LIMIT_RPM', 10),
} as const;

/** Convenience checks that respect both the master switch and per-feature toggle */
export function isNarrativeEnabled(): boolean {
  return aiConfig.enabled && aiConfig.narrativeEnabled;
}

export function isHintsEnabled(): boolean {
  return aiConfig.enabled && aiConfig.hintsEnabled;
}

export function isImagesEnabled(): boolean {
  return aiConfig.enabled && aiConfig.imagesEnabled;
}

export function isAnthropicAvailable(): boolean {
  return aiConfig.enabled && aiConfig.anthropicAuthToken.length > 0;
}

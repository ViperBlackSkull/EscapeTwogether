import Anthropic from '@anthropic-ai/sdk';
import type { GameContext, RoomScenario, CachedResponse } from './aiTypes.js';
import { aiConfig, isAnthropicAvailable } from '../config/ai.js';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!isAnthropicAvailable()) return null;
  if (client) return client;

  client = new Anthropic({
    apiKey: aiConfig.anthropicAuthToken,
    baseURL: aiConfig.anthropicBaseUrl,
  });

  return client;
}

// --- Rate limiting (max 10 requests per minute) ---

const MAX_RPM = aiConfig.rateLimitRpm;
const requestTimestamps: number[] = [];

function waitForRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    // Prune timestamps older than 60s
    while (requestTimestamps.length > 0 && now - requestTimestamps[0]! > 60_000) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length < MAX_RPM) {
      requestTimestamps.push(Date.now());
      resolve();
      return;
    }

    // Wait until the oldest request ages out
    const oldestInWindow = requestTimestamps[0]!;
    const waitMs = 60_000 - (now - oldestInWindow) + 50; // small buffer
    setTimeout(() => {
      requestTimestamps.shift();
      requestTimestamps.push(Date.now());
      resolve();
    }, waitMs);
  });
}

// --- Response cache (fallback when API unavailable) ---

const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return cached.response;
}

function setCachedResponse(key: string, response: string): void {
  responseCache.set(key, { prompt: key, response, timestamp: Date.now() });
}

// --- Core API call wrapper ---

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error('Anthropic API client not configured (missing ANTHROPIC_AUTH_TOKEN)');
  }

  await waitForRateLimit();

  const message = await anthropic.messages.create({
    model: aiConfig.anthropicModel,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textBlock.text;
}

// --- Public API ---

export async function generateNarrative(
  prompt: string,
  context: GameContext,
): Promise<string> {
  const cacheKey = `narrative:${prompt}:${context.roomIndex}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const systemPrompt = `You are a creative narrative writer for an escape room game called "EscapeTwogether".
The game is cooperative — two players solve puzzles together. Write vivid, atmospheric prose.
Players so far: ${context.playerNames.join(' and ')}. Room: ${context.roomName} (room ${context.roomIndex + 1} of 3).
Puzzles solved: ${context.puzzlesSolved}/${context.totalPuzzles}. Keep responses under 3 sentences.`;

    const response = await callClaude(systemPrompt, prompt);
    setCachedResponse(cacheKey, response);
    return response;
  } catch (err) {
    console.error('AI narrative generation failed:', err);
    return getNarrativeFallback(context);
  }
}

export async function generateDialogue(
  character: string,
  situation: string,
  history: string[],
): Promise<string> {
  const cacheKey = `dialogue:${character}:${situation}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const systemPrompt = `You are writing dialogue for "${character}", a character in an escape room game.
The character speaks in a brief, mysterious, helpful manner. Keep to 1-2 short sentences.
Recent conversation: ${history.slice(-3).join(' | ')}`;

    const response = await callClaude(systemPrompt, situation);
    setCachedResponse(cacheKey, response);
    return response;
  } catch (err) {
    console.error('AI dialogue generation failed:', err);
    return `"I sense you're close to the answer. Keep searching..."`;
  }
}

export async function generateHint(
  puzzleType: string,
  puzzleState: Record<string, any>,
  hintLevel: number,
): Promise<string> {
  const cacheKey = `hint:${puzzleType}:${hintLevel}:${JSON.stringify(puzzleState).slice(0, 100)}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const levelDescriptions: Record<number, string> = {
      1: 'a vague thematic hint that nudges without revealing direction',
      2: 'a directional hint that points toward the right area or mechanic',
      3: 'a nearly explicit hint that almost gives away the answer',
    };

    const systemPrompt = `You are providing hint level ${hintLevel} for a "${puzzleType}" puzzle in an escape room game.
Give ${levelDescriptions[hintLevel] || 'a helpful hint'}. Keep it to 1 sentence.`;

    const userPrompt = `Puzzle type: ${puzzleType}. Current state: ${JSON.stringify(puzzleState).slice(0, 500)}. Give a level-${hintLevel} hint.`;

    const response = await callClaude(systemPrompt, userPrompt);
    setCachedResponse(cacheKey, response);
    return response;
  } catch (err) {
    console.error('AI hint generation failed:', err);
    return getHintFallback(hintLevel);
  }
}

export async function generateScenario(
  theme: string,
  difficulty: string,
  previousRooms: string[],
): Promise<RoomScenario> {
  const cacheKey = `scenario:${theme}:${difficulty}:${previousRooms.join(',')}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as RoomScenario;
    } catch {
      // fall through
    }
  }

  const fallback: RoomScenario = {
    name: `${theme} Room`,
    theme,
    description: `A mysterious ${theme.toLowerCase()} filled with secrets to uncover.`,
    entranceText: `You enter the ${theme.toLowerCase()}. Something feels different here...`,
    ambientDescriptions: [
      'The air feels thick with anticipation.',
      'Strange sounds echo through the room.',
      'Light flickers across the walls.',
    ],
    puzzleSuggestions: ['cipher-lock', 'split-screen'],
    difficulty: (difficulty as RoomScenario['difficulty']) || 'medium',
  };

  try {
    const systemPrompt = `You are designing a room for a cooperative escape room game "EscapeTwogether".
Generate a JSON object with these fields:
- name: creative room name (string)
- theme: the room theme (string)
- description: atmospheric description (string)
- entranceText: what players read when entering (string)
- ambientDescriptions: array of 3 atmospheric text snippets (string[])
- puzzleSuggestions: array of 2 puzzle types from: cipher-lock, split-screen, wire-connection, sequence-memory, map-navigator (string[])
- difficulty: "easy", "medium", or "hard"

Respond with valid JSON only.`;

    const userPrompt = `Theme: ${theme}. Difficulty: ${difficulty}. Previously completed rooms: ${previousRooms.join(', ') || 'none'}.`;

    const response = await callClaude(systemPrompt, userPrompt);

    // Strip markdown code fences if present
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');
    const scenario = JSON.parse(cleaned) as RoomScenario;
    setCachedResponse(cacheKey, cleaned);
    return scenario;
  } catch (err) {
    console.error('AI scenario generation failed:', err);
    return fallback;
  }
}

// --- Fallbacks (when API is unavailable) ---

function getNarrativeFallback(context: GameContext): string {
  const fallbacks = [
    `The ${context.roomName} stretches before you, its secrets waiting to be uncovered.`,
    `Shadows dance across the walls of the ${context.roomName}. Every clue brings you closer to freedom.`,
    `You and your partner stand ready. The ${context.roomName} holds the key to your escape.`,
  ];
  return fallbacks[context.roomIndex % fallbacks.length]!;
}

function getHintFallback(hintLevel: number): string {
  const fallbacks: Record<number, string> = {
    1: 'Look at the patterns more carefully...',
    2: 'Focus on the details that seem out of place.',
    3: 'Try combining the clues you have so far.',
  };
  return fallbacks[hintLevel] || fallbacks[3]!;
}

export function isAiAvailable(): boolean {
  return isAnthropicAvailable();
}

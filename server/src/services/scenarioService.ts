import { generateScenario } from './aiService.js';
import { ROOMS } from '../../../shared/types/gameFlow.js';
import type { RoomConfig } from '../../../shared/types/gameFlow.js';
import type { RoomSummary, DifficultySettings, ScenarioTemplate } from '../../../shared/types/scenario.js';

const VALID_PUZZLE_TYPES = [
  'cipher-lock',
  'split-screen',
  'wire-connection',
  'sequence-memory',
  'map-navigator',
];

const PUZZLE_LABELS: Record<string, string> = {
  'cipher-lock': 'Cipher Lock',
  'split-screen': 'Split Screen',
  'wire-connection': 'Wire Panel',
  'sequence-memory': 'Memory Seals',
  'map-navigator': 'Map Table',
};

const FALLBACK_TEMPLATES: ScenarioTemplate[] = ROOMS.map((room) => ({
  name: room.name,
  theme: room.theme ?? room.name.toLowerCase().replace(/^the /, ''),
  description: room.description,
  puzzles: room.puzzles,
  difficulty: {
    level: room.difficultyVariants[1].level,
    timeMultiplier: room.difficultyVariants[1].timeMultiplier,
    hintAllowance: room.difficultyVariants[1].hintAllowance,
    puzzleCount: room.puzzles.length,
    complexityScore: room.difficultyVariants[1].puzzleComplexity,
  },
  hotspots: room.hotspots,
}));

function calculateDifficulty(completedRooms: RoomSummary[]): DifficultySettings {
  if (completedRooms.length === 0) {
    return { level: 'easy', timeMultiplier: 1.0, hintAllowance: 4, puzzleCount: 1, complexityScore: 1 };
  }

  const avgTime = completedRooms.reduce((sum, r) => sum + r.timeSpentMs, 0) / completedRooms.length;
  const avgHints = completedRooms.reduce((sum, r) => sum + r.hintsUsed, 0) / completedRooms.length;
  const avgComms = completedRooms.reduce((sum, r) => sum + r.communicationFrequency, 0) / completedRooms.length;

  const speedFactor = avgTime < 60_000 ? 2 : avgTime < 120_000 ? 1 : 0;
  const hintFactor = avgHints <= 1 ? 2 : avgHints <= 3 ? 1 : 0;
  const commsFactor = avgComms >= 10 ? 1 : 0;
  const score = Math.min(10, 3 + completedRooms.length * 1.5 + speedFactor + hintFactor + commsFactor);

  if (score <= 4) {
    return { level: 'easy', timeMultiplier: 1.0, hintAllowance: 4, puzzleCount: 1, complexityScore: Math.round(score) };
  }
  if (score <= 7) {
    return { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleCount: 2, complexityScore: Math.round(score) };
  }
  return { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleCount: 3, complexityScore: Math.round(score) };
}

function buildHotspots(puzzles: string[]): RoomConfig['hotspots'] {
  if (puzzles.length === 1) {
    return puzzles.map((p) => ({
      id: p,
      label: PUZZLE_LABELS[p] ?? p,
      x: 32,
      y: 28,
      width: 36,
      height: 40,
    }));
  }
  if (puzzles.length === 2) {
    return puzzles.map((p, i) => ({
      id: p,
      label: PUZZLE_LABELS[p] ?? p,
      x: i === 0 ? 5 : 55,
      y: 15,
      width: 40,
      height: 38,
    }));
  }
  return puzzles.map((p, i) => ({
    id: p,
    label: PUZZLE_LABELS[p] ?? p,
    x: Math.round(i * (90 / puzzles.length) + 5),
    y: 5,
    width: Math.round(80 / puzzles.length),
    height: 40,
  }));
}

function scenarioToRoomConfig(scenario: { name: string; description: string; puzzleSuggestions: string[] }): RoomConfig {
  const puzzles = (scenario.puzzleSuggestions ?? [])
    .filter((p) => VALID_PUZZLE_TYPES.includes(p));
  if (puzzles.length === 0) puzzles.push('cipher-lock');

  return {
    name: scenario.name || 'Unknown Room',
    description: scenario.description || 'A mysterious room awaits...',
    puzzles,
    hotspots: buildHotspots(puzzles),
    targetDurationMinutes: 12,
    narrativeBeat: 'discovery' as const,
    difficultyVariants: [
      { level: 'easy' as const, timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
      { level: 'medium' as const, timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 },
      { level: 'hard' as const, timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 4 },
    ],
  };
}

const NARRATIVE_BEATS: RoomConfig['narrativeBeat'][] = ['introduction', 'discovery', 'tension', 'climax', 'resolution'];

function getFallbackRoom(completedRooms: RoomSummary[]): RoomConfig {
  const idx = Math.min(completedRooms.length, FALLBACK_TEMPLATES.length - 1);
  const template = FALLBACK_TEMPLATES[idx]!;
  return {
    name: template.name,
    description: template.description,
    puzzles: template.puzzles,
    hotspots: template.hotspots,
    targetDurationMinutes: 12,
    narrativeBeat: NARRATIVE_BEATS[idx] ?? 'discovery',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 },
      { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 4 },
    ],
  };
}

export async function generateNextRoom(
  completedRooms: RoomSummary[],
  playerNames: string[],
): Promise<RoomConfig> {
  const difficulty = calculateDifficulty(completedRooms);
  const previousNames = completedRooms.map((r) => r.name);
  const theme = difficulty.level === 'easy' ? 'mystery' : difficulty.level === 'medium' ? 'intrigue' : 'peril';

  try {
    const scenario = await generateScenario(theme, difficulty.level, previousNames);

    if (playerNames.length > 0 && scenario.entranceText) {
      scenario.entranceText = `${playerNames.join(' and ')}, ${scenario.entranceText.charAt(0).toLowerCase()}${scenario.entranceText.slice(1)}`;
    }

    const roomConfig = scenarioToRoomConfig(scenario);
    if (validateScenario(roomConfig)) {
      return roomConfig;
    }

    return getFallbackRoom(completedRooms);
  } catch (err) {
    console.error('Dynamic scenario generation failed, using fallback:', err);
    return getFallbackRoom(completedRooms);
  }
}

export function validateScenario(scenario: RoomConfig): boolean {
  if (!scenario.name || typeof scenario.name !== 'string' || scenario.name.trim().length === 0) {
    return false;
  }
  if (!scenario.description || typeof scenario.description !== 'string' || scenario.description.trim().length === 0) {
    return false;
  }
  if (!Array.isArray(scenario.puzzles) || scenario.puzzles.length === 0) {
    return false;
  }
  for (const puzzle of scenario.puzzles) {
    if (!VALID_PUZZLE_TYPES.includes(puzzle)) {
      return false;
    }
  }
  if (!Array.isArray(scenario.hotspots) || scenario.hotspots.length !== scenario.puzzles.length) {
    return false;
  }
  for (const hotspot of scenario.hotspots) {
    if (!hotspot.id || typeof hotspot.id !== 'string') return false;
    if (typeof hotspot.x !== 'number' || typeof hotspot.y !== 'number') return false;
    if (typeof hotspot.width !== 'number' || typeof hotspot.height !== 'number') return false;
  }
  const hotspotIds = scenario.hotspots.map((h) => h.id);
  for (const puzzle of scenario.puzzles) {
    if (!hotspotIds.includes(puzzle)) return false;
  }
  return true;
}

export function getScenarioTemplates(): ScenarioTemplate[] {
  return [...FALLBACK_TEMPLATES];
}

export { calculateDifficulty, FALLBACK_TEMPLATES, VALID_PUZZLE_TYPES };

export interface HotspotConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NarrativeBeat = 'introduction' | 'discovery' | 'tension' | 'climax' | 'resolution';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface RoomDifficultyVariant {
  level: DifficultyLevel;
  timeMultiplier: number;
  hintAllowance: number;
  puzzleComplexity: number;
}

export interface RoomConfig {
  name: string;
  description: string;
  puzzles: string[];
  hotspots: HotspotConfig[];
  theme?: string;
  targetDurationMinutes: number;
  narrativeBeat: NarrativeBeat;
  difficultyVariants: [RoomDifficultyVariant, RoomDifficultyVariant, RoomDifficultyVariant];
}

export interface DifficultyProgression {
  hintCost: number;
  wrongAttemptPenalty: number;
  slowThresholdMultiplier: number;
  speedBonusThreshold: number;
}

export const DIFFICULTY_PROGRESSION: DifficultyProgression = {
  hintCost: 5,
  wrongAttemptPenalty: 2,
  slowThresholdMultiplier: 1.5,
  speedBonusThreshold: 0.7,
};

export const ROOMS: RoomConfig[] = [
  {
    name: 'The Invitation',
    description: 'A mysterious letter arrives at your door, sealed with an ancient cipher. The elegant script hints at an adventure that awaits beyond the veil of the ordinary world...',
    puzzles: ['cipher-lock'],
    hotspots: [
      { id: 'cipher-lock', label: 'Sealed Letter', x: 32, y: 28, width: 36, height: 40 },
    ],
    theme: 'mysterious-letter',
    targetDurationMinutes: 7,
    narrativeBeat: 'introduction',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.0, hintAllowance: 4, puzzleComplexity: 1 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 2 },
      { level: 'hard', timeMultiplier: 0.8, hintAllowance: 2, puzzleComplexity: 3 },
    ],
  },
  {
    name: 'The Workshop',
    description: 'A dusty workshop filled with old machinery and half-finished contraptions. Mechanical devices guard the path forward, demanding both careful observation and precise communication...',
    puzzles: ['split-screen', 'wire-connection'],
    hotspots: [
      { id: 'split-screen', label: 'Mechanical Display', x: 5, y: 15, width: 40, height: 38 },
      { id: 'wire-connection', label: 'Wire Panel', x: 55, y: 15, width: 40, height: 38 },
    ],
    theme: 'inventor-workshop',
    targetDurationMinutes: 14,
    narrativeBeat: 'discovery',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 4 },
      { level: 'hard', timeMultiplier: 0.9, hintAllowance: 2, puzzleComplexity: 5 },
    ],
  },
  {
    name: 'The Laboratory',
    description: 'A sterile laboratory glows with chemical vials and tangled wires. Experimental technology hums with dormant power, waiting for the right sequence to reactivate...',
    puzzles: ['sequence-memory', 'cipher-lock'],
    hotspots: [
      { id: 'sequence-memory', label: 'Memory Console', x: 5, y: 15, width: 40, height: 38 },
      { id: 'cipher-lock', label: 'Cipher Terminal', x: 55, y: 15, width: 40, height: 38 },
    ],
    theme: 'abandoned-lab',
    targetDurationMinutes: 14,
    narrativeBeat: 'tension',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 3 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 5 },
      { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 7 },
    ],
  },
  {
    name: 'The Labyrinth',
    description: 'The walls shift and rearrange in an ancient maze. Fog obscures the path ahead, and only by combining your unique perspectives can you navigate the passages within...',
    puzzles: ['map-navigator', 'split-screen'],
    hotspots: [
      { id: 'map-navigator', label: 'Ancient Map', x: 5, y: 15, width: 40, height: 38 },
      { id: 'split-screen', label: 'Dual Viewport', x: 55, y: 15, width: 40, height: 38 },
    ],
    theme: 'shifting-maze',
    targetDurationMinutes: 16,
    narrativeBeat: 'climax',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.3, hintAllowance: 5, puzzleComplexity: 4 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 6 },
      { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 8 },
    ],
  },
  {
    name: 'The Vault',
    description: 'A grand vault door looms before you, sealed by the ultimate lock combining every mechanism you have encountered. This final challenge tests all the skills and trust you have built together...',
    puzzles: ['wire-connection', 'sequence-memory', 'map-navigator'],
    hotspots: [
      { id: 'wire-connection', label: 'Power Grid', x: 5, y: 5, width: 28, height: 40 },
      { id: 'sequence-memory', label: 'Memory Seals', x: 36, y: 5, width: 28, height: 40 },
      { id: 'map-navigator', label: 'Passage Map', x: 67, y: 5, width: 28, height: 40 },
    ],
    theme: 'grand-vault',
    targetDurationMinutes: 18,
    narrativeBeat: 'resolution',
    difficultyVariants: [
      { level: 'easy', timeMultiplier: 1.4, hintAllowance: 5, puzzleComplexity: 5 },
      { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 7 },
      { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 9 },
    ],
  },
];

export const TOTAL_ROOMS = ROOMS.length;

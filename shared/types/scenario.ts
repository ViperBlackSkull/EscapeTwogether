import type { RoomConfig } from './gameFlow.js';

export { RoomConfig };

export interface RoomSummary {
  name: string;
  timeSpentMs: number;
  hintsUsed: number;
  puzzlesSolved: number;
  totalPuzzlesInRoom: number;
  communicationFrequency: number;
}

export interface DifficultySettings {
  level: 'easy' | 'medium' | 'hard';
  timeMultiplier: number;
  hintAllowance: number;
  puzzleCount: number;
  complexityScore: number;
}

export interface ScenarioTemplate {
  name: string;
  theme: string;
  description: string;
  puzzles: string[];
  difficulty: DifficultySettings;
  hotspots: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface GameContext {
  roomName: string;
  roomIndex: number;
  playerNames: string[];
  previousEvents: GameEventEntry[];
  puzzlesSolved: number;
  totalPuzzles: number;
  elapsedTimeMs: number;
}

export interface GameEventEntry {
  type: string;
  message: string;
  timestamp: number;
}

export interface RoomScenario {
  name: string;
  theme: string;
  description: string;
  entranceText: string;
  ambientDescriptions: string[];
  puzzleSuggestions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CachedResponse {
  prompt: string;
  response: string;
  timestamp: number;
}

export interface GameEvent {
  type: string;
  message: string;
  timestamp: number;
}

export interface RoomNarrative {
  roomName: string;
  description: string;
  entranceText: string;
  ambientDescriptions: string[];
  characterDialogue: string[];
}

export interface PuzzleNarrative {
  backstory: string;
  clueText: string;
  successMessage: string;
  hintFlavorTexts: string[];
}

export interface CompletionNarrative {
  victoryMessage: string;
  summaryText: string;
}

export interface NarrativeCacheEntry {
  key: string;
  narrative: RoomNarrative | PuzzleNarrative | string;
  timestamp: number;
}

export interface RoomNarrativeEvent {
  roomNarrative: RoomNarrative;
  puzzleNarratives: Record<string, PuzzleNarrative>;
}

export interface CompletionNarrativeEvent {
  message: string;
  totalTime: number;
  puzzlesSolved: number;
  totalPuzzles: number;
  hintsUsed: number;
}

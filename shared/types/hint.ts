export interface Hint {
  text: string;
  level: number;
  maxLevel: number;
  relationshipPointsCost: number;
  cooldownRemaining: number;
}

export interface HintUsage {
  level: number;
  lastUsedAt: number;
  totalHintsUsed: number;
  relationshipPointsSpent: number;
}

export interface HintRequest {
  roomId: string;
  puzzleId: string;
  playerId: string;
}

export interface PuzzleMetrics {
  timeElapsed: number;        // ms
  hintsUsed: number;
  wrongAttempts: number;
  messagesExchanged: number;
}

export interface PuzzleScore {
  puzzleType: string;
  roomIndex: number;
  metrics: PuzzleMetrics;
  basePoints: number;
  deductions: number;
  bonusPoints: number;
  finalScore: number;
}

export interface RoomScore {
  roomIndex: number;
  roomName: string;
  puzzleScores: PuzzleScore[];
  totalScore: number;
  targetDurationMinutes: number;
  actualDurationMs: number;
}

export type CommunicationRating =
  | 'Silent Partners'
  | 'Occasional Check-ins'
  | 'Good Communicators'
  | 'Great Communicators';

export type RelationshipTier =
  | 'New Acquaintances'
  | 'Good Partners'
  | 'Trusted Allies'
  | 'Soulmates';

export interface CommunicationStats {
  totalMessages: number;
  averageResponseTimeMs: number;
  messagesPerMinute: number;
  rating: CommunicationRating;
}

export interface GameScore {
  roomScores: RoomScore[];
  totalScore: number;
  totalTimeMs: number;
  communicationStats: CommunicationStats;
  relationshipTier: RelationshipTier;
  cooperationScore: number;   // 0-100: how evenly players contributed
}

export interface ScoreUpdateEvent {
  puzzleScore: PuzzleScore;
  cumulativeScore: number;
  relationshipTier: RelationshipTier;
}

export interface FinalScoreEvent {
  gameScore: GameScore;
}

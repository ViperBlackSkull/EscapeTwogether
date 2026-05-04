import type { PuzzleState as SharedPuzzleState } from '../../../shared/types/puzzle.js';
import type { RoomNarrativeEvent, CompletionNarrativeEvent } from '../../../shared/types/narrative.js';
export type { RoomNarrativeEvent, CompletionNarrativeEvent, PuzzleNarrative } from '../../../shared/types/narrative.js';
import type { ScoreUpdateEvent, FinalScoreEvent } from '../../../shared/types/scoring.js';

export type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
export type { RoomConfig, HotspotConfig } from '../../../shared/types/gameFlow.js';
export type { PuzzleScore, RoomScore, GameScore, CommunicationStats, CommunicationRating, RelationshipTier, ScoreUpdateEvent, FinalScoreEvent } from '../../../shared/types/scoring.js';
export { ROOMS, TOTAL_ROOMS } from '../../../shared/types/gameFlow.js';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  currentRoom: string | null;
}

export type RoomState = 'waiting' | 'playing' | 'completed' | 'transitioning';

export type PuzzleState = SharedPuzzleState;

export interface GameRoom {
  id: string;
  players: Player[];
  state: RoomState;
  puzzles: Record<string, PuzzleState>;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  puzzleSolveTimes: Record<string, number>;
  currentRoomIndex: number;
  roomPausedAt: number | null;
  totalPausedMs: number;
}

export type ChatMessageType = 'chat' | 'system' | 'puzzle-hint' | 'puzzle-info';

export interface ChatMessage {
  sender: string;
  senderId: string;
  message: string;
  timestamp: number;
  type: ChatMessageType;
}

export interface GameEvent {
  type: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface RoomTransitionEvent {
  roomIndex: number;
  roomName: string;
  roomDescription: string;
  countdown: number;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface PuzzleActionPayload {
  roomId: string;
  puzzleId: string;
  action: string;
  data: Record<string, any>;
}

export interface ReconnectInfo {
  playerId: string;
  playerName: string;
  roomId: string;
  reconnectionToken: string;
}

// Client perspective: ServerToClient = what we listen for
export interface ServerToClientEvents {
  'room-updated': (room: GameRoom) => void;
  'puzzle-updated': (puzzle: PuzzleState) => void;
  'chat-message': (message: ChatMessage) => void;
  'game-event': (event: GameEvent) => void;
  'error': (message: string) => void;
  'room-joined': (room: GameRoom, player: Player) => void;
  'player-assigned': (playerId: string) => void;
  'room-transition': (event: RoomTransitionEvent) => void;
  'partner-typing': () => void;
  'room-narrative': (data: RoomNarrativeEvent) => void;
  'completion-narrative': (data: CompletionNarrativeEvent) => void;
  'score-update': (data: ScoreUpdateEvent) => void;
  'final-score': (data: FinalScoreEvent) => void;
  'partner-disconnected': (playerName: string) => void;
  'partner-reconnected': (playerName: string) => void;
  'reconnection-offer': (info: ReconnectInfo) => void;
  'chat-history': (messages: ChatMessage[]) => void;
}

// Client perspective: ClientToServer = what we emit
export interface ClientToServerEvents {
  'create-room': (playerName: string) => void;
  'join-room': (payload: JoinRoomPayload) => void;
  'leave-room': () => void;
  'puzzle-action': (payload: PuzzleActionPayload) => void;
  'chat-message': (message: string) => void;
  'start-game': () => void;
  'advance-room': () => void;
  'typing': () => void;
  'reconnect': (token: string) => void;
}

// Shared puzzle types used by both client and server

export type PlayerRole = string;

export interface PuzzleAction {
  type: string;
  playerRole: PlayerRole;
  data: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  updatedState?: Record<string, any>;
  solved?: boolean;
}

export interface PuzzleData {
  roles: Record<string, PlayerRole>;
  [key: string]: any;
}

export interface PuzzleState {
  id: string;
  type: string;
  solved: boolean;
  data: Record<string, any>;
}

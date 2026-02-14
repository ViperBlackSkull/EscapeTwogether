// EscapeTogether - Base TypeScript Type Definitions

// ============================================
// Player Types
// ============================================

export type PlayerRole = 'explorer' | 'analyst';

export interface Player {
	id: string;
	name: string;
	role: PlayerRole;
	isHost: boolean;
	connected: boolean;
	lastSeen: number;
}

// ============================================
// Room Types
// ============================================

export type RoomId = 'attic' | 'clock_tower' | 'garden_conservatory';

export interface Room {
	id: RoomId;
	name: string;
	description: string;
	puzzles: string[]; // Puzzle IDs
	completed: boolean;
}

// ============================================
// Puzzle Types
// ============================================

export interface PuzzleState {
	puzzleId: string;
	solved: boolean;
	attempts: number;
	currentPhase?: number; // For multi-step puzzles
	data: Record<string, unknown>; // Puzzle-specific state
}

export interface PuzzleHint {
	tier: number;
	text: string;
	triggerAttempts: number;
}

export interface PuzzleDefinition {
	id: string;
	roomId: RoomId;
	name: string;
	description: string;
	requiredRoles: PlayerRole[]; // Which roles can interact
	solutionValidator: (state: PuzzleState) => boolean;
	hints: PuzzleHint[];
}

// ============================================
// Game State Types
// ============================================

export type GamePhase = 'lobby' | 'playing' | 'paused' | 'completed';

export interface GameState {
	// Session info
	sessionId: string;
	roomCode: string;
	createdAt: number;

	// Players
	players: {
		playerA: Player | null;
		playerB: Player | null;
	};

	// Game progress
	currentPhase: GamePhase;
	currentRoom: RoomId;
	roomsCompleted: RoomId[];

	// Puzzles
	puzzleStates: Record<string, PuzzleState>;

	// Timing
	startedAt: number | null;
	pausedAt: number | null;
	totalPauseTime: number;
	timeLimit: number | null; // null = no limit

	// Statistics
	hintsUsed: number;
	totalAttempts: number;
}

// ============================================
// Inventory Types
// ============================================

export interface InventoryItem {
	id: string;
	name: string;
	description: string;
	icon: string; // Icon identifier or URL
	examinable: boolean;
	examineText?: string;
}

export interface PlayerInventory {
	playerId: string;
	items: InventoryItem[];
	maxCapacity: number;
}

// ============================================
// Photo System Types
// ============================================

export interface SharedPhoto {
	id: string;
	url: string;
	capturedBy: string; // Player ID
	timestamp: number;
	annotations?: PhotoAnnotation[];
}

export interface PhotoAnnotation {
	id: string;
	type: 'arrow' | 'circle' | 'text' | 'highlight';
	data: Record<string, unknown>;
	createdBy: string;
}

// ============================================
// Couple Profile Types
// ============================================

export type MilestoneType = 'first_date' | 'engaged' | 'married' | 'anniversary' | 'just_because' | 'other';
export type CollaborationStyle = 'one_leads' | 'independent_explore' | 'talk_through';
export type ChallengePreference = 'relaxed' | 'balanced' | 'challenge_seeking';
export type HintPreference = 'early' | 'when_stuck' | 'never';
export type ProblemSolvingApproach = 'visual' | 'logical' | 'intuitive' | 'mixed';
export type StressTolerance = 'low' | 'medium' | 'high';
export type CommunicationPattern = 'competitive' | 'collaborative' | 'playful';

export interface CoupleProfile {
	// Basic Info
	names: {
		playerA: string;
		playerB: string;
	};
	milestone: MilestoneType;

	// Uploaded Media
	uploadedPhotos: {
		id: string;
		url: string;
		caption?: string;
		timestamp: number;
	}[];

	// Play Style (from quiz)
	playStyle: {
		collaboration: CollaborationStyle;
		challengePreference: ChallengePreference;
		hintPreference: HintPreference;
	};

	// AI-Derived Insights (learned during gameplay)
	learnedBehaviors: {
		problemSolvingApproach: {
			playerA: ProblemSolvingApproach;
			playerB: ProblemSolvingApproach;
		};
		stressTolerance: StressTolerance;
		communicationPattern: CommunicationPattern;
		dominanceBalance: number; // 0 = A dominates, 1 = B dominates, 0.5 = equal
	};

	// Progress Tracking
	sessionHistory: {
		date: number;
		roomsCompleted: number;
		totalTime: number;
		hintsUsed: number;
		difficultyTier: number; // 1-5
	}[];
}

// ============================================
// AI Customization Types
// ============================================

export interface AIFrustrationIndicators {
	rapidFailures: number; // Quick repeated wrong answers
	hintRequests: number;
	inactivityDuration: number;
	negativeLanguageDetected: boolean;
}

export interface AIFlowIndicators {
	steadyProgress: boolean;
	successfulCoordination: number;
	positiveChatRatio: number;
}

export interface AICurrentMetrics {
	timeOnCurrentPuzzle: number;
	frustrationIndicators: AIFrustrationIndicators;
	flowIndicators: AIFlowIndicators;
}

export interface AITunableParameters {
	timeLimits: {
		extended: boolean;
		multiplier: number; // 1.0 = normal, 1.5 = +50% time
	};
	hintThreshold: {
		baseTrigger: string; // e.g., "time_elapsed > 120s"
		adjustedTrigger: string; // e.g., "time_elapsed > 90s"
	};
	clueSubtlety: number; // 0-100, lower = more obvious
	coordinationTolerance: number; // Timing windows (ms)
	informationAsymmetry: number; // How obscure B's info is vs A's
}

export interface AIAdjustmentTriggers {
	makeEasier: {
		timeStuck: number; // Seconds with no progress
		frustrationScore: number;
		failedAttempts: number;
	};
	makeHarder: {
		rapidSolution: number; // Solved under X seconds
		zeroHintsUsed: boolean;
		perfectCoordination: number;
	};
}

export interface AICustomizations {
	// Real-time Metrics
	currentMetrics: AICurrentMetrics;

	// Adjustment Parameters
	tunableParameters: AITunableParameters;

	// Adjustment Rules
	adjustmentTriggers: AIAdjustmentTriggers;

	// Personalization
	coupleProfile: CoupleProfile | null;

	// Difficulty tier (1-5)
	currentDifficultyTier: number;
}

// ============================================
// Socket Event Types
// ============================================

export interface ServerToClientEvents {
	'room:created': (response: { success: boolean; room: { code: string } }) => void;
	'room:joined': (response: { success: boolean; room: { code: string }; players: Player[] }) => void;
	'player:joined': (player: Player) => void;
	'player:left': (playerId: string) => void;
	'game:start': (gameState: GameState) => void;
	'game:state': (gameState: GameState) => void;
	'game:pause': () => void;
	'game:resume': () => void;
	'puzzle:sync': (puzzleState: PuzzleState) => void;
	'puzzle:solved': (puzzleId: string) => void;
	'error': (message: string) => void;
}

export interface ClientToServerEvents {
	'create-room': (data: { playerName: string }, callback: (response: { success: boolean; room?: { code: string }; error?: string }) => void) => void;
	'join-room': (data: { roomCode: string; playerName: string }, callback: (response: { success: boolean; room?: { code: string }; error?: string }) => void) => void;
	'start-game': () => void;
	'puzzle:attempt': (data: { puzzleId: string; solution: unknown }) => void;
	'game:pause': () => void;
	'game:resume': () => void;
	'disconnect': () => void;
}

// ============================================
// Utility Types
// ============================================

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Rect extends Position, Size {}

export interface Timer {
	startTime: number;
	duration: number;
	paused: boolean;
	pausedAt: number | null;
}

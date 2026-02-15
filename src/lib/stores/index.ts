// EscapeTwogether - Store Exports

export {
	// Core store
	gameState,

	// Derived stores
	gamePhase,
	currentRoom,
	roomCode,
	players,
	bothPlayersPresent,
	gameElapsedTime,
	isGameInProgress,
	isGamePaused,
	isGameCompleted,
	puzzlesSolved,

	// Helper functions
	setRoomCode,
	setSessionId,
	setPlayer,
	setGamePhase,
	setCurrentRoom,
	completeRoom,
	updatePuzzleState,
	solvePuzzle,
	incrementPuzzleAttempts,
	useHint,
	reset,

	// WebSocket integration
	handleStateUpdate,
	handleFullStateUpdate,
	subscribeToStateUpdates,

	// Types
	type GameState,
	type Player,
	type GamePhase,
	type PuzzleState,
	type InventoryItem
} from './gameState';

// Role system exports
export {
	// Constants
	ROLE_COLORS,
	ROLE_CAPABILITIES,
	ROLE_ICONS,

	// Notification store
	roleNotification,

	// Role assignment functions
	assignRoles,
	swapRoles,
	getCurrentRole,
	getPlayerByRole,
	canPerformRoleAction,

	// Store actions
	initializeRoles,
	performRoleSwap,
	onPuzzleSolved,

	// Derived stores
	currentPlayerRole,
	explorerPlayer,
	analystPlayer,
	rolesAssigned,

	// Types
	type PlayerRole
} from './roles';

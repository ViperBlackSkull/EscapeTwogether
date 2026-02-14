// EscapeTogether - Store Exports

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

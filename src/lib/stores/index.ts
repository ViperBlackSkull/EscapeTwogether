// EscapeTwogether - Store Exports

// Game Manager export
export { getGameManager, destroyGameManager, GameManager } from '../gameManager';

// Audio system exports
export {
	soundManager,
	audioState,
	isMuted,
	masterVolume,
	musicVolume,
	sfxVolume,
	ambienceVolume,
	type SoundId,
	type RoomId,
	type SoundConfig
} from '$lib/audio';

// Audio helper exports
export {
	playButtonClick,
	playButtonHover,
	playNotification,
	playPuzzleSolved,
	playPuzzleAttempt,
	playPuzzleError,
	playPuzzleHint,
	playRoomTransition,
	playDoorOpen,
	playDoorLocked,
	transitionToRoom,
	setRoomAmbient,
	playItemPickup,
	playItemUse,
	playPlayerJoined,
	playPlayerLeft,
	playMessageSent,
	playMessageReceived,
	playVictoryMusic,
	playDefeatMusic,
	playGameStart,
	playGameEnd,
	playExplorationMusic,
	playTensionMusic,
	stopMusic,
	stopAmbient,
	toggleMute,
	setMasterVolume,
	setMusicVolume,
	setSfxVolume,
	setAmbientVolume,
	handlePuzzleEvent,
	handleRoomChange,
	initializeAudio,
	isAudioInitialized,
	createUIAudioHooks,
	createPuzzleAudioHooks,
	createMultiplayerAudioHooks
} from '$lib/audioHelpers';

// Preferences store exports
export {
	// Core store
	preferences,

	// Derived stores
	hasCompletedQuiz,
	hasPlayerNames,
	primaryPlayerName,
	difficultyDescription,
	collaborationDescription,
	hintPreferenceDescription,

	// Types
	type StoredPreferences
} from './preferences';

// Re-export preference-related types from main types.ts for convenience
export type { CollaborationStyle, ChallengePreference, HintPreference } from '$lib/types';

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

// Role utilities export
export {
	getRoleClasses,
	getRoleStyles,
	canRolePerformAction,
	getRolePrompt,
	getRoleIcon,
	getRoleColor,
	formatRoleName,
	getCooperationMessage,
	requiresRoleInteraction,
	getRoleAriaLabel
} from '$lib/utils/roleUtils';

// Hint tracking store exports
export {
	hintTracking,
	totalHintPenalty,
	hintsUsedThisSession,
	hasHintsRemaining,
	useHint,
	resetPuzzleHints,
	resetAllHints,
	getHintsForPuzzle as getStoreHintsForPuzzle,
	getHintPenalty,
	formatPenalty,
	hasHintBeenUsed,
	getHintsUsedForPuzzle
} from './hintTracking';

export type { HintUsageRecord } from './hintTracking';

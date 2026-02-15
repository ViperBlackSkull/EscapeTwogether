// EscapeTwogether - Game State Store
// Svelte store for synchronized game state that updates via WebSocket events

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type {
	GameState,
	Player,
	RoomId,
	GamePhase,
	PuzzleState,
	InventoryItem
} from '$lib/types';

// ============================================
// Constants
// ============================================

const LOCAL_STORAGE_KEY = 'escapetogether_game_state';
const PERSIST_DEBOUNCE_MS = 500;

// ============================================
// Default State Factory
// ============================================

function createDefaultGameState(): GameState {
	return {
		// Session info
		sessionId: '',
		roomCode: '',
		createdAt: Date.now(),

		// Players
		players: {
			playerA: null,
			playerB: null
		},

		// Game progress
		currentPhase: 'lobby',
		currentRoom: 'attic',
		roomsCompleted: [],

		// Puzzles
		puzzleStates: {},

		// Timing
		startedAt: null,
		pausedAt: null,
		totalPauseTime: 0,
		timeLimit: null,

		// Statistics
		hintsUsed: 0,
		totalAttempts: 0
	};
}

// ============================================
// Core Store
// ============================================

function createGameStateStore() {
	// Initialize with default state
	const initialState = loadFromLocalStorage();
	const { subscribe, set, update }: Writable<GameState> = writable(initialState);

	// Debounce timer for localStorage persistence
	let persistTimeout: ReturnType<typeof setTimeout> | null = null;

	// Persist to localStorage with debouncing
	function persist(state: GameState): void {
		if (!browser) return;

		// Clear any pending persist
		if (persistTimeout) {
			clearTimeout(persistTimeout);
		}

		// Debounce the persist operation
		persistTimeout = setTimeout(() => {
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
			} catch (error) {
				console.error('Failed to persist game state to localStorage:', error);
			}
		}, PERSIST_DEBOUNCE_MS);
	}

	// Load from localStorage
	function loadFromLocalStorage(): GameState {
		if (!browser) return createDefaultGameState();

		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as Partial<GameState>;
				// Merge with defaults to ensure all fields exist
				return {
					...createDefaultGameState(),
					...parsed
				};
			}
		} catch (error) {
			console.error('Failed to load game state from localStorage:', error);
		}

		return createDefaultGameState();
	}

	// Clear persisted state
	function clearPersistedState(): void {
		if (!browser) return;

		try {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		} catch (error) {
			console.error('Failed to clear persisted game state:', error);
		}
	}

	return {
		subscribe,
		set: (state: GameState) => {
			set(state);
			persist(state);
		},
		update: (updater: (state: GameState) => GameState) => {
			update((state) => {
				const newState = updater(state);
				persist(newState);
				return newState;
			});
		},

		// Reset to default state
		reset: () => {
			const defaultState = createDefaultGameState();
			set(defaultState);
			clearPersistedState();
		},

		// Clear persisted data
		clearPersisted: clearPersistedState,

		// Force persist current state
		forcePersist: () => {
			const state = get({ subscribe });
			if (browser) {
				try {
					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
				} catch (error) {
					console.error('Failed to persist game state:', error);
				}
			}
		}
	};
}

// Create the store instance
export const gameState = createGameStateStore();

// ============================================
// Derived Stores (Computed Values)
// ============================================

// Current game phase
export const gamePhase: Readable<GamePhase> = derived(
	gameState,
	($state) => $state.currentPhase
);

// Current room ID
export const currentRoom: Readable<RoomId> = derived(
	gameState,
	($state) => $state.currentRoom
);

// Room code
export const roomCode: Readable<string> = derived(
	gameState,
	($state) => $state.roomCode
);

// Players array (convenience)
export const players: Readable<(Player | null)[]> = derived(
	gameState,
	($state) => [$state.players.playerA, $state.players.playerB]
);

// Check if both players are present
export const bothPlayersPresent: Readable<boolean> = derived(
	gameState,
	($state) => $state.players.playerA !== null && $state.players.playerB !== null
);

// Game time elapsed (in seconds)
export const gameElapsedTime: Readable<number | null> = derived(
	gameState,
	($state) => {
		if (!$state.startedAt) return null;
		if ($state.currentPhase === 'paused' && $state.pausedAt) {
			return Math.floor(($state.pausedAt - $state.startedAt - $state.totalPauseTime) / 1000);
		}
		return Math.floor((Date.now() - $state.startedAt - $state.totalPauseTime) / 1000);
	}
);

// Is game in progress
export const isGameInProgress: Readable<boolean> = derived(
	gameState,
	($state) => $state.currentPhase === 'playing'
);

// Is game paused
export const isGamePaused: Readable<boolean> = derived(
	gameState,
	($state) => $state.currentPhase === 'paused'
);

// Is game completed
export const isGameCompleted: Readable<boolean> = derived(
	gameState,
	($state) => $state.currentPhase === 'completed'
);

// Total puzzles solved
export const puzzlesSolved: Readable<number> = derived(
	gameState,
	($state) => Object.values($state.puzzleStates).filter((p) => p.solved).length
);

// ============================================
// Helper Functions for State Updates
// ============================================

// Set room code
export function setRoomCode(code: string): void {
	gameState.update((state) => ({
		...state,
		roomCode: code
	}));
}

// Set session ID
export function setSessionId(sessionId: string): void {
	gameState.update((state) => ({
		...state,
		sessionId
	}));
}

// Add or update a player
export function setPlayer(playerSlot: 'playerA' | 'playerB', player: Player | null): void {
	gameState.update((state) => ({
		...state,
		players: {
			...state.players,
			[playerSlot]: player
		}
	}));
}

// Set game phase
export function setGamePhase(phase: GamePhase): void {
	gameState.update((state) => {
		const updates: Partial<GameState> = { currentPhase: phase };

		if (phase === 'playing' && !state.startedAt) {
			updates.startedAt = Date.now();
		}

		if (phase === 'paused' && state.currentPhase === 'playing') {
			updates.pausedAt = Date.now();
		}

		if (phase === 'playing' && state.currentPhase === 'paused' && state.pausedAt) {
			const pauseDuration = Date.now() - state.pausedAt;
			updates.totalPauseTime = state.totalPauseTime + pauseDuration;
			updates.pausedAt = null;
		}

		return { ...state, ...updates };
	});
}

// Set current room
export function setCurrentRoom(roomId: RoomId): void {
	gameState.update((state) => ({
		...state,
		currentRoom: roomId
	}));
}

// Complete a room
export function completeRoom(roomId: RoomId): void {
	gameState.update((state) => {
		if (state.roomsCompleted.includes(roomId)) return state;
		return {
			...state,
			roomsCompleted: [...state.roomsCompleted, roomId]
		};
	});
}

// Update puzzle state
export function updatePuzzleState(puzzleId: string, updates: Partial<PuzzleState>): void {
	gameState.update((state) => {
		const existingState = state.puzzleStates[puzzleId] || {
			puzzleId,
			solved: false,
			attempts: 0,
			data: {}
		};

		return {
			...state,
			puzzleStates: {
				...state.puzzleStates,
				[puzzleId]: {
					...existingState,
					...updates
				}
			}
		};
	});
}

// Mark puzzle as solved
export function solvePuzzle(puzzleId: string): void {
	updatePuzzleState(puzzleId, { solved: true });
}

// Increment puzzle attempts
export function incrementPuzzleAttempts(puzzleId: string): void {
	gameState.update((state) => {
		const existingState = state.puzzleStates[puzzleId];
		if (!existingState) return state;

		return {
			...state,
			totalAttempts: state.totalAttempts + 1,
			puzzleStates: {
				...state.puzzleStates,
				[puzzleId]: {
					...existingState,
					attempts: existingState.attempts + 1
				}
			}
		};
	});
}

// Use a hint
export function useHint(): void {
	gameState.update((state) => ({
		...state,
		hintsUsed: state.hintsUsed + 1
	}));
}

// Reset game state to defaults
export function reset(): void {
	gameState.reset();
}

// ============================================
// WebSocket Integration (Stub)
// ============================================

// This will be connected to the actual socket in socket.ts
// For now, we provide the interface for handling state updates

// Handle incoming state update from WebSocket
export function handleStateUpdate(newState: Partial<GameState>): void {
	gameState.update((state) => ({
		...state,
		...newState
	}));
}

// Handle full state replacement from WebSocket
export function handleFullStateUpdate(newState: GameState): void {
	gameState.set(newState);
}

// Subscribe to state updates (for WebSocket sync)
// Returns an unsubscribe function
export function subscribeToStateUpdates(callback: (state: GameState) => void): () => void {
	return gameState.subscribe(callback);
}

// ============================================
// Export Types
// ============================================

export type { GameState, Player, GamePhase, PuzzleState, InventoryItem };

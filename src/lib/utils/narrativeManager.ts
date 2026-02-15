/**
 * Narrative Manager
 *
 * Integrates narrative triggers into the game flow.
 * Works with GameManager to show story moments at key gameplay events.
 */

import { writable, derived, get } from 'svelte/store';
import type { RoomId } from '$lib/types';
import { getNarrativeForEvent, createNarrativeEvent, shouldTriggerNarrative, getNarrativeType, NarrativeTrigger } from './narrativeIntegration';

// ============================================
// TYPES
// ============================================

interface NarrativeState {
	isOpen: boolean;
	currentNarrative: string;
	roomId: RoomId;
	narrativeType: 'intro' | 'discovery' | 'completion';
	puzzleId?: string;
	history: NarrativeEvent[];
}

interface NarrativeActions {
	showNarrative: (event: NarrativeEvent) => void;
	closeNarrative: () => void;
	triggerRoomIntro: (roomId: RoomId) => void;
	triggerPuzzleComplete: (roomId: RoomId, puzzleId: string) => void;
	triggerRoomComplete: (roomId: RoomId) => void;
	triggerGameComplete: () => void;
	triggerDiscovery: (roomId: RoomId, puzzleId: string) => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: NarrativeState = {
	isOpen: false,
	currentNarrative: '',
	roomId: 'attic',
	narrativeType: 'intro',
	history: []
};

// ============================================
// STORE
// ============================================

function createNarrativeManager() {
	const { subscribe, set, update } = writable<NarrativeState>(initialState);

	/**
	 * Show a narrative event
	 */
	const showNarrativeAction = (event: NarrativeEvent): void => {
		if (!shouldTriggerNarrative(event)) {
			return;
		}

		const narrativeText = getNarrativeForEvent(event);
		if (!narrativeText) {
			return;
		}

		update(state => ({
			...state,
			isOpen: true,
			currentNarrative: narrativeText,
			roomId: event.roomId,
			narrativeType: getNarrativeType(event.type),
			puzzleId: event.puzzleId,
			history: [...state.history, event]
		}));
	};

	/**
	 * Close the current narrative
	 */
	const closeNarrativeAction = (): void => {
		update(state => ({
			...state,
			isOpen: false
		}));
	};

	/**
	 * Trigger room introduction narrative
	 */
	const triggerRoomIntroAction = (roomId: RoomId): void => {
		const event = createNarrativeEvent('room_enter', roomId);
		showNarrativeAction(event);
	};

	/**
	 * Trigger puzzle completion narrative
	 */
	const triggerPuzzleCompleteAction = (roomId: RoomId, puzzleId: string): void => {
		const event = createNarrativeEvent('puzzle_complete', roomId, puzzleId);
		showNarrativeAction(event);
	};

	/**
	 * Trigger room completion narrative
	 */
	const triggerRoomCompleteAction = (roomId: RoomId): void => {
		const event = createNarrativeEvent('room_complete', roomId);
		showNarrativeAction(event);
	};

	/**
	 * Trigger game completion narrative
	 */
	const triggerGameCompleteAction = (): void => {
		const event = createNarrativeEvent('game_complete', 'garden_conservatory');
		showNarrativeAction(event);
	};

	/**
	 * Trigger discovery narrative (for plot-critical puzzles)
	 */
	const triggerDiscoveryAction = (roomId: RoomId, puzzleId: string): void => {
		const event = createNarrativeEvent('discovery', roomId, puzzleId);
		showNarrativeAction(event);
	};

	return {
		subscribe,

		// Actions
		showNarrative: showNarrativeAction,
		closeNarrative: closeNarrativeAction,
		triggerRoomIntro: triggerRoomIntroAction,
		triggerPuzzleComplete: triggerPuzzleCompleteAction,
		triggerRoomComplete: triggerRoomCompleteAction,
		triggerGameComplete: triggerGameCompleteAction,
		triggerDiscovery: triggerDiscoveryAction
	};
}

export const narrativeManager = createNarrativeManager();

// ============================================
// DERIVED STORES
// ============================================

export const currentNarrative = derived(
	narrativeManager,
	($narrativeManager) => ({
		text: $narrativeManager.currentNarrative,
		roomId: $narrativeManager.roomId,
		type: $narrativeManager.narrativeType,
		puzzleId: $narrativeManager.puzzleId
	})
);

export const narrativeHistory = derived(
	narrativeManager,
	($narrativeManager) => $narrativeManager.history
);

// ============================================
// PUZZLES THAT TRIGGER DISCOVERY NARRATIVES
// ============================================

const DISCOVERY_PUZZLE_IDS = new Set([
	'room1-love-letter-cipher',
	'room2_bell_codes',
	'hybridization'
]);

/**
 * Check if a puzzle should trigger a discovery narrative
 */
export function shouldTriggerDiscovery(puzzleId: string): boolean {
	return DISCOVERY_PUZZLE_IDS.has(puzzleId);
}

// ============================================
// INTEGRATION HELPERS
// ============================================

/**
 * Hook narrative manager into GameManager events
 * Call this from your game component to enable automatic narrative triggers
 */
export function setupNarrativeIntegration(gameManager: any): void {
	// We'll use event listeners or method overrides to hook into game events
	// This is a placeholder for the integration pattern

	// Example: Override transitionToRoom to show room intro
	const originalTransitionToRoom = gameManager.transitionToRoom.bind(gameManager);
	gameManager.transitionToRoom = (roomId: RoomId) => {
		originalTransitionToRoom(roomId);
		// Show room intro after transition
		setTimeout(() => {
			narrativeManager.triggerRoomIntro(roomId);
		}, 500);
	};

	// Example: Hook into puzzle completion
	const originalSolvePuzzle = gameManager.solvePuzzle.bind(gameManager);
	gameManager.solvePuzzle = (puzzleId: string) => {
		const state = get(gameManager.gameState || {});
		const roomId = state.currentRoom || 'attic';

		originalSolvePuzzle(puzzleId);

		// Show puzzle completion narrative
		narrativeManager.triggerPuzzleComplete(roomId, puzzleId);

		// Check for discovery narrative
		if (shouldTriggerDiscovery(puzzleId)) {
			setTimeout(() => {
				narrativeManager.triggerDiscovery(roomId, puzzleId);
			}, 2000);
		}
	};

	// Example: Hook into room completion
	const originalCompleteCurrentRoom = gameManager.completeCurrentRoom.bind(gameManager);
	gameManager.completeCurrentRoom = () => {
		const state = get(gameManager.gameState || {});
		const roomId = state.currentRoom || 'attic';

		// Show room completion narrative before transition
		narrativeManager.triggerRoomComplete(roomId);
	};
}

export default narrativeManager;

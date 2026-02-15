/**
 * Hint Tracking Store
 *
 * Manages hint usage, penalties, and tracking across all puzzles.
 * Integrates with the game state store to apply time penalties.
 */

import { writable, derived } from 'svelte/store';
import type { PuzzleHint } from '$lib/types';
import { getHintsForPuzzle, calculateHintPenalty } from '$lib/data/hints';

// ============================================
// TYPES
// ============================================

interface HintUsageRecord {
	puzzleId: string;
	tier: number;
	timestamp: number;
	text: string;
	penaltyApplied: boolean;
}

interface HintTrackingState {
	hintsUsed: HintUsageRecord[];
	totalPenaltyMinutes: number;
	currentPuzzleHints: PuzzleHint[];
	hintsRemainingForCurrentPuzzle: number;
}

interface HintActions {
	useHint: (puzzleId: string, tier: number) => void;
	resetPuzzleHints: (puzzleId: string) => void;
	resetAllHints: () => void;
	getHintsForPuzzle: (puzzleId: string) => PuzzleHint[];
	getHintPenalty: (puzzleId: string) => number;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: HintTrackingState = {
	hintsUsed: [],
	totalPenaltyMinutes: 0,
	currentPuzzleHints: [],
	hintsRemainingForCurrentPuzzle: 3
};

// ============================================
// STORE
// ============================================

function createHintTrackingStore() {
	const { subscribe, set, update } = writable<HintTrackingState>(initialState);

	// Get available hints for a specific puzzle
	const getHintsForPuzzleAction = (puzzleId: string): PuzzleHint[] => {
		return getHintsForPuzzle(puzzleId);
	};

	// Use a hint (record it and apply penalty)
	const useHintAction = (puzzleId: string, tier: number) => {
		const hints = getHintsForPuzzle(puzzleId);
		const hint = hints.find(h => h.tier === tier);

		if (!hint) return;

		update(state => {
			// Check if this hint was already used
			const alreadyUsed = state.hintsUsed.some(
				h => h.puzzleId === puzzleId && h.tier === tier
			);

			if (alreadyUsed) return state;

			// Record the hint usage
			const newRecord: HintUsageRecord = {
				puzzleId,
				tier,
				timestamp: Date.now(),
				text: hint.text,
				penaltyApplied: true
			};

			// Calculate new penalty
			const newTotalPenalty = state.totalPenaltyMinutes + 2; // 2 minutes per hint

			return {
				...state,
				hintsUsed: [...state.hintsUsed, newRecord],
				totalPenaltyMinutes: newTotalPenalty,
				hintsRemainingForCurrentPuzzle: Math.max(0, state.hintsRemainingForCurrentPuzzle - 1)
			};
		});
	};

	// Reset hints for a specific puzzle (when puzzle is solved)
	const resetPuzzleHintsAction = (puzzleId: string) => {
		update(state => ({
			...state,
			currentPuzzleHints: [],
			hintsRemainingForCurrentPuzzle: 3
		}));
	};

	// Reset all hints (new game)
	const resetAllHintsAction = () => {
		set(initialState);
	};

	// Get penalty for a specific puzzle
	const getHintPenaltyAction = (puzzleId: string): number => {
		let penalty = 0;
		const state = get();
		state.hintsUsed
			.filter(h => h.puzzleId === puzzleId)
			.forEach(() => {
				penalty += 2;
			});
		return penalty;
	};

	// Helper to get current state (for internal use)
	function get(): HintTrackingState {
		let currentState: HintTrackingState | undefined;
		const unsubscribe = subscribe(state => {
			currentState = state;
		});
		unsubscribe();
		return currentState!;
	}

	// Derived stores
	const hintsUsedForCurrentPuzzle = derived(
		subscribe,
		($state: HintTrackingState, currentPuzzleId: string | null) => {
			if (!currentPuzzleId) return [];
			return $state.hintsUsed.filter(h => h.puzzleId === currentPuzzleId);
		}
	);

	const canUseHint = derived(
		subscribe,
		($state: HintTrackingState) => $state.hintsRemainingForCurrentPuzzle > 0
	);

	return {
		subscribe,

		// Actions
		useHint: useHintAction,
		resetPuzzleHints: resetPuzzleHintsAction,
		resetAllHints: resetAllHintsAction,
		getHintsForPuzzle: getHintsForPuzzleAction,
		getHintPenalty: getHintPenaltyAction
	};
}

export const hintTracking = createHintTrackingStore();

// ============================================
// DERIVED STORES
// ============================================

export const totalHintPenalty = derived(
	hintTracking,
	($hintTracking) => $hintTracking.totalPenaltyMinutes
);

export const hintsUsedThisSession = derived(
	hintTracking,
	($hintTracking) => $hintTracking.hintsUsed.length
);

export const hasHintsRemaining = derived(
	hintTracking,
	($hintTracking) => $hintTracking.hintsRemainingForCurrentPuzzle > 0
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get formatted penalty string (e.g., "+6 minutes")
 */
export function formatPenalty(minutes: number): string {
	return minutes > 0 ? `+${minutes} minutes` : 'No penalty';
}

/**
 * Check if a specific hint tier has been used
 */
export function hasHintBeenUsed(puzzleId: string, tier: number): boolean {
	let used = false;
	const unsubscribe = hintTracking.subscribe(state => {
		used = state.hintsUsed.some(
			h => h.puzzleId === puzzleId && h.tier === tier
		);
	});
	unsubscribe();
	return used;
}

/**
 * Get all hints used for a specific puzzle
 */
export function getHintsUsedForPuzzle(puzzleId: string): HintUsageRecord[] {
	let hints: HintUsageRecord[] = [];
	const unsubscribe = hintTracking.subscribe(state => {
		hints = state.hintsUsed.filter(h => h.puzzleId === puzzleId);
	});
	unsubscribe();
	return hints;
}

export default hintTracking;

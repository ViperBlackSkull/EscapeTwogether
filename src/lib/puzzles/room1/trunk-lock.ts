// Puzzle 4: Trunk Lock
// Coordination puzzle where Player A controls dials 1&3, Player B controls dials 2&4
// Must set all dials correctly simultaneously for 3 seconds

import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Re-export puzzle ID for test compatibility
export { ROOM1_PUZZLE_IDS };

// Symbol options for the dials (romantic/nostalgic symbols)
export type DialSymbol =
	| 'heart'
	| 'rose'
	| 'key'
	| 'star'
	| 'moon'
	| 'dove'
	| 'anchor'
	| 'infinity';

// Dial definition
export interface TrunkDial {
	id: string;
	position: number; // 1-4
	currentSymbol: DialSymbol;
	correctSymbol: DialSymbol;
	controlledBy: 'explorer' | 'analyst'; // Which player controls this dial
}

// Puzzle state
export interface TrunkLockState {
	dials: TrunkDial[];
	allCorrect: boolean;
	correctDuration: number; // ms that all dials have been correct
	requiredDuration: number; // ms required to unlock (3000)
	completed: boolean;
	unlockProgress: number; // 0-100
}

// Available symbols
const ALL_SYMBOLS: DialSymbol[] = [
	'heart', 'rose', 'key', 'star', 'moon', 'dove', 'anchor', 'infinity'
];

// Correct combination (spells a romantic pattern)
const CORRECT_COMBINATION: DialSymbol[] = ['heart', 'rose', 'key', 'star'];

// Hints
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Each player controls different dials. You must coordinate to set all four dials correctly at the same time.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'The combination represents a love story: Heart (love), Rose (romance), Key (trust), Star (forever).',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'The correct combination is: Heart, Rose, Key, Star. Hold all dials in position for 3 seconds to unlock.',
		triggerAttempts: 10
	}
];

// Symbol display names and descriptions
export const SYMBOL_INFO: Record<DialSymbol, { name: string; description: string }> = {
	heart: { name: 'Heart', description: 'A symbol of love and devotion' },
	rose: { name: 'Rose', description: 'A symbol of romance and passion' },
	key: { name: 'Key', description: 'A symbol of trust and unlocking hearts' },
	star: { name: 'Star', description: 'A symbol of eternal guidance and wishes' },
	moon: { name: 'Moon', description: 'A symbol of mystery and gentle nights' },
	dove: { name: 'Dove', description: 'A symbol of peace and fidelity' },
	anchor: { name: 'Anchor', description: 'A symbol of stability and steadfast love' },
	infinity: { name: 'Infinity', description: 'A symbol of endless love' }
};

// Create initial state
export function createInitialState(): TrunkLockState {
	const dials: TrunkDial[] = [
		{
			id: 'dial-1',
			position: 1,
			currentSymbol: 'moon', // Start with wrong symbol
			correctSymbol: CORRECT_COMBINATION[0],
			controlledBy: 'explorer'
		},
		{
			id: 'dial-2',
			position: 2,
			currentSymbol: 'dove',
			correctSymbol: CORRECT_COMBINATION[1],
			controlledBy: 'analyst'
		},
		{
			id: 'dial-3',
			position: 3,
			currentSymbol: 'anchor',
			correctSymbol: CORRECT_COMBINATION[2],
			controlledBy: 'explorer'
		},
		{
			id: 'dial-4',
			position: 4,
			currentSymbol: 'infinity',
			correctSymbol: CORRECT_COMBINATION[3],
			controlledBy: 'analyst'
		}
	];

	return {
		dials,
		allCorrect: false,
		correctDuration: 0,
		requiredDuration: 3000,
		completed: false,
		unlockProgress: 0
	};
}

// Get next symbol in cycle
export function getNextSymbol(current: DialSymbol): DialSymbol {
	const currentIndex = ALL_SYMBOLS.indexOf(current);
	const nextIndex = (currentIndex + 1) % ALL_SYMBOLS.length;
	return ALL_SYMBOLS[nextIndex];
}

// Get previous symbol in cycle
export function getPreviousSymbol(current: DialSymbol): DialSymbol {
	const currentIndex = ALL_SYMBOLS.indexOf(current);
	const prevIndex = (currentIndex - 1 + ALL_SYMBOLS.length) % ALL_SYMBOLS.length;
	return ALL_SYMBOLS[prevIndex];
}

// Rotate dial (by player who controls it)
export function rotateDial(
	state: TrunkLockState,
	dialId: string,
	direction: 'forward' | 'backward',
	playerRole: PlayerRole
): TrunkLockState {
	const dial = state.dials.find(d => d.id === dialId);

	// Check if this player can control this dial
	if (!dial || dial.controlledBy !== playerRole) {
		return state;
	}

	if (direction === 'forward') {
		dial.currentSymbol = getNextSymbol(dial.currentSymbol);
	} else {
		dial.currentSymbol = getPreviousSymbol(dial.currentSymbol);
	}

	// Reset correct duration when dial changes
	state.correctDuration = 0;
	state.unlockProgress = 0;

	return updateAllCorrect({ ...state });
}

// Check if all dials are correct
export function updateAllCorrect(state: TrunkLockState): TrunkLockState {
	state.allCorrect = state.dials.every(d => d.currentSymbol === d.correctSymbol);
	return state;
}

// Update lock timer (called every tick)
export function updateLockTimer(state: TrunkLockState, deltaMs: number): TrunkLockState {
	if (state.completed) return state;

	if (state.allCorrect) {
		state.correctDuration += deltaMs;
		state.unlockProgress = Math.min(
			100,
			(state.correctDuration / state.requiredDuration) * 100
		);

		// Complete after required duration
		if (state.correctDuration >= state.requiredDuration) {
			state.completed = true;
			state.unlockProgress = 100;
		}
	} else {
		// Reset timer if not all correct
		state.correctDuration = 0;
		state.unlockProgress = 0;
	}

	return { ...state };
}

// Set dial directly (for testing or quick setting)
export function setDial(
	state: TrunkLockState,
	dialId: string,
	symbol: DialSymbol,
	playerRole: PlayerRole
): TrunkLockState {
	const dial = state.dials.find(d => d.id === dialId);

	if (!dial || dial.controlledBy !== playerRole) {
		return state;
	}

	dial.currentSymbol = symbol;
	state.correctDuration = 0;

	return updateAllCorrect({ ...state });
}

// Validate solution
export function validateSolution(state: PuzzleState): boolean {
	const puzzleState = state.data as unknown as TrunkLockState;
	if (!puzzleState) return false;
	return puzzleState.completed;
}

// Get player-specific view
export function getPlayerView(state: TrunkLockState, role: PlayerRole): {
	controlledDials: TrunkDial[];
	partnerDials: TrunkDial[];
	allCorrect: boolean;
	unlockProgress: number;
	completed: boolean;
	correctDuration: number;
	requiredDuration: number;
} {
	const controlledDials = state.dials.filter(d => d.controlledBy === role);
	const partnerDials = state.dials.filter(d => d.controlledBy !== role);

	return {
		controlledDials,
		partnerDials,
		allCorrect: state.allCorrect,
		unlockProgress: state.unlockProgress,
		completed: state.completed,
		correctDuration: state.correctDuration,
		requiredDuration: state.requiredDuration
	};
}

// Get all available symbols for dial UI
export function getAvailableSymbols(): DialSymbol[] {
	return [...ALL_SYMBOLS];
}

// Puzzle definition
export const TrunkLockPuzzle: PuzzleDefinition = {
	id: ROOM1_PUZZLE_IDS.TRUNK_LOCK,
	roomId: 'attic',
	name: 'Trunk Lock',
	description: 'Work together to set all four dial symbols correctly. Each player controls different dials.',
	requiredRoles: ['explorer', 'analyst'],
	solutionValidator: validateSolution,
	hints: HINTS
};

export default TrunkLockPuzzle;

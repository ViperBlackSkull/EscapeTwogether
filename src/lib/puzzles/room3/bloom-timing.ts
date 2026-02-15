/**
 * Puzzle 6: Bloom Timing
 * Coordination timing puzzle where players must touch flowers in sequence
 * Goal: Alternate between players to touch 8 flowers in the correct pattern
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Flower in the sequence
export interface BloomFlower {
	id: string;
	name: string;
	position: number; // 1-8 position in sequence
	color: string;
	touched: boolean;
	touchedBy: PlayerRole | null;
	touchedAt: number | null;
	icon: string;
}

// Touch attempt record
export interface TouchAttempt {
	flowerId: string;
	player: PlayerRole;
	correct: boolean;
	timestamp: number;
}

// Puzzle state
export interface BloomTimingState extends PuzzleState {
	data: {
		// All flowers in the sequence
		flowers: BloomFlower[];
		// Current expected player turn
		expectedPlayer: PlayerRole;
		// Current expected position in sequence
		expectedPosition: number;
		// Touch attempt history
		touchHistory: TouchAttempt[];
		// Successfully touched count
		correctCount: number;
		// Wrong flower attempts
		wrongFlowerAttempts: number;
		// Pattern hint revealed
		patternRevealed: boolean;
		// Time window for coordination (ms)
		coordinationWindow: number;
		// Last touch timestamp
		lastTouchTime: number | null;
	};
}

// Flower definitions
const FLOWERS: Omit<BloomFlower, 'touched' | 'touchedBy' | 'touchedAt'>[] = [
	{ id: 'flower_rose', name: 'Rose', position: 1, color: '#e74c3c', icon: 'rose' },
	{ id: 'flower_lily', name: 'Lily', position: 2, color: '#f1c40f', icon: 'lily' },
	{ id: 'flower_tulip', name: 'Tulip', position: 3, color: '#9b59b6', icon: 'tulip' },
	{ id: 'flower_daisy', name: 'Daisy', position: 4, color: '#ecf0f1', icon: 'daisy' },
	{ id: 'flower_orchid', name: 'Orchid', position: 5, color: '#e91e63', icon: 'orchid' },
	{ id: 'flower_violet', name: 'Violet', position: 6, color: '#8e44ad', icon: 'violet' },
	{ id: 'flower_sunflower', name: 'Sunflower', position: 7, color: '#f39c12', icon: 'sunflower' },
	{ id: 'flower_iris', name: 'Iris', position: 8, color: '#3498db', icon: 'iris' }
];

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'The flowers must bloom in order. Notice whose turn it is - players must alternate! A, then B, then A again...',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'Watch the numbers on the flowers. They show the sequence order. Player A touches odd numbers, Player B touches even numbers!',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'The pattern is simple: Alternate turns! Rose(1-A), Lily(2-B), Tulip(3-A), Daisy(4-B), Orchid(5-A), Violet(6-B), Sunflower(7-A), Iris(8-B)',
		triggerAttempts: 10
	}
];

// Initialize puzzle state
export function createBloomTimingState(): BloomTimingState {
	return {
		puzzleId: 'room3_bloom_timing',
		solved: false,
		attempts: 0,
		data: {
			flowers: FLOWERS.map(f => ({
				...f,
				touched: false,
				touchedBy: null,
				touchedAt: null
			})),
			expectedPlayer: 'explorer', // Player A starts
			expectedPosition: 1,
			touchHistory: [],
			correctCount: 0,
			wrongFlowerAttempts: 0,
			patternRevealed: false,
			coordinationWindow: 5000, // 5 seconds to respond
			lastTouchTime: null
		}
	};
}

// Validate solution
function validateBloomTiming(state: PuzzleState): boolean {
	const data = state.data as unknown as BloomTimingState['data'];
	return data.correctCount === 8;
}

// Touch a flower
export function touchFlower(
	state: BloomTimingState,
	flowerId: string,
	player: PlayerRole
): {
	state: BloomTimingState;
	success: boolean;
	message: string;
	nextExpectedPlayer: PlayerRole;
	nextExpectedPosition: number;
	puzzleComplete: boolean;
} {
	const flower = state.data.flowers.find(f => f.id === flowerId);

	if (!flower) {
		return {
			state,
			success: false,
			message: 'Unknown flower!',
			nextExpectedPlayer: state.data.expectedPlayer,
			nextExpectedPosition: state.data.expectedPosition,
			puzzleComplete: false
		};
	}

	if (flower.touched) {
		return {
			state,
			success: false,
			message: 'This flower has already bloomed!',
			nextExpectedPlayer: state.data.expectedPlayer,
			nextExpectedPosition: state.data.expectedPosition,
			puzzleComplete: false
		};
	}

	const now = Date.now();
	const attempt: TouchAttempt = {
		flowerId,
		player,
		correct: false,
		timestamp: now
	};

	// Check if it's the correct player's turn
	const isCorrectPlayer = player === state.data.expectedPlayer;

	// Check if it's the correct flower in sequence
	const isCorrectFlower = flower.position === state.data.expectedPosition;

	const isCorrect = isCorrectPlayer && isCorrectFlower;

	// Update flower state
	const newFlowers = state.data.flowers.map(f => {
		if (f.id === flowerId) {
			return {
				...f,
				touched: isCorrect,
				touchedBy: isCorrect ? player : null,
				touchedAt: isCorrect ? now : null
			};
		}
		return f;
	});

	// Update attempt record
	attempt.correct = isCorrect;
	const newHistory = [...state.data.touchHistory, attempt];

	// Calculate new state
	const newCorrectCount = isCorrect ? state.data.correctCount + 1 : state.data.correctCount;
	const newWrongAttempts = isCorrect ? state.data.wrongFlowerAttempts : state.data.wrongFlowerAttempts + 1;

	// Determine next expected player/position
	let nextPlayer = state.data.expectedPlayer;
	let nextPosition = state.data.expectedPosition;

	if (isCorrect) {
		nextPlayer = state.data.expectedPlayer === 'explorer' ? 'analyst' : 'explorer';
		nextPosition = state.data.expectedPosition + 1;
	}

	// Check if puzzle is complete
	const puzzleComplete = newCorrectCount === 8;

	// Reveal pattern hint after enough correct touches
	const shouldRevealPattern = newCorrectCount >= 4 && !state.data.patternRevealed;

	const newState: BloomTimingState = {
		...state,
		attempts: state.attempts + 1,
		solved: puzzleComplete,
		data: {
			...state.data,
			flowers: newFlowers,
			touchHistory: newHistory,
			correctCount: newCorrectCount,
			wrongFlowerAttempts: newWrongAttempts,
			expectedPlayer: nextPlayer,
			expectedPosition: nextPosition,
			patternRevealed: shouldRevealPattern || state.data.patternRevealed,
			lastTouchTime: now
		}
	};

	// Generate message
	let message: string;
	if (puzzleComplete) {
		message = 'All flowers have bloomed in perfect harmony! The garden celebrates your coordination!';
	} else if (isCorrect) {
		message = `The ${flower.name} blooms beautifully! ${nextPlayer === 'explorer' ? 'Explorer' : 'Analyst'}'s turn.`;
	} else if (!isCorrectPlayer) {
		message = `Not your turn! It's ${state.data.expectedPlayer === 'explorer' ? 'Explorer' : 'Analyst'}'s turn to touch.`;
	} else {
		message = `Wrong flower! Look for flower number ${state.data.expectedPosition}.`;
	}

	return {
		state: newState,
		success: isCorrect,
		message,
		nextExpectedPlayer: nextPlayer,
		nextExpectedPosition: nextPosition,
		puzzleComplete
	};
}

// Get current turn info for display
export function getTurnInfo(state: BloomTimingState): {
	expectedPlayer: PlayerRole;
	expectedPosition: number;
	progress: string;
	nextFlower: BloomFlower | null;
} {
	const nextFlower = state.data.flowers.find(
		f => f.position === state.data.expectedPosition && !f.touched
	);

	return {
		expectedPlayer: state.data.expectedPlayer,
		expectedPosition: state.data.expectedPosition,
		progress: `${state.data.correctCount}/8 flowers bloomed`,
		nextFlower: nextFlower || null
	};
}

// Check if coordination timeout occurred
export function checkCoordinationTimeout(state: BloomTimingState): {
	timedOut: boolean;
	timeSinceLastTouch: number;
} {
	if (!state.data.lastTouchTime) {
		return { timedOut: false, timeSinceLastTouch: 0 };
	}

	const elapsed = Date.now() - state.data.lastTouchTime;
	return {
		timedOut: elapsed > state.data.coordinationWindow * 2, // Double window for leniency
		timeSinceLastTouch: elapsed
	};
}

// Reset puzzle to try again
export function resetBloomTiming(state: BloomTimingState): BloomTimingState {
	return {
		...state,
		attempts: 0,
		data: {
			...state.data,
			flowers: FLOWERS.map(f => ({
				...f,
				touched: false,
				touchedBy: null,
				touchedAt: null
			})),
			expectedPlayer: 'explorer',
			expectedPosition: 1,
			touchHistory: [],
			correctCount: 0,
			wrongFlowerAttempts: 0,
			patternRevealed: false,
			lastTouchTime: null
		}
	};
}

// Get hint based on attempts
export function getHint(state: BloomTimingState): PuzzleHint | null {
	// Show pattern hint after enough progress
	if (state.data.correctCount >= 4) {
		return {
			tier: 3,
			text: 'Pattern revealed: ALTERNATE TURNS! Player A takes odd numbers, Player B takes even numbers.',
			triggerAttempts: 0
		};
	}

	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Get flowers visible to player (all visible, but current target highlighted)
export function getFlowersForPlayer(
	state: BloomTimingState,
	_role: PlayerRole
): Array<BloomFlower & { isNext: boolean; isPlayerTurn: boolean }> {
	const isPlayerTurn = true; // Both can see, but only correct player should touch

	return state.data.flowers.map(f => ({
		...f,
		isNext: f.position === state.data.expectedPosition && !f.touched,
		isPlayerTurn
	}));
}

// Export puzzle definition
export const bloomTimingPuzzle: PuzzleDefinition = {
	id: 'room3_bloom_timing',
	roomId: 'garden_conservatory',
	name: 'Bloom Timing',
	description: 'Touch the flowers in sequence, alternating turns between players. Perfect coordination creates perfect blooms!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateBloomTiming,
	hints: HINTS
};

export default bloomTimingPuzzle;

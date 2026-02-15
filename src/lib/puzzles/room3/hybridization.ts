/**
 * Puzzle 4: Hybridization
 * Memory-based breeding puzzle where cross-pollination sequences are shown briefly
 * Goal: Remember parent plants and complete 3 successful crosses
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';
import { puzzleImages } from '$lib/assets/images';

// Visual assets for this puzzle
export const HYBRIDIZATION_ASSETS = {
	// Mysterious glyphs for plant symbols
	plantSymbols: puzzleImages.mysteriousGlyphs,

	// Treasure map for garden layout
	gardenLayout: puzzleImages.treasureMap,

	// Cipher wheel for breeding combinations
	breedingWheel: puzzleImages.cipherWheel,

	// Clue photograph for plant images
	plantReference: puzzleImages.cluePhotograph,

	// Ornate frame
	ornateFrame: puzzleImages.victorianOrnament,

	// Magnifying glass for plant inspection
	inspection: puzzleImages.magnifyingGlass
} as const;

// Parent plant types
export interface ParentPlant {
	id: string;
	name: string;
	color: string;
	shape: string;
	scent: string;
	icon: string;
}

// Offspring result
export interface Offspring {
	id: string;
	name: string;
	parent1Id: string;
	parent2Id: string;
	resultingColor: string;
	resultingShape: string;
	icon: string;
}

// Cross-pollination attempt
export interface CrossAttempt {
	parent1Id: string;
	parent2Id: string;
	correct: boolean;
	timestamp: number;
}

// Round state for the memory game
export interface RoundState {
	roundNumber: number;
	targetOffspring: Offspring;
	shownParents: ParentPlant[];
	showPhase: boolean;
	showDuration: number; // milliseconds
	attempts: number;
}

// Puzzle state
export interface HybridizationState extends PuzzleState {
	data: {
		// All available parent plants
		parentPlants: ParentPlant[];
		// All possible offspring
		offspring: Offspring[];
		// Current round
		currentRound: RoundState | null;
		// Completed successful crosses
		successfulCrosses: CrossAttempt[];
		// Rounds needed to win
		roundsToWin: number;
		// Currently selected parents for cross
		selectedParents: string[];
		// Wrong cross attempts counter
		wrongCrossAttempts: number;
		// Show previous round hint
		showPreviousRoundHint: boolean;
	};
}

// Parent plant definitions
const PARENT_PLANTS: ParentPlant[] = [
	{
		id: 'rose_crimson',
		name: 'Crimson Rose',
		color: 'red',
		shape: 'layered',
		scent: 'sweet',
		icon: 'rose_red'
	},
	{
		id: 'lily_white',
		name: 'Moon Lily',
		color: 'white',
		shape: 'trumpet',
		scent: 'delicate',
		icon: 'lily_white'
	},
	{
		id: 'tulip_gold',
		name: 'Golden Tulip',
		color: 'yellow',
		shape: 'cup',
		scent: 'fresh',
		icon: 'tulip_yellow'
	},
	{
		id: 'violet_purple',
		name: 'Royal Violet',
		color: 'purple',
		shape: 'cluster',
		scent: 'intense',
		icon: 'violet_purple'
	},
	{
		id: 'daisy_white',
		name: 'Innocent Daisy',
		color: 'white',
		shape: 'ray',
		scent: 'light',
		icon: 'daisy_white'
	},
	{
		id: 'orchid_pink',
		name: 'Dawn Orchid',
		color: 'pink',
		shape: 'exotic',
		scent: 'mysterious',
		icon: 'orchid_pink'
	}
];

// Offspring definitions (what parents create what)
const OFFSPRING: Offspring[] = [
	{
		id: 'offspring_roselily',
		name: 'Crimson Moon',
		parent1Id: 'rose_crimson',
		parent2Id: 'lily_white',
		resultingColor: 'pink-white',
		resultingShape: 'layered-trumpet',
		icon: 'rose_lily'
	},
	{
		id: 'offspring_sunset',
		name: 'Sunset Bloom',
		parent1Id: 'rose_crimson',
		parent2Id: 'tulip_gold',
		resultingColor: 'orange',
		resultingShape: 'layered-cup',
		icon: 'sunset_bloom'
	},
	{
		id: 'offspring_starlight',
		name: 'Starlight Cascade',
		parent1Id: 'lily_white',
		parent2Id: 'orchid_pink',
		resultingColor: 'silver-pink',
		resultingShape: 'exotic-trumpet',
		icon: 'starlight'
	},
	{
		id: 'offspring_twilight',
		name: 'Twilight Wonder',
		parent1Id: 'violet_purple',
		parent2Id: 'tulip_gold',
		resultingColor: 'amber-purple',
		resultingShape: 'cluster-cup',
		icon: 'twilight'
	},
	{
		id: 'offspring_innocence',
		name: 'Pure Heart',
		parent1Id: 'lily_white',
		parent2Id: 'daisy_white',
		resultingColor: 'ivory',
		resultingShape: 'trumpet-ray',
		icon: 'pure_heart'
	},
	{
		id: 'offspring_passion',
		name: 'Passion\'s Blaze',
		parent1Id: 'rose_crimson',
		parent2Id: 'orchid_pink',
		resultingColor: 'magenta',
		resultingShape: 'layered-exotic',
		icon: 'passion_blaze'
	}
];

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Watch carefully which plants combine to create each hybrid. The parent colors often blend in the offspring.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'Look at the offspring\'s resulting color - it\'s usually a blend of its parents. Red + Yellow = Orange, White + Pink = Silver-Pink.',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'Crimson Moon: Rose + Lily. Sunset Bloom: Rose + Tulip. Starlight: Lily + Orchid. Remember the pairs!',
		triggerAttempts: 10
	}
];

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// Get parents for an offspring
function getParentsForOffspring(offspring: Offspring, plants: ParentPlant[]): ParentPlant[] {
	const parent1 = plants.find(p => p.id === offspring.parent1Id);
	const parent2 = plants.find(p => p.id === offspring.parent2Id);
	return [parent1, parent2].filter((p): p is ParentPlant => p !== undefined);
}

// Initialize puzzle state
export function createHybridizationState(): HybridizationState {
	return {
		puzzleId: 'room3_hybridization',
		solved: false,
		attempts: 0,
		data: {
			parentPlants: PARENT_PLANTS,
			offspring: OFFSPRING,
			currentRound: null,
			successfulCrosses: [],
			roundsToWin: 3,
			selectedParents: [],
			wrongCrossAttempts: 0,
			showPreviousRoundHint: false
		}
	};
}

// Validate solution
function validateHybridization(state: PuzzleState): boolean {
	const data = state.data as unknown as HybridizationState['data'];
	return data.successfulCrosses.length >= data.roundsToWin;
}

// Start a new round
export function startRound(state: HybridizationState): HybridizationState {
	// Select a random offspring that hasn't been successfully crossed yet
	const availableOffspring = state.data.offspring.filter(
		o => !state.data.successfulCrosses.some(c =>
			(c.parent1Id === o.parent1Id && c.parent2Id === o.parent2Id) ||
			(c.parent1Id === o.parent2Id && c.parent2Id === o.parent1Id)
		)
	);

	if (availableOffspring.length === 0) {
		// All offspring have been crossed, puzzle complete
		return {
			...state,
			solved: true
		};
	}

	const targetOffspring = availableOffspring[Math.floor(Math.random() * availableOffspring.length)];
	const shownParents = getParentsForOffspring(targetOffspring, state.data.parentPlants);

	// Increase difficulty with each round (shorter show time)
	// BUT keep minimum at 3 seconds for fairness
	const baseDuration = 5000; // 5 seconds base
	const roundNumber = state.data.successfulCrosses.length;
	const showDuration = Math.max(3000, baseDuration - (roundNumber * 500)); // Min 3 seconds

	return {
		...state,
		data: {
			...state.data,
			currentRound: {
				roundNumber: roundNumber + 1,
				targetOffspring,
				shownParents,
				showPhase: true,
				showDuration,
				attempts: 0
			},
			selectedParents: [],
			showPreviousRoundHint: roundNumber > 0
		}
	};
}

// End the show phase (after timer)
export function endShowPhase(state: HybridizationState): HybridizationState {
	if (!state.data.currentRound) return state;

	return {
		...state,
		data: {
			...state.data,
			currentRound: {
				...state.data.currentRound,
				showPhase: false
			}
		}
	};
}

// Select a parent plant
export function selectParent(state: HybridizationState, plantId: string): HybridizationState {
	if (!state.data.currentRound || state.data.currentRound.showPhase) {
		return state;
	}

	const newSelected = [...state.data.selectedParents];

	if (newSelected.includes(plantId)) {
		// Deselect
		const index = newSelected.indexOf(plantId);
		newSelected.splice(index, 1);
	} else if (newSelected.length < 2) {
		// Select if not already have 2
		newSelected.push(plantId);
	}

	return {
		...state,
		data: {
			...state.data,
			selectedParents: newSelected
		}
	};
}

// Attempt cross-pollination
export function attemptCross(state: HybridizationState): {
	state: HybridizationState;
	success: boolean;
	message: string;
	offspring: Offspring | null;
	puzzleComplete: boolean;
} {
	if (!state.data.currentRound || state.data.selectedParents.length !== 2) {
		return {
			state,
			success: false,
			message: 'Select two parent plants to cross.',
			offspring: null,
			puzzleComplete: false
		};
	}

	const [parent1Id, parent2Id] = state.data.selectedParents;
	const target = state.data.currentRound.targetOffspring;

	// Check if the cross is correct (order doesn't matter)
	const isCorrect =
		(parent1Id === target.parent1Id && parent2Id === target.parent2Id) ||
		(parent1Id === target.parent2Id && parent2Id === target.parent1Id);

	const newCross: CrossAttempt = {
		parent1Id,
		parent2Id,
		correct: isCorrect,
		timestamp: Date.now()
	};

	const newSuccessfulCrosses = isCorrect
		? [...state.data.successfulCrosses, newCross]
		: state.data.successfulCrosses;

	const newState: HybridizationState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			successfulCrosses: newSuccessfulCrosses,
			selectedParents: [],
			wrongCrossAttempts: isCorrect
				? state.data.wrongCrossAttempts
				: state.data.wrongCrossAttempts + 1,
			currentRound: {
				...state.data.currentRound,
				attempts: state.data.currentRound.attempts + 1
			}
		}
	};

	// Check if puzzle is complete
	if (newSuccessfulCrosses.length >= state.data.roundsToWin) {
		newState.solved = true;
	}

	// Find what offspring was created (if any)
	const createdOffspring = OFFSPRING.find(
		o =>
			(parent1Id === o.parent1Id && parent2Id === o.parent2Id) ||
			(parent1Id === o.parent2Id && parent2Id === o.parent1Id)
	);

	// Get plant names for message
	const parent1 = PARENT_PLANTS.find(p => p.id === parent1Id);
	const parent2 = PARENT_PLANTS.find(p => p.id === parent2Id);

	let message: string;
	if (isCorrect) {
		message = `Perfect! ${parent1?.name} and ${parent2?.name} created the ${target.name}!`;
	} else if (createdOffspring) {
		message = `You created ${createdOffspring.name}, but the target was ${target.name}. Try again!`;
	} else {
		message = `${parent1?.name} and ${parent2?.name} don't create a viable hybrid. Think about the colors...`;
	}

	return {
		state: newState,
		success: isCorrect,
		message,
		offspring: createdOffspring || null,
		puzzleComplete: newState.solved
	};
}

// Get available plants for selection (filtered)
export function getAvailablePlants(state: HybridizationState): ParentPlant[] {
	return state.data.parentPlants;
}

// Get offspring info for display
export function getTargetOffspringInfo(state: HybridizationState): {
	offspring: Offspring | null;
	roundNumber: number;
} {
	if (!state.data.currentRound) {
		return { offspring: null, roundNumber: 0 };
	}

	return {
		offspring: state.data.currentRound.targetOffspring,
		roundNumber: state.data.currentRound.roundNumber
	};
}

// Get hint based on attempts
export function getHint(state: HybridizationState): PuzzleHint | null {
	// Check for round-specific hints
	if (state.data.currentRound && state.data.currentRound.attempts >= 2) {
		// Reveal one parent hint
		const target = state.data.currentRound.targetOffspring;
		const parent1 = PARENT_PLANTS.find(p => p.id === target.parent1Id);
		return {
			tier: 2,
			text: `One parent is the ${parent1?.name}...`,
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

// Export puzzle definition
export const hybridizationPuzzle: PuzzleDefinition = {
	id: 'room3_hybridization',
	roomId: 'garden_conservatory',
	name: 'Hybridization',
	description: 'Remember the parent plant combinations to create the target hybrids. Watch carefully during the reveal!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateHybridization,
	hints: HINTS
};

export default hybridizationPuzzle;

/**
 * Puzzle 1: Seed Packets
 * Description matching puzzle where Player A sees seed images and Player B has planting guide
 * Goal: Match each seed to its correct planting spot
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Seed packet types with visual characteristics
export interface SeedPacket {
	id: string;
	name: string;
	visualDescription: string; // What Player A sees
	imageIcon: string; // Icon identifier for rendering
}

// Planting condition types
export interface PlantingCondition {
	id: string;
	soilType: 'loamy' | 'sandy' | 'clay' | 'peat';
	sunExposure: 'full' | 'partial' | 'shade';
	waterNeeds: 'low' | 'moderate' | 'high';
	specialNote: string; // What Player B sees
}

// Match between seed and planting spot
export interface SeedMatch {
	seedId: string;
	conditionId: string;
}

// Puzzle state
export interface SeedPacketsState extends PuzzleState {
	data: {
		// Available seeds for Player A
		seeds: SeedPacket[];
		// Planting conditions for Player B
		conditions: PlantingCondition[];
		// Current matches made
		matches: SeedMatch[];
		// Correct solution
		solution: SeedMatch[];
		// Currently selected seed (Player A's selection)
		selectedSeed: string | null;
		// Currently selected condition (Player B's selection)
		selectedCondition: string | null;
		// Locked in selections ready to confirm
		lockedSelection: {
			seedId: string | null;
			conditionId: string | null;
		};
	};
}

// Seed packet definitions
const SEED_PACKETS: SeedPacket[] = [
	{
		id: 'seed_moonflower',
		name: 'Moonflower Seeds',
		visualDescription: 'Large white seeds with silvery coating, shaped like crescent moons',
		imageIcon: 'seed_moonflower'
	},
	{
		id: 'seed_sunburst',
		name: 'Sunburst Lily Seeds',
		visualDescription: 'Tiny golden seeds that shimmer with orange flecks',
		imageIcon: 'seed_sunburst'
	},
	{
		id: 'seed_shade_fern',
		name: 'Whispering Fern Spores',
		visualDescription: 'Delicate brown spores in a velvet pouch, faintly glowing green',
		imageIcon: 'seed_fern'
	},
	{
		id: 'seed_desert_rose',
		name: 'Desert Rose Seeds',
		visualDescription: 'Hard angular seeds with rose-pink coloring and rough texture',
		imageIcon: 'seed_desert_rose'
	},
	{
		id: 'seed_water_lily',
		name: 'Crystal Water Lily Seeds',
		visualDescription: 'Translucent blue seeds that feel cool to touch, floating in gel',
		imageIcon: 'seed_water_lily'
	}
];

// Planting condition definitions (matches seed order)
const PLANTING_CONDITIONS: PlantingCondition[] = [
	{
		id: 'condition_shady_moss',
		soilType: 'peat',
		sunExposure: 'shade',
		waterNeeds: 'moderate',
		specialNote: 'This damp corner gets no direct light. Moss grows thick here.'
	},
	{
		id: 'condition_sunny_rock',
		soilType: 'sandy',
		sunExposure: 'full',
		waterNeeds: 'low',
		specialNote: 'A sun-drenched rocky patch. Very dry, but bright all day.'
	},
	{
		id: 'condition_dappled_grove',
		soilType: 'loamy',
		sunExposure: 'partial',
		waterNeeds: 'moderate',
		specialNote: 'Filtered light through the canopy. Rich, dark earth.'
	},
	{
		id: 'condition_pond_edge',
		soilType: 'clay',
		sunExposure: 'partial',
		waterNeeds: 'high',
		specialNote: 'Water seeps up from below. Often muddy, sometimes submerged.'
	},
	{
		id: 'condition_twilight_bed',
		soilType: 'loamy',
		sunExposure: 'shade',
		waterNeeds: 'moderate',
		specialNote: 'Only moonlight reaches this bed. The soil is dark and rich.'
	}
];

// Correct solution mapping
const SOLUTION: SeedMatch[] = [
	{ seedId: 'seed_moonflower', conditionId: 'condition_twilight_bed' },
	{ seedId: 'seed_sunburst', conditionId: 'condition_sunny_rock' },
	{ seedId: 'seed_shade_fern', conditionId: 'condition_shady_moss' },
	{ seedId: 'seed_desert_rose', conditionId: 'condition_dappled_grove' },
	{ seedId: 'seed_water_lily', conditionId: 'condition_pond_edge' }
];

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Look at the seed\'s visual features - color often hints at its preferred light. Silvery seeds might prefer moonlight...',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'Water needs match the seed\'s texture: smooth seeds need more water, rough seeds need less. The water lily seeds are already wet!',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'Match the seeds by name: Moonflower → Twilight Bed, Sunburst → Sunny Rock, Whispering Fern → Shady Moss, Desert Rose → Dappled Grove, Water Lily → Pond Edge',
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

// Initialize puzzle state
export function createSeedPacketsState(): SeedPacketsState {
	return {
		puzzleId: 'room3_seed_packets',
		solved: false,
		attempts: 0,
		data: {
			seeds: shuffleArray(SEED_PACKETS),
			conditions: shuffleArray(PLANTING_CONDITIONS),
			matches: [],
			solution: SOLUTION,
			selectedSeed: null,
			selectedCondition: null,
			lockedSelection: {
				seedId: null,
				conditionId: null
			}
		}
	};
}

// Validate solution
function validateSeedPackets(state: PuzzleState): boolean {
	const data = state.data as unknown as SeedPacketsState['data'];

	// Check if all 5 matches are made
	if (data.matches.length !== 5) return false;

	// Check each match against solution
	for (const match of data.matches) {
		const correctMatch = data.solution.find(
			s => s.seedId === match.seedId && s.conditionId === match.conditionId
		);
		if (!correctMatch) return false;
	}

	return true;
}

// Check if a specific match is correct (for feedback)
export function checkMatchCorrect(state: SeedPacketsState, match: SeedMatch): boolean {
	return state.data.solution.some(
		s => s.seedId === match.seedId && s.conditionId === match.conditionId
	);
}

// Select seed (Player A action)
export function selectSeed(state: SeedPacketsState, seedId: string): SeedPacketsState {
	// Don't allow selecting already matched seeds
	if (state.data.matches.some(m => m.seedId === seedId)) {
		return state;
	}

	return {
		...state,
		data: {
			...state.data,
			selectedSeed: state.data.selectedSeed === seedId ? null : seedId
		}
	};
}

// Select condition (Player B action)
export function selectCondition(state: SeedPacketsState, conditionId: string): SeedPacketsState {
	// Don't allow selecting already matched conditions
	if (state.data.matches.some(m => m.conditionId === conditionId)) {
		return state;
	}

	return {
		...state,
		data: {
			...state.data,
			selectedCondition: state.data.selectedCondition === conditionId ? null : conditionId
		}
	};
}

// Lock in selection (both players confirm)
export function lockSelection(state: SeedPacketsState): SeedPacketsState {
	if (!state.data.selectedSeed || !state.data.selectedCondition) {
		return state;
	}

	return {
		...state,
		data: {
			...state.data,
			lockedSelection: {
				seedId: state.data.selectedSeed,
				conditionId: state.data.selectedCondition
			}
		}
	};
}

// Attempt match (cooperative action)
export function attemptMatch(state: SeedPacketsState): {
	state: SeedPacketsState;
	correct: boolean;
	message: string;
} {
	const { lockedSelection, matches, solution } = state.data;

	if (!lockedSelection.seedId || !lockedSelection.conditionId) {
		return {
			state,
			correct: false,
			message: 'Both players must make a selection first.'
		};
	}

	const newMatch: SeedMatch = {
		seedId: lockedSelection.seedId,
		conditionId: lockedSelection.conditionId
	};

	// Check if match is correct
	const isCorrect = solution.some(
		s => s.seedId === newMatch.seedId && s.conditionId === newMatch.conditionId
	);

	const newMatches = isCorrect ? [...matches, newMatch] : matches;

	const newState: SeedPacketsState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			matches: newMatches,
			selectedSeed: null,
			selectedCondition: null,
			lockedSelection: {
				seedId: null,
				conditionId: null
			}
		}
	};

	// Check if puzzle is complete
	if (newMatches.length === 5) {
		newState.solved = validateSeedPackets(newState);
	}

	const seed = SEED_PACKETS.find(s => s.id === lockedSelection.seedId);
	const condition = PLANTING_CONDITIONS.find(c => c.id === lockedSelection.conditionId);

	return {
		state: newState,
		correct: isCorrect,
		message: isCorrect
			? `Perfect! ${seed?.name} thrives in the ${condition?.soilType} soil.`
			: `The ${seed?.name} doesn't seem happy there...`
	};
}

// Get hint based on attempts
export function getHint(state: SeedPacketsState): PuzzleHint | null {
	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Export puzzle definition
export const seedPacketsPuzzle: PuzzleDefinition = {
	id: 'room3_seed_packets',
	roomId: 'garden_conservatory',
	name: 'Seed Packets',
	description: 'Match each seed packet to its perfect planting spot. One player examines the seeds, the other reads the planting guide.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateSeedPackets,
	hints: HINTS
};

export default seedPacketsPuzzle;

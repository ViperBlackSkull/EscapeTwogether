/**
 * Puzzle 7: The Final Bloom
 * Grand finale combining all puzzle types learned throughout the game
 * Multi-stage puzzle unlocking the final secret - the wedding bands
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Stage types
export type StageType = 'seed_stage' | 'water_stage' | 'light_stage' | 'pollinate_stage' | 'bloom_stage';

// Stage state
export interface StageState {
	type: StageType;
	complete: boolean;
	data: Record<string, unknown>;
}

// Seed stage specific state
export interface SeedStageState {
	selectedSeed: string | null;
	planted: boolean;
}

// Water stage specific state
export interface WaterStageState {
	hotLevel: number;
	coldLevel: number;
	currentTemp: number;
	targetTemp: number;
	withinRange: boolean;
}

// Light stage specific state
export interface LightStageState {
	prisms: Array<{ id: string; angle: number; color: string }>;
	directedColor: string | null;
	targetColor: string;
}

// Pollinate stage specific state
export interface PollinateStageState {
	selectedParents: string[];
	correctParents: string[];
	pollinated: boolean;
}

// Bloom stage specific state
export interface BloomStageState {
	sequence: number[];
	playerProgress: { explorer: number; analyst: number };
	bloomAnimationTriggered: boolean;
}

// Items found in final compartment
export interface FoundItem {
	id: string;
	name: string;
	description: string;
	icon: string;
}

// Puzzle state
export interface FinalBloomState extends PuzzleState {
	data: {
		// Current stage
		currentStage: StageType;
		// Completed stages
		stagesCompleted: StageType[];
		// Individual stage states
		seedStage: SeedStageState & StageState;
		waterStage: WaterStageState & StageState;
		lightStage: LightStageState & StageState;
		pollinateStage: PollinateStageState & StageState;
		bloomStage: BloomStageState & StageState;
		// Overall progress (0-100)
		overallProgress: number;
		// Visual state
		budSize: number; // 0-100
		budColor: string;
		petalsVisible: boolean;
		// Final reveal
		compartmentOpen: boolean;
		itemsFound: FoundItem[];
		// Message displayed
		finalMessage: {
			title: string;
			subtitle: string;
			text: string;
		} | null;
	};
}

// The special love flower seed
const LOVE_FLOWER_SEED = {
	id: 'seed_love_flower',
	name: 'Amoris Aeterna',
	description: 'The seed of eternal love, created by two botanists who devoted their lives to each other.',
	imageIcon: 'seed_love'
};

// Target values for stages
const TARGET_TEMP = 65; // Perfect temperature for love flower
const TARGET_COLOR = 'pink-gold'; // The color of dawn and love
const CORRECT_PARENTS = ['rose_crimson', 'orchid_pink']; // Creates the love flower

// Items found at the end
const FOUND_ITEMS: FoundItem[] = [
	{
		id: 'item_wedding_bands',
		name: 'Wedding Bands',
		description: 'Two simple gold rings, engraved with "E + R" and the date June 15, 1947',
		icon: 'wedding_rings'
	},
	{
		id: 'item_pressed_rose',
		name: 'Pressed Rose',
		description: 'A dried rose from Elizabeth\'s bouquet, still fragrant after all these years',
		icon: 'pressed_rose'
	},
	{
		id: 'item_love_letter',
		name: 'Love Letter',
		description: 'A letter dated June 15, 1947: "My dearest Elizabeth, in this garden we found each other..."',
		icon: 'love_letter'
	}
];

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'This is the final puzzle - combine everything you\'ve learned! Each stage must be completed in order.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'Seed: Choose the special seed. Water: Target 65 degrees. Light: Pink-gold like dawn. Pollinate: Crimson Rose + Pink Orchid.',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'Complete each stage: Plant Amoris Aeterna → Water to 65° → Direct pink-gold light → Cross Rose + Orchid → Alternate touches to bloom!',
		triggerAttempts: 10
	}
];

// Initialize puzzle state
export function createFinalBloomState(): FinalBloomState {
	return {
		puzzleId: 'room3_final_bloom',
		solved: false,
		attempts: 0,
		data: {
			currentStage: 'seed_stage',
			stagesCompleted: [],
			seedStage: {
				type: 'seed_stage',
				complete: false,
				data: {},
				selectedSeed: null,
				planted: false
			},
			waterStage: {
				type: 'water_stage',
				complete: false,
				data: {},
				hotLevel: 0,
				coldLevel: 0,
				currentTemp: 50,
				targetTemp: TARGET_TEMP,
				withinRange: false
			},
			lightStage: {
				type: 'light_stage',
				complete: false,
				data: {},
				prisms: [
					{ id: 'prism_1', angle: 0, color: 'red' },
					{ id: 'prism_2', angle: 0, color: 'blue' },
					{ id: 'prism_3', angle: 0, color: 'yellow' }
				],
				directedColor: null,
				targetColor: TARGET_COLOR
			},
			pollinateStage: {
				type: 'pollinate_stage',
				complete: false,
				data: {},
				selectedParents: [],
				correctParents: CORRECT_PARENTS,
				pollinated: false
			},
			bloomStage: {
				type: 'bloom_stage',
				complete: false,
				data: {},
				sequence: [1, 2, 3, 4, 5, 6],
				playerProgress: { explorer: 0, analyst: 0 },
				bloomAnimationTriggered: false
			},
			overallProgress: 0,
			budSize: 10,
			budColor: '#90EE90', // Light green
			petalsVisible: false,
			compartmentOpen: false,
			itemsFound: [],
			finalMessage: null
		}
	};
}

// Validate solution
function validateFinalBloom(state: PuzzleState): boolean {
	const data = state.data as unknown as FinalBloomState['data'];
	return data.stagesCompleted.length === 5 && data.compartmentOpen;
}

// Calculate progress based on completed stages
function calculateProgress(stagesCompleted: StageType[]): number {
	const stageWeights: Record<StageType, number> = {
		'seed_stage': 15,
		'water_stage': 20,
		'light_stage': 20,
		'pollinate_stage': 20,
		'bloom_stage': 25
	};

	return stagesCompleted.reduce((sum, stage) => sum + stageWeights[stage], 0);
}

// Update visual state based on progress
function updateVisualState(state: FinalBloomState): FinalBloomState {
	const { stagesCompleted } = state.data;

	let budSize = 10;
	let budColor = '#90EE90';
	let petalsVisible = false;

	if (stagesCompleted.includes('seed_stage')) {
		budSize = 25;
		budColor = '#98FB98'; // Pale green
	}

	if (stagesCompleted.includes('water_stage')) {
		budSize = 40;
		budColor = '#77DD77'; // Medium green
	}

	if (stagesCompleted.includes('light_stage')) {
		budSize = 55;
		budColor = '#FFB6C1'; // Light pink
		petalsVisible = true;
	}

	if (stagesCompleted.includes('pollinate_stage')) {
		budSize = 75;
		budColor = '#FF69B4'; // Hot pink
	}

	if (stagesCompleted.includes('bloom_stage')) {
		budSize = 100;
		budColor = '#FFD700'; // Gold center
	}

	return {
		...state,
		data: {
			...state.data,
			budSize,
			budColor,
			petalsVisible
		}
	};
}

// ===== SEED STAGE =====

export function selectLoveSeed(state: FinalBloomState, seedId: string): FinalBloomState {
	return {
		...state,
		data: {
			...state.data,
			seedStage: {
				...state.data.seedStage,
				selectedSeed: seedId
			}
		}
	};
}

export function plantSeed(state: FinalBloomState): {
	state: FinalBloomState;
	success: boolean;
	message: string;
} {
	if (state.data.seedStage.selectedSeed !== LOVE_FLOWER_SEED.id) {
		return {
			state,
			success: false,
			message: 'Select the special seed to plant.'
		};
	}

	const newStagesCompleted: StageType[] = [...state.data.stagesCompleted, 'seed_stage'];
	let newState: FinalBloomState = {
		...state,
		data: {
			...state.data,
			seedStage: {
				...state.data.seedStage,
				complete: true,
				planted: true
			},
			stagesCompleted: newStagesCompleted,
			currentStage: 'water_stage',
			overallProgress: calculateProgress(newStagesCompleted)
		}
	};

	newState = updateVisualState(newState);

	return {
		state: newState,
		success: true,
		message: 'The Amoris Aeterna has been planted! Now it needs water...'
	};
}

// ===== WATER STAGE =====

export function adjustWaterValve(
	state: FinalBloomState,
	valve: 'hot' | 'cold',
	level: number
): FinalBloomState {
	const clampedLevel = Math.max(0, Math.min(100, level));

	const newWaterStage = { ...state.data.waterStage };
	if (valve === 'hot') {
		newWaterStage.hotLevel = clampedLevel;
	} else {
		newWaterStage.coldLevel = clampedLevel;
	}

	// Calculate temperature
	const total = newWaterStage.hotLevel + newWaterStage.coldLevel;
	if (total === 0) {
		newWaterStage.currentTemp = 50;
	} else {
		newWaterStage.currentTemp =
			(newWaterStage.hotLevel * 100 + newWaterStage.coldLevel * 0 + (100 - total) * 50) / 100;
	}

	// Check if within range (60-70)
	newWaterStage.withinRange =
		newWaterStage.currentTemp >= 60 && newWaterStage.currentTemp <= 70;

	return {
		...state,
		data: {
			...state.data,
			waterStage: newWaterStage
		}
	};
}

export function confirmWatering(state: FinalBloomState): {
	state: FinalBloomState;
	success: boolean;
	message: string;
} {
	if (!state.data.waterStage.withinRange) {
		return {
			state,
			success: false,
			message: `Temperature is ${Math.round(state.data.waterStage.currentTemp)}°. The flower needs 60-70°!`
		};
	}

	const newStagesCompleted: StageType[] = [...state.data.stagesCompleted, 'water_stage'];
	let newState: FinalBloomState = {
		...state,
		data: {
			...state.data,
			waterStage: {
				...state.data.waterStage,
				complete: true
			},
			stagesCompleted: newStagesCompleted,
			currentStage: 'light_stage',
			overallProgress: calculateProgress(newStagesCompleted)
		}
	};

	newState = updateVisualState(newState);

	return {
		state: newState,
		success: true,
		message: 'Perfect! The flower drinks deeply. Now it needs light...'
	};
}

// ===== LIGHT STAGE =====

export function rotateLightPrism(
	state: FinalBloomState,
	prismId: string,
	angle: number
): FinalBloomState {
	const newPrisms = state.data.lightStage.prisms.map(p =>
		p.id === prismId ? { ...p, angle } : p
	);

	// Calculate resulting color based on prism angles
	// For simplicity, certain angle combinations produce pink-gold
	const directedColor = calculateLightColor(newPrisms);

	return {
		...state,
		data: {
			...state.data,
			lightStage: {
				...state.data.lightStage,
				prisms: newPrisms,
				directedColor
			}
		}
	};
}

function calculateLightColor(prisms: Array<{ angle: number; color: string }>): string {
	// Red prism at 30-60, Blue at 60-90, Yellow at 0-30 creates pink-gold
	const redPrism = prisms.find(p => p.color === 'red');
	const bluePrism = prisms.find(p => p.color === 'blue');
	const yellowPrism = prisms.find(p => p.color === 'yellow');

	if (
		redPrism && redPrism.angle >= 30 && redPrism.angle <= 60 &&
		bluePrism && bluePrism.angle >= 60 && bluePrism.angle <= 90 &&
		yellowPrism && yellowPrism.angle >= 0 && yellowPrism.angle <= 30
	) {
		return 'pink-gold';
	}

	// Return a descriptive color
	if (redPrism && redPrism.angle > 30) {
		return 'warm-pink';
	}
	if (bluePrism && bluePrism.angle > 45) {
		return 'cool-blue';
	}
	return 'white';
}

export function confirmLighting(state: FinalBloomState): {
	state: FinalBloomState;
	success: boolean;
	message: string;
} {
	if (state.data.lightStage.directedColor !== 'pink-gold') {
		return {
			state,
			success: false,
			message: `The light is ${state.data.lightStage.directedColor}. The flower needs pink-gold light like dawn!`
		};
	}

	const newStagesCompleted: StageType[] = [...state.data.stagesCompleted, 'light_stage'];
	let newState: FinalBloomState = {
		...state,
		data: {
			...state.data,
			lightStage: {
				...state.data.lightStage,
				complete: true
			},
			stagesCompleted: newStagesCompleted,
			currentStage: 'pollinate_stage',
			overallProgress: calculateProgress(newStagesCompleted)
		}
	};

	newState = updateVisualState(newState);

	return {
		state: newState,
		success: true,
		message: 'Beautiful! A rainbow illuminates the bud. Now for pollination...'
	};
}

// ===== POLLINATE STAGE =====

export function selectPollinationParent(state: FinalBloomState, parentId: string): FinalBloomState {
	const current = state.data.pollinateStage.selectedParents;

	if (current.includes(parentId)) {
		// Deselect
		return {
			...state,
			data: {
				...state.data,
				pollinateStage: {
					...state.data.pollinateStage,
					selectedParents: current.filter(id => id !== parentId)
				}
			}
		};
	}

	if (current.length >= 2) {
		return state;
	}

	return {
		...state,
		data: {
			...state.data,
			pollinateStage: {
				...state.data.pollinateStage,
				selectedParents: [...current, parentId]
			}
		}
	};
}

export function confirmPollination(state: FinalBloomState): {
	state: FinalBloomState;
	success: boolean;
	message: string;
} {
	const { selectedParents, correctParents } = state.data.pollinateStage;

	// Check if correct (order doesn't matter)
	const isCorrect =
		selectedParents.length === 2 &&
		correctParents.every(p => selectedParents.includes(p));

	if (!isCorrect) {
		return {
			state,
			success: false,
			message: 'These flowers don\'t create the right hybrid. Think about love and passion...'
		};
	}

	const newStagesCompleted: StageType[] = [...state.data.stagesCompleted, 'pollinate_stage'];
	let newState: FinalBloomState = {
		...state,
		data: {
			...state.data,
			pollinateStage: {
				...state.data.pollinateStage,
				complete: true,
				pollinated: true
			},
			stagesCompleted: newStagesCompleted,
			currentStage: 'bloom_stage',
			overallProgress: calculateProgress(newStagesCompleted)
		}
	};

	newState = updateVisualState(newState);

	return {
		state: newState,
		success: true,
		message: 'Perfect cross! The bud begins to swell with color...'
	};
}

// ===== BLOOM STAGE =====

export function touchBloomPetal(
	state: FinalBloomState,
	player: PlayerRole,
	petalNumber: number
): {
	state: FinalBloomState;
	success: boolean;
	message: string;
	puzzleComplete: boolean;
} {
	const { playerProgress, sequence } = state.data.bloomStage;

	// Determine expected player (alternating)
	const totalTouches = playerProgress.explorer + playerProgress.analyst;
	const expectedPlayer: PlayerRole = totalTouches % 2 === 0 ? 'explorer' : 'analyst';
	const expectedPetal = sequence[totalTouches];

	// Check if correct
	const isCorrectPlayer = player === expectedPlayer;
	const isCorrectPetal = petalNumber === expectedPetal;
	const isCorrect = isCorrectPlayer && isCorrectPetal;

	if (!isCorrect) {
		let message = '';
		if (!isCorrectPlayer) {
			message = `It's ${expectedPlayer === 'explorer' ? 'Explorer' : 'Analyst'}'s turn!`;
		} else {
			message = `Wrong petal! Look for petal ${expectedPetal}.`;
		}
		return { state, success: false, message, puzzleComplete: false };
	}

	// Update progress
	const newProgress = { ...playerProgress };
	newProgress[player]++;

	const allComplete = newProgress.explorer + newProgress.analyst >= sequence.length;

	let newState: FinalBloomState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			bloomStage: {
				...state.data.bloomStage,
				playerProgress: newProgress,
				complete: allComplete,
				bloomAnimationTriggered: allComplete
			}
		}
	};

	if (allComplete) {
		// Complete the puzzle!
		const newStagesCompleted: StageType[] = [...state.data.stagesCompleted, 'bloom_stage'];
		newState = {
			...newState,
			solved: true,
			data: {
				...newState.data,
				stagesCompleted: newStagesCompleted,
				currentStage: 'bloom_stage',
				overallProgress: 100,
				compartmentOpen: true,
				itemsFound: FOUND_ITEMS,
				finalMessage: {
					title: 'Together We Bloom',
					subtitle: 'Forever We Grow',
					text: 'In this garden of love, two hearts became one. Just as these rings once united Elizabeth and Robert, may they forever remind you of the love you share.'
				}
			}
		};

		newState = updateVisualState(newState);
	}

	return {
		state: newState,
		success: true,
		message: allComplete
			? 'THE FLOWER BLOOMS! A hidden compartment opens, revealing...'
			: `Petal ${petalNumber} glows! Continue the dance...`,
		puzzleComplete: allComplete
	};
}

// Get current stage info for UI
export function getCurrentStageInfo(state: FinalBloomState): {
	stage: StageType;
	description: string;
	instructions: string;
} {
	const stageDescriptions: Record<StageType, { description: string; instructions: string }> = {
		'seed_stage': {
			description: 'Plant the Seed of Eternal Love',
			instructions: 'Explorer: Select the special seed. Analyst: Confirm the planting location.'
		},
		'water_stage': {
			description: 'Water with Perfect Temperature',
			instructions: 'Balance hot and cold to reach 60-70 degrees. Communicate to find the right mix!'
		},
		'light_stage': {
			description: 'Bathe in Dawn\'s Light',
			instructions: 'Rotate the prisms to create pink-gold light, the color of sunrise and love.'
		},
		'pollinate_stage': {
			description: 'Cross-Pollinate for Love',
			instructions: 'Choose two parent flowers whose love creates the Amoris Aeterna. Think passion and devotion.'
		},
		'bloom_stage': {
			description: 'The Final Bloom',
			instructions: 'Touch the petals in sequence, alternating turns. Your coordination brings the flower to life!'
		}
	};

	return {
		stage: state.data.currentStage,
		...stageDescriptions[state.data.currentStage]
	};
}

// Get hint based on attempts
export function getHint(state: FinalBloomState): PuzzleHint | null {
	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Export puzzle definition
export const finalBloomPuzzle: PuzzleDefinition = {
	id: 'room3_final_bloom',
	roomId: 'garden_conservatory',
	name: 'The Final Bloom',
	description: 'Grow the Amoris Aeterna - the flower of eternal love. Combine all your skills in this grand finale!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateFinalBloom,
	hints: HINTS
};

export default finalBloomPuzzle;

/**
 * Puzzle 2: Water Flow
 * Hydraulic coordination puzzle where Player A controls hot water and Player B controls cold water
 * Goal: Balance temperature for each of 4 plants
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Plant temperature requirements
export interface Plant {
	id: string;
	name: string;
	minTemp: number; // Minimum acceptable temperature
	maxTemp: number; // Maximum acceptable temperature
	optimalTemp: number; // Ideal temperature
	currentTemp: number;
	satisfied: boolean;
	emoji: string;
}

// Valve state
export interface Valve {
	role: PlayerRole; // Which player controls this
	level: number; // 0-100 flow level
	type: 'hot' | 'cold';
}

// Puzzle state
export interface WaterFlowState extends PuzzleState {
	data: {
		// Plants requiring water
		plants: Plant[];
		// Valves controlled by each player
		hotValve: Valve;
		coldValve: Valve;
		// Currently active plant being watered
		activePlantIndex: number;
		// Plants that have been satisfied
		completedPlants: string[];
		// Total time spent on current plant
		timeOnPlant: number;
		// History of attempts
		adjustmentHistory: Array<{
			plantId: string;
			hotLevel: number;
			coldLevel: number;
			result: number;
		}>;
	};
}

// Plant definitions
const PLANTS: Plant[] = [
	{
		id: 'plant_tropical_orchid',
		name: 'Tropical Orchid',
		minTemp: 75,
		maxTemp: 90,
		optimalTemp: 82,
		currentTemp: 50,
		satisfied: false,
		emoji: 'orchid'
	},
	{
		id: 'plant_alpine_violet',
		name: 'Alpine Violet',
		minTemp: 45,
		maxTemp: 60,
		optimalTemp: 52,
		currentTemp: 50,
		satisfied: false,
		emoji: 'violet'
	},
	{
		id: 'plant_desert_succulent',
		name: 'Desert Succulent',
		minTemp: 65,
		maxTemp: 80,
		optimalTemp: 72,
		currentTemp: 50,
		satisfied: false,
		emoji: 'succulent'
	},
	{
		id: 'plant_rose_bush',
		name: 'Heritage Rose',
		minTemp: 55,
		maxTemp: 70,
		optimalTemp: 62,
		currentTemp: 50,
		satisfied: false,
		emoji: 'rose'
	}
];

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'The water temperature depends on the mix of hot and cold. More hot water raises temperature, more cold lowers it. Try to find the balance!',
		triggerAttempts: 5
	},
	{
		tier: 2,
		text: 'Each plant shows its comfort zone. Watch the temperature indicator - it turns green when in range. Equal hot and cold gives around 50 degrees.',
		triggerAttempts: 10
	},
	{
		tier: 3,
		text: 'Orchid needs 75-90 (mostly hot), Alpine Violet needs 45-60 (mostly cold), Succulent needs 65-80 (balanced warm), Rose needs 55-70 (slightly warm)',
		triggerAttempts: 15
	}
];

// Calculate resulting temperature from valve levels
export function calculateTemperature(hotLevel: number, coldLevel: number): number {
	// Hot water is 100 degrees, cold is 0
	// Temperature is weighted average based on proportion of hot vs cold
	const total = hotLevel + coldLevel;
	if (total === 0) return 50; // Room temperature if no flow

	// Simple weighted average: hot contributes 100deg, cold contributes 0deg
	// Ratio determines the final temp
	const hotRatio = hotLevel / total;
	// Base temp from mixing, scaled by flow rate
	const mixTemp = hotRatio * 100;
	// Add room temperature influence for lower flow
	const roomInfluence = ((100 - total) / 100) * 50;

	return (mixTemp * (total / 100)) + roomInfluence;
}

// Check if temperature is within plant's acceptable range
function isTemperatureAcceptable(plant: Plant, temp: number): boolean {
	return temp >= plant.minTemp && temp <= plant.maxTemp;
}

// Initialize puzzle state
export function createWaterFlowState(): WaterFlowState {
	return {
		puzzleId: 'room3_water_flow',
		solved: false,
		attempts: 0,
		data: {
			plants: PLANTS.map(p => ({ ...p })),
			hotValve: {
				role: 'explorer',
				level: 0,
				type: 'hot'
			},
			coldValve: {
				role: 'analyst',
				level: 0,
				type: 'cold'
			},
			activePlantIndex: 0,
			completedPlants: [],
			timeOnPlant: 0,
			adjustmentHistory: []
		}
	};
}

// Validate solution
function validateWaterFlow(state: PuzzleState): boolean {
	const data = state.data as unknown as WaterFlowState['data'];
	return data.completedPlants.length === 4;
}

// Set valve level (player action)
export function setValveLevel(
	state: WaterFlowState,
	valveType: 'hot' | 'cold',
	level: number
): WaterFlowState {
	const clampedLevel = Math.max(0, Math.min(100, level));

	const newState = {
		...state,
		data: {
			...state.data,
			adjustmentHistory: [...state.data.adjustmentHistory]
		}
	};

	if (valveType === 'hot') {
		newState.data.hotValve = { ...state.data.hotValve, level: clampedLevel };
	} else {
		newState.data.coldValve = { ...state.data.coldValve, level: clampedLevel };
	}

	// Calculate new temperature for active plant
	const activePlant = newState.data.plants[newState.data.activePlantIndex];
	const newTemp = calculateTemperature(
		valveType === 'hot' ? clampedLevel : state.data.hotValve.level,
		valveType === 'cold' ? clampedLevel : state.data.coldValve.level
	);

	newState.data.plants = [...state.data.plants];
	newState.data.plants[newState.data.activePlantIndex] = {
		...activePlant,
		currentTemp: newTemp
	};

	// Record adjustment
	newState.data.adjustmentHistory.push({
		plantId: activePlant.id,
		hotLevel: valveType === 'hot' ? clampedLevel : state.data.hotValve.level,
		coldLevel: valveType === 'cold' ? clampedLevel : state.data.coldValve.level,
		result: newTemp
	});

	return newState;
}

// Confirm temperature setting (both players must agree)
export function confirmTemperature(state: WaterFlowState): {
	state: WaterFlowState;
	success: boolean;
	message: string;
	allComplete: boolean;
} {
	const activePlant = state.data.plants[state.data.activePlantIndex];
	const temp = calculateTemperature(state.data.hotValve.level, state.data.coldValve.level);

	const isAcceptable = isTemperatureAcceptable(activePlant, temp);

	const newState: WaterFlowState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			plants: [...state.data.plants],
			completedPlants: [...state.data.completedPlants]
		}
	};

	if (isAcceptable) {
		// Mark plant as satisfied
		newState.data.plants[state.data.activePlantIndex] = {
			...activePlant,
			satisfied: true,
			currentTemp: temp
		};

		if (!newState.data.completedPlants.includes(activePlant.id)) {
			newState.data.completedPlants.push(activePlant.id);
		}

		// Reset valves after each successful watering
		newState.data.hotValve = { ...state.data.hotValve, level: 0 };
		newState.data.coldValve = { ...state.data.coldValve, level: 0 };

		// Move to next plant if available
		if (newState.data.activePlantIndex < 3) {
			newState.data.activePlantIndex++;
		}

		// Check if all plants complete
		if (newState.data.completedPlants.length === 4) {
			newState.solved = true;
		}

		const tempDiff = Math.abs(temp - activePlant.optimalTemp);
		let message = '';
		if (tempDiff <= 2) {
			message = `Perfect temperature for the ${activePlant.name}! It seems very happy!`;
		} else {
			message = `The ${activePlant.name} is satisfied with ${Math.round(temp)} degrees.`;
		}

		return {
			state: newState,
			success: true,
			message,
			allComplete: newState.solved
		};
	}

	return {
		state: newState,
		success: false,
		message: `The ${activePlant.name} needs water between ${activePlant.minTemp} and ${activePlant.maxTemp} degrees. Current: ${Math.round(temp)}`,
		allComplete: false
	};
}

// Get temperature feedback for UI
export function getTemperatureFeedback(state: WaterFlowState): {
	current: number;
	status: 'too_cold' | 'too_hot' | 'perfect' | 'acceptable';
	activePlant: Plant;
} {
	const activePlant = state.data.plants[state.data.activePlantIndex];
	const current = calculateTemperature(state.data.hotValve.level, state.data.coldValve.level);

	let status: 'too_cold' | 'too_hot' | 'perfect' | 'acceptable';
	if (current < activePlant.minTemp) {
		status = 'too_cold';
	} else if (current > activePlant.maxTemp) {
		status = 'too_hot';
	} else if (Math.abs(current - activePlant.optimalTemp) <= 3) {
		status = 'perfect';
	} else {
		status = 'acceptable';
	}

	return { current, status, activePlant };
}

// Get hint based on attempts
export function getHint(state: WaterFlowState): PuzzleHint | null {
	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Export puzzle definition
export const waterFlowPuzzle: PuzzleDefinition = {
	id: 'room3_water_flow',
	roomId: 'garden_conservatory',
	name: 'Water Flow',
	description: 'Balance hot and cold water valves to give each plant its perfect temperature. Coordinate carefully!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateWaterFlow,
	hints: HINTS
};

export default waterFlowPuzzle;

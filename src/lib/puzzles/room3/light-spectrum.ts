/**
 * Puzzle 3: Light Spectrum
 * Color mixing cooperation puzzle where Player A controls prisms and Player B has light requirements
 * Goal: Direct correct color light to each flower
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Color types for light spectrum
export type LightColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet' | 'white' | 'cyan' | 'magenta';

// Prism state
export interface Prism {
	id: string;
	angle: number; // 0-360 degrees
	outputColor: LightColor;
}

// Flower light requirement
export interface Flower {
	id: string;
	name: string;
	requiredColor: LightColor;
	currentColor: LightColor | null;
	satisfied: boolean;
	emoji: string;
}

// Puzzle state
export interface LightSpectrumState extends PuzzleState {
	data: {
		// Prisms that Player A controls
		prisms: Prism[];
		// Flowers needing light (Player B sees requirements)
		flowers: Flower[];
		// Currently selected prism
		selectedPrism: string | null;
		// Flowers that have received correct light
		completedFlowers: string[];
		// Color mixing mode for combining prism outputs
		mixMode: boolean;
		// Active prism outputs for mixing
		activeOutputs: LightColor[];
		// Number of wrong color attempts
		wrongColorAttempts: number;
	};
}

// Prism definitions - each can produce specific colors at certain angles
const PRISM_CONFIG: Array<{
	id: string;
	angleRanges: Array<{ min: number; max: number; color: LightColor }>;
}> = [
	{
		id: 'prism_red',
		angleRanges: [
			{ min: 0, max: 60, color: 'red' },
			{ min: 60, max: 120, color: 'orange' },
			{ min: 120, max: 180, color: 'yellow' }
		]
	},
	{
		id: 'prism_blue',
		angleRanges: [
			{ min: 0, max: 60, color: 'green' },
			{ min: 60, max: 120, color: 'blue' },
			{ min: 120, max: 180, color: 'indigo' }
		]
	},
	{
		id: 'prism_violet',
		angleRanges: [
			{ min: 0, max: 60, color: 'violet' },
			{ min: 60, max: 120, color: 'white' },
			{ min: 120, max: 180, color: 'red' }
		]
	}
];

// Flower definitions
const FLOWERS: Flower[] = [
	{
		id: 'flower_sun_daisy',
		name: 'Sun Daisy',
		requiredColor: 'yellow',
		currentColor: null,
		satisfied: false,
		emoji: 'daisy'
	},
	{
		id: 'flower_twilight_iris',
		name: 'Twilight Iris',
		requiredColor: 'violet',
		currentColor: null,
		satisfied: false,
		emoji: 'iris'
	},
	{
		id: 'flower_ocean_rose',
		name: 'Ocean Rose',
		requiredColor: 'blue',
		currentColor: null,
		satisfied: false,
		emoji: 'rose'
	},
	{
		id: 'flower_moon_orchid',
		name: 'Moon Orchid',
		requiredColor: 'white',
		currentColor: null,
		satisfied: false,
		emoji: 'orchid'
	},
	{
		id: 'flower_fire_lily',
		name: 'Fire Lily',
		requiredColor: 'orange',
		currentColor: null,
		satisfied: false,
		emoji: 'lily'
	}
];

// Color mixing rules (additive color mixing)
const COLOR_MIXING: Record<string, LightColor> = {
	'red+blue': 'violet',
	'red+yellow': 'orange',
	'blue+yellow': 'green',
	'red+green': 'yellow',
	'blue+green': 'cyan',
	'red+violet': 'magenta',
	'blue+violet': 'indigo',
	'all': 'white'
};

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Each prism produces different colors at different angles. Try rotating the prisms to change their output color. White light requires all colors combined!',
		triggerAttempts: 4
	},
	{
		tier: 2,
		text: 'Prism angles: 0-60 gives the first color, 60-120 gives the second, 120-180 gives the third. Mix colors by using multiple prisms together.',
		triggerAttempts: 8
	},
	{
		tier: 3,
		text: 'Yellow: prism_red at 120-180. Violet: prism_violet at 0-60. Blue: prism_blue at 60-120. White: mix all three prisms. Orange: prism_red at 60-120.',
		triggerAttempts: 12
	}
];

// Get color from prism at specific angle
function getPrismColor(prismId: string, angle: number): LightColor {
	const config = PRISM_CONFIG.find(p => p.id === prismId);
	if (!config) return 'white';

	for (const range of config.angleRanges) {
		if (angle >= range.min && angle < range.max) {
			return range.color;
		}
	}
	// Wrap around for angles > 180
	const wrappedAngle = angle % 180;
	for (const range of config.angleRanges) {
		if (wrappedAngle >= range.min && wrappedAngle < range.max) {
			return range.color;
		}
	}
	return 'white';
}

// Mix two colors
export function mixColors(color1: LightColor, color2: LightColor): LightColor {
	if (color1 === color2) return color1;

	const key1 = `${color1}+${color2}`;
	const key2 = `${color2}+${color1}`;

	if (COLOR_MIXING[key1]) return COLOR_MIXING[key1];
	if (COLOR_MIXING[key2]) return COLOR_MIXING[key2];

	// Default mixing produces white-ish
	return 'white';
}

// Initialize puzzle state
export function createLightSpectrumState(): LightSpectrumState {
	return {
		puzzleId: 'room3_light_spectrum',
		solved: false,
		attempts: 0,
		data: {
			prisms: PRISM_CONFIG.map(config => ({
				id: config.id,
				angle: 0,
				outputColor: 'red'
			})),
			flowers: FLOWERS.map(f => ({ ...f })),
			selectedPrism: null,
			completedFlowers: [],
			mixMode: false,
			activeOutputs: [],
			wrongColorAttempts: 0
		}
	};
}

// Validate solution
function validateLightSpectrum(state: PuzzleState): boolean {
	const data = state.data as unknown as LightSpectrumState['data'];
	return data.completedFlowers.length === 5;
}

// Rotate prism (Player A action)
export function rotatePrism(state: LightSpectrumState, prismId: string, newAngle: number): LightSpectrumState {
	const clampedAngle = Math.max(0, Math.min(180, newAngle));

	const newPrisms = state.data.prisms.map(prism => {
		if (prism.id === prismId) {
			return {
				...prism,
				angle: clampedAngle,
				outputColor: getPrismColor(prismId, clampedAngle)
			};
		}
		return prism;
	});

	return {
		...state,
		data: {
			...state.data,
			prisms: newPrisms
		}
	};
}

// Select prism for adjustment
export function selectPrism(state: LightSpectrumState, prismId: string): LightSpectrumState {
	return {
		...state,
		data: {
			...state.data,
			selectedPrism: state.data.selectedPrism === prismId ? null : prismId
		}
	};
}

// Toggle mix mode
export function toggleMixMode(state: LightSpectrumState): LightSpectrumState {
	return {
		...state,
		data: {
			...state.data,
			mixMode: !state.data.mixMode,
			activeOutputs: []
		}
	};
}

// Add prism output to mix
export function addToMix(state: LightSpectrumState, prismId: string): LightSpectrumState {
	const prism = state.data.prisms.find(p => p.id === prismId);
	if (!prism) return state;

	const isAlreadyActive = state.data.activeOutputs.includes(prism.outputColor);
	const newOutputs = isAlreadyActive
		? state.data.activeOutputs.filter(c => c !== prism.outputColor)
		: [...state.data.activeOutputs, prism.outputColor];

	return {
		...state,
		data: {
			...state.data,
			activeOutputs: newOutputs
		}
	};
}

// Get mixed color from active outputs
export function getMixedColor(outputs: LightColor[]): LightColor {
	if (outputs.length === 0) return 'white';
	if (outputs.length === 1) return outputs[0];

	// Check if all colors are present (produces white)
	const allColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
	const hasAllColors = allColors.some(c => outputs.includes(c as LightColor)) && outputs.length >= 3;

	if (hasAllColors) return 'white';

	// Mix first two colors
	let result = outputs[0];
	for (let i = 1; i < outputs.length; i++) {
		result = mixColors(result, outputs[i]);
	}
	return result;
}

// Direct light to flower (confirm action)
export function directLightToFlower(
	state: LightSpectrumState,
	flowerId: string,
	useMixMode: boolean
): {
	state: LightSpectrumState;
	success: boolean;
	message: string;
	allComplete: boolean;
} {
	const flower = state.data.flowers.find(f => f.id === flowerId);
	if (!flower || flower.satisfied) {
		return {
			state,
			success: false,
			message: 'This flower has already received its light.',
			allComplete: false
		};
	}

	// Determine color being directed
	let directedColor: LightColor;
	if (useMixMode && state.data.activeOutputs.length > 0) {
		directedColor = getMixedColor(state.data.activeOutputs);
	} else if (state.data.selectedPrism) {
		const prism = state.data.prisms.find(p => p.id === state.data.selectedPrism);
		directedColor = prism?.outputColor || 'white';
	} else {
		return {
			state,
			success: false,
			message: 'Select a prism or enable mix mode first.',
			allComplete: false
		};
	}

	const newState: LightSpectrumState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			flowers: [...state.data.flowers],
			completedFlowers: [...state.data.completedFlowers]
		}
	};

	// Update flower's current color
	const flowerIndex = newState.data.flowers.findIndex(f => f.id === flowerId);
	newState.data.flowers[flowerIndex] = {
		...flower,
		currentColor: directedColor
	};

	// Check if color is correct
	if (directedColor === flower.requiredColor) {
		newState.data.flowers[flowerIndex].satisfied = true;
		newState.data.completedFlowers.push(flowerId);

		// Check if all complete
		if (newState.data.completedFlowers.length === 5) {
			newState.solved = true;
		}

		return {
			state: newState,
			success: true,
			message: `Beautiful! The ${flower.name} glows with ${directedColor} light.`,
			allComplete: newState.solved
		};
	}

	// Wrong color
	newState.data.wrongColorAttempts++;

	return {
		state: newState,
		success: false,
		message: `The ${flower.name} needs ${flower.requiredColor} light, not ${directedColor}.`,
		allComplete: false
	};
}

// Get light requirements chart for Player B
export function getLightRequirementsChart(): Array<{
	flower: Flower;
	colorName: string;
	hint: string;
}> {
	return FLOWERS.map(f => ({
		flower: f,
		colorName: f.requiredColor,
		hint: getLightHint(f.requiredColor)
	}));
}

function getLightHint(color: LightColor): string {
	const hints: Record<LightColor, string> = {
		red: 'Warm and passionate, like a sunset',
		orange: 'The color of dawn and warmth',
		yellow: 'Bright and cheerful, like sunshine',
		green: 'Fresh and growing, nature\'s hue',
		blue: 'Cool and calm, like a clear sky',
		indigo: 'Deep and mysterious, twilight\'s edge',
		violet: 'Royal and romantic, dusk\'s embrace',
		white: 'Pure and complete, all colors combined',
		cyan: 'Fresh and vibrant, like tropical waters',
		magenta: 'Bold and romantic, like a sunset rose'
	};
	return hints[color];
}

// Get hint based on attempts
export function getHint(state: LightSpectrumState): PuzzleHint | null {
	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Export puzzle definition
export const lightSpectrumPuzzle: PuzzleDefinition = {
	id: 'room3_light_spectrum',
	roomId: 'garden_conservatory',
	name: 'Light Spectrum',
	description: 'Rotate the crystal prisms to direct colored light to each flower. Combine colors for special blooms!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateLightSpectrum,
	hints: HINTS
};

export default lightSpectrumPuzzle;

// Puzzle 2: Music Box
// Player A hears melody patterns and has gears
// Player B sees the mechanism diagram
// Must communicate to set correct sequence

import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Gear definition
export interface Gear {
	id: string;
	teeth: number; // Number of teeth on the gear
	material: 'brass' | 'steel' | 'wood';
	size: 'small' | 'medium' | 'large';
	isCorrect: boolean; // Whether this gear is part of the solution
	isDistractor: boolean; // Distractor gears cannot be placed
}

// Slot definition
export interface GearSlot {
	id: string;
	position: number; // 0, 1, 2
	requiredTeeth: number;
	requiredMaterial: 'brass' | 'steel' | 'wood';
	requiredSize: 'small' | 'medium' | 'large';
	placedGear: string | null; // Gear ID if placed
}

// Melody pattern that plays
export interface MelodyNote {
	frequency: number; // Hz
	duration: number; // ms
}

// Puzzle state
export interface MusicBoxState {
	gears: Gear[];
	slots: GearSlot[];
	melodyPattern: MelodyNote[];
	allGearsPlaced: boolean;
	completed: boolean;
	isPlaying: boolean;
}

// Available gears (3 correct, 2 distractors)
const GEARS: Gear[] = [
	// Correct gears
	{
		id: 'gear-small-brass',
		teeth: 12,
		material: 'brass',
		size: 'small',
		isCorrect: true,
		isDistractor: false
	},
	{
		id: 'gear-medium-steel',
		teeth: 18,
		material: 'steel',
		size: 'medium',
		isCorrect: true,
		isDistractor: false
	},
	{
		id: 'gear-large-wood',
		teeth: 24,
		material: 'wood',
		size: 'large',
		isCorrect: true,
		isDistractor: false
	},
	// Distractor gears
	{
		id: 'gear-small-wood',
		teeth: 10,
		material: 'wood',
		size: 'small',
		isCorrect: false,
		isDistractor: true
	},
	{
		id: 'gear-medium-brass',
		teeth: 16,
		material: 'brass',
		size: 'medium',
		isCorrect: false,
		isDistractor: true
	}
];

// Slot requirements
const SLOT_REQUIREMENTS = [
	{ teeth: 12, material: 'brass' as const, size: 'small' as const },
	{ teeth: 18, material: 'steel' as const, size: 'medium' as const },
	{ teeth: 24, material: 'wood' as const, size: 'large' as const }
];

// Melody pattern (simple tune that plays when complete)
const MELODY_PATTERN: MelodyNote[] = [
	{ frequency: 523.25, duration: 200 }, // C5
	{ frequency: 587.33, duration: 200 }, // D5
	{ frequency: 659.25, duration: 200 }, // E5
	{ frequency: 523.25, duration: 200 }, // C5
	{ frequency: 659.25, duration: 200 }, // E5
	{ frequency: 783.99, duration: 400 }, // G5
	{ frequency: 783.99, duration: 400 }, // G5
	{ frequency: 880.00, duration: 600 }  // A5
];

// Hints
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Look at the assembly diagram carefully. It shows the exact specifications for each gear slot.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'Small gears have 12 teeth, medium have 18, and large have 24. Match the materials too - brass, steel, and wood.',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'Slot 1 needs small brass (12 teeth), Slot 2 needs medium steel (18 teeth), Slot 3 needs large wood (24 teeth). Some gears are wrong and wont fit!',
		triggerAttempts: 10
	}
];

// Create initial state
export function createInitialState(): MusicBoxState {
	const slots: GearSlot[] = SLOT_REQUIREMENTS.map((req, index) => ({
		id: `slot-${index}`,
		position: index,
		requiredTeeth: req.teeth,
		requiredMaterial: req.material,
		requiredSize: req.size,
		placedGear: null
	}));

	return {
		gears: [...GEARS],
		slots,
		melodyPattern: MELODY_PATTERN,
		allGearsPlaced: false,
		completed: false,
		isPlaying: false
	};
}

// Check if a gear can be placed in a slot
export function canPlaceGear(gear: Gear, slot: GearSlot): boolean {
	if (gear.isDistractor) return false;
	if (gear.teeth !== slot.requiredTeeth) return false;
	if (gear.material !== slot.requiredMaterial) return false;
	if (gear.size !== slot.requiredSize) return false;
	return true;
}

// Place a gear in a slot
export function placeGear(
	state: MusicBoxState,
	gearId: string,
	slotId: string
): MusicBoxState {
	const gear = state.gears.find(g => g.id === gearId);
	const slot = state.slots.find(s => s.id === slotId);

	if (!gear || !slot) return state;

	// Check if gear can be placed
	if (!canPlaceGear(gear, slot)) {
		return state; // Gear doesn't fit
	}

	// Remove gear from any previous slot
	state.slots.forEach(s => {
		if (s.placedGear === gearId) {
			s.placedGear = null;
		}
	});

	// If slot already has a gear, remove it
	if (slot.placedGear) {
		// The previous gear goes back to available
	}

	// Place gear
	slot.placedGear = gearId;

	// Check if all gears placed
	state.allGearsPlaced = state.slots.every(s => s.placedGear !== null);

	return { ...state };
}

// Remove a gear from a slot
export function removeGear(state: MusicBoxState, slotId: string): MusicBoxState {
	const slot = state.slots.find(s => s.id === slotId);
	if (!slot) return state;

	slot.placedGear = null;
	state.allGearsPlaced = state.slots.every(s => s.placedGear !== null);

	return { ...state };
}

// Validate solution
export function validateSolution(state: PuzzleState): boolean {
	const puzzleState = state.data as unknown as MusicBoxState;
	if (!puzzleState) return false;

	// All slots must have correct gears
	return puzzleState.slots.every(slot => {
		if (!slot.placedGear) return false;
		const gear = puzzleState.gears.find(g => g.id === slot.placedGear);
		if (!gear) return false;
		return canPlaceGear(gear, slot);
	});
}

// Check if puzzle is complete
export function checkComplete(state: MusicBoxState): boolean {
	return state.slots.every(slot => {
		if (!slot.placedGear) return false;
		const gear = state.gears.find(g => g.id === slot.placedGear);
		if (!gear) return false;
		return canPlaceGear(gear, slot);
	});
}

// Play melody (returns the pattern for audio playback)
export function playMelody(state: MusicBoxState): MelodyNote[] {
	if (!checkComplete(state)) return [];
	state.isPlaying = true;
	state.completed = true;
	return state.melodyPattern;
}

// Get player-specific view
export function getPlayerView(state: MusicBoxState, role: PlayerRole): {
	view: 'gears' | 'diagram';
	gears?: Gear[];
	slots?: GearSlot[];
	diagram?: {
		slots: Array<{
			position: number;
			requiredTeeth: number;
			requiredMaterial: string;
			requiredSize: string;
		}>;
	};
	melodyPattern: MelodyNote[];
	completed: boolean;
} {
	if (role === 'explorer') {
		// Player A sees gears and slots to place them
		return {
			view: 'gears',
			gears: state.gears.filter(g => !g.isDistractor),
			slots: state.slots,
			melodyPattern: state.completed ? state.melodyPattern : [],
			completed: state.completed
		};
	} else {
		// Player B sees the assembly diagram with specifications
		return {
			view: 'diagram',
			diagram: {
				slots: state.slots.map(s => ({
					position: s.position,
					requiredTeeth: s.requiredTeeth,
					requiredMaterial: s.requiredMaterial,
					requiredSize: s.requiredSize
				}))
			},
			melodyPattern: state.completed ? state.melodyPattern : [],
			completed: state.completed
		};
	}
}

// Get gear description for Player A
export function getGearDescription(gear: Gear): string {
	const sizeDesc = gear.size === 'small' ? 'small' : gear.size === 'medium' ? 'medium-sized' : 'large';
	const materialDesc = gear.material;
	return `${sizeDesc} ${materialDesc} gear with ${gear.teeth} teeth`;
}

// Puzzle definition
export const MusicBoxPuzzle: PuzzleDefinition = {
	id: ROOM1_PUZZLE_IDS.MUSIC_BOX,
	roomId: 'attic',
	name: 'Music Box',
	description: 'Work together to assemble the music box. One player has the gears, the other has the assembly diagram.',
	requiredRoles: ['explorer', 'analyst'],
	solutionValidator: validateSolution,
	hints: HINTS
};

export default MusicBoxPuzzle;

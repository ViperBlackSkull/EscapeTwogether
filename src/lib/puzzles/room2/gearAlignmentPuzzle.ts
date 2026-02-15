/**
 * Gear Alignment Puzzle (Room 2, Puzzle 2)
 *
 * A cooperation puzzle where Player A sees the front of gears (teeth visible),
 * and Player B sees the back (alignment marks). Players must communicate
 * to align all marks simultaneously for 1.5 seconds.
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';
import { puzzleImages } from '$lib/assets/images';

export const GEAR_ALIGNMENT_PUZZLE_ID = 'room2_gear_alignment';

// Visual assets for this puzzle
export const GEAR_ALIGNMENT_ASSETS = {
	// Cipher wheel for gear visuals
	gearVisual: puzzleImages.cipherWheel,

	// Vintage keys for key/lock theming
	mechanicalElements: puzzleImages.antiqueKeys,

	// Ornate frame
	ornateFrame: puzzleImages.victorianOrnament,

	// Background texture
	background: puzzleImages.puzzleTexture,

	// Compass for direction indicators
	directionGuide: puzzleImages.compass,

	// Hourglass for timing visual
	timingIndicator: puzzleImages.hourglass
} as const;

export interface Gear {
	id: string;
	rotation: number; // 0-360 degrees
	radius: number;
	teeth: number;
	connectedTo: string[]; // IDs of connected gears
	// Alignment marks (visible only from back)
	markAngle: number; // Where the mark is on this gear
}

export interface GearAlignmentPuzzleData {
	gears: Gear[];
	// Which gear each player is currently controlling
	playerASelectedGear: string | null;
	playerBSelectedGear: string | null;
	// Rotation speed (degrees per update)
	rotationSpeed: number;
	// Completion tracking
	allAlignedStartTime: number | null;
	requiredAlignmentTime: number; // ms (2000)
	// Alignment tolerance (degrees)
	alignmentTolerance: number;
}

export interface GearAlignmentPuzzleState extends PuzzleState {
	puzzleId: typeof GEAR_ALIGNMENT_PUZZLE_ID;
	data: GearAlignmentPuzzleData;
}

// Default gear configuration - 4 interconnected gears
const DEFAULT_GEARS: Gear[] = [
	{
		id: 'gear_1',
		rotation: 45,
		radius: 60,
		teeth: 12,
		connectedTo: ['gear_2'],
		markAngle: 0,
	},
	{
		id: 'gear_2',
		rotation: 180,
		radius: 45,
		teeth: 9,
		connectedTo: ['gear_1', 'gear_3'],
		markAngle: 90,
	},
	{
		id: 'gear_3',
		rotation: 270,
		radius: 50,
		teeth: 10,
		connectedTo: ['gear_2', 'gear_4'],
		markAngle: 180,
	},
	{
		id: 'gear_4',
		rotation: 90,
		radius: 55,
		teeth: 11,
		connectedTo: ['gear_3'],
		markAngle: 270,
	},
];

export function createInitialGearAlignmentState(): GearAlignmentPuzzleData {
	return {
		gears: DEFAULT_GEARS.map(gear => ({ ...gear })),
		playerASelectedGear: null,
		playerBSelectedGear: null,
		rotationSpeed: 5,
		allAlignedStartTime: null,
		requiredAlignmentTime: 1500, // Reduced from 2000ms to 1500ms
		alignmentTolerance: 20, // Increased from 15 to 20 degrees
	};
}

// Check if a gear's mark is aligned (pointing up at 0 degrees)
function isGearMarkAligned(gear: Gear, tolerance: number): boolean {
	// Normalize rotation to 0-360
	const normalizedRotation = ((gear.rotation % 360) + 360) % 360;
	// Check if the mark (at markAngle) is at the top (0 degrees)
	const markPosition = (normalizedRotation + gear.markAngle) % 360;

	// Check if mark is at top (0) within tolerance
	const diff = Math.min(
		Math.abs(markPosition),
		Math.abs(markPosition - 360)
	);
	return diff <= tolerance;
}

// Check if all gears are aligned
export function areAllGearsAligned(data: GearAlignmentPuzzleData): boolean {
	return data.gears.every(gear => isGearMarkAligned(gear, data.alignmentTolerance));
}

// Rotate a gear and all connected gears
export function rotateGear(data: GearAlignmentPuzzleData, gearId: string, direction: 'cw' | 'ccw'): GearAlignmentPuzzleData {
	const rotationDelta = direction === 'cw' ? data.rotationSpeed : -data.rotationSpeed;

	// Find the gear and calculate gear ratios for connected gears
	const updatedGears = [...data.gears];
	const gearIndex = updatedGears.findIndex(g => g.id === gearId);

	if (gearIndex === -1) return data;

	const mainGear = updatedGears[gearIndex];
	updatedGears[gearIndex] = {
		...mainGear,
		rotation: (mainGear.rotation + rotationDelta) % 360,
	};

	// Propagate rotation to connected gears (opposite direction, scaled by teeth ratio)
	const propagateRotation = (gear: Gear, delta: number, visited: Set<string>) => {
		if (visited.has(gear.id)) return;
		visited.add(gear.id);

		const idx = updatedGears.findIndex(g => g.id === gear.id);
		if (idx === -1) return;

		// Find the gear that's driving this one to calculate ratio
		const connectedGearIdx = updatedGears.findIndex(g =>
			g.connectedTo.includes(gear.id) && visited.has(g.id)
		);

		let actualDelta = delta;
		if (connectedGearIdx !== -1) {
			const driverGear = updatedGears[connectedGearIdx];
			const ratio = driverGear.teeth / gear.teeth;
			actualDelta = -delta * ratio; // Reverse direction
		}

		updatedGears[idx] = {
			...gear,
			rotation: (gear.rotation + actualDelta) % 360,
		};

		// Propagate to all connected gears
		for (const connectedId of gear.connectedTo) {
			const connectedGear = updatedGears.find(g => g.id === connectedId);
			if (connectedGear) {
				propagateRotation(connectedGear, actualDelta, visited);
			}
		}
	};

	propagateRotation(updatedGears[gearIndex], rotationDelta, new Set());

	// Check alignment
	const nowAligned = areAllGearsAligned({ ...data, gears: updatedGears });
	const allAlignedStartTime = nowAligned
		? (data.allAlignedStartTime ?? Date.now())
		: null;

	return {
		...data,
		gears: updatedGears,
		allAlignedStartTime,
	};
}

// Select a gear for rotation
export function selectGear(data: GearAlignmentPuzzleData, gearId: string, player: 'A' | 'B'): GearAlignmentPuzzleData {
	if (player === 'A') {
		return { ...data, playerASelectedGear: gearId };
	} else {
		return { ...data, playerBSelectedGear: gearId };
	}
}

// Deselect a gear
export function deselectGear(data: GearAlignmentPuzzleData, player: 'A' | 'B'): GearAlignmentPuzzleData {
	if (player === 'A') {
		return { ...data, playerASelectedGear: null };
	} else {
		return { ...data, playerBSelectedGear: null };
	}
}

// Check if puzzle is solved (all aligned for required time)
export function isGearAlignmentSolved(data: GearAlignmentPuzzleData): boolean {
	if (!areAllGearsAligned(data)) return false;
	if (!data.allAlignedStartTime) return false;
	return Date.now() - data.allAlignedStartTime >= data.requiredAlignmentTime;
}

// Get alignment time remaining
export function getAlignmentTimeRemaining(data: GearAlignmentPuzzleData): number | null {
	if (!data.allAlignedStartTime) return null;
	const elapsed = Date.now() - data.allAlignedStartTime;
	return Math.max(0, data.requiredAlignmentTime - elapsed);
}

// Reset puzzle
export function resetGearAlignmentPuzzle(): GearAlignmentPuzzleData {
	return createInitialGearAlignmentState();
}

// Hints
export const GEAR_ALIGNMENT_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "One player sees the gear teeth, the other sees alignment marks on the back. You'll need to communicate to align them.",
		triggerAttempts: 3,
	},
	{
		tier: 2,
		text: "Each gear has a mark that needs to point upward (12 o'clock position). The marks are at different positions on each gear. Tell your partner how much to rotate each gear. Marks are aligned within 20 degrees.",
		triggerAttempts: 6,
	},
	{
		tier: 3,
		text: "All marks must be at the top simultaneously for 1.5 seconds. Connected gears rotate together but at different speeds based on their teeth count. Start from the largest gear and work outward.",
		triggerAttempts: 10,
	},
];

// Role-based view data
export function getGearAlignmentViewData(role: PlayerRole, data: GearAlignmentPuzzleData): Record<string, unknown> {
	// Base data both players see
	const baseData = {
		gears: data.gears.map(g => ({
			id: g.id,
			radius: g.radius,
			teeth: g.teeth,
			rotation: g.rotation,
		})),
		selectedGear: role === 'explorer' ? data.playerASelectedGear : data.playerBSelectedGear,
		alignmentProgress: areAllGearsAligned(data)
			? Math.min(100, ((Date.now() - (data.allAlignedStartTime ?? 0)) / data.requiredAlignmentTime) * 100)
			: 0,
	};

	if (role === 'explorer') {
		// Player A (Explorer) sees front view - teeth visible, no marks
		return {
			...baseData,
			viewType: 'front',
			showMarks: false,
			showTeeth: true,
		};
	} else {
		// Player B (Analyst) sees back view - alignment marks visible
		return {
			...baseData,
			viewType: 'back',
			showMarks: true,
			showTeeth: false,
			marks: data.gears.map(g => ({
				gearId: g.id,
				markAngle: g.markAngle,
				isAligned: isGearMarkAligned(g, data.alignmentTolerance),
			})),
		};
	}
}

// Export puzzle definition
export const gearAlignmentPuzzleDefinition = {
	id: GEAR_ALIGNMENT_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Gear Alignment',
	description: 'Align all the gear marks by communicating between front and back views.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: GEAR_ALIGNMENT_HINTS,
	createInitialState: createInitialGearAlignmentState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== GEAR_ALIGNMENT_PUZZLE_ID) return false;
		return isGearAlignmentSolved(state.data as unknown as GearAlignmentPuzzleData);
	},
};

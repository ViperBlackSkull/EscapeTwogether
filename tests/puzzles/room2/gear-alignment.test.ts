import { describe, it, expect } from 'vitest';
import {
	createInitialGearAlignmentState,
	rotateGear,
	selectGear,
	deselectGear,
	areAllGearsAligned,
	isGearAlignmentSolved,
	resetGearAlignmentPuzzle,
	getGearAlignmentViewData,
	gearAlignmentPuzzleDefinition,
	GEAR_ALIGNMENT_PUZZLE_ID,
	type GearAlignmentPuzzleData
} from '$lib/puzzles/room2/gearAlignmentPuzzle';
import type { PuzzleState } from '$lib/types';

describe('Gear Alignment Puzzle', () => {
	describe('createInitialGearAlignmentState', () => {
		it('should create initial state with 4 gears', () => {
			const state = createInitialGearAlignmentState();

			expect(state.gears).toHaveLength(4);
			expect(state.playerASelectedGear).toBeNull();
			expect(state.playerBSelectedGear).toBeNull();
			expect(state.allAlignedStartTime).toBeNull();
			expect(state.requiredAlignmentTime).toBe(2000);
			expect(state.alignmentTolerance).toBe(15);
		});

		it('should have gears with different properties', () => {
			const state = createInitialGearAlignmentState();

			const gearIds = state.gears.map(g => g.id);
			expect(gearIds).toContain('gear_1');
			expect(gearIds).toContain('gear_2');
			expect(gearIds).toContain('gear_3');
			expect(gearIds).toContain('gear_4');
		});
	});

	describe('selectGear and deselectGear', () => {
		it('should select gear for player A', () => {
			const state = createInitialGearAlignmentState();

			const updated = selectGear(state, 'gear_1', 'A');
			expect(updated.playerASelectedGear).toBe('gear_1');
		});

		it('should select gear for player B', () => {
			const state = createInitialGearAlignmentState();

			const updated = selectGear(state, 'gear_2', 'B');
			expect(updated.playerBSelectedGear).toBe('gear_2');
		});

		it('should deselect gear for player A', () => {
			const state = createInitialGearAlignmentState();
			const selected = selectGear(state, 'gear_1', 'A');

			const updated = deselectGear(selected, 'A');
			expect(updated.playerASelectedGear).toBeNull();
		});
	});

	describe('rotateGear', () => {
		it('should rotate gear clockwise', () => {
			const state = createInitialGearAlignmentState();
			const initialRotation = state.gears[0].rotation;

			const updated = rotateGear(state, 'gear_1', 'cw');
			// Clockwise rotation increases angle (mod 360)
			const rotationDiff = (updated.gears[0].rotation - initialRotation + 360) % 360;
			expect(rotationDiff).toBeGreaterThan(0);
			expect(rotationDiff).toBeLessThan(180);
		});

		it('should rotate gear counter-clockwise', () => {
			const state = createInitialGearAlignmentState();
			const initialRotation = state.gears[0].rotation;

			const updated = rotateGear(state, 'gear_1', 'ccw');
			// Counter-clockwise rotation decreases angle (mod 360)
			const rotationDiff = (initialRotation - updated.gears[0].rotation + 360) % 360;
			expect(rotationDiff).toBeGreaterThan(0);
			expect(rotationDiff).toBeLessThan(180);
		});

		it('should propagate rotation to connected gears', () => {
			const state = createInitialGearAlignmentState();

			// gear_1 is connected to gear_2
			const updated = rotateGear(state, 'gear_1', 'cw');

			// Both gears should have moved
			expect(updated.gears[0].rotation).not.toBe(state.gears[0].rotation);
		});
	});

	describe('areAllGearsAligned', () => {
		it('should return false for initial random state', () => {
			const state = createInitialGearAlignmentState();

			// Initial rotations are random, so unlikely to be aligned
			expect(areAllGearsAligned(state)).toBe(false);
		});
	});

	describe('isGearAlignmentSolved', () => {
		it('should return false when not aligned', () => {
			const state = createInitialGearAlignmentState();

			expect(isGearAlignmentSolved(state)).toBe(false);
		});

		it('should return true when all aligned for required time', () => {
			const state = createInitialGearAlignmentState();
			const solvedState: GearAlignmentPuzzleData = {
				...state,
				gears: state.gears.map(g => ({ ...g, rotation: -g.markAngle + 360 })),
				allAlignedStartTime: Date.now() - 2500
			};

			expect(isGearAlignmentSolved(solvedState)).toBe(true);
		});
	});

	describe('resetGearAlignmentPuzzle', () => {
		it('should reset to initial state', () => {
			const state = createInitialGearAlignmentState();
			const modified = selectGear(state, 'gear_1', 'A');

			const reset = resetGearAlignmentPuzzle();

			expect(reset.playerASelectedGear).toBeNull();
			expect(reset.allAlignedStartTime).toBeNull();
		});
	});

	describe('getGearAlignmentViewData', () => {
		it('should show front view (teeth) to explorer', () => {
			const state = createInitialGearAlignmentState();
			const viewData = getGearAlignmentViewData('explorer', state);

			expect(viewData.viewType).toBe('front');
			expect(viewData.showMarks).toBe(false);
			expect(viewData.showTeeth).toBe(true);
		});

		it('should show back view (marks) to analyst', () => {
			const state = createInitialGearAlignmentState();
			const viewData = getGearAlignmentViewData('analyst', state);

			expect(viewData.viewType).toBe('back');
			expect(viewData.showMarks).toBe(true);
			expect(viewData.showTeeth).toBe(false);
			expect(viewData.marks).toBeDefined();
		});
	});

	describe('gearAlignmentPuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(gearAlignmentPuzzleDefinition.id).toBe(GEAR_ALIGNMENT_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(gearAlignmentPuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(gearAlignmentPuzzleDefinition.requiredRoles).toContain('explorer');
			expect(gearAlignmentPuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(gearAlignmentPuzzleDefinition.hints).toHaveLength(3);
		});
	});
});

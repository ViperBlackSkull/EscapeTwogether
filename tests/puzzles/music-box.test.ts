import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	canPlaceGear,
	placeGear,
	removeGear,
	validateSolution,
	checkComplete,
	getPlayerView,
	MusicBoxPuzzle
} from '$lib/puzzles/room1/music-box';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import type { PuzzleState } from '$lib/types';

describe('Music Box Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 5 gears and 3 slots', () => {
			const state = createInitialState();

			expect(state.gears).toHaveLength(5);
			expect(state.slots).toHaveLength(3);
			expect(state.completed).toBe(false);
			expect(state.isPlaying).toBe(false);
		});

		it('should have 3 correct gears and 2 distractors', () => {
			const state = createInitialState();

			const correctGears = state.gears.filter(g => g.isCorrect);
			const distractorGears = state.gears.filter(g => g.isDistractor);

			expect(correctGears).toHaveLength(3);
			expect(distractorGears).toHaveLength(2);
		});

		it('should have empty slots initially', () => {
			const state = createInitialState();

			expect(state.slots.every(s => s.placedGear === null)).toBe(true);
		});
	});

	describe('canPlaceGear', () => {
		it('should allow correct gear in matching slot', () => {
			const state = createInitialState();

			const smallBrassGear = state.gears.find(g => g.id === 'gear-small-brass')!;
			const slot0 = state.slots.find(s => s.id === 'slot-0')!;

			expect(canPlaceGear(smallBrassGear, slot0)).toBe(true);
		});

		it('should reject gear with wrong teeth count', () => {
			const state = createInitialState();

			const gear = state.gears.find(g => g.id === 'gear-medium-brass')!;
			const slot = state.slots.find(s => s.id === 'slot-0')!;

			expect(canPlaceGear(gear, slot)).toBe(false);
		});

		it('should reject gear with wrong material', () => {
			const state = createInitialState();

			const gear = state.gears.find(g => g.id === 'gear-small-wood')!;
			const slot = state.slots.find(s => s.id === 'slot-0')!;

			expect(canPlaceGear(gear, slot)).toBe(false);
		});

		it('should reject distractor gears', () => {
			const state = createInitialState();

			const distractor = state.gears.find(g => g.isDistractor)!;
			const anySlot = state.slots[0];

			expect(canPlaceGear(distractor, anySlot)).toBe(false);
		});
	});

	describe('placeGear', () => {
		it('should place correct gear in correct slot', () => {
			let state = createInitialState();

			state = placeGear(state, 'gear-small-brass', 'slot-0');

			const slot = state.slots.find(s => s.id === 'slot-0');
			expect(slot?.placedGear).toBe('gear-small-brass');
		});

		it('should not place incorrect gear in slot', () => {
			let state = createInitialState();

			state = placeGear(state, 'gear-small-wood', 'slot-0');

			const slot = state.slots.find(s => s.id === 'slot-0');
			expect(slot?.placedGear).toBeNull();
		});

		it('should allow moving gear to different valid slot', () => {
			let state = createInitialState();

			// Place small brass in slot-0 (valid)
			state = placeGear(state, 'gear-small-brass', 'slot-0');
			expect(state.slots[0].placedGear).toBe('gear-small-brass');

			// Remove it
			state = removeGear(state, 'slot-0');
			expect(state.slots[0].placedGear).toBeNull();

			// Place medium steel in slot-1 (valid)
			state = placeGear(state, 'gear-medium-steel', 'slot-1');
			expect(state.slots[1].placedGear).toBe('gear-medium-steel');
		});
	});

	describe('removeGear', () => {
		it('should remove gear from slot', () => {
			let state = createInitialState();

			state = placeGear(state, 'gear-small-brass', 'slot-0');
			expect(state.slots[0].placedGear).toBe('gear-small-brass');

			state = removeGear(state, 'slot-0');
			expect(state.slots[0].placedGear).toBeNull();
		});
	});

	describe('checkComplete', () => {
		it('should return false when not all gears placed', () => {
			const state = createInitialState();

			expect(checkComplete(state)).toBe(false);
		});

		it('should return true when all correct gears placed', () => {
			let state = createInitialState();

			state = placeGear(state, 'gear-small-brass', 'slot-0');
			state = placeGear(state, 'gear-medium-steel', 'slot-1');
			state = placeGear(state, 'gear-large-wood', 'slot-2');

			expect(checkComplete(state)).toBe(true);
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const puzzleState = createInitialState();
			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.MUSIC_BOX,
				solved: false,
				attempts: 0,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(false);
		});

		it('should return true when all correct gears placed', () => {
			let puzzleState = createInitialState();

			puzzleState = placeGear(puzzleState, 'gear-small-brass', 'slot-0');
			puzzleState = placeGear(puzzleState, 'gear-medium-steel', 'slot-1');
			puzzleState = placeGear(puzzleState, 'gear-large-wood', 'slot-2');

			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.MUSIC_BOX,
				solved: false,
				attempts: 3,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer gears view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.view).toBe('gears');
			expect(view.gears).toBeDefined();
			expect(view.slots).toBeDefined();
		});

		it('should give analyst diagram view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.view).toBe('diagram');
			expect(view.diagram).toBeDefined();
			expect(view.diagram?.slots).toHaveLength(3);
		});

		it('should filter out distractors from explorer view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			// Explorer only sees non-distractor gears
			const allNonDistractor = view.gears?.every(g => !g.isDistractor);
			expect(allNonDistractor).toBe(true);
		});
	});

	describe('PuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(MusicBoxPuzzle.id).toBe(ROOM1_PUZZLE_IDS.MUSIC_BOX);
		});

		it('should be in the attic room', () => {
			expect(MusicBoxPuzzle.roomId).toBe('attic');
		});

		it('should require both roles', () => {
			expect(MusicBoxPuzzle.requiredRoles).toContain('explorer');
			expect(MusicBoxPuzzle.requiredRoles).toContain('analyst');
		});

		it('should have hints defined', () => {
			expect(MusicBoxPuzzle.hints).toHaveLength(3);
		});
	});
});

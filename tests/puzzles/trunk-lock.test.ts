import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	getNextSymbol,
	getPreviousSymbol,
	rotateDial,
	updateAllCorrect,
	updateLockTimer,
	setDial,
	validateSolution,
	getPlayerView,
	TrunkLockPuzzle
} from '$lib/puzzles/room1/trunk-lock';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import type { PuzzleState } from '$lib/types';
import type { DialSymbol } from '$lib/puzzles/room1/trunk-lock';

describe('Trunk Lock Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 4 dials', () => {
			const state = createInitialState();

			expect(state.dials).toHaveLength(4);
			expect(state.completed).toBe(false);
			expect(state.correctDuration).toBe(0);
			expect(state.requiredDuration).toBe(3000);
		});

		it('should have explorer control dials 1 and 3', () => {
			const state = createInitialState();

			const explorerDials = state.dials.filter(d => d.controlledBy === 'explorer');
			expect(explorerDials).toHaveLength(2);
			expect(explorerDials.map(d => d.position)).toEqual([1, 3]);
		});

		it('should have analyst control dials 2 and 4', () => {
			const state = createInitialState();

			const analystDials = state.dials.filter(d => d.controlledBy === 'analyst');
			expect(analystDials).toHaveLength(2);
			expect(analystDials.map(d => d.position)).toEqual([2, 4]);
		});

		it('should not start with all dials correct', () => {
			const state = createInitialState();

			expect(state.allCorrect).toBe(false);
		});
	});

	describe('getNextSymbol / getPreviousSymbol', () => {
		it('should cycle through symbols forward', () => {
			expect(getNextSymbol('heart')).toBe('rose');
			expect(getNextSymbol('infinity')).toBe('heart'); // Wraps around
		});

		it('should cycle through symbols backward', () => {
			expect(getPreviousSymbol('rose')).toBe('heart');
			expect(getPreviousSymbol('heart')).toBe('infinity'); // Wraps around
		});
	});

	describe('rotateDial', () => {
		it('should rotate dial forward for correct player', () => {
			let state = createInitialState();

			state = rotateDial(state, 'dial-1', 'forward', 'explorer');

			const dial = state.dials.find(d => d.id === 'dial-1');
			// moon -> dove (next in array: heart, rose, key, star, moon, dove...)
			expect(dial?.currentSymbol).toBe('dove');
		});

		it('should rotate dial backward for correct player', () => {
			let state = createInitialState();

			state = rotateDial(state, 'dial-1', 'backward', 'explorer');

			const dial = state.dials.find(d => d.id === 'dial-1');
			// moon -> star (previous in array)
			expect(dial?.currentSymbol).toBe('star');
		});

		it('should not rotate dial for wrong player', () => {
			let state = createInitialState();

			state = rotateDial(state, 'dial-1', 'forward', 'analyst');

			const dial = state.dials.find(d => d.id === 'dial-1');
			expect(dial?.currentSymbol).toBe('moon'); // Unchanged
		});

		it('should reset correct duration when dial changes', () => {
			let state = createInitialState();
			state.correctDuration = 1000;

			state = rotateDial(state, 'dial-1', 'forward', 'explorer');

			expect(state.correctDuration).toBe(0);
		});
	});

	describe('updateAllCorrect', () => {
		it('should return true when all dials are correct', () => {
			let state = createInitialState();

			state = setDial(state, 'dial-1', 'heart', 'explorer');
			state = setDial(state, 'dial-2', 'rose', 'analyst');
			state = setDial(state, 'dial-3', 'key', 'explorer');
			state = setDial(state, 'dial-4', 'star', 'analyst');
			state = updateAllCorrect(state);

			expect(state.allCorrect).toBe(true);
		});

		it('should return false when any dial is wrong', () => {
			let state = createInitialState();

			state = setDial(state, 'dial-1', 'heart', 'explorer');
			state = setDial(state, 'dial-2', 'rose', 'analyst');
			state = setDial(state, 'dial-3', 'key', 'explorer');
			// dial-4 wrong
			state = updateAllCorrect(state);

			expect(state.allCorrect).toBe(false);
		});
	});

	describe('updateLockTimer', () => {
		it('should increase progress when all dials correct', () => {
			let state = createInitialState();

			// Set all correct
			state = setDial(state, 'dial-1', 'heart', 'explorer');
			state = setDial(state, 'dial-2', 'rose', 'analyst');
			state = setDial(state, 'dial-3', 'key', 'explorer');
			state = setDial(state, 'dial-4', 'star', 'analyst');

			state = updateLockTimer(state, 1000);

			expect(state.correctDuration).toBe(1000);
			expect(state.unlockProgress).toBeCloseTo(33.33, 1);
		});

		it('should complete after 3 seconds of correct dials', () => {
			let state = createInitialState();

			// Set all correct
			state = setDial(state, 'dial-1', 'heart', 'explorer');
			state = setDial(state, 'dial-2', 'rose', 'analyst');
			state = setDial(state, 'dial-3', 'key', 'explorer');
			state = setDial(state, 'dial-4', 'star', 'analyst');

			state = updateLockTimer(state, 3000);

			expect(state.completed).toBe(true);
			expect(state.unlockProgress).toBe(100);
		});

		it('should reset progress when dials become incorrect', () => {
			let state = createInitialState();

			// Set all correct
			state = setDial(state, 'dial-1', 'heart', 'explorer');
			state = setDial(state, 'dial-2', 'rose', 'analyst');
			state = setDial(state, 'dial-3', 'key', 'explorer');
			state = setDial(state, 'dial-4', 'star', 'analyst');

			state = updateLockTimer(state, 2000);
			expect(state.correctDuration).toBe(2000);

			// Change one dial
			state = rotateDial(state, 'dial-1', 'forward', 'explorer');
			state = updateLockTimer(state, 500);

			expect(state.correctDuration).toBe(0);
		});
	});

	describe('setDial', () => {
		it('should set dial to specific symbol', () => {
			let state = createInitialState();

			state = setDial(state, 'dial-1', 'star' as DialSymbol, 'explorer');

			const dial = state.dials.find(d => d.id === 'dial-1');
			expect(dial?.currentSymbol).toBe('star');
		});

		it('should not set dial for wrong player', () => {
			let state = createInitialState();

			state = setDial(state, 'dial-1', 'star' as DialSymbol, 'analyst');

			const dial = state.dials.find(d => d.id === 'dial-1');
			expect(dial?.currentSymbol).toBe('moon'); // Unchanged
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const puzzleState = createInitialState();
			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TRUNK_LOCK,
				solved: false,
				attempts: 0,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(false);
		});

		it('should return true when completed', () => {
			const puzzleState = createInitialState();
			puzzleState.completed = true;

			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TRUNK_LOCK,
				solved: true,
				attempts: 5,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should show explorer their controlled dials', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.controlledDials).toHaveLength(2);
			expect(view.controlledDials.map(d => d.id)).toEqual(['dial-1', 'dial-3']);
		});

		it('should show analyst their controlled dials', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.controlledDials).toHaveLength(2);
			expect(view.controlledDials.map(d => d.id)).toEqual(['dial-2', 'dial-4']);
		});

		it('should show partner dials', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.partnerDials).toHaveLength(2);
			expect(view.partnerDials.map(d => d.id)).toEqual(['dial-2', 'dial-4']);
		});
	});

	describe('PuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(TrunkLockPuzzle.id).toBe(ROOM1_PUZZLE_IDS.TRUNK_LOCK);
		});

		it('should be in the attic room', () => {
			expect(TrunkLockPuzzle.roomId).toBe('attic');
		});

		it('should require both roles', () => {
			expect(TrunkLockPuzzle.requiredRoles).toContain('explorer');
			expect(TrunkLockPuzzle.requiredRoles).toContain('analyst');
		});

		it('should have hints defined', () => {
			expect(TrunkLockPuzzle.hints).toHaveLength(3);
		});
	});
});

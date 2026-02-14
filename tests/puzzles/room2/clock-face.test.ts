import { describe, it, expect } from 'vitest';
import {
	createInitialClockFaceState,
	setPlayerTimeInput,
	submitPlayerAnswer,
	isClockFaceSolved,
	resetClockFacePuzzle,
	getClockFaceViewData,
	getHourHandAngle,
	getMinuteHandAngle,
	clockFacePuzzleDefinition,
	CLOCK_FACE_PUZZLE_ID,
	type ClockFacePuzzleData,
	type ClockTime
} from '$lib/puzzles/room2/clockFacePuzzle';
import type { PuzzleState } from '$lib/types';

describe('Clock Face Puzzle', () => {
	describe('createInitialClockFaceState', () => {
		it('should create initial state with different player views', () => {
			const state = createInitialClockFaceState();

			expect(state.playerAView.hours).toBe(3);
			expect(state.playerAView.minutes).toBe(15);
			expect(state.playerBView.hours).toBe(9);
			expect(state.playerBView.minutes).toBe(45);
		});

		it('should have correct time as midnight', () => {
			const state = createInitialClockFaceState();

			expect(state.correctTime.hours).toBe(12);
			expect(state.correctTime.minutes).toBe(0);
		});

		it('should start with no inputs', () => {
			const state = createInitialClockFaceState();

			expect(state.playerAInput).toBeNull();
			expect(state.playerBInput).toBeNull();
			expect(state.playerASubmitted).toBe(false);
			expect(state.playerBSubmitted).toBe(false);
		});
	});

	describe('setPlayerTimeInput', () => {
		it('should set player A input', () => {
			const state = createInitialClockFaceState();
			const time: ClockTime = { hours: 12, minutes: 0 };

			const updated = setPlayerTimeInput(state, 'A', time);

			expect(updated.playerAInput).toEqual(time);
		});

		it('should set player B input', () => {
			const state = createInitialClockFaceState();
			const time: ClockTime = { hours: 12, minutes: 0 };

			const updated = setPlayerTimeInput(state, 'B', time);

			expect(updated.playerBInput).toEqual(time);
		});
	});

	describe('submitPlayerAnswer', () => {
		it('should mark player A as submitted', () => {
			const state = createInitialClockFaceState();
			const withInput = setPlayerTimeInput(state, 'A', { hours: 12, minutes: 0 });

			const updated = submitPlayerAnswer(withInput, 'A');

			expect(updated.playerASubmitted).toBe(true);
			expect(updated.playerACorrect).toBe(true);
		});

		it('should mark incorrect answer as wrong', () => {
			const state = createInitialClockFaceState();
			const withInput = setPlayerTimeInput(state, 'A', { hours: 3, minutes: 15 });

			const updated = submitPlayerAnswer(withInput, 'A');

			expect(updated.playerASubmitted).toBe(true);
			expect(updated.playerACorrect).toBe(false);
		});

		it('should complete puzzle when both players submit correct', () => {
			let state = createInitialClockFaceState();
			state = setPlayerTimeInput(state, 'A', { hours: 12, minutes: 0 });
			state = setPlayerTimeInput(state, 'B', { hours: 12, minutes: 0 });
			state = submitPlayerAnswer(state, 'A');
			state = submitPlayerAnswer(state, 'B');

			expect(state.puzzleComplete).toBe(true);
		});

		it('should not complete puzzle with wrong answers', () => {
			let state = createInitialClockFaceState();
			state = setPlayerTimeInput(state, 'A', { hours: 3, minutes: 15 });
			state = setPlayerTimeInput(state, 'B', { hours: 12, minutes: 0 });
			state = submitPlayerAnswer(state, 'A');
			state = submitPlayerAnswer(state, 'B');

			expect(state.puzzleComplete).toBe(false);
		});
	});

	describe('isClockFaceSolved', () => {
		it('should return false initially', () => {
			const state = createInitialClockFaceState();

			expect(isClockFaceSolved(state)).toBe(false);
		});

		it('should return true when puzzle is complete', () => {
			const state: ClockFacePuzzleData = {
				...createInitialClockFaceState(),
				puzzleComplete: true
			};

			expect(isClockFaceSolved(state)).toBe(true);
		});
	});

	describe('resetClockFacePuzzle', () => {
		it('should reset to initial state', () => {
			let state = createInitialClockFaceState();
			state = setPlayerTimeInput(state, 'A', { hours: 12, minutes: 0 });
			state = submitPlayerAnswer(state, 'A');

			const reset = resetClockFacePuzzle();

			expect(reset.playerAInput).toBeNull();
			expect(reset.playerASubmitted).toBe(false);
		});
	});

	describe('getHourHandAngle', () => {
		it('should return 0 for 12:00', () => {
			expect(getHourHandAngle({ hours: 12, minutes: 0 })).toBe(0);
		});

		it('should return 90 for 3:00', () => {
			expect(getHourHandAngle({ hours: 3, minutes: 0 })).toBe(90);
		});

		it('should include minute contribution', () => {
			// At 3:30, hour hand should be halfway between 3 and 4
			const angle = getHourHandAngle({ hours: 3, minutes: 30 });
			expect(angle).toBe(90 + 15); // 90 + (30 * 0.5)
		});
	});

	describe('getMinuteHandAngle', () => {
		it('should return 0 for 0 minutes', () => {
			expect(getMinuteHandAngle({ hours: 12, minutes: 0 })).toBe(0);
		});

		it('should return 90 for 15 minutes', () => {
			expect(getMinuteHandAngle({ hours: 12, minutes: 15 })).toBe(90);
		});

		it('should return 180 for 30 minutes', () => {
			expect(getMinuteHandAngle({ hours: 12, minutes: 30 })).toBe(180);
		});
	});

	describe('getClockFaceViewData', () => {
		it('should show player A view to explorer', () => {
			const state = createInitialClockFaceState();
			const viewData = getClockFaceViewData('explorer', state);

			expect(viewData.myView).toEqual(state.playerAView);
		});

		it('should show player B view to analyst', () => {
			const state = createInitialClockFaceState();
			const viewData = getClockFaceViewData('analyst', state);

			expect(viewData.myView).toEqual(state.playerBView);
		});

		it('should include hand angles', () => {
			const state = createInitialClockFaceState();
			const viewData = getClockFaceViewData('explorer', state);

			expect(viewData.hourAngle).toBeDefined();
			expect(viewData.minuteAngle).toBeDefined();
		});
	});

	describe('clockFacePuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(clockFacePuzzleDefinition.id).toBe(CLOCK_FACE_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(clockFacePuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(clockFacePuzzleDefinition.requiredRoles).toContain('explorer');
			expect(clockFacePuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(clockFacePuzzleDefinition.hints).toHaveLength(3);
		});
	});
});

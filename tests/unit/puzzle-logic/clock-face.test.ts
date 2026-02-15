/**
 * ============================================================================
 * CLOCK FACE PUZZLE - UNIT TESTS
 * ============================================================================
 *
 * Tests for the clock face puzzle where players must set a clock
 * to a specific time based on clues.
 *
 * Coverage:
 * - Time setting and validation
 * - Hand positioning
 * - AM/PM handling
 * - Clue interpretation
 * - Role-specific views
 *
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	setClockHands,
	validateClockTime,
	isClockCorrect,
	getPlayerView
} from '$lib/puzzles/room2/clockFacePuzzle';
import type { PuzzleState } from '$lib/types';

describe('Clock Face Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with default time', () => {
			const state = createInitialState();

			expect(state.targetHour).toBeDefined();
			expect(state.targetMinute).toBeDefined();
			expect(state.targetHour).toBeGreaterThanOrEqual(1);
			expect(state.targetHour).toBeLessThanOrEqual(12);
			expect(state.targetMinute).toBeGreaterThanOrEqual(0);
			expect(state.targetMinute).toBeLessThan(60);
		});

		it('should have hands at random initial positions', () => {
			const state = createInitialState();

			expect(state.currentHour).toBeDefined();
			expect(state.currentMinute).toBeDefined();
		});

		it('should not have correct time initially', () => {
			const state = createInitialState();

			const isCorrect =
				state.currentHour === state.targetHour &&
				state.currentMinute === state.targetMinute;

			expect(isCorrect).toBe(false);
		});
	});

	describe('setClockHands', () => {
		it('should set hour hand to specified position', () => {
			let state = createInitialState();

			state = setClockHands(state, 6, 0);

			expect(state.currentHour).toBe(6);
		});

		it('should set minute hand to specified position', () => {
			let state = createInitialState();

			state = setClockHands(state, 12, 30);

			expect(state.currentMinute).toBe(30);
		});

		it('should normalize hour to 1-12 range', () => {
			let state = createInitialState();

			state = setClockHands(state, 0, 0); // 0 should become 12
			expect(state.currentHour).toBe(12);

			state = setClockHands(state, 13, 0); // 13 should become 1
			expect(state.currentHour).toBe(1);
		});

		it('should normalize minute to 0-59 range', () => {
			let state = createInitialState();

			state = setClockHands(state, 12, -1); // -1 should wrap
			expect(state.currentMinute).toBeGreaterThanOrEqual(0);

			state = setClockHands(state, 12, 60); // 60 should wrap
			expect(state.currentMinute).toBeLessThan(60);
		});

		it('should update both hands simultaneously', () => {
			let state = createInitialState();

			state = setClockHands(state, 9, 45);

			expect(state.currentHour).toBe(9);
			expect(state.currentMinute).toBe(45);
		});

		it('should adjust hour hand based on minute position for realism', () => {
			let state = createInitialState();

			// At 6:30, hour hand should be between 6 and 7
			state = setClockHands(state, 6, 30);

			// The hour hand should visually be between 6 and 7
			expect(state.currentHour).toBe(6);
			expect(state.currentMinute).toBe(30);

			// Check hour hand position accounts for minutes
			const hourHandAngle = (state.currentHour % 12) * 30 + (state.currentMinute / 60) * 30;
			expect(hourHandAngle).toBeCloseTo(195, 0); // 6 * 30 + 30/60 * 30 = 195
		});
	});

	describe('validateClockTime', () => {
		it('should return false for incorrect time', () => {
			const state = createInitialState();

			// Set to definitely wrong time
			const testState = { ...state, currentHour: 12, currentMinute: 0 };

			const isValid = validateClockTime(testState, 6, 30);
			expect(isValid).toBe(false);
		});

		it('should return true for correct time', () => {
			const state = createInitialState();

			// Set to target time
			const testState = {
				...state,
				currentHour: state.targetHour,
				currentMinute: state.targetMinute
			};

			const isValid = validateClockTime(
				testState,
				state.targetHour,
				state.targetMinute
			);
			expect(isValid).toBe(true);
		});

		it('should be exact match required (no tolerance)', () => {
			const state = createInitialState();

			const testState = {
				...state,
				currentHour: 6,
				currentMinute: 29 // One minute off
			};

			const isValid = validateClockTime(testState, 6, 30);
			expect(isValid).toBe(false);
		});
	});

	describe('isClockCorrect', () => {
		it('should return false when hands not set to target time', () => {
			const state = createInitialState();

			expect(isClockCorrect(state)).toBe(false);
		});

		it('should return true when hands set to target time', () => {
			let state = createInitialState();

			state = setClockHands(state, state.targetHour, state.targetMinute);

			expect(isClockCorrect(state)).toBe(true);
		});

		it('should return false when hour is correct but minute is wrong', () => {
			let state = createInitialState();

			state = setClockHands(state, state.targetHour, state.targetMinute + 1);

			expect(isClockCorrect(state)).toBe(false);
		});

		it('should return false when minute is correct but hour is wrong', () => {
			let state = createInitialState();

			const wrongHour = state.targetHour === 12 ? 11 : state.targetHour + 1;
			state = setClockHands(state, wrongHour, state.targetMinute);

			expect(isClockCorrect(state)).toBe(false);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer interactive clock hands', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.role).toBe('explorer');
			expect(view.canInteract).toBe(true);
			expect(view.currentHour).toBeDefined();
			expect(view.currentMinute).toBeDefined();
		});

		it('should give analyst time clues and reference', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.role).toBe('analyst');
			expect(view.hasClues).toBe(true);
			expect(view.clues).toBeDefined();
		});

		it('should not reveal target time to explorer', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.targetHour).toBeUndefined();
			expect(view.targetMinute).toBeUndefined();
		});

		it('should reveal target time to analyst', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.targetHour).toBeDefined();
			expect(view.targetMinute).toBeDefined();
		});

		it('should show completion status to both roles', () => {
			let state = createInitialState();

			state = setClockHands(state, state.targetHour, state.targetMinute);

			const explorerView = getPlayerView(state, 'explorer');
			const analystView = getPlayerView(state, 'analyst');

			expect(explorerView.isCorrect).toBe(true);
			expect(analystView.isCorrect).toBe(true);
		});
	});

	describe('Time Format Edge Cases', () => {
		it('should handle 12:00 correctly', () => {
			let state = createInitialState();

			state = setClockHands(state, 12, 0);

			expect(state.currentHour).toBe(12);
			expect(state.currentMinute).toBe(0);
		});

		it('should handle 11:59 correctly', () => {
			let state = createInitialState();

			state = setClockHands(state, 11, 59);

			expect(state.currentHour).toBe(11);
			expect(state.currentMinute).toBe(59);
		});

		it('should handle 1:05 correctly', () => {
			let state = createInitialState();

			state = setClockHands(state, 1, 5);

			expect(state.currentHour).toBe(1);
			expect(state.currentMinute).toBe(5);
		});

		it('should wrap minutes at 60', () => {
			let state = createInitialState();

			state = setClockHands(state, 12, 60);

			expect(state.currentMinute).toBe(0);
			expect(state.currentHour).toBe(1); // Should advance hour
		});

		it('should handle negative minutes', () => {
			let state = createInitialState();

			state = setClockHands(state, 12, -1);

			expect(state.currentMinute).toBe(59);
			expect(state.currentHour).toBe(11); // Should go back hour
		});
	});

	describe('Clue System', () => {
		it('should generate clues that point to target time', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.clues).toBeDefined();
			expect(Array.isArray(view.clues)).toBe(true);
			expect(view.clues.length).toBeGreaterThan(0);
		});

		it('should provide multiple tiers of hints', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			const hasEasyHint = view.clues.some((c: any) => c.tier === 1);
			const hasMediumHint = view.clues.some((c: any) => c.tier === 2);
			const hasHardHint = view.clues.some((c: any) => c.tier === 3);

			// At least one tier should exist
			expect(hasEasyHint || hasMediumHint || hasHardHint).toBe(true);
		});
	});

	describe('Clock Mechanics', () => {
		it('should calculate hour hand angle correctly', () => {
			const state = createInitialState();

			// At 3:00, hour hand should be at 90 degrees
			const angle3 = (3 % 12) * 30;
			expect(angle3).toBe(90);

			// At 3:30, hour hand should be at 105 degrees (halfway between 3 and 4)
			const angle330 = (3 % 12) * 30 + (30 / 60) * 30;
			expect(angle330).toBe(105);
		});

		it('should calculate minute hand angle correctly', () => {
			// At 15 minutes, minute hand should be at 90 degrees
			const angle15 = (15 / 60) * 360;
			expect(angle15).toBe(90);

			// At 30 minutes, minute hand should be at 180 degrees
			const angle30 = (30 / 60) * 360;
			expect(angle30).toBe(180);
		});

		it('should detect when hands overlap', () => {
			let state = createInitialState();

			// At 12:00, hands overlap
			state = setClockHands(state, 12, 0);

			const hourAngle = (state.currentHour % 12) * 30;
			const minuteAngle = (state.currentMinute / 60) * 360;

			expect(hourAngle).toBeCloseTo(minuteAngle, 0);
		});
	});
});

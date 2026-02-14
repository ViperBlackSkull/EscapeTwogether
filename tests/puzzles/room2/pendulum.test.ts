import { describe, it, expect } from 'vitest';
import {
	createInitialPendulumState,
	updatePendulumPhysics,
	isPendulumSolved,
	setSwingSpeed,
	setDirection,
	resetPendulumPuzzle,
	getPendulumViewData,
	pendulumPuzzleDefinition,
	PENDULUM_PUZZLE_ID,
	type PendulumPuzzleData
} from '$lib/puzzles/room2/pendulumPuzzle';
import type { PuzzleState } from '$lib/types';

describe('Pendulum Puzzle', () => {
	describe('createInitialPendulumState', () => {
		it('should create initial state with default values', () => {
			const state = createInitialPendulumState();

			expect(state.swingSpeed).toBe(50);
			expect(state.direction).toBeNull();
			expect(state.ball.x).toBe(50);
			expect(state.ball.y).toBe(50);
			expect(state.ball.vx).toBe(0);
			expect(state.ball.vy).toBe(0);
			expect(state.timeInGoal).toBe(0);
			expect(state.requiredGoalTime).toBe(2000);
			expect(state.obstacles).toHaveLength(6);
		});

		it('should have a goal positioned correctly', () => {
			const state = createInitialPendulumState();

			expect(state.goal.x).toBe(550);
			expect(state.goal.y).toBe(300);
			expect(state.goal.radius).toBe(30);
		});
	});

	describe('setSwingSpeed', () => {
		it('should set swing speed within valid range', () => {
			const state = createInitialPendulumState();

			const updated = setSwingSpeed(state, 75);
			expect(updated.swingSpeed).toBe(75);
		});

		it('should clamp speed to 0-100 range', () => {
			const state = createInitialPendulumState();

			expect(setSwingSpeed(state, 150).swingSpeed).toBe(100);
			expect(setSwingSpeed(state, -50).swingSpeed).toBe(0);
		});
	});

	describe('setDirection', () => {
		it('should set direction to left', () => {
			const state = createInitialPendulumState();

			const updated = setDirection(state, 'left');
			expect(updated.direction).toBe('left');
		});

		it('should set direction to right', () => {
			const state = createInitialPendulumState();

			const updated = setDirection(state, 'right');
			expect(updated.direction).toBe('right');
		});

		it('should set direction to null', () => {
			const state = createInitialPendulumState();
			const withDirection = setDirection(state, 'left');

			const updated = setDirection(withDirection, null);
			expect(updated.direction).toBeNull();
		});
	});

	describe('updatePendulumPhysics', () => {
		it('should apply direction force to ball', () => {
			const state = createInitialPendulumState();
			const withSpeed = setSwingSpeed(state, 100);
			const withDirection = setDirection(withSpeed, 'right');

			const updated = updatePendulumPhysics(withDirection, 100);

			// Ball should move right
			expect(updated.ball.x).toBeGreaterThan(50);
		});

		it('should move ball left when direction is left', () => {
			const state = createInitialPendulumState();
			const withSpeed = setSwingSpeed(state, 100);
			const withDirection = setDirection(withSpeed, 'left');

			const updated = updatePendulumPhysics(withDirection, 100);

			// Ball should move left
			expect(updated.ball.x).toBeLessThan(50);
		});

		it('should not move ball when direction is null', () => {
			const state = createInitialPendulumState();

			const updated = updatePendulumPhysics(state, 100);

			// Ball should not move horizontally without direction
			expect(updated.ball.x).toBe(50);
		});

		it('should increment timeInGoal when ball is in goal', () => {
			const state = createInitialPendulumState();
			// Manually place ball in goal
			const inGoal: PendulumPuzzleData = {
				...state,
				ball: { ...state.ball, x: 550, y: 300 }
			};

			const updated = updatePendulumPhysics(inGoal, 100);

			expect(updated.timeInGoal).toBe(100);
		});

		it('should reset timeInGoal when ball leaves goal', () => {
			const state = createInitialPendulumState();
			const withTime: PendulumPuzzleData = {
				...state,
				timeInGoal: 500
			};

			const updated = updatePendulumPhysics(withTime, 100);

			expect(updated.timeInGoal).toBe(0);
		});
	});

	describe('isPendulumSolved', () => {
		it('should return false when time in goal is less than required', () => {
			const state = createInitialPendulumState();
			const almostSolved: PendulumPuzzleData = {
				...state,
				timeInGoal: 1999
			};

			expect(isPendulumSolved(almostSolved)).toBe(false);
		});

		it('should return true when time in goal meets required time', () => {
			const state = createInitialPendulumState();
			const solved: PendulumPuzzleData = {
				...state,
				timeInGoal: 2000
			};

			expect(isPendulumSolved(solved)).toBe(true);
		});
	});

	describe('resetPendulumPuzzle', () => {
		it('should reset to initial state', () => {
			const state = createInitialPendulumState();
			const modified = setSwingSpeed(setDirection(state, 'left'), 80);
			modified.timeInGoal = 1000;

			const reset = resetPendulumPuzzle();

			expect(reset.swingSpeed).toBe(50);
			expect(reset.direction).toBeNull();
			expect(reset.timeInGoal).toBe(0);
		});
	});

	describe('getPendulumViewData', () => {
		it('should give speed control to explorer', () => {
			const state = createInitialPendulumState();
			const viewData = getPendulumViewData('explorer', state);

			expect(viewData.canControlSpeed).toBe(true);
			expect(viewData.canControlDirection).toBe(false);
		});

		it('should give direction control to analyst', () => {
			const state = createInitialPendulumState();
			const viewData = getPendulumViewData('analyst', state);

			expect(viewData.canControlSpeed).toBe(false);
			expect(viewData.canControlDirection).toBe(true);
		});
	});

	describe('pendulumPuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(pendulumPuzzleDefinition.id).toBe(PENDULUM_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(pendulumPuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(pendulumPuzzleDefinition.requiredRoles).toContain('explorer');
			expect(pendulumPuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(pendulumPuzzleDefinition.hints).toHaveLength(3);
		});

		it('should validate solution correctly', () => {
			const solvedData: PendulumPuzzleData = {
				...createInitialPendulumState(),
				timeInGoal: 2000
			};
			const state: PuzzleState = {
				puzzleId: PENDULUM_PUZZLE_ID,
				solved: false,
				attempts: 0,
				data: solvedData
			};

			expect(pendulumPuzzleDefinition.validateSolution(state)).toBe(true);
		});

		it('should reject invalid solution', () => {
			const state: PuzzleState = {
				puzzleId: PENDULUM_PUZZLE_ID,
				solved: false,
				attempts: 0,
				data: createInitialPendulumState()
			};

			expect(pendulumPuzzleDefinition.validateSolution(state)).toBe(false);
		});
	});
});

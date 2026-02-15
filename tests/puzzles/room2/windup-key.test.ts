import { describe, it, expect } from 'vitest';
import {
	createInitialWindupKeyState,
	setKeyDirection,
	setKeySpeed,
	updateWindupPhysics,
	getSyncProgress,
	isWindupKeySolved,
	resetWindupKeyPuzzle,
	getWindupKeyViewData,
	windupKeyPuzzleDefinition,
	WINDUP_KEY_PUZZLE_ID,
	type WindupKeyPuzzleData
} from '$lib/puzzles/room2/windupKeyPuzzle';
import type { PuzzleState } from '$lib/types';

describe('Windup Key Puzzle', () => {
	describe('createInitialWindupKeyState', () => {
		it('should create initial state with both keys stationary', () => {
			const state = createInitialWindupKeyState();

			expect(state.playerAKey.direction).toBe('none');
			expect(state.playerBKey.direction).toBe('none');
			expect(state.playerAKey.speed).toBe(0);
			expect(state.playerBKey.speed).toBe(0);
		});

		it('should have correct sync requirements', () => {
			const state = createInitialWindupKeyState();

			expect(state.speedTolerance).toBe(0.15);
			expect(state.requiredSyncDuration).toBe(5000);
			expect(state.isSynchronized).toBe(false);
		});

		it('should start unsynchronized', () => {
			const state = createInitialWindupKeyState();

			expect(state.isSynchronized).toBe(false);
			expect(state.syncStartTime).toBeNull();
			expect(state.syncedDuration).toBe(0);
		});
	});

	describe('setKeyDirection', () => {
		it('should set player A key direction to clockwise', () => {
			const state = createInitialWindupKeyState();

			const updated = setKeyDirection(state, 'A', 'cw');

			expect(updated.playerAKey.direction).toBe('cw');
			expect(updated.playerAKey.speed).toBeGreaterThan(0);
		});

		it('should set player B key direction to counter-clockwise', () => {
			const state = createInitialWindupKeyState();

			const updated = setKeyDirection(state, 'B', 'ccw');

			expect(updated.playerBKey.direction).toBe('ccw');
		});

		it('should set direction to none', () => {
			const state = setKeyDirection(createInitialWindupKeyState(), 'A', 'cw');

			const updated = setKeyDirection(state, 'A', 'none');

			expect(updated.playerAKey.direction).toBe('none');
		});
	});

	describe('setKeySpeed', () => {
		it('should set player A key speed', () => {
			const state = setKeyDirection(createInitialWindupKeyState(), 'A', 'cw');

			const updated = setKeySpeed(state, 'A', 100);

			expect(updated.playerAKey.speed).toBe(100);
		});
	});

	describe('updateWindupPhysics', () => {
		it('should update key rotation based on direction and speed', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeySpeed(state, 'A', 60);

			const updated = updateWindupPhysics(state, 1000); // 1 second

			// At 60 deg/sec for 1 second = 60 degrees
			expect(updated.playerAKey.rotation).toBe(60);
		});

		it('should rotate counter-clockwise correctly', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'B', 'ccw');
			state = setKeySpeed(state, 'B', 30);

			const updated = updateWindupPhysics(state, 1000);

			expect(updated.playerBKey.rotation).toBe(330); // -30 + 360
		});

		it('should detect synchronization when both keys match', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeySpeed(state, 'A', 60);
			state = setKeyDirection(state, 'B', 'cw');
			state = setKeySpeed(state, 'B', 60);

			const updated = updateWindupPhysics(state, 100);

			expect(updated.isSynchronized).toBe(true);
			expect(updated.syncStartTime).toBeDefined();
		});

		it('should not synchronize with different directions', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeySpeed(state, 'A', 60);
			state = setKeyDirection(state, 'B', 'ccw');
			state = setKeySpeed(state, 'B', 60);

			const updated = updateWindupPhysics(state, 100);

			expect(updated.isSynchronized).toBe(false);
		});

		it('should allow speed within tolerance', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeySpeed(state, 'A', 100);
			state = setKeyDirection(state, 'B', 'cw');
			state = setKeySpeed(state, 'B', 110); // 10% difference, within 15%

			const updated = updateWindupPhysics(state, 100);

			expect(updated.isSynchronized).toBe(true);
		});

		it('should not synchronize with speed outside tolerance', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeySpeed(state, 'A', 100);
			state = setKeyDirection(state, 'B', 'cw');
			state = setKeySpeed(state, 'B', 120); // 20% difference, outside 15%

			const updated = updateWindupPhysics(state, 100);

			expect(updated.isSynchronized).toBe(false);
		});
	});

	describe('getSyncProgress', () => {
		it('should return 0 when not synchronized', () => {
			const state = createInitialWindupKeyState();

			expect(getSyncProgress(state)).toBe(0);
		});

		it('should return progress percentage when synchronized', () => {
			const state: WindupKeyPuzzleData = {
				...createInitialWindupKeyState(),
				isSynchronized: true,
				syncStartTime: Date.now() - 2500,
				syncedDuration: 2500
			};

			expect(getSyncProgress(state)).toBe(50);
		});
	});

	describe('isWindupKeySolved', () => {
		it('should return false initially', () => {
			const state = createInitialWindupKeyState();

			expect(isWindupKeySolved(state)).toBe(false);
		});

		it('should return true when puzzle is complete', () => {
			const state: WindupKeyPuzzleData = {
				...createInitialWindupKeyState(),
				puzzleComplete: true
			};

			expect(isWindupKeySolved(state)).toBe(true);
		});
	});

	describe('resetWindupKeyPuzzle', () => {
		it('should reset to initial state', () => {
			let state = createInitialWindupKeyState();
			state = setKeyDirection(state, 'A', 'cw');
			state = setKeyDirection(state, 'B', 'cw');

			const reset = resetWindupKeyPuzzle();

			expect(reset.playerAKey.direction).toBe('none');
			expect(reset.playerBKey.direction).toBe('none');
			expect(reset.isSynchronized).toBe(false);
		});
	});

	describe('getWindupKeyViewData', () => {
		it('should show left key to explorer', () => {
			const state = createInitialWindupKeyState();
			const viewData = getWindupKeyViewData('explorer', state);

			expect((viewData.myKey as { position: string }).position).toBe('left');
		});

		it('should show right key to analyst', () => {
			const state = createInitialWindupKeyState();
			const viewData = getWindupKeyViewData('analyst', state);

			expect((viewData.myKey as { position: string }).position).toBe('right');
		});

		it('should include sync progress', () => {
			const state = createInitialWindupKeyState();
			const viewData = getWindupKeyViewData('explorer', state);

			expect(viewData.syncProgress).toBeDefined();
		});
	});

	describe('windupKeyPuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(windupKeyPuzzleDefinition.id).toBe(WINDUP_KEY_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(windupKeyPuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(windupKeyPuzzleDefinition.requiredRoles).toContain('explorer');
			expect(windupKeyPuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(windupKeyPuzzleDefinition.hints).toHaveLength(3);
		});

		it('should validate solution correctly', () => {
			const solvedState: WindupKeyPuzzleData = {
				...createInitialWindupKeyState(),
				puzzleComplete: true
			};
			const state: PuzzleState = {
				puzzleId: WINDUP_KEY_PUZZLE_ID,
				solved: false,
				attempts: 0,
				data: solvedState as unknown as Record<string, unknown>
			};

			expect(windupKeyPuzzleDefinition.validateSolution(state)).toBe(true);
		});
	});
});

import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	updatePlayerPosition,
	checkProximity,
	getNearbyObjects,
	examineObject,
	submitAnswer,
	validateSolution,
	getPlayerView,
	getDiscoveryProgress,
	SecretMessagePuzzle,
	ROOM1_PUZZLE_IDS
} from '$lib/puzzles/room1/secret-message';
import type { PuzzleState } from '$lib/types';

describe('Secret Message Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 10 objects', () => {
			const state = createInitialState();

			expect(state.objects).toHaveLength(10);
			expect(state.hints).toHaveLength(10);
			expect(state.completed).toBe(false);
		});

		it('should have required names MARIE and JAMES', () => {
			const state = createInitialState();

			expect(state.requiredNames).toContain('MARIE');
			expect(state.requiredNames).toContain('JAMES');
		});

		it('should have no discovered letters initially', () => {
			const state = createInitialState();

			expect(state.discoveredLetters).toHaveLength(0);
			expect(state.objects.every(o => o.examined === false)).toBe(true);
		});
	});

	describe('updatePlayerPosition', () => {
		it('should update player A position', () => {
			const state = createInitialState();

			const newState = updatePlayerPosition(state, { x: 100, y: 200 });

			expect(newState.playerAPosition).toEqual({ x: 100, y: 200 });
		});
	});

	describe('checkProximity', () => {
		it('should return true when player is near object', () => {
			const state = createInitialState();

			// Move player near first object (at 100, 150)
			const newState = updatePlayerPosition(state, { x: 120, y: 160 });

			expect(checkProximity(newState, 'object-1')).toBe(true);
		});

		it('should return false when player is far from object', () => {
			const state = createInitialState();

			// Player at default position (300, 250)
			expect(checkProximity(state, 'object-1')).toBe(false);
		});

		it('should use custom threshold', () => {
			const state = createInitialState();
			const newState = updatePlayerPosition(state, { x: 180, y: 150 });

			// Object 1 is at 100, 150 (80 units away)
			expect(checkProximity(newState, 'object-1', 100)).toBe(true);
			expect(checkProximity(newState, 'object-1', 50)).toBe(false);
		});
	});

	describe('getNearbyObjects', () => {
		it('should return objects within threshold', () => {
			const state = createInitialState();

			// Move player near object-1 and object-3
			const newState = updatePlayerPosition(state, { x: 100, y: 150 });

			const nearby = getNearbyObjects(newState);

			expect(nearby.length).toBeGreaterThan(0);
			expect(nearby.some(o => o.id === 'object-1')).toBe(true);
		});
	});

	describe('examineObject', () => {
		it('should mark object as examined', () => {
			const state = createInitialState();

			const newState = examineObject(state, 'object-1');

			const object = newState.objects.find(o => o.id === 'object-1');
			expect(object?.examined).toBe(true);
		});

		it('should reveal hidden letter', () => {
			const state = createInitialState();

			const newState = examineObject(state, 'object-1');

			const object = newState.objects.find(o => o.id === 'object-1');
			expect(object?.letterRevealed).toBe(true);
			expect(newState.discoveredLetters).toContain('M');
		});

		it('should not duplicate letters when examined again', () => {
			let state = createInitialState();

			state = examineObject(state, 'object-1');
			state = examineObject(state, 'object-1');

			const mCount = state.discoveredLetters.filter(l => l === 'M').length;
			expect(mCount).toBe(1);
		});
	});

	describe('submitAnswer', () => {
		it('should reject wrong answer', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'WRONG');

			expect(result).toBe(false);
			expect(state.completed).toBe(false);
		});

		it('should accept answer with both names', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'MARIE and JAMES');

			expect(result).toBe(true);
			expect(state.completed).toBe(true);
		});

		it('should accept answer regardless of format', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'JAMES MARIE');

			expect(result).toBe(true);
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const puzzleState = createInitialState();
			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.SECRET_MESSAGE,
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
				puzzleId: ROOM1_PUZZLE_IDS.SECRET_MESSAGE,
				solved: true,
				attempts: 5,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer objects view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.objects).toBeDefined();
			expect(view.playerPosition).toBeDefined();
			expect(view.nearbyObjects).toBeDefined();
		});

		it('should give analyst hints view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.hints).toBeDefined();
			expect(view.hints).toHaveLength(10);
		});

		it('should share discovered letters between players', () => {
			let state = createInitialState();
			state = examineObject(state, 'object-1');

			const explorerView = getPlayerView(state, 'explorer');
			const analystView = getPlayerView(state, 'analyst');

			expect(explorerView.discoveredLetters).toContain('M');
			expect(analystView.discoveredLetters).toContain('M');
		});
	});

	describe('getDiscoveryProgress', () => {
		it('should return 0% when no letters discovered', () => {
			const state = createInitialState();

			const progress = getDiscoveryProgress(state);

			expect(progress.discovered).toBe(0);
			expect(progress.percentage).toBe(0);
		});

		it('should calculate progress correctly', () => {
			let state = createInitialState();

			state = examineObject(state, 'object-1');
			state = examineObject(state, 'object-2');

			const progress = getDiscoveryProgress(state);

			expect(progress.discovered).toBe(2);
			expect(progress.percentage).toBe(20);
		});

		it('should reach 100% when all letters found', () => {
			let state = createInitialState();

			state.objects.forEach(obj => {
				state = examineObject(state, obj.id);
			});

			const progress = getDiscoveryProgress(state);

			expect(progress.discovered).toBe(10);
			expect(progress.percentage).toBe(100);
		});
	});

	describe('PuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(SecretMessagePuzzle.id).toBe(ROOM1_PUZZLE_IDS.SECRET_MESSAGE);
		});

		it('should be in the attic room', () => {
			expect(SecretMessagePuzzle.roomId).toBe('attic');
		});

		it('should require both roles', () => {
			expect(SecretMessagePuzzle.requiredRoles).toContain('explorer');
			expect(SecretMessagePuzzle.requiredRoles).toContain('analyst');
		});

		it('should have hints defined', () => {
			expect(SecretMessagePuzzle.hints).toHaveLength(3);
		});
	});
});

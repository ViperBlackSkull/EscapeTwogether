import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	isPlayerNearObject,
	discoverLetter,
	getNearbyObjects,
	submitAnswer,
	getFavoritesList,
	validateSolution,
	getPlayerView,
	getProgress,
	SecretMessagePuzzle
} from '$lib/puzzles/room1/secret-message';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import type { PuzzleState } from '$lib/types';

describe('Secret Message Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 10 objects', () => {
			const state = createInitialState();

			expect(state.objects).toHaveLength(10);
			expect(state.completed).toBe(false);
		});

		it('should have correct solution MARIE and JAMES', () => {
			const state = createInitialState();

			expect(state.correctSolution.first).toBe('MARIE');
			expect(state.correctSolution.second).toBe('JAMES');
			expect(state.correctSolution.combined).toBe('MARIE+JAMES');
		});

		it('should have no discovered letters initially', () => {
			const state = createInitialState();

			expect(state.lettersFound).toBe(0);
			expect(state.discoveredLetters.every(l => l.discoveredBy === null)).toBe(true);
		});

		it('should have empty player input initially', () => {
			const state = createInitialState();

			expect(state.playerInput.A).toBe('');
			expect(state.playerInput.B).toBe('');
		});
	});

	describe('isPlayerNearObject', () => {
		it('should return true when player is close to object', () => {
			const objectPos = { x: 100, y: 100 };
			const playerPos = { x: 120, y: 120 };

			expect(isPlayerNearObject(objectPos, playerPos)).toBe(true);
		});

		it('should return false when player is far from object', () => {
			const objectPos = { x: 100, y: 100 };
			const playerPos = { x: 200, y: 200 };

			expect(isPlayerNearObject(objectPos, playerPos)).toBe(false);
		});

		it('should respect custom threshold', () => {
			const objectPos = { x: 100, y: 100 };
			const playerPos = { x: 140, y: 140 };

			expect(isPlayerNearObject(objectPos, playerPos, 50)).toBe(false);
			expect(isPlayerNearObject(objectPos, playerPos, 100)).toBe(true);
		});
	});

	describe('getNearbyObjects', () => {
		it('should return objects near player position', () => {
			const state = createInitialState();

			// Position near the music_box (200, 150)
			const nearby = getNearbyObjects(state, { x: 200, y: 150 });

			expect(nearby.length).toBeGreaterThan(0);
			expect(nearby.some(o => o.id === 'music_box')).toBe(true);
		});

		it('should return empty array when no objects nearby', () => {
			const state = createInitialState();

			// Position far from all objects
			const nearby = getNearbyObjects(state, { x: 1000, y: 1000 }, 50);

			expect(nearby).toHaveLength(0);
		});
	});

	describe('discoverLetter', () => {
		it('should mark letter as discovered', () => {
			let state = createInitialState();

			state = discoverLetter(state, 'music_box', 'explorer');

			const discovered = state.discoveredLetters.find(l => l.objectId === 'music_box');
			expect(discovered?.discoveredBy).toBe('A');
			expect(discovered?.timestamp).not.toBeNull();
		});

		it('should increment lettersFound count', () => {
			let state = createInitialState();

			state = discoverLetter(state, 'music_box', 'explorer');

			expect(state.lettersFound).toBe(1);
		});

		it('should not rediscover already discovered letter', () => {
			let state = createInitialState();

			state = discoverLetter(state, 'music_box', 'explorer');
			state = discoverLetter(state, 'music_box', 'analyst');

			const discovered = state.discoveredLetters.find(l => l.objectId === 'music_box');
			expect(discovered?.discoveredBy).toBe('A'); // Still A, not changed to B
		});
	});

	describe('submitAnswer', () => {
		it('should reject wrong answer', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'WRONG', 'NAMES');

			expect(result.correct).toBe(false);
			expect(result.state.completed).toBe(false);
		});

		it('should reject correct answer without enough letters found', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'MARIE', 'JAMES');

			// Requires 8 letters found minimum
			expect(result.correct).toBe(false);
		});

		it('should accept correct answer with enough letters found', () => {
			let state = createInitialState();

			// Discover 8 letters
			const objectsToDiscover = ['music_box', 'photo_frame', 'rosary', 'inkwell',
				'jewelry_box', 'journal', 'apron', 'mirror'];

			objectsToDiscover.forEach(id => {
				state = discoverLetter(state, id, 'explorer');
			});

			const result = submitAnswer(state, 'MARIE', 'JAMES');

			expect(result.correct).toBe(true);
			expect(result.state.completed).toBe(true);
		});

		it('should increment wrong submissions counter', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'WRONG', 'NAMES');

			expect(result.state.wrongSubmissions).toBe(1);
		});
	});

	describe('getFavoritesList', () => {
		it('should return list of 10 hints', () => {
			const favorites = getFavoritesList();

			expect(favorites).toHaveLength(10);
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
				attempts: 1,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer objects view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer', { x: 200, y: 150 });

			expect(view.role).toBe('explorer');
			expect(view.objects).toBeDefined();
			expect(view.nearbyObjects).toBeDefined();
		});

		it('should give analyst favorites list view', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.role).toBe('analyst');
			expect(view.favoritesList).toBeDefined();
			expect(view.favoritesList).toHaveLength(10);
		});
	});

	describe('getProgress', () => {
		it('should return 0% when no letters found', () => {
			const state = createInitialState();

			expect(getProgress(state)).toBe(0);
		});

		it('should calculate progress correctly', () => {
			let state = createInitialState();

			state = discoverLetter(state, 'music_box', 'explorer');
			state = discoverLetter(state, 'photo_frame', 'explorer');

			expect(getProgress(state)).toBe(20);
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

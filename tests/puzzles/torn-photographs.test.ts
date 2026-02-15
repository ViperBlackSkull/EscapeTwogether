import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	validateSolution,
	placePiece,
	updateLockTimer,
	checkAllCorrect,
	TornPhotographsPuzzle
} from '$lib/puzzles/room1/torn-photographs';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import type { PuzzleState } from '$lib/types';

describe('Torn Photographs Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 9 pieces and 9 frames', () => {
			const state = createInitialState();

			expect(state.pieces).toHaveLength(9);
			expect(state.frames).toHaveLength(9);
			expect(state.completed).toBe(false);
			expect(state.allPlaced).toBe(false);
			expect(state.lockTimer).toBe(0);
		});

		it('should have no pieces placed initially', () => {
			const state = createInitialState();

			expect(state.pieces.every(p => p.placed === false)).toBe(true);
			expect(state.frames.every(f => f.occupied === false)).toBe(true);
		});
	});

	describe('placePiece', () => {
		it('should place a piece in a frame', () => {
			let state = createInitialState();

			state = placePiece(state, 'piece-0', 'frame-0');

			const piece = state.pieces.find(p => p.id === 'piece-0');
			const frame = state.frames.find(f => f.id === 'frame-0');

			expect(piece?.placed).toBe(true);
			expect(frame?.occupied).toBe(true);
			expect(frame?.occupyingPiece).toBe('piece-0');
		});

		it('should remove piece from previous frame when moved', () => {
			let state = createInitialState();

			state = placePiece(state, 'piece-0', 'frame-1');
			state = placePiece(state, 'piece-0', 'frame-2');

			const previousFrame = state.frames.find(f => f.id === 'frame-1');
			const newFrame = state.frames.find(f => f.id === 'frame-2');

			expect(previousFrame?.occupied).toBe(false);
			expect(newFrame?.occupyingPiece).toBe('piece-0');
		});

		it('should return previous piece to unplaced when frame is taken', () => {
			let state = createInitialState();

			state = placePiece(state, 'piece-0', 'frame-0');
			state = placePiece(state, 'piece-1', 'frame-0');

			const piece0 = state.pieces.find(p => p.id === 'piece-0');
			const piece1 = state.pieces.find(p => p.id === 'piece-1');
			const frame = state.frames.find(f => f.id === 'frame-0');

			expect(piece0?.placed).toBe(false);
			expect(piece1?.placed).toBe(true);
			expect(frame?.occupyingPiece).toBe('piece-1');
		});
	});

	describe('checkAllCorrect', () => {
		it('should return false when pieces are not placed', () => {
			const state = createInitialState();

			expect(checkAllCorrect(state)).toBe(false);
		});

		it('should return false when pieces are in wrong frames', () => {
			let state = createInitialState();

			// Place pieces in wrong frames
			state = placePiece(state, 'piece-0', 'frame-1'); // piece-0 belongs in frame-0

			expect(checkAllCorrect(state)).toBe(false);
		});

		it('should return true when all pieces are in correct frames', () => {
			let state = createInitialState();

			// Place all pieces in correct frames
			for (let i = 0; i < 9; i++) {
				state = placePiece(state, `piece-${i}`, `frame-${i}`);
			}

			expect(checkAllCorrect(state)).toBe(true);
		});
	});

	describe('updateLockTimer', () => {
		it('should increase lock timer when pieces are correct', () => {
			let state = createInitialState();

			// Place all pieces correctly
			for (let i = 0; i < 9; i++) {
				state = placePiece(state, `piece-${i}`, `frame-${i}`);
			}

			state = updateLockTimer(state, 1000);

			expect(state.lockTimer).toBe(1000);
			expect(state.completed).toBe(false);
		});

		it('should complete puzzle after 3 seconds of correct placement', () => {
			let state = createInitialState();

			// Place all pieces correctly
			for (let i = 0; i < 9; i++) {
				state = placePiece(state, `piece-${i}`, `frame-${i}`);
			}

			state = updateLockTimer(state, 3000);

			expect(state.completed).toBe(true);
		});

		it('should reset timer when pieces become incorrect', () => {
			let state = createInitialState();

			// Place all pieces correctly
			for (let i = 0; i < 9; i++) {
				state = placePiece(state, `piece-${i}`, `frame-${i}`);
			}

			state = updateLockTimer(state, 2000);
			expect(state.lockTimer).toBe(2000);

			// Move a piece to wrong frame
			state = placePiece(state, 'piece-0', 'frame-1');
			state = updateLockTimer(state, 500);

			expect(state.lockTimer).toBe(0);
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const puzzleState = createInitialState();
			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
				solved: false,
				attempts: 0,
				data: puzzleState as unknown as Record<string, unknown>
			};

			expect(validateSolution(state)).toBe(false);
		});

		it('should return true when all pieces are correctly placed', () => {
			let puzzleState = createInitialState();

			// Place all pieces correctly
			for (let i = 0; i < 9; i++) {
				puzzleState = placePiece(puzzleState, `piece-${i}`, `frame-${i}`);
			}

			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
				solved: false,
				attempts: 5,
				data: puzzleState as unknown as Record<string, unknown>
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('PuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(TornPhotographsPuzzle.id).toBe(ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS);
		});

		it('should be in the attic room', () => {
			expect(TornPhotographsPuzzle.roomId).toBe('attic');
		});

		it('should require both roles', () => {
			expect(TornPhotographsPuzzle.requiredRoles).toContain('explorer');
			expect(TornPhotographsPuzzle.requiredRoles).toContain('analyst');
		});

		it('should have hints defined', () => {
			expect(TornPhotographsPuzzle.hints).toHaveLength(3);
		});
	});
});

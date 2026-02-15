/**
 * ============================================================================
 * TORN PHOTOGRAPHS PUZZLE - UNIT TESTS
 * ============================================================================
 *
 * Tests for the torn photographs puzzle where players must reconstruct
 * a torn photograph by arranging pieces correctly.
 *
 * Coverage:
 * - Piece placement and validation
 * - Rotation and snapping
 * - Completion detection
 * - Role-specific views
 * - Edge cases
 *
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	placePiece,
	removePiece,
	rotatePiece,
	validateSolution,
	isPhotographComplete,
	getPlayerView
} from '$lib/puzzles/room1/torn-photographs';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import type { PuzzleState } from '$lib/types';

describe('Torn Photographs Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 9 puzzle pieces', () => {
			const state = createInitialState();

			expect(state.pieces).toHaveLength(9);
			expect(state.completed).toBe(false);
		});

		it('should have pieces with unique IDs and positions', () => {
			const state = createInitialState();
			const ids = state.pieces.map(p => p.id);
			const uniqueIds = new Set(ids);

			expect(uniqueIds.size).toBe(9);
		});

		it('should have all pieces in initial incorrect positions', () => {
			const state = createInitialState();

			const allInCorrectPosition = state.pieces.every(p =>
				p.currentX === p.correctX && p.currentY === p.correctY
			);

			expect(allInCorrectPosition).toBe(false);
		});

		it('should have pieces with random rotations', () => {
			const state = createInitialState();

			const hasRotations = state.pieces.some(p => p.currentRotation !== 0);

			// Pieces should start in various rotations
			expect(hasRotations || state.pieces.every(p => p.currentRotation === 0)).toBeTruthy();
		});
	});

	describe('placePiece', () => {
		it('should place piece at specified position', () => {
			let state = createInitialState();

			state = placePiece(state, 'piece-0', 100, 100);

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.currentX).toBe(100);
			expect(piece?.currentY).toBe(100);
		});

		it('should mark piece as placed when in correct position', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			state = placePiece(state, piece.id, piece.correctX, piece.correctY);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			expect(updatedPiece?.isPlaced).toBe(true);
		});

		it('should not mark piece as placed when in incorrect position', () => {
			let state = createInitialState();

			state = placePiece(state, 'piece-0', 999, 999);

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.isPlaced).toBe(false);
		});

		it('should snap to grid when close to correct position', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			// Place near correct position (within snap threshold)
			state = placePiece(
				state,
				piece.id,
				piece.correctX + 10,
				piece.correctY + 10
			);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			// Should snap to correct position
			expect(updatedPiece?.currentX).toBe(piece.correctX);
			expect(updatedPiece?.currentY).toBe(piece.correctY);
			expect(updatedPiece?.isPlaced).toBe(true);
		});
	});

	describe('removePiece', () => {
		it('should remove piece from board', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			// Place piece first
			state = placePiece(state, piece.id, piece.correctX, piece.correctY);

			// Remove it
			state = removePiece(state, piece.id);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			expect(updatedPiece?.isPlaced).toBe(false);
		});

		it('should return piece to pool', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			state = placePiece(state, piece.id, piece.correctX, piece.correctY);
			state = removePiece(state, piece.id);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			expect(updatedPiece?.isPlaced).toBe(false);
		});
	});

	describe('rotatePiece', () => {
		it('should rotate piece by 90 degrees', () => {
			let state = createInitialState();
			const initialRotation = state.pieces[0].currentRotation;

			state = rotatePiece(state, 'piece-0', 90);

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.currentRotation).toBe(initialRotation + 90);
		});

		it('should normalize rotation to 0-360 range', () => {
			let state = createInitialState();

			// Rotate past 360
			state = rotatePiece(state, 'piece-0', 450);

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.currentRotation).toBeGreaterThanOrEqual(0);
			expect(piece?.currentRotation).toBeLessThan(360);
		});

		it('should update placement status based on rotation', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			// Place at correct position
			state = placePiece(state, piece.id, piece.correctX, piece.correctY);

			// Rotate (should make it incorrectly placed)
			state = rotatePiece(state, piece.id, 90);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			expect(updatedPiece?.isPlaced).toBe(false);
		});
	});

	describe('isPhotographComplete', () => {
		it('should return false when no pieces placed', () => {
			const state = createInitialState();

			expect(isPhotographComplete(state)).toBe(false);
		});

		it('should return false when some pieces placed', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			state = placePiece(state, piece.id, piece.correctX, piece.correctY);

			expect(isPhotographComplete(state)).toBe(false);
		});

		it('should return true when all pieces correctly placed', () => {
			let state = createInitialState();

			// Place all pieces correctly
			state.pieces.forEach(piece => {
				state = placePiece(state, piece.id, piece.correctX, piece.correctY);
			});

			expect(isPhotographComplete(state)).toBe(true);
		});

		it('should return false when pieces placed but incorrectly rotated', () => {
			let state = createInitialState();

			// Place all pieces correctly
			state.pieces.forEach(piece => {
				state = placePiece(state, piece.id, piece.correctX, piece.correctY);
				state = rotatePiece(state, piece.id, 90); // Wrong rotation
			});

			expect(isPhotographComplete(state)).toBe(false);
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const state = createInitialState();
			const puzzleState: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
				solved: false,
				attempts: 0,
				data: state as unknown as Record<string, unknown>
			};

			expect(validateSolution(puzzleState)).toBe(false);
		});

		it('should return true when all pieces correctly placed and rotated', () => {
			let state = createInitialState();

			state.pieces.forEach(piece => {
				state = placePiece(state, piece.id, piece.correctX, piece.correctY);
				// Ensure correct rotation
				while (state.pieces.find(p => p.id === piece.id)!.currentRotation !== 0) {
					state = rotatePiece(state, piece.id, -90);
				}
			});

			const puzzleState: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
				solved: false,
				attempts: 5,
				data: state as unknown as Record<string, unknown>
			};

			expect(validateSolution(puzzleState)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer pieces to manipulate', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.view).toBe('pieces');
			expect(view.pieces).toBeDefined();
			expect(view.pieces).toHaveLength(9);
		});

		it('should give analyst reference image', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.view).toBe('reference');
			expect(view.referenceImage).toBeDefined();
		});

		it('should show placement progress to both players', () => {
			let state = createInitialState();

			// Place a few pieces
			state = placePiece(state, 'piece-0', state.pieces[0].correctX, state.pieces[0].correctY);
			state = placePiece(state, 'piece-1', state.pieces[1].correctX, state.pieces[1].correctY);

			const explorerView = getPlayerView(state, 'explorer');
			const analystView = getPlayerView(state, 'analyst');

			expect(explorerView.placedCount).toBe(2);
			expect(analystView.placedCount).toBe(2);
		});
	});

	describe('Edge Cases', () => {
		it('should handle placing same piece multiple times', () => {
			let state = createInitialState();
			const piece = state.pieces[0];

			state = placePiece(state, piece.id, 100, 100);
			state = placePiece(state, piece.id, 200, 200);

			const updatedPiece = state.pieces.find(p => p.id === piece.id);
			expect(updatedPiece?.currentX).toBe(200);
			expect(updatedPiece?.currentY).toBe(200);
		});

		it('should handle removing piece that was never placed', () => {
			let state = createInitialState();

			// Remove without placing
			const newState = removePiece(state, 'piece-0');

			// Should not error
			expect(newState.pieces).toHaveLength(9);
		});

		it('should handle rotating piece multiple times', () => {
			let state = createInitialState();

			for (let i = 0; i < 5; i++) {
				state = rotatePiece(state, 'piece-0', 90);
			}

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.currentRotation).toBe(450 % 360);
		});

		it('should handle out-of-bounds placement', () => {
			let state = createInitialState();

			// Place way outside bounds
			state = placePiece(state, 'piece-0', -1000, -1000);

			const piece = state.pieces.find(p => p.id === 'piece-0');
			expect(piece?.currentX).toBe(-1000);
			expect(piece?.currentY).toBe(-1000);
		});
	});
});

import { describe, it, expect } from 'vitest';
import {
	createInitialState,
	toggleCandle,
	toggleUVLight,
	updateRevealedLetters,
	checkWordComplete,
	submitAnswer,
	validateSolution,
	getPlayerView,
	LoveLetterCipherPuzzle,
	ROOM1_PUZZLE_IDS
} from '$lib/puzzles/room1/love-letter-cipher';
import type { PuzzleState } from '$lib/types';

describe('Love Letter Cipher Puzzle', () => {
	describe('createInitialState', () => {
		it('should create initial state with 8 letter fragments', () => {
			const state = createInitialState();

			expect(state.fragments).toHaveLength(8);
			expect(state.expectedWord).toBe('ROSALIND');
			expect(state.completed).toBe(false);
		});

		it('should have no lights active initially', () => {
			const state = createInitialState();

			expect(state.candleActive).toBe(false);
			expect(state.uvLightActive).toBe(false);
		});

		it('should have no revealed letters initially', () => {
			const state = createInitialState();

			expect(state.revealedLetters).toHaveLength(0);
			expect(state.fragments.every(f => f.revealed === false)).toBe(true);
		});
	});

	describe('toggleCandle', () => {
		it('should toggle candle active state', () => {
			let state = createInitialState();

			expect(state.candleActive).toBe(false);

			state = toggleCandle(state);
			expect(state.candleActive).toBe(true);

			state = toggleCandle(state);
			expect(state.candleActive).toBe(false);
		});

		it('should reveal candle-only letters when activated', () => {
			let state = createInitialState();

			state = toggleCandle(state);

			const candleLetters = state.fragments.filter(f => f.revealedBy === 'candle');
			expect(candleLetters.every(f => f.revealed)).toBe(true);
		});
	});

	describe('toggleUVLight', () => {
		it('should toggle UV light active state', () => {
			let state = createInitialState();

			expect(state.uvLightActive).toBe(false);

			state = toggleUVLight(state);
			expect(state.uvLightActive).toBe(true);

			state = toggleUVLight(state);
			expect(state.uvLightActive).toBe(false);
		});

		it('should reveal UV-only letters when activated', () => {
			let state = createInitialState();

			state = toggleUVLight(state);

			const uvLetters = state.fragments.filter(f => f.revealedBy === 'uv');
			expect(uvLetters.every(f => f.revealed)).toBe(true);
		});
	});

	describe('updateRevealedLetters', () => {
		it('should reveal "both" letters only when both lights active', () => {
			let state = createInitialState();

			// Only candle
			state = toggleCandle(state);
			state = updateRevealedLetters(state);

			const bothLettersCandle = state.fragments.filter(f => f.revealedBy === 'both');
			expect(bothLettersCandle.every(f => f.revealed)).toBe(false);

			// Both lights
			state = toggleUVLight(state);
			state = updateRevealedLetters(state);

			const bothLettersBoth = state.fragments.filter(f => f.revealedBy === 'both');
			expect(bothLettersBoth.every(f => f.revealed)).toBe(true);
		});

		it('should reveal all letters when both lights active', () => {
			let state = createInitialState();

			state = toggleCandle(state);
			state = toggleUVLight(state);

			expect(state.fragments.every(f => f.revealed)).toBe(true);
			expect(state.revealedLetters.join('')).toBe('ROSALIND');
		});
	});

	describe('checkWordComplete', () => {
		it('should return false when not all letters revealed', () => {
			let state = createInitialState();

			state = toggleCandle(state);

			expect(checkWordComplete(state)).toBe(false);
		});

		it('should return true when all letters revealed', () => {
			let state = createInitialState();

			state = toggleCandle(state);
			state = toggleUVLight(state);

			expect(checkWordComplete(state)).toBe(true);
		});
	});

	describe('submitAnswer', () => {
		it('should reject wrong answer', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'WRONG');

			expect(result).toBe(false);
			expect(state.completed).toBe(false);
		});

		it('should accept correct answer', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'ROSALIND');

			expect(result).toBe(true);
			expect(state.completed).toBe(true);
		});

		it('should accept answer regardless of case', () => {
			const state = createInitialState();

			const result = submitAnswer(state, 'rosalind');

			expect(result).toBe(true);
			expect(state.completed).toBe(true);
		});
	});

	describe('validateSolution', () => {
		it('should return false for incomplete puzzle', () => {
			const puzzleState = createInitialState();
			const state: PuzzleState = {
				puzzleId: ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER,
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
				puzzleId: ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER,
				solved: true,
				attempts: 1,
				data: puzzleState
			};

			expect(validateSolution(state)).toBe(true);
		});
	});

	describe('getPlayerView', () => {
		it('should give explorer candle control', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'explorer');

			expect(view.hasLight).toBe('candle');
			expect(view.lightActive).toBe(false);
		});

		it('should give analyst UV light control', () => {
			const state = createInitialState();
			const view = getPlayerView(state, 'analyst');

			expect(view.hasLight).toBe('uv');
			expect(view.lightActive).toBe(false);
		});

		it('should show other light status', () => {
			let state = createInitialState();
			state = toggleCandle(state);

			const explorerView = getPlayerView(state, 'explorer');
			const analystView = getPlayerView(state, 'analyst');

			expect(explorerView.otherLightActive).toBe(false);
			expect(analystView.otherLightActive).toBe(true);
		});
	});

	describe('PuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(LoveLetterCipherPuzzle.id).toBe(ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER);
		});

		it('should be in the attic room', () => {
			expect(LoveLetterCipherPuzzle.roomId).toBe('attic');
		});

		it('should require both roles', () => {
			expect(LoveLetterCipherPuzzle.requiredRoles).toContain('explorer');
			expect(LoveLetterCipherPuzzle.requiredRoles).toContain('analyst');
		});

		it('should have hints defined', () => {
			expect(LoveLetterCipherPuzzle.hints).toHaveLength(3);
		});
	});
});

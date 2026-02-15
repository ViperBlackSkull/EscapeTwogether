import { describe, it, expect } from 'vitest';
import {
	createInitialBellCodesState,
	handleTelegraphKeyDown,
	handleTelegraphKeyUp,
	addMorseSpace,
	isBellCodesSolved,
	resetBellCodesPuzzle,
	getCurrentTargetInfo,
	getBellCodesViewData,
	bellCodesPuzzleDefinition,
	BELL_CODES_PUZZLE_ID,
	MORSE_CODE,
	type BellCodesPuzzleData
} from '$lib/puzzles/room2/bellCodesPuzzle';
import type { PuzzleState } from '$lib/types';

describe('Bell Codes Puzzle', () => {
	describe('createInitialBellCodesState', () => {
		it('should create initial state with target message', () => {
			const state = createInitialBellCodesState();

			expect(state.targetMessage).toBe('LOVE ETERNAL');
			expect(state.transmittedMorse).toBe('');
			expect(state.transmittedChars).toBe('');
			expect(state.messageComplete).toBe(false);
			expect(state.isKeyDown).toBe(false);
		});

		it('should have correct morse code for target', () => {
			const state = createInitialBellCodesState();

			// L = .-..
			expect(state.targetMorse).toContain('.-..');
		});
	});

	describe('handleTelegraphKeyDown', () => {
		it('should set key down state', () => {
			const state = createInitialBellCodesState();

			const updated = handleTelegraphKeyDown(state);

			expect(updated.isKeyDown).toBe(true);
			expect(updated.keyDownTimestamp).toBeDefined();
		});

		it('should not change state if already down', () => {
			const state = handleTelegraphKeyDown(createInitialBellCodesState());

			const updated = handleTelegraphKeyDown(state);

			expect(updated).toEqual(state);
		});
	});

	describe('handleTelegraphKeyUp', () => {
		it('should record short tap as dot', async () => {
			const state = createInitialBellCodesState();
			const downState = handleTelegraphKeyDown(state);

			// Wait a short time
			await new Promise(r => setTimeout(r, 100));

			const upState = handleTelegraphKeyUp(downState);

			expect(upState.taps).toHaveLength(1);
			expect(upState.taps[0].type).toBe('dot');
			expect(upState.transmittedMorse).toBe('.');
		});

		it('should record long tap as dash', async () => {
			const state = createInitialBellCodesState();
			const downState = handleTelegraphKeyDown(state);

			// Wait a longer time
			await new Promise(r => setTimeout(r, 500));

			const upState = handleTelegraphKeyUp(downState);

			expect(upState.taps).toHaveLength(1);
			expect(upState.taps[0].type).toBe('dash');
			expect(upState.transmittedMorse).toBe('-');
		});

		it('should set key down to false', async () => {
			const state = createInitialBellCodesState();
			const downState = handleTelegraphKeyDown(state);

			await new Promise(r => setTimeout(r, 100));

			const upState = handleTelegraphKeyUp(downState);

			expect(upState.isKeyDown).toBe(false);
			expect(upState.keyDownTimestamp).toBeNull();
		});
	});

	describe('addMorseSpace', () => {
		it('should add space to transmitted morse', () => {
			const state = createInitialBellCodesState();
			const withDot: BellCodesPuzzleData = {
				...state,
				transmittedMorse: '.'
			};

			const updated = addMorseSpace(withDot);

			expect(updated.transmittedMorse).toBe('. ');
		});
	});

	describe('getCurrentTargetInfo', () => {
		it('should return first character info initially', () => {
			const state = createInitialBellCodesState();
			const info = getCurrentTargetInfo(state);

			expect(info.char).toBe('L');
			expect(info.morse).toBe('.-..');
			expect(info.charIndex).toBe(0);
			expect(info.totalChars).toBe(12);
		});
	});

	describe('isBellCodesSolved', () => {
		it('should return false initially', () => {
			const state = createInitialBellCodesState();

			expect(isBellCodesSolved(state)).toBe(false);
		});

		it('should return true when message complete', () => {
			const state = createInitialBellCodesState();
			const completeState: BellCodesPuzzleData = {
				...state,
				messageComplete: true
			};

			expect(isBellCodesSolved(completeState)).toBe(true);
		});
	});

	describe('resetBellCodesPuzzle', () => {
		it('should reset to initial state', () => {
			const state = createInitialBellCodesState();
			const withTaps: BellCodesPuzzleData = {
				...state,
				transmittedMorse: '.-.',
				taps: [{ timestamp: Date.now(), duration: 100, type: 'dot' }]
			};

			const reset = resetBellCodesPuzzle();

			expect(reset.transmittedMorse).toBe('');
			expect(reset.taps).toHaveLength(0);
		});
	});

	describe('getBellCodesViewData', () => {
		it('should give tapping control to explorer', () => {
			const state = createInitialBellCodesState();
			const viewData = getBellCodesViewData('explorer', state);

			expect(viewData.canTap).toBe(true);
			expect(viewData.hasCodebook).toBe(false);
		});

		it('should give codebook to analyst', () => {
			const state = createInitialBellCodesState();
			const viewData = getBellCodesViewData('analyst', state);

			expect(viewData.canTap).toBe(false);
			expect(viewData.hasCodebook).toBe(true);
			expect(viewData.codebook).toBeDefined();
		});
	});

	describe('MORSE_CODE mapping', () => {
		it('should have correct mappings', () => {
			expect(MORSE_CODE['A']).toBe('.-');
			expect(MORSE_CODE['B']).toBe('-...');
			expect(MORSE_CODE['S']).toBe('...');
			expect(MORSE_CODE['O']).toBe('---');
		});
	});

	describe('bellCodesPuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(bellCodesPuzzleDefinition.id).toBe(BELL_CODES_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(bellCodesPuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(bellCodesPuzzleDefinition.requiredRoles).toContain('explorer');
			expect(bellCodesPuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(bellCodesPuzzleDefinition.hints).toHaveLength(3);
		});

		it('should validate solution correctly', () => {
			const solvedState: BellCodesPuzzleData = {
				...createInitialBellCodesState(),
				messageComplete: true
			};
			const state: PuzzleState = {
				puzzleId: BELL_CODES_PUZZLE_ID,
				solved: false,
				attempts: 0,
				data: solvedState as unknown as Record<string, unknown>
			};

			expect(bellCodesPuzzleDefinition.validateSolution(state)).toBe(true);
		});
	});
});

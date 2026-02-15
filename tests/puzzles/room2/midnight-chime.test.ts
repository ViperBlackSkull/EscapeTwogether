import { describe, it, expect } from 'vitest';
import {
	createInitialMidnightChimeState,
	ringBell,
	startMidnightChime,
	updatePlayback,
	getCurrentPlaybackNote,
	isPlayerTurn,
	isMidnightChimeSolved,
	resetMidnightChimePuzzle,
	getMidnightChimeViewData,
	getBellPlayer,
	midnightChimePuzzleDefinition,
	MIDNIGHT_CHIME_PUZZLE_ID,
	type MidnightChimePuzzleData,
	type BellType
} from '$lib/puzzles/room2/midnightChimePuzzle';
import type { PuzzleState } from '$lib/types';

describe('Midnight Chime Puzzle', () => {
	describe('createInitialMidnightChimeState', () => {
		it('should create initial state with a 6-note sequence', () => {
			const state = createInitialMidnightChimeState();

			expect(state.sequence).toHaveLength(6);
		});

		it('should have alternating player sequence', () => {
			const state = createInitialMidnightChimeState();

			for (let i = 0; i < state.sequence.length; i++) {
				const bell = state.sequence[i].bell;
				const expectedPlayer = i % 2 === 0 ? 'A' : 'B';
				expect(getBellPlayer(bell)).toBe(expectedPlayer);
			}
		});

		it('should start in intro phase', () => {
			const state = createInitialMidnightChimeState();

			expect(state.phase).toBe('intro');
			expect(state.currentPlaythrough).toBe(0);
		});

		it('should have max 3 attempts', () => {
			const state = createInitialMidnightChimeState();

			expect(state.maxAttempts).toBe(3);
			expect(state.attempts).toBe(0);
		});
	});

	describe('getBellPlayer', () => {
		it('should return A for high bells', () => {
			expect(getBellPlayer('high_A')).toBe('A');
			expect(getBellPlayer('high_B')).toBe('A');
			expect(getBellPlayer('high_C')).toBe('A');
		});

		it('should return B for low bells', () => {
			expect(getBellPlayer('low_A')).toBe('B');
			expect(getBellPlayer('low_B')).toBe('B');
			expect(getBellPlayer('low_C')).toBe('B');
		});
	});

	describe('startMidnightChime', () => {
		it('should start playback phase', () => {
			const state = createInitialMidnightChimeState();

			const updated = startMidnightChime(state);

			expect(updated.phase).toBe('playback');
			expect(updated.playbackNoteIndex).toBe(0);
		});
	});

	describe('updatePlayback', () => {
		it('should not change state when not in playback phase', () => {
			const state = createInitialMidnightChimeState();

			const updated = updatePlayback(state);

			expect(updated).toEqual(state);
		});

		it('should advance to next note after interval', async () => {
			const state = startMidnightChime(createInitialMidnightChimeState());

			// Wait for playback interval
			await new Promise(r => setTimeout(r, 850));

			const updated = updatePlayback(state);

			expect(updated.playbackNoteIndex).toBeGreaterThan(state.playbackNoteIndex);
		});
	});

	describe('getCurrentPlaybackNote', () => {
		it('should return null when not in playback', () => {
			const state = createInitialMidnightChimeState();

			expect(getCurrentPlaybackNote(state)).toBeNull();
		});

		it('should return current note during playback', () => {
			const state = startMidnightChime(createInitialMidnightChimeState());

			const note = getCurrentPlaybackNote(state);

			expect(note).toBeDefined();
			expect(note?.bell).toBe(state.sequence[0].bell);
		});
	});

	describe('isPlayerTurn', () => {
		it('should return false when not in input phase', () => {
			const state = createInitialMidnightChimeState();

			expect(isPlayerTurn(state, 'A')).toBe(false);
		});

		it('should return true for correct player in input phase', () => {
			let state = createInitialMidnightChimeState();
			state = { ...state, phase: 'input', expectedNoteIndex: 0 };

			const firstBellPlayer = getBellPlayer(state.sequence[0].bell);

			expect(isPlayerTurn(state, firstBellPlayer)).toBe(true);
			expect(isPlayerTurn(state, firstBellPlayer === 'A' ? 'B' : 'A')).toBe(false);
		});
	});

	describe('ringBell', () => {
		it('should not accept input when not in input phase', () => {
			const state = createInitialMidnightChimeState();

			const updated = ringBell(state, 'A', 'high_A');

			expect(updated).toEqual(state);
		});

		it('should not accept input from wrong player', () => {
			let state = createInitialMidnightChimeState();
			state = { ...state, phase: 'input', expectedNoteIndex: 0 };

			// If first note is for Player A, B shouldn't be able to ring
			const firstBell = state.sequence[0].bell;
			const wrongPlayer = getBellPlayer(firstBell) === 'A' ? 'B' : 'A';

			const updated = ringBell(state, wrongPlayer, 'low_A');

			expect(updated).toEqual(state);
		});

		it('should advance on correct bell', () => {
			let state = createInitialMidnightChimeState();
			state = { ...state, phase: 'input', expectedNoteIndex: 0 };

			const firstBell = state.sequence[0].bell;
			const player = getBellPlayer(firstBell);

			const updated = ringBell(state, player, firstBell);

			expect(updated.expectedNoteIndex).toBe(1);
			expect(updated.playerInputSequence).toHaveLength(1);
		});

		it('should complete puzzle on last correct note', () => {
			const baseState = createInitialMidnightChimeState();

			// Set up state where 5 notes have been played correctly
			let state: MidnightChimePuzzleData = {
				...baseState,
				phase: 'input',
				expectedNoteIndex: 5,
				playerInputSequence: baseState.sequence.slice(0, 5).map(n => ({ ...n }))
			};

			const lastBell = state.sequence[5].bell;
			const player = getBellPlayer(lastBell);

			const updated = ringBell(state, player, lastBell);

			expect(updated.phase).toBe('success');
			expect(updated.puzzleComplete).toBe(true);
		});

		it('should increment attempts on wrong note', () => {
			let state = createInitialMidnightChimeState();
			state = { ...state, phase: 'input', expectedNoteIndex: 0 };

			const firstBell = state.sequence[0].bell;
			const player = getBellPlayer(firstBell);

			// Ring wrong bell (not the expected one)
			const wrongBell: BellType = firstBell === 'high_A' ? 'high_B' : 'high_A';

			const updated = ringBell(state, player, wrongBell);

			expect(updated.attempts).toBe(1);
		});
	});

	describe('isMidnightChimeSolved', () => {
		it('should return false initially', () => {
			const state = createInitialMidnightChimeState();

			expect(isMidnightChimeSolved(state)).toBe(false);
		});

		it('should return true when puzzle complete', () => {
			const state: MidnightChimePuzzleData = {
				...createInitialMidnightChimeState(),
				puzzleComplete: true
			};

			expect(isMidnightChimeSolved(state)).toBe(true);
		});
	});

	describe('resetMidnightChimePuzzle', () => {
		it('should reset to initial state with new sequence', () => {
			const state = createInitialMidnightChimeState();
			const started = startMidnightChime(state);

			const reset = resetMidnightChimePuzzle();

			expect(reset.phase).toBe('intro');
			expect(reset.attempts).toBe(0);
		});
	});

	describe('getMidnightChimeViewData', () => {
		it('should give high bells to explorer (Player A)', () => {
			const state = createInitialMidnightChimeState();
			const viewData = getMidnightChimeViewData('explorer', state);

			expect(viewData.myBells).toContain('high_A');
			expect(viewData.myBells).toContain('high_B');
			expect(viewData.myBells).toContain('high_C');
		});

		it('should give low bells to analyst (Player B)', () => {
			const state = createInitialMidnightChimeState();
			const viewData = getMidnightChimeViewData('analyst', state);

			expect(viewData.myBells).toContain('low_A');
			expect(viewData.myBells).toContain('low_B');
			expect(viewData.myBells).toContain('low_C');
		});

		it('should include phase info', () => {
			const state = createInitialMidnightChimeState();
			const viewData = getMidnightChimeViewData('explorer', state);

			expect(viewData.phase).toBe('intro');
			expect(viewData.totalPlaythroughs).toBe(3);
		});

		it('should show turn status in input phase', () => {
			let state = createInitialMidnightChimeState();
			state = { ...state, phase: 'input', expectedNoteIndex: 0 };

			const firstBell = state.sequence[0].bell;
			const firstPlayer = getBellPlayer(firstBell);
			const role = firstPlayer === 'A' ? 'explorer' : 'analyst';

			const viewData = getMidnightChimeViewData(role, state);

			expect(viewData.isMyTurn).toBe(true);
		});
	});

	describe('midnightChimePuzzleDefinition', () => {
		it('should have correct puzzle ID', () => {
			expect(midnightChimePuzzleDefinition.id).toBe(MIDNIGHT_CHIME_PUZZLE_ID);
		});

		it('should be in the clock_tower room', () => {
			expect(midnightChimePuzzleDefinition.roomId).toBe('clock_tower');
		});

		it('should require both roles', () => {
			expect(midnightChimePuzzleDefinition.requiredRoles).toContain('explorer');
			expect(midnightChimePuzzleDefinition.requiredRoles).toContain('analyst');
		});

		it('should have 3 hints defined', () => {
			expect(midnightChimePuzzleDefinition.hints).toHaveLength(3);
		});

		it('should validate solution correctly', () => {
			const solvedState: MidnightChimePuzzleData = {
				...createInitialMidnightChimeState(),
				puzzleComplete: true
			};
			const state: PuzzleState = {
				puzzleId: MIDNIGHT_CHIME_PUZZLE_ID,
				solved: false,
				attempts: 0,
				data: solvedState as unknown as Record<string, unknown>
			};

			expect(midnightChimePuzzleDefinition.validateSolution(state)).toBe(true);
		});
	});
});

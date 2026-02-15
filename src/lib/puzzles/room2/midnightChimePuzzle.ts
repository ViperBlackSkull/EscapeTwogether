/**
 * Midnight Chime Puzzle (Room 2, Puzzle 6)
 *
 * A memory/coordination puzzle where players recreate a bell sequence together.
 * A 6-note sequence plays with visual notes appearing during 3 playthroughs.
 * Player A plays high bells, Player B plays low bells.
 * Players alternate in the sequence.
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

export const MIDNIGHT_CHIME_PUZZLE_ID = 'room2_midnight_chime';

// Bell types - high and low for each player
export type BellType = 'high_A' | 'high_B' | 'high_C' | 'low_A' | 'low_B' | 'low_C';

export interface BellNote {
	bell: BellType;
	duration: number; // ms
}

export type GamePhase = 'intro' | 'playback' | 'input' | 'success' | 'failure';

export interface MidnightChimePuzzleData {
	// The sequence to memorize and play
	sequence: BellNote[];

	// Current game state
	phase: GamePhase;
	currentPlaythrough: number; // 0, 1, 2 (3 playthroughs before input)
	playbackNoteIndex: number; // Current note being played back

	// Input tracking
	playerInputSequence: BellNote[];
	expectedNoteIndex: number; // Which note in the sequence we're waiting for

	// Timing
	phaseStartTime: number;
	notePlaybackTime: number; // When current note started playing
	playbackInterval: number; // Time between notes

	// Attempt tracking
	attempts: number;
	maxAttempts: number;

	// Completion
	puzzleComplete: boolean;
}

export interface MidnightChimePuzzleState extends PuzzleState {
	puzzleId: typeof MIDNIGHT_CHIME_PUZZLE_ID;
	data: MidnightChimePuzzleData;
}

// Generate a random sequence with alternating players
function generateSequence(): BellNote[] {
	const highBells: BellType[] = ['high_A', 'high_B', 'high_C'];
	const lowBells: BellType[] = ['low_A', 'low_B', 'low_C'];

	const sequence: BellNote[] = [];

	for (let i = 0; i < 6; i++) {
		// Alternate between players (high = Player A, low = Player B)
		if (i % 2 === 0) {
			// Player A's turn (high bell)
			const bell = highBells[Math.floor(Math.random() * highBells.length)];
			sequence.push({ bell, duration: 500 });
		} else {
			// Player B's turn (low bell)
			const bell = lowBells[Math.floor(Math.random() * lowBells.length)];
			sequence.push({ bell, duration: 500 });
		}
	}

	return sequence;
}

export function createInitialMidnightChimeState(): MidnightChimePuzzleData {
	return {
		sequence: generateSequence(),
		phase: 'intro',
		currentPlaythrough: 0,
		playbackNoteIndex: 0,
		playerInputSequence: [],
		expectedNoteIndex: 0,
		phaseStartTime: Date.now(),
		notePlaybackTime: 0,
		playbackInterval: 800, // 800ms between notes
		attempts: 0,
		maxAttempts: 3,
		puzzleComplete: false,
	};
}

// Get which player should play a bell
export function getBellPlayer(bell: BellType): 'A' | 'B' {
	return bell.startsWith('high') ? 'A' : 'B';
}

// Check if it's a player's turn to play
export function isPlayerTurn(data: MidnightChimePuzzleData, player: 'A' | 'B'): boolean {
	if (data.phase !== 'input') return false;
	if (data.expectedNoteIndex >= data.sequence.length) return false;

	const expectedBell = data.sequence[data.expectedNoteIndex].bell;
	return getBellPlayer(expectedBell) === player;
}

// Handle player ringing a bell
export function ringBell(data: MidnightChimePuzzleData, player: 'A' | 'B', bell: BellType): MidnightChimePuzzleData {
	if (data.phase !== 'input') return data;

	// Check if it's this player's turn
	if (!isPlayerTurn(data, player)) return data;

	// Record the input
	const newInputSequence = [...data.playerInputSequence, { bell, duration: 500 }];
	const expectedBell = data.sequence[data.expectedNoteIndex].bell;

	// Check if correct
	if (bell === expectedBell) {
		// Correct!
		const newExpectedIndex = data.expectedNoteIndex + 1;

		// Check if sequence complete
		if (newExpectedIndex >= data.sequence.length) {
			// Success!
			return {
				...data,
				playerInputSequence: newInputSequence,
				expectedNoteIndex: newExpectedIndex,
				phase: 'success',
				puzzleComplete: true,
			};
		}

		return {
			...data,
			playerInputSequence: newInputSequence,
			expectedNoteIndex: newExpectedIndex,
		};
	} else {
		// Wrong note
		const newAttempts = data.attempts + 1;

		if (newAttempts >= data.maxAttempts) {
			// Failed all attempts - regenerate sequence and start over
			return {
				...createInitialMidnightChimeState(),
				attempts: newAttempts,
				phase: 'failure',
			};
		}

		// Reset for another attempt
		return {
			...data,
			playerInputSequence: [],
			expectedNoteIndex: 0,
			attempts: newAttempts,
			phase: 'playback',
			currentPlaythrough: 0,
			playbackNoteIndex: 0,
			phaseStartTime: Date.now(),
		};
	}
}

// Start the puzzle (begin playback)
export function startMidnightChime(data: MidnightChimePuzzleData): MidnightChimePuzzleData {
	return {
		...data,
		phase: 'playback',
		currentPlaythrough: 0,
		playbackNoteIndex: 0,
		phaseStartTime: Date.now(),
		notePlaybackTime: Date.now(),
	};
}

// Update playback state (call this regularly)
export function updatePlayback(data: MidnightChimePuzzleData): MidnightChimePuzzleData {
	if (data.phase !== 'playback') return data;

	const now = Date.now();
	const elapsed = now - data.notePlaybackTime;

	// Check if it's time for the next note
	if (elapsed >= data.playbackInterval) {
		const nextNoteIndex = data.playbackNoteIndex + 1;

		if (nextNoteIndex >= data.sequence.length) {
			// Finished this playthrough
			const nextPlaythrough = data.currentPlaythrough + 1;

			if (nextPlaythrough >= 3) {
				// All playthroughs done, now it's input time
				return {
					...data,
					phase: 'input',
					playerInputSequence: [],
					expectedNoteIndex: 0,
					phaseStartTime: now,
				};
			} else {
				// Start next playthrough
				return {
					...data,
					currentPlaythrough: nextPlaythrough,
					playbackNoteIndex: 0,
					notePlaybackTime: now,
				};
			}
		} else {
			// Continue to next note
			return {
				...data,
				playbackNoteIndex: nextNoteIndex,
				notePlaybackTime: now,
			};
		}
	}

	return data;
}

// Get the current note being played (for visual feedback)
export function getCurrentPlaybackNote(data: MidnightChimePuzzleData): BellNote | null {
	if (data.phase !== 'playback') return null;
	if (data.playbackNoteIndex >= data.sequence.length) return null;
	return data.sequence[data.playbackNoteIndex];
}

// Check if puzzle is solved
export function isMidnightChimeSolved(data: MidnightChimePuzzleData): boolean {
	return data.puzzleComplete;
}

// Reset puzzle (with new sequence)
export function resetMidnightChimePuzzle(): MidnightChimePuzzleData {
	return createInitialMidnightChimeState();
}

// Hints
export const MIDNIGHT_CHIME_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Listen to the bell sequence carefully. One player has high bells, the other has low bells. You'll play it back together.",
		triggerAttempts: 1,
	},
	{
		tier: 2,
		text: "The sequence plays 3 times. Watch for visual cues showing which bell rings. Then alternate with your partner - you take turns playing notes.",
		triggerAttempts: 2,
	},
	{
		tier: 3,
		text: "Pay attention to the visual note indicators during playback. The sequence alternates between high (Player A) and low (Player B) bells. A = first high bell, B = second, C = third.",
		triggerAttempts: 3,
	},
];

// Role-based view data
export function getMidnightChimeViewData(role: PlayerRole, data: MidnightChimePuzzleData): Record<string, unknown> {
	const player = role === 'explorer' ? 'A' : 'B';
	const myBells = player === 'A'
		? ['high_A', 'high_B', 'high_C'] as BellType[]
		: ['low_A', 'low_B', 'low_C'] as BellType[];

	// Current playback note info
	const currentNote = getCurrentPlaybackNote(data);
	const isMyNotePlaying = currentNote ? getBellPlayer(currentNote.bell) === player : false;

	// Whose turn in input phase
	const isMyTurn = isPlayerTurn(data, player);
	const expectedBell = data.phase === 'input' && data.expectedNoteIndex < data.sequence.length
		? data.sequence[data.expectedNoteIndex].bell
		: null;

	return {
		// My bells
		myBells,
		myBellLabels: player === 'A'
			? { high_A: 'High A', high_B: 'High B', high_C: 'High C' }
			: { low_A: 'Low A', low_B: 'Low B', low_C: 'Low C' },

		// Phase info
		phase: data.phase,
		currentPlaythrough: data.currentPlaythrough,
		totalPlaythroughs: 3,

		// Playback state
		playbackNoteIndex: data.playbackNoteIndex,
		totalNotes: data.sequence.length,
		currentNote: currentNote?.bell ?? null,
		isMyNotePlaying,

		// Input state
		isMyTurn,
		expectedNoteIndex: data.expectedNoteIndex,
		inputProgress: data.playerInputSequence.length,

		// Attempts
		attempts: data.attempts,
		maxAttempts: data.maxAttempts,

		// Completion
		puzzleComplete: data.puzzleComplete,

		// Visual sequence (shown during playback)
		sequence: data.phase === 'input' ? data.sequence.map(n => n.bell) : null,
	};
}

// Export puzzle definition
export const midnightChimePuzzleDefinition = {
	id: MIDNIGHT_CHIME_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Midnight Chime',
	description: 'Listen to the midnight bells and recreate the sequence together.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: MIDNIGHT_CHIME_HINTS,
	createInitialState: createInitialMidnightChimeState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== MIDNIGHT_CHIME_PUZZLE_ID) return false;
		return isMidnightChimeSolved(state.data as unknown as MidnightChimePuzzleData);
	},
};

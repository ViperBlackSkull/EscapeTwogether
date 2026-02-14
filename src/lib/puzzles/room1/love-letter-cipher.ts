// Puzzle 3: Love Letter Cipher
// Player A has candle, Player B has UV light
// Must activate together to reveal letters that spell 'ROSALIND'

import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Letter fragment hidden in the letter
export interface LetterFragment {
	id: string;
	letter: string;
	position: { x: number; y: number }; // Position on the paper
	revealed: boolean;
	revealedBy: 'candle' | 'uv' | 'both'; // Which light reveals this letter
}

// Light state for each player
export interface LightState {
	active: boolean;
	playerRole: 'explorer' | 'analyst';
}

// Puzzle state
export interface LoveLetterCipherState {
	fragments: LetterFragment[];
	candleActive: boolean;
	uvLightActive: boolean;
	revealedLetters: string[];
	expectedWord: string;
	completed: boolean;
	letterPaperContent: string; // The visible text on the letter
}

// The secret word is ROSALIND (grandmother's name)
const SECRET_WORD = 'ROSALIND';

// Letter fragments with positions and reveal requirements
const LETTER_FRAGMENTS: Omit<LetterFragment, 'revealed'>[] = [
	{ id: 'letter-0', letter: 'R', position: { x: 15, y: 20 }, revealedBy: 'both' },
	{ id: 'letter-1', letter: 'O', position: { x: 25, y: 35 }, revealedBy: 'candle' },
	{ id: 'letter-2', letter: 'S', position: { x: 45, y: 25 }, revealedBy: 'uv' },
	{ id: 'letter-3', letter: 'A', position: { x: 55, y: 45 }, revealedBy: 'both' },
	{ id: 'letter-4', letter: 'L', position: { x: 35, y: 55 }, revealedBy: 'candle' },
	{ id: 'letter-5', letter: 'I', position: { x: 65, y: 40 }, revealedBy: 'uv' },
	{ id: 'letter-6', letter: 'N', position: { x: 75, y: 60 }, revealedBy: 'both' },
	{ id: 'letter-7', letter: 'D', position: { x: 85, y: 50 }, revealedBy: 'candle' }
];

// The visible letter content (a love letter from grandfather)
const LETTER_PAPER_CONTENT = `My Dearest,

The years we've shared feel like moments in the warm glow of evening.
I remember the first time I saw you, standing by the garden gate,
your laughter carrying on the summer breeze.

Every day with you has been a gift. Your kindness, your strength,
your unwavering love - they are the foundations upon which
I have built my life.

Forever yours,
James`;

// Hints
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Some letters need only one light to reveal, but others require both the candle and UV light to be active at the same time.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'The letters spell a name. Think about who this attic might have belonged to - whose memories fill this space?',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'The name is ROSALIND - your grandmother. Coordinate with your partner to activate both lights when needed.',
		triggerAttempts: 10
	}
];

// Create initial state
export function createInitialState(): LoveLetterCipherState {
	const fragments: LetterFragment[] = LETTER_FRAGMENTS.map(f => ({
		...f,
		revealed: false
	}));

	return {
		fragments,
		candleActive: false,
		uvLightActive: false,
		revealedLetters: [],
		expectedWord: SECRET_WORD,
		completed: false,
		letterPaperContent: LETTER_PAPER_CONTENT
	};
}

// Toggle candle (Player A - Explorer)
export function toggleCandle(state: LoveLetterCipherState): LoveLetterCipherState {
	state.candleActive = !state.candleActive;
	return updateRevealedLetters({ ...state });
}

// Toggle UV light (Player B - Analyst)
export function toggleUVLight(state: LoveLetterCipherState): LoveLetterCipherState {
	state.uvLightActive = !state.uvLightActive;
	return updateRevealedLetters({ ...state });
}

// Update which letters are revealed based on current light states
export function updateRevealedLetters(state: LoveLetterCipherState): LoveLetterCipherState {
	const bothActive = state.candleActive && state.uvLightActive;

	state.fragments = state.fragments.map(fragment => {
		let shouldReveal = false;

		switch (fragment.revealedBy) {
			case 'candle':
				shouldReveal = state.candleActive;
				break;
			case 'uv':
				shouldReveal = state.uvLightActive;
				break;
			case 'both':
				shouldReveal = bothActive;
				break;
		}

		return { ...fragment, revealed: shouldReveal };
	});

	// Update revealed letters list
	state.revealedLetters = state.fragments
		.filter(f => f.revealed)
		.sort((a, b) => {
			const indexA = LETTER_FRAGMENTS.findIndex(lf => lf.id === a.id);
			const indexB = LETTER_FRAGMENTS.findIndex(lf => lf.id === b.id);
			return indexA - indexB;
		})
		.map(f => f.letter);

	return state;
}

// Check if the word is complete
export function checkWordComplete(state: LoveLetterCipherState): boolean {
	const currentWord = state.revealedLetters.join('');
	return currentWord === state.expectedWord;
}

// Submit answer
export function submitAnswer(state: LoveLetterCipherState, answer: string): boolean {
	const normalizedAnswer = answer.toUpperCase().trim();
	const isCorrect = normalizedAnswer === state.expectedWord;

	if (isCorrect) {
		state.completed = true;
		// Reveal all letters
		state.fragments = state.fragments.map(f => ({ ...f, revealed: true }));
		state.revealedLetters = state.expectedWord.split('');
	}

	return isCorrect;
}

// Validate solution
export function validateSolution(state: PuzzleState): boolean {
	const puzzleState = state.data as LoveLetterCipherState;
	if (!puzzleState) return false;
	return puzzleState.completed || checkWordComplete(puzzleState);
}

// Get player-specific view
export function getPlayerView(state: LoveLetterCipherState, role: PlayerRole): {
	hasLight: 'candle' | 'uv';
	lightActive: boolean;
	fragments: LetterFragment[];
	revealedLetters: string[];
	letterPaperContent: string;
	completed: boolean;
	otherLightActive: boolean;
} {
	const isExplorer = role === 'explorer';

	return {
		hasLight: isExplorer ? 'candle' : 'uv',
		lightActive: isExplorer ? state.candleActive : state.uvLightActive,
		fragments: state.fragments,
		revealedLetters: state.revealedLetters,
		letterPaperContent: state.letterPaperContent,
		completed: state.completed,
		otherLightActive: isExplorer ? state.uvLightActive : state.candleActive
	};
}

// Get hint about which letters need which light
export function getLightHint(fragment: LetterFragment): string {
	switch (fragment.revealedBy) {
		case 'candle':
			return 'This letter glows warm in candlelight.';
		case 'uv':
			return 'This letter shimmers under UV light.';
		case 'both':
			return 'This letter only appears when both lights shine together.';
	}
}

// Puzzle definition
export const LoveLetterCipherPuzzle: PuzzleDefinition = {
	id: ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER,
	roomId: 'attic',
	name: 'Love Letter Cipher',
	description: 'Use the candle and UV light together to reveal the hidden message in this love letter.',
	requiredRoles: ['explorer', 'analyst'],
	solutionValidator: validateSolution,
	hints: HINTS
};

export default LoveLetterCipherPuzzle;

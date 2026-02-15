/**
 * Bell Codes Puzzle (Room 2, Puzzle 3)
 *
 * A communication puzzle where Player A operates a telegraph key (tapping),
 * and Player B has a codebook. Tap duration determines dot or dash.
 * Players must transmit the message 'LOVE'.
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';
import { puzzleImages } from '$lib/assets/images';

export const BELL_CODES_PUZZLE_ID = 'room2_bell_codes';

// Visual assets for this puzzle
export const BELL_CODES_ASSETS = {
	// Codebook for Player B (analyst)
	codebook: puzzleImages.codebook,

	// Mysterious symbols for morse code visualization
	symbols: puzzleImages.mysteriousGlyphs,

	// Telegraph key / vintage machinery aesthetic
	keyVisual: puzzleImages.antiqueKeys,

	// Decorative frame for the puzzle
	ornateFrame: puzzleImages.victorianOrnament,

	// Background texture
	background: puzzleImages.puzzleTexture,

	// Hourglass for timing visual
	timingIndicator: puzzleImages.hourglass
} as const;

// Morse code mapping
export const MORSE_CODE: Record<string, string> = {
	'A': '.-',
	'B': '-...',
	'C': '-.-.',
	'D': '-..',
	'E': '.',
	'F': '..-.',
	'G': '--.',
	'H': '....',
	'I': '..',
	'J': '.---',
	'K': '-.-',
	'L': '.-..',
	'M': '--',
	'N': '-.',
	'O': '---',
	'P': '.--.',
	'Q': '--.-',
	'R': '.-.',
	'S': '...',
	'T': '-',
	'U': '..-',
	'V': '...-',
	'W': '.--',
	'X': '-..-',
	'Y': '-.--',
	'Z': '--..',
	' ': '/',
};

// Reverse mapping for decoding
export const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
	Object.entries(MORSE_CODE).map(([char, code]) => [code, char])
);

export interface TapEvent {
	timestamp: number;
	duration: number; // ms
	type: 'dot' | 'dash';
}

export interface BellCodesPuzzleData {
	// Target message
	targetMessage: string;
	targetMorse: string;

	// Current transmission state
	currentCharIndex: number;
	currentMorseIndex: number;
	transmittedMorse: string;
	transmittedChars: string;

	// Tap tracking
	taps: TapEvent[];
	isKeyDown: boolean;
	keyDownTimestamp: number | null;

	// Timing thresholds
	dotThreshold: number; // < 250ms = dot
	dashThreshold: number; // > 400ms = dash

	// Inter-character gap
	lastTapTimestamp: number | null;
	charGapThreshold: number; // ms between letters

	// Completion
	messageComplete: boolean;
}

export interface BellCodesPuzzleState extends PuzzleState {
	puzzleId: typeof BELL_CODES_PUZZLE_ID;
	data: BellCodesPuzzleData;
}

// Convert message to morse
function messageToMorse(message: string): string {
	return message.toUpperCase()
		.split('')
		.map(char => MORSE_CODE[char] || '')
		.join(' ');
}

export function createInitialBellCodesState(): BellCodesPuzzleData {
	const targetMessage = 'LOVE'; // Shortened for better pacing
	return {
		targetMessage,
		targetMorse: messageToMorse(targetMessage),
		currentCharIndex: 0,
		currentMorseIndex: 0,
		transmittedMorse: '',
		transmittedChars: '',
		taps: [],
		isKeyDown: false,
		keyDownTimestamp: null,
		dotThreshold: 200,   // Widened from 250ms
		dashThreshold: 500,  // Widened from 400ms
		lastTapTimestamp: null,
		charGapThreshold: 800,
		messageComplete: false,
	};
}

// Determine if tap is dot or dash based on duration
function classifyTap(duration: number, dotThreshold: number, dashThreshold: number): 'dot' | 'dash' {
	if (duration < dotThreshold) return 'dot';
	if (duration > dashThreshold) return 'dash';
	// In between - round to nearest
	return duration < (dotThreshold + dashThreshold) / 2 ? 'dot' : 'dash';
}

// Handle key down (telegraph press)
export function handleTelegraphKeyDown(data: BellCodesPuzzleData): BellCodesPuzzleData {
	if (data.isKeyDown) return data;

	return {
		...data,
		isKeyDown: true,
		keyDownTimestamp: Date.now(),
	};
}

// Handle key up (telegraph release)
export function handleTelegraphKeyUp(data: BellCodesPuzzleData): BellCodesPuzzleData {
	if (!data.isKeyDown || !data.keyDownTimestamp) return data;

	const now = Date.now();
	const duration = now - data.keyDownTimestamp;
	const tapType = classifyTap(duration, data.dotThreshold, data.dashThreshold);

	const newTap: TapEvent = {
		timestamp: now,
		duration,
		type: tapType,
	};

	const newTaps = [...data.taps, newTap];
	const newTransmittedMorse = data.transmittedMorse + (tapType === 'dot' ? '.' : '-');

	// Try to decode current character
	const morseChar = newTransmittedMorse.split(' ').pop() || '';
	const decodedChar = MORSE_TO_CHAR[morseChar];

	let newTransmittedChars = data.transmittedChars;
	let newCurrentCharIndex = data.currentCharIndex;

	// Check if we completed a character
	const targetChar = data.targetMessage[data.currentCharIndex];
	const targetMorseForChar = MORSE_CODE[targetChar] || '';

	if (morseChar === targetMorseForChar) {
		newTransmittedChars = data.transmittedChars + targetChar;
		newCurrentCharIndex = data.currentCharIndex + 1;
	}

	// Check completion
	const messageComplete = newTransmittedChars === data.targetMessage;

	return {
		...data,
		isKeyDown: false,
		keyDownTimestamp: null,
		taps: newTaps,
		transmittedMorse: newTransmittedMorse,
		transmittedChars: newTransmittedChars,
		currentCharIndex: newCurrentCharIndex,
		lastTapTimestamp: now,
		messageComplete,
	};
}

// Add space (character separator)
export function addMorseSpace(data: BellCodesPuzzleData): BellCodesPuzzleData {
	const newTransmittedMorse = data.transmittedMorse + ' ';
	return {
		...data,
		transmittedMorse: newTransmittedMorse,
	};
}

// Check if puzzle is solved
export function isBellCodesSolved(data: BellCodesPuzzleData): boolean {
	return data.messageComplete;
}

// Reset puzzle
export function resetBellCodesPuzzle(): BellCodesPuzzleData {
	return createInitialBellCodesState();
}

// Get current target info
export function getCurrentTargetInfo(data: BellCodesPuzzleData): {
	char: string;
	morse: string;
	charIndex: number;
	totalChars: number;
} {
	const currentChar = data.targetMessage[data.currentCharIndex] || '';
	return {
		char: currentChar,
		morse: MORSE_CODE[currentChar] || '',
		charIndex: data.currentCharIndex,
		totalChars: data.targetMessage.length,
	};
}

// Hints
export const BELL_CODES_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "One player taps the telegraph key, the other reads the codebook. Short taps (under 200ms) are dots, long taps (over 500ms) are dashes.",
		triggerAttempts: 3,
	},
	{
		tier: 2,
		text: "The message is four letters: a word that means everything. Look up each letter in the codebook and tap the pattern together.",
		triggerAttempts: 6,
	},
	{
		tier: 3,
		text: "The word is LOVE. L = .-.. | O = --- | V = ...- | E = . Work together - the codebook reader should call out the pattern!",
		triggerAttempts: 10,
	},
];

// Role-based view data
export function getBellCodesViewData(role: PlayerRole, data: BellCodesPuzzleData): Record<string, unknown> {
	if (role === 'explorer') {
		// Player A (Explorer) operates the telegraph
		return {
			canTap: true,
			hasCodebook: false,
			isKeyDown: data.isKeyDown,
			taps: data.taps.slice(-5), // Last 5 taps
			transmittedMorse: data.transmittedMorse,
			currentTarget: getCurrentTargetInfo(data),
			progress: (data.currentCharIndex / data.targetMessage.length) * 100,
			messageComplete: data.messageComplete,
		};
	} else {
		// Player B (Analyst) has the codebook
		return {
			canTap: false,
			hasCodebook: true,
			codebook: MORSE_CODE,
			transmittedMorse: data.transmittedMorse,
			transmittedChars: data.transmittedChars,
			currentTarget: getCurrentTargetInfo(data),
			targetMessage: data.targetMessage,
			progress: (data.currentCharIndex / data.targetMessage.length) * 100,
			messageComplete: data.messageComplete,
		};
	}
}

// Export puzzle definition
export const bellCodesPuzzleDefinition = {
	id: BELL_CODES_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Bell Codes',
	description: 'Transmit a secret message using Morse code through the telegraph.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: BELL_CODES_HINTS,
	createInitialState: createInitialBellCodesState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== BELL_CODES_PUZZLE_ID) return false;
		return isBellCodesSolved(state.data as unknown as BellCodesPuzzleData);
	},
};

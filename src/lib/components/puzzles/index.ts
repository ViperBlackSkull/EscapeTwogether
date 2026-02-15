/**
 * Puzzle Components - Export Index
 *
 * Re-exports all puzzle-related Svelte components for EscapeTwogether.
 * These components render puzzles visually with SVG and PNG assets.
 *
 * Generated visual assets are loaded from /static/assets/images/puzzles/
 */

// Main puzzle components
import TornPhotographsPuzzle from './TornPhotographsPuzzle.svelte';
import LoveLetterCipherPuzzle from './LoveLetterCipherPuzzle.svelte';
import TrunkLockPuzzle from './TrunkLockPuzzle.svelte';
import SecretMessagePuzzle from './SecretMessagePuzzle.svelte';
import PuzzleContainer from './PuzzleContainer.svelte';
import PuzzlePiece from './PuzzlePiece.svelte';

export {
	TornPhotographsPuzzle,
	LoveLetterCipherPuzzle,
	TrunkLockPuzzle,
	SecretMessagePuzzle,
	PuzzleContainer,
	PuzzlePiece
};

// Type exports for component props
export interface TornPhotographsPuzzleProps {
	puzzleState: import('$lib/puzzles/room1/torn-photographs').TornPhotographsState;
	playerRole: import('$lib/types').PlayerRole;
	timeElapsed?: number;
}

export interface PuzzleContainerProps {
	puzzleId: string;
	puzzleTitle?: string;
	roomTheme?: import('$lib/types').RoomId;
	description?: string;
	completed?: boolean;
	hints?: import('$lib/types').PuzzleHint[];
	currentHintTier?: number;
	timeElapsed?: number;
}

export interface PuzzlePieceProps {
	id: string;
	pieceData?: Record<string, unknown>;
	svgContent?: string | null;
	assetUrl?: string | null;
	disabled?: boolean;
	selected?: boolean;
	correct?: boolean | null;
	draggable?: boolean;
	clickable?: boolean;
	size?: { width: number; height: number };
}

export interface LoveLetterCipherPuzzleProps {
	puzzleState: import('$lib/puzzles/room1/love-letter-cipher').LoveLetterCipherState;
	playerRole: import('$lib/types').PlayerRole;
	timeElapsed?: number;
}

export interface TrunkLockPuzzleProps {
	puzzleState: import('$lib/puzzles/room1/trunk-lock').TrunkLockState;
	playerRole: import('$lib/types').PlayerRole;
	timeElapsed?: number;
}

export interface SecretMessagePuzzleProps {
	puzzleState: import('$lib/puzzles/room1/secret-message').SecretMessageState;
	playerRole: import('$lib/types').PlayerRole;
	timeElapsed?: number;
}

/**
 * Room 1 puzzle component mapping
 */
export const room1PuzzleComponents = {
	torn_photographs: 'TornPhotographsPuzzle',
	love_letter_cipher: 'LoveLetterCipherPuzzle',
	trunk_lock: 'TrunkLockPuzzle',
	secret_message: 'SecretMessagePuzzle'
} as const;

/**
 * Get puzzle component name by puzzle ID
 */
export function getPuzzleComponentName(puzzleId: string): string | undefined {
	return room1PuzzleComponents[puzzleId as keyof typeof room1PuzzleComponents];
}

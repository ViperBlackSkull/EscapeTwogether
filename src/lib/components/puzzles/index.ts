/**
 * Puzzle Components - Export Index
 *
 * Re-exports all puzzle-related Svelte components for EscapeTwogether.
 * These components render puzzles visually with SVG assets.
 */

// Main puzzle components
import TornPhotographsPuzzle from './TornPhotographsPuzzle.svelte';
import PuzzleContainer from './PuzzleContainer.svelte';
import PuzzlePiece from './PuzzlePiece.svelte';

export { TornPhotographsPuzzle, PuzzleContainer, PuzzlePiece };

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

// Puzzle 1: Torn Photographs
// Player A sees photo pieces, must describe them
// Player B has frames with corner clues, must match photos to correct frames

import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Photo piece definition
export interface PhotoPiece {
	id: string;
	position: number; // 0-8, grid position
	description: string; // What Player A sees/describes
	placed: boolean;
	correctFrame: number; // Which frame this piece belongs to (0-8)
}

// Frame definition for Player B
export interface FrameOutline {
	id: string;
	position: number; // 0-8, grid position
	cornerClue: string; // Hint text at corners
	occupied: boolean;
	occupyingPiece: string | null; // Piece ID if occupied
}

// Puzzle state
export interface TornPhotographsState {
	pieces: PhotoPiece[];
	frames: FrameOutline[];
	allPlaced: boolean;
	completed: boolean;
	lockTimer: number; // Time in ms that all pieces have been correct
}

// Photo piece data - arranged in 3x3 grid
// The completed photo shows a young grandmother (Rosalind)
const PHOTO_PIECES: Omit<PhotoPiece, 'placed'>[] = [
	{
		id: 'piece-0',
		position: 0,
		description: 'Top-left corner showing a vintage lace curtain and sunlight',
		correctFrame: 0
	},
	{
		id: 'piece-1',
		position: 1,
		description: 'Top-center showing flowing dark hair and a flower hairpin',
		correctFrame: 1
	},
	{
		id: 'piece-2',
		position: 2,
		description: 'Top-right corner with an ornate wooden picture frame edge',
		correctFrame: 2
	},
	{
		id: 'piece-3',
		position: 3,
		description: 'Middle-left showing a delicate hand holding a vintage fan',
		correctFrame: 3
	},
	{
		id: 'piece-4',
		position: 4,
		description: 'Center piece showing a young womans gentle smile, eyes full of hope',
		correctFrame: 4
	},
	{
		id: 'piece-5',
		position: 5,
		description: 'Middle-right showing a lace dress collar and pearl necklace',
		correctFrame: 5
	},
	{
		id: 'piece-6',
		position: 6,
		description: 'Bottom-left corner showing a wooden chair arm and embroidery hoop',
		correctFrame: 6
	},
	{
		id: 'piece-7',
		position: 7,
		description: 'Bottom-center showing a full skirt with floral embroidery',
		correctFrame: 7
	},
	{
		id: 'piece-8',
		position: 8,
		description: 'Bottom-right corner with a vintage rug pattern',
		correctFrame: 8
	}
];

// Frame clues for Player B - cryptic, requiring interpretation
const FRAME_CLUES: string[] = [
	'Where morning first touches the room',      // 0 - Curtains & Light (implied by position and lighting)
	'Adorned for a special evening',             // 1 - Dark Hair & Flower (implied by decoration)
	'Framed by the hands of time',               // 2 - Frame Edge (implied by boundary)
	'A gesture of gentle grace',                 // 3 - Fan & Hand (implied by movement)
	'The light that shines from within',         // 4 - Smile & Hope (implied by emotion)
	'Finery for a treasured occasion',           // 5 - Dress & Pearls (implied by adornment)
	'Skilled hands at rest',                     // 6 - Chair & Embroidery (implied by craft)
	'Nature woven into fabric',                  // 7 - Floral Skirt (implied by pattern)
	'Beneath her feet, a tapestry of home'       // 8 - Rug Pattern (implied by floor)
];

// Hints for the puzzle
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'Player A: Describe the objects and textures you see, not just their names. Player B: Interpret the poetic clues literally.',
		triggerAttempts: 3
	},
	{
		tier: 2,
		text: 'The center piece shows the person\'s face - "the light that shines from within." Corner pieces are boundaries: morning light, framing hands, skilled hands, and the tapestry below.',
		triggerAttempts: 6
	},
	{
		tier: 3,
		text: 'Match by position: Top-left needs light, Top-center needs something decorative, Top-right is a boundary. Middle row: hand gesture, face, finery. Bottom: craft, nature pattern, floor covering.',
		triggerAttempts: 10
	}
];

// Create initial state
export function createInitialState(): TornPhotographsState {
	const pieces: PhotoPiece[] = PHOTO_PIECES.map(piece => ({
		...piece,
		placed: false
	}));

	const frames: FrameOutline[] = FRAME_CLUES.map((clue, index) => ({
		id: `frame-${index}`,
		position: index,
		cornerClue: clue,
		occupied: false,
		occupyingPiece: null
	}));

	return {
		pieces,
		frames,
		allPlaced: false,
		completed: false,
		lockTimer: 0
	};
}

// Validate solution - all pieces must be in correct frames
export function validateSolution(state: PuzzleState): boolean {
	const puzzleState = state.data as unknown as TornPhotographsState;
	if (!puzzleState) return false;

	// Check if all pieces are placed in correct frames
	return puzzleState.pieces.every(piece => {
		const frame = puzzleState.frames.find(f => f.occupyingPiece === piece.id);
		return frame && frame.position === piece.correctFrame;
	});
}

// Check if all pieces are correctly placed (for lock timer)
export function checkAllCorrect(state: TornPhotographsState): boolean {
	return state.pieces.every(piece => {
		const frame = state.frames.find(f => f.occupyingPiece === piece.id);
		return frame && frame.position === piece.correctFrame;
	});
}

// Place a piece in a frame
export function placePiece(
	state: TornPhotographsState,
	pieceId: string,
	frameId: string
): TornPhotographsState {
	const piece = state.pieces.find(p => p.id === pieceId);
	const frame = state.frames.find(f => f.id === frameId);

	if (!piece || !frame) return state;

	// If frame is occupied, return the piece to unplaced
	if (frame.occupied && frame.occupyingPiece) {
		const previousPiece = state.pieces.find(p => p.id === frame.occupyingPiece);
		if (previousPiece) {
			previousPiece.placed = false;
		}
	}

	// Remove piece from any previous frame
	state.frames.forEach(f => {
		if (f.occupyingPiece === pieceId) {
			f.occupied = false;
			f.occupyingPiece = null;
		}
	});

	// Place piece in new frame
	piece.placed = true;
	frame.occupied = true;
	frame.occupyingPiece = pieceId;

	// Update allPlaced status
	state.allPlaced = state.pieces.every(p => p.placed);

	return { ...state };
}

// Update lock timer (called every tick when all pieces placed correctly)
export function updateLockTimer(
	state: TornPhotographsState,
	deltaMs: number
): TornPhotographsState {
	if (state.completed) return state;

	const allCorrect = checkAllCorrect(state);

	if (allCorrect) {
		state.lockTimer += deltaMs;

		// Lock after 3 seconds
		if (state.lockTimer >= 3000) {
			state.completed = true;
		}
	} else {
		// Reset timer if pieces become incorrect
		state.lockTimer = 0;
	}

	return { ...state };
}

// Get player-specific view
export function getPlayerView(state: TornPhotographsState, role: PlayerRole): {
	view: 'pieces' | 'frames';
	data: PhotoPiece[] | FrameOutline[];
	allPlaced: boolean;
	completed: boolean;
	lockTimer: number;
} {
	return {
		view: role === 'explorer' ? 'pieces' : 'frames',
		data: role === 'explorer' ? state.pieces : state.frames,
		allPlaced: state.allPlaced,
		completed: state.completed,
		lockTimer: state.lockTimer
	};
}

// Puzzle definition
export const TornPhotographsPuzzle: PuzzleDefinition = {
	id: ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
	roomId: 'attic',
	name: 'Torn Photographs',
	description: 'Match scattered photo pieces to their correct frames by describing what you see.',
	requiredRoles: ['explorer', 'analyst'],
	solutionValidator: validateSolution,
	hints: HINTS
};

export default TornPhotographsPuzzle;

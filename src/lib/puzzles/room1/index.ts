// Room 1 - The Attic Puzzles
// Golden hour light through dusty windows, nostalgic, warm, filled with memories.

// Export puzzle IDs first (no dependencies)
export { ROOM1_PUZZLE_IDS } from './ids';
export type { Room1PuzzleId } from './ids';

export { TornPhotographsPuzzle } from './torn-photographs';
export { MusicBoxPuzzle } from './music-box';
export { LoveLetterCipherPuzzle } from './love-letter-cipher';
export { TrunkLockPuzzle } from './trunk-lock';
export { SecretMessagePuzzle } from './secret-message';

// Re-export puzzle types and utilities
export {
	createInitialState as createTornPhotographsState,
	placePiece,
	updateLockTimer as updatePhotographLockTimer,
	getPlayerView as getTornPhotographsView
} from './torn-photographs';

export {
	createInitialState as createMusicBoxState,
	placeGear,
	getPlayerView as getMusicBoxView
} from './music-box';

export {
	createInitialState as createLoveLetterCipherState,
	toggleCandle,
	toggleUVLight,
	submitAnswer as submitLoveLetterAnswer,
	getPlayerView as getLoveLetterCipherView
} from './love-letter-cipher';

export {
	createInitialState as createTrunkLockState,
	rotateDial,
	updateLockTimer as updateTrunkLockTimer,
	getPlayerView as getTrunkLockView
} from './trunk-lock';

export {
	createInitialState as createSecretMessageState,
	examineObject,
	submitAnswer as submitSecretMessageAnswer,
	getPlayerView as getSecretMessageView,
	updatePlayerPosition
} from './secret-message';

import type { PuzzleDefinition, RoomId } from '$lib/types';
import { TornPhotographsPuzzle } from './torn-photographs';
import { MusicBoxPuzzle } from './music-box';
import { LoveLetterCipherPuzzle } from './love-letter-cipher';
import { TrunkLockPuzzle } from './trunk-lock';
import { SecretMessagePuzzle } from './secret-message';
import { ROOM1_PUZZLE_IDS } from './ids';

// Room 1 constants
export const ROOM1_ID: RoomId = 'attic';
export const ROOM1_NAME = 'The Attic';
export const ROOM1_DESCRIPTION = 'Golden hour light streams through dusty windows. This attic holds decades of memories, wrapped in the warm scent of cedar and old photographs.';
export const ROOM1_COLORS = {
	primary: '#D4A574', // warm-amber
	secondary: '#8B7355', // wood brown
	accent: '#C9A66B', // golden light
	background: '#1A1A2E' // deep navy
};

// Get all Room 1 puzzle definitions
export const room1Puzzles: PuzzleDefinition[] = [
	TornPhotographsPuzzle,
	MusicBoxPuzzle,
	LoveLetterCipherPuzzle,
	TrunkLockPuzzle,
	SecretMessagePuzzle
];

export function getRoom1PuzzleDefinitions(): PuzzleDefinition[] {
	return room1Puzzles;
}

// Room 1 metadata
export const ROOM1_METADATA = {
	id: ROOM1_ID,
	name: ROOM1_NAME,
	description: ROOM1_DESCRIPTION,
	theme: ROOM1_COLORS,
	puzzles: Object.values(ROOM1_PUZZLE_IDS)
};

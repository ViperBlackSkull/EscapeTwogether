// Room 1 - Puzzle IDs
// Centralized to avoid circular dependencies

export const ROOM1_PUZZLE_IDS = {
	TORN_PHOTOGRAPHS: 'room1-torn-photographs',
	MUSIC_BOX: 'room1-music-box',
	LOVE_LETTER_CIPHER: 'room1-love-letter-cipher',
	TRUNK_LOCK: 'room1-trunk-lock',
	SECRET_MESSAGE: 'room1-secret-message'
} as const;

export type Room1PuzzleId = typeof ROOM1_PUZZLE_IDS[keyof typeof ROOM1_PUZZLE_IDS];

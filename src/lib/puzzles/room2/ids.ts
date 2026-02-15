/**
 * Room 2 (Clock Tower) Puzzle IDs
 * Centralized puzzle identifiers for Room 2
 */

export const ROOM2_PUZZLE_IDS = {
	CLOCK_FACE: 'clock-face',
	GEAR_ALIGNMENT: 'gear-alignment',
	PENDULUM: 'pendulum',
	WINDUP_KEY: 'windup-key',
	MIDNIGHT_CHIME: 'midnight-chime',
	BELL_CODES: 'bell-codes'
} as const;

export type Room2PuzzleId = typeof ROOM2_PUZZLE_IDS[keyof typeof ROOM2_PUZZLE_IDS];

// Re-export individual puzzle IDs
export const CLOCK_FACE_PUZZLE_ID = ROOM2_PUZZLE_IDS.CLOCK_FACE;
export const GEAR_ALIGNMENT_PUZZLE_ID = ROOM2_PUZZLE_IDS.GEAR_ALIGNMENT;
export const PENDULUM_PUZZLE_ID = ROOM2_PUZZLE_IDS.PENDULUM;
export const WINDUP_KEY_PUZZLE_ID = ROOM2_PUZZLE_IDS.WINDUP_KEY;
export const MIDNIGHT_CHIME_PUZZLE_ID = ROOM2_PUZZLE_IDS.MIDNIGHT_CHIME;
export const BELL_CODES_PUZZLE_ID = ROOM2_PUZZLE_IDS.BELL_CODES;

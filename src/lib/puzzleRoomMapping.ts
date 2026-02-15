/**
 * Puzzle Room Mapping
 * Maps puzzle IDs to their respective rooms and provides room completion checking
 */

import type { RoomId } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from '$lib/puzzles/room1/ids';
import { ROOM2_PUZZLE_IDS } from '$lib/puzzles/room2/ids';
import { ROOM3_PUZZLE_IDS } from '$lib/puzzles/room3/ids';

// Puzzle ID to Room mapping
export const PUZZLE_ROOM_MAP: Record<string, RoomId> = {
	// Room 1 (Attic) puzzles
	[ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS]: 'attic',
	[ROOM1_PUZZLE_IDS.MUSIC_BOX]: 'attic',
	[ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER]: 'attic',
	[ROOM1_PUZZLE_IDS.TRUNK_LOCK]: 'attic',
	[ROOM1_PUZZLE_IDS.SECRET_MESSAGE]: 'attic',

	// Room 2 (Clock Tower) puzzles
	[ROOM2_PUZZLE_IDS.CLOCK_FACE]: 'clock_tower',
	[ROOM2_PUZZLE_IDS.GEAR_ALIGNMENT]: 'clock_tower',
	[ROOM2_PUZZLE_IDS.PENDULUM]: 'clock_tower',
	[ROOM2_PUZZLE_IDS.MIDNIGHT_CHIME]: 'clock_tower',
	[ROOM2_PUZZLE_IDS.WINDUP_KEY]: 'clock_tower',
	[ROOM2_PUZZLE_IDS.BELL_CODES]: 'clock_tower',

	// Room 3 (Garden Conservatory) puzzles
	[ROOM3_PUZZLE_IDS.SEED_PACKETS]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.LIGHT_SPECTRUM]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.WATER_FLOW]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.BLOOM_TIMING]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.HYBRIDIZATION]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.TRELLIS]: 'garden_conservatory',
	[ROOM3_PUZZLE_IDS.FINAL_BLOOM]: 'garden_conservatory'
};

// Room to Puzzle IDs mapping (reverse mapping)
export const ROOM_PUZZLE_MAP: Record<RoomId, string[]> = {
	attic: [
		ROOM1_PUZZLE_IDS.TORN_PHOTOGRAPHS,
		ROOM1_PUZZLE_IDS.MUSIC_BOX,
		ROOM1_PUZZLE_IDS.LOVE_LETTER_CIPHER,
		ROOM1_PUZZLE_IDS.TRUNK_LOCK,
		ROOM1_PUZZLE_IDS.SECRET_MESSAGE
	],
	clock_tower: [
		ROOM2_PUZZLE_IDS.CLOCK_FACE,
		ROOM2_PUZZLE_IDS.GEAR_ALIGNMENT,
		ROOM2_PUZZLE_IDS.PENDULUM,
		ROOM2_PUZZLE_IDS.MIDNIGHT_CHIME,
		ROOM2_PUZZLE_IDS.WINDUP_KEY,
		ROOM2_PUZZLE_IDS.BELL_CODES
	],
	garden_conservatory: [
		ROOM3_PUZZLE_IDS.SEED_PACKETS,
		ROOM3_PUZZLE_IDS.LIGHT_SPECTRUM,
		ROOM3_PUZZLE_IDS.WATER_FLOW,
		ROOM3_PUZZLE_IDS.BLOOM_TIMING,
		ROOM3_PUZZLE_IDS.HYBRIDIZATION,
		ROOM3_PUZZLE_IDS.TRELLIS,
		ROOM3_PUZZLE_IDS.FINAL_BLOOM
	]
};

/**
 * Get the room ID for a given puzzle ID
 */
export function getPuzzleRoom(puzzleId: string): RoomId | null {
	return PUZZLE_ROOM_MAP[puzzleId] || null;
}

/**
 * Get all puzzle IDs for a given room
 */
export function getRoomPuzzleIds(roomId: RoomId): string[] {
	return ROOM_PUZZLE_MAP[roomId] || [];
}

/**
 * Check if a puzzle belongs to a specific room
 */
export function isPuzzleInRoom(puzzleId: string, roomId: RoomId): boolean {
	const puzzleRoom = getPuzzleRoom(puzzleId);
	return puzzleRoom === roomId;
}

/**
 * Get the next room in the sequence
 */
export function getNextRoom(currentRoom: RoomId): RoomId | null {
	const roomOrder: RoomId[] = ['attic', 'clock_tower', 'garden_conservatory'];
	const currentIndex = roomOrder.indexOf(currentRoom);

	if (currentIndex >= 0 && currentIndex < roomOrder.length - 1) {
		return roomOrder[currentIndex + 1];
	}

	return null;
}

/**
 * Check if all puzzles in a room are solved
 */
export function isRoomComplete(
	roomId: RoomId,
	puzzleStates: Record<string, { solved: boolean }>
): boolean {
	const roomPuzzles = getRoomPuzzleIds(roomId);

	return roomPuzzles.every(puzzleId =>
		puzzleStates[puzzleId]?.solved === true
	);
}

/**
 * Get progress for a specific room
 */
export function getRoomProgress(
	roomId: RoomId,
	puzzleStates: Record<string, { solved: boolean }>
): { solved: number; total: number } {
	const roomPuzzles = getRoomPuzzleIds(roomId);
	const solved = roomPuzzles.filter(puzzleId =>
		puzzleStates[puzzleId]?.solved === true
	).length;

	return {
		solved,
		total: roomPuzzles.length
	};
}

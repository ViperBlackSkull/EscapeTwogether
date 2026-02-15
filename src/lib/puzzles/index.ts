/**
 * EscapeTwogether Puzzles
 * All puzzle definitions and utilities for the three rooms
 */

import type { PuzzleDefinition, RoomId } from '$lib/types';

// Re-export PuzzleRenderer and related types
export { PuzzleRenderer, ANIMATION_PRESETS } from './PuzzleRenderer';
export type {
	PuzzlePiece,
	PuzzleAsset,
	AnimationConfig,
	HighlightConfig,
	PuzzleRendererOptions
} from './PuzzleRenderer';

// Re-export Room 1 (The Attic) puzzles
export { room1Puzzles, ROOM1_ID, ROOM1_NAME, ROOM1_DESCRIPTION, ROOM1_COLORS } from './room1';
export type * from './room1';

// Re-export Room 2 (Clock Tower) puzzles
export { room2Puzzles, ROOM2_ID, ROOM2_NAME, ROOM2_DESCRIPTION, ROOM2_COLORS } from './room2';
export type * from './room2';

// Re-export Room 3 (Garden Conservatory) puzzles
export {
	room3Puzzles,
	ROOM3_ID,
	ROOM3_NAME,
	ROOM3_DESCRIPTION,
	ROOM3_COLORS,
	ROOM3_SOUNDS
} from './room3';
export type * from './room3';

// Import for combined exports
import { room1Puzzles, ROOM1_ID, ROOM1_NAME, ROOM1_DESCRIPTION } from './room1';
import { room2Puzzles, ROOM2_ID, ROOM2_NAME, ROOM2_DESCRIPTION } from './room2';
import { room3Puzzles, ROOM3_ID, ROOM3_NAME, ROOM3_DESCRIPTION } from './room3';

// All puzzles combined
export const allPuzzles: PuzzleDefinition[] = [
	...room1Puzzles,
	...room2Puzzles,
	...room3Puzzles
];

// Room metadata
export const rooms: Array<{
	id: RoomId;
	name: string;
	description: string;
	puzzleCount: number;
	puzzleIds: string[];
}> = [
	{
		id: ROOM1_ID,
		name: ROOM1_NAME,
		description: ROOM1_DESCRIPTION,
		puzzleCount: room1Puzzles.length,
		puzzleIds: room1Puzzles.map(p => p.id)
	},
	{
		id: ROOM2_ID,
		name: ROOM2_NAME,
		description: ROOM2_DESCRIPTION,
		puzzleCount: room2Puzzles.length,
		puzzleIds: room2Puzzles.map(p => p.id)
	},
	{
		id: ROOM3_ID,
		name: ROOM3_NAME,
		description: ROOM3_DESCRIPTION,
		puzzleCount: room3Puzzles.length,
		puzzleIds: room3Puzzles.map(p => p.id)
	}
];

// Get puzzle by ID
export function getPuzzleById(puzzleId: string): PuzzleDefinition | undefined {
	return allPuzzles.find(p => p.id === puzzleId);
}

// Get puzzles by room
export function getPuzzlesByRoom(roomId: RoomId): PuzzleDefinition[] {
	switch (roomId) {
		case 'attic':
			return room1Puzzles;
		case 'clock_tower':
			return room2Puzzles;
		case 'garden_conservatory':
			return room3Puzzles;
		default:
			return [];
	}
}

// Get room info by ID
export function getRoomById(roomId: RoomId) {
	return rooms.find(r => r.id === roomId);
}

// Puzzle order within each room
export const PUZZLE_ORDER: Record<RoomId, string[]> = {
	attic: room1Puzzles.map(p => p.id),
	clock_tower: room2Puzzles.map(p => p.id),
	garden_conservatory: room3Puzzles.map(p => p.id)
};

// Total puzzle count
export const TOTAL_PUZZLES = allPuzzles.length;

export default allPuzzles;

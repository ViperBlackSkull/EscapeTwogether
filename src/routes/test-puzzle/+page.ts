/**
 * Puzzle Test Page Data Loader
 * Loads all puzzle definitions for the test page
 */

import { allPuzzles, rooms } from '$lib/puzzles';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Organize puzzles by room
	const puzzlesByRoom = rooms.map(room => ({
		...room,
		puzzles: allPuzzles.filter(p => p.roomId === room.id)
	}));

	return {
		rooms: puzzlesByRoom,
		allPuzzles,
		totalPuzzles: allPuzzles.length
	};
};

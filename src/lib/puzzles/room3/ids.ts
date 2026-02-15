/**
 * Room 3 (Garden Conservatory) Puzzle IDs
 * Centralized puzzle identifiers for Room 3
 */

export const ROOM3_PUZZLE_IDS = {
	SEED_PACKETS: 'seed-packets',
	LIGHT_SPECTRUM: 'light-spectrum',
	WATER_FLOW: 'water-flow',
	BLOOM_TIMING: 'bloom-timing',
	HYBRIDIZATION: 'hybridization',
	TRELLIS: 'trellis',
	FINAL_BLOOM: 'final-bloom'
} as const;

export type Room3PuzzleId = typeof ROOM3_PUZZLE_IDS[keyof typeof ROOM3_PUZZLE_IDS];

// Re-export individual puzzle IDs
export const SEED_PACKETS_PUZZLE_ID = ROOM3_PUZZLE_IDS.SEED_PACKETS;
export const LIGHT_SPECTRUM_PUZZLE_ID = ROOM3_PUZZLE_IDS.LIGHT_SPECTRUM;
export const WATER_FLOW_PUZZLE_ID = ROOM3_PUZZLE_IDS.WATER_FLOW;
export const BLOOM_TIMING_PUZZLE_ID = ROOM3_PUZZLE_IDS.BLOOM_TIMING;
export const HYBRIDIZATION_PUZZLE_ID = ROOM3_PUZZLE_IDS.HYBRIDIZATION;
export const TRELLIS_PUZZLE_ID = ROOM3_PUZZLE_IDS.TRELLIS;
export const FINAL_BLOOM_PUZZLE_ID = ROOM3_PUZZLE_IDS.FINAL_BLOOM;

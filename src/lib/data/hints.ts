/**
 * EscapeTwogether - Hint System
 *
 * Progressive hints for all 18 puzzles across 3 rooms.
 * Each puzzle has 3 hint tiers that unlock based on failed attempts:
 * - Tier 1 (2+ attempts): Gentle nudge
 * - Tier 2 (4+ attempts): Specific guidance
 * - Tier 3 (6+ attempts): Near-solution
 *
 * Story Theme: Estranged siblings Lily and James, separated by a family curse 25 years ago,
 * must work together to break the spell binding Blackwood Manor. Their grandmother's love
 * letters to their grandfather hold the key - puzzles reveal pieces of their story.
 */

import type { PuzzleHint } from '$lib/types';

// ============================================
// ROOM 1: THE ATTIC - "Memories of the Past"
// ============================================

/**
 * Puzzle 1: Torn Photographs
 * Two players must work together to reconstruct torn photographs.
 */
export const TORN_PHOTOGRAPHS_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Have you tried dragging pieces to your side of the photo? Some pieces might be on your partner's side.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Each photograph has a unique subject - look for matching colors and patterns. Corner pieces have straight edges on two sides.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Photograph 1: A couple at a fountain. Photograph 2: A wedding day. Photograph 3: Holding a baby. Complete all three to reveal the next puzzle.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 2: Music Box
 * Arrange gears to play the correct melody.
 */
export const MUSIC_BOX_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The gears need to connect in a specific pattern. Try placing larger gears first.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Each gear size corresponds to a note. Small gears = high notes, large gears = low notes. The melody is 'True Love'.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Arrange gears from largest to smallest: left to right, then top to bottom. This plays the melody that opens the secret compartment.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 3: Love Letter Cipher
 * Use UV light to reveal hidden messages.
 */
export const LOVE_LETTER_CIPHER_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The letters seem ordinary, but there might be hidden writing. Try using the UV light on different parts of the paper.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Hidden messages appear between the lines. The first letter reveals a date: 'June 15, 1947'. This is their wedding anniversary.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The UV light reveals 'Look beneath' on the third letter. This clue points to the trunk lock combination: 6-15-47.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 4: Trunk Lock
 * Enter the correct combination from gathered clues.
 */
export const TRUNK_LOCK_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The combination is hidden somewhere in this room. Review what you've discovered.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The love letters held a secret date. The UV light revealed 'June 15, 1947'. Convert this to numbers.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The combination is 6-15-47 (month-day-year). This was your grandparents' wedding day - the key to breaking the curse.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 5: Secret Message
 * Examine objects to find the hidden message.
 */
export const SECRET_MESSAGE_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Some objects in the attic can be examined more closely. Try clicking on different items.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The mirror, painting, and jewelry box each reveal part of a message. 'Together... at midnight... clock tower...'",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The complete message reads: 'Together at midnight in the clock tower, you'll find what you seek. Time is running out.' This leads to Room 2.",
		triggerAttempts: 6
	}
];

// ============================================
// ROOM 2: THE CLOCK TOWER - "Time & Destiny"
// ============================================

/**
 * Puzzle 6: Pendulum Puzzle
 * Coordinate timing to guide a ball through obstacles.
 */
export const PENDULUM_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Communication is key. One player controls the pendulum's speed, the other its direction.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The pendulum has a rhythm. Time your movements when it swings toward the goal. Slow movements are more precise.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Guide the ball through the maze by alternating swing speeds. The path: start slow, accelerate at the second obstacle, then reverse direction for the final stretch.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 7: Gear Alignment
 * Work together to align gears in the clock mechanism.
 */
export const GEAR_ALIGNMENT_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The gears need to form a connected chain. Try rotating them to find matching teeth patterns.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Each gear has a marker dot. Align all dots in a spiral pattern starting from the center gear.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The alignment pattern: center gear points up, then rotate clockwise: right, down, left. This powers the clock's hands.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 8: Bell Codes
 * Decode and reproduce bell patterns using Morse code.
 */
export const BELL_CODES_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The telegraph key can tap out patterns. Listen carefully to the bell sequences.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "This is Morse code. Short taps = dots, long holds = dashes. The first sequence is: ••• (S).",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The full message spells 'STAR': ••• (S) − (T) •− (A) ••− (R). Your grandmother's name was Stella - meaning 'star'.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 9: Clock Face
 * Solve the time-based riddle by setting clock hands.
 */
export const CLOCK_FACE_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The riddle mentions a specific time. Read it carefully and set both hands accordingly.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "'When the hour hand points to twelve and the minute hand chases its tail' - this describes midnight (12:00).",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Set the clock to exactly midnight. This is when the curse began - and when it can be broken. The hour hand on 12, minute hand on 12.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 10: Windup Key
 * Coordinate to wind the clock mechanism simultaneously.
 */
export const WINDUP_KEY_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Both players must wind their keys together. Try to match your turning speed.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The keys must turn in opposite directions. One clockwise, one counterclockwise. Match your rhythm.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Wind at a steady pace: click, click, click. Keep both keys moving for 10 seconds to fully wind the mechanism. This activates the midnight chime.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 11: Midnight Chime
 * Reproduce the bell melody that unlocks the garden.
 */
export const MIDNIGHT_CHIME_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Listen to the bell pattern, then recreate it. Each bell has a unique note.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The melody has 8 notes: High, Low, High, High, Low, High, Low, Low. Try playing them in sequence.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The notes correspond to: E-C-E-E-D-E-D-D (Edelweiss). This was your grandparents' favorite song. Playing it opens the garden path.",
		triggerAttempts: 6
	}
];

// ============================================
// ROOM 3: THE GARDEN CONSERVATORY - "Growth & Renewal"
// ============================================

/**
 * Puzzle 12: Seed Packets
 * Match seeds to their growing conditions.
 */
export const SEED_PACKETS_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Each seed has specific needs. Read the descriptions carefully and match them to conditions.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Morning Glory needs dawn light, Moonflower needs night shade. Match seeds to the time of day they bloom.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Correct matches: Morning Glory-dawn, Rose-midday, Moonflower-dusk, Lily-moonlight. These flowers bloom across a full day cycle.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 13: Water Flow
 * Adjust water valves to reach the right temperature.
 */
export const WATER_FLOW_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The plants need warm water, not too hot or cold. Adjust the valves gradually.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Start with the cold valve at 50%, then slowly increase hot water until the temperature reads 72°F.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "The perfect temperature is 72°F - lukewarm like a summer rain. Cold valve: 40%, Hot valve: 60%. This nourishes the love lily seeds.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 14: Light Spectrum
 * Combine colored lights to match flower needs.
 */
export const LIGHT_SPECTRUM_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Different flowers need different light colors. Rotate prisms to split the light spectrum.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Mix colors: Red + Blue = Purple light, Yellow + Blue = Green. Each flower has a preferred spectrum.",
		triggerAttempts: 4
	},
	{
		tier: 3,
	:text: "Rose needs Red, Lily needs Blue, Orchid needs Purple (Red+Blue), Fern needs Green (Yellow+Blue). This creates a rainbow of growth.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 15: Hybridization
 * Cross-breed plants to create the target offspring.
 */
export const HYBRIDIZATION_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Plant genetics work like puzzles. Cross two parents to create a new combination.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Each parent passes one trait. To get a red flower with thorns, cross a red plant with a thorny plant.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Target: 'Love Lily' (Red, fragrant, thorny). Cross: Red Rose × Fragrant Lily = Red Fragrant Lily. Then cross with Thorny Rose for final traits.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 16: Trellis
// Guide vines to grow in specific patterns.
 */
export const TRELLIS_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Vines grow toward light and support. Plan your path carefully before growing.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "The trellis has three levels. Guide vines upward by selecting adjacent cells. The pattern spells a heart shape.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Grow vines in this pattern: bottom corners → center → top center. This forms a heart, the symbol of enduring love.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 17: Bloom Timing
// Coordinate to touch flowers simultaneously.
 */
export const BLOOM_TIMING_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "These flowers bloom when touched together. Count down and touch at the same moment.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Use voice chat or the countdown feature. Both players must touch within 1 second of each other.",
		triggerAttempts: 4
	},
	{
		tier: 3,
	:text: "Touch your assigned flower when the countdown reaches zero. The center bloom will open, revealing the final seed: the Love Lily.",
		triggerAttempts: 6
	}
];

/**
 * Puzzle 18: Final Bloom
 * Complete the final ceremony to break the curse.
 */
export const FINAL_BLOOM_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The Love Lily needs all elements to bloom. Follow the stages: seed, water, light, pollination.",
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: "Plant the seed, water at 72°F, provide purple light, then pollinate with the Rose. Both players must touch the bloom together.",
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: "Complete all stages in order, then both touch the blooming flower simultaneously. This breaks the curse and reunites Lily and James forever.",
		triggerAttempts: 6
	}
];

// ============================================
// HINTS ORGANIZED BY PUZZLE ID
// ============================================

export const PUZZLE_HINTS: Record<string, PuzzleHint[]> = {
	'room1-torn-photographs': TORN_PHOTOGRAPHS_HINTS,
	'room1-music-box': MUSIC_BOX_HINTS,
	'room1-love-letter-cipher': LOVE_LETTER_CIPHER_HINTS,
	'room1-trunk-lock': TRUNK_LOCK_HINTS,
	'room1-secret-message': SECRET_MESSAGE_HINTS,

	'room2_pendulum': PENDULUM_HINTS,
	'room2_gear_alignment': GEAR_ALIGNMENT_HINTS,
	'room2_bell_codes': BELL_CODES_HINTS,
	'room2_clock_face': CLOCK_FACE_HINTS,
	'room2_windup_key': WINDUP_KEY_HINTS,
	'room2_midnight_chime': MIDNIGHT_CHIME_HINTS,

	'seed-packets': SEED_PACKETS_HINTS,
	'water-flow': WATER_FLOW_HINTS,
	'light-spectrum': LIGHT_SPECTRUM_HINTS,
	'hybridization': HYBRIDIZATION_HINTS,
	'trellis': TRELLIS_HINTS,
	'bloom-timing': BLOOM_TIMING_HINTS,
	'final-bloom': FINAL_BLOOM_HINTS
};

/**
 * Get hints for a specific puzzle
 */
export function getHintsForPuzzle(puzzleId: string): PuzzleHint[] {
	return PUZZLE_HINTS[puzzleId] || [];
}

/**
 * Get the next available hint tier based on attempts
 */
export function getNextHintTier(puzzleId: string, attempts: number): number {
	const hints = getHintsForPuzzle(puzzleId);
	for (const hint of hints) {
		if (attempts >= hint.triggerAttempts) {
			return hint.tier;
		}
	}
	return 0;
}

/**
 * Get a specific hint tier for a puzzle
 */
export function getHintAtTier(puzzleId: string, tier: number): PuzzleHint | null {
	const hints = getHintsForPuzzle(puzzleId);
	return hints.find(h => h.tier === tier) || null;
}

/**
 * Calculate time penalty for using hints
 * Each hint tier adds a 2-minute penalty
 */
export function calculateHintPenalty(hintsUsed: number): number {
	return hintsUsed * 2; // 2 minutes per hint
}

/**
 * Check if a hint tier is available based on attempts
 */
export function isHintTierAvailable(puzzleId: string, tier: number, attempts: number): boolean {
	const hint = getHintAtTier(puzzleId, tier);
	return hint ? attempts >= hint.triggerAttempts : false;
}

// ============================================
// PUZZLE COMPLETION NARRATIVE SNIPPETS
// Short text displayed when each puzzle is solved
// ============================================

export const PUZZLE_COMPLETION_NARRATIVES: Record<string, string> = {
	// Room 1
	'room1-torn-photographs': "The reconstructed photos show your grandparents at different stages of life - their meeting, wedding, and the birth of your father. Love preserved in paper and ink.",
	'room1-music-box': "The melody fills the attic - 'True Love,' the song your grandfather composed for your grandmother. The music box opens, revealing the next clue.",
	'room1-love-letter-cipher': "The UV light exposes your grandmother's hidden messages. Her devotion to grandfather radiates from every line. The date 6-15-47 appears repeatedly.",
	'room1-trunk-lock': "The trunk clicks open. Inside: photographs, letters, and a silver locket. The curse weakens as you uncover your family's story of forbidden love.",
	'room1-secret-message': "The message is complete: 'Together at midnight in the clock tower, you'll find what you seek.' The path forward is clear - but time grows short.",

	// Room 2
	'room2_pendulum': "The pendulum settles, and a hidden door slides open. Your coordination improves as the bond between you strengthens.",
	'room2_gear_alignment': "All gears align perfectly. The clock mechanism hums to life, and the hands move forward - toward midnight.",
	'room2_bell_codes': "The bells ring clearly: S-T-A-R. Your grandmother's name was Stella. She was the guiding star of your family.",
	'room2_clock_face': "The clock strikes 11:55. Five minutes remain until midnight. The final hour of the curse approaches.",
	'room2_windup_key': "The clock mechanism winds smoothly. Power flows through the tower. The final chime sequence unlocks.",
	'room2_midnight_chime': "'Edelweiss' echoes through the tower. The midnight chime activates, and the garden path opens. The final test awaits.",

	// Room 3
	'seed-packets': "The seeds respond to your touch. Each represents a virtue of love: patience (Morning Glory), passion (Rose), mystery (Moonflower), purity (Lily).",
	'water-flow': "The water flows at the perfect temperature. The love lily seeds begin to sprout. Nurtured by cooperation, they grow strong.",
	'light-spectrum': "The prism splits light into a rainbow. Each color finds its flower, creating a spectrum of growth. Your grandparents' genius amazes you.",
	'hybridization': "The Love Lily hybrid forms! Red as passion, fragrant as devotion, thorny as determination. A flower born of love and persistence.",
	'trellis': "The vines grow in a perfect heart shape. Woven together by your care, they symbolize the bond that can never be broken.",
	'bloom-timing': "The flowers bloom simultaneously! The Love Lily emerges, its petals glowing with magic. The final moment approaches.",
	'final-bloom': "The Love Lily blooms fully as your fingers touch. The curse shatters! You see each other clearly for the first time in 25 years. You are free - and together forever."
};

/**
 * Get completion narrative for a puzzle
 */
export function getCompletionNarrative(puzzleId: string): string {
	return PUZZLE_COMPLETION_NARRATIVES[puzzleId] || "Another piece of the puzzle falls into place...";
}

export default PUZZLE_HINTS;

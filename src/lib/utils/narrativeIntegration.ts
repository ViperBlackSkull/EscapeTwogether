/**
 * Narrative Integration Utility
 *
 * Helps integrate narrative triggers into the game flow.
 * Works with the StoryNarrative component to show story moments.
 */

import type { RoomId } from '$lib/types';
import { getCompletionNarrative } from '$lib/data/hints';

// ============================================
// NARRATIVE TRIGGER TYPES
// ============================================

export type NarrativeTrigger =
	| 'room_enter'
	| 'puzzle_start'
	| 'puzzle_complete'
	| 'room_complete'
	| 'game_complete'
	| 'discovery';

export interface NarrativeEvent {
	type: NarrativeTrigger;
	roomId: RoomId;
	puzzleId?: string;
	customText?: string;
	timestamp: number;
}

// ============================================
// NARRATIVE CONTENT MAPPING
// ============================================

const ROOM_INTRO_NARRATIVES: Record<RoomId, string> => {
	attic: "Twenty-five years have passed since you last saw each other. Lily, you were just a child when James was sent away. Now, a mysterious letter has brought you both back to Blackwood Manor. The family curse that separated you can only be broken by working together. Your grandmother's trunk in this attic holds the first clues...",

	clock_tower: "The clock tower stands frozen at 11:47 - thirteen minutes before midnight, the moment the curse took hold. Your grandparents built this tower as a testament to their love, hiding its secrets in the intricate mechanism. The gears await your touch, siblings bound by blood and magic.",

	garden_conservatory: "Dawn breaks as you enter the conservatory, where your grandparents created their masterpiece - a garden of hybrid flowers, each one a symbol of their enduring love. The Love Lily at its center blooms only when two souls, torn apart by darkness, work together to nurture it back to life."
};

const ROOM_COMPLETION_NARRATIVES: Record<RoomId, string> => {
	attic: "The trunk opens, revealing a silver locket and a cryptic message: 'Together at midnight in the clock tower, you'll find what you seek. Time is running out.' The bond between you strengthens as you feel the curse's grip loosening, just slightly.",

	clock_tower: "At the stroke of midnight, the tower comes alive. The melody you've played - 'Edelweiss,' their wedding song - echoes through the night. A hidden passage opens, leading to the garden conservatory where the final test awaits.",

	garden_conservatory: "The Love Lily blooms in brilliant crimson and gold as your fingers touch its petals simultaneously. The curse shatters like glass, and for the first time in 25 years, you see each other clearly. The manor's shadows lift. You are free - and together."
};

const DISCOVERY_NARRATIVES: Record<string, string> = {
	'room1-love-letter-cipher': "The UV light exposes your grandmother's hidden messages. Her devotion to grandfather radiates from every line. The date 6-15-47 appears repeatedly - their wedding day.",

	'room2_bell_codes': "The bells ring clearly: S-T-A-R. Your grandmother's name was Stella. She was the guiding star of your family, leading them through darkness with love.",

	'room3-hybridization': "The Love Lily hybrid forms! Red as passion, fragrant as devotion, thorny as determination. A flower born of love and persistence, just like the bond that connects you."
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get narrative text for a specific trigger event
 */
export function getNarrativeForEvent(event: NarrativeEvent): string {
	switch (event.type) {
		case 'room_enter':
			return ROOM_INTRO_NARRATIVES[event.roomId] || '';

		case 'room_complete':
			return ROOM_COMPLETION_NARRATIVES[event.roomId] || '';

		case 'puzzle_complete':
			if (event.puzzleId) {
				const completionText = getCompletionNarrative(event.puzzleId);
				const discoveryText = DISCOVERY_NARRATIVES[event.puzzleId];
				return discoveryText || completionText;
			}
			return 'Another piece of the puzzle falls into place...';

		case 'discovery':
			if (event.puzzleId && DISCOVERY_NARRATIVES[event.puzzleId]) {
				return DISCOVERY_NARRATIVES[event.puzzleId];
			}
			return '';

		case 'game_complete':
			return "The Love Lily blooms fully as your fingers touch. The curse shatters! You see each other clearly for the first time in 25 years. You are free - and together forever. The story of Blackwood Manor ends not in tragedy, but in love renewed.";

		default:
			return '';
	}
}

/**
 * Check if a narrative should be triggered for an event
 */
export function shouldTriggerNarrative(event: NarrativeEvent): boolean {
	// Always trigger room enters and completions
	if (event.type === 'room_enter' || event.type === 'room_complete' || event.type === 'game_complete') {
		return true;
	}

	// Only trigger puzzle completion narratives if a puzzle ID is provided
	if (event.type === 'puzzle_complete' || event.type === 'discovery') {
		return !!event.puzzleId;
	}

	return false;
}

/**
 * Get the narrative type for the StoryNarrative component
 */
export function getNarrativeType(trigger: NarrativeTrigger): 'intro' | 'discovery' | 'completion' {
	switch (trigger) {
		case 'room_enter':
		case 'puzzle_start':
			return 'intro';
		case 'discovery':
			return 'discovery';
		case 'puzzle_complete':
		case 'room_complete':
		case 'game_complete':
			return 'completion';
		default:
			return 'intro';
	}
}

/**
 * Create a narrative event object
 */
export function createNarrativeEvent(
	type: NarrativeTrigger,
	roomId: RoomId,
	puzzleId?: string,
	customText?: string
): NarrativeEvent {
	return {
		type,
		roomId,
		puzzleId,
		customText,
		timestamp: Date.now()
	};
}

/**
 * Get key story moments in the game
 * Useful for testing or debugging narrative flow
 */
export function getKeyStoryMoments(): NarrativeEvent[] {
	return [
		createNarrativeEvent('room_enter', 'attic'),
		createNarrativeEvent('discovery', 'attic', 'room1-love-letter-cipher'),
		createNarrativeEvent('room_complete', 'attic'),
		createNarrativeEvent('room_enter', 'clock_tower'),
		createNarrativeEvent('discovery', 'clock_tower', 'room2_bell_codes'),
		createNarrativeEvent('room_complete', 'clock_tower'),
		createNarrativeEvent('room_enter', 'garden_conservatory'),
		createNarrativeEvent('discovery', 'garden_conservatory', 'hybridization'),
		createNarrativeEvent('game_complete', 'garden_conservatory')
	];
}

export default {
	getNarrativeForEvent,
	shouldTriggerNarrative,
	getNarrativeType,
	createNarrativeEvent,
	getKeyStoryMoments
};

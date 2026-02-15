/**
 * Clock Face Puzzle (Room 2, Puzzle 4)
 *
 * A perspective puzzle where players see different parts of the same clock.
 * Player A sees the hour hand position only
 * Player B sees the minute hand position only
 * Both must communicate to determine the true time: 12:00 (midnight)
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';
import { puzzleImages } from '$lib/assets/images';

export const CLOCK_FACE_PUZZLE_ID = 'room2_clock_face';

// Visual assets for this puzzle
export const CLOCK_FACE_ASSETS = {
	// Compass for clock face visual
	clockFace: puzzleImages.compass,

	// Hourglass for time theme
	hourglass: puzzleImages.hourglass,

	// Cipher wheel can be used for clock hand rotation visual
	handRotation: puzzleImages.cipherWheel,

	// Ornate frame for clock
	ornateFrame: puzzleImages.victorianOrnament,

	// Background texture
	background: puzzleImages.puzzleTexture,

	// Decorative candle for lighting atmosphere
	candlelight: puzzleImages.candleHolder
} as const;

export interface ClockTime {
	hours: number; // 0-11 or 0-23
	minutes: number; // 0-59
}

export interface ClockFacePuzzleData {
	// Player A's view - sees hour hand position relative to a marker
	playerAView: {
		hourHandAngle: number; // Degrees from 12 o'clock
		hintText: string;
	};

	// Player B's view - sees minute hand position relative to a marker
	playerBView: {
		minuteHandAngle: number; // Degrees from 12 o'clock
		hintText: string;
	};

	// Player inputs
	playerAInput: ClockTime | null;
	playerBInput: ClockTime | null;

	// Correct answer (both must enter this)
	correctTime: ClockTime;

	// Both players must submit correctly
	playerASubmitted: boolean;
	playerBSubmitted: boolean;
	playerACorrect: boolean;
	playerBCorrect: boolean;

	// Completion
	puzzleComplete: boolean;
}

export interface ClockFacePuzzleState extends PuzzleState {
	puzzleId: typeof CLOCK_FACE_PUZZLE_ID;
	data: ClockFacePuzzleData;
}

export function createInitialClockFaceState(): ClockFacePuzzleData {
	// The puzzle: Both hands point to 12 (midnight)
	// Player A sees the hour hand pointing straight up (0 degrees)
	// Player B sees the minute hand also pointing straight up (0 degrees)
	// But they see it from different angles around the clock face

	// Player A sees: "The hour hand points directly at the star marker on the rim"
	// Player B sees: "The minute hand points directly at the star marker on the rim"
	// The star marker is at 12 o'clock position on the actual clock

	// The twist: Each player sees a DIFFERENT marker that looks like it could be 12 o'clock
	// Player A's reference marker is at actual 12 o'clock
	// Player B's reference marker is ALSO at actual 12 o'clock (same marker)
	// So when both say "the hand points at my marker", they're saying the same thing

	return {
		playerAView: {
			hourHandAngle: 0, // Hour hand at 12
			hintText: 'The short hand points directly at the star etched on the glass rim.'
		},
		playerBView: {
			minuteHandAngle: 0, // Minute hand at 12
			hintText: 'The long hand points directly at the star etched on the glass rim.'
		},
		playerAInput: null,
		playerBInput: null,
		correctTime: { hours: 12, minutes: 0 }, // Midnight
		playerASubmitted: false,
		playerBSubmitted: false,
		playerACorrect: false,
		playerBCorrect: false,
		puzzleComplete: false,
	};
}

// Set player input
export function setPlayerTimeInput(
	data: ClockFacePuzzleData,
	player: 'A' | 'B',
	time: ClockTime
): ClockFacePuzzleData {
	if (player === 'A') {
		return {
			...data,
			playerAInput: time,
		};
	} else {
		return {
			...data,
			playerBInput: time,
		};
	}
}

// Check if a time matches the correct time
function isCorrectTime(input: ClockTime | null, correct: ClockTime): boolean {
	if (!input) return false;

	// Normalize hours (12 and 0 should both be valid for midnight)
	const normalizeHours = (h: number) => h === 0 ? 12 : h;
	const inputHours = normalizeHours(input.hours);
	const correctHours = normalizeHours(correct.hours);

	return inputHours === correctHours && input.minutes === correct.minutes;
}

// Submit player's answer
export function submitPlayerAnswer(
	data: ClockFacePuzzleData,
	player: 'A' | 'B'
): ClockFacePuzzleData {
	const input = player === 'A' ? data.playerAInput : data.playerBInput;
	const isCorrect = isCorrectTime(input, data.correctTime);

	if (player === 'A') {
		const newState = {
			...data,
			playerASubmitted: true,
			playerACorrect: isCorrect,
		};
		return checkCompletion(newState);
	} else {
		const newState = {
			...data,
			playerBSubmitted: true,
			playerBCorrect: isCorrect,
		};
		return checkCompletion(newState);
	}
}

// Check if puzzle is complete (both players submitted correct answers)
function checkCompletion(data: ClockFacePuzzleData): ClockFacePuzzleData {
	const complete = data.playerASubmitted && data.playerBSubmitted &&
		data.playerACorrect && data.playerBCorrect;

	return {
		...data,
		puzzleComplete: complete,
	};
}

// Check if puzzle is solved
export function isClockFaceSolved(data: ClockFacePuzzleData): boolean {
	return data.puzzleComplete;
}

// Reset puzzle
export function resetClockFacePuzzle(): ClockFacePuzzleData {
	return createInitialClockFaceState();
}

// Calculate hour hand angle (hours + minutes contribution)
export function getHourHandAngle(time: ClockTime): number {
	// Hour hand moves 30 degrees per hour, plus 0.5 degrees per minute
	return ((time.hours % 12) * 30) + (time.minutes * 0.5);
}

// Calculate minute hand angle
export function getMinuteHandAngle(time: ClockTime): number {
	// Minute hand moves 6 degrees per minute
	return time.minutes * 6;
}

// Hints
export const CLOCK_FACE_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "One player sees the hour hand's position, the other sees the minute hand's position. You each see only part of the clock - share what you observe!",
		triggerAttempts: 2,
	},
	{
		tier: 2,
		text: "Both hands are pointing at markers on the clock rim. If both players see their hand pointing at 'the star marker', what does that tell you about where both hands are pointing?",
		triggerAttempts: 4,
	},
	{
		tier: 3,
		text: "Both the hour hand AND the minute hand point to the same position - straight up at 12 o'clock. When both hands point to 12, what time is it?",
		triggerAttempts: 6,
	},
];

// Role-based view data
export function getClockFaceViewData(role: PlayerRole, data: ClockFacePuzzleData): Record<string, unknown> {
	const baseData = {
		playerASubmitted: data.playerASubmitted,
		playerBSubmitted: data.playerBSubmitted,
		playerACorrect: data.playerACorrect,
		playerBCorrect: data.playerBCorrect,
		puzzleComplete: data.puzzleComplete,
	};

	if (role === 'explorer') {
		// Player A sees the hour hand and its hint
		return {
			...baseData,
			myView: data.playerAView,
			myInput: data.playerAInput,
			handType: 'hour',
			handAngle: data.playerAView.hourHandAngle,
			hintText: data.playerAView.hintText,
			partnerSees: 'the minute hand position',
		};
	} else {
		// Player B sees the minute hand and its hint
		return {
			...baseData,
			myView: data.playerBView,
			myInput: data.playerBInput,
			handType: 'minute',
			handAngle: data.playerBView.minuteHandAngle,
			hintText: data.playerBView.hintText,
			partnerSees: 'the hour hand position',
		};
	}
}

// Export puzzle definition
export const clockFacePuzzleDefinition = {
	id: CLOCK_FACE_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Clock Face',
	description: 'Determine the true time - one player sees the hour hand, the other sees the minute hand. Share your observations!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: CLOCK_FACE_HINTS,
	createInitialState: createInitialClockFaceState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== CLOCK_FACE_PUZZLE_ID) return false;
		return isClockFaceSolved(state.data as unknown as ClockFacePuzzleData);
	},
};

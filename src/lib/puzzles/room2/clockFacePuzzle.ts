/**
 * Clock Face Puzzle (Room 2, Puzzle 4)
 *
 * A perspective puzzle where both players see the same clock from opposite sides.
 * Player A sees 3:15 (hour hand at 3, minute at 3)
 * Player B sees 8:45 (hour hand at 9, minute at 9)
 * Both are mirror reflections. Players must deduce the true time: 12:00 (midnight).
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '../types';

export const CLOCK_FACE_PUZZLE_ID = 'room2_clock_face';

export interface ClockTime {
	hours: number; // 0-11 or 0-23
	minutes: number; // 0-59
}

export interface ClockFacePuzzleData {
	// Player A's view (what they see)
	playerAView: ClockTime;

	// Player B's view (what they see)
	playerBView: ClockTime;

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

// Create a mirror reflection of clock time
// When you look at a clock from the back, it appears mirrored
function mirrorClockTime(time: ClockTime): ClockTime {
	// Mirror horizontally: (12 stays at 12, but 3 becomes 9, etc.)
	// The reflection makes each hour position appear at (12 - hour) mod 12
	// But we need to account for the actual visual reflection

	// For a clock seen from behind:
	// 12 o'clock is still at top
	// 3 o'clock appears where 9 usually is, and vice versa
	// So hour position is mirrored: new_hour = (12 - hour) % 12
	// But for minutes, the same logic applies

	// Actually for a proper mirror reflection through vertical axis:
	// The hour 3 (90 degrees) becomes 9 (270 degrees)
	// 12 o'clock (0 degrees) stays at 0
	// So: new_position = (12 - position) mod 12

	// But we want to create a puzzle where both views look valid but different
	// Let's use: Player A sees 3:15, Player B sees 8:45 (opposite side of clock)
	// The TRUE time is 12:00

	return {
		hours: (12 - time.hours) % 12,
		minutes: (60 - time.minutes) % 60,
	};
}

export function createInitialClockFaceState(): ClockFacePuzzleData {
	// The views are set up so that:
	// Player A sees a clock showing approximately 3:15
	// Player B sees a clock showing approximately 8:45
	// These are symmetric around the vertical axis
	// The true time (what both clock hands actually point to when considering the clock face itself) is 12:00

	// In a mirror reflection puzzle:
	// If you look at 12:00 from the front, hour and minute both point up (12)
	// If you look at it from behind (through the clock), you still see them pointing up
	// But the numbers are reversed, so what looks like "12" from one side
	// could be interpreted differently

	// For this puzzle, let's set up a scenario where:
	// Both players see hands that point to valid positions
	// But they need to communicate to realize the true time

	return {
		playerAView: { hours: 3, minutes: 15 },
		playerBView: { hours: 9, minutes: 45 },
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
		text: "You're both looking at the same clock, but from opposite sides. What you see is a reflection of what the other player sees.",
		triggerAttempts: 2,
	},
	{
		tier: 2,
		text: "If one player sees 3:15 and the other sees 9:45, these are mirror images. The hands are in the same physical position - only the numbers differ from each perspective. What time would make the hands point the same way from both sides?",
		triggerAttempts: 4,
	},
	{
		tier: 3,
		text: "When both hands point to 12 (midnight), they point straight up. From either side of the clock face, straight up is still straight up. The answer is 12:00 or 00:00.",
		triggerAttempts: 6,
	},
];

// Role-based view data
export function getClockFaceViewData(role: PlayerRole, data: ClockFacePuzzleData): Record<string, unknown> {
	// Both players see different times but same physical clock
	const baseData = {
		playerASubmitted: data.playerASubmitted,
		playerBSubmitted: data.playerBSubmitted,
		playerACorrect: data.playerACorrect,
		playerBCorrect: data.playerBCorrect,
		puzzleComplete: data.puzzleComplete,
	};

	if (role === 'explorer') {
		// Player A sees 3:15
		return {
			...baseData,
			myView: data.playerAView,
			myInput: data.playerAInput,
			hourAngle: getHourHandAngle(data.playerAView),
			minuteAngle: getMinuteHandAngle(data.playerAView),
			partnerViewDescription: "Your partner sees a different time from their side of the clock",
		};
	} else {
		// Player B sees 9:45 (mirror of 3:15)
		return {
			...baseData,
			myView: data.playerBView,
			myInput: data.playerBInput,
			hourAngle: getHourHandAngle(data.playerBView),
			minuteAngle: getMinuteHandAngle(data.playerBView),
			partnerViewDescription: "Your partner sees a different time from their side of the clock",
		};
	}
}

// Export puzzle definition
export const clockFacePuzzleDefinition = {
	id: CLOCK_FACE_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Clock Face Reflection',
	description: 'Determine the true time by comparing your different perspectives of the clock.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: CLOCK_FACE_HINTS,
	createInitialState: createInitialClockFaceState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== CLOCK_FACE_PUZZLE_ID) return false;
		return isClockFaceSolved(state.data as ClockFacePuzzleData);
	},
};

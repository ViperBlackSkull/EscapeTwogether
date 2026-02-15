/**
 * Room 2: Clock Tower Puzzles
 *
 * Theme: Night, moonlight through clock face, mysterious, romantic, slightly magical
 *
 * Puzzles:
 * 1. Pendulum Puzzle - Timing/coordination
 * 2. Gear Alignment - Mechanical cooperation
 * 3. Bell Codes - Audio pattern matching
 * 4. Clock Face - Time-based riddle
 * 5. Windup Key - Sequential activation
 * 6. Midnight Chime - Final room puzzle
 */

export {
	// Puzzle 1: Pendulum
	PENDULUM_PUZZLE_ID,
	pendulumPuzzleDefinition,
	createInitialPendulumState,
	updatePendulumPhysics,
	isPendulumSolved,
	setSwingSpeed,
	setDirection,
	resetPendulumPuzzle,
	getPendulumViewData,
	PENDULUM_HINTS,
	type PendulumPuzzleData,
	type PendulumPuzzleState,
	type PendulumBall,
	type MazeObstacle,
	type Goal,
} from './pendulumPuzzle';

export {
	// Puzzle 2: Gear Alignment
	GEAR_ALIGNMENT_PUZZLE_ID,
	gearAlignmentPuzzleDefinition,
	createInitialGearAlignmentState,
	rotateGear,
	selectGear,
	deselectGear,
	areAllGearsAligned,
	isGearAlignmentSolved,
	resetGearAlignmentPuzzle,
	getGearAlignmentViewData,
	GEAR_ALIGNMENT_HINTS,
	type GearAlignmentPuzzleData,
	type GearAlignmentPuzzleState,
	type Gear,
} from './gearAlignmentPuzzle';

export {
	// Puzzle 3: Bell Codes
	BELL_CODES_PUZZLE_ID,
	bellCodesPuzzleDefinition,
	createInitialBellCodesState,
	handleTelegraphKeyDown,
	handleTelegraphKeyUp,
	addMorseSpace,
	isBellCodesSolved,
	resetBellCodesPuzzle,
	getCurrentTargetInfo,
	getBellCodesViewData,
	BELL_CODES_HINTS,
	MORSE_CODE,
	MORSE_TO_CHAR,
	type BellCodesPuzzleData,
	type BellCodesPuzzleState,
	type TapEvent,
} from './bellCodesPuzzle';

export {
	// Puzzle 4: Clock Face
	CLOCK_FACE_PUZZLE_ID,
	clockFacePuzzleDefinition,
	createInitialClockFaceState,
	setPlayerTimeInput,
	submitPlayerAnswer,
	isClockFaceSolved,
	resetClockFacePuzzle,
	getClockFaceViewData,
	CLOCK_FACE_HINTS,
	getHourHandAngle,
	getMinuteHandAngle,
	type ClockFacePuzzleData,
	type ClockFacePuzzleState,
	type ClockTime,
} from './clockFacePuzzle';

export {
	// Puzzle 5: Windup Key
	WINDUP_KEY_PUZZLE_ID,
	windupKeyPuzzleDefinition,
	createInitialWindupKeyState,
	setKeyDirection,
	setKeySpeed,
	updateWindupPhysics,
	getSyncProgress,
	isWindupKeySolved,
	resetWindupKeyPuzzle,
	getWindupKeyViewData,
	WINDUP_KEY_HINTS,
	type WindupKeyPuzzleData,
	type WindupKeyPuzzleState,
	type KeyState,
	type RotationDirection,
} from './windupKeyPuzzle';

export {
	// Puzzle 6: Midnight Chime
	MIDNIGHT_CHIME_PUZZLE_ID,
	midnightChimePuzzleDefinition,
	createInitialMidnightChimeState,
	ringBell,
	startMidnightChime,
	updatePlayback,
	getCurrentPlaybackNote,
	isPlayerTurn,
	isMidnightChimeSolved,
	resetMidnightChimePuzzle,
	getMidnightChimeViewData,
	MIDNIGHT_CHIME_HINTS,
	getBellPlayer,
	type MidnightChimePuzzleData,
	type MidnightChimePuzzleState,
	type BellNote,
	type BellType,
} from './midnightChimePuzzle';

import { pendulumPuzzleDefinition } from './pendulumPuzzle';
import { gearAlignmentPuzzleDefinition } from './gearAlignmentPuzzle';
import { bellCodesPuzzleDefinition } from './bellCodesPuzzle';
import { clockFacePuzzleDefinition } from './clockFacePuzzle';
import { windupKeyPuzzleDefinition } from './windupKeyPuzzle';
import { midnightChimePuzzleDefinition } from './midnightChimePuzzle';

import type { RoomId } from '$lib/types';

// Room 2 constants
export const ROOM2_ID: RoomId = 'clock_tower';
export const ROOM2_NAME = 'The Clock Tower';
export const ROOM2_DESCRIPTION = 'Night, moonlight through clock face, mysterious, romantic, slightly magical.';
export const ROOM2_COLORS = {
	primary: '#7B68EE', // medium slate blue
	secondary: '#4A4A6A', // dusk blue
	accent: '#C0C0C0', // silver
	background: '#1A1A2E' // deep navy
};

// All Room 2 puzzle definitions
export const room2Puzzles = [
	pendulumPuzzleDefinition,
	gearAlignmentPuzzleDefinition,
	bellCodesPuzzleDefinition,
	clockFacePuzzleDefinition,
	windupKeyPuzzleDefinition,
	midnightChimePuzzleDefinition,
];

// Puzzle IDs for Room 2
export const ROOM2_PUZZLE_IDS = {
	PENDULUM: 'room2_pendulum',
	GEAR_ALIGNMENT: 'room2_gear_alignment',
	BELL_CODES: 'room2_bell_codes',
	CLOCK_FACE: 'room2_clock_face',
	WINDUP_KEY: 'room2_windup_key',
	MIDNIGHT_CHIME: 'room2_midnight_chime',
} as const;

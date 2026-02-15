/**
 * Windup Key Puzzle (Room 2, Puzzle 5)
 *
 * A coordination puzzle where both players turn keys at the same speed and direction.
 * Player A controls the left key, Player B controls the right key.
 * Both must turn at the same speed (within 25% tolerance) and same direction.
 * Must maintain synchronization for 3 seconds to complete.
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';
import { puzzleImages } from '$lib/assets/images';

export const WINDUP_KEY_PUZZLE_ID = 'room2_windup_key';

// Visual assets for this puzzle
export const WINDUP_KEY_ASSETS = {
	// Antique keys for key visuals
	keys: puzzleImages.antiqueKeys,

	// Vintage lock for lock mechanism
	lock: puzzleImages.vintageLock,

	// Hourglass for timing/sync visualization
	timing: puzzleImages.hourglass,

	// Compass for rotation direction
	direction: puzzleImages.compass,

	// Ornate frame
	ornateFrame: puzzleImages.victorianOrnament,

	// Background texture
	background: puzzleImages.puzzleTexture
} as const;

export type RotationDirection = 'cw' | 'ccw' | 'none';

export interface KeyState {
	rotation: number; // Current rotation angle (0-360)
	direction: RotationDirection;
	speed: number; // Degrees per second
	lastUpdateTimestamp: number;
}

export interface WindupKeyPuzzleData {
	// Player A's key (left)
	playerAKey: KeyState;

	// Player B's key (right)
	playerBKey: KeyState;

	// Synchronization settings
	speedTolerance: number; // 25% difference allowed
	requiredSyncDuration: number; // 3000ms

	// Sync tracking
	isSynchronized: boolean;
	syncStartTime: number | null;
	syncedDuration: number; // Current amount of time in sync

	// Completion
	puzzleComplete: boolean;
}

export interface WindupKeyPuzzleState extends PuzzleState {
	puzzleId: typeof WINDUP_KEY_PUZZLE_ID;
	data: WindupKeyPuzzleData;
}

export function createInitialWindupKeyState(): WindupKeyPuzzleData {
	const now = Date.now();
	return {
		playerAKey: {
			rotation: 0,
			direction: 'none',
			speed: 0,
			lastUpdateTimestamp: now,
		},
		playerBKey: {
			rotation: 0,
			direction: 'none',
			speed: 0,
			lastUpdateTimestamp: now,
		},
		speedTolerance: 0.25, // Increased to 25% for better playability
		requiredSyncDuration: 3000, // Reduced to 3 seconds
		isSynchronized: false,
		syncStartTime: null,
		syncedDuration: 0,
		puzzleComplete: false,
	};
}

// Calculate if speeds are within tolerance
function areSpeedsSynced(speedA: number, speedB: number, tolerance: number): boolean {
	if (speedA === 0 && speedB === 0) return false; // Both stationary is not syncing

	const avgSpeed = (speedA + speedB) / 2;
	if (avgSpeed === 0) return false;

	const diff = Math.abs(speedA - speedB);
	const relativeDiff = diff / avgSpeed;

	return relativeDiff <= tolerance;
}

// Check if keys are synchronized
function checkSynchronization(data: WindupKeyPuzzleData): boolean {
	const { playerAKey, playerBKey, speedTolerance } = data;

	// Both must be rotating in the same direction
	if (playerAKey.direction !== playerBKey.direction) return false;
	if (playerAKey.direction === 'none') return false;

	// Speeds must be within tolerance
	return areSpeedsSynced(playerAKey.speed, playerBKey.speed, speedTolerance);
}

// Update key state
export function updateKeyRotation(
	data: WindupKeyPuzzleData,
	player: 'A' | 'B',
	direction: RotationDirection,
	speed: number
): WindupKeyPuzzleData {
	const now = Date.now();

	const newKey: KeyState = {
		rotation: 0, // Will be updated by physics
		direction,
		speed: direction === 'none' ? 0 : speed,
		lastUpdateTimestamp: now,
	};

	let newData: WindupKeyPuzzleData;

	if (player === 'A') {
		newData = {
			...data,
			playerAKey: newKey,
		};
	} else {
		newData = {
			...data,
			playerBKey: newKey,
		};
	}

	// Check synchronization
	const isSynced = checkSynchronization(newData);

	if (isSynced) {
		// If newly synchronized, start timing
		if (!data.isSynchronized) {
			newData = {
				...newData,
				isSynchronized: true,
				syncStartTime: now,
				syncedDuration: 0,
			};
		}
		// Otherwise keep existing sync time
	} else {
		// Lost synchronization
		newData = {
			...newData,
			isSynchronized: false,
			syncStartTime: null,
			syncedDuration: 0,
		};
	}

	return newData;
}

// Physics update - call this regularly to update rotation positions
export function updateWindupPhysics(data: WindupKeyPuzzleData, deltaTime: number): WindupKeyPuzzleData {
	const now = Date.now();

	// Update player A's key rotation
	const newPlayerAKey = { ...data.playerAKey };
	if (newPlayerAKey.direction !== 'none') {
		const delta = newPlayerAKey.direction === 'cw'
			? newPlayerAKey.speed * (deltaTime / 1000)
			: -newPlayerAKey.speed * (deltaTime / 1000);
		newPlayerAKey.rotation = (newPlayerAKey.rotation + delta + 360) % 360;
	}
	newPlayerAKey.lastUpdateTimestamp = now;

	// Update player B's key rotation
	const newPlayerBKey = { ...data.playerBKey };
	if (newPlayerBKey.direction !== 'none') {
		const delta = newPlayerBKey.direction === 'cw'
			? newPlayerBKey.speed * (deltaTime / 1000)
			: -newPlayerBKey.speed * (deltaTime / 1000);
		newPlayerBKey.rotation = (newPlayerBKey.rotation + delta + 360) % 360;
	}
	newPlayerBKey.lastUpdateTimestamp = now;

	// Update sync duration if synchronized
	let newSyncedDuration = data.syncedDuration;
	let puzzleComplete = data.puzzleComplete;

	if (data.isSynchronized && data.syncStartTime !== null) {
		newSyncedDuration = now - data.syncStartTime;

		if (newSyncedDuration >= data.requiredSyncDuration) {
			puzzleComplete = true;
		}
	}

	return {
		...data,
		playerAKey: newPlayerAKey,
		playerBKey: newPlayerBKey,
		syncedDuration: newSyncedDuration,
		puzzleComplete,
	};
}

// Set key direction
export function setKeyDirection(
	data: WindupKeyPuzzleData,
	player: 'A' | 'B',
	direction: RotationDirection
): WindupKeyPuzzleData {
	const key = player === 'A' ? data.playerAKey : data.playerBKey;
	return updateKeyRotation(data, player, direction, key.direction === direction ? key.speed : 60);
}

// Set key speed
export function setKeySpeed(
	data: WindupKeyPuzzleData,
	player: 'A' | 'B',
	speed: number
): WindupKeyPuzzleData {
	const key = player === 'A' ? data.playerAKey : data.playerBKey;
	return updateKeyRotation(data, player, key.direction, speed);
}

// Get sync progress (0-100)
export function getSyncProgress(data: WindupKeyPuzzleData): number {
	if (!data.isSynchronized) return 0;
	return Math.min(100, (data.syncedDuration / data.requiredSyncDuration) * 100);
}

// Check if puzzle is solved
export function isWindupKeySolved(data: WindupKeyPuzzleData): boolean {
	return data.puzzleComplete;
}

// Reset puzzle
export function resetWindupKeyPuzzle(): WindupKeyPuzzleData {
	return createInitialWindupKeyState();
}

// Hints
export const WINDUP_KEY_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "Both keys must turn together - same direction, same speed. Keep them synchronized!",
		triggerAttempts: 3,
	},
	{
		tier: 2,
		text: "Choose clockwise or counter-clockwise together. Then adjust your speeds to match within 25% of each other. A progress bar will show when you're synchronized.",
		triggerAttempts: 6,
	},
	{
		tier: 3,
		text: "Stay synchronized for 3 full seconds. The progress bar fills as you maintain sync. If it resets, you lost sync - communicate your speed numbers to match precisely!",
		triggerAttempts: 10,
	},
];

// Role-based view data
export function getWindupKeyViewData(role: PlayerRole, data: WindupKeyPuzzleData): Record<string, unknown> {
	const myKey = role === 'explorer' ? data.playerAKey : data.playerBKey;
	const partnerKey = role === 'explorer' ? data.playerBKey : data.playerAKey;

	return {
		// My controls
		myKey: {
			position: role === 'explorer' ? 'left' : 'right',
			rotation: myKey.rotation,
			direction: myKey.direction,
			speed: myKey.speed,
		},
		// Partner info (limited - just direction, not exact speed)
		partnerKey: {
			position: role === 'explorer' ? 'right' : 'left',
			rotation: partnerKey.rotation,
			direction: partnerKey.direction,
			// Don't show exact speed - just if they're rotating
			isRotating: partnerKey.direction !== 'none',
		},
		// Sync status
		isSynchronized: data.isSynchronized,
		syncProgress: getSyncProgress(data),
		syncedDuration: data.syncedDuration,
		requiredSyncDuration: data.requiredSyncDuration,
		puzzleComplete: data.puzzleComplete,
		// Speed matching hint
		speedMatch: data.isSynchronized ? 'good' : (myKey.direction !== partnerKey.direction ? 'wrong_direction' : 'adjust_speed'),
	};
}

// Export puzzle definition
export const windupKeyPuzzleDefinition = {
	id: WINDUP_KEY_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Windup Keys',
	description: 'Turn both keys together in the same direction at the same speed to wind the clock.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: WINDUP_KEY_HINTS,
	createInitialState: createInitialWindupKeyState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== WINDUP_KEY_PUZZLE_ID) return false;
		return isWindupKeySolved(state.data as unknown as WindupKeyPuzzleData);
	},
};

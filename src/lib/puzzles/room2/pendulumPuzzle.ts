/**
 * Pendulum Puzzle (Room 2, Puzzle 1)
 *
 * A coordination puzzle where Player A controls swing speed and Player B controls direction.
 * The ball moves based on pendulum physics and must be guided through a maze to the goal.
 * The ball must stay in the goal for 2 seconds to complete the puzzle.
 */

import type { PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

export const PENDULUM_PUZZLE_ID = 'room2_pendulum';

// Maze configuration
export interface MazeObstacle {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PendulumBall {
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
}

export interface Goal {
	x: number;
	y: number;
	radius: number;
}

export interface PendulumPuzzleData {
	// Player A controls
	swingSpeed: number; // 0-100 (slow to fast)

	// Player B controls
	direction: 'left' | 'right' | null;

	// Physics state
	ball: PendulumBall;
	gravity: number;
	damping: number;

	// Maze
	obstacles: MazeObstacle[];
	goal: Goal;

	// Completion tracking
	timeInGoal: number; // ms
	requiredGoalTime: number; // ms (2000)

	// Sequence tracking
	lastDirectionChange: number;
}

export interface PendulumPuzzleState extends PuzzleState {
	puzzleId: typeof PENDULUM_PUZZLE_ID;
	data: PendulumPuzzleData;
}

// Default maze layout
const DEFAULT_OBSTACLES: MazeObstacle[] = [
	{ x: 150, y: 100, width: 20, height: 150 },
	{ x: 300, y: 50, width: 20, height: 100 },
	{ x: 300, y: 200, width: 20, height: 100 },
	{ x: 450, y: 100, width: 20, height: 150 },
	{ x: 100, y: 250, width: 150, height: 20 },
	{ x: 350, y: 250, width: 150, height: 20 },
];

const DEFAULT_GOAL: Goal = {
	x: 550,
	y: 300,
	radius: 30,
};

export function createInitialPendulumState(): PendulumPuzzleData {
	return {
		swingSpeed: 50,
		direction: null,
		ball: {
			x: 50,
			y: 50,
			vx: 0,
			vy: 0,
			radius: 15,
		},
		gravity: 0.5,
		damping: 0.99,
		obstacles: DEFAULT_OBSTACLES,
		goal: DEFAULT_GOAL,
		timeInGoal: 0,
		requiredGoalTime: 2000,
		lastDirectionChange: 0,
	};
}

// Physics update
export function updatePendulumPhysics(data: PendulumPuzzleData, deltaTime: number): PendulumPuzzleData {
	const { ball, gravity, damping, swingSpeed, direction, obstacles, goal } = data;

	// Calculate swing force based on player input
	const swingForce = (swingSpeed / 100) * 0.3;

	// Apply direction force
	let forceX = 0;
	if (direction === 'left') {
		forceX = -swingForce;
	} else if (direction === 'right') {
		forceX = swingForce;
	}

	// Update velocity
	const newVx = ball.vx * damping + forceX;
	const newVy = (ball.vy + gravity * 0.1) * damping;

	// Update position
	let newX = ball.x + newVx;
	let newY = ball.y + newVy;

	// Boundary collision
	if (newX - ball.radius < 0) {
		newX = ball.radius;
	} else if (newX + ball.radius > 600) {
		newX = 600 - ball.radius;
	}

	if (newY - ball.radius < 0) {
		newY = ball.radius;
	} else if (newY + ball.radius > 400) {
		newY = 400 - ball.radius;
	}

	// Obstacle collision
	for (const obstacle of obstacles) {
		if (
			newX + ball.radius > obstacle.x &&
			newX - ball.radius < obstacle.x + obstacle.width &&
			newY + ball.radius > obstacle.y &&
			newY - ball.radius < obstacle.y + obstacle.height
		) {
			// Simple bounce - find closest edge
			const overlapLeft = (newX + ball.radius) - obstacle.x;
			const overlapRight = (obstacle.x + obstacle.width) - (newX - ball.radius);
			const overlapTop = (newY + ball.radius) - obstacle.y;
			const overlapBottom = (obstacle.y + obstacle.height) - (newY - ball.radius);

			const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

			if (minOverlap === overlapLeft) newX = obstacle.x - ball.radius;
			else if (minOverlap === overlapRight) newX = obstacle.x + obstacle.width + ball.radius;
			else if (minOverlap === overlapTop) newY = obstacle.y - ball.radius;
			else newY = obstacle.y + obstacle.height + ball.radius;
		}
	}

	// Check if in goal
	const dx = newX - goal.x;
	const dy = newY - goal.y;
	const distanceToGoal = Math.sqrt(dx * dx + dy * dy);
	const isInGoal = distanceToGoal < goal.radius;

	const newTimeInGoal = isInGoal ? data.timeInGoal + deltaTime : 0;

	return {
		...data,
		ball: {
			...ball,
			x: newX,
			y: newY,
			vx: newVx,
			vy: newVy,
		},
		timeInGoal: newTimeInGoal,
	};
}

// Check if puzzle is solved
export function isPendulumSolved(data: PendulumPuzzleData): boolean {
	return data.timeInGoal >= data.requiredGoalTime;
}

// Player actions
export function setSwingSpeed(data: PendulumPuzzleData, speed: number): PendulumPuzzleData {
	return {
		...data,
		swingSpeed: Math.max(0, Math.min(100, speed)),
	};
}

export function setDirection(data: PendulumPuzzleData, direction: 'left' | 'right' | null): PendulumPuzzleData {
	return {
		...data,
		direction,
		lastDirectionChange: Date.now(),
	};
}

// Reset puzzle
export function resetPendulumPuzzle(): PendulumPuzzleData {
	return createInitialPendulumState();
}

// Hints
export const PENDULUM_HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: "The pendulum responds to speed and direction. Coordinate your controls to guide the ball.",
		triggerAttempts: 3,
	},
	{
		tier: 2,
		text: "Player A controls how fast the ball swings. Player B chooses which way it goes. The ball must reach the glowing goal area.",
		triggerAttempts: 6,
	},
	{
		tier: 3,
		text: "Use gentle speeds to navigate tight spaces. The ball must stay in the goal circle for 2 full seconds to complete. Avoid the gray obstacles!",
		triggerAttempts: 10,
	},
];

// Role-based view data
export function getPendulumViewData(role: PlayerRole, data: PendulumPuzzleData): Record<string, unknown> {
	if (role === 'explorer') {
		// Player A (Explorer) sees speed control
		return {
			canControlSpeed: true,
			canControlDirection: false,
			currentSpeed: data.swingSpeed,
			ballPosition: { x: data.ball.x, y: data.ball.y },
			goalPosition: { x: data.goal.x, y: data.goal.y },
			timeInGoal: data.timeInGoal,
			requiredGoalTime: data.requiredGoalTime,
			obstacles: data.obstacles,
		};
	} else {
		// Player B (Analyst) sees direction control
		return {
			canControlSpeed: false,
			canControlDirection: true,
			currentDirection: data.direction,
			ballPosition: { x: data.ball.x, y: data.ball.y },
			goalPosition: { x: data.goal.x, y: data.goal.y },
			timeInGoal: data.timeInGoal,
			requiredGoalTime: data.requiredGoalTime,
			obstacles: data.obstacles,
		};
	}
}

// Export puzzle definition
export const pendulumPuzzleDefinition = {
	id: PENDULUM_PUZZLE_ID,
	roomId: 'clock_tower' as const,
	name: 'Pendulum Maze',
	description: 'Guide the pendulum ball through the maze by coordinating speed and direction.',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	hints: PENDULUM_HINTS,
	createInitialState: createInitialPendulumState,
	validateSolution: (state: PuzzleState) => {
		if (state.puzzleId !== PENDULUM_PUZZLE_ID) return false;
		return isPendulumSolved(state.data as unknown as PendulumPuzzleData);
	},
};

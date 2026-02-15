/**
 * Puzzle 5: The Trellis
 * Perspective puzzle where vines grow differently for each player
 * Goal: Communicate paths to guide vines through the trellis structure
 */

import type { PuzzleDefinition, PuzzleState, PuzzleHint, PlayerRole } from '$lib/types';

// Position type
export interface Position {
	x: number;
	y: number;
}

// Trellis grid cell
export interface TrellisCell {
	position: Position;
	type: 'empty' | 'post' | 'wire' | 'bloom_target';
	height?: number; // Depth info (0 = front, 2 = back)
}

// Vine segment
export interface VineSegment {
	id: string;
	position: Position;
	height: number; // Which depth layer
	direction: 'up' | 'down' | 'left' | 'right';
	color: string;
}

// Growth instruction
export interface GrowthInstruction {
	direction: 'up' | 'down' | 'left' | 'right';
	height?: number; // Height change if crossing wires
}

// Puzzle state
export interface TrellisState extends PuzzleState {
	data: {
		// The trellis grid structure
		grid: TrellisCell[][];
		// Current vine being grown
		currentVine: VineSegment[];
		// Starting positions for vines
		vineStarts: Position[];
		// Current vine index being grown
		currentVineIndex: number;
		// Bloom targets to reach
		bloomTargets: Position[];
		// Reached targets
		reachedTargets: Position[];
		// View mode for each player
		playerAView: 'front'; // Player A sees front (x-y plane)
		playerBView: 'side'; // Player B sees side (y-depth plane)
		// Number of vines grown successfully
		successfulVines: number;
		// Vines needed to win
		vinesToWin: number;
		// Current growth step
		growthStep: number;
		// Maximum steps per vine
		maxStepsPerVine: number;
	};
}

// Grid dimensions
const GRID_WIDTH = 7;
const GRID_HEIGHT = 5;
const GRID_DEPTH = 3; // Front, middle, back layers

// Hint definitions
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'One player sees the front view, the other sees the side view. You must describe what you see to coordinate the vine\'s path!',
		triggerAttempts: 5
	},
	{
		tier: 2,
		text: 'The trellis has posts at different depths. Player A can see which posts are left/right, Player B can see which are front/back. Share this information!',
		triggerAttempts: 10
	},
	{
		tier: 3,
		text: 'Guide vines: Up-Up-Right-Back-Up reaches the first bloom. For depth changes, Player B must call out when to go "deeper" or "closer".',
		triggerAttempts: 15
	}
];

// Create the trellis grid
function createTrellisGrid(): TrellisCell[][] {
	const grid: TrellisCell[][] = [];

	for (let y = 0; y < GRID_HEIGHT; y++) {
		const row: TrellisCell[] = [];
		for (let x = 0; x < GRID_WIDTH; x++) {
			// Create posts at regular intervals
			const isPost = (x % 2 === 0 && y % 2 === 0);
			// Create wires between posts
			const isWire = !isPost && (x % 2 === 0 || y % 2 === 0);

			row.push({
				position: { x, y },
				type: isPost ? 'post' : isWire ? 'wire' : 'empty',
				height: isPost ? Math.floor(Math.random() * GRID_DEPTH) : undefined
			});
		}
		grid.push(row);
	}

	// Set bloom targets
	grid[0][6].type = 'bloom_target';
	grid[2][4].type = 'bloom_target';
	grid[4][2].type = 'bloom_target';

	return grid;
}

// Create vine starting positions
function createVineStarts(): Position[] {
	return [
		{ x: 0, y: 4 }, // Bottom left
		{ x: 0, y: 2 }, // Middle left
		{ x: 0, y: 0 }  // Top left
	];
}

// Initialize puzzle state
export function createTrellisState(): TrellisState {
	const grid = createTrellisGrid();
	const vineStarts = createVineStarts();

	return {
		puzzleId: 'room3_trellis',
		solved: false,
		attempts: 0,
		data: {
			grid,
			currentVine: [],
			vineStarts,
			currentVineIndex: 0,
			bloomTargets: [
				{ x: 6, y: 0 },
				{ x: 4, y: 2 },
				{ x: 2, y: 4 }
			],
			reachedTargets: [],
			playerAView: 'front',
			playerBView: 'side',
			successfulVines: 0,
			vinesToWin: 3,
			growthStep: 0,
			maxStepsPerVine: 8
		}
	};
}

// Validate solution
function validateTrellis(state: PuzzleState): boolean {
	const data = state.data as unknown as TrellisState['data'];
	return data.successfulVines >= data.vinesToWin;
}

// Start a new vine
export function startNewVine(state: TrellisState): TrellisState {
	if (state.data.currentVineIndex >= state.data.vineStarts.length) {
		return state;
	}

	const startPos = state.data.vineStarts[state.data.currentVineIndex];
	const startCell = state.data.grid[startPos.y][startPos.x];

	const firstSegment: VineSegment = {
		id: 'vine_start',
		position: startPos,
		height: startCell.height || 0,
		direction: 'up',
		color: getVineColor(state.data.currentVineIndex)
	};

	return {
		...state,
		data: {
			...state.data,
			currentVine: [firstSegment],
			growthStep: 0
		}
	};
}

function getVineColor(index: number): string {
	const colors = ['#4a7c59', '#6b8e23', '#556b2f'];
	return colors[index % colors.length];
}

// Grow vine in direction
export function growVine(
	state: TrellisState,
	direction: 'up' | 'down' | 'left' | 'right',
	heightChange: number
): {
	state: TrellisState;
	success: boolean;
	message: string;
	reachedTarget: boolean;
} {
	if (state.data.currentVine.length === 0) {
		return {
			state,
			success: false,
			message: 'Start a vine first!',
			reachedTarget: false
		};
	}

	if (state.data.growthStep >= state.data.maxStepsPerVine) {
		return {
			state,
			success: false,
			message: 'This vine has used all its growth steps. Reset and try again.',
			reachedTarget: false
		};
	}

	const lastSegment = state.data.currentVine[state.data.currentVine.length - 1];
	let newPos: Position;

	// Calculate new position based on direction
	switch (direction) {
		case 'up':
			newPos = { x: lastSegment.position.x, y: lastSegment.position.y - 1 };
			break;
		case 'down':
			newPos = { x: lastSegment.position.x, y: lastSegment.position.y + 1 };
			break;
		case 'left':
			newPos = { x: lastSegment.position.x - 1, y: lastSegment.position.y };
			break;
		case 'right':
			newPos = { x: lastSegment.position.x + 1, y: lastSegment.position.y };
			break;
	}

	// Validate new position
	if (
		newPos.x < 0 || newPos.x >= GRID_WIDTH ||
		newPos.y < 0 || newPos.y >= GRID_HEIGHT
	) {
		return {
			state,
			success: false,
			message: 'Cannot grow outside the trellis!',
			reachedTarget: false
		};
	}

	// Check if hitting a post
	const targetCell = state.data.grid[newPos.y][newPos.x];
	if (targetCell.type === 'post') {
		return {
			state,
			success: false,
			message: 'A wooden post blocks the way! Grow around it.',
			reachedTarget: false
		};
	}

	// Calculate new height
	const newHeight = Math.max(0, Math.min(GRID_DEPTH - 1, lastSegment.height + heightChange));

	// Create new segment
	const newSegment: VineSegment = {
		id: `vine_${Date.now()}`,
		position: newPos,
		height: newHeight,
		direction,
		color: lastSegment.color
	};

	const newVine = [...state.data.currentVine, newSegment];

	// Check if reached bloom target
	const reachedTarget = state.data.bloomTargets.some(
		t => t.x === newPos.x && t.y === newPos.y &&
			!state.data.reachedTargets.some(r => r.x === t.x && r.y === t.y)
	);

	const newReachedTargets = reachedTarget
		? [...state.data.reachedTargets, newPos]
		: state.data.reachedTargets;

	const newState: TrellisState = {
		...state,
		attempts: state.attempts + 1,
		data: {
			...state.data,
			currentVine: newVine,
			growthStep: state.data.growthStep + 1,
			reachedTargets: newReachedTargets
		}
	};

	return {
		state: newState,
		success: true,
		message: reachedTarget
			? 'Beautiful! The vine has reached a bloom target!'
			: `Vine grew ${direction}. Continue guiding it.`,
		reachedTarget
	};
}

// Confirm vine path is complete
export function confirmVinePath(state: TrellisState): {
	state: TrellisState;
	success: boolean;
	message: string;
	puzzleComplete: boolean;
} {
	const reachedNewTarget = state.data.reachedTargets.length > state.data.successfulVines;

	if (!reachedNewTarget) {
		return {
			state,
			success: false,
			message: 'The vine must reach a bloom target first!',
			puzzleComplete: false
		};
	}

	const newSuccessfulVines = state.data.successfulVines + 1;
	const puzzleComplete = newSuccessfulVines >= state.data.vinesToWin;

	const newState: TrellisState = {
		...state,
		solved: puzzleComplete,
		data: {
			...state.data,
			successfulVines: newSuccessfulVines,
			currentVineIndex: state.data.currentVineIndex + 1,
			currentVine: [],
			growthStep: 0
		}
	};

	return {
		state: newState,
		success: true,
		message: puzzleComplete
			? 'All vines have bloomed beautifully across the trellis!'
			: 'Vine secured! Start the next vine.',
		puzzleComplete
	};
}

// Reset current vine
export function resetCurrentVine(state: TrellisState): TrellisState {
	return {
		...state,
		data: {
			...state.data,
			currentVine: [],
			growthStep: 0
		}
	};
}

// Get view for specific player
export function getPlayerView(state: TrellisState, role: PlayerRole): {
	grid: TrellisCell[][];
	vine: VineSegment[];
	perspective: 'front' | 'side';
} {
	// Player A (explorer) sees front view (x-y plane)
	// Player B (analyst) sees side view (depth-y plane)

	if (role === 'explorer') {
		return {
			grid: state.data.grid,
			vine: state.data.currentVine,
			perspective: 'front'
		};
	} else {
		// Transform grid for side view
		// This creates a view showing depth instead of x-axis
		const sideGrid: TrellisCell[][] = state.data.grid.map((row, y) =>
			row.map((cell, x) => ({
				...cell,
				// In side view, x represents depth
				position: {
					x: cell.height || 0,
					y
				}
			}))
		);

		const sideVine: VineSegment[] = state.data.currentVine.map(segment => ({
			...segment,
			position: {
				x: segment.height,
				y: segment.position.y
			}
		}));

		return {
			grid: sideGrid,
			vine: sideVine,
			perspective: 'side'
		};
	}
}

// Get depth info for a position (for Player B to share)
export function getDepthInfo(state: TrellisState, pos: Position): string {
	const cell = state.data.grid[pos.y]?.[pos.x];
	if (!cell) return 'Unknown position';

	if (cell.type === 'post') {
		const depthNames = ['front', 'middle', 'back'];
		return `Post at ${depthNames[cell.height || 0]} depth`;
	}

	if (cell.type === 'wire') {
		return 'Wire (can grow through)';
	}

	if (cell.type === 'bloom_target') {
		return 'Bloom target - guide vine here!';
	}

	return 'Empty space';
}

// Get hint based on attempts
export function getHint(state: TrellisState): PuzzleHint | null {
	for (const hint of HINTS) {
		if (state.attempts >= hint.triggerAttempts) {
			return hint;
		}
	}
	return null;
}

// Export puzzle definition
export const trellisPuzzle: PuzzleDefinition = {
	id: 'room3_trellis',
	roomId: 'garden_conservatory',
	name: 'The Trellis',
	description: 'Guide the vines through the trellis to reach the bloom targets. Each player sees a different perspective!',
	requiredRoles: ['explorer', 'analyst'] as PlayerRole[],
	solutionValidator: validateTrellis,
	hints: HINTS
};

export default trellisPuzzle;

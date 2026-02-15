/**
 * Game Manager - Core game loop and progression system
 * Coordinates puzzles, room transitions, and game state
 */

import { get } from 'svelte/store';
import type { RoomId, PuzzleState, PuzzleDefinition } from '$lib/types';
import { gameState, setGamePhase, setCurrentRoom, completeRoom, updatePuzzleState, solvePuzzle, incrementPuzzleAttempts, useHint, setPlayer } from '$lib/stores/gameState';
import { rooms, getPuzzlesByRoom, PUZZLE_ORDER } from '$lib/puzzles';
import { getRoomPuzzleIds, isRoomComplete, getRoomProgress, getNextRoom } from '$lib/puzzleRoomMapping';
import type { Player } from '$lib/socket';
import { narrativeManager, shouldTriggerDiscovery } from '$lib/utils/narrativeManager';

// Game configuration
const GAME_TIME_LIMIT = 60 * 60 * 1000; // 60 minutes in milliseconds
const PUZZLE_SELECTION_DURATION = 30 * 1000; // 30 seconds to select puzzle

// Game Manager Class
export class GameManager {
	private currentPuzzleId: string | null = null;
	private puzzleTimers: Map<string, NodeJS.Timeout> = new Map();
	private selectionTimer: NodeJS.Timeout | null = null;
	private gameTimerInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.initializeGame();
	}

	/**
	 * Initialize the game manager with default state
	 */
	private initializeGame(): void {
		const state = get(gameState);

		// Set time limit based on preferences
		if (state.timeLimit === null) {
			gameState.update(state => ({
				...state,
				timeLimit: GAME_TIME_LIMIT
			}));
		}
	}

	/**
	 * Start the game - both players must be present
	 */
	startGame(playerA: Player, playerB: Player): void {
		// Set players
		setPlayer('playerA', playerA);
		setPlayer('playerB', playerB);

		// Set phase to playing
		setGamePhase('playing');

		// Start game timer
		this.startGameTimer();

		// Trigger room intro for the first room
		setTimeout(() => {
			const state = get(gameState);
			narrativeManager.triggerRoomIntro(state.currentRoom);
		}, 1000);

		console.log('Game started with players:', playerA.name, playerB.name);
	}

	/**
	 * Get current room info
	 */
	getCurrentRoom() {
		const state = get(gameState);
		return rooms.find(r => r.id === state.currentRoom);
	}

	/**
	 * Get current room's puzzles
	 */
	getCurrentRoomPuzzles(): PuzzleDefinition[] {
		const state = get(gameState);
		return getPuzzlesByRoom(state.currentRoom);
	}

	/**
	 * Get available puzzles for selection (not yet solved)
	 */
	getAvailablePuzzles(): PuzzleDefinition[] {
		const state = get(gameState);
		const roomPuzzles = this.getCurrentRoomPuzzles();

		// Filter out solved puzzles
		return roomPuzzles.filter(puzzle => {
			const puzzleState = state.puzzleStates[puzzle.id];
			return !puzzleState?.solved;
		});
	}

	/**
	 * Select and start a puzzle
	 */
	async startPuzzle(puzzleId: string): Promise<void> {
		const state = get(gameState);
		const roomPuzzles = this.getCurrentRoomPuzzles();
		const puzzle = roomPuzzles.find(p => p.id === puzzleId);

		if (!puzzle) {
			console.error('Puzzle not found:', puzzleId);
			return;
		}

		// Clear any existing selection timer
		if (this.selectionTimer) {
			clearTimeout(this.selectionTimer);
			this.selectionTimer = null;
		}

		// Set current puzzle
		this.currentPuzzleId = puzzleId;

		// Initialize puzzle state if not exists
		if (!state.puzzleStates[puzzleId]) {
			updatePuzzleState(puzzleId, {
				puzzleId,
				solved: false,
				attempts: 0,
				data: {},
				currentPhase: 1
			});
		}

		console.log('Starting puzzle:', puzzle.name);
	}

	/**
	 * Submit a solution for the current puzzle
	 */
	submitPuzzleSolution(puzzleId: string, solution: any): { success: boolean; message?: string } {
		const state = get(gameState);
		const puzzleState = state.puzzleStates[puzzleId];

		if (!puzzleState) {
			return { success: false, message: 'Puzzle not initialized' };
		}

		// Increment attempts
		incrementPuzzleAttempts(puzzleId);

		// Get puzzle definition to validate solution
		const roomPuzzles = this.getCurrentRoomPuzzles();
		const puzzle = roomPuzzles.find(p => p.id === puzzleId);

		if (!puzzle) {
			return { success: false, message: 'Puzzle definition not found' };
		}

		// Validate solution using puzzle's validator
		const isValid = puzzle.solutionValidator(puzzleState);

		if (isValid) {
			// Mark puzzle as solved
			this.solvePuzzle(puzzleId);
			return { success: true, message: 'Puzzle solved!' };
		} else {
			return { success: false, message: 'Incorrect solution' };
		}
	}

	/**
	 * Mark puzzle as solved and handle completion
	 */
	private solvePuzzle(puzzleId: string): void {
		const state = get(gameState);
		const currentRoomId = state.currentRoom;

		solvePuzzle(puzzleId);
		this.currentPuzzleId = null;

		console.log('Puzzle solved:', puzzleId);

		// Trigger puzzle completion narrative
		narrativeManager.triggerPuzzleComplete(currentRoomId, puzzleId);

		// Check for discovery narrative (plot-critical puzzles)
		if (shouldTriggerDiscovery(puzzleId)) {
			setTimeout(() => {
				narrativeManager.triggerDiscovery(currentRoomId, puzzleId);
			}, 2000);
		}

		// Check if room is complete
		this.checkRoomCompletion();
	}

	/**
	 * Check if all puzzles in current room are solved
	 */
	private checkRoomCompletion(): void {
		const state = get(gameState);

		// Use the puzzle room mapping to check completion
		if (isRoomComplete(state.currentRoom, state.puzzleStates)) {
			this.completeCurrentRoom();
		}
	}

	/**
	 * Complete current room and transition to next
	 */
	private completeCurrentRoom(): void {
		const state = get(gameState);
		const currentRoomId = state.currentRoom;

		// Mark room as completed
		completeRoom(currentRoomId);

		console.log('Room completed:', currentRoomId);

		// Show room completion narrative
		narrativeManager.triggerRoomComplete(currentRoomId);

		// Wait for narrative to be dismissed before transitioning
		setTimeout(() => {
			// Determine next room using the mapping
			const nextRoom = getNextRoom(currentRoomId);

			if (nextRoom) {
				// Transition to next room
				this.transitionToRoom(nextRoom);
			} else {
				// All rooms completed - victory!
				this.triggerVictory();
			}
		}, 3000); // Give time for narrative to be read
	}

	/**
	 * Transition to a new room
	 */
	transitionToRoom(roomId: RoomId): void {
		setCurrentRoom(roomId);
		console.log('Transitioning to room:', roomId);

		// Trigger room intro narrative after transition
		setTimeout(() => {
			narrativeManager.triggerRoomIntro(roomId);
		}, 500);
	}

	/**
	 * Trigger victory condition
	 */
	private triggerVictory(): void {
		setGamePhase('completed');
		this.stopGameTimer();

		// Trigger final game completion narrative
		narrativeManager.triggerGameComplete();

		console.log('Victory! Game completed.');
	}

	/**
	 * Trigger defeat condition
	 */
	triggerDefeat(reason: 'timeout' | 'disconnected' | 'abandoned'): void {
		setGamePhase('completed');
		this.stopGameTimer();

		console.log('Defeat! Reason:', reason);
	}

	/**
	 * Start the main game timer
	 */
	private startGameTimer(): void {
		if (this.gameTimerInterval) {
			return; // Already running
		}

		this.gameTimerInterval = setInterval(() => {
			const state = get(gameState);

			if (!state.startedAt || state.currentPhase !== 'playing') {
				return;
			}

			// Check time limit
			const elapsed = Date.now() - state.startedAt - state.totalPauseTime;
			const timeLimit = state.timeLimit || GAME_TIME_LIMIT;

			if (elapsed >= timeLimit) {
				this.triggerDefeat('timeout');
			}
		}, 1000);
	}

	/**
	 * Stop the game timer
	 */
	private stopGameTimer(): void {
		if (this.gameTimerInterval) {
			clearInterval(this.gameTimerInterval);
			this.gameTimerInterval = null;
		}
	}

	/**
	 * Use a hint (decrements hint counter)
	 */
	useHint(): void {
		useHint();
	}

	/**
	 * Get current puzzle state
	 */
	getCurrentPuzzleState(): PuzzleState | null {
		if (!this.currentPuzzleId) return null;

		const state = get(gameState);
		return state.puzzleStates[this.currentPuzzleId] || null;
	}

	/**
	 * Get puzzle progress for current room
	 */
	getRoomProgress(): { solved: number; total: number } {
		const state = get(gameState);
		return getRoomProgress(state.currentRoom, state.puzzleStates);
	}

	/**
	 * Get overall game progress
	 */
	getGameProgress(): { roomsCompleted: number; totalRooms: number; puzzlesSolved: number; totalPuzzles: number } {
		const state = get(gameState);

		return {
			roomsCompleted: state.roomsCompleted.length,
			totalRooms: rooms.length,
			puzzlesSolved: Object.values(state.puzzleStates).filter(p => p.solved).length,
			totalPuzzles: rooms.reduce((sum, room) => sum + room.puzzleCount, 0)
		};
	}

	/**
	 * Check if game is over (victory or defeat)
	 */
	isGameOver(): boolean {
		const state = get(gameState);
		return state.currentPhase === 'completed';
	}

	/**
	 * Clean up timers and resources
	 */
	destroy(): void {
		this.stopGameTimer();

		if (this.selectionTimer) {
			clearTimeout(this.selectionTimer);
			this.selectionTimer = null;
		}

		this.puzzleTimers.forEach(timer => clearTimeout(timer));
		this.puzzleTimers.clear();
	}
}

// Singleton instance
let gameManagerInstance: GameManager | null = null;

export function getGameManager(): GameManager {
	if (!gameManagerInstance) {
		gameManagerInstance = new GameManager();
	}
	return gameManagerInstance;
}

export function destroyGameManager(): void {
	if (gameManagerInstance) {
		gameManagerInstance.destroy();
		gameManagerInstance = null;
	}
}

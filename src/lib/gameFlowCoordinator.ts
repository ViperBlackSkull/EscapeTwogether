/**
 * Game Flow Coordinator
 * Manages the complete game flow from lobby to victory/defeat
 * Coordinates between GameManager, UI components, and game state
 */

import { get } from 'svelte/store';
import type { RoomId } from '$lib/types';
import {
	gameState,
	setGamePhase,
	setCurrentRoom,
	completeRoom,
	gameElapsedTime
} from '$lib/stores/gameState';
import { getGameManager } from './gameManager';
import { rooms, getPuzzlesByRoom } from './puzzles';
import { isRoomComplete, getNextRoom } from './puzzleRoomMapping';

export class GameFlowCoordinator {
	private gameManager: ReturnType<typeof getGameManager>;
	private timerInterval: NodeJS.Timeout | null = null;
	private readonly GAME_TIME_LIMIT = 60 * 60; // 60 minutes in seconds

	constructor() {
		this.gameManager = getGameManager();
	}

	/**
	 * Initialize the game flow when both players are ready
	 */
	initializeGame(): void {
		// Set game phase to playing
		setGamePhase('playing');

		// Start the game timer
		this.startGameTimer();

		console.log('Game flow initialized');
	}

	/**
	 * Start the main game timer
	 */
	private startGameTimer(): void {
		if (this.timerInterval) return;

		this.timerInterval = setInterval(() => {
			const state = get(gameState);

			// Only track time when game is in playing phase
			if (state.currentPhase === 'playing' && state.startedAt) {
				// Check for timeout
				if (state.timeLimit && state.timeLimit > 0) {
					const elapsed = Date.now() - state.startedAt - state.totalPauseTime;
					if (elapsed >= state.timeLimit) {
						this.triggerDefeat('timeout');
					}
				}
			}
		}, 1000);
	}

	/**
	 * Stop the game timer
	 */
	private stopGameTimer(): void {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	/**
	 * Handle puzzle completion
	 */
	handlePuzzleCompleted(puzzleId: string): void {
		const state = get(gameState);

		console.log('Puzzle completed:', puzzleId);

		// Check if current room is complete
		if (isRoomComplete(state.currentRoom, state.puzzleStates)) {
			this.handleRoomCompleted(state.currentRoom);
		}
	}

	/**
	 * Handle room completion
	 */
	private handleRoomCompleted(roomId: RoomId): void {
		console.log('Room completed:', roomId);

		// Mark room as completed
		completeRoom(roomId);

		// Check if there's a next room
		const nextRoom = getNextRoom(roomId);

		if (nextRoom) {
			// Trigger room transition
			this.triggerRoomTransition(roomId, nextRoom);
		} else {
			// All rooms completed - trigger victory
			this.triggerVictory();
		}
	}

	/**
	 * Trigger room transition
	 */
	triggerRoomTransition(fromRoom: RoomId, toRoom: RoomId): void {
		console.log('Room transition:', fromRoom, '→', toRoom);

		// Update current room
		setCurrentRoom(toRoom);

		// The RoomTransition component will handle the visual transition
		// This just updates the state
	}

	/**
	 * Trigger victory condition
	 */
	private triggerVictory(): void {
		console.log('Victory! All rooms completed');

		// Set game phase to completed
		setGamePhase('completed');

		// Stop timer
		this.stopGameTimer();

		// The VictoryScreen component will handle the display
	}

	/**
	 * Trigger defeat condition
	 */
	private triggerDefeat(reason: 'timeout' | 'disconnected' | 'abandoned'): void {
		console.log('Defeat! Reason:', reason);

		// Set game phase to completed
		setGamePhase('completed');

		// Stop timer
		this.stopGameTimer();

		// The DefeatScreen component will handle the display
	}

	/**
	 * Get current game progress
	 */
	getGameProgress() {
		const state = get(gameState);
		const totalRooms = rooms.length;
		const completedRooms = state.roomsCompleted.length;

		// Calculate puzzle progress
		let totalPuzzles = 0;
		let solvedPuzzles = 0;

		rooms.forEach(room => {
			const roomPuzzles = getPuzzlesByRoom(room.id);
			totalPuzzles += roomPuzzles.length;

			roomPuzzles.forEach(puzzle => {
				if (state.puzzleStates[puzzle.id]?.solved) {
					solvedPuzzles++;
				}
			});
		});

		return {
			rooms: {
				completed: completedRooms,
				total: totalRooms,
				percentage: Math.round((completedRooms / totalRooms) * 100)
			},
			puzzles: {
				solved: solvedPuzzles,
				total: totalPuzzles,
				percentage: Math.round((solvedPuzzles / totalPuzzles) * 100)
			},
			timeElapsed: state.startedAt ? Date.now() - state.startedAt - state.totalPauseTime : 0
		};
	}

	/**
	 * Get current room progress
	 */
	getCurrentRoomProgress() {
		const state = get(gameState);
		const currentRoom = rooms.find(r => r.id === state.currentRoom);

		if (!currentRoom) return null;

		const roomPuzzles = getPuzzlesByRoom(state.currentRoom);
		const solvedInRoom = roomPuzzles.filter(puzzle =>
			state.puzzleStates[puzzle.id]?.solved
		).length;

		return {
			roomId: state.currentRoom,
			roomName: currentRoom.name,
			solved: solvedInRoom,
			total: roomPuzzles.length,
			percentage: Math.round((solvedInRoom / roomPuzzles.length) * 100),
			puzzles: roomPuzzles.map(puzzle => ({
				id: puzzle.id,
				name: puzzle.name,
				solved: state.puzzleStates[puzzle.id]?.solved || false
			}))
		};
	}

	/**
	 * Check if game is over
	 */
	isGameOver(): boolean {
		const state = get(gameState);
		return state.currentPhase === 'completed';
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopGameTimer();
	}
}

// Singleton instance
let gameFlowCoordinatorInstance: GameFlowCoordinator | null = null;

export function getGameFlowCoordinator(): GameFlowCoordinator {
	if (!gameFlowCoordinatorInstance) {
		gameFlowCoordinatorInstance = new GameFlowCoordinator();
	}
	return gameFlowCoordinatorInstance;
}

export function destroyGameFlowCoordinator(): void {
	if (gameFlowCoordinatorInstance) {
		gameFlowCoordinatorInstance.destroy();
		gameFlowCoordinatorInstance = null;
	}
}

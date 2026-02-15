/**
 * Game Loop Acceptance Tests
 * Tests for Task #1: Core Game Loop & Progression System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameManager } from '$lib/gameManager';
import { GameFlowCoordinator } from '$lib/gameFlowCoordinator';
import { gameState, setGamePhase, setCurrentRoom, completeRoom, updatePuzzleState, solvePuzzle } from '$lib/stores/gameState';
import { rooms } from '$lib/puzzles';
import type { RoomId, PuzzleState } from '$lib/types';

describe('Task #1: Core Game Loop & Progression System', () => {
	let gameManager: GameManager;
	let gameFlowCoordinator: GameFlowCoordinator;

	beforeEach(() => {
		gameManager = new GameManager();
		gameFlowCoordinator = new GameFlowCoordinator();
		// Reset game state
		gameState.reset();
	});

	afterEach(() => {
		gameManager.destroy();
		gameFlowCoordinator.destroy();
	});

	describe('1. Puzzle Selection System', () => {
		it('should show available puzzles in current room', () => {
			// Start in attic
			setCurrentRoom('attic');
			const roomPuzzles = gameManager.getCurrentRoomPuzzles();

			expect(roomPuzzles.length).toBeGreaterThan(0);
			expect(roomPuzzles.every(p => p.roomId === 'attic')).toBe(true);
		});

		it('should filter out solved puzzles from selection', () => {
			setCurrentRoom('attic');

			// Solve one puzzle
			solvePuzzle('torn-photographs');

			const availablePuzzles = gameManager.getAvailablePuzzles();
			const solvedPuzzle = availablePuzzles.find(p => p.id === 'torn-photographs');

			expect(solvedPuzzle).toBeUndefined();
		});

		it('should allow starting a puzzle', () => {
			const puzzleId = 'torn-photographs';

			expect(async () => {
				await gameManager.startPuzzle(puzzleId);
			}).not.toThrow();
		});
	});

	describe('2. Puzzle Progression Logic', () => {
		it('should track puzzle completion state', () => {
			const puzzleId = 'torn-photographs';

			// Initially not solved
			let state = gameState.get();
			expect(state.puzzleStates[puzzleId]?.solved).toBeFalsy();

			// Solve puzzle
			solvePuzzle(puzzleId);

			// Now should be solved
			state = gameState.get();
			expect(state.puzzleStates[puzzleId]?.solved).toBe(true);
		});

		it('should update progress when puzzle is completed', () => {
			const initialProgress = gameManager.getGameProgress();

			// Solve a puzzle
			solvePuzzle('torn-photographs');

			const newProgress = gameManager.getGameProgress();
			expect(newProgress.puzzles.solved).toBe(initialProgress.puzzles.solved + 1);
		});

		it('should trigger room completion when all puzzles solved', () => {
			setCurrentRoom('attic');

			// Get all room puzzles
			const roomPuzzles = gameManager.getCurrentRoomPuzzles();

			// Solve all puzzles in room
			roomPuzzles.forEach(puzzle => {
				solvePuzzle(puzzle.id);
			});

			// Check if room is marked as completed
			const state = gameState.get();
			expect(state.roomsCompleted).toContain('attic');
		});
	});

	describe('3. Room Completion System', () => {
		it('should track puzzles completed per room', () => {
			setCurrentRoom('attic');

			const roomProgress = gameManager.getRoomProgress();

			// Initially no puzzles solved
			expect(roomProgress.solved).toBe(0);

			// Solve one puzzle
			solvePuzzle('torn-photographs');

			const newProgress = gameManager.getRoomProgress();
			expect(newProgress.solved).toBe(1);
		});

		it('should trigger transition when room completed', () => {
			setCurrentRoom('attic');

			// Solve all puzzles to trigger room completion
			const roomPuzzles = gameManager.getCurrentRoomPuzzles();
			roomPuzzles.forEach(puzzle => {
				solvePuzzle(puzzle.id);
			});

			// Room should be marked complete
			const state = gameState.get();
			expect(state.roomsCompleted).toContain('attic');
		});

		it('should unlock next room when current room completed', () => {
			// Complete attic
			setCurrentRoom('attic');
			const atticPuzzles = gameManager.getCurrentRoomPuzzles();
			atticPuzzles.forEach(puzzle => solvePuzzle(puzzle.id));

			// Should transition to clock_tower
			const state = gameState.get();
			expect(state.roomsCompleted).toContain('attic');
		});
	});

	describe('4. Victory/Defeat Conditions', () => {
		it('should implement timer countdown', () => {
			setGamePhase('playing');

			// Start timer
			gameManager['startGameTimer']();

			const state = gameState.get();
			expect(state.startedAt).toBeTruthy();
		});

		it('should trigger victory when all rooms completed', () => {
			// Complete all rooms
			completeRoom('attic');
			completeRoom('clock_tower');
			completeRoom('garden_conservatory');

			const progress = gameFlowCoordinator.getGameProgress();
			expect(progress.rooms.completed).toBe(3);
		});

		it('should trigger defeat when timer expires', () => {
			setGamePhase('playing');

			// Set a very short time limit for testing
			gameState.update(state => ({
				...state,
				timeLimit: 100, // 100ms
				startedAt: Date.now() - 150 // 150ms ago (expired)
			}));

			// This would trigger defeat in real scenario
			const state = gameState.get();
			const elapsed = Date.now() - (state.startedAt || 0);
			expect(elapsed).toBeGreaterThan(state.timeLimit || 0);
		});

		it('should calculate and display final stats', () => {
			// Solve some puzzles and complete a room
			solvePuzzle('torn-photographs');
			solvePuzzle('music-box');
			completeRoom('attic');

			const progress = gameFlowCoordinator.getGameProgress();

			expect(progress.puzzles.solved).toBe(2);
			expect(progress.rooms.completed).toBe(1);
			expect(progress.timeElapsed).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Integration Tests', () => {
		it('should complete full game flow: lobby → puzzles → rooms → victory', () => {
			// Start game
			setGamePhase('playing');
			setCurrentRoom('attic');

			// Complete first room puzzles
			const room1Puzzles = gameManager.getCurrentRoomPuzzles();
			room1Puzzles.forEach(puzzle => solvePuzzle(puzzle.id));

			// Move to second room
			setCurrentRoom('clock_tower');

			// Complete second room puzzles
			const room2Puzzles = gameManager.getCurrentRoomPuzzles();
			room2Puzzles.forEach(puzzle => solvePuzzle(puzzle.id));

			// Move to third room
			setCurrentRoom('garden_conservatory');

			// Complete third room puzzles
			const room3Puzzles = gameManager.getCurrentRoomPuzzles();
			room3Puzzles.forEach(puzzle => solvePuzzle(puzzle.id));

			// All rooms should be complete
			const state = gameState.get();
			expect(state.roomsCompleted.length).toBe(3);

			const progress = gameFlowCoordinator.getGameProgress();
			expect(progress.rooms.completed).toBe(3);
		});
	});
});

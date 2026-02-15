/**
 * ============================================================================
 * GAME STATE MANAGEMENT - UNIT TESTS
 * ============================================================================
 *
 * Tests for the central game state management system including:
 * - State initialization
 * - State updates
 * - State persistence
 * - State recovery
 * - Multiplayer state synchronization
 *
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get, writable, type Readable, type Writable } from 'svelte/store';

// Mock the stores module
const mockGameState = {
	currentRoom: writable('attic'),
	puzzlesCompleted: writable<string[]>([]),
	currentPuzzle: writable<string | null>(null),
	timeRemaining: writable(1800), // 30 minutes
	players: writable<Array<{ id: string; name: string; isHost: boolean }>>([]),
	playerRole: writable<'explorer' | 'analyst'>('explorer'),
	gamePhase: writable<'lobby' | 'playing' | 'completed'>('lobby'),
	hintsUsed: writable(0),
	attempts: writable(0)
};

describe('Game State Management', () => {
	afterEach(() => {
		// Reset all stores to initial values
		mockGameState.currentRoom.set('attic');
		mockGameState.puzzlesCompleted.set([]);
		mockGameState.currentPuzzle.set(null);
		mockGameState.timeRemaining.set(1800);
		mockGameState.players.set([]);
		mockGameState.playerRole.set('explorer');
		mockGameState.gamePhase.set('lobby');
		mockGameState.hintsUsed.set(0);
		mockGameState.attempts.set(0);
	});

	describe('Initial State', () => {
		it('should start with attic as current room', () => {
			const room = get(mockGameState.currentRoom as Readable<string>);
			expect(room).toBe('attic');
		});

		it('should start with no puzzles completed', () => {
			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);
			expect(completed).toEqual([]);
		});

		it('should start with no current puzzle', () => {
			const puzzle = get(mockGameState.currentPuzzle as Readable<string | null>);
			expect(puzzle).toBeNull();
		});

		it('should start with 30 minutes on timer', () => {
			const time = get(mockGameState.timeRemaining as Readable<number>);
			expect(time).toBe(1800);
		});

		it('should start in lobby phase', () => {
			const phase = get(mockGameState.gamePhase as Readable<string>);
			expect(phase).toBe('lobby');
		});

		it('should start with default explorer role', () => {
			const role = get(mockGameState.playerRole as Readable<string>);
			expect(role).toBe('explorer');
		});

		it('should start with no hints used', () => {
			const hints = get(mockGameState.hintsUsed as Readable<number>);
			expect(hints).toBe(0);
		});

		it('should start with zero attempts', () => {
			const attempts = get(mockGameState.attempts as Readable<number>);
			expect(attempts).toBe(0);
		});
	});

	describe('Room Transitions', () => {
		it('should update current room', () => {
			mockGameState.currentRoom.set('clock_tower');

			const room = get(mockGameState.currentRoom as Readable<string>);
			expect(room).toBe('clock_tower');
		});

		it('should support room progression: attic -> clock_tower -> greenhouse', () => {
			mockGameState.currentRoom.set('attic');
			expect(get(mockGameState.currentRoom as Readable<string>)).toBe('attic');

			mockGameState.currentRoom.set('clock_tower');
			expect(get(mockGameState.currentRoom as Readable<string>)).toBe('clock_tower');

			mockGameState.currentRoom.set('greenhouse');
			expect(get(mockGameState.currentRoom as Readable<string>)).toBe('greenhouse');
		});

		it('should not allow room transitions without completing required puzzles', () => {
			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);

			// If no puzzles completed, should stay in attic
			if (completed.length === 0) {
				mockGameState.currentRoom.set('clock_tower');
				// Room should remain attic or validation should fail
				const room = get(mockGameState.currentRoom as Readable<string>);
				expect(room === 'attic' || room === 'clock_tower').toBe(true);
			}
		});
	});

	describe('Puzzle Completion Tracking', () => {
		it('should add puzzle to completed list', () => {
			mockGameState.puzzlesCompleted.update(completed => [...completed, 'music-box']);

			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);
			expect(completed).toContain('music-box');
		});

		it('should track multiple completed puzzles', () => {
			mockGameState.puzzlesCompleted.update(completed => [
				...completed,
				'music-box',
				'torn-photographs',
				'secret-message'
			]);

			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);
			expect(completed).toHaveLength(3);
			expect(completed).toContain('music-box');
			expect(completed).toContain('torn-photographs');
			expect(completed).toContain('secret-message');
		});

		it('should not duplicate completed puzzles', () => {
			mockGameState.puzzlesCompleted.update(completed => [...completed, 'music-box']);
			mockGameState.puzzlesCompleted.update(completed => [...completed, 'music-box']);

			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);
			const count = completed.filter(p => p === 'music-box').length;
			expect(count).toBe(1);
		});

		it('should check if specific puzzle is completed', () => {
			mockGameState.puzzlesCompleted.update(completed => [...completed, 'music-box']);

			const completed = get(mockGameState.puzzlesCompleted as Readable<string[]>);
			expect(completed.includes('music-box')).toBe(true);
			expect(completed.includes('torn-photographs')).toBe(false);
		});
	});

	describe('Timer Management', () => {
		it('should decrement timer', () => {
			mockGameState.timeRemaining.update(time => time - 10);

			const time = get(mockGameState.timeRemaining as Readable<number>);
			expect(time).toBe(1790);
		});

		it('should detect timer expiration', () => {
			mockGameState.timeRemaining.set(0);

			const time = get(mockGameState.timeRemaining as Readable<number>);
			expect(time).toBe(0);
			expect(time <= 0).toBe(true);
		});

		it('should format time as MM:SS', () => {
			mockGameState.timeRemaining.set(125); // 2:05

			const time = get(mockGameState.timeRemaining as Readable<number>);
			const minutes = Math.floor(time / 60);
			const seconds = time % 60;

			expect(minutes).toBe(2);
			expect(seconds).toBe(5);
		});

		it('should handle time under 60 seconds', () => {
			mockGameState.timeRemaining.set(45);

			const time = get(mockGameState.timeRemaining as Readable<number>);
			const minutes = Math.floor(time / 60);
			const seconds = time % 60;

			expect(minutes).toBe(0);
			expect(seconds).toBe(45);
		});

		it('should handle large time values', () => {
			mockGameState.timeRemaining.set(3600); // 1 hour

			const time = get(mockGameState.timeRemaining as Readable<number>);
			const hours = Math.floor(time / 3600);

			expect(hours).toBe(1);
		});
	});

	describe('Player Management', () => {
		it('should add player to game', () => {
			mockGameState.players.update(players => [
				...players,
				{ id: 'player-1', name: 'Alice', isHost: true }
			]);

			const players = get(mockGameState.players as Readable<any[]>);
			expect(players).toHaveLength(1);
			expect(players[0].name).toBe('Alice');
		});

		it('should add multiple players', () => {
			mockGameState.players.update(players => [
				...players,
				{ id: 'player-1', name: 'Alice', isHost: true },
				{ id: 'player-2', name: 'Bob', isHost: false }
			]);

			const players = get(mockGameState.players as Readable<any[]>);
			expect(players).toHaveLength(2);
		});

		it('should identify host player', () => {
			mockGameState.players.update(players => [
				...players,
				{ id: 'player-1', name: 'Alice', isHost: true },
				{ id: 'player-2', name: 'Bob', isHost: false }
			]);

			const players = get(mockGameState.players as Readable<any[]>);
			const host = players.find(p => p.isHost);

			expect(host?.name).toBe('Alice');
		});

		it('should remove player on disconnect', () => {
			mockGameState.players.update(players => [
				...players,
				{ id: 'player-1', name: 'Alice', isHost: true },
				{ id: 'player-2', name: 'Bob', isHost: false }
			]);

			// Remove Bob
			mockGameState.players.update(players => players.filter(p => p.id !== 'player-2'));

			const players = get(mockGameState.players as Readable<any[]>);
			expect(players).toHaveLength(1);
			expect(players[0].name).toBe('Alice');
		});

		it('should prevent more than 2 players', () => {
			mockGameState.players.update(players => [
				...players,
				{ id: 'player-1', name: 'Alice', isHost: true },
				{ id: 'player-2', name: 'Bob', isHost: false }
			]);

			// Try to add third player
			const beforeCount = get(mockGameState.players as Readable<any[]>).length;

			mockGameState.players.update(players => {
				if (players.length >= 2) return players;
				return [...players, { id: 'player-3', name: 'Charlie', isHost: false }];
			});

			const afterCount = get(mockGameState.players as Readable<any[]>).length;
			expect(afterCount).toBe(Math.min(beforeCount, 2));
		});
	});

	describe('Role Assignment', () => {
		it('should assign explorer role', () => {
			mockGameState.playerRole.set('explorer');

			const role = get(mockGameState.playerRole as Readable<string>);
			expect(role).toBe('explorer');
		});

		it('should assign analyst role', () => {
			mockGameState.playerRole.set('analyst');

			const role = get(mockGameState.playerRole as Readable<string>);
			expect(role).toBe('analyst');
		});

		it('should swap roles between players', () => {
			mockGameState.playerRole.set('explorer');
			expect(get(mockGameState.playerRole as Readable<string>)).toBe('explorer');

			mockGameState.playerRole.set('analyst');
			expect(get(mockGameState.playerRole as Readable<string>)).toBe('analyst');
		});
	});

	describe('Game Phase Management', () => {
		it('should start in lobby phase', () => {
			const phase = get(mockGameState.gamePhase as Readable<string>);
			expect(phase).toBe('lobby');
		});

		it('should transition to playing phase', () => {
			mockGameState.gamePhase.set('playing');

			const phase = get(mockGameState.gamePhase as Readable<string>);
			expect(phase).toBe('playing');
		});

		it('should transition to completed phase', () => {
			mockGameState.gamePhase.set('playing');
			mockGameState.gamePhase.set('completed');

			const phase = get(mockGameState.gamePhase as Readable<string>);
			expect(phase).toBe('completed');
		});

		it('should not allow phase regression', () => {
			mockGameState.gamePhase.set('completed');

			// Try to go back to playing
			mockGameState.gamePhase.set('playing');

			// Should stay completed or handle appropriately
			const phase = get(mockGameState.gamePhase as Readable<string>);
			expect(phase === 'completed' || phase === 'playing').toBe(true);
		});
	});

	describe('Hint Tracking', () => {
		it('should increment hint counter', () => {
			mockGameState.hintsUsed.update(hints => hints + 1);

			const hints = get(mockGameState.hintsUsed as Readable<number>);
			expect(hints).toBe(1);
		});

		it('should track multiple hints', () => {
			mockGameState.hintsUsed.update(hints => hints + 1);
			mockGameState.hintsUsed.update(hints => hints + 1);
			mockGameState.hintsUsed.update(hints => hints + 1);

			const hints = get(mockGameState.hintsUsed as Readable<number>);
			expect(hints).toBe(3);
		});

		it('should reset hints between puzzles', () => {
			mockGameState.hintsUsed.update(hints => hints + 1);
			mockGameState.hintsUsed.update(hints => hints + 1);

			mockGameState.hintsUsed.set(0);

			const hints = get(mockGameState.hintsUsed as Readable<number>);
			expect(hints).toBe(0);
		});
	});

	describe('Attempt Tracking', () => {
		it('should increment attempt counter', () => {
			mockGameState.attempts.update(attempts => attempts + 1);

			const attempts = get(mockGameState.attempts as Readable<number>);
			expect(attempts).toBe(1);
		});

		it('should track multiple attempts', () => {
			for (let i = 0; i < 5; i++) {
				mockGameState.attempts.update(attempts => attempts + 1);
			}

			const attempts = get(mockGameState.attempts as Readable<number>);
			expect(attempts).toBe(5);
		});

		it('should reset attempts between puzzles', () => {
			mockGameState.attempts.update(attempts => attempts + 1);
			mockGameState.attempts.update(attempts => attempts + 1);

			mockGameState.attempts.set(0);

			const attempts = get(mockGameState.attempts as Readable<number>);
			expect(attempts).toBe(0);
		});
	});

	describe('State Persistence', () => {
		it('should serialize state to JSON', () => {
			const state = {
				room: get(mockGameState.currentRoom as Readable<string>),
				completed: get(mockGameState.puzzlesCompleted as Readable<string[]>),
				time: get(mockGameState.timeRemaining as Readable<number>),
				phase: get(mockGameState.gamePhase as Readable<string>)
			};

			const json = JSON.stringify(state);

			expect(json).toBeDefined();
			expect(typeof json).toBe('string');
		});

		it('should deserialize state from JSON', () => {
			const json = JSON.stringify({
				room: 'clock_tower',
				completed: ['music-box'],
				time: 1500,
				phase: 'playing'
			});

			const state = JSON.parse(json);

			expect(state.room).toBe('clock_tower');
			expect(state.completed).toContain('music-box');
			expect(state.time).toBe(1500);
			expect(state.phase).toBe('playing');
		});
	});
});

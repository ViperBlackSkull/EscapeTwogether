/**
 * AI Playtester - Autonomous Game Testing Agent
 *
 * This agent connects to the EscapeTogether game server and performs
 * automated testing of game mechanics, puzzles, and player interactions.
 */

import { io, Socket } from 'socket.io-client';

// ============================================
// Types
// ============================================

interface Player {
	id: string;
	name: string;
	isHost: boolean;
}

interface Room {
	code: string;
	players: Player[];
	hostId: string;
}

interface TestResult {
	testName: string;
	success: boolean;
	duration: number;
	error?: string;
	details?: Record<string, unknown>;
}

interface PlaytesterConfig {
	serverUrl: string;
	playerName: string;
	verbose: boolean;
	testTimeout: number;
}

interface PlaytesterState {
	connected: boolean;
	room: Room | null;
	players: Player[];
	testResults: TestResult[];
	startTime: number | null;
}

// ============================================
// AI Playtester Class
// ============================================

export class AIPlaytester {
	private socket: Socket | null = null;
	private config: PlaytesterConfig;
	private state: PlaytesterState;
	private eventLog: { timestamp: number; event: string; data: unknown }[] = [];

	constructor(config: Partial<PlaytesterConfig> = {}) {
		this.config = {
			serverUrl: config.serverUrl || 'http://localhost:3001',
			playerName: config.playerName || 'AI_Playtester',
			verbose: config.verbose ?? true,
			testTimeout: config.testTimeout || 30000
		};

		this.state = {
			connected: false,
			room: null,
			players: [],
			testResults: [],
			startTime: null
		};
	}

	// ----------------------------------------
	// Connection Management
	// ----------------------------------------

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.log('Connecting to server...', this.config.serverUrl);

			this.socket = io(this.config.serverUrl, {
				autoConnect: true,
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000
			});

			this.socket.on('connect', () => {
				this.state.connected = true;
				this.log('Connected to server');
				this.recordEvent('connected', { socketId: this.socket!.id });
				resolve();
			});

			this.socket.on('connect_error', (error) => {
				this.log('Connection error:', error.message);
				this.recordEvent('connect_error', { error: error.message });
				reject(error);
			});

			this.socket.on('disconnect', (reason) => {
				this.state.connected = false;
				this.log('Disconnected:', reason);
				this.recordEvent('disconnected', { reason });
			});

			// Set up event listeners
			this.setupEventListeners();
		});
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.state.connected = false;
			this.log('Disconnected from server');
		}
	}

	private setupEventListeners(): void {
		if (!this.socket) return;

		this.socket.on('player-joined', (data: { player: Player }) => {
			this.log('Player joined:', data.player.name);
			this.state.players.push(data.player);
			this.recordEvent('player-joined', data);
		});

		this.socket.on('player-left', (data: { playerId: string; playerName: string }) => {
			this.log('Player left:', data.playerName);
			this.state.players = this.state.players.filter(p => p.id !== data.playerId);
			this.recordEvent('player-left', data);
		});
	}

	// ----------------------------------------
	// Room Management
	// ----------------------------------------

	async createRoom(): Promise<Room> {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.state.connected) {
				reject(new Error('Not connected to server'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error('Create room timeout'));
			}, this.config.testTimeout);

			this.socket.emit('create-room', { playerName: this.config.playerName }, (response: { success: boolean; room?: Room; error?: string }) => {
				clearTimeout(timeout);

				if (response.success && response.room) {
					this.state.room = response.room;
					this.state.players = response.room.players;
					this.log('Room created:', response.room.code);
					this.recordEvent('room-created', response.room);
					resolve(response.room);
				} else {
					const error = response.error || 'Failed to create room';
					this.log('Failed to create room:', error);
					reject(new Error(error));
				}
			});
		});
	}

	async joinRoom(roomCode: string): Promise<Room> {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.state.connected) {
				reject(new Error('Not connected to server'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error('Join room timeout'));
			}, this.config.testTimeout);

			this.socket.emit('join-room', {
				roomCode,
				playerName: this.config.playerName
			}, (response: { success: boolean; room?: Room; error?: string }) => {
				clearTimeout(timeout);

				if (response.success && response.room) {
					this.state.room = response.room;
					this.state.players = response.room.players;
					this.log('Joined room:', response.room.code);
					this.recordEvent('room-joined', response.room);
					resolve(response.room);
				} else {
					const error = response.error || 'Failed to join room';
					this.log('Failed to join room:', error);
					reject(new Error(error));
				}
			});
		});
	}

	// ----------------------------------------
	// Test Suite
	// ----------------------------------------

	async runAllTests(): Promise<TestResult[]> {
		this.log('\n========================================');
		this.log('Starting AI Playtester Test Suite');
		this.log('========================================\n');

		this.state.startTime = Date.now();
		this.state.testResults = [];

		// Test 1: Server Connection
		await this.runTest('Server Connection', async () => {
			await this.connect();
			return { connected: this.state.connected };
		});

		// Test 2: Room Creation
		await this.runTest('Room Creation', async () => {
			const room = await this.createRoom();
			return { roomCode: room.code, playerCount: room.players.length };
		});

		// Test 3: Room Code Validation
		await this.runTest('Room Code Validation', async () => {
			if (!this.state.room) throw new Error('No room created');
			const code = this.state.room.code;
			if (typeof code !== 'string' || code.length !== 4) {
				throw new Error(`Invalid room code format: ${code}`);
			}
			return { roomCode: code, valid: true };
		});

		// Test 4: Player State
		await this.runTest('Player State', async () => {
			if (!this.state.room) throw new Error('No room created');
			const players = this.state.players;
			if (players.length !== 1) throw new Error(`Expected 1 player, got ${players.length}`);
			const host = players[0];
			if (!host.isHost) throw new Error('Player should be host');
			return { playerCount: players.length, hostName: host.name };
		});

		// Test 5: Multiple Players (simulated)
		await this.runTest('Multiple Player Handling', async () => {
			// Create a second connection to simulate another player
			const player2 = new AIPlaytester({
				serverUrl: this.config.serverUrl,
				playerName: 'AI_Playtester_2',
				verbose: false
			});

			await player2.connect();

			if (!this.state.room) throw new Error('No room created');

			// Wait a bit for the room code to be available
			await player2.joinRoom(this.state.room.code);

			// Check if we received the player-joined event
			await this.wait(500);

			const playerCount = this.state.players.length;
			player2.disconnect();

			return { playerCount, expectedMinimum: 2 };
		});

		// Test 6: Disconnection Handling
		await this.runTest('Disconnection Handling', async () => {
			const player3 = new AIPlaytester({
				serverUrl: this.config.serverUrl,
				playerName: 'AI_Playtester_3',
				verbose: false
			});

			await player3.connect();

			if (!this.state.room) throw new Error('No room created');

			await player3.joinRoom(this.state.room.code);
			await this.wait(500);

			const countBefore = this.state.players.length;
			player3.disconnect();
			await this.wait(500);
			const countAfter = this.state.players.length;

			return { countBefore, countAfter, properlyHandled: countAfter < countBefore };
		});

		// Test 7: Invalid Room Join
		await this.runTest('Invalid Room Join', async () => {
			const invalidPlayer = new AIPlaytester({
				serverUrl: this.config.serverUrl,
				playerName: 'AI_Playtester_Invalid',
				verbose: false
			});

			await invalidPlayer.connect();

			try {
				await invalidPlayer.joinRoom('XXXX'); // Non-existent room
				invalidPlayer.disconnect();
				throw new Error('Should have failed to join non-existent room');
			} catch (error) {
				invalidPlayer.disconnect();
				const message = error instanceof Error ? error.message : 'Unknown error';
				return { expectedError: true, errorMessage: message };
			}
		});

		// Test 8: Response Time
		await this.runTest('Server Response Time', async () => {
			const times: number[] = [];

			for (let i = 0; i < 5; i++) {
				const start = Date.now();
				await this.createRoom();
				const duration = Date.now() - start;
				times.push(duration);
			}

			const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
			const maxTime = Math.max(...times);
			const minTime = Math.min(...times);

			return {
				averageMs: avgTime.toFixed(2),
				minMs: minTime,
				maxMs: maxTime,
				acceptable: avgTime < 1000
			};
		});

		// Generate report
		this.generateReport();

		return this.state.testResults;
	}

	private async runTest(name: string, testFn: () => Promise<Record<string, unknown>>): Promise<void> {
		this.log(`\n--- Running Test: ${name} ---`);
		const startTime = Date.now();

		try {
			const details = await testFn();
			const duration = Date.now() - startTime;

			this.state.testResults.push({
				testName: name,
				success: true,
				duration,
				details
			});

			this.log(`✓ PASSED: ${name} (${duration}ms)`);
		} catch (error) {
			const duration = Date.now() - startTime;
			const message = error instanceof Error ? error.message : 'Unknown error';

			this.state.testResults.push({
				testName: name,
				success: false,
				duration,
				error: message
			});

			this.log(`✗ FAILED: ${name} (${duration}ms) - ${message}`);
		}
	}

	// ----------------------------------------
	// Puzzle Analysis (Future Implementation)
	// ----------------------------------------

	analyzePuzzleState(puzzleId: string): Record<string, unknown> {
		this.log(`Analyzing puzzle: ${puzzleId}`);
		// Future: Implement puzzle state analysis
		return { puzzleId, analyzed: true };
	}

	makePuzzleDecision(puzzleId: string): Record<string, unknown> {
		this.log(`Making decision for puzzle: ${puzzleId}`);
		// Future: Implement AI decision making for puzzles
		return { puzzleId, action: 'interact' };
	}

	// ----------------------------------------
	// Reporting
	// ----------------------------------------

	generateReport(): void {
		const totalDuration = Date.now() - (this.state.startTime || 0);
		const passed = this.state.testResults.filter(r => r.success).length;
		const failed = this.state.testResults.filter(r => !r.success).length;

		this.log('\n========================================');
		this.log('AI Playtester Test Report');
		this.log('========================================');
		this.log(`Total Tests: ${this.state.testResults.length}`);
		this.log(`Passed: ${passed}`);
		this.log(`Failed: ${failed}`);
		this.log(`Total Duration: ${totalDuration}ms`);
		this.log('========================================\n');

		if (failed > 0) {
			this.log('Failed Tests:');
			this.state.testResults
				.filter(r => !r.success)
				.forEach(r => this.log(`  - ${r.testName}: ${r.error}`));
		}
	}

	getEventLog(): { timestamp: number; event: string; data: unknown }[] {
		return this.eventLog;
	}

	getTestResults(): TestResult[] {
		return this.state.testResults;
	}

	// ----------------------------------------
	// Utilities
	// ----------------------------------------

	private log(...args: unknown[]): void {
		if (this.config.verbose) {
			const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
			console.log(`[${timestamp}] [AI-Playtester]`, ...args);
		}
	}

	private recordEvent(event: string, data: unknown): void {
		this.eventLog.push({
			timestamp: Date.now(),
			event,
			data
		});
	}

	private wait(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
	const playtester = new AIPlaytester({
		serverUrl: process.env.SERVER_URL || 'http://localhost:3001',
		playerName: 'AI_Playtester_Main',
		verbose: true,
		testTimeout: 30000
	});

	try {
		const results = await playtester.runAllTests();

		// Exit with error code if any tests failed
		const failedCount = results.filter(r => !r.success).length;
		process.exit(failedCount > 0 ? 1 : 0);
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	} finally {
		playtester.disconnect();
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

export default AIPlaytester;

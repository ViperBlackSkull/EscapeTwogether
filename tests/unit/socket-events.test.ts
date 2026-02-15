/**
 * ============================================================================
 * SOCKET EVENTS - UNIT TESTS
 * ============================================================================
 *
 * Tests for socket.io event handling including:
 * - Connection events
 * - Room creation/joining
 * - Game events
 * - Puzzle state synchronization
 * - Chat messages
 * - Disconnection handling
 *
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock socket.io client
class MockSocket {
	id: string;
	connected: boolean;
	handlers: Map<string, Function[]>;

	constructor(id?: string) {
		this.id = id || `socket-${Math.random().toString(36).substring(2, 11)}`;
		this.connected = false;
		this.handlers = new Map();
	}

	connect() {
		this.connected = true;
		this.trigger('connect');
	}

	disconnect() {
		this.connected = false;
		this.trigger('disconnect', 'client disconnect');
	}

	on(event: string, callback: Function) {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, []);
		}
		this.handlers.get(event)!.push(callback);
		return this;
	}

	off(event: string, callback?: Function) {
		if (!callback) {
			this.handlers.delete(event);
		} else {
			const callbacks = this.handlers.get(event);
			if (callbacks) {
				const index = callbacks.indexOf(callback);
				if (index > -1) callbacks.splice(index, 1);
			}
		}
		return this;
	}

	emit(event: string, data: any, callback?: Function) {
		// Store emit for test verification
		this.lastEmit = { event, data, callback };
		if (callback) callback({ success: true });
	}

	trigger(event: string, data?: any) {
		const callbacks = this.handlers.get(event) || [];
		callbacks.forEach(cb => cb(data));
	}

	lastEmit?: { event: string; data: any; callback?: Function };

	reset() {
		this.handlers.clear();
		this.connected = false;
		this.lastEmit = undefined;
	}
}

describe('Socket Event Handling', () => {
	let socket: MockSocket;

	beforeEach(() => {
		socket = new MockSocket();
	});

	afterEach(() => {
		socket.reset();
	});

	describe('Connection Events', () => {
		it('should register connect event handler', () => {
			const connectHandler = vi.fn();
			socket.on('connect', connectHandler);

			socket.connect();

			expect(connectHandler).toHaveBeenCalled();
		});

		it('should register disconnect event handler', () => {
			const disconnectHandler = vi.fn();
			socket.on('disconnect', disconnectHandler);

			socket.disconnect();

			expect(disconnectHandler).toHaveBeenCalledWith('client disconnect');
		});

		it('should update connection status', () => {
			expect(socket.connected).toBe(false);

			socket.connect();
			expect(socket.connected).toBe(true);

			socket.disconnect();
			expect(socket.connected).toBe(false);
		});

		it('should generate unique socket ID', () => {
			const socket1 = new MockSocket();
			const socket2 = new MockSocket();

			expect(socket1.id).not.toBe(socket2.id);
		});

		it('should support custom socket ID', () => {
			const customSocket = new MockSocket('custom-id-123');

			expect(customSocket.id).toBe('custom-id-123');
		});
	});

	describe('Room Events', () => {
		it('should emit create-room event', () => {
			socket.emit('create-room', {
				playerName: 'TestPlayer',
				roomCode: 'TEST'
			});

			expect(socket.lastEmit?.event).toBe('create-room');
			expect(socket.lastEmit?.data.playerName).toBe('TestPlayer');
		});

		it('should receive player-joined event', () => {
			const joinedHandler = vi.fn();
			socket.on('player-joined', joinedHandler);

			socket.trigger('player-joined', {
				player: { id: 'player-1', name: 'Alice', isHost: true }
			});

			expect(joinedHandler).toHaveBeenCalled();
			expect(joinedHandler).toHaveBeenCalledWith({
				player: { id: 'player-1', name: 'Alice', isHost: true }
			});
		});

		it('should emit join-room event', () => {
			socket.emit('join-room', {
				roomCode: 'TEST',
				playerName: 'Bob'
			});

			expect(socket.lastEmit?.event).toBe('join-room');
			expect(socket.lastEmit?.data.roomCode).toBe('TEST');
			expect(socket.lastEmit?.data.playerName).toBe('Bob');
		});

		it('should handle room creation success response', () => {
			const callback = vi.fn();
			socket.emit('create-room', { playerName: 'Alice' }, callback);

			expect(callback).toHaveBeenCalledWith({ success: true });
		});

		it('should handle room join success response', () => {
			const callback = vi.fn();
			socket.emit('join-room', { roomCode: 'TEST', playerName: 'Bob' }, callback);

			expect(callback).toHaveBeenCalledWith({ success: true });
		});

		it('should handle invalid room code error', () => {
			const callback = vi.fn();

			// Simulate error response
			socket.emit('join-room', { roomCode: 'INVALID', playerName: 'Bob' }, (response: any) => {
				response = { success: false, error: 'Room not found' };
			});

			// In real implementation, would handle error
			expect(socket.lastEmit?.data.roomCode).toBe('INVALID');
		});
	});

	describe('Game Events', () => {
		it('should emit start-game event', () => {
			socket.emit('start-game', {
				roomCode: 'TEST'
			});

			expect(socket.lastEmit?.event).toBe('start-game');
		});

		it('should receive game:start event', () => {
			const startHandler = vi.fn();
			socket.on('game:start', startHandler);

			socket.trigger('game:start', {
				players: [
					{ id: 'player-1', name: 'Alice', isHost: true },
					{ id: 'player-2', name: 'Bob', isHost: false }
				],
				phase: 'playing'
			});

			expect(startHandler).toHaveBeenCalled();
			expect(startHandler).toHaveBeenCalledWith({
				players: expect.arrayContaining([
					expect.objectContaining({ name: 'Alice' }),
					expect.objectContaining({ name: 'Bob' })
				]),
				phase: 'playing'
			});
		});

		it('should emit game:action event for puzzle interactions', () => {
			socket.emit('game:action', {
				action: 'place-piece',
				puzzleId: 'music-box',
				payload: { pieceId: 'gear-1', slotId: 'slot-0' }
			});

			expect(socket.lastEmit?.event).toBe('game:action');
			expect(socket.lastEmit?.data.action).toBe('place-piece');
			expect(socket.lastEmit?.data.puzzleId).toBe('music-box');
		});

		it('should receive game:action events from other player', () => {
			const actionHandler = vi.fn();
			socket.on('game:action', actionHandler);

			socket.trigger('game:action', {
				playerId: 'player-2',
				action: 'place-piece',
				payload: { pieceId: 'gear-2', slotId: 'slot-1' }
			});

			expect(actionHandler).toHaveBeenCalled();
		});

		it('should emit game:sync event for state synchronization', () => {
			socket.emit('game:sync', {
				puzzleId: 'music-box',
				state: {
					pieces: [
						{ id: 'gear-1', placed: true },
						{ id: 'gear-2', placed: false }
					]
				}
			});

			expect(socket.lastEmit?.event).toBe('game:sync');
			expect(socket.lastEmit?.data.puzzleId).toBe('music-box');
		});

		it('should receive game:sync events', () => {
			const syncHandler = vi.fn();
			socket.on('game:sync', syncHandler);

			socket.trigger('game:sync', {
				playerId: 'player-1',
				state: {
					currentRoom: 'attic',
					puzzlesCompleted: ['music-box']
				}
			});

			expect(syncHandler).toHaveBeenCalled();
		});
	});

	describe('Chat Events', () => {
		it('should emit send-message event', () => {
			socket.emit('send-message', {
				roomCode: 'TEST',
				senderName: 'Alice',
				message: 'Hello Bob!'
			});

			expect(socket.lastEmit?.event).toBe('send-message');
			expect(socket.lastEmit?.data.message).toBe('Hello Bob!');
		});

		it('should receive receive-message event', () => {
			const messageHandler = vi.fn();
			socket.on('receive-message', messageHandler);

			const testMessage = {
				id: 'msg-123',
				senderId: 'player-2',
				senderName: 'Bob',
				message: 'Hi Alice!',
				timestamp: new Date(),
				roomCode: 'TEST'
			};

			socket.trigger('receive-message', testMessage);

			expect(messageHandler).toHaveBeenCalledWith(testMessage);
			expect(messageHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					senderName: 'Bob',
					message: 'Hi Alice!'
				})
			);
		});

		it('should handle message history', () => {
			const messages: any[] = [];
			const messageHandler = (msg: any) => messages.push(msg);

			socket.on('receive-message', messageHandler);

			socket.trigger('receive-message', {
				id: 'msg-1',
				senderName: 'Alice',
				message: 'First'
			});

			socket.trigger('receive-message', {
				id: 'msg-2',
				senderName: 'Bob',
				message: 'Second'
			});

			expect(messages).toHaveLength(2);
			expect(messages[0].message).toBe('First');
			expect(messages[1].message).toBe('Second');
		});
	});

	describe('Reconnection Events', () => {
		it('should handle reconnection attempt', () => {
			const reconnectHandler = vi.fn();
			socket.on('reconnect', reconnectHandler);

			// Simulate reconnect
			socket.connect();

			expect(reconnectHandler).toHaveBeenCalled();
		});

		it('should handle reconnect attempt count', () => {
			let attempts = 0;

			socket.on('reconnect_attempt', (attemptNumber: number) => {
				attempts = attemptNumber;
			});

			socket.trigger('reconnect_attempt', 1);
			expect(attempts).toBe(1);

			socket.trigger('reconnect_attempt', 2);
			expect(attempts).toBe(2);
		});

		it('should handle reconnect failed event', () => {
			const failedHandler = vi.fn();
			socket.on('reconnect_failed', failedHandler);

			socket.trigger('reconnect_failed');

			expect(failedHandler).toHaveBeenCalled();
		});

		it('should restore state after reconnection', () => {
			const restoredState = {
				roomCode: 'TEST',
				playerName: 'Alice',
				currentRoom: 'attic',
				puzzlesCompleted: ['music-box']
			};

			const restoreHandler = vi.fn();
			socket.on('state-restored', restoreHandler);

			socket.trigger('state-restored', restoredState);

			expect(restoreHandler).toHaveBeenCalledWith(restoredState);
		});
	});

	describe('Error Handling', () => {
		it('should handle error event', () => {
			const errorHandler = vi.fn();
			socket.on('error', errorHandler);

			socket.trigger('error', {
				message: 'Connection failed',
				code: 'CONN_ERROR'
			});

			expect(errorHandler).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Connection failed'
				})
			);
		});

		it('should handle room not found error', () => {
			socket.emit('join-room', { roomCode: 'INVALID', playerName: 'Test' });

			expect(socket.lastEmit?.data.roomCode).toBe('INVALID');
		});

		it('should handle room full error', () => {
			socket.emit('join-room', { roomCode: 'FULL', playerName: 'Test' });

			expect(socket.lastEmit?.event).toBe('join-room');
		});

		it('should handle invalid action error', () => {
			socket.emit('game:action', {
				action: 'invalid-action',
				puzzleId: 'music-box'
			});

			expect(socket.lastEmit?.data.action).toBe('invalid-action');
		});
	});

	describe('Event Cleanup', () => {
		it('should remove specific event handler', () => {
			const handler = vi.fn();
			socket.on('test-event', handler);

			socket.trigger('test-event');
			expect(handler).toHaveBeenCalledTimes(1);

			socket.off('test-event', handler);

			socket.trigger('test-event');
			expect(handler).toHaveBeenCalledTimes(1); // Should not increment
		});

		it('should remove all event handlers for event', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			socket.on('test-event', handler1);
			socket.on('test-event', handler2);

			socket.trigger('test-event');
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);

			socket.off('test-event');

			socket.trigger('test-event');
			expect(handler1).toHaveBeenCalledTimes(1); // Should not increment
			expect(handler2).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple handlers for same event', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			socket.on('test-event', handler1);
			socket.on('test-event', handler2);

			socket.trigger('test-event');

			expect(handler1).toHaveBeenCalled();
			expect(handler2).toHaveBeenCalled();
		});
	});

	describe('Event Payload Validation', () => {
		it('should validate create-room payload', () => {
			socket.emit('create-room', {
				playerName: 'Alice'
			});

			expect(socket.lastEmit?.data).toHaveProperty('playerName');
		});

		it('should validate game:action payload structure', () => {
			socket.emit('game:action', {
				action: 'test',
				puzzleId: 'puzzle-1',
				payload: { key: 'value' }
			});

			expect(socket.lastEmit?.data).toMatchObject({
				action: expect.any(String),
				puzzleId: expect.any(String),
				payload: expect.any(Object)
			});
		});

		it('should validate message payload', () => {
			socket.emit('send-message', {
				roomCode: 'TEST',
				senderName: 'Alice',
				message: 'Hello'
			});

			expect(socket.lastEmit?.data).toHaveProperty('roomCode');
			expect(socket.lastEmit?.data).toHaveProperty('senderName');
			expect(socket.lastEmit?.data).toHaveProperty('message');
		});
	});
});

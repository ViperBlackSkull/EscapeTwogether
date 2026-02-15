import { io, Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { writable, get, type Writable } from 'svelte/store';
import {
	gameState,
	handleStateUpdate,
	handleFullStateUpdate,
	setRoomCode as setStoreRoomCode,
	setGamePhase
} from '$lib/stores/gameState';
import type { GameState } from '$lib/types';

export interface Player {
	id: string;
	name: string;
	isHost: boolean;
	connected?: boolean;
}

export interface Room {
	code: string;
	players: Player[];
	hostId: string;
}

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	message: string;
	timestamp: Date;
	roomCode: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Socket singleton
let socket: Socket | null = null;

// Stores for reactive state
export const isConnected: Writable<boolean> = writable(false);
export const connectionStatus: Writable<ConnectionStatus> = writable('disconnected');
export const currentRoom: Writable<Room | null> = writable(null);
export const players: Writable<Player[]> = writable([]);
export const chatMessages: Writable<ChatMessage[]> = writable([]);
export const isGamePaused: Writable<boolean> = writable(false);
export const pauseInfo: Writable<{ pausedBy: string; pausedByName: string; pausedAt: Date } | null> = writable(null);

// Reconnection state
let playerName: string | null = null;
let pendingRejoin: { roomCode: string; wasHost: boolean } | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Initialize socket event handlers
function initializeSocketHandlers(): void {
	if (!socket) return;

	// Connection events
	socket.on('connect', () => {
			console.log('Connected to server');
			isConnected.set(true);
			connectionStatus.set('connected');
			reconnectAttempts = 0;

			// Auto-rejoin room if we were in one
			if (pendingRejoin && playerName) {
				console.log('Attempting to rejoin room after reconnection:', pendingRejoin.roomCode);
				attemptRejoin();
			}
		});

		socket.on('disconnect', (reason) => {
			console.log('Disconnected from server:', reason);
			isConnected.set(false);

			// Save room info for rejoining
			const room = get(currentRoom);
			if (room) {
				const player = room.players.find(p => p.id === socket?.id);
				pendingRejoin = {
					roomCode: room.code,
					wasHost: player?.isHost ?? false
				};
			}

			// Set appropriate status based on reason
			if (reason === 'io server disconnect') {
				// Server explicitly disconnected, don't auto-reconnect
				connectionStatus.set('disconnected');
			} else {
				connectionStatus.set('reconnecting');
			}
		});

		socket.io.on('reconnect_attempt', (attempt) => {
			console.log(`Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
			reconnectAttempts = attempt;
			connectionStatus.set('reconnecting');
		});

		socket.io.on('reconnect_failed', () => {
			console.error('Reconnection failed after maximum attempts');
			connectionStatus.set('disconnected');
			pendingRejoin = null;
		});

		socket.io.on('reconnect', (attemptNumber) => {
			console.log(`Successfully reconnected after ${attemptNumber} attempts`);
		});

		socket.on('connect_error', (error) => {
			console.error('Connection error:', error.message);
			if (reconnectAttempts === 0) {
				connectionStatus.set('connecting');
			}
		});

		// Player events
		socket.on('player-joined', (data: { player: Player }) => {
			console.log('Player joined:', data.player);
			players.update((current) => {
				// Check if player already exists to prevent duplicates
				if (current.some(p => p.id === data.player.id)) {
					return current;
				}
				return [...current, data.player];
			});

			// Update current room if we have it
			currentRoom.update((room) => {
				if (room) {
					return {
						...room,
						players: [...room.players, data.player]
					};
				}
				return room;
			});
		});

		socket.on('player-left', (data: { playerId: string; playerName: string }) => {
			console.log('Player left:', data.playerName);
			players.update((current) => current.filter((p) => p.id !== data.playerId));

			currentRoom.update((room) => {
				if (room) {
					return {
						...room,
						players: room.players.filter((p) => p.id !== data.playerId)
					};
				}
				return room;
			});
		});

		// Chat events
		socket.on('receive-message', (data: ChatMessage) => {
			console.log('Received message:', data);
			chatMessages.update((current) => [...current, data]);
		});

		// Pause/Resume events
		socket.on('game-paused', (data: { pausedBy: string; pausedByName: string; pausedAt: Date; roomCode: string }) => {
			console.log('Game paused by:', data.pausedByName);
			isGamePaused.set(true);
			pauseInfo.set({
				pausedBy: data.pausedBy,
				pausedByName: data.pausedByName,
				pausedAt: new Date(data.pausedAt)
			});
		});

		socket.on('game-resumed', (data: { resumedBy: string; resumedByName: string; pausedDuration: number; roomCode: string }) => {
			console.log('Game resumed by:', data.resumedByName, 'after', data.pausedDuration, 'ms');
			isGamePaused.set(false);
			pauseInfo.set(null);
		});

		// Game State Update events - synchronize game state via WebSocket
		socket.on('state_update', (data: Partial<GameState>) => {
			console.log('Received state_update:', data);
			handleStateUpdate(data);
		});

		socket.on('game:state', (data: GameState) => {
			console.log('Received full game state:', data);
			handleFullStateUpdate(data);
		});

		socket.on('game:start', (data) => {
			console.log('Game started:', data);
			// Handle game start - data might be full GameState or a simpler object
			if (data.players) {
				players.set(data.players);
			}
			setGamePhase('playing');
		});

		// Game action events from other players
		socket.on('game:action', (data: { playerId: string; playerName: string; action: string; payload: any; timestamp: number }) => {
			console.log('Received game action:', data);
			lastGameAction.set(data);
		});

		// Game sync events from other players
		socket.on('game:sync', (data: { playerId: string; state: any; timestamp: number }) => {
			console.log('Received game sync:', data);
			lastGameSync.set(data);
			// Also update the game state store
			if (data.state) {
				handleStateUpdate(data.state);
			}
		});
}

// Get the socket instance (creates it if needed)
export function getSocket(): Socket {
	if (!socket && browser) {
		// Use current hostname but port 3001 for backend
		// This allows the game to work on local network
		const protocol = window.location.protocol; // http: or https:
		const hostname = window.location.hostname;
		const socketUrl = `${protocol}//${hostname}:3001`;

		console.log('Connecting to backend at:', socketUrl);
		socket = io(socketUrl, {
			autoConnect: false,
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			randomizationFactor: 0.5
		});
		initializeSocketHandlers();
	}
	return socket as Socket;
}

// Get current player's socket ID
export function getCurrentPlayerId(): string | null {
	return socket?.id ?? null;
}

async function attemptRejoin(): Promise<void> {
	if (!pendingRejoin || !playerName || !socket) return;

	try {
		const response = await new Promise<{ success: boolean; room?: Room; error?: string }>(
			(resolve) => {
				socket!.emit('join-room', { roomCode: pendingRejoin!.roomCode, playerName }, resolve);
			}
		);

		if (response.success && response.room) {
			console.log('Successfully rejoined room after reconnection');
			currentRoom.set(response.room);
			players.set(response.room.players);
		} else {
			console.warn('Failed to rejoin room:', response.error);
			// Room may have been deleted
			currentRoom.set(null);
			players.set([]);
		}
	} catch (error) {
		console.error('Error during rejoin attempt:', error);
	} finally {
		pendingRejoin = null;
	}
}

export function connectSocket(): Socket {
	const sock = getSocket();
	if (!sock.connected) {
		connectionStatus.set('connecting');
		sock.connect();
	}
	return sock;
}

export function disconnectSocket(): void {
	if (socket && socket.connected) {
		pendingRejoin = null; // Don't try to rejoin after manual disconnect
		socket.disconnect();
		connectionStatus.set('disconnected');
	}
}

export function createRoom(name: string): Promise<{ success: boolean; room?: Room; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		if (!sock.connected) {
			connectionStatus.set('connecting');
			sock.connect();
		}

		playerName = name;

		sock.emit('create-room', { playerName: name }, (response: { success: boolean; room?: Room; error?: string }) => {
			if (response.success && response.room) {
				currentRoom.set(response.room);
				players.set(response.room.players);
			}
			resolve(response);
		});
	});
}

export function joinRoom(
	roomCode: string,
	name: string
): Promise<{ success: boolean; room?: Room; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		if (!sock.connected) {
			connectionStatus.set('connecting');
			sock.connect();
		}

		playerName = name;

		sock.emit('join-room', { roomCode, playerName: name }, (response: { success: boolean; room?: Room; error?: string }) => {
			if (response.success && response.room) {
				currentRoom.set(response.room);
				players.set(response.room.players);
			}
			resolve(response);
		});
	});
}

export function sendMessage(message: string): void {
	const sock = getSocket();
	const room = get(currentRoom);

	if (!sock.connected || !room) {
		console.error('Cannot send message: not connected or not in a room');
		return;
	}

	sock.emit('send-message', { message, roomCode: room.code });
}

export function clearChat(): void {
	chatMessages.set([]);
}

export function getReconnectAttempts(): number {
	return reconnectAttempts;
}

export function isReconnecting(): boolean {
	return get(connectionStatus) === 'reconnecting';
}

// Pause game
export function pauseGame(): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		const room = get(currentRoom);

		if (!sock.connected || !room) {
			resolve({ success: false, error: 'Not connected or not in a room' });
			return;
		}

		sock.emit('pause-game', { roomCode: room.code }, (response: { success: boolean; error?: string }) => {
			resolve(response);
		});
	});
}

// Resume game
export function resumeGame(): Promise<{ success: boolean; error?: string; pausedDuration?: number }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		const room = get(currentRoom);

		if (!sock.connected || !room) {
			resolve({ success: false, error: 'Not connected or not in a room' });
			return;
		}

		sock.emit('resume-game', { roomCode: room.code }, (response: { success: boolean; error?: string; pausedDuration?: number }) => {
			resolve(response);
		});
	});
}

// Game action callbacks - stores for reactive updates
export const lastGameAction: Writable<{ playerId: string; playerName: string; action: string; payload: any; timestamp: number } | null> = writable(null);
export const lastGameSync: Writable<{ playerId: string; state: any; timestamp: number } | null> = writable(null);

// Emit a game action to other players
export function emitGameAction(action: string, payload: any): void {
	const sock = getSocket();
	const room = get(currentRoom);

	if (!sock.connected || !room) {
		console.error('Cannot emit game action: not connected or not in a room');
		return;
	}

	sock.emit('game:action', { roomCode: room.code, action, payload });
}

// Emit a game state sync to other players
export function emitGameSync(state: any): void {
	const sock = getSocket();
	const room = get(currentRoom);

	if (!sock.connected || !room) {
		console.error('Cannot emit game sync: not connected or not in a room');
		return;
	}

	sock.emit('game:sync', { roomCode: room.code, state });
}

// Start the game (host only)
export function startGame(): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		const room = get(currentRoom);

		if (!sock.connected || !room) {
			resolve({ success: false, error: 'Not connected or not in a room' });
			return;
		}

		sock.emit('start-game', { roomCode: room.code }, (response: { success: boolean; error?: string }) => {
			resolve(response);
		});
	});
}

// Subscribe to game actions from other players
export function onGameAction(callback: (data: { playerId: string; playerName: string; action: string; payload: any; timestamp: number }) => void): () => void {
	const sock = getSocket();
	sock.on('game:action', callback);
	return () => sock.off('game:action', callback);
}

// Subscribe to game sync from other players
export function onGameSync(callback: (data: { playerId: string; state: any; timestamp: number }) => void): () => void {
	const sock = getSocket();
	sock.on('game:sync', callback);
	return () => sock.off('game:sync', callback);
}

export { socket };

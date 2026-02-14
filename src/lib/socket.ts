import { io, Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export interface Player {
	id: string;
	name: string;
	isHost: boolean;
}

export interface Room {
	code: string;
	players: Player[];
	hostId: string;
}

// Socket singleton
let socket: Socket | null = null;

// Stores for reactive state
export const isConnected: Writable<boolean> = writable(false);
export const currentRoom: Writable<Room | null> = writable(null);
export const players: Writable<Player[]> = writable([]);

function getSocket(): Socket {
	if (!socket && browser) {
		socket = io('http://localhost:3001', {
			autoConnect: false,
			transports: ['websocket', 'polling']
		});

		// Connection events
		socket.on('connect', () => {
			console.log('Connected to server');
			isConnected.set(true);
		});

		socket.on('disconnect', (reason) => {
			console.log('Disconnected from server:', reason);
			isConnected.set(false);
		});

		socket.on('connect_error', (error) => {
			console.error('Connection error:', error);
		});

		// Player events
		socket.on('player-joined', (data: { player: Player }) => {
			console.log('Player joined:', data.player);
			players.update((current) => [...current, data.player]);

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
	}

	return socket!;
}

export function connectSocket(): Socket {
	const sock = getSocket();
	if (!sock.connected) {
		sock.connect();
	}
	return sock;
}

export function disconnectSocket(): void {
	if (socket && socket.connected) {
		socket.disconnect();
	}
}

export function createRoom(playerName: string): Promise<{ success: boolean; room?: Room; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		if (!sock.connected) {
			sock.connect();
		}

		sock.emit('create-room', { playerName }, (response: { success: boolean; room?: Room; error?: string }) => {
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
	playerName: string
): Promise<{ success: boolean; room?: Room; error?: string }> {
	return new Promise((resolve) => {
		const sock = getSocket();
		if (!sock.connected) {
			sock.connect();
		}

		sock.emit('join-room', { roomCode, playerName }, (response: { success: boolean; room?: Room; error?: string }) => {
			if (response.success && response.room) {
				currentRoom.set(response.room);
				players.set(response.room.players);
			}
			resolve(response);
		});
	});
}

export { socket };

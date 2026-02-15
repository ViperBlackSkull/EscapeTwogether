/**
 * Game Audio Controller
 *
 * Centralized audio management for game events and state changes
 * Integrates room-specific audio, puzzle feedback, and music transitions
 */

import { soundManager } from './audio';
import type { RoomId } from './audio';

// ============================================
// Game Audio State
// ============================================

interface GameAudioState {
	currentRoom: RoomId | null;
	musicPlaying: boolean;
	ambientPlaying: boolean;
	volumeSettings: {
		master: number;
		music: number;
		sfx: number;
		ambience: number;
	};
}

const audioState: GameAudioState = {
	currentRoom: null,
	musicPlaying: false,
	ambientPlaying: false,
	volumeSettings: {
		master: 0.7,
		music: 0.6,
		sfx: 0.8,
		ambience: 0.5
	}
};

// ============================================
// Initialization
// ============================================

export async function initializeGameAudio(): Promise<void> {
	await soundManager.init();
	console.log('Game audio system initialized');
}

export function cleanupGameAudio(): void {
	soundManager.destroy();
	audioState.currentRoom = null;
	audioState.musicPlaying = false;
	audioState.ambientPlaying = false;
}

// ============================================
// Room Audio Management
// ============================================

export function enterRoom(roomId: RoomId): void {
	if (audioState.currentRoom === roomId) {
		return; // Already in this room
	}

	// Play room transition sound
	soundManager.play('room-transition');

	// Update room after short delay for transition sound
	setTimeout(() => {
		soundManager.setRoom(roomId);
		audioState.currentRoom = roomId;
		audioState.ambientPlaying = true;

		console.log(`Entered room: ${roomId}`);
	}, 500);
}

export function exitRoom(roomId: RoomId): void {
	console.log(`Exited room: ${roomId}`);
	// Audio continues during transition
}

// ============================================
// Music Management
// ============================================

export function startExplorationMusic(): void {
	soundManager.playMusic('music-exploration', 2.0);
	audioState.musicPlaying = true;
}

export function startTensionMusic(): void {
	soundManager.playMusic('music-tension', 1.0);
	audioState.musicPlaying = true;
}

export function stopBackgroundMusic(): void {
	soundManager.stopMusic(1.0);
	audioState.musicPlaying = false;
}

export function toggleMusic(): void {
	if (audioState.musicPlaying) {
		stopBackgroundMusic();
	} else {
		startExplorationMusic();
	}
}

// ============================================
// Puzzle Audio Feedback
// ============================================

export function onPuzzleStart(): void {
	soundManager.play('button-click');
}

export function onPuzzleAttempt(): void {
	soundManager.play('puzzle-attempt');
}

export function onPuzzleSolved(): void {
	soundManager.playPuzzleSolved();

	// Brief moment of celebration before continuing
	// Music continues automatically
}

export function onPuzzleError(): void {
	soundManager.playPuzzleError();
}

export function onPuzzleHint(): void {
	soundManager.playPuzzleHint();
}

// ============================================
// Game State Audio
// ============================================

export function onGameStart(): void {
	// Play game start sound
	soundManager.play('door-open');

	// Start exploration music after door sound
	setTimeout(() => {
		startExplorationMusic();
	}, 500);
}

export function onGameEnd(victory: boolean): void {
	if (victory) {
		soundManager.playVictory();
	} else {
		soundManager.playDefeat();
	}

	// Music is handled by the victory/defeat methods
	audioState.musicPlaying = false;
	audioState.ambientPlaying = false;
	audioState.currentRoom = null;
}

export function onPlayerJoin(): void {
	soundManager.playPlayerJoin();
}

export function onPlayerLeave(): void {
	soundManager.playPlayerLeave();
}

// ============================================
// UI Audio Feedback
// ============================================

export function onButtonClick(): void {
	soundManager.playClick();
}

export function onButtonHover(): void {
	soundManager.playHover();
}

export function onNotification(): void {
	soundManager.playNotification();
}

// ============================================
// Item Audio Feedback
// ============================================

export function onItemPickup(): void {
	soundManager.play('item-pickup');
}

export function onItemUse(): void {
	soundManager.play('item-use');
}

export function onDoorOpen(): void {
	soundManager.play('door-open');
}

export function onDoorLocked(): void {
	soundManager.play('door-locked');
}

// ============================================
// Multiplayer Audio
// ============================================

export function onMessageSent(): void {
	soundManager.playMessageSend();
}

export function onMessageReceived(): void {
	soundManager.playMessageReceive();
}

// ============================================
// Volume Control
// ============================================

export function setMasterVolume(volume: number): void {
	soundManager.setMasterVolume(volume);
	audioState.volumeSettings.master = volume;
}

export function setMusicVolume(volume: number): void {
	soundManager.setMusicVolume(volume);
	audioState.volumeSettings.music = volume;
}

export function setSfxVolume(volume: number): void {
	soundManager.setSfxVolume(volume);
	audioState.volumeSettings.sfx = volume;
}

export function setAmbienceVolume(volume: number): void {
	soundManager.setAmbientVolume(volume);
	audioState.volumeSettings.ambience = volume;
}

export function toggleMute(): boolean {
	return soundManager.toggleMute();
}

// ============================================
// Audio State Queries
// ============================================

export function getAudioState(): GameAudioState {
	return { ...audioState };
}

export function isInRoom(roomId: RoomId): boolean {
	return audioState.currentRoom === roomId;
}

export function isMusicPlaying(): boolean {
	return audioState.musicPlaying;
}

export function isAmbientPlaying(): boolean {
	return audioState.ambientPlaying;
}

// ============================================
// Room-Specific Audio Triggers
// ============================================

export function triggerRoomSpecificEvent(roomId: RoomId, event: string): void {
	switch (roomId) {
		case 'attic':
			handleAtticEvent(event);
			break;
		case 'clock-tower':
			handleClockTowerEvent(event);
			break;
		case 'garden':
			handleGardenEvent(event);
			break;
	}
}

function handleAtticEvent(event: string): void {
	switch (event) {
		case 'creak':
			soundManager.play('door-open');
			break;
		case 'wind':
			// Wind is part of ambient, no additional sound needed
			break;
		case 'item-found':
			onItemPickup();
			break;
		default:
			console.log(`Unknown attic event: ${event}`);
	}
}

function handleClockTowerEvent(event: string): void {
	switch (event) {
		case 'gear-turn':
			soundManager.play('item-use');
			break;
		case 'bell-chime':
			soundManager.playNotification();
			break;
		case 'clock-strike':
			soundManager.play('door-open');
			break;
		default:
			console.log(`Unknown clock tower event: ${event}`);
	}
}

function handleGardenEvent(event: string): void {
	switch (event) {
		case 'bird-chirp':
			// Birds are part of ambient
			break;
		case 'leaves-rustle':
			// Rustling is part of ambient
			break;
		case 'water-flow':
			soundManager.play('item-use');
			break;
		case 'item-found':
			onItemPickup();
			break;
		default:
			console.log(`Unknown garden event: ${event}`);
	}
}

// ============================================
// Default Export
// ============================================

export const gameAudio = {
	// Initialization
	initialize: initializeGameAudio,
	cleanup: cleanupGameAudio,

	// Room management
	enterRoom,
	exitRoom,

	// Music control
	startExplorationMusic,
	startTensionMusic,
	stopBackgroundMusic,
	toggleMusic,

	// Puzzle feedback
	onPuzzleStart,
	onPuzzleAttempt,
	onPuzzleSolved,
	onPuzzleError,
	onPuzzleHint,

	// Game state
	onGameStart,
	onGameEnd,
	onPlayerJoin,
	onPlayerLeave,

	// UI feedback
	onButtonClick,
	onButtonHover,
	onNotification,

	// Items
	onItemPickup,
	onItemUse,
	onDoorOpen,
	onDoorLocked,

	// Multiplayer
	onMessageSent,
	onMessageReceived,

	// Volume control
	setMasterVolume,
	setMusicVolume,
	setSfxVolume,
	setAmbienceVolume,
	toggleMute,

	// State queries
	getState: getAudioState,
	isInRoom,
	isMusicPlaying,
	isAmbientPlaying,

	// Room-specific events
	triggerRoomEvent: triggerRoomSpecificEvent
};

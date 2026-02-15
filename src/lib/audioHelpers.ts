/**
 * Audio Helper Utilities
 *
 * Convenient wrapper functions for common audio operations throughout the app
 * Integrates with puzzle events, game state changes, and UI interactions
 */

import { soundManager } from './audio';
import type { RoomId, SoundId } from './audio';

// ============================================
// UI Interaction Sounds
// ============================================

export function playButtonClick() {
	soundManager.playClick();
}

export function playButtonHover() {
	soundManager.playHover();
}

export function playNotification() {
	soundManager.playNotification();
}

// ============================================
// Puzzle Sounds
// ============================================

export function playPuzzleSolved() {
	soundManager.playPuzzleSolved();
}

export function playPuzzleAttempt() {
	soundManager.play('puzzle-attempt');
}

export function playPuzzleError() {
	soundManager.playPuzzleError();
}

export function playPuzzleHint() {
	soundManager.playPuzzleHint();
}

// ============================================
// Room & Navigation Sounds
// ============================================

export function playRoomTransition() {
	soundManager.play('room-transition');
}

export function playDoorOpen() {
	soundManager.play('door-open');
}

export function playDoorLocked() {
	soundManager.play('door-locked');
}

export function transitionToRoom(roomId: RoomId) {
	soundManager.transitionToRoom(roomId);
}

export function setRoomAmbient(roomId: RoomId) {
	soundManager.setRoom(roomId);
}

// ============================================
// Item Sounds
// ============================================

export function playItemPickup() {
	soundManager.play('item-pickup');
}

export function playItemUse() {
	soundManager.play('item-use');
}

// ============================================
// Multiplayer Sounds
// ============================================

export function playPlayerJoined() {
	soundManager.playPlayerJoin();
}

export function playPlayerLeft() {
	soundManager.playPlayerLeave();
}

export function playMessageSent() {
	soundManager.playMessageSend();
}

export function playMessageReceived() {
	soundManager.playMessageReceive();
}

// ============================================
// Game State Sounds
// ============================================

export function playVictoryMusic() {
	soundManager.playVictory();
}

export function playDefeatMusic() {
	soundManager.playDefeat();
}

export function playGameStart() {
	soundManager.startGame();
}

export function playGameEnd(victory: boolean) {
	soundManager.endGame(victory);
}

// ============================================
// Music Control
// ============================================

export function playExplorationMusic() {
	soundManager.playMusic('music-exploration');
}

export function playTensionMusic() {
	soundManager.playMusic('music-tension');
}

export function stopMusic() {
	soundManager.stopMusic();
}

export function stopAmbient() {
	soundManager.stopAmbient();
}

// ============================================
// Volume Control
// ============================================

export function toggleMute() {
	return soundManager.toggleMute();
}

export function setMasterVolume(volume: number) {
	soundManager.setMasterVolume(volume);
}

export function setMusicVolume(volume: number) {
	soundManager.setMusicVolume(volume);
}

export function setSfxVolume(volume: number) {
	soundManager.setSfxVolume(volume);
}

export function setAmbientVolume(volume: number) {
	soundManager.setAmbientVolume(volume);
}

// ============================================
// Custom Sound Playback
// ============================================

export function playSound(soundId: SoundId, options?: { volume?: number; rate?: number }) {
	soundManager.play(soundId, options);
}

// ============================================
// Puzzle Event Handlers
// ============================================

/**
 * Handle puzzle state changes with appropriate audio feedback
 */
export function handlePuzzleEvent(event: 'solved' | 'attempt' | 'error' | 'hint') {
	switch (event) {
		case 'solved':
			playPuzzleSolved();
			break;
		case 'attempt':
			playPuzzleAttempt();
			break;
		case 'error':
			playPuzzleError();
			break;
		case 'hint':
			playPuzzleHint();
			break;
	}
}

/**
 * Handle room changes with transition sounds and ambient updates
 */
export function handleRoomChange(newRoom: RoomId, transition = true) {
	if (transition) {
		transitionToRoom(newRoom);
	} else {
		setRoomAmbient(newRoom);
	}
}

/**
 * Initialize audio system (call on first user interaction)
 */
export async function initializeAudio() {
	await soundManager.init();
}

/**
 * Check if audio is initialized
 */
export function isAudioInitialized(): boolean {
	return (soundManager as any).initialized;
}

// ============================================
// Reactive Audio Hooks (for Svelte components)
// ============================================

/**
 * Create audio hooks for UI elements
 * Returns functions that can be bound to UI events
 */
export function createUIAudioHooks() {
	return {
		onClick: () => playButtonClick(),
		onHover: () => playButtonHover(),
		onFocus: () => playNotification()
	};
}

/**
 * Create audio hooks for puzzle components
 */
export function createPuzzleAudioHooks() {
	return {
		onSolved: () => playPuzzleSolved(),
		onAttempt: () => playPuzzleAttempt(),
		onError: () => playPuzzleError(),
		onHint: () => playPuzzleHint()
	};
}

/**
 * Create audio hooks for multiplayer components
 */
export function createMultiplayerAudioHooks() {
	return {
		onPlayerJoin: () => playPlayerJoined(),
		onPlayerLeave: () => playPlayerLeft(),
		onMessageSend: () => playMessageSent(),
		onMessageReceive: () => playMessageReceived()
	};
}

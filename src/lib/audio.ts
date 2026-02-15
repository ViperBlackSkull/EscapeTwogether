/**
 * Sound Manager - Audio system for EscapeTwogether
 *
 * Manages all game audio including:
 * - UI sounds (button clicks, notifications)
 * - Game sounds (puzzle solved, room transitions)
 * - Ambient background music
 * - Volume control and muting
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================
// Types
// ============================================

export type SoundId =
	| 'button-click'
	| 'button-hover'
	| 'notification'
	| 'puzzle-solved'
	| 'puzzle-attempt'
	| 'puzzle-error'
	| 'room-transition'
	| 'item-pickup'
	| 'item-use'
	| 'door-open'
	| 'door-locked'
	| 'player-join'
	| 'player-leave'
	| 'message-send'
	| 'message-receive'
	| 'victory'
	| 'defeat'
	| 'ambient-main'
	| 'ambient-tense'
	| 'ambient-relaxed';

export interface SoundConfig {
	id: SoundId;
	src: string;
	volume?: number;
	loop?: boolean;
	preload?: boolean;
}

interface AudioState {
	muted: boolean;
	masterVolume: number;
	musicVolume: number;
	sfxVolume: number;
	currentAmbient: SoundId | null;
}

// ============================================
// Audio Context & Stores
// ============================================

let audioContext: AudioContext | null = null;
const audioBuffers: Map<SoundId, AudioBuffer> = new Map();
const activeSources: Map<SoundId, AudioBufferSourceNode[]> = new Map();
const gainNodes: Map<SoundId, GainNode> = new Map();

// Svelte stores for reactive state
export const audioState = writable<AudioState>({
	muted: false,
	masterVolume: 0.7,
	musicVolume: 0.5,
	sfxVolume: 0.8,
	currentAmbient: null
});

export const isMuted = derived(audioState, ($state) => $state.muted);
export const masterVolume = derived(audioState, ($state) => $state.masterVolume);
export const musicVolume = derived(audioState, ($state) => $state.musicVolume);
export const sfxVolume = derived(audioState, ($state) => $state.sfxVolume);

// ============================================
// Sound Definitions (Web Audio API generated sounds)
// ============================================

// Generate sounds programmatically using Web Audio API
// This avoids the need for external audio files

function generateButtonClick(ctx: AudioContext): AudioBuffer {
	const duration = 0.1;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Short click sound
		data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 30) * 0.3;
	}

	return buffer;
}

function generateButtonHover(ctx: AudioContext): AudioBuffer {
	const duration = 0.05;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 50) * 0.15;
	}

	return buffer;
}

function generateNotification(ctx: AudioContext): AudioBuffer {
	const duration = 0.3;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Two-tone notification
		const freq = t < 0.15 ? 880 : 1100;
		data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8) * 0.25;
	}

	return buffer;
}

function generatePuzzleSolved(ctx: AudioContext): AudioBuffer {
	const duration = 0.8;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Ascending arpeggio
		const freq = t < 0.2 ? 523 : t < 0.4 ? 659 : t < 0.6 ? 784 : 1047;
		data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.3;
		// Add harmonics
		data[i] += Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 4) * 0.1;
	}

	return buffer;
}

function generatePuzzleAttempt(ctx: AudioContext): AudioBuffer {
	const duration = 0.15;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 15) * 0.25;
	}

	return buffer;
}

function generatePuzzleError(ctx: AudioContext): AudioBuffer {
	const duration = 0.3;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Descending tone (error)
		data[i] = Math.sin(2 * Math.PI * 300 * (1 - t) * t) * Math.exp(-t * 8) * 0.3;
	}

	return buffer;
}

function generateRoomTransition(ctx: AudioContext): AudioBuffer {
	const duration = 0.5;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Whoosh sound
		const freq = 200 + t * 400;
		data[i] = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.2;
	}

	return buffer;
}

function generateItemPickup(ctx: AudioContext): AudioBuffer {
	const duration = 0.2;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 15) * 0.25;
		data[i] += Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 20) * 0.15;
	}

	return buffer;
}

function generateItemUse(ctx: AudioContext): AudioBuffer {
	const duration = 0.25;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 500 * t) * Math.exp(-t * 10) * 0.2;
		data[i] += Math.sin(2 * Math.PI * 750 * t) * Math.exp(-t * 12) * 0.15;
	}

	return buffer;
}

function generateDoorOpen(ctx: AudioContext): AudioBuffer {
	const duration = 0.4;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Creak sound
		data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.15;
		data[i] += Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 4) * 0.2;
	}

	return buffer;
}

function generateDoorLocked(ctx: AudioContext): AudioBuffer {
	const duration = 0.15;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 25) * 0.3;
	}

	return buffer;
}

function generatePlayerJoin(ctx: AudioContext): AudioBuffer {
	const duration = 0.4;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Welcome chime
		const freq = t < 0.2 ? 523 : 698;
		data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6) * 0.25;
	}

	return buffer;
}

function generatePlayerLeave(ctx: AudioContext): AudioBuffer {
	const duration = 0.3;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 10) * 0.2;
	}

	return buffer;
}

function generateMessageSend(ctx: AudioContext): AudioBuffer {
	const duration = 0.1;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 25) * 0.15;
	}

	return buffer;
}

function generateMessageReceive(ctx: AudioContext): AudioBuffer {
	const duration = 0.1;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 25) * 0.15;
	}

	return buffer;
}

function generateVictory(ctx: AudioContext): AudioBuffer {
	const duration = 1.5;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	// Victory fanfare
	const notes = [523, 659, 784, 1047, 784, 1047];

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		const noteIndex = Math.min(Math.floor(t / 0.2), notes.length - 1);
		const freq = notes[noteIndex];

		data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-(t % 0.2) * 5) * 0.25;
		data[i] += Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-(t % 0.2) * 6) * 0.1;
	}

	return buffer;
}

function generateDefeat(ctx: AudioContext): AudioBuffer {
	const duration = 1.0;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Descending sad tone
		const freq = 400 - t * 150;
		data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.25;
	}

	return buffer;
}

// Sound generators map
const soundGenerators: Record<SoundId, (ctx: AudioContext) => AudioBuffer> = {
	'button-click': generateButtonClick,
	'button-hover': generateButtonHover,
	'notification': generateNotification,
	'puzzle-solved': generatePuzzleSolved,
	'puzzle-attempt': generatePuzzleAttempt,
	'puzzle-error': generatePuzzleError,
	'room-transition': generateRoomTransition,
	'item-pickup': generateItemPickup,
	'item-use': generateItemUse,
	'door-open': generateDoorOpen,
	'door-locked': generateDoorLocked,
	'player-join': generatePlayerJoin,
	'player-leave': generatePlayerLeave,
	'message-send': generateMessageSend,
	'message-receive': generateMessageReceive,
	'victory': generateVictory,
	'defeat': generateDefeat,
	'ambient-main': () => new AudioBuffer({ length: 1, sampleRate: 44100 }),
	'ambient-tense': () => new AudioBuffer({ length: 1, sampleRate: 44100 }),
	'ambient-relaxed': () => new AudioBuffer({ length: 1, sampleRate: 44100 })
};

// ============================================
// Sound Manager Class
// ============================================

class SoundManager {
	private initialized = false;

	async init(): Promise<void> {
		if (!browser || this.initialized) return;

		try {
			audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

			// Generate all sounds
			for (const [id, generator] of Object.entries(soundGenerators)) {
				const buffer = generator(audioContext);
				audioBuffers.set(id as SoundId, buffer);
			}

			this.initialized = true;
			console.log('SoundManager initialized with', audioBuffers.size, 'sounds');
		} catch (error) {
			console.error('Failed to initialize SoundManager:', error);
		}
	}

	play(soundId: SoundId, options?: { volume?: number; rate?: number }): void {
		if (!browser || !this.initialized || !audioContext) {
			// Try to initialize on first play
			this.init();
			return;
		}

		const state = get(audioState);
		if (state.muted) return;

		const buffer = audioBuffers.get(soundId);
		if (!buffer) {
			console.warn('Sound not found:', soundId);
			return;
		}

		// Resume context if suspended (browser autoplay policy)
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		if (options?.rate) {
			source.playbackRate.value = options.rate;
		}

		const gainNode = audioContext.createGain();
		const baseVolume = options?.volume ?? 1;
		const masterVol = state.masterVolume;
		const sfxVol = state.sfxVolume;
		gainNode.gain.value = baseVolume * masterVol * sfxVol;

		source.connect(gainNode);
		gainNode.connect(audioContext.destination);

		source.start(0);

		// Track active sources
		const sources = activeSources.get(soundId) || [];
		sources.push(source);
		activeSources.set(soundId, sources);

		source.onended = () => {
			const idx = sources.indexOf(source);
			if (idx > -1) sources.splice(idx, 1);
		};
	}

	setMuted(muted: boolean): void {
		audioState.update((state) => ({ ...state, muted }));
	}

	toggleMute(): boolean {
		const state = get(audioState);
		const newMuted = !state.muted;
		this.setMuted(newMuted);
		return newMuted;
	}

	setMasterVolume(volume: number): void {
		audioState.update((state) => ({ ...state, masterVolume: Math.max(0, Math.min(1, volume)) }));
	}

	setMusicVolume(volume: number): void {
		audioState.update((state) => ({ ...state, musicVolume: Math.max(0, Math.min(1, volume)) }));
	}

	setSfxVolume(volume: number): void {
		audioState.update((state) => ({ ...state, sfxVolume: Math.max(0, Math.min(1, volume)) }));
	}

	// Convenience methods for common sounds
	playClick(): void {
		this.play('button-click');
	}

	playHover(): void {
		this.play('button-hover', { volume: 0.5 });
	}

	playNotification(): void {
		this.play('notification');
	}

	playPuzzleSolved(): void {
		this.play('puzzle-solved');
	}

	playPuzzleError(): void {
		this.play('puzzle-error');
	}

	playPlayerJoin(): void {
		this.play('player-join');
	}

	playPlayerLeave(): void {
		this.play('player-leave');
	}

	playMessageSend(): void {
		this.play('message-send');
	}

	playMessageReceive(): void {
		this.play('message-receive');
	}

	playVictory(): void {
		this.play('victory');
	}

	playDefeat(): void {
		this.play('defeat');
	}

	// Cleanup
	destroy(): void {
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
		audioBuffers.clear();
		activeSources.clear();
		gainNodes.clear();
		this.initialized = false;
	}
}

// Export singleton instance
export const soundManager = new SoundManager();

// Auto-initialize on first user interaction
if (browser) {
	const initOnInteraction = () => {
		soundManager.init();
		document.removeEventListener('click', initOnInteraction);
		document.removeEventListener('keydown', initOnInteraction);
		document.removeEventListener('touchstart', initOnInteraction);
	};

	document.addEventListener('click', initOnInteraction);
	document.addEventListener('keydown', initOnInteraction);
	document.addEventListener('touchstart', initOnInteraction);
}

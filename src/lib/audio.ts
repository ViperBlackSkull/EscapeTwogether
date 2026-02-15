/**
 * Sound Manager - Audio system for EscapeTwogether
 *
 * Manages all game audio including:
 * - UI sounds (button clicks, notifications)
 * - Game sounds (puzzle solved, room transitions)
 * - Ambient background music
 * - Room-specific ambience
 * - Volume control and muting
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================
// Types
// ============================================

export type SoundId =
	// UI Sounds
	| 'button-click'
	| 'button-hover'
	| 'notification'
	// Puzzle Sounds
	| 'puzzle-solved'
	| 'puzzle-attempt'
	| 'puzzle-error'
	| 'puzzle-hint'
	// Room Sounds
	| 'room-transition'
	| 'door-open'
	| 'door-locked'
	// Item Sounds
	| 'item-pickup'
	| 'item-use'
	// Multiplayer Sounds
	| 'player-join'
	| 'player-leave'
	| 'message-send'
	| 'message-receive'
	// Game State Sounds
	| 'victory'
	| 'defeat'
	// Ambient Sounds (background)
	| 'ambient-attic'
	| 'ambient-clock-tower'
	| 'ambient-garden'
	| 'ambient-main-menu'
	// Music Tracks
	| 'music-exploration'
	| 'music-tension'
	| 'music-victory'
	| 'music-game-over';

export type RoomId = 'attic' | 'clock-tower' | 'garden';

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
	ambienceVolume: number;
	currentMusic: SoundId | null;
	currentAmbient: SoundId | null;
	currentRoom: RoomId | null;
}

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
	musicVolume: 0.6,
	sfxVolume: 0.8,
	ambienceVolume: 0.5,
	currentMusic: null,
	currentAmbient: null,
	currentRoom: null
});

export const isMuted = derived(audioState, ($state) => $state.muted);
export const masterVolume = derived(audioState, ($state) => $state.masterVolume);
export const musicVolume = derived(audioState, ($state) => $state.musicVolume);
export const sfxVolume = derived(audioState, ($state) => $state.sfxVolume);
export const ambienceVolume = derived(audioState, ($state) => $state.ambienceVolume);

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

function generatePuzzleHint(ctx: AudioContext): AudioBuffer {
	const duration = 0.2;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		// Gentle hint sound - ascending sparkles
		data[i] = Math.sin(2 * Math.PI * (1200 + t * 300) * t) * Math.exp(-t * 15) * 0.2;
	}

	return buffer;
}

// ============================================
// Ambient Sound Generators
// ============================================

function generateAtticAmbient(ctx: AudioContext): AudioBuffer {
	const duration = 10.0; // 10 second loop
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;

		// Wind howl
		const windFreq = 80 + Math.sin(t * 0.5) * 40;
		const wind = (Math.random() * 0.3) * Math.sin(2 * Math.PI * windFreq * t);

		// Occasional creaks
		const creakTime = (t % 2.5) < 0.3;
		const creak = creakTime ?
			(Math.random() * 0.4) * Math.sin(2 * Math.PI * (150 + Math.random() * 50) * t) * Math.exp(-((t % 2.5) * 10)) : 0;

		// Distant whistling
		const whistle = Math.sin(2 * Math.PI * 440 * t) * 0.02 * (0.5 + 0.5 * Math.sin(t * 0.3));

		leftData[i] = (wind + creak + whistle) * 0.15;
		rightData[i] = (wind * 0.9 + creak * 1.1 + whistle) * 0.15;
	}

	return buffer;
}

function generateClockTowerAmbient(ctx: AudioContext): AudioBuffer {
	const duration = 8.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;

		// Constant ticking
		const tickPhase = (t % 1.0) < 0.05;
		const tick = tickPhase ? Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-((t % 1.0) * 100)) * 0.3 : 0;

		// Gears grinding
		const gearL = Math.sin(2 * Math.PI * 60 * t) * (0.5 + 0.5 * Math.sin(t * 2.3)) * 0.08;
		const gearR = Math.sin(2 * Math.PI * 65 * t) * (0.5 + 0.5 * Math.sin(t * 1.7)) * 0.08;

		// Low rumble
		const rumble = (Math.random() * 0.3) * Math.sin(2 * Math.PI * 40 * t) * 0.15;

		// Pendulum swing (panned left-right)
		const pan = 0.5 + 0.5 * Math.sin(t * 0.785); // Approx π/4 for pendulum
		const pendulum = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-Math.abs((t % 2.0) - 1.0) * 5) * 0.1;

		leftData[i] = tick + gearL + rumble + pendulum * (1 - pan);
		rightData[i] = tick * 0.9 + gearR + rumble + pendulum * pan;
	}

	return buffer;
}

function generateGardenAmbient(ctx: AudioContext): AudioBuffer {
	const duration = 12.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;

		// Bird chirps (random intervals)
		const birdTime = Math.sin(t * 13.7) > 0.7;
		const birdFreq = 2000 + Math.random() * 1000;
		const birdL = birdTime ? Math.sin(2 * Math.PI * birdFreq * t) * Math.exp(-Math.random() * 3) * 0.05 : 0;
		const birdR = birdTime ? Math.sin(2 * Math.PI * (birdFreq + 100) * t) * Math.exp(-Math.random() * 3) * 0.05 : 0;

		// Leaves rustling
		const rustleL = (Math.random() * 0.5) * Math.sin(2 * Math.PI * 400 * t) * 0.03;
		const rustleR = (Math.random() * 0.5) * Math.sin(2 * Math.PI * 420 * t) * 0.03;

		// Wind through branches
		const wind = Math.sin(2 * Math.PI * (100 + Math.sin(t * 0.5) * 30) * t) * 0.02;

		// Water trickle
		const water = Math.sin(2 * Math.PI * 800 * t) * (0.3 + 0.7 * Math.sin(t * 7.3)) * 0.02;

		// Gentle atmospheric pad
		const pad = Math.sin(2 * Math.PI * 220 * t) * 0.01;

		leftData[i] = birdL + rustleL + wind + water + pad;
		rightData[i] = birdR + rustleR + wind * 0.9 + water + pad;
	}

	return buffer;
}

function generateMainMenuAmbient(ctx: AudioContext): AudioBuffer {
	const duration = 15.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;

		// Mystery drone
		const droneL = Math.sin(2 * Math.PI * 55 * t) * 0.04;
		const droneR = Math.sin(2 * Math.PI * 55.5 * t) * 0.04;

		// Ethereal pads
		const pad1 = Math.sin(2 * Math.PI * 220 * t) * Math.sin(t * 0.3) * 0.02;
		const pad2 = Math.sin(2 * Math.PI * 330 * t) * Math.sin(t * 0.23) * 0.015;

		// Occasional mystery chimes
		const chimeTime = (t % 3.5) < 0.4;
		const chime = chimeTime ?
			Math.sin(2 * Math.PI * (880 + (t % 3.5) * 200) * t) * Math.exp(-((t % 3.5) * 5)) * 0.03 : 0;

		// Subtle movement
		const movement = (Math.random() * 0.3) * Math.sin(2 * Math.PI * 150 * t) * 0.01;

		leftData[i] = droneL + pad1 + chime + movement;
		rightData[i] = droneR + pad2 + chime * 1.1 + movement;
	}

	return buffer;
}

// ============================================
// Music Generators
// ============================================

function generateExplorationMusic(ctx: AudioContext): AudioBuffer {
	const duration = 16.0; // 16 bar loop
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	// Mystery ambient music
	const chords = [
		{ freq: 130.81, start: 0, dur: 4 }, // C3
		{ freq: 155.56, start: 4, dur: 4 }, // Eb3
		{ freq: 174.61, start: 8, dur: 4 }, // F3
		{ freq: 196.00, start: 12, dur: 4 } // G3
	];

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		let sampleL = 0, sampleR = 0;

		// Pad chords
		for (const chord of chords) {
			if (t >= chord.start && t < chord.start + chord.dur) {
				const localT = t - chord.start;
				const envelope = Math.sin((localT / chord.dur) * Math.PI);
				sampleL += Math.sin(2 * Math.PI * chord.freq * t) * envelope * 0.03;
				sampleL += Math.sin(2 * Math.PI * chord.freq * 2 * t) * envelope * 0.015;
				sampleR += Math.sin(2 * Math.PI * (chord.freq + 2) * t) * envelope * 0.03;
				sampleR += Math.sin(2 * Math.PI * chord.freq * 2.01 * t) * envelope * 0.015;
			}
		}

		// Mystery melody
		const melodyT = (t % 8) / 8;
		const melodyFreq = melodyT < 0.25 ? 523.25 :
			melodyT < 0.5 ? 659.25 :
			melodyT < 0.75 ? 783.99 : 659.25;
		const melodyEnvelope = Math.sin(melodyT * Math.PI) * 0.5;
		sampleL += Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnvelope * 0.02;

		// Subtle bass
		sampleL += Math.sin(2 * Math.PI * 65.41 * t) * 0.02;
		sampleR += Math.sin(2 * Math.PI * 65.91 * t) * 0.02;

		// Arpeggios
		const arpeggioT = t % 2;
		const arpeggioNote = Math.floor(arpeggioT / 0.5);
		const arpeggioFreq = [261.63, 329.63, 392.00, 523.25][arpeggioNote % 4];
		sampleL += Math.sin(2 * Math.PI * arpeggioFreq * t) * Math.exp(-arpeggioT * 2) * 0.015;

		// Apply soft clip
		leftData[i] = Math.tanh(sampleL) * 0.5;
		rightData[i] = Math.tanh(sampleR) * 0.5;
	}

	return buffer;
}

function generateTensionMusic(ctx: AudioContext): AudioBuffer {
	const duration = 8.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;

		// Tense drone
		const droneL = Math.sin(2 * Math.PI * 73.42 * t) * 0.04; // D3
		const droneR = Math.sin(2 * Math.PI * 77.78 * t) * 0.04; // Eb3

		// Dissonant intervals
		const dissonanceL = Math.sin(2 * Math.PI * 220.00 * t) * 0.015;
		const dissonanceR = Math.sin(2 * Math.PI * 233.08 * t) * 0.015; // Minor second

		// Pulsing tension
		const pulseFreq = 2 + Math.sin(t) * 0.5;
		const pulse = Math.sin(2 * Math.PI * pulseFreq * t) * 0.02;

		// Ticking/rhythmic element
		const tick = ((t % 0.5) < 0.05) ? Math.sin(2 * Math.PI * 800 * t) * Math.exp(-((t % 0.5) * 50)) * 0.1 : 0;

		// Low rumble
		const rumble = (Math.random() * 0.3) * Math.sin(2 * Math.PI * 35 * t) * 0.05;

		// Eerie high frequencies
		const eerieL = Math.sin(2 * Math.PI * 880 * t) * Math.sin(t * 0.7) * 0.005;
		const eerieR = Math.sin(2 * Math.PI * 932.33 * t) * Math.sin(t * 0.67) * 0.005;

		leftData[i] = droneL + dissonanceL + pulse + tick + rumble + eerieL;
		rightData[i] = droneR + dissonanceR + pulse * 1.1 + tick * 0.9 + rumble + eerieR;
	}

	return buffer;
}

function generateVictoryMusic(ctx: AudioContext): AudioBuffer {
	const duration = 6.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	// Victory fanfare
	const melody = [
		{ freq: 523.25, start: 0, dur: 0.3 }, // C5
		{ freq: 659.25, start: 0.3, dur: 0.3 }, // E5
		{ freq: 783.99, start: 0.6, dur: 0.3 }, // G5
		{ freq: 1046.50, start: 0.9, dur: 0.6 }, // C6
		{ freq: 783.99, start: 1.5, dur: 0.3 }, // G5
		{ freq: 1046.50, start: 1.8, dur: 1.2 }, // C6 (hold)
		{ freq: 1318.51, start: 3.0, dur: 0.4 }, // E6
		{ freq: 1567.98, start: 3.4, dur: 0.4 }, // G6
		{ freq: 2093.00, start: 3.8, dur: 2.2 } // C7 (final)
	];

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		let sampleL = 0, sampleR = 0;

		// Melody
		for (const note of melody) {
			if (t >= note.start && t < note.start + note.dur) {
				const localT = t - note.start;
				const envelope = Math.sin((localT / note.dur) * Math.PI);
				sampleL += Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.15;
				sampleL += Math.sin(2 * Math.PI * note.freq * 2 * t) * envelope * 0.08;
				sampleR += Math.sin(2 * Math.PI * note.freq * 1.005 * t) * envelope * 0.15;
			}
		}

		// Harmony chords
		if (t < 4) {
			sampleL += Math.sin(2 * Math.PI * 261.63 * t) * 0.04; // C4
			sampleR += Math.sin(2 * Math.PI * 329.63 * t) * 0.04; // E4
			sampleL += Math.sin(2 * Math.PI * 392.00 * t) * 0.03; // G4
			sampleR += Math.sin(2 * Math.PI * 392.00 * t) * 0.03; // G4
		}

		// Celebration arpeggios
		const arpeggioT = (t % 0.2) / 0.2;
		const arpeggioFreq = 523.25 * Math.pow(2, Math.floor(t / 0.2) % 8 * 0.25);
		sampleL += Math.sin(2 * Math.PI * arpeggioFreq * t) * Math.exp(-arpeggioT * 10) * 0.05;

		// Bass
		sampleL += Math.sin(2 * Math.PI * 130.81 * t) * 0.03;
		sampleR += Math.sin(2 * Math.PI * 130.81 * t) * 0.03;

		leftData[i] = Math.tanh(sampleL) * 0.7;
		rightData[i] = Math.tanh(sampleR) * 0.7;
	}

	return buffer;
}

function generateGameOverMusic(ctx: AudioContext): AudioBuffer {
	const duration = 5.0;
	const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
	const leftData = buffer.getChannelData(0);
	const rightData = buffer.getChannelData(1);

	for (let i = 0; i < buffer.length; i++) {
		const t = i / ctx.sampleRate;
		let sampleL = 0, sampleR = 0;

		// Sad descending melody
		const melodyFreq = t < 1 ? 392.00 :
			t < 2 ? 349.23 :
			t < 3 ? 329.63 :
			t < 4 ? 293.66 : 261.63;
		const melodyEnvelope = Math.exp(-t * 0.5);
		const melodyL = Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnvelope * 0.08;
		const melodyR = Math.sin(2 * Math.PI * melodyFreq * 1.01 * t) * melodyEnvelope * 0.08;

		// Minor chord
		sampleL = melodyL;
		sampleL += Math.sin(2 * Math.PI * 196.00 * t) * Math.exp(-t * 0.3) * 0.03; // G3
		sampleL += Math.sin(2 * Math.PI * 233.08 * t) * Math.exp(-t * 0.3) * 0.03; // Bb3

		sampleR = melodyR;
		sampleR += Math.sin(2 * Math.PI * 196.00 * t) * Math.exp(-t * 0.3) * 0.03; // G3
		sampleR += Math.sin(2 * Math.PI * 233.08 * t) * Math.exp(-t * 0.3) * 0.03; // Bb3

		// Low drone
		sampleL += Math.sin(2 * Math.PI * 65.41 * t) * Math.exp(-t * 0.2) * 0.04;
		sampleR += Math.sin(2 * Math.PI * 65.41 * t) * Math.exp(-t * 0.2) * 0.04;

		// Tension diminishing
		const tension = Math.sin(2 * Math.PI * 73.42 * t) * Math.exp(-t) * 0.02;
		sampleL += tension;
		sampleR += tension;

		leftData[i] = Math.tanh(sampleL) * 0.6;
		rightData[i] = Math.tanh(sampleR) * 0.6;
	}

	return buffer;
}

// Sound generators map
const soundGenerators: Record<SoundId, (ctx: AudioContext) => AudioBuffer> = {
	// UI Sounds
	'button-click': generateButtonClick,
	'button-hover': generateButtonHover,
	'notification': generateNotification,

	// Puzzle Sounds
	'puzzle-solved': generatePuzzleSolved,
	'puzzle-attempt': generatePuzzleAttempt,
	'puzzle-error': generatePuzzleError,
	'puzzle-hint': generatePuzzleHint,

	// Room Sounds
	'room-transition': generateRoomTransition,
	'door-open': generateDoorOpen,
	'door-locked': generateDoorLocked,

	// Item Sounds
	'item-pickup': generateItemPickup,
	'item-use': generateItemUse,

	// Multiplayer Sounds
	'player-join': generatePlayerJoin,
	'player-leave': generatePlayerLeave,
	'message-send': generateMessageSend,
	'message-receive': generateMessageReceive,

	// Game State Sounds
	'victory': generateVictory,
	'defeat': generateDefeat,

	// Ambient Sounds
	'ambient-attic': generateAtticAmbient,
	'ambient-clock-tower': generateClockTowerAmbient,
	'ambient-garden': generateGardenAmbient,
	'ambient-main-menu': generateMainMenuAmbient,

	// Music Tracks
	'music-exploration': generateExplorationMusic,
	'music-tension': generateTensionMusic,
	'music-victory': generateVictoryMusic,
	'music-game-over': generateGameOverMusic
};

// ============================================
// Sound Manager Class
// ============================================

class SoundManager {
	private initialized = false;
	private musicSource: AudioBufferSourceNode | null = null;
	private musicGainNode: GainNode | null = null;
	private ambientSource: AudioBufferSourceNode | null = null;
	private ambientGainNode: GainNode | null = null;

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

	// ============================================
	// Music System
	// ============================================

	playMusic(musicId: SoundId, fadeInDuration = 2.0): void {
		if (!browser || !this.initialized || !audioContext) return;

		const state = get(audioState);
		if (state.muted) return;

		const buffer = audioBuffers.get(musicId);
		if (!buffer) {
			console.warn('Music not found:', musicId);
			return;
		}

		// Stop current music with fade out
		this.stopMusic(1.0);

		// Resume context if suspended
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		// Create new music source
		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.loop = true;

		// Create gain node for fade in/out
		const gainNode = audioContext.createGain();
		const masterVol = state.masterVolume;
		const musicVol = state.musicVolume;

		// Start at 0 for fade in
		gainNode.gain.value = 0;

		source.connect(gainNode);
		gainNode.connect(audioContext.destination);

		source.start(0);

		// Fade in
		gainNode.gain.linearRampToValueAtTime(
			masterVol * musicVol,
			audioContext.currentTime + fadeInDuration
		);

		this.musicSource = source;
		this.musicGainNode = gainNode;

		audioState.update((state) => ({ ...state, currentMusic: musicId }));

		console.log('Playing music:', musicId);
	}

	stopMusic(fadeOutDuration = 1.0): void {
		if (!this.musicSource || !this.musicGainNode || !audioContext) return;

		// Fade out
		this.musicGainNode.gain.linearRampToValueAtTime(
			0,
			audioContext.currentTime + fadeOutDuration
		);

		// Stop after fade out
		setTimeout(() => {
			if (this.musicSource) {
				this.musicSource.stop();
				this.musicSource = null;
				this.musicGainNode = null;
				audioState.update((state) => ({ ...state, currentMusic: null }));
			}
		}, fadeOutDuration * 1000);
	}

	setMusicVolume(volume: number): void {
		audioState.update((state) => ({
			...state,
			musicVolume: Math.max(0, Math.min(1, volume))
		}));

		// Update current music gain if playing
		if (this.musicGainNode && audioContext) {
			const state = get(audioState);
			this.musicGainNode.gain.linearRampToValueAtTime(
				state.masterVolume * volume,
				audioContext.currentTime + 0.1
			);
		}
	}

	// ============================================
	// Ambient Sound System
	// ============================================

	playAmbient(ambientId: SoundId, fadeInDuration = 3.0): void {
		if (!browser || !this.initialized || !audioContext) return;

		const state = get(audioState);
		if (state.muted) return;

		const buffer = audioBuffers.get(ambientId);
		if (!buffer) {
			console.warn('Ambient sound not found:', ambientId);
			return;
		}

		// Stop current ambient with fade out
		this.stopAmbient(2.0);

		// Resume context if suspended
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		// Create new ambient source
		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.loop = true;

		// Create gain node for fade in/out
		const gainNode = audioContext.createGain();
		const masterVol = state.masterVolume;
		const ambVol = state.ambienceVolume;

		// Start at 0 for fade in
		gainNode.gain.value = 0;

		source.connect(gainNode);
		gainNode.connect(audioContext.destination);

		source.start(0);

		// Fade in
		gainNode.gain.linearRampToValueAtTime(
			masterVol * ambVol,
			audioContext.currentTime + fadeInDuration
		);

		this.ambientSource = source;
		this.ambientGainNode = gainNode;

		audioState.update((state) => ({ ...state, currentAmbient: ambientId }));

		console.log('Playing ambient:', ambientId);
	}

	stopAmbient(fadeOutDuration = 2.0): void {
		if (!this.ambientSource || !this.ambientGainNode || !audioContext) return;

		// Fade out
		this.ambientGainNode.gain.linearRampToValueAtTime(
			0,
			audioContext.currentTime + fadeOutDuration
		);

		// Stop after fade out
		setTimeout(() => {
			if (this.ambientSource) {
				this.ambientSource.stop();
				this.ambientSource = null;
				this.ambientGainNode = null;
				audioState.update((state) => ({ ...state, currentAmbient: null }));
			}
		}, fadeOutDuration * 1000);
	}

	setAmbientVolume(volume: number): void {
		audioState.update((state) => ({
			...state,
			ambienceVolume: Math.max(0, Math.min(1, volume))
		}));

		// Update current ambient gain if playing
		if (this.ambientGainNode && audioContext) {
			const state = get(audioState);
			this.ambientGainNode.gain.linearRampToValueAtTime(
				state.masterVolume * volume,
				audioContext.currentTime + 0.1
			);
		}
	}

	// ============================================
	// Room System
	// ============================================

	setRoom(roomId: RoomId): void {
		const ambientMap: Record<RoomId, SoundId> = {
			'attic': 'ambient-attic',
			'clock-tower': 'ambient-clock-tower',
			'garden': 'ambient-garden'
		};

		const newAmbient = ambientMap[roomId];
		const state = get(audioState);

		// Only change if different
		if (state.currentAmbient !== newAmbient) {
			this.playAmbient(newAmbient);
			audioState.update((state) => ({ ...state, currentRoom: roomId }));
		}
	}

	transitionToRoom(roomId: RoomId): void {
		// Play room transition sound
		this.play('room-transition');

		// Change ambient after short delay
		setTimeout(() => {
			this.setRoom(roomId);
		}, 500);
	}

	// ============================================
	// Volume Control
	// ============================================

	setMuted(muted: boolean): void {
		audioState.update((state) => ({ ...state, muted }));

		if (muted) {
			// Mute all audio
			this.stopMusic(0.5);
			this.stopAmbient(1.0);
		}
	}

	toggleMute(): boolean {
		const state = get(audioState);
		const newMuted = !state.muted;
		this.setMuted(newMuted);
		return newMuted;
	}

	setMasterVolume(volume: number): void {
		audioState.update((state) => ({
			...state,
			masterVolume: Math.max(0, Math.min(1, volume))
		}));

		// Update all active audio
		if (audioContext) {
			const state = get(audioState);

			// Update music
			if (this.musicGainNode) {
				this.musicGainNode.gain.linearRampToValueAtTime(
					volume * state.musicVolume,
					audioContext.currentTime + 0.1
				);
			}

			// Update ambient
			if (this.ambientGainNode) {
				this.ambientGainNode.gain.linearRampToValueAtTime(
					volume * state.ambienceVolume,
					audioContext.currentTime + 0.1
				);
			}
		}
	}

	setSfxVolume(volume: number): void {
		audioState.update((state) => ({
			...state,
			sfxVolume: Math.max(0, Math.min(1, volume))
		}));
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

	playPuzzleHint(): void {
		this.play('puzzle-hint');
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
		this.stopMusic(0.5);
		this.stopAmbient(1.0);
		this.play('victory');
		this.playMusic('music-victory', 1.0);
	}

	playDefeat(): void {
		this.stopMusic(0.5);
		this.stopAmbient(1.0);
		this.play('defeat');
		this.playMusic('music-game-over', 1.0);
	}

	// ============================================
	// Game Flow Methods
	// ============================================

	startGame(): void {
		this.play('door-open');
		this.playMusic('music-exploration', 2.0);
	}

	endGame(victory: boolean): void {
		if (victory) {
			this.playVictory();
		} else {
			this.playDefeat();
		}
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
		this.musicSource = null;
		this.musicGainNode = null;
		this.ambientSource = null;
		this.ambientGainNode = null;
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

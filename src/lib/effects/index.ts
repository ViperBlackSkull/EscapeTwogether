// Effects module exports

// PixiJS-based particle system (for game canvas)
export { ParticleManager, ParticleEmitter, PARTICLE_PRESETS } from './pixiParticles';
export type { ParticleConfig } from './pixiParticles';

// Canvas 2D particle system (for overlays and UI effects)
export {
	ParticleSystem as CanvasParticleSystem,
	getParticleSystem,
	destroyParticleSystem,
	createDustEffect,
	createSparkleEffect,
	createPuzzleSolveEffect,
	createConfettiEffect,
	createRoomAmbience,
	renderParticle,
	PARTICLE_COLORS,
} from './particleSystem';

export type { Particle, ParticleType as CanvasParticleType, EmitterConfig } from './particleSystem';

// Svelte component for canvas particles
export { default as ParticleCanvas } from './ParticleCanvas.svelte';

// Performance utilities for scaling effects
export {
	getDeviceCapabilities,
	getParticleScale,
	shouldEnableParticles,
	FrameRateMonitor,
	frameRateMonitor,
	ThrottledRenderer,
	AdaptiveRenderer
} from '$lib/utils/performance';
export type { DeviceCapabilities } from '$lib/utils/performance';

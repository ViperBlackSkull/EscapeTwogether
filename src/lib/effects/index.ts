// Effects module exports

// PixiJS-based particle system (for game canvas)
export { ParticleManager, ParticleEmitter, PARTICLE_PRESETS } from './ParticleSystem';
export type { ParticleConfig } from './ParticleSystem';

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

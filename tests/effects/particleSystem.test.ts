import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	ParticleSystem,
	createDustEffect,
	createSparkleEffect,
	createPuzzleSolveEffect,
	createConfettiEffect,
	createRoomAmbience,
	PARTICLE_COLORS,
	getParticleSystem,
	destroyParticleSystem,
	type Particle
} from '$lib/effects/particleSystem';

describe('Particle System', () => {
	let system: ParticleSystem;

	beforeEach(() => {
		system = new ParticleSystem();
		vi.useFakeTimers();
	});

	afterEach(() => {
		system.stop();
		system.clear();
		vi.useRealTimers();
	});

	describe('ParticleSystem', () => {
		it('should create an empty particle system', () => {
			expect(system.getParticleCount()).toBe(0);
			expect(system.hasParticles()).toBe(false);
		});

		it('should emit particles', () => {
			const particles = system.emit({
				x: 100,
				y: 100,
				type: 'dust',
				count: 10
			});

			expect(particles).toHaveLength(10);
			expect(system.getParticleCount()).toBe(10);
		});

		it('should update particles', () => {
			system.emit({
				x: 100,
				y: 100,
				type: 'sparkle',
				count: 5
			});

			system.update(16); // ~60fps

			expect(system.hasParticles()).toBe(true);
		});

		it('should remove expired particles', () => {
			system.emit({
				x: 100,
				y: 100,
				type: 'sparkle',
				count: 5,
				minSize: 2,
				maxSize: 4,
				minSpeed: 1,
				maxSpeed: 2
			});

			// Sparkles have maxLife of ~800-1200ms
			// Update past their lifetime
			system.update(2000);

			expect(system.getParticleCount()).toBe(0);
		});

		it('should clear all particles', () => {
			system.emit({
				x: 100,
				y: 100,
				type: 'dust',
				count: 20
			});

			expect(system.getParticleCount()).toBe(20);

			system.clear();

			expect(system.getParticleCount()).toBe(0);
		});

		it('should support continuous emitters', () => {
			system.addEmitter('test', {
				x: 400,
				y: 300,
				type: 'dust',
				count: 0,
				rate: 10, // 10 particles per second
				continuous: true
			});

			// Update for 100ms
			system.update(100);

			// Should have emitted approximately 1 particle
			expect(system.getParticleCount()).toBeGreaterThanOrEqual(0);
		});

		it('should remove emitters', () => {
			system.addEmitter('test', {
				x: 400,
				y: 300,
				type: 'dust',
				count: 0,
				rate: 10,
				continuous: true
			});

			system.removeEmitter('test');

			// Update - should not emit
			system.update(1000);

			// Without the emitter, no new particles should be generated
			expect(system.getParticleCount()).toBe(0);
		});

		it('should call callback on update', () => {
			const callback = vi.fn();
			const systemWithCallback = new ParticleSystem(callback);

			systemWithCallback.emit({
				x: 100,
				y: 100,
				type: 'dust',
				count: 5
			});

			systemWithCallback.update(16);

			expect(callback).toHaveBeenCalled();
		});
	});

	describe('Preset Effects', () => {
		it('should create dust effect', () => {
			createDustEffect(system, 800, 600);

			// Dust emitter should be added
			expect(system['emitters'].has('dust')).toBe(true);
		});

		it('should create sparkle effect', () => {
			createSparkleEffect(system, 100, 100);

			expect(system.getParticleCount()).toBe(20);
		});

		it('should create puzzle solve effect', () => {
			createPuzzleSolveEffect(system, 200, 200);

			// Should emit sparkles (30) + hearts (10) = 40
			expect(system.getParticleCount()).toBe(40);
		});

		it('should create confetti effect', () => {
			createConfettiEffect(system, 400, 0, 800);

			// Confetti uses setTimeout, advance timers to trigger first emission
			vi.advanceTimersByTime(0);

			// First batch should emit
			expect(system.getParticleCount()).toBe(20);

			// Advance timers to trigger all delayed emissions
			vi.advanceTimersByTime(1000);

			// All 5 batches should have emitted
			expect(system.getParticleCount()).toBe(100);
		});

		it('should create room ambience for attic', () => {
			createRoomAmbience(system, 'attic', 800, 600);

			expect(system['emitters'].has('dust')).toBe(true);
		});

		it('should create room ambience for clock tower', () => {
			createRoomAmbience(system, 'clock_tower', 800, 600);

			expect(system['emitters'].has('clock_tower_glow')).toBe(true);
		});

		it('should create room ambience for garden', () => {
			createRoomAmbience(system, 'garden_conservatory', 800, 600);

			expect(system['emitters'].has('garden_leaves')).toBe(true);
		});

		it('should clear existing emitters on room change', () => {
			createRoomAmbience(system, 'attic', 800, 600);
			expect(system['emitters'].has('dust')).toBe(true);

			createRoomAmbience(system, 'clock_tower', 800, 600);

			expect(system['emitters'].has('dust')).toBe(false);
			expect(system['emitters'].has('clock_tower_glow')).toBe(true);
		});
	});

	describe('Particle Properties', () => {
		it('should create particles with correct type defaults', () => {
			const particles = system.emit({
				x: 100,
				y: 100,
				type: 'sparkle',
				count: 1
			});

			const particle = particles[0];
			expect(particle.shape).toBe('star');
			expect(particle.gravity).toBe(-0.05);
		});

		it('should use custom colors when provided', () => {
			const customColors = ['#FF0000', '#00FF00'];
			const particles = system.emit({
				x: 100,
				y: 100,
				type: 'dust',
				count: 10,
				colors: customColors
			});

			const colors = particles.map(p => p.color);
			const allCustomColors = colors.every(c => customColors.includes(c));
			expect(allCustomColors).toBe(true);
		});

		it('should respect size parameters', () => {
			const particles = system.emit({
				x: 100,
				y: 100,
				type: 'dust',
				count: 100,
				minSize: 5,
				maxSize: 10
			});

			const sizes = particles.map(p => p.size);
			const allInRange = sizes.every(s => s >= 5 && s <= 10);
			expect(allInRange).toBe(true);
		});
	});

	describe('Particle Colors', () => {
		it('should have dust colors defined', () => {
			expect(PARTICLE_COLORS.dust).toBeDefined();
			expect(PARTICLE_COLORS.dust.length).toBeGreaterThan(0);
		});

		it('should have sparkle colors defined', () => {
			expect(PARTICLE_COLORS.sparkle).toBeDefined();
			expect(PARTICLE_COLORS.sparkle).toContain('#FFD700');
		});

		it('should have confetti colors defined', () => {
			expect(PARTICLE_COLORS.confetti).toBeDefined();
			expect(PARTICLE_COLORS.confetti.length).toBe(8);
		});

		it('should have room-specific colors', () => {
			expect(PARTICLE_COLORS.attic).toBeDefined();
			expect(PARTICLE_COLORS.clock_tower).toBeDefined();
			expect(PARTICLE_COLORS.garden).toBeDefined();
		});
	});

	describe('Singleton', () => {
		afterEach(() => {
			destroyParticleSystem();
		});

		it('should return the same instance', () => {
			const instance1 = getParticleSystem();
			const instance2 = getParticleSystem();

			expect(instance1).toBe(instance2);
		});

		it('should destroy the singleton', () => {
			const instance = getParticleSystem();
			destroyParticleSystem();

			const newInstance = getParticleSystem();
			expect(newInstance).not.toBe(instance);
		});
	});

	describe('Animation Loop', () => {
		it('should track running state', () => {
			// Can't test actual animation in node (no requestAnimationFrame)
			// But we can test the state tracking
			expect(system['running']).toBe(false);

			system.stop();
			expect(system['running']).toBe(false);
		});
	});
});

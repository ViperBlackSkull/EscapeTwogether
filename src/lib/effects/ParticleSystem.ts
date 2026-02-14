// Particle System for EscapeTogether
// Creates ambient particles, celebration effects, and room-specific visual effects

import { Container, Graphics, Assets, Sprite, Texture } from 'pixi.js';

// Particle configuration
export interface ParticleConfig {
	// Visual properties
	color: number;
	alpha: number;
	minSize: number;
	maxSize: number;
	shape: 'circle' | 'square' | 'star' | 'spark';
	
	// Movement
	velocityX: { min: number; max: number };
	velocityY: { min: number; max: number };
	gravity: number;
	drag: number;
	
	// Lifetime
	lifetime: { min: number; max: number }; // in seconds
	fadeOut: boolean;
	
	// Spawn
	spawnRate: number; // particles per second
	maxParticles: number;
	
	// Emission area
	emissionArea: {
		x: number;
		y: number;
		width: number;
		height: number;
		shape: 'rectangle' | 'circle' | 'line';
	};
	
	// Behavior
	rotation: { min: number; max: number };
	rotationSpeed: { min: number; max: number };
	wobble: { amount: number; speed: number };
}

// Individual particle
interface Particle {
	sprite: Graphics;
	velocityX: number;
	velocityY: number;
	rotation: number;
	rotationSpeed: number;
	lifetime: number;
	maxLifetime: number;
	wobbleOffset: number;
	wobbleSpeed: number;
	wobbleAmount: number;
	alpha: number;
}

// Preset configurations for different effects
export const PARTICLE_PRESETS = {
	// Attic - Dust motes in light beams
	dustMotes: {
		color: 0xd4a574,
		alpha: 0.4,
		minSize: 1,
		maxSize: 3,
		shape: 'circle' as const,
		velocityX: { min: -5, max: 5 },
		velocityY: { min: -10, max: -5 },
		gravity: 0,
		drag: 0.98,
		lifetime: { min: 4, max: 8 },
		fadeOut: true,
		spawnRate: 5,
		maxParticles: 50,
		emissionArea: { x: 0, y: 0, width: 200, height: 100, shape: 'rectangle' as const },
		rotation: { min: 0, max: 0 },
		rotationSpeed: { min: 0, max: 0 },
		wobble: { amount: 20, speed: 0.5 }
	},

	// Clock Tower - Gear sparkles
	gearSparkles: {
		color: 0xffd700,
		alpha: 0.8,
		minSize: 2,
		maxSize: 4,
		shape: 'spark' as const,
		velocityX: { min: -30, max: 30 },
		velocityY: { min: -30, max: 30 },
		gravity: 0,
		drag: 0.95,
		lifetime: { min: 0.5, max: 1.5 },
		fadeOut: true,
		spawnRate: 0,
		maxParticles: 100,
		emissionArea: { x: 0, y: 0, width: 50, height: 50, shape: 'circle' as const },
		rotation: { min: 0, max: Math.PI * 2 },
		rotationSpeed: { min: -2, max: 2 },
		wobble: { amount: 0, speed: 0 }
	},

	// Garden - Fireflies
	fireflies: {
		color: 0xffff88,
		alpha: 0.6,
		minSize: 2,
		maxSize: 4,
		shape: 'circle' as const,
		velocityX: { min: -20, max: 20 },
		velocityY: { min: -20, max: 20 },
		gravity: 0,
		drag: 0.99,
		lifetime: { min: 3, max: 6 },
		fadeOut: true,
		spawnRate: 2,
		maxParticles: 30,
		emissionArea: { x: 0, y: 0, width: 800, height: 600, shape: 'rectangle' as const },
		rotation: { min: 0, max: 0 },
		rotationSpeed: { min: 0, max: 0 },
		wobble: { amount: 50, speed: 0.3 }
	},

	// Candle flicker (small warm particles)
	candleFlicker: {
		color: 0xff8844,
		alpha: 0.7,
		minSize: 1,
		maxSize: 2,
		shape: 'circle' as const,
		velocityX: { min: -10, max: 10 },
		velocityY: { min: -30, max: -10 },
		gravity: -5,
		drag: 0.95,
		lifetime: { min: 0.3, max: 0.8 },
		fadeOut: true,
		spawnRate: 20,
		maxParticles: 50,
		emissionArea: { x: 0, y: 0, width: 10, height: 10, shape: 'circle' as const },
		rotation: { min: 0, max: 0 },
		rotationSpeed: { min: 0, max: 0 },
		wobble: { amount: 5, speed: 2 }
	},

	// Puzzle completion sparkles
	puzzleSparkles: {
		color: 0xffd700,
		alpha: 1,
		minSize: 3,
		maxSize: 6,
		shape: 'star' as const,
		velocityX: { min: -100, max: 100 },
		velocityY: { min: -100, max: 100 },
		gravity: 50,
		drag: 0.98,
		lifetime: { min: 1, max: 2 },
		fadeOut: true,
		spawnRate: 0,
		maxParticles: 100,
		emissionArea: { x: 0, y: 0, width: 100, height: 100, shape: 'circle' as const },
		rotation: { min: 0, max: Math.PI * 2 },
		rotationSpeed: { min: -3, max: 3 },
		wobble: { amount: 0, speed: 0 }
	},

	// Victory confetti
	confetti: {
		color: 0xff6b6b,
		alpha: 1,
		minSize: 5,
		maxSize: 10,
		shape: 'square' as const,
		velocityX: { min: -150, max: 150 },
		velocityY: { min: -300, max: -100 },
		gravity: 200,
		drag: 0.99,
		lifetime: { min: 3, max: 5 },
		fadeOut: true,
		spawnRate: 0,
		maxParticles: 200,
		emissionArea: { x: 0, y: 0, width: 800, height: 10, shape: 'line' as const },
		rotation: { min: 0, max: Math.PI * 2 },
		rotationSpeed: { min: -5, max: 5 },
		wobble: { amount: 30, speed: 1 }
	},

	// Rain drops (Garden room ambient)
	rain: {
		color: 0x6699cc,
		alpha: 0.5,
		minSize: 1,
		maxSize: 2,
		shape: 'circle' as const,
		velocityX: { min: 20, max: 40 },
		velocityY: { min: 200, max: 300 },
		gravity: 100,
		drag: 0.99,
		lifetime: { min: 1, max: 2 },
		fadeOut: false,
		spawnRate: 30,
		maxParticles: 100,
		emissionArea: { x: 0, y: 0, width: 900, height: 10, shape: 'line' as const },
		rotation: { min: 0, max: 0 },
		rotationSpeed: { min: 0, max: 0 },
		wobble: { amount: 0, speed: 0 }
	}
};

// Particle emitter class
export class ParticleEmitter {
	private container: Container;
	private config: ParticleConfig;
	private particles: Particle[] = [];
	private spawnTimer: number = 0;
	private isRunning: boolean = false;
	private time: number = 0;
	private position: { x: number; y: number } = { x: 0, y: 0 };

	constructor(container: Container, config: ParticleConfig) {
		this.container = container;
		this.config = { ...config };
	}

	// Set emitter position
	setPosition(x: number, y: number): void {
		this.position = { x, y };
	}

	// Start emitting particles
	start(): void {
		this.isRunning = true;
	}

	// Stop emitting (existing particles continue)
	stop(): void {
		this.isRunning = false;
	}

	// Emit a burst of particles
	emit(count: number, position?: { x: number; y: number }): void {
		if (position) {
			this.position = position;
		}
		for (let i = 0; i < count; i++) {
			this.spawnParticle();
		}
	}

	// Update particles (call every frame)
	update(deltaTime: number): void {
		this.time += deltaTime;

		// Spawn new particles if running
		if (this.isRunning && this.config.spawnRate > 0) {
			this.spawnTimer += deltaTime;
			const spawnInterval = 1 / this.config.spawnRate;
			
			while (this.spawnTimer >= spawnInterval && this.particles.length < this.config.maxParticles) {
				this.spawnParticle();
				this.spawnTimer -= spawnInterval;
			}
		}

		// Update existing particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];
			
			// Update lifetime
			particle.lifetime -= deltaTime;
			if (particle.lifetime <= 0) {
				this.destroyParticle(particle, i);
				continue;
			}

			// Apply physics
			particle.velocityY += this.config.gravity * deltaTime;
			particle.velocityX *= this.config.drag;
			particle.velocityY *= this.config.drag;

			// Apply wobble
			if (particle.wobbleAmount > 0) {
				particle.wobbleOffset += particle.wobbleSpeed * deltaTime;
				particle.sprite.x += Math.sin(particle.wobbleOffset) * particle.wobbleAmount * deltaTime;
			}

			// Move particle
			particle.sprite.x += particle.velocityX * deltaTime;
			particle.sprite.y += particle.velocityY * deltaTime;

			// Rotate
			particle.rotation += particle.rotationSpeed * deltaTime;
			particle.sprite.rotation = particle.rotation;

			// Fade out
			if (this.config.fadeOut) {
				const lifeRatio = particle.lifetime / particle.maxLifetime;
				particle.sprite.alpha = particle.alpha * lifeRatio;
			}
		}
	}

	// Spawn a single particle
	private spawnParticle(): void {
		if (this.particles.length >= this.config.maxParticles) return;

		const sprite = this.createParticleSprite();
		
		// Calculate spawn position
		const area = this.config.emissionArea;
		let spawnX = this.position.x + area.x;
		let spawnY = this.position.y + area.y;

		if (area.shape === 'rectangle') {
			spawnX += Math.random() * area.width;
			spawnY += Math.random() * area.height;
		} else if (area.shape === 'circle') {
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * (area.width / 2);
			spawnX += Math.cos(angle) * radius;
			spawnY += Math.sin(angle) * radius;
		} else if (area.shape === 'line') {
			spawnX += Math.random() * area.width;
		}

		sprite.x = spawnX;
		sprite.y = spawnY;

		// Calculate initial velocity
		const velocityX = this.randomRange(this.config.velocityX.min, this.config.velocityX.max);
		const velocityY = this.randomRange(this.config.velocityY.min, this.config.velocityY.max);

		// Calculate lifetime
		const lifetime = this.randomRange(this.config.lifetime.min, this.config.lifetime.max);

		const particle: Particle = {
			sprite,
			velocityX,
			velocityY,
			rotation: this.randomRange(this.config.rotation.min, this.config.rotation.max),
			rotationSpeed: this.randomRange(this.config.rotationSpeed.min, this.config.rotationSpeed.max),
			lifetime,
			maxLifetime: lifetime,
			wobbleOffset: Math.random() * Math.PI * 2,
			wobbleSpeed: this.config.wobble.speed,
			wobbleAmount: this.config.wobble.amount,
			alpha: this.config.alpha
		};

		this.particles.push(particle);
		this.container.addChild(sprite);
	}

	// Create particle sprite
	private createParticleSprite(): Graphics {
		const sprite = new Graphics();
		const size = this.randomRange(this.config.minSize, this.config.maxSize);
		const color = this.config.color;
		const alpha = this.config.alpha;

		sprite.alpha = alpha;

		switch (this.config.shape) {
			case 'circle':
				sprite.setFillStyle({ color, alpha });
				sprite.circle(0, 0, size);
				sprite.fill();
				break;

			case 'square':
				sprite.setFillStyle({ color, alpha });
				sprite.rect(-size / 2, -size / 2, size, size * 2);
				sprite.fill();
				break;

			case 'star':
				sprite.setFillStyle({ color, alpha });
				this.drawStar(sprite, 0, 0, 5, size, size / 2);
				sprite.fill();
				break;

			case 'spark':
				sprite.setStrokeStyle({ width: 1, color, alpha });
				sprite.moveTo(-size, 0);
				sprite.lineTo(size, 0);
				sprite.moveTo(0, -size);
				sprite.lineTo(0, size);
				sprite.stroke();
				break;
		}

		return sprite;
	}

	// Draw star shape
	private drawStar(graphics: Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
		const step = Math.PI / points;
		let angle = -Math.PI / 2;

		graphics.moveTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);

		for (let i = 0; i < points * 2; i++) {
			const radius = i % 2 === 0 ? outerRadius : innerRadius;
			angle += step;
			graphics.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
		}

		graphics.closePath();
	}

	// Destroy a particle
	private destroyParticle(particle: Particle, index: number): void {
		this.container.removeChild(particle.sprite);
		particle.sprite.destroy();
		this.particles.splice(index, 1);
	}

	// Get random number in range
	private randomRange(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	// Clean up all particles
	destroy(): void {
		this.stop();
		for (const particle of this.particles) {
			this.container.removeChild(particle.sprite);
			particle.sprite.destroy();
		}
		this.particles = [];
	}

	// Get particle count
	getParticleCount(): number {
		return this.particles.length;
	}
}

// Particle manager for multiple emitters
export class ParticleManager {
	private container: Container;
	private emitters: Map<string, ParticleEmitter> = new Map();

	constructor(container: Container) {
		this.container = container;
	}

	// Create an emitter with a preset
	createEmitter(id: string, preset: keyof typeof PARTICLE_PRESETS): ParticleEmitter {
		const config = PARTICLE_PRESETS[preset];
		const emitter = new ParticleEmitter(this.container, config);
		this.emitters.set(id, emitter);
		return emitter;
	}

	// Create a custom emitter
	createCustomEmitter(id: string, config: ParticleConfig): ParticleEmitter {
		const emitter = new ParticleEmitter(this.container, config);
		this.emitters.set(id, emitter);
		return emitter;
	}

	// Get an emitter by ID
	getEmitter(id: string): ParticleEmitter | undefined {
		return this.emitters.get(id);
	}

	// Remove an emitter
	removeEmitter(id: string): void {
		const emitter = this.emitters.get(id);
		if (emitter) {
			emitter.destroy();
			this.emitters.delete(id);
		}
	}

	// Update all emitters
	update(deltaTime: number): void {
		for (const emitter of this.emitters.values()) {
			emitter.update(deltaTime);
		}
	}

	// Destroy all emitters
	destroy(): void {
		for (const emitter of this.emitters.values()) {
			emitter.destroy();
		}
		this.emitters.clear();
	}

	// Emit a one-shot effect (convenience method)
	emitEffect(preset: keyof typeof PARTICLE_PRESETS, position: { x: number; y: number }, count: number = 20): void {
		const tempId = `effect_${Date.now()}`;
		const emitter = this.createEmitter(tempId, preset);
		emitter.setPosition(position.x, position.y);
		emitter.emit(count);

		// Auto-cleanup after particles expire
		setTimeout(() => {
			this.removeEmitter(tempId);
		}, 3000);
	}
}

export default ParticleManager;

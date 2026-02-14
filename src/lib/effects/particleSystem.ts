/**
 * Particle Effects System for EscapeTogether
 *
 * A reusable particle system for visual polish throughout the game.
 * Supports multiple particle types:
 * - Dust particles (ambient floating)
 * - Sparkles (puzzle solve celebration)
 * - Room-specific ambient effects
 * - Confetti (victory celebration)
 */

// ============================================
// Types
// ============================================

export interface Particle {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	rotation: number;
	rotationSpeed: number;
	color: string;
	life: number;
	maxLife: number;
	// Optional properties
	shape?: 'circle' | 'square' | 'star' | 'triangle';
	gravity?: number;
	friction?: number;
	wobble?: number;
	wobbleSpeed?: number;
	wobbleOffset?: number;
}

export type ParticleType =
	| 'dust'
	| 'sparkle'
	| 'confetti'
	| 'glow'
	| 'bubbles'
	| 'leaves'
	| 'snowflakes'
	| 'stars'
	| 'hearts';

export interface EmitterConfig {
	x: number;
	y: number;
	type: ParticleType;
	count: number;
	spread?: number;
	rate?: number; // Particles per second (for continuous)
	continuous?: boolean;
	duration?: number; // For continuous emitters (ms)
	colors?: string[];
	minSize?: number;
	maxSize?: number;
	minSpeed?: number;
	maxSpeed?: number;
	direction?: number; // Degrees, 0 = up
	spreadAngle?: number; // Degrees of spread
	gravity?: number;
}

// ============================================
// Color Palettes by Theme
// ============================================

export const PARTICLE_COLORS = {
	dust: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 248, 220, 0.3)', 'rgba(245, 222, 179, 0.2)'],
	sparkle: ['#FFD700', '#FFF8DC', '#FFEC8B', '#FFE4B5', '#FFDAB9'],
	confetti: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FF9F43', '#FFD700'],
	glow: ['#FFD700', '#FFA500', '#FF6347', '#FF4500'],
	bubbles: ['rgba(173, 216, 230, 0.4)', 'rgba(135, 206, 250, 0.3)', 'rgba(176, 224, 230, 0.35)'],
	leaves: ['#228B22', '#32CD32', '#90EE90', '#8B4513', '#D2691E'],
	snowflakes: ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#B0E0E6'],
	stars: ['#FFD700', '#FFF8DC', '#FFFACD', '#F0E68C'],
	hearts: ['#FF69B4', '#FF1493', '#DC143C', '#FF6B6B', '#FFB6C1'],
	// Room-specific palettes
	attic: ['rgba(139, 90, 43, 0.3)', 'rgba(210, 180, 140, 0.2)', 'rgba(255, 248, 220, 0.25)'],
	clock_tower: ['rgba(255, 215, 0, 0.3)', 'rgba(192, 192, 192, 0.2)', 'rgba(255, 248, 220, 0.25)'],
	garden: ['#90EE90', '#98FB98', '#00FA9A', '#7CFC00', '#ADFF2F'],
};

// ============================================
// Particle Factory
// ============================================

let particleIdCounter = 0;

function createParticle(config: {
	x: number;
	y: number;
	type: ParticleType;
	colors?: string[];
	minSize?: number;
	maxSize?: number;
	minSpeed?: number;
	maxSpeed?: number;
	direction?: number;
	spreadAngle?: number;
	gravity?: number;
}): Particle {
	const {
		x,
		y,
		type,
		colors = PARTICLE_COLORS[type] || PARTICLE_COLORS.dust,
		minSize = 2,
		maxSize = 8,
		minSpeed = 0.5,
		maxSpeed = 2,
		direction = 270, // Up by default
		spreadAngle = 60,
		gravity = 0.02,
	} = config;

	const size = minSize + Math.random() * (maxSize - minSize);
	const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
	const angle = ((direction + (Math.random() - 0.5) * spreadAngle) * Math.PI) / 180;
	const color = colors[Math.floor(Math.random() * colors.length)];

	// Type-specific properties
	const typeDefaults: Partial<Particle> = getTypeDefaults(type);

	return {
		id: ++particleIdCounter,
		x,
		y,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		size,
		opacity: 0.6 + Math.random() * 0.4,
		rotation: Math.random() * 360,
		rotationSpeed: (Math.random() - 0.5) * 4,
		color,
		life: 0,
		maxLife: 3000 + Math.random() * 2000,
		gravity,
		shape: 'circle',
		...typeDefaults,
	};
}

function getTypeDefaults(type: ParticleType): Partial<Particle> {
	switch (type) {
		case 'dust':
			return {
				maxLife: 5000 + Math.random() * 3000,
				gravity: 0,
				friction: 0.99,
				wobble: 0.5,
				wobbleSpeed: 0.02,
				wobbleOffset: Math.random() * Math.PI * 2,
				shape: 'circle',
			};
		case 'sparkle':
			return {
				maxLife: 800 + Math.random() * 400,
				gravity: -0.05,
				shape: 'star',
				rotationSpeed: (Math.random() - 0.5) * 10,
			};
		case 'confetti':
			return {
				maxLife: 4000 + Math.random() * 2000,
				gravity: 0.1,
				shape: 'square',
				rotationSpeed: (Math.random() - 0.5) * 15,
			};
		case 'glow':
			return {
				maxLife: 600 + Math.random() * 400,
				gravity: -0.03,
				shape: 'circle',
			};
		case 'bubbles':
			return {
				maxLife: 3000 + Math.random() * 2000,
				gravity: -0.02,
				shape: 'circle',
				wobble: 1,
				wobbleSpeed: 0.03,
				wobbleOffset: Math.random() * Math.PI * 2,
			};
		case 'leaves':
			return {
				maxLife: 6000 + Math.random() * 3000,
				gravity: 0.03,
				shape: 'triangle',
				wobble: 2,
				wobbleSpeed: 0.02,
				wobbleOffset: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 5,
			};
		case 'snowflakes':
			return {
				maxLife: 8000 + Math.random() * 4000,
				gravity: 0.01,
				shape: 'circle',
				wobble: 1.5,
				wobbleSpeed: 0.015,
				wobbleOffset: Math.random() * Math.PI * 2,
			};
		case 'stars':
			return {
				maxLife: 2000 + Math.random() * 1000,
				gravity: -0.02,
				shape: 'star',
			};
		case 'hearts':
			return {
				maxLife: 1500 + Math.random() * 1000,
				gravity: -0.04,
				shape: 'triangle', // Will render as heart
				wobble: 0.5,
				wobbleSpeed: 0.05,
				wobbleOffset: Math.random() * Math.PI * 2,
			};
		default:
			return {};
	}
}

// ============================================
// Particle System Class
// ============================================

export class ParticleSystem {
	private particles: Particle[] = [];
	private emitters: Map<string, EmitterConfig> = new Map();
	private animationFrame: number | null = null;
	private lastTime: number = 0;
	private running: boolean = false;
	private onParticlesUpdate: ((particles: Particle[]) => void) | null = null;

	constructor(callback?: (particles: Particle[]) => void) {
		this.onParticlesUpdate = callback || null;
	}

	// Set callback for particle updates
	setCallback(callback: (particles: Particle[]) => void): void {
		this.onParticlesUpdate = callback;
	}

	// Emit a burst of particles
	emit(config: EmitterConfig): Particle[] {
		const particles: Particle[] = [];

		for (let i = 0; i < config.count; i++) {
			const offsetX = config.spread ? (Math.random() - 0.5) * config.spread : 0;
			const offsetY = config.spread ? (Math.random() - 0.5) * config.spread : 0;

			particles.push(
				createParticle({
					x: config.x + offsetX,
					y: config.y + offsetY,
					type: config.type,
					colors: config.colors,
					minSize: config.minSize,
					maxSize: config.maxSize,
					minSpeed: config.minSpeed,
					maxSpeed: config.maxSpeed,
					direction: config.direction,
					spreadAngle: config.spreadAngle,
					gravity: config.gravity,
				})
			);
		}

		this.particles.push(...particles);
		return particles;
	}

	// Add a continuous emitter
	addEmitter(id: string, config: EmitterConfig): void {
		this.emitters.set(id, { ...config, continuous: true });
	}

	// Remove a continuous emitter
	removeEmitter(id: string): void {
		this.emitters.delete(id);
	}

	// Clear all emitters
	clearEmitters(): void {
		this.emitters.clear();
	}

	// Update particles
	update(deltaTime: number): void {
		// Update existing particles
		this.particles = this.particles
			.map((p) => {
				let newVx = p.vx;
				let newVy = p.vy;

				// Apply gravity
				if (p.gravity) {
					newVy += p.gravity;
				}

				// Apply friction
				if (p.friction) {
					newVx *= p.friction;
					newVy *= p.friction;
				}

				// Apply wobble
				let wobbleX = 0;
				if (p.wobble && p.wobbleSpeed && p.wobbleOffset !== undefined) {
					wobbleX = Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * p.wobble;
				}

				return {
					...p,
					x: p.x + newVx + wobbleX,
					y: p.y + newVy,
					vx: newVx,
					vy: newVy,
					rotation: p.rotation + (p.rotationSpeed || 0),
					life: p.life + deltaTime,
					opacity: Math.max(0, 1 - p.life / p.maxLife) * (p.opacity > 1 ? 1 : p.opacity),
				};
			})
			.filter((p) => p.life < p.maxLife);

		// Emit from continuous emitters
		for (const [id, config] of this.emitters) {
			if (config.rate && config.continuous) {
				const particlesToEmit = Math.floor((deltaTime / 1000) * config.rate);
				if (particlesToEmit > 0 && Math.random() < (deltaTime / 1000) * config.rate) {
					this.emit({ ...config, count: 1 });
				}
			}
		}

		// Notify callback
		if (this.onParticlesUpdate) {
			this.onParticlesUpdate(this.particles);
		}
	}

	// Start the animation loop
	start(): void {
		if (this.running) return;
		this.running = true;
		this.lastTime = performance.now();
		this.animate();
	}

	// Stop the animation loop
	stop(): void {
		this.running = false;
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	// Animation loop
	private animate = (): void => {
		if (!this.running) return;

		const now = performance.now();
		const deltaTime = now - this.lastTime;
		this.lastTime = now;

		this.update(deltaTime);
		this.animationFrame = requestAnimationFrame(this.animate);
	};

	// Get current particles
	getParticles(): Particle[] {
		return this.particles;
	}

	// Clear all particles
	clear(): void {
		this.particles = [];
	}

	// Check if system has particles
	hasParticles(): boolean {
		return this.particles.length > 0;
	}

	// Get particle count
	getParticleCount(): number {
		return this.particles.length;
	}
}

// ============================================
// Preset Effects
// ============================================

export function createDustEffect(system: ParticleSystem, width: number, height: number): void {
	system.addEmitter('dust', {
		x: width / 2,
		y: height / 2,
		type: 'dust',
		count: 0,
		rate: 2,
		spread: width,
		continuous: true,
		colors: PARTICLE_COLORS.dust,
		minSize: 1,
		maxSize: 3,
		minSpeed: 0.1,
		maxSpeed: 0.3,
		direction: 90,
		spreadAngle: 360,
		gravity: 0,
	});
}

export function createSparkleEffect(system: ParticleSystem, x: number, y: number): void {
	system.emit({
		x,
		y,
		type: 'sparkle',
		count: 20,
		spread: 30,
		colors: PARTICLE_COLORS.sparkle,
		minSize: 3,
		maxSize: 8,
		minSpeed: 2,
		maxSpeed: 5,
		direction: 270,
		spreadAngle: 120,
		gravity: -0.05,
	});
}

export function createPuzzleSolveEffect(system: ParticleSystem, x: number, y: number): void {
	// Burst of sparkles
	system.emit({
		x,
		y,
		type: 'sparkle',
		count: 30,
		spread: 50,
		colors: PARTICLE_COLORS.sparkle,
		minSize: 4,
		maxSize: 10,
		minSpeed: 3,
		maxSpeed: 7,
		direction: 270,
		spreadAngle: 180,
		gravity: -0.08,
	});

	// Add some hearts for celebration
	system.emit({
		x,
		y,
		type: 'hearts',
		count: 10,
		spread: 40,
		colors: PARTICLE_COLORS.hearts,
		minSize: 8,
		maxSize: 16,
		minSpeed: 2,
		maxSpeed: 4,
		direction: 270,
		spreadAngle: 90,
		gravity: -0.05,
	});
}

export function createConfettiEffect(system: ParticleSystem, x: number, y: number, width: number): void {
	// Emit from top of screen
	for (let i = 0; i < 5; i++) {
		setTimeout(() => {
			system.emit({
				x: Math.random() * width,
				y: -20,
				type: 'confetti',
				count: 20,
				spread: 10,
				colors: PARTICLE_COLORS.confetti,
				minSize: 6,
				maxSize: 12,
				minSpeed: 3,
				maxSpeed: 6,
				direction: 180,
				spreadAngle: 60,
				gravity: 0.1,
			});
		}, i * 200);
	}
}

export function createRoomAmbience(system: ParticleSystem, roomId: string, width: number, height: number): void {
	system.clearEmitters();

	switch (roomId) {
		case 'attic':
			// Dusty attic with floating dust particles
			createDustEffect(system, width, height);
			break;

		case 'clock_tower':
			// Mystical clock tower with golden sparkles
			system.addEmitter('clock_tower_glow', {
				x: width / 2,
				y: height / 2,
				type: 'glow',
				count: 0,
				rate: 0.5,
				spread: width * 0.8,
				continuous: true,
				colors: PARTICLE_COLORS.clock_tower,
				minSize: 2,
				maxSize: 5,
				minSpeed: 0.2,
				maxSpeed: 0.5,
				direction: 270,
				spreadAngle: 360,
				gravity: -0.02,
			});
			break;

		case 'garden_conservatory':
			// Garden with floating leaves and pollen
			system.addEmitter('garden_leaves', {
				x: width,
				y: 0,
				type: 'leaves',
				count: 0,
				rate: 0.3,
				spread: 0,
				continuous: true,
				colors: PARTICLE_COLORS.garden,
				minSize: 4,
				maxSize: 10,
				minSpeed: 0.5,
				maxSpeed: 1.5,
				direction: 225,
				spreadAngle: 45,
				gravity: 0.03,
			});
			break;
	}
}

// ============================================
// Utility Functions
// ============================================

export function renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
	ctx.save();
	ctx.globalAlpha = particle.opacity;
	ctx.translate(particle.x, particle.y);
	ctx.rotate((particle.rotation * Math.PI) / 180);

	const size = particle.size;

	switch (particle.shape) {
		case 'circle':
			ctx.beginPath();
			ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
			ctx.fillStyle = particle.color;
			ctx.fill();
			break;

		case 'square':
			ctx.fillStyle = particle.color;
			ctx.fillRect(-size / 2, -size / 4, size, size / 2);
			break;

		case 'star':
			drawStar(ctx, 0, 0, 5, size / 2, size / 4, particle.color);
			break;

		case 'triangle':
			// Draw as leaf or heart depending on color
			if (particle.color.includes('pink') || particle.color.includes('255, 105, 180')) {
				drawHeart(ctx, 0, 0, size, particle.color);
			} else {
				ctx.beginPath();
				ctx.moveTo(0, -size / 2);
				ctx.lineTo(size / 2, size / 2);
				ctx.lineTo(-size / 2, size / 2);
				ctx.closePath();
				ctx.fillStyle = particle.color;
				ctx.fill();
			}
			break;
	}

	ctx.restore();
}

function drawStar(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	spikes: number,
	outerRadius: number,
	innerRadius: number,
	color: string
): void {
	let rot = (Math.PI / 2) * 3;
	let x = cx;
	let y = cy;
	const step = Math.PI / spikes;

	ctx.beginPath();
	ctx.moveTo(cx, cy - outerRadius);

	for (let i = 0; i < spikes; i++) {
		x = cx + Math.cos(rot) * outerRadius;
		y = cy + Math.sin(rot) * outerRadius;
		ctx.lineTo(x, y);
		rot += step;

		x = cx + Math.cos(rot) * innerRadius;
		y = cy + Math.sin(rot) * innerRadius;
		ctx.lineTo(x, y);
		rot += step;
	}

	ctx.lineTo(cx, cy - outerRadius);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
	const width = size;
	const height = size;

	ctx.beginPath();
	ctx.moveTo(x, y + height / 4);

	// Left curve
	ctx.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + height / 4);

	// Bottom left
	ctx.bezierCurveTo(x - width / 2, y + height / 2, x, y + (height * 3) / 4, x, y + height);

	// Bottom right
	ctx.bezierCurveTo(x, y + (height * 3) / 4, x + width / 2, y + height / 2, x + width / 2, y + height / 4);

	// Top right
	ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + height / 4);

	ctx.fillStyle = color;
	ctx.fill();
}

// Singleton instance for global use
let globalParticleSystem: ParticleSystem | null = null;

export function getParticleSystem(): ParticleSystem {
	if (!globalParticleSystem) {
		globalParticleSystem = new ParticleSystem();
	}
	return globalParticleSystem;
}

export function destroyParticleSystem(): void {
	if (globalParticleSystem) {
		globalParticleSystem.stop();
		globalParticleSystem.clear();
		globalParticleSystem = null;
	}
}

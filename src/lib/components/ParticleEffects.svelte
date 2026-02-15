<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { Container } from 'pixi.js';
	import { ParticleManager, PARTICLE_PRESETS, type ParticleConfig } from '$lib/effects/pixiParticles';

	export let width: number = 800;
	export let height: number = 600;
	export let roomType: 'attic' | 'clock_tower' | 'garden' = 'attic';
	export let enableAmbient: boolean = true;
	export let showDebug: boolean = false;

	let containerEl: HTMLDivElement;
	let particleManager: ParticleManager | null = null;
	let pixiContainer: Container | null = null;

	const dispatch = createEventDispatcher();

	// Room-specific ambient configurations
	const roomAmbientConfig: Record<string, { preset: keyof typeof PARTICLE_PRESETS; count: number }[]> = {
		attic: [
			{ preset: 'dustMotes', count: 50 }
		],
		clock_tower: [
			{ preset: 'gearSparkles', count: 20 }
		],
		garden: [
			{ preset: 'fireflies', count: 30 }
		]
	};

	onMount(() => {
		if (!browser || !containerEl) return;

		// Create a simple container for particles
		pixiContainer = new Container();
		particleManager = new ParticleManager(pixiContainer);

		// Set up ambient effects for the room
		if (enableAmbient) {
			setupAmbientEffects();
		}

		dispatch('ready', { particleManager });

		// Start animation loop
		requestAnimationFrame(animate);
	});

	function setupAmbientEffects() {
		if (!particleManager) return;

		const config = roomAmbientConfig[roomType] || [];
		
		config.forEach((effect, index) => {
			const emitter = particleManager?.createEmitter(`ambient_${index}`, effect.preset);
			if (emitter) {
				// Position emitter for the room
				emitter.setPosition(width / 2, height / 3);
				emitter.start();
			}
		});
	}

	let lastTime = performance.now();
	function animate() {
		if (!particleManager) return;

		const currentTime = performance.now();
		const deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;

		particleManager.update(deltaTime);

		requestAnimationFrame(animate);
	}

	// Public methods
	export function emitSparkles(x: number, y: number, count: number = 20) {
		particleManager?.emitEffect('puzzleSparkles', { x, y }, count);
	}

	export function emitConfetti(count: number = 100) {
		// Emit confetti from top of screen
		particleManager?.emitEffect('confetti', { x: width / 2, y: 0 }, count);
	}

	export function emitCandleFlicker(x: number, y: number) {
		const emitter = particleManager?.createEmitter('candle_' + Date.now(), 'candleFlicker');
		if (emitter) {
			emitter.setPosition(x, y);
			emitter.start();
		}
	}

	export function createCustomEmitter(id: string, config: ParticleConfig) {
		return particleManager?.createCustomEmitter(id, config);
	}

	export function getEmitter(id: string) {
		return particleManager?.getEmitter(id);
	}

	onDestroy(() => {
		if (particleManager) {
			particleManager.destroy();
			particleManager = null;
		}
	});
</script>

<div bind:this={containerEl} class="particle-container" style="width: {width}px; height: {height}px;">
	{#if showDebug && particleManager}
		<div class="debug-overlay">
			<small>Particles Active</small>
		</div>
	{/if}
	<slot {particleManager} {emitSparkles} {emitConfetti} />
</div>

<style>
	.particle-container {
		position: relative;
		pointer-events: none;
	}

	.debug-overlay {
		position: absolute;
		top: 4px;
		right: 4px;
		background: rgba(0, 0, 0, 0.5);
		padding: 4px 8px;
		border-radius: 4px;
		color: white;
		font-size: 12px;
		pointer-events: none;
	}
</style>

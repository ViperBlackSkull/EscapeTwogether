<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import {
		ParticleSystem,
		getParticleSystem,
		createRoomAmbience,
		createSparkleEffect,
		createPuzzleSolveEffect,
		createConfettiEffect,
		renderParticle,
		type Particle
	} from './particleSystem';

	// Props
	export let width: number = 800;
	export let height: number = 600;
	export let roomId: string = 'attic';
	export let enabled: boolean = true;
	export let opacity: number = 0.8;
	export let zIndex: number = 10;

	// State
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let particleSystem: ParticleSystem;
	let particles: Particle[] = [];
	let animationFrame: number;

	const dispatch = createEventDispatcher();

	// Initialize
	onMount(() => {
		if (!enabled) return;

		canvas = document.createElement('canvas');
		ctx = canvas.getContext('2d')!;

		particleSystem = getParticleSystem();
		particleSystem.setCallback((updatedParticles) => {
			particles = updatedParticles;
		});

		// Set up room ambience
		createRoomAmbience(particleSystem, roomId, width, height);
		particleSystem.start();

		// Start render loop
		render();
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		if (particleSystem) {
			particleSystem.stop();
		}
	});

	// Render loop
	function render(): void {
		if (!ctx || !enabled) return;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Render particles
		for (const particle of particles) {
			renderParticle(ctx, particle);
		}

		animationFrame = requestAnimationFrame(render);
	}

	// Public methods via exports
	export function emitSparkles(x: number, y: number): void {
		if (particleSystem) {
			createSparkleEffect(particleSystem, x, y);
			dispatch('sparkle', { x, y });
		}
	}

	export function emitPuzzleSolve(x: number, y: number): void {
		if (particleSystem) {
			createPuzzleSolveEffect(particleSystem, x, y);
			dispatch('puzzlesolve', { x, y });
		}
	}

	export function emitConfetti(): void {
		if (particleSystem) {
			createConfettiEffect(particleSystem, width / 2, 0, width);
			dispatch('confetti');
		}
	}

	export function setRoom(roomId: string): void {
		if (particleSystem) {
			createRoomAmbience(particleSystem, roomId, width, height);
			dispatch('roomchange', { roomId });
		}
	}

	export function clearParticles(): void {
		if (particleSystem) {
			particleSystem.clear();
		}
	}

	// Watch for room changes
	$: if (particleSystem && roomId) {
		createRoomAmbience(particleSystem, roomId, width, height);
	}

	// Watch for dimension changes
	$: if (canvas) {
		canvas.width = width;
		canvas.height = height;
	}
</script>

{#if enabled}
	<div
		class="particle-container"
		style="width: {width}px; height: {height}px; opacity: {opacity}; z-index: {zIndex};"
	>
		<canvas
			bind:this={canvas}
			{width}
			{height}
			class="particle-canvas"
		/>
	</div>
{/if}

<style>
	.particle-container {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.particle-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>

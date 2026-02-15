<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import { onMount, onDestroy } from 'svelte';
	import { soundManager } from '$lib/audio';

	export let totalPlayTime: number = 0;
	export let roomsCompleted: number = 0;
	export let puzzlesSolved: number = 0;
	export let playerNames: { playerA: string; playerB: string } = { playerA: 'Player 1', playerB: 'Player 2' };
	export let defeatReason: 'timeout' | 'disconnected' | 'abandoned' = 'timeout';
	export let onRestart: () => void = () => {};
	export let onReturnToLobby: () => void = () => {};

	const dispatch = createEventDispatcher();

	// Animation state
	let showOverlay = false;
	let showTitle = false;
	let showStats = false;
	let showActions = false;

	// Canvas for subtle particle effect
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationFrame: number;
	let isAnimating = true;

	interface DustParticle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		opacity: number;
	}

	let particles: DustParticle[] = [];

	function createDustParticle(): DustParticle {
		return {
			x: Math.random() * (canvas?.width || 800),
			y: Math.random() * (canvas?.height || 600),
			vx: (Math.random() - 0.5) * 0.3,
			vy: Math.random() * 0.5 + 0.2,
			size: Math.random() * 3 + 1,
			opacity: Math.random() * 0.3 + 0.1
		};
	}

	function animateDust() {
		if (!ctx || !isAnimating) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Add new particles occasionally
		if (particles.length < 50 && Math.random() < 0.1) {
			particles.push(createDustParticle());
		}

		// Update and draw particles
		particles = particles.filter(p => {
			p.x += p.vx;
			p.y += p.vy;
			p.opacity -= 0.001;

			if (p.y > canvas.height || p.opacity <= 0) return false;

			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(201, 169, 166, ${p.opacity})`;
			ctx.fill();

			return true;
		});

		if (isAnimating) {
			animationFrame = requestAnimationFrame(animateDust);
		}
	}

	function resizeCanvas() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function getDefeatMessage(): { title: string; subtitle: string; icon: string } {
		switch (defeatReason) {
			case 'timeout':
				return {
					title: 'Time\'s Up',
					subtitle: 'The moment has passed...',
					icon: '⏰'
				};
			case 'disconnected':
				return {
					title: 'Connection Lost',
					subtitle: 'Your partner drifted away...',
					icon: '📡'
				};
			case 'abandoned':
				return {
					title: 'Journey Interrupted',
					subtitle: 'The story remains unfinished...',
					icon: '🚪'
				};
			default:
				return {
					title: 'The End... For Now',
					subtitle: 'Every ending is a new beginning',
					icon: '🌙'
				};
		}
	}

	function handleRestart() {
		soundManager.playClick();
		onRestart();
		dispatch('restart');
	}

	function handleReturnToLobby() {
		soundManager.playClick();
		onReturnToLobby();
		dispatch('returnToLobby');
	}

	const defeatInfo = getDefeatMessage();

	onMount(async () => {
		canvas = document.getElementById('dust-canvas') as HTMLCanvasElement;
		ctx = canvas.getContext('2d')!;
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Start dust animation
		animateDust();

		// Play defeat sound
		soundManager.playDefeat();

		// Animation sequence
		showOverlay = true;

		await new Promise(r => setTimeout(r, 300));
		showTitle = true;

		await new Promise(r => setTimeout(r, 800));
		showStats = true;

		await new Promise(r => setTimeout(r, 600));
		showActions = true;
	});

	onDestroy(() => {
		isAnimating = false;
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		window.removeEventListener('resize', resizeCanvas);
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="defeat-overlay">
	<!-- Dust Canvas -->
	<canvas id="dust-canvas" class="dust-canvas"></canvas>

	<!-- Background gradient overlay -->
	{#if showOverlay}
		<div class="bg-gradient" in:fade={{ duration: 500 }}></div>
	{/if}

	<!-- Decorative glows -->
	<div class="decorative-glow glow-1"></div>
	<div class="decorative-glow glow-2"></div>

	<!-- Main content -->
	<div class="defeat-content">
		<!-- Title -->
		{#if showTitle}
			<div class="title-container" in:fly={{ y: -50, duration: 800, easing: backOut }}>
				<div class="defeat-icon">{defeatInfo.icon}</div>
				<h1 class="defeat-title">{defeatInfo.title}</h1>
				<p class="defeat-subtitle">{defeatInfo.subtitle}</p>
			</div>
		{/if}

		<!-- Stats -->
		{#if showStats}
			<div class="stats-container" in:fly={{ y: 30, duration: 700, easing: quintOut }}>
				<div class="stat-card">
					<div class="stat-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<polyline points="12,6 12,12 16,14"/>
						</svg>
					</div>
					<div class="stat-info">
						<span class="stat-value">{formatTime(totalPlayTime)}</span>
						<span class="stat-label">Time Together</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
						</svg>
					</div>
					<div class="stat-info">
						<span class="stat-value">{puzzlesSolved}</span>
						<span class="stat-label">Puzzles Solved</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
						</svg>
					</div>
					<div class="stat-info">
						<span class="stat-value">{roomsCompleted}/3</span>
						<span class="stat-label">Rooms Explored</span>
					</div>
				</div>
			</div>

			<!-- Player message -->
			<div class="players-section" in:fade={{ duration: 600 }}>
				<div class="players-card">
					<p class="players-text">
						<span class="player-name">{playerNames.playerA}</span>
						<span class="connector">&</span>
						<span class="player-name">{playerNames.playerB}</span>
					</p>
					<p class="encouragement">Every journey together is a treasure worth keeping</p>
				</div>
			</div>
		{/if}

		<!-- Actions -->
		{#if showActions}
			<div class="actions-container" in:fly={{ y: 20, duration: 600, easing: quintOut }}>
				<button class="btn btn-primary" on:click={handleRestart}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6M1 20v-6h6"/>
						<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
					</svg>
					Try Again Together
				</button>
				<button class="btn btn-secondary" on:click={handleReturnToLobby}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
						<polyline points="9,22 9,12 15,12 15,22"/>
					</svg>
					Return to Lobby
				</button>
			</div>
		{/if}

		<!-- Footer -->
		{#if showActions}
			<div class="footer-text" in:fade={{ delay: 200, duration: 600 }}>
				<p>The manor's secrets will wait for your return...</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.defeat-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		overflow: hidden;
		font-family: 'Inter', sans-serif;
	}

	.dust-canvas {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.bg-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			rgba(15, 15, 35, 0.98) 0%,
			rgba(26, 26, 46, 0.95) 50%,
			rgba(15, 15, 35, 0.98) 100%
		);
		z-index: 0;
	}

	.decorative-glow {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		z-index: 0;
		opacity: 0.5;
	}

	.glow-1 {
		top: 20%;
		left: 20%;
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(100, 100, 150, 0.15) 0%, transparent 70%);
		animation: floatGlow 8s ease-in-out infinite;
	}

	.glow-2 {
		bottom: 20%;
		right: 20%;
		width: 250px;
		height: 250px;
		background: radial-gradient(circle, rgba(150, 100, 100, 0.1) 0%, transparent 70%);
		animation: floatGlow 10s ease-in-out infinite reverse;
	}

	@keyframes floatGlow {
		0%, 100% { transform: translate(0, 0); }
		50% { transform: translate(30px, -20px); }
	}

	.defeat-content {
		position: relative;
		z-index: 2;
		text-align: center;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
	}

	.title-container {
		margin-bottom: 2.5rem;
	}

	.defeat-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.8;
		animation: gentlePulse 3s ease-in-out infinite;
	}

	@keyframes gentlePulse {
		0%, 100% { transform: scale(1); opacity: 0.8; }
		50% { transform: scale(1.05); opacity: 1; }
	}

	.defeat-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 700;
		color: rgba(201, 169, 166, 0.95);
		margin: 0 0 0.5rem;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		letter-spacing: 0.02em;
	}

	.defeat-subtitle {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1rem, 3vw, 1.5rem);
		color: rgba(201, 169, 166, 0.6);
		font-style: italic;
		margin: 0;
	}

	.stats-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(201, 169, 166, 0.15);
		border-radius: 14px;
		padding: 0.875rem 1.25rem;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		border-color: rgba(201, 169, 166, 0.25);
		transform: translateY(-2px);
	}

	.stat-icon {
		width: 32px;
		height: 32px;
		color: rgba(201, 169, 166, 0.6);
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: rgba(244, 208, 195, 0.9);
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.65rem;
		color: rgba(201, 169, 166, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.players-section {
		margin-bottom: 2rem;
	}

	.players-card {
		display: inline-block;
		background: rgba(201, 169, 166, 0.05);
		border: 1px solid rgba(201, 169, 166, 0.1);
		border-radius: 16px;
		padding: 1.25rem 2rem;
	}

	.players-text {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.1rem;
		color: rgba(244, 208, 195, 0.8);
		margin: 0 0 0.5rem;
	}

	.player-name {
		font-weight: 600;
		color: rgba(201, 169, 166, 0.95);
	}

	.connector {
		margin: 0 0.5rem;
		color: rgba(201, 169, 166, 0.5);
		font-style: italic;
	}

	.encouragement {
		font-size: 0.8rem;
		color: rgba(201, 169, 166, 0.5);
		font-style: italic;
		margin: 0;
	}

	.actions-container {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		font-family: inherit;
	}

	.btn svg {
		width: 18px;
		height: 18px;
	}

	.btn-primary {
		background: rgba(201, 169, 166, 0.2);
		border: 1px solid rgba(201, 169, 166, 0.3);
		color: rgba(244, 208, 195, 0.95);
	}

	.btn-primary:hover {
		background: rgba(201, 169, 166, 0.3);
		border-color: rgba(201, 169, 166, 0.4);
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(201, 169, 166, 0.7);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.footer-text {
		opacity: 0.5;
	}

	.footer-text p {
		margin: 0;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.5);
		font-style: italic;
	}

	@media (max-width: 480px) {
		.stats-container {
			flex-direction: column;
			align-items: center;
		}

		.stat-card {
			width: 100%;
			max-width: 200px;
		}

		.actions-container {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 100%;
			max-width: 240px;
			justify-content: center;
		}

		.defeat-icon {
			font-size: 3rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.defeat-icon,
		.glow-1,
		.glow-2 {
			animation: none;
		}

		.btn {
			transition: none;
		}
	}
</style>

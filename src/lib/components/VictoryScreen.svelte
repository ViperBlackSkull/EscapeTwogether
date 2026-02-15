<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut, elasticOut } from 'svelte/easing';
	import { soundManager } from '$lib/audio';

	// Props
	export let totalPlayTime: number = 0; // in milliseconds
	export let hintsUsed: number = 0;
	export let roomsCompleted: number = 3;
	export let playerNames: { playerA: string; playerB: string } = { playerA: 'Player 1', playerB: 'Player 2' };
	export let onRestart: () => void = () => {};
	export let onReturnToLobby: () => void = () => {};
	export let onShare: () => void = () => {};

	// Animation state
	let showOverlay = false;
	let showTitle = false;
	let showStars = false;
	let showStats = false;
	let showPlayers = false;
	let showActions = false;
	let star1Visible = false;
	let star2Visible = false;
	let star3Visible = false;
	let confettiBurst1 = false;
	let confettiBurst2 = false;

	// Canvas confetti
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationFrame: number;
	let particles: ConfettiParticle[] = [];
	let isAnimating = true;

	// Confetti particle type
	interface ConfettiParticle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		rotation: number;
		rotationSpeed: number;
		color: string;
		size: number;
		shape: 'rect' | 'circle' | 'ribbon';
		opacity: number;
		wobble: number;
		wobbleSpeed: number;
	}

	// Colors for confetti - matching the design system
	const confettiColors = [
		'#FFD700', // Gold
		'#FFC107', // Amber
		'#E5C76B', // Light Gold
		'#D4AF37', // Accent Gold
		'#FF6B6B', // Coral (romantic accent)
		'#C9A9A6', // Dusty Rose
		'#4A9B8C', // Soft Teal
		'#FFFFFF', // White
	];

	// Format time helper
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

	// Create confetti burst
	function createConfettiBurst(originX: number, originY: number, count: number = 50): void {
		if (!ctx) return;

		for (let i = 0; i < count; i++) {
			const angle = (Math.random() * Math.PI * 2);
			const speed = Math.random() * 12 + 4;

			particles.push({
				x: originX,
				y: originY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 5,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 15,
				color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
				size: Math.random() * 12 + 6,
				shape: ['rect', 'circle', 'ribbon'][Math.floor(Math.random() * 3)] as 'rect' | 'circle' | 'ribbon',
				opacity: 1,
				wobble: 0,
				wobbleSpeed: Math.random() * 0.1 + 0.03
			});
		}
	}

	// Create falling confetti
	function createFallingConfetti(): void {
		if (!ctx || particles.length > 200) return;

		const x = Math.random() * canvas.width;

		particles.push({
			x,
			y: -20,
			vx: (Math.random() - 0.5) * 2,
			vy: Math.random() * 2 + 1,
			rotation: Math.random() * 360,
			rotationSpeed: (Math.random() - 0.5) * 8,
			color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
			size: Math.random() * 10 + 5,
			shape: ['rect', 'circle', 'ribbon'][Math.floor(Math.random() * 3)] as 'rect' | 'circle' | 'ribbon',
			opacity: 1,
			wobble: 0,
			wobbleSpeed: Math.random() * 0.08 + 0.02
		});
	}

	// Animate confetti
	function animateConfetti(): void {
		if (!ctx || !isAnimating) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Add new falling confetti periodically
		if (Math.random() < 0.3) {
			createFallingConfetti();
		}

		particles = particles.filter(p => {
			// Update physics
			p.vy += 0.15; // gravity
			p.x += p.vx;
			p.y += p.vy;
			p.rotation += p.rotationSpeed;
			p.wobble += p.wobbleSpeed;

			// Wobble effect
			p.x += Math.sin(p.wobble * 10) * 0.5;

			// Fade out near bottom
			if (p.y > canvas.height - 100) {
				p.opacity = Math.max(0, p.opacity - 0.02);
			}

			// Draw particle
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate((p.rotation * Math.PI) / 180);
			ctx.globalAlpha = p.opacity;
			ctx.fillStyle = p.color;

			switch (p.shape) {
				case 'rect':
					ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
					break;
				case 'circle':
					ctx.beginPath();
					ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
					ctx.fill();
					break;
				case 'ribbon':
					ctx.beginPath();
					ctx.moveTo(-p.size / 2, 0);
					ctx.quadraticCurveTo(0, -p.size / 2, p.size / 2, 0);
					ctx.quadraticCurveTo(0, p.size / 2, -p.size / 2, 0);
					ctx.fill();
					break;
			}

			ctx.restore();

			return p.opacity > 0 && p.y < canvas.height + 50;
		});

		if (isAnimating) {
			animationFrame = requestAnimationFrame(animateConfetti);
		}
	}

	// Resize canvas
	function resizeCanvas(): void {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	// Calculate star rating based on performance
	function calculateStars(): number {
		let stars = 3;

		// Deduct stars for excessive hints
		if (hintsUsed > 5) stars--;
		if (hintsUsed > 10) stars--;

		// Deduct star for slow time (> 30 minutes)
		if (totalPlayTime > 30 * 60 * 1000) stars--;

		return Math.max(1, Math.min(3, stars));
	}

	// Share result
	async function handleShare(): Promise<void> {
		const stars = calculateStars();
		const shareText = `We escaped together in ${formatTime(totalPlayTime)}! Earned ${stars} star${stars !== 1 ? 's' : ''}! Can you beat our time?`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: 'EscapeTwogether - Victory!',
					text: shareText,
					url: window.location.origin
				});
			} catch (err) {
				// User cancelled or share failed
				console.log('Share cancelled or failed');
			}
		} else {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(shareText);
				alert('Result copied to clipboard!');
			} catch {
				console.log('Could not copy to clipboard');
			}
		}

		soundManager.playClick();
		onShare();
	}

	const stars = calculateStars();

	onMount(async () => {
		// Initialize canvas
		canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
		ctx = canvas.getContext('2d')!;
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Start confetti animation loop
		animateConfetti();

		// Animation sequence
		showOverlay = true;

		await new Promise(r => setTimeout(r, 300));
		showTitle = true;

		// Play victory sound
		soundManager.playVictory();

		await new Promise(r => setTimeout(r, 600));
		showStars = true;

		// Animate stars one by one
		await new Promise(r => setTimeout(r, 200));
		star1Visible = true;
		if (stars >= 1) {
			createConfettiBurst(canvas.width * 0.35, canvas.height * 0.35, 30);
		}

		await new Promise(r => setTimeout(r, 250));
		star2Visible = true;
		if (stars >= 2) {
			createConfettiBurst(canvas.width * 0.5, canvas.height * 0.3, 40);
		}

		await new Promise(r => setTimeout(r, 250));
		star3Visible = true;
		if (stars >= 3) {
			createConfettiBurst(canvas.width * 0.65, canvas.height * 0.35, 50);
		}

		// Big confetti burst
		await new Promise(r => setTimeout(r, 300));
		confettiBurst1 = true;
		createConfettiBurst(canvas.width / 2, canvas.height / 2, 80);

		await new Promise(r => setTimeout(r, 400));
		showStats = true;

		await new Promise(r => setTimeout(r, 500));
		showPlayers = true;

		await new Promise(r => setTimeout(r, 600));
		confettiBurst2 = true;
		createConfettiBurst(canvas.width * 0.3, canvas.height * 0.6, 40);
		createConfettiBurst(canvas.width * 0.7, canvas.height * 0.6, 40);

		await new Promise(r => setTimeout(r, 400));
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

<div class="victory-overlay">
	<!-- Confetti Canvas -->
	<canvas id="confetti-canvas" class="confetti-canvas"></canvas>

	<!-- Background gradient overlay -->
	{#if showOverlay}
		<div class="bg-gradient" in:fade={{ duration: 500 }}></div>
	{/if}

	<!-- Decorative elements -->
	<div class="decorative-glow decorative-glow-1"></div>
	<div class="decorative-glow decorative-glow-2"></div>
	<div class="sparkles" aria-hidden="true">
		{#each Array(20) as _, i}
			<div class="sparkle" style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div>
		{/each}
	</div>

	<!-- Main content -->
	<div class="victory-content">
		<!-- Title -->
		{#if showTitle}
			<div class="title-container" in:fly={{ y: -80, duration: 1000, easing: backOut }}>
				<h1 class="victory-title">Congratulations!</h1>
				<p class="victory-subtitle">You escaped together!</p>
			</div>
		{/if}

		<!-- Star Rating -->
		{#if showStars}
			<div class="stars-container" in:fade={{ duration: 400 }}>
				<div class="star-wrapper">
					{#if star1Visible}
						<span class="star {stars >= 1 ? 'filled' : 'empty'}" in:scale={{ duration: 500, easing: elasticOut }}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							{#if stars >= 1}
								<div class="star-glow"></div>
							{/if}
						</span>
					{/if}
				</div>
				<div class="star-wrapper">
					{#if star2Visible}
						<span class="star {stars >= 2 ? 'filled' : 'empty'}" in:scale={{ duration: 500, easing: elasticOut }}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							{#if stars >= 2}
								<div class="star-glow"></div>
							{/if}
						</span>
					{/if}
				</div>
				<div class="star-wrapper">
					{#if star3Visible}
						<span class="star {stars >= 3 ? 'filled' : 'empty'}" in:scale={{ duration: 500, easing: elasticOut }}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							{#if stars >= 3}
								<div class="star-glow"></div>
							{/if}
						</span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Stats -->
		{#if showStats}
			<div class="stats-container" in:fly={{ y: 40, duration: 800, easing: quintOut }}>
				<div class="stat-card">
					<div class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<polyline points="12,6 12,12 16,14"/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{formatTime(totalPlayTime)}</span>
						<span class="stat-label">Time Taken</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{hintsUsed}</span>
						<span class="stat-label">Hints Used</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{roomsCompleted}</span>
						<span class="stat-label">Rooms Completed</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Players -->
		{#if showPlayers}
			<div class="players-container" in:fade={{ duration: 800 }}>
				<div class="players-card">
					<div class="player-names">
						<span class="player-name">{playerNames.playerA}</span>
						<span class="connector">&</span>
						<span class="player-name">{playerNames.playerB}</span>
					</div>
					<p class="team-message">Your teamwork made this possible!</p>
				</div>
			</div>
		{/if}

		<!-- Actions -->
		{#if showActions}
			<div class="actions-container" in:fly={{ y: 20, duration: 600, easing: quintOut }}>
				<button class="btn btn-primary" on:click={() => { soundManager.playClick(); onRestart(); }}>
					<svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6M1 20v-6h6"/>
						<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
					</svg>
					Play Again
				</button>
				<button class="btn btn-secondary" on:click={() => { soundManager.playClick(); onReturnToLobby(); }}>
					<svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
						<polyline points="9,22 9,12 15,12 15,22"/>
					</svg>
					Return to Lobby
				</button>
				<button class="btn btn-tertiary" on:click={handleShare}>
					<svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="18" cy="5" r="3"/>
						<circle cx="6" cy="12" r="3"/>
						<circle cx="18" cy="19" r="3"/>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
					</svg>
					Share Result
				</button>
			</div>
		{/if}

		<!-- Footer branding -->
		{#if showActions}
			<div class="footer-branding" in:fade={{ delay: 300, duration: 800 }}>
				<p>EscapeTwogether</p>
				<p class="tagline">A Cooperative Escape Room Experience</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.victory-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		overflow: hidden;
		font-family: var(--font-primary, 'Inter', sans-serif);
	}

	.confetti-canvas {
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
			rgba(15, 15, 35, 0.97) 0%,
			rgba(26, 26, 46, 0.95) 50%,
			rgba(15, 15, 35, 0.97) 100%
		);
		z-index: 0;
	}

	/* Decorative ambient glows */
	.decorative-glow {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		z-index: 0;
	}

	.decorative-glow-1 {
		top: 20%;
		left: 30%;
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
		animation: floatGlow1 8s ease-in-out infinite;
	}

	.decorative-glow-2 {
		bottom: 20%;
		right: 25%;
		width: 350px;
		height: 350px;
		background: radial-gradient(circle, rgba(201, 169, 166, 0.12) 0%, transparent 70%);
		animation: floatGlow2 10s ease-in-out infinite;
	}

	@keyframes floatGlow1 {
		0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
		50% { transform: translate(30px, -20px) scale(1.1); opacity: 1; }
	}

	@keyframes floatGlow2 {
		0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
		50% { transform: translate(-20px, 30px) scale(1.15); opacity: 0.9; }
	}

	/* Sparkle effect */
	.sparkles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.sparkle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: rgba(255, 215, 0, 0.8);
		border-radius: 50%;
		animation: sparkle 3s ease-in-out infinite;
	}

	@keyframes sparkle {
		0%, 100% { opacity: 0; transform: scale(0); }
		50% { opacity: 1; transform: scale(1); }
	}

	.victory-content {
		position: relative;
		z-index: 2;
		text-align: center;
		padding: 2rem;
		max-width: 700px;
		width: 100%;
	}

	/* Title styles */
	.title-container {
		margin-bottom: 2rem;
	}

	.victory-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(2.5rem, 8vw, 4.5rem);
		font-weight: 700;
		color: #FFD700;
		text-shadow:
			0 0 30px rgba(255, 215, 0, 0.5),
			0 0 60px rgba(255, 215, 0, 0.3),
			0 4px 8px rgba(0, 0, 0, 0.3);
		margin-bottom: 0.75rem;
		letter-spacing: 0.02em;
		line-height: 1.1;
	}

	.victory-subtitle {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1.25rem, 4vw, 1.75rem);
		color: rgba(244, 208, 195, 0.9);
		font-weight: 400;
		font-style: italic;
		letter-spacing: 0.05em;
	}

	/* Stars */
	.stars-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2.5rem;
	}

	.star-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.star {
		position: relative;
		width: clamp(48px, 10vw, 72px);
		height: clamp(48px, 10vw, 72px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.star svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.star.filled svg {
		color: #FFD700;
		filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7))
		        drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
		animation: starPulse 2s ease-in-out infinite;
	}

	.star.empty svg {
		color: rgba(201, 169, 166, 0.3);
	}

	.star-glow {
		position: absolute;
		inset: -10px;
		background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
		animation: starGlow 2s ease-in-out infinite;
	}

	@keyframes starPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	@keyframes starGlow {
		0%, 100% { opacity: 0.7; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.2); }
	}

	/* Stats */
	.stats-container {
		display: flex;
		justify-content: center;
		gap: 1.25rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 16px;
		padding: 1rem 1.5rem;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition: all 0.3s ease;
		min-width: 140px;
	}

	.stat-card:hover {
		border-color: rgba(212, 175, 55, 0.4);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.stat-icon {
		width: 36px;
		height: 36px;
		color: #FFB74D;
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #FFFFFF;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.7rem;
		color: rgba(201, 169, 166, 0.7);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	/* Players */
	.players-container {
		margin-bottom: 2rem;
	}

	.players-card {
		display: inline-block;
		background: linear-gradient(135deg, rgba(201, 169, 166, 0.1) 0%, rgba(201, 169, 166, 0.05) 100%);
		border: 1px solid rgba(201, 169, 166, 0.2);
		border-radius: 20px;
		padding: 1.5rem 2.5rem;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.player-names {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.35rem;
		color: rgba(244, 208, 195, 0.95);
		margin-bottom: 0.5rem;
	}

	.player-name {
		font-weight: 600;
		color: #FFD700;
		text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
	}

	.connector {
		margin: 0 0.75rem;
		color: rgba(201, 169, 166, 0.6);
		font-style: italic;
	}

	.team-message {
		font-size: 0.875rem;
		color: rgba(201, 169, 166, 0.7);
		font-style: italic;
		margin: 0;
	}

	/* Actions */
	.actions-container {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 2rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1.75rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: none;
		font-family: inherit;
	}

	.btn-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.btn-primary {
		background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
		color: #1E293B;
		box-shadow: 0 4px 20px rgba(255, 215, 0, 0.35);
	}

	.btn-primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 30px rgba(255, 215, 0, 0.45);
	}

	.btn-primary:active {
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(244, 208, 195, 0.9);
		border: 1px solid rgba(212, 175, 55, 0.35);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(212, 175, 55, 0.5);
		transform: translateY(-2px);
	}

	.btn-tertiary {
		background: rgba(74, 155, 140, 0.15);
		color: #4A9B8C;
		border: 1px solid rgba(74, 155, 140, 0.35);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.btn-tertiary:hover {
		background: rgba(74, 155, 140, 0.25);
		border-color: rgba(74, 155, 140, 0.5);
		transform: translateY(-2px);
	}

	/* Footer branding */
	.footer-branding {
		margin-top: 1rem;
		opacity: 0.6;
	}

	.footer-branding p {
		margin: 0;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.6);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.footer-branding .tagline {
		font-size: 0.65rem;
		margin-top: 0.25rem;
		letter-spacing: 0.1em;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.victory-content {
			padding: 1.5rem;
		}

		.stats-container {
			flex-direction: column;
			align-items: center;
			gap: 0.75rem;
		}

		.stat-card {
			width: 100%;
			max-width: 280px;
		}

		.players-card {
			padding: 1rem 1.5rem;
		}

		.player-names {
			font-size: 1.1rem;
		}

		.actions-container {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 100%;
			max-width: 280px;
			justify-content: center;
		}

		.decorative-glow-1,
		.decorative-glow-2 {
			width: 200px;
			height: 200px;
		}
	}

	/* Large screens */
	@media (min-width: 1024px) {
		.victory-title {
			font-size: 5rem;
		}

		.victory-subtitle {
			font-size: 2rem;
		}

		.stars-container {
			gap: 1.5rem;
		}

		.star {
			width: 80px;
			height: 80px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sparkle,
		.decorative-glow-1,
		.decorative-glow-2,
		.star.filled svg,
		.star-glow {
			animation: none;
		}

		.btn {
			transition: none;
		}
	}
</style>

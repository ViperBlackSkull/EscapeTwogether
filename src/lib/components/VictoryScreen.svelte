<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Props
	export let totalPlayTime: number = 0; // in milliseconds
	export let hintsUsed: number = 0;
	export let roomsCompleted: number = 3;
	export let playerNames: { playerA: string; playerB: string } = { playerA: 'Player 1', playerB: 'Player 2' };
	export let onRestart: () => void = () => {};
	export let onReturnToLobby: () => void = () => {};

	// Animation state
	let showStats = false;
	let showCredits = false;
	let confettiParticles: ConfettiParticle[] = [];
	let animationFrame: number;

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

	// Confetti particle type
	interface ConfettiParticle {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		rotation: number;
		rotationSpeed: number;
		color: string;
		size: number;
		opacity: number;
	}

	// Colors for confetti
	const confettiColors = [
		'#FFD700', // Gold
		'#FF6B6B', // Coral
		'#4ECDC4', // Teal
		'#FFE66D', // Yellow
		'#95E1D3', // Mint
		'#F38181', // Pink
		'#AA96DA', // Lavender
		'#FF9F43', // Orange
	];

	// Create confetti particles
	function createConfetti(): void {
		const particles: ConfettiParticle[] = [];

		for (let i = 0; i < 100; i++) {
			particles.push({
				id: i,
				x: Math.random() * window.innerWidth,
				y: -20,
				vx: (Math.random() - 0.5) * 4,
				vy: Math.random() * 3 + 2,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 10,
				color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
				size: Math.random() * 10 + 5,
				opacity: 1,
			});
		}

		confettiParticles = particles;
		animateConfetti();
	}

	// Animate confetti
	function animateConfetti(): void {
		confettiParticles = confettiParticles.map(p => {
			const newY = p.y + p.vy;
			const newX = p.x + p.vx;
			const newOpacity = newY > window.innerHeight - 100 ? Math.max(0, p.opacity - 0.02) : p.opacity;

			return {
				...p,
				x: newX,
				y: newY,
				rotation: p.rotation + p.rotationSpeed,
				opacity: newOpacity,
				vy: p.vy + 0.1, // gravity
			};
		}).filter(p => p.opacity > 0);

		if (confettiParticles.length > 0) {
			animationFrame = requestAnimationFrame(animateConfetti);
		}
	}

	// Calculate star rating based on performance
	function calculateStars(): number {
		// Base rating on time and hints
		let stars = 3;

		// Deduct stars for excessive hints
		if (hintsUsed > 10) stars--;
		if (hintsUsed > 20) stars--;

		// Deduct star for slow time (> 45 minutes)
		if (totalPlayTime > 45 * 60 * 1000) stars--;

		return Math.max(1, stars);
	}

	onMount(() => {
		// Start confetti after a short delay
		setTimeout(createConfetti, 500);

		// Show stats after title animation
		setTimeout(() => {
			showStats = true;
		}, 1500);

		// Show credits after stats
		setTimeout(() => {
			showCredits = true;
		}, 2500);
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	});

	const stars = calculateStars();
</script>

<div class="victory-overlay">
	<!-- Confetti Canvas -->
	<div class="confetti-container">
		{#each confettiParticles as particle (particle.id)}
			<div
				class="confetti"
				style="
					left: {particle.x}px;
					top: {particle.y}px;
					width: {particle.size}px;
					height: {particle.size * 0.6}px;
					background-color: {particle.color};
					transform: rotate({particle.rotation}deg);
					opacity: {particle.opacity};
				"
			></div>
		{/each}
	</div>

	<!-- Background gradient overlay -->
	<div class="bg-gradient"></div>

	<!-- Main content -->
	<div class="victory-content">
		<!-- Title -->
		<div class="title-container" in:fly={{ y: -50, duration: 1000, easing: quintOut }}>
			<h1 class="victory-title">Congratulations!</h1>
			<p class="victory-subtitle">You escaped together!</p>
		</div>

		<!-- Star Rating -->
		<div class="stars-container" in:fade={{ delay: 800, duration: 800 }}>
			{#each Array(3) as _, i}
				<span class="star {i < stars ? 'filled' : 'empty'}">
					{#if i < stars}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
					{/if}
				</span>
			{/each}
		</div>

		<!-- Stats -->
		{#if showStats}
			<div class="stats-container" in:fly={{ y: 30, duration: 800, easing: quintOut }}>
				<div class="stat-card">
					<div class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<polyline points="12,6 12,12 16,14"/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{formatTime(totalPlayTime)}</span>
						<span class="stat-label">Total Time</span>
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

			<!-- Players -->
			<div class="players-container" in:fade={{ duration: 600 }}>
				<p class="players-text">
					<span class="player-name">{playerNames.playerA}</span>
					<span class="connector">&</span>
					<span class="player-name">{playerNames.playerB}</span>
				</p>
				<p class="team-label">Your teamwork made this possible!</p>
			</div>
		{/if}

		<!-- Credits -->
		{#if showCredits}
			<div class="credits-container" in:fade={{ duration: 1000 }}>
				<h3 class="credits-title">Thank You For Playing</h3>
				<div class="credits-content">
					<p class="credit-item">
						<span class="credit-role">Created with</span>
						<span class="credit-name">Love &amp; Collaboration</span>
					</p>
				</div>
				<p class="credits-footer">EscapeTogether - A Cooperative Escape Room Experience</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="actions-container" in:fade={{ delay: 3000, duration: 800 }}>
			<button class="btn btn-primary" on:click={onRestart}>
				<svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M23 4v6h-6M1 20v-6h6"/>
					<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
				</svg>
				Play Again
			</button>
			<button class="btn btn-secondary" on:click={onReturnToLobby}>
				<svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
					<polyline points="9,22 9,12 15,12 15,22"/>
				</svg>
				Return to Lobby
			</button>
		</div>
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
	}

	.bg-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			rgba(15, 23, 42, 0.95) 0%,
			rgba(30, 41, 59, 0.9) 50%,
			rgba(15, 23, 42, 0.95) 100%
		);
	}

	/* Warm ambient glow */
	.bg-gradient::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 150%;
		height: 150%;
		background: radial-gradient(
			ellipse at center,
			rgba(255, 183, 77, 0.15) 0%,
			rgba(255, 183, 77, 0.05) 30%,
			transparent 70%
		);
		animation: pulse 4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
		50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
	}

	.confetti-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.confetti {
		position: absolute;
		border-radius: 2px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.victory-content {
		position: relative;
		z-index: 2;
		text-align: center;
		padding: 2rem;
		max-width: 600px;
	}

	.title-container {
		margin-bottom: 2rem;
	}

	.victory-title {
		font-size: 3.5rem;
		font-weight: 700;
		color: #FFD700;
		text-shadow:
			0 0 20px rgba(255, 215, 0, 0.5),
			0 0 40px rgba(255, 215, 0, 0.3);
		margin-bottom: 0.5rem;
		letter-spacing: 0.05em;
	}

	.victory-subtitle {
		font-size: 1.5rem;
		color: rgba(244, 208, 195, 0.8);
		font-weight: 300;
	}

	.stars-container {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.star {
		width: 48px;
		height: 48px;
	}

	.star.filled {
		color: #FFD700;
		filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
		animation: starPop 0.5s ease-out backwards;
	}

	.star.filled:nth-child(1) { animation-delay: 1s; }
	.star.filled:nth-child(2) { animation-delay: 1.2s; }
	.star.filled:nth-child(3) { animation-delay: 1.4s; }

	.star.empty {
		color: rgba(244, 208, 195, 0.3);
	}

	@keyframes starPop {
		0% { transform: scale(0) rotate(-20deg); }
		60% { transform: scale(1.3) rotate(10deg); }
		100% { transform: scale(1) rotate(0deg); }
	}

	.stats-container {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 183, 77, 0.2);
		border-radius: 12px;
		padding: 1rem 1.5rem;
		backdrop-filter: blur(10px);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		color: #FFB74D;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #FFF;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(244, 208, 195, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.players-container {
		margin-bottom: 2rem;
	}

	.players-text {
		font-size: 1.25rem;
		color: rgba(244, 208, 195, 0.9);
		margin-bottom: 0.5rem;
	}

	.player-name {
		font-weight: 600;
		color: #FFD700;
	}

	.connector {
		margin: 0 0.5rem;
		color: rgba(244, 208, 195, 0.6);
	}

	.team-label {
		font-size: 0.875rem;
		color: rgba(244, 208, 195, 0.5);
		font-style: italic;
	}

	.credits-container {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
		border: 1px solid rgba(255, 183, 77, 0.1);
	}

	.credits-title {
		font-size: 1rem;
		color: #FFD700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		margin-bottom: 1rem;
	}

	.credits-content {
		margin-bottom: 1rem;
	}

	.credit-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.credit-role {
		font-size: 0.75rem;
		color: rgba(244, 208, 195, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.credit-name {
		font-size: 1.125rem;
		color: rgba(244, 208, 195, 0.9);
	}

	.credits-footer {
		font-size: 0.75rem;
		color: rgba(244, 208, 195, 0.4);
	}

	.actions-container {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
		color: #1E293B;
		box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(244, 208, 195, 0.9);
		border: 1px solid rgba(255, 183, 77, 0.3);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 183, 77, 0.5);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.victory-title {
			font-size: 2.5rem;
		}

		.victory-subtitle {
			font-size: 1.125rem;
		}

		.stats-container {
			flex-direction: column;
			align-items: center;
		}

		.stat-card {
			width: 100%;
			max-width: 250px;
		}

		.star {
			width: 36px;
			height: 36px;
		}

		.actions-container {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 100%;
			max-width: 250px;
			justify-content: center;
		}
	}
</style>

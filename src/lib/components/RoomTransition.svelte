<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut, elasticOut } from 'svelte/easing';
	import { onMount, onDestroy } from 'svelte';
	import { soundManager } from '$lib/audio';

	export let fromRoom: string = '';
	export let toRoom: string = '';
	export let storyText: string = '';
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	// Animation state
	let phase: 'overlay' | 'title' | 'story' | 'transition' | 'complete' = 'overlay';
	let showOverlay = false;
	let showTitle = false;
	let showStory = false;
	let showTransition = false;
	let showComplete = false;

	// Room data for transitions
	const roomData: Record<string, { name: string; icon: string; color: string }> = {
		attic: { name: 'The Attic', icon: '🏠', color: '#F4A460' },
		clock_tower: { name: 'The Clock Tower', icon: '🕰️', color: '#4A9B8C' },
		garden_conservatory: { name: 'The Garden Conservatory', icon: '🌿', color: '#6B8E4E' }
	};

	$: fromData = roomData[fromRoom] || { name: fromRoom, icon: '🚪', color: '#C9A9A6' };
	$: toData = roomData[toRoom] || { name: toRoom, icon: '🚪', color: '#C9A9A6' };

	// Story narratives for room completions
	const roomStories: Record<string, string> = {
		attic: "As the trunk clicks open, you discover a faded photograph of two lovers from decades past. Their story continues upstairs...",
		clock_tower: "The clock strikes midnight, and the gears align to reveal a hidden passage. Time has unlocked its secret...",
		garden_conservatory: "The flowers bloom in perfect harmony, their petals forming a path forward. Love, like nature, finds a way..."
	};

	$: currentStory = storyText || roomStories[fromRoom] || 'A new chapter awaits...';

	async function startTransition() {
		phase = 'overlay';
		showOverlay = true;

		// Play room transition sound
		soundManager.play('room-transition');

		await delay(400);
		phase = 'title';
		showTitle = true;

		await delay(2000);
		phase = 'story';
		showStory = true;

		await delay(4000);
		phase = 'transition';
		showTransition = true;

		await delay(1500);
		phase = 'complete';
		showComplete = true;

		dispatch('complete');
	}

	function delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function handleContinue() {
		soundManager.playClick();
		dispatch('continue');
		closeTransition();
	}

	function closeTransition() {
		showOverlay = false;
		showTitle = false;
		showStory = false;
		showTransition = false;
		showComplete = false;
		isOpen = false;
	}

	$: if (isOpen && !showOverlay) {
		startTransition();
	}

	// Particle animation for transition
	let particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = [];

	function createParticles() {
		particles = [];
		for (let i = 0; i < 30; i++) {
			particles.push({
				x: Math.random() * 100,
				y: Math.random() * 100,
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				size: Math.random() * 4 + 2,
				opacity: Math.random() * 0.5 + 0.3,
				color: toData.color
			});
		}
	}

	$: if (showTransition) {
		createParticles();
	}
</script>

{#if isOpen}
	<div class="transition-container" role="dialog" aria-modal="true" aria-labelledby="transition-title">
		<!-- Background overlay with gradient -->
		{#if showOverlay}
			<div class="overlay-bg" in:fade={{ duration: 400 }} style="--from-color: {fromData.color}; --to-color: {toData.color};">
				<!-- Animated particles -->
				{#if showTransition}
					<div class="particles">
						{#each particles as p, i}
							<div
								class="particle"
								style="
									left: {p.x}%;
									top: {p.y}%;
									width: {p.size}px;
									height: {p.size}px;
									opacity: {p.opacity};
									background: {p.color};
									animation-delay: {i * 50}ms;
								"
							></div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content -->
		<div class="transition-content">
			<!-- Room Complete Title -->
			{#if showTitle}
				<div class="title-section" in:fly={{ y: -40, duration: 800, easing: backOut }}>
					<div class="celebration-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
					</div>
					<h2 id="transition-title" class="room-complete-title">Room Complete!</h2>
					<p class="completed-room-name">{fromData.name}</p>
				</div>
			{/if}

			<!-- Story Text -->
			{#if showStory}
				<div class="story-section" in:fade={{ duration: 600 }}>
					<div class="story-card">
						<div class="story-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
								<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
							</svg>
						</div>
						<p class="story-text">{currentStory}</p>
					</div>
				</div>
			{/if}

			<!-- Room Transition Visual -->
			{#if showTransition}
				<div class="transition-visual" in:scale={{ duration: 600, easing: elasticOut }}>
					<div class="room-from" style="--room-color: {fromData.color}">
						<span class="room-icon">{fromData.icon}</span>
						<span class="room-label">{fromData.name}</span>
					</div>
					<div class="transition-arrow">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="5" y1="12" x2="19" y2="12"/>
							<polyline points="12 5 19 12 12 19"/>
						</svg>
					</div>
					<div class="room-to" style="--room-color: {toData.color}">
						<span class="room-icon">{toData.icon}</span>
						<span class="room-label">{toData.name}</span>
					</div>
				</div>
			{/if}

			<!-- Continue Button -->
			{#if showComplete}
				<div class="continue-section" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
					<button class="continue-btn" on:click={handleContinue}>
						<span>Continue to {toData.name}</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="5" y1="12" x2="19" y2="12"/>
							<polyline points="12 5 19 12 12 19"/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.transition-container {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.overlay-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			rgba(15, 15, 35, 0.98) 0%,
			rgba(26, 26, 46, 0.95) 50%,
			rgba(15, 15, 35, 0.98) 100%
		);
		animation: bgPulse 3s ease-in-out infinite;
	}

	@keyframes bgPulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.95; }
	}

	.overlay-bg::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 80% 60% at 50% 50%,
			rgba(var(--to-color-rgb, 212, 175, 55), 0.1) 0%,
			transparent 60%
		);
	}

	.particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		animation: floatParticle 3s ease-in-out infinite;
	}

	@keyframes floatParticle {
		0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
		50% { transform: translate(var(--vx, 20px), var(--vy, -20px)) scale(1.2); opacity: 0.8; }
	}

	.transition-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
		text-align: center;
	}

	.title-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;
	}

	.celebration-icon {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		border-radius: 50%;
		margin-bottom: 1.5rem;
		box-shadow:
			0 0 40px rgba(255, 215, 0, 0.4),
			0 8px 32px rgba(255, 165, 0, 0.3);
		animation: starPulse 2s ease-in-out infinite;
	}

	@keyframes starPulse {
		0%, 100% { transform: scale(1) rotate(0deg); }
		50% { transform: scale(1.1) rotate(10deg); }
	}

	.celebration-icon svg {
		width: 40px;
		height: 40px;
		color: #1a1a2e;
	}

	.room-complete-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 2.5rem;
		font-weight: 700;
		color: #FFD700;
		margin: 0;
		text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
	}

	.completed-room-name {
		margin: 0.5rem 0 0;
		font-size: 1.25rem;
		color: rgba(201, 169, 166, 0.8);
		font-style: italic;
	}

	.story-section {
		margin-bottom: 2rem;
		width: 100%;
	}

	.story-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 16px;
		padding: 1.5rem 2rem;
		position: relative;
	}

	.story-icon {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a2e;
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 8px;
	}

	.story-icon svg {
		width: 16px;
		height: 16px;
		color: #D4AF37;
	}

	.story-text {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.7;
		color: rgba(244, 208, 195, 0.9);
		font-family: 'Playfair Display', Georgia, serif;
		font-style: italic;
	}

	.transition-visual {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	.room-from,
	.room-to {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid var(--room-color);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.room-to {
		animation: newRoomGlow 1.5s ease-in-out infinite;
	}

	@keyframes newRoomGlow {
		0%, 100% { box-shadow: 0 0 20px rgba(var(--room-color-rgb, 212, 175, 55), 0.3); }
		50% { box-shadow: 0 0 40px rgba(var(--room-color-rgb, 212, 175, 55), 0.5); }
	}

	.room-icon {
		font-size: 2rem;
	}

	.room-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--room-color);
	}

	.transition-arrow {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #D4AF37;
		animation: arrowMove 1s ease-in-out infinite;
	}

	@keyframes arrowMove {
		0%, 100% { transform: translateX(0); opacity: 1; }
		50% { transform: translateX(5px); opacity: 0.7; }
	}

	.transition-arrow svg {
		width: 24px;
		height: 24px;
	}

	.continue-section {
		display: flex;
		justify-content: center;
	}

	.continue-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
		border: none;
		border-radius: 12px;
		color: #1a1a2e;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
	}

	.continue-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 30px rgba(212, 175, 55, 0.5);
	}

	.continue-btn svg {
		width: 20px;
		height: 20px;
	}

	@media (max-width: 480px) {
		.room-complete-title {
			font-size: 2rem;
		}

		.transition-visual {
			flex-direction: column;
			gap: 1rem;
		}

		.transition-arrow {
			transform: rotate(90deg);
		}

		.story-card {
			padding: 1.25rem 1.5rem;
		}

		.story-text {
			font-size: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebration-icon,
		.particle,
		.room-to,
		.transition-arrow {
			animation: none;
		}

		.continue-btn {
			transition: none;
		}
	}
</style>

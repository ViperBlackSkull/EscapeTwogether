<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
	import type { RoomId, PuzzleHint } from '$lib/types';

	// Props
	export let puzzleId: string;
	export let puzzleTitle: string = 'Puzzle';
	export let roomTheme: RoomId = 'attic';
	export let description: string = '';
	export let completed: boolean = false;
	export let hints: PuzzleHint[] = [];
	export let currentHintTier: number = 0;
	export let timeElapsed: number = 0;

	const dispatch = createEventDispatcher();

	// Internal state
	let showCompletionAnimation = false;
	let showHintPanel = false;

	// Theme colors per room
	const roomThemes: Record<RoomId, { primary: string; secondary: string; accent: string; bg: string }> = {
		attic: {
			primary: '#FFB74D',
			secondary: '#F4D0C3',
			accent: '#d4a574',
			bg: 'linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%)'
		},
		clock_tower: {
			primary: '#5fb3b3',
			secondary: '#7ec8e3',
			accent: '#4a90a4',
			bg: 'linear-gradient(135deg, #1a2a3a 0%, #0a1a2e 100%)'
		},
		garden_conservatory: {
			primary: '#81c784',
			secondary: '#a5d6a7',
			accent: '#66bb6a',
			bg: 'linear-gradient(135deg, #1a3a2a 0%, #0a2a1e 100%)'
		}
	};

	$: theme = roomThemes[roomTheme] || roomThemes.attic;

	// Format time as mm:ss
	$: formattedTime = formatTime(timeElapsed);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleHintRequest(): void {
		dispatch('hint:request', { puzzleId, currentTier: currentHintTier });
	}

	function handleHintDismiss(): void {
		showHintPanel = false;
	}

	function handleCompletionAnimationEnd(): void {
		showCompletionAnimation = false;
	}

	// Watch for completion
	$: if (completed && !showCompletionAnimation) {
		showCompletionAnimation = true;
	}

	// Get current hint
	$: currentHint = hints.find(h => h.tier === currentHintTier);
</script>

<div
	class="puzzle-container"
	class:completed
	style="--theme-primary: {theme.primary}; --theme-secondary: {theme.secondary}; --theme-accent: {theme.accent}; --theme-bg: {theme.bg};"
>
	<!-- Header -->
	<header class="puzzle-header">
		<div class="header-content">
			<h2 class="puzzle-title">{puzzleTitle}</h2>
			{#if description}
				<p class="puzzle-description">{description}</p>
			{/if}
		</div>

		<div class="header-meta">
			<div class="timer" class:warning={timeElapsed > 180} class:critical={timeElapsed > 300}>
				<svg viewBox="0 0 24 24" class="timer-icon">
					<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
				</svg>
				<span class="timer-text">{formattedTime}</span>
			</div>

			{#if hints.length > 0}
				<button
					class="hint-button"
					class:active={showHintPanel}
					on:click={() => showHintPanel = !showHintPanel}
					aria-label="Toggle hints"
					aria-expanded={showHintPanel}
				>
					<svg viewBox="0 0 24 24" class="hint-icon">
						<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" fill="currentColor"/>
					</svg>
					<span>Hint</span>
				</button>
			{/if}
		</div>
	</header>

	<!-- Hint Panel -->
	{#if showHintPanel && hints.length > 0}
		<div class="hint-panel" in:fly={{ y: -20, duration: 300 }} out:fade={{ duration: 200 }}>
			<div class="hint-content">
				{#if currentHint}
					<div class="current-hint">
						<span class="hint-tier">Hint Level {currentHint.tier}</span>
						<p class="hint-text">{currentHint.text}</p>
					</div>
				{:else}
					<p class="no-hint">No hints available yet. Keep trying!</p>
				{/if}

				{#if currentHintTier < hints.length}
					<button class="next-hint-btn" on:click={handleHintRequest}>
						Request Next Hint
					</button>
				{/if}
			</div>
			<button class="close-hint-btn" on:click={handleHintDismiss} aria-label="Close hints">
				<svg viewBox="0 0 24 24">
					<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Puzzle Content Area -->
	<main class="puzzle-content">
		<slot></slot>
	</main>

	<!-- Completion Overlay -->
	{#if showCompletionAnimation}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="completion-overlay"
			in:fade={{ duration: 300 }}
			on:click={handleCompletionAnimationEnd}
			on:keydown={(e) => e.key === 'Escape' && handleCompletionAnimationEnd()}
			role="dialog"
			aria-modal="true"
			aria-label="Puzzle completed"
		>
			<div class="completion-content" in:scale={{ start: 0.8, easing: elasticOut }}>
				<div class="completion-icon">
					<svg viewBox="0 0 24 24">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
					</svg>
				</div>
				<h3 class="completion-title">Puzzle Solved!</h3>
				<p class="completion-message">Excellent teamwork!</p>
				<div class="completion-stats">
					<div class="stat">
						<span class="stat-value">{formattedTime}</span>
						<span class="stat-label">Time</span>
					</div>
					<div class="stat">
						<span class="stat-value">{currentHintTier}</span>
						<span class="stat-label">Hints Used</span>
					</div>
				</div>
				<button class="continue-btn" on:click={handleCompletionAnimationEnd}>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<!-- Room Theme Indicator -->
	<div class="room-indicator" style="background: {theme.primary}"></div>
</div>

<style>
	.puzzle-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--theme-bg);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.puzzle-container.completed {
		pointer-events: none;
	}

	/* Header */
	.puzzle-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.25rem 1.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		flex: 1;
	}

	.puzzle-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--theme-primary);
		letter-spacing: 0.02em;
	}

	.puzzle-description {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: #8b8baa;
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* Timer */
	.timer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #8b8baa;
		transition: all 0.3s ease;
	}

	.timer.warning {
		background: rgba(255, 183, 77, 0.2);
		color: var(--theme-primary);
	}

	.timer.critical {
		background: rgba(244, 67, 54, 0.2);
		color: #f44336;
		animation: pulse 1s ease-in-out infinite;
	}

	.timer-icon {
		width: 18px;
		height: 18px;
	}

	.timer-text {
		font-family: 'Roboto Mono', monospace;
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Hint Button */
	.hint-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #8b8baa;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.hint-button:hover {
		background: rgba(255, 255, 255, 0.15);
		color: var(--theme-primary);
	}

	.hint-button.active {
		background: var(--theme-primary);
		color: #1a1a2e;
		border-color: var(--theme-primary);
	}

	.hint-icon {
		width: 18px;
		height: 18px;
	}

	/* Hint Panel */
	.hint-panel {
		position: absolute;
		top: 80px;
		right: 1.5rem;
		width: 300px;
		padding: 1rem;
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	.hint-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.current-hint {
		padding: 0.75rem;
		background: rgba(255, 183, 77, 0.1);
		border-radius: 8px;
	}

	.hint-tier {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--theme-primary);
		background: rgba(255, 183, 77, 0.2);
		border-radius: 4px;
	}

	.hint-text {
		margin: 0;
		font-size: 0.875rem;
		color: #d4d4d4;
		line-height: 1.5;
	}

	.no-hint {
		margin: 0;
		font-size: 0.875rem;
		color: #8b8baa;
		text-align: center;
		padding: 1rem 0;
	}

	.next-hint-btn {
		padding: 0.5rem 1rem;
		background: var(--theme-primary);
		color: #1a1a2e;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.next-hint-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.close-hint-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: none;
		color: #8b8baa;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.close-hint-btn:hover {
		color: #ffffff;
	}

	.close-hint-btn svg {
		width: 20px;
		height: 20px;
	}

	/* Puzzle Content */
	.puzzle-content {
		flex: 1;
		position: relative;
		overflow: auto;
		padding: 1rem;
	}

	/* Completion Overlay */
	.completion-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		z-index: 200;
	}

	.completion-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2.5rem;
		background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
		border: 2px solid var(--theme-primary);
		border-radius: 20px;
		text-align: center;
		max-width: 400px;
	}

	.completion-icon {
		width: 64px;
		height: 64px;
		margin-bottom: 1rem;
		color: #4CAF50;
		background: rgba(76, 175, 80, 0.2);
		border-radius: 50%;
		padding: 12px;
	}

	.completion-icon svg {
		width: 100%;
		height: 100%;
	}

	.completion-title {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--theme-primary);
	}

	.completion-message {
		margin: 0 0 1.5rem;
		font-size: 1rem;
		color: #8b8baa;
	}

	.completion-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: #ffffff;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #8b8baa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.continue-btn {
		padding: 0.75rem 2rem;
		background: var(--theme-primary);
		color: #1a1a2e;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.continue-btn:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	/* Room Theme Indicator */
	.room-indicator {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		opacity: 0.6;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.puzzle-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-meta {
			width: 100%;
			justify-content: space-between;
		}

		.hint-panel {
			right: 1rem;
			left: 1rem;
			width: auto;
		}

		.completion-content {
			margin: 1rem;
			padding: 1.5rem;
		}
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
</style>

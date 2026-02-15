<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import type { PlayerRole } from '$lib/types';
	import type {
		TrunkLockState,
		TrunkDial,
		DialSymbol
	} from '$lib/puzzles/room1/trunk-lock';
	import { SYMBOL_INFO } from '$lib/puzzles/room1/trunk-lock';
	import { puzzleImages } from '$lib/assets/images';

	import PuzzleContainer from './PuzzleContainer.svelte';

	// Props
	export let puzzleState: TrunkLockState;
	export let playerRole: PlayerRole;
	export let timeElapsed: number = 0;

	const dispatch = createEventDispatcher();

	// Visual assets for enhanced immersion
	const PUZZLE_ASSETS = {
		lock: puzzleImages.vintageLock,
		keys: puzzleImages.antiqueKeys,
		ornateFrame: puzzleImages.victorianOrnament,
		texture: puzzleImages.puzzleTexture,
		secretCompartment: puzzleImages.secretCompartment
	};

	// Computed values
	$: isExplorer = playerRole === 'explorer';
	$: dials = puzzleState?.dials || [];
	$: allCorrect = puzzleState?.allCorrect || false;
	$: completed = puzzleState?.completed || false;
	$: unlockProgress = puzzleState?.unlockProgress || 0;

	// Get dials controlled by current player
	$: myDials = dials.filter(d => d.controlledBy === playerRole);
	$: partnerDials = dials.filter(d => d.controlledBy !== playerRole);

	// Rotate dial handler
	function rotateDial(dialId: string, direction: 'forward' | 'backward'): void {
		dispatch('dial:rotate', { dialId, direction });
	}

	// Get symbol display
	function getSymbolDisplay(symbol: DialSymbol): { icon: string; color: string } {
		const symbolMap: Record<DialSymbol, { icon: string; color: string }> = {
			heart: { icon: '\u2764\uFE0F', color: '#e74c3c' },
			rose: { icon: '\uD83C\uDF39', color: '#c0392b' },
			key: { icon: '\uD83D\uDD11', color: '#f39c12' },
			star: { icon: '\u2B50', color: '#f1c40f' },
			moon: { icon: '\uD83C\uDF19', color: '#9b59b6' },
			dove: { icon: '\uD83D\uDC4D', color: '#ecf0f1' },
			anchor: { icon: '\u2693', color: '#3498db' },
			infinity: { icon: '\u221E', color: '#1abc9c' }
		};
		return symbolMap[symbol] || { icon: '?', color: '#8b8baa' };
	}

	// Check if dial is correct
	function isDialCorrect(dial: TrunkDial): boolean {
		return dial.currentSymbol === dial.correctSymbol;
	}

	onMount(() => {
		// Preload all visual assets
		const images = Object.values(PUZZLE_ASSETS);
		images.forEach(src => {
			const img = new Image();
			img.src = src;
		});
	});
</script>

<PuzzleContainer
	puzzleId="trunk-lock"
	puzzleTitle="Trunk Lock"
	roomTheme="attic"
	description="Work together to set all four dial symbols correctly. Each player controls different dials."
	{completed}
	timeElapsed={timeElapsed}
	on:hint:request
>
	<div class="trunk-lock-puzzle">
		<!-- Lock Visual with Background -->
		<div class="lock-visual">
			<img src={PUZZLE_ASSETS.lock} alt="Antique trunk lock" class="lock-image" />

			<!-- Dial Overlay -->
			<div class="dials-overlay">
				{#each dials as dial (dial.id)}
					{@const symbolDisplay = getSymbolDisplay(dial.currentSymbol)}
					{@const isControlledByMe = dial.controlledBy === playerRole}
					{@const isCorrect = isDialCorrect(dial)}

					<div
						class="dial-slot position-{dial.position}"
						class:controlled-by-me={isControlledByMe}
						class:correct={isCorrect}
						class:incorrect={!isCorrect}
					>
						<!-- Dial display -->
						<div class="dial-display">
							<span class="symbol-icon" style="color: {symbolDisplay.color}">
								{symbolDisplay.icon}
							</span>
						</div>

						<!-- Dial controls (only for dials this player controls) -->
						{#if isControlledByMe}
							<div class="dial-controls">
								<button
									class="dial-btn prev"
									on:click={() => rotateDial(dial.id, 'backward')}
									aria-label="Previous symbol"
								>
									\u25C0
								</button>
								<button
									class="dial-btn next"
									on:click={() => rotateDial(dial.id, 'forward')}
									aria-label="Next symbol"
								>
									\u25B6
								</button>
							</div>
						{:else}
							<div class="dial-partner-indicator">
								<span class="partner-label">Partner</span>
							</div>
						{/if}

						<!-- Correct indicator -->
						{#if isCorrect}
							<div class="correct-indicator">\u2713</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Symbol Legend -->
		<div class="symbol-legend">
			<h4>Available Symbols</h4>
			<div class="legend-grid">
				{#each Object.entries(SYMBOL_INFO) as [symbol, info]}
					{@const symbolDisplay = getSymbolDisplay(symbol as DialSymbol)}
					<div class="legend-item" title={info.description}>
						<span class="legend-icon" style="color: {symbolDisplay.color}">
							{symbolDisplay.icon}
						</span>
						<span class="legend-name">{info.name}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Progress Indicator -->
		{#if allCorrect && !completed}
			<div class="unlock-progress" in:fly={{ y: 20, duration: 300 }}>
				<div class="progress-header">
					<span class="lock-icon">\uD83D\uDD12</span>
					<span>Unlocking...</span>
				</div>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {unlockProgress}%"></div>
				</div>
				<p class="progress-hint">Hold position! Don't change the dials!</p>
			</div>
		{/if}

		<!-- Keys Display -->
		<div class="keys-display">
			<img src={PUZZLE_ASSETS.keys} alt="Antique keys" class="keys-image" />
			<p class="keys-hint">Find the right combination...</p>
		</div>

		<!-- Completion State -->
		{#if completed}
			<div class="completion-overlay" in:fade={{ duration: 300 }}>
				<div class="completion-content" in:scale={{ start: 0.8 }}>
					<span class="unlock-icon">\uD83D\uDD13</span>
					<h3>Trunk Unlocked!</h3>
					<p>The trunk opens with a satisfying click...</p>
				</div>
			</div>
		{/if}
	</div>
</PuzzleContainer>

<style>
	.trunk-lock-puzzle {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
		padding: 1rem;
		align-items: center;
	}

	/* Lock Visual */
	.lock-visual {
		position: relative;
		width: 100%;
		max-width: 400px;
		aspect-ratio: 4/3;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
	}

	.lock-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.8);
	}

	.dials-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		padding: 1rem;
		align-items: center;
		justify-items: center;
	}

	.dial-slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		transition: all 0.2s ease;
	}

	.dial-slot.controlled-by-me {
		border-color: #FFB74D;
		background: rgba(255, 183, 77, 0.15);
	}

	.dial-slot.correct {
		border-color: #4CAF50;
		box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
	}

	.dial-slot.incorrect {
		border-color: rgba(244, 67, 54, 0.5);
	}

	.dial-display {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
	}

	.symbol-icon {
		font-size: 1.5rem;
	}

	.dial-controls {
		display: flex;
		gap: 0.25rem;
	}

	.dial-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: rgba(255, 183, 77, 0.3);
		border: 1px solid #FFB74D;
		border-radius: 4px;
		color: #FFB74D;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.dial-btn:hover {
		background: #FFB74D;
		color: #1a1a2e;
	}

	.dial-partner-indicator {
		font-size: 0.625rem;
		color: #8b8baa;
	}

	.correct-indicator {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #4CAF50;
		color: white;
		font-size: 0.625rem;
		border-radius: 50%;
	}

	/* Symbol Legend */
	.symbol-legend {
		width: 100%;
		max-width: 400px;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.symbol-legend h4 {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: #8b8baa;
	}

	.legend-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.legend-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		cursor: help;
	}

	.legend-icon {
		font-size: 1.25rem;
	}

	.legend-name {
		font-size: 0.625rem;
		color: #8b8baa;
	}

	/* Unlock Progress */
	.unlock-progress {
		width: 100%;
		max-width: 300px;
		padding: 1rem;
		background: rgba(30, 41, 59, 0.95);
		border: 2px solid #4CAF50;
		border-radius: 12px;
		text-align: center;
	}

	.progress-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		color: #4CAF50;
	}

	.lock-icon {
		font-size: 1.25rem;
		animation: shake 0.5s ease-in-out infinite;
	}

	.progress-bar {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #4CAF50;
		transition: width 0.1s linear;
	}

	.progress-hint {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: #8b8baa;
	}

	/* Keys Display */
	.keys-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.keys-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 8px;
		filter: sepia(0.3);
	}

	.keys-hint {
		font-size: 0.875rem;
		color: #8b8baa;
		font-style: italic;
	}

	/* Completion */
	.completion-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 16px;
	}

	.completion-content {
		text-align: center;
		padding: 2rem;
	}

	.unlock-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: 1rem;
	}

	.completion-content h3 {
		margin: 0 0 0.5rem;
		color: #4CAF50;
		font-size: 1.5rem;
	}

	.completion-content p {
		margin: 0;
		color: #8b8baa;
	}

	/* Animations */
	@keyframes shake {
		0%, 100% { transform: rotate(-5deg); }
		50% { transform: rotate(5deg); }
	}

	/* Responsive */
	@media (max-width: 640px) {
		.legend-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.legend-name {
			display: none;
		}

		.dial-display {
			width: 40px;
			height: 40px;
		}

		.symbol-icon {
			font-size: 1.25rem;
		}
	}
</style>

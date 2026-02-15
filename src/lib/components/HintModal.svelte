<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { backOut, quintOut } from 'svelte/easing';
	import { soundManager } from '$lib/audio';
	import type { PuzzleHint } from '$lib/types';
	import { hintTracking, hasHintBeenUsed, getHintsUsedForPuzzle, formatPenalty } from '$lib/stores';
	import { getCompletionNarrative } from '$lib/data/hints';

	export let isOpen = false;
	export let puzzleId = '';
	export let puzzleName = '';
	export let hints: PuzzleHint[] = [];
	export let currentAttempts = 0;
	export let hintsRemaining = 3;
	export let onHintUsed: (tier: number) => void = () => {};

	const dispatch = createEventDispatcher();

	// Determine which hint tier to show based on attempts
	$: currentTier = getCurrentTier();
	$: availableHints = hints.filter(h => currentAttempts >= h.triggerAttempts && !hasHintBeenUsed(puzzleId, h.tier));
	$: canRequestHint = availableHints.length > 0 && hintsRemaining > 0;
	$: usedHints = getHintsUsedForPuzzle(puzzleId);
	$: totalPenalty = usedHints.length * 2;

	function getCurrentTier(): number {
		if (currentAttempts >= 6) return 3;
		if (currentAttempts >= 4) return 2;
		if (currentAttempts >= 2) return 1;
		return 0;
	}

	function getTierName(tier: number): string {
		switch (tier) {
			case 1: return 'Gentle Nudge';
			case 2: return 'Partial Solution';
			case 3: return 'Detailed Guide';
			default: return 'Hint';
		}
	}

	function getTierColor(tier: number): string {
		switch (tier) {
			case 1: return '#4A9B8C'; // Teal - subtle
			case 2: return '#F4A460'; // Amber - moderate
			case 3: return '#E57373'; // Red - obvious
			default: return '#C9A9A6';
		}
	}

	function requestHint() {
		if (!canRequestHint) return;

		soundManager.playClick();
		const tier = Math.min(currentTier, 3);

		// Track hint usage
		hintTracking.useHint(puzzleId, tier);

		onHintUsed(tier);
		dispatch('hintRequested', { tier, attempts: currentAttempts, penalty: 2 });
	}

	function closeModal() {
		soundManager.playClick();
		isOpen = false;
		dispatch('close');
	}

	function handleRequestHint() {
		if (!canRequestHint) return;

		const tier = Math.min(currentTier, 3);
		const hint = hints.find(h => h.tier === tier);
		if (hint) {
			// Hint tracking is handled in requestHint()
		}
		requestHint();
	}

	// Get the most relevant hint to display
	$: nextHint = availableHints.length > 0 ? availableHints[availableHints.length - 1] : null;
</script>

{#if isOpen}
	<div class="hint-overlay" in:fade={{ duration: 200 }} on:click={closeModal} role="dialog" aria-modal="true" aria-labelledby="hint-title">
		<div class="hint-modal" in:fly={{ y: 30, duration: 350, easing: backOut }} on:click|stopPropagation>
			<!-- Header -->
			<div class="modal-header">
				<div class="header-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
				</div>
				<div class="header-text">
					<h2 id="hint-title">Hint System</h2>
					<p class="puzzle-name">{puzzleName}</p>
				</div>
				<button class="close-btn" on:click={closeModal} aria-label="Close hint modal">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<!-- Hint Status -->
			<div class="hint-status">
				<div class="status-item">
					<span class="status-label">Attempts Made</span>
					<span class="status-value">{currentAttempts}</span>
				</div>
				<div class="status-divider"></div>
				<div class="status-item">
					<span class="status-label">Hints Remaining</span>
					<span class="status-value">{hintsRemaining}/3</span>
				</div>
				<div class="status-divider"></div>
				<div class="status-item">
					<span class="status-label">Time Penalty</span>
					<span class="status-value penalty">{formatPenalty(totalPenalty)}</span>
				</div>
			</div>

			<!-- Hint Tier Progress -->
			<div class="tier-progress">
				<div class="tier-track">
					{#each [1, 2, 3] as tier}
						<div
							class="tier-segment {currentTier >= tier ? 'active' : ''}"
							style="--tier-color: {getTierColor(tier)}"
						>
							<span class="tier-label">{getTierName(tier)}</span>
						</div>
					{/each}
				</div>
				<p class="progress-hint">
					{#if currentTier === 0}
						Make a few more attempts to unlock hints
					{:else if currentTier < 3}
						More attempts will unlock additional hints
					{:else}
						All hint tiers unlocked
					{/if}
				</p>
			</div>

			<!-- Current Available Hint -->
			{#if nextHint}
				<div class="available-hint" in:fade={{ duration: 300 }}>
					<div class="hint-badge" style="background-color: {getTierColor(nextHint.tier)}">
						{getTierName(nextHint.tier)}
					</div>
					<p class="hint-preview">
						Ready to reveal: "{nextHint.text.substring(0, 50)}..."
					</p>
				</div>
			{:else}
				<div class="no-hint">
					<div class="no-hint-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" y1="8" x2="12" y2="12"/>
							<line x1="12" y1="16" x2="12.01" y2="16"/>
						</svg>
					</div>
					<p>No hints available yet</p>
					<span class="hint-subtext">Keep trying! Hints unlock after multiple attempts.</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="modal-actions">
				<button
					class="btn btn-primary"
					disabled={!canRequestHint}
					on:click={handleRequestHint}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
					</svg>
					{#if canRequestHint}
						Request {getTierName(currentTier)}
					{:else}
						No Hint Available
					{/if}
				</button>
				<button class="btn btn-secondary" on:click={closeModal}>
					Keep Trying
				</button>
			</div>

			<!-- Hint History -->
			{#if usedHints && usedHints.length > 0}
				<div class="hint-history">
					<h3>Previously Revealed Hints</h3>
					<div class="history-list">
						{#each usedHints as hint, i}
							<div class="history-item">
								<span class="history-tier" style="color: {getTierColor(hint.tier)}">
									{getTierName(hint.tier)}
								</span>
								<p class="history-text">{hint.text}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.hint-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.hint-modal {
		background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 20px;
		max-width: 480px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 40px rgba(212, 175, 55, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.header-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
		border-radius: 12px;
		flex-shrink: 0;
	}

	.header-icon svg {
		width: 24px;
		height: 24px;
		color: #D4AF37;
	}

	.header-text {
		flex: 1;
	}

	.header-text h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: #FFFFFF;
		font-family: 'Playfair Display', Georgia, serif;
	}

	.puzzle-name {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: rgba(201, 169, 166, 0.8);
	}

	.close-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(201, 169, 166, 0.7);
		cursor: pointer;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #FFFFFF;
	}

	.close-btn svg {
		width: 18px;
		height: 18px;
	}

	.hint-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.2);
	}

	.status-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.status-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(201, 169, 166, 0.6);
	}

	.status-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #D4AF37;
		font-family: 'JetBrains Mono', monospace;
	}

	.status-value.penalty {
		color: #E57373;
		font-size: 1.1rem;
	}

	.status-divider {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
	}

	.tier-progress {
		padding: 1.5rem;
	}

	.tier-track {
		display: flex;
		gap: 0.5rem;
	}

	.tier-segment {
		flex: 1;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		text-align: center;
		transition: all 0.3s ease;
	}

	.tier-segment.active {
		background: rgba(var(--tier-color), 0.15);
		border-color: var(--tier-color);
	}

	.tier-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(201, 169, 166, 0.6);
	}

	.tier-segment.active .tier-label {
		color: var(--tier-color);
		font-weight: 600;
	}

	.progress-hint {
		margin: 0.75rem 0 0;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.5);
		text-align: center;
		font-style: italic;
	}

	.available-hint,
	.no-hint {
		margin: 0 1.5rem;
		padding: 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
	}

	.available-hint {
		border-color: rgba(212, 175, 55, 0.2);
	}

	.hint-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #1a1a2e;
		margin-bottom: 0.75rem;
	}

	.hint-preview {
		margin: 0;
		font-size: 0.875rem;
		color: rgba(201, 169, 166, 0.9);
		font-style: italic;
	}

	.no-hint {
		text-align: center;
	}

	.no-hint-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(201, 169, 166, 0.1);
		border-radius: 50%;
	}

	.no-hint-icon svg {
		width: 24px;
		height: 24px;
		color: rgba(201, 169, 166, 0.5);
	}

	.no-hint p {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(201, 169, 166, 0.8);
	}

	.hint-subtext {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.5);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
	}

	.btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.25rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.25s ease;
		border: none;
		font-family: inherit;
	}

	.btn svg {
		width: 18px;
		height: 18px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
		color: #1a1a2e;
		box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(212, 175, 55, 0.4);
	}

	.btn-primary:disabled {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(201, 169, 166, 0.4);
		box-shadow: none;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(201, 169, 166, 0.8);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.hint-history {
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.hint-history h3 {
		margin: 0 0 1rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(201, 169, 166, 0.6);
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.history-item {
		padding: 0.875rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border-left: 3px solid;
	}

	.history-tier {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.history-text {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: rgba(201, 169, 166, 0.8);
		line-height: 1.5;
	}

	@media (max-width: 480px) {
		.hint-modal {
			max-height: 100vh;
			border-radius: 20px 20px 0 0;
			margin-top: auto;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>

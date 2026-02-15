<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import type { PlayerRole } from '$lib/types';
	import type {
		LoveLetterCipherState,
		LetterFragment
	} from '$lib/puzzles/room1/love-letter-cipher';
	import { puzzleImages } from '$lib/assets/images';

	import PuzzleContainer from './PuzzleContainer.svelte';

	// Props
	export let puzzleState: LoveLetterCipherState;
	export let playerRole: PlayerRole;
	export let timeElapsed: number = 0;

	const dispatch = createEventDispatcher();

	// Internal state
	let answerInput: string = '';
	let showSubmitFeedback: boolean = false;
	let feedbackMessage: string = '';
	let isCorrect: boolean = false;

	// Computed values
	$: isExplorer = playerRole === 'explorer';
	$: hasLight = isExplorer ? 'candle' : 'uv';
	$: lightActive = isExplorer ? puzzleState?.candleActive : puzzleState?.uvLightActive;
	$: otherLightActive = isExplorer ? puzzleState?.uvLightActive : puzzleState?.candleActive;
	$: fragments = puzzleState?.fragments || [];
	$: revealedLetters = puzzleState?.revealedLetters || [];
	$: completed = puzzleState?.completed || false;
	$: letterContent = puzzleState?.letterPaperContent || '';

	// Calculate revealed progress
	$: revealedCount = fragments.filter(f => f.revealed).length;
	$: progressPercent = Math.round((revealedCount / fragments.length) * 100);

	// Toggle light handler
	function toggleLight(): void {
		if (isExplorer) {
			dispatch('candle:toggle');
		} else {
			dispatch('uv:toggle');
		}
	}

	// Submit answer
	function handleSubmit(): void {
		if (answerInput.trim()) {
			dispatch('answer:submit', { answer: answerInput.toUpperCase().trim() });
			answerInput = '';
		}
	}

	// Handle key press
	function handleKeyPress(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}

	// Get fragment position style
	function getFragmentStyle(fragment: LetterFragment): string {
		return `left: ${fragment.position.x}%; top: ${fragment.position.y}%;`;
	}

	// Get reveal type icon
	function getRevealTypeIcon(revealedBy: 'candle' | 'uv' | 'both'): string {
		switch (revealedBy) {
			case 'candle': return '\uD83D\uDD25'; // fire
			case 'uv': return '\uD83D\uDCA1'; // light bulb
			case 'both': return '\uD83E\uDD1E'; // cross fingers
		}
	}

	onMount(() => {
		// Preload images
		const images = [
			puzzleImages.clueLetter,
			puzzleImages.candleHolder
		];
		images.forEach(src => {
			const img = new Image();
			img.src = src;
		});
	});
</script>

<PuzzleContainer
	puzzleId="love-letter-cipher"
	puzzleTitle="Love Letter Cipher"
	roomTheme="attic"
	description="Use the candle and UV light together to reveal the hidden message in this love letter."
	{completed}
	timeElapsed={timeElapsed}
	on:hint:request
>
	<div class="love-letter-puzzle">
		<!-- Progress Bar -->
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progressPercent}%"></div>
			<span class="progress-text">{revealedCount}/{fragments.length} Letters Revealed</span>
		</div>

		<!-- Main puzzle area -->
		<div class="puzzle-content">
			<!-- Letter Display -->
			<div class="letter-container">
				<!-- Background letter image -->
				<div class="letter-background">
					<img src={puzzleImages.clueLetter} alt="Antique love letter" class="letter-image" />
				</div>

				<!-- Letter text overlay -->
				<div class="letter-text">
					{#each letterContent.split('\n') as line}
						<p>{line}</p>
					{/each}
				</div>

				<!-- Letter fragments overlay -->
				<div class="fragments-layer">
					{#each fragments as fragment (fragment.id)}
						<div
							class="letter-fragment"
							class:revealed={fragment.revealed}
							class:candle-type={fragment.revealedBy === 'candle'}
							class:uv-type={fragment.revealedBy === 'uv'}
							class:both-type={fragment.revealedBy === 'both'}
							style={getFragmentStyle(fragment)}
						>
							{#if fragment.revealed}
								<span class="fragment-letter">{fragment.letter}</span>
							{:else}
								<span class="fragment-hint" title="Needs {fragment.revealedBy}">
									{getRevealTypeIcon(fragment.revealedBy)}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Revealed Letters Display -->
			<div class="revealed-display">
				<h4>Revealed Letters</h4>
				<div class="letters-row">
					{#each fragments as fragment (fragment.id)}
						<div
							class="letter-slot"
							class:filled={fragment.revealed}
							class:both-required={fragment.revealedBy === 'both'}
						>
							{#if fragment.revealed}
								{fragment.letter}
							{:else}
								_
							{/if}
						</div>
					{/each}
				</div>
				<p class="word-hint">Spell the hidden name!</p>
			</div>
		</div>

		<!-- Light Controls -->
		<div class="controls-section">
			<!-- Player's light control -->
			<div class="light-control">
				<button
					class="light-toggle"
					class:active={lightActive}
					on:click={toggleLight}
					aria-pressed={lightActive}
				>
					{#if isExplorer}
						<img src={puzzleImages.candleHolder} alt="Candle" class="light-icon" />
						<span>{lightActive ? 'Candle Lit' : 'Light Candle'}</span>
					{:else}
						<span class="uv-icon">\uD83D\uDCA1</span>
						<span>{lightActive ? 'UV Light On' : 'Turn On UV Light'}</span>
					{/if}
				</button>

				<!-- Other player's light status -->
				<div class="partner-status">
					{#if otherLightActive}
						<span class="status-indicator active">Partner's {isExplorer ? 'UV Light' : 'Candle'} is ON</span>
					{:else}
						<span class="status-indicator">Partner's {isExplorer ? 'UV Light' : 'Candle'} is OFF</span>
					{/if}
				</div>
			</div>

			<!-- Answer input -->
			{#if revealedCount >= 4}
				<div class="answer-section" in:fly={{ y: 20, duration: 300 }}>
					<label for="answer-input">Enter the hidden name:</label>
					<div class="input-row">
						<input
							id="answer-input"
							type="text"
							bind:value={answerInput}
							on:keypress={handleKeyPress}
							placeholder="Type the name..."
							maxlength="12"
							autocomplete="off"
						/>
						<button class="submit-btn" on:click={handleSubmit} disabled={!answerInput.trim()}>
							Submit
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Completion message -->
		{#if completed}
			<div class="completion-message" in:scale={{ start: 0.8 }}>
				<h3>Message Revealed!</h3>
				<p class="secret-word">{puzzleState?.expectedWord}</p>
				<p class="completion-text">The grandmother's name is revealed...</p>
			</div>
		{/if}
	</div>
</PuzzleContainer>

<style>
	.love-letter-puzzle {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
		padding: 1rem;
	}

	/* Progress Bar */
	.progress-bar {
		position: relative;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #FFB74D 0%, #F4D0C3 100%);
		border-radius: 12px;
		transition: width 0.5s ease;
	}

	.progress-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: #ffffff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	/* Letter Container */
	.letter-container {
		position: relative;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		aspect-ratio: 3/4;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	.letter-background {
		position: absolute;
		inset: 0;
	}

	.letter-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: sepia(0.3) brightness(0.9);
	}

	.letter-text {
		position: absolute;
		inset: 0;
		padding: 2rem;
		font-family: 'Georgia', serif;
		font-size: 0.75rem;
		line-height: 1.8;
		color: #3a2a1a;
		opacity: 0.7;
		white-space: pre-line;
		pointer-events: none;
	}

	.letter-text p {
		margin: 0 0 0.5em;
	}

	/* Letter Fragments */
	.fragments-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.letter-fragment {
		position: absolute;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 1.25rem;
		font-weight: 700;
		transform: translate(-50%, -50%);
		transition: all 0.3s ease;
	}

	.letter-fragment.revealed {
		background: rgba(255, 183, 77, 0.9);
		color: #1a1a2e;
		box-shadow: 0 0 20px rgba(255, 183, 77, 0.5);
		animation: reveal-pulse 0.5s ease;
	}

	.letter-fragment.candle-type:not(.revealed) {
		background: rgba(255, 100, 0, 0.2);
		border: 2px dashed rgba(255, 100, 0, 0.5);
	}

	.letter-fragment.uv-type:not(.revealed) {
		background: rgba(100, 100, 255, 0.2);
		border: 2px dashed rgba(100, 100, 255, 0.5);
	}

	.letter-fragment.both-type:not(.revealed) {
		background: rgba(255, 183, 77, 0.2);
		border: 2px dashed rgba(255, 183, 77, 0.5);
	}

	.fragment-hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	/* Revealed Display */
	.revealed-display {
		text-align: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.revealed-display h4 {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: #8b8baa;
	}

	.letters-row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.letter-slot {
		width: 32px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 1.25rem;
		font-weight: 600;
		color: #8b8baa;
		transition: all 0.3s ease;
	}

	.letter-slot.filled {
		background: rgba(255, 183, 77, 0.2);
		border-color: #FFB74D;
		color: #FFB74D;
	}

	.letter-slot.both-required {
		border-style: dashed;
	}

	.word-hint {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: #8b8baa;
	}

	/* Controls */
	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.light-control {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.light-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: #d4d4d4;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.light-toggle:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: #FFB74D;
	}

	.light-toggle.active {
		background: rgba(255, 183, 77, 0.2);
		border-color: #FFB74D;
		color: #FFB74D;
		box-shadow: 0 0 20px rgba(255, 183, 77, 0.3);
	}

	.light-icon {
		width: 32px;
		height: 32px;
		object-fit: contain;
		filter: sepia(0.5);
	}

	.light-toggle.active .light-icon {
		filter: none;
	}

	.uv-icon {
		font-size: 1.5rem;
	}

	.partner-status {
		font-size: 0.75rem;
	}

	.status-indicator {
		color: #8b8baa;
	}

	.status-indicator.active {
		color: #4CAF50;
	}

	/* Answer Section */
	.answer-section {
		width: 100%;
		max-width: 400px;
		text-align: center;
	}

	.answer-section label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #d4d4d4;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
	}

	.input-row input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #ffffff;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.input-row input::placeholder {
		color: #8b8baa;
		text-transform: none;
	}

	.input-row input:focus {
		outline: none;
		border-color: #FFB74D;
	}

	.submit-btn {
		padding: 0.75rem 1.5rem;
		background: #FFB74D;
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: #ffc107;
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Completion */
	.completion-message {
		text-align: center;
		padding: 2rem;
		background: rgba(76, 175, 80, 0.1);
		border: 2px solid #4CAF50;
		border-radius: 16px;
	}

	.completion-message h3 {
		margin: 0 0 0.5rem;
		color: #4CAF50;
	}

	.secret-word {
		font-size: 2rem;
		font-weight: 700;
		color: #FFB74D;
		letter-spacing: 0.2em;
		margin: 1rem 0;
	}

	.completion-text {
		color: #8b8baa;
		font-style: italic;
	}

	/* Animations */
	@keyframes reveal-pulse {
		0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
		50% { transform: translate(-50%, -50%) scale(1.2); }
		100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
	}

	/* Responsive */
	@media (max-width: 640px) {
		.letter-container {
			aspect-ratio: 3/5;
		}

		.letter-text {
			font-size: 0.625rem;
			padding: 1rem;
		}

		.letter-fragment {
			width: 30px;
			height: 30px;
			font-size: 1rem;
		}

		.letter-slot {
			width: 28px;
			height: 36px;
			font-size: 1rem;
		}
	}
</style>

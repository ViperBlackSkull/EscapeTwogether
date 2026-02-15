<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { soundManager } from '$lib/audio';

	export let isOpen = false;
	export let roomId: string = 'attic';
	export let narrativeType: 'intro' | 'discovery' | 'completion' = 'intro';
	export let customText: string | null = null;

	const dispatch = createEventDispatcher();

	// Narrative content for each room and moment
	// Story Theme: Estranged siblings Lily and James, separated by a family curse 25 years ago,
	// must work together to break the spell binding Blackwood Manor.
	const narratives: Record<string, { intro: string; discovery: string; completion: string }> = {
		attic: {
			intro: "Twenty-five years have passed since you last saw each other. Lily, you were just a child when James was sent away. Now, a mysterious letter has brought you both back to Blackwood Manor. The family curse that separated you can only be broken by working together. Your grandmother's trunk in this attic holds the first clues...",
			discovery: "Among the dusty photographs, you find your grandparents' love letters - written during a time when their own love was forbidden. The hidden messages reveal their secret wedding: June 15, 1947. This date holds power over the curse.",
			completion: "The trunk opens, revealing a silver locket and a cryptic message: 'Together at midnight in the clock tower, you'll find what you seek. Time is running out.' The bond between you strengthens as you feel the curse's grip loosening, just slightly."
		},
		clock_tower: {
			intro: "The clock tower stands frozen at 11:47 - thirteen minutes before midnight, the moment the curse took hold. Your grandparents built this tower as a testament to their love, hiding its secrets in the intricate mechanism. The gears await your touch, siblings bound by blood and magic.",
			discovery: "Each puzzle solved reveals another piece of your grandmother Stella's story. She was the clockmaker's apprentice, defying her family to marry your grandfather. The bells spell her name - meaning 'star.' Like the stars, their love guided them through darkness.",
			completion: "At the stroke of midnight, the tower comes alive. The melody you've played - 'Edelweiss,' their wedding song - echoes through the night. A hidden passage opens, leading to the garden conservatory where the final test awaits."
		},
		garden_conservatory: {
			intro: "Dawn breaks as you enter the conservatory, where your grandparents created their masterpiece - a garden of hybrid flowers, each one a symbol of their enduring love. The Love Lily at its center blooms only when two souls, torn apart by darkness, work together to nurture it back to life.",
			discovery: "The journal entries describe how they crossbred roses and lilies, creating flowers that thrived against all odds. 'Just as our love bloomed in darkness,' Stella wrote, 'so too can the bond between siblings survive any separation.'",
			completion: "The Love Lily blooms in brilliant crimson and gold as your fingers touch its petals simultaneously. The curse shatters like glass, and for the first time in 25 years, you see each other clearly. The manor's shadows lift. You are free - and together."
		}
	};

	$: narrative = customText || narratives[roomId]?.[narrativeType] || "A mysterious story unfolds...";

	// Animation state
	let showOverlay = false;
	let showContent = false;
	let textVisible = false;
	let showContinue = false;

	// Typewriter effect
	let displayedText = '';
	let fullText = '';
	let charIndex = 0;
	let typewriterInterval: ReturnType<typeof setInterval>;

	function startTypewriter() {
		displayedText = '';
		fullText = narrative;
		charIndex = 0;

		if (typewriterInterval) {
			clearInterval(typewriterInterval);
		}

		typewriterInterval = setInterval(() => {
			if (charIndex < fullText.length) {
				displayedText += fullText[charIndex];
				charIndex++;

				// Play subtle sound every few characters
				if (charIndex % 3 === 0) {
					soundManager.play('button-hover', { volume: 0.1 });
				}
			} else {
				clearInterval(typewriterInterval);
				showContinue = true;
			}
		}, 40);
	}

	function handleContinue() {
		soundManager.playClick();
		dispatch('continue');
		closeNarrative();
	}

	function closeNarrative() {
		if (typewriterInterval) {
			clearInterval(typewriterInterval);
		}
		showOverlay = false;
		showContent = false;
		textVisible = false;
		showContinue = false;
		isOpen = false;
	}

	async function startNarrative() {
		showOverlay = true;
		await delay(300);
		showContent = true;
		await delay(400);
		textVisible = true;
		startTypewriter();
	}

	function delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	$: if (isOpen && !showOverlay) {
		startNarrative();
	}

	// Get room-specific styling
	const roomStyles: Record<string, { accent: string; icon: string }> = {
		attic: { accent: '#F4A460', icon: '📜' },
		clock_tower: { accent: '#4A9B8C', icon: '🕰️' },
		garden_conservatory: { accent: '#6B8E4E', icon: '🌸' }
	};

	$: style = roomStyles[roomId] || { accent: '#D4AF37', icon: '📖' };
</script>

{#if isOpen}
	<div class="narrative-overlay" role="dialog" aria-modal="true" aria-labelledby="narrative-text">
		<!-- Background -->
		{#if showOverlay}
			<div class="narrative-bg" in:fade={{ duration: 400 }} style="--accent-color: {style.accent};"></div>
		{/if}

		<!-- Decorative elements -->
		<div class="decorative-corner top-left"></div>
		<div class="decorative-corner top-right"></div>
		<div class="decorative-corner bottom-left"></div>
		<div class="decorative-corner bottom-right"></div>

		<!-- Content -->
		{#if showContent}
			<div class="narrative-content" in:fly={{ y: 30, duration: 500, easing: backOut }}>
				<!-- Room icon -->
				<div class="room-icon" style="background: {style.accent};">
					{style.icon}
				</div>

				<!-- Narrative card -->
				<div class="narrative-card">
					<!-- Quotation marks -->
					<div class="quote-mark open">"</div>

					<!-- Text with typewriter effect -->
					{#if textVisible}
						<p id="narrative-text" class="narrative-text">
							{displayedText}<span class="cursor">|</span>
						</p>
					{/if}

					<div class="quote-mark close">"</div>
				</div>

				<!-- Continue button -->
				{#if showContinue}
					<div class="continue-section" in:fade={{ duration: 300 }}>
						<button class="continue-btn" on:click={handleContinue}>
							<span>Continue</span>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="5" y1="12" x2="19" y2="12"/>
								<polyline points="12 5 19 12 12 19"/>
							</svg>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.narrative-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.narrative-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			rgba(15, 15, 35, 0.97) 0%,
			rgba(26, 26, 46, 0.95) 50%,
			rgba(15, 15, 35, 0.97) 100%
		);
	}

	.narrative-bg::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 60% 50% at 50% 50%,
			rgba(var(--accent-color-rgb, 212, 175, 55), 0.08) 0%,
			transparent 60%
		);
	}

	/* Decorative corners */
	.decorative-corner {
		position: absolute;
		width: 60px;
		height: 60px;
		border: 2px solid rgba(212, 175, 55, 0.2);
		pointer-events: none;
		z-index: 1;
	}

	.top-left {
		top: 2rem;
		left: 2rem;
		border-right: none;
		border-bottom: none;
	}

	.top-right {
		top: 2rem;
		right: 2rem;
		border-left: none;
		border-bottom: none;
	}

	.bottom-left {
		bottom: 2rem;
		left: 2rem;
		border-right: none;
		border-top: none;
	}

	.bottom-right {
		bottom: 2rem;
		right: 2rem;
		border-left: none;
		border-top: none;
	}

	.narrative-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 700px;
		width: 100%;
	}

	.room-icon {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		border-radius: 50%;
		margin-bottom: 1.5rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.narrative-card {
		position: relative;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 16px;
		padding: 2.5rem 3rem;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
	}

	.quote-mark {
		position: absolute;
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 5rem;
		line-height: 1;
		color: rgba(212, 175, 55, 0.15);
		pointer-events: none;
	}

	.quote-mark.open {
		top: -0.5rem;
		left: 1.5rem;
	}

	.quote-mark.close {
		bottom: -2rem;
		right: 1.5rem;
	}

	.narrative-text {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1.1rem, 2.5vw, 1.4rem);
		line-height: 1.8;
		color: rgba(244, 208, 195, 0.95);
		margin: 0;
		text-align: center;
		font-style: italic;
		min-height: 6rem;
	}

	.cursor {
		display: inline-block;
		animation: blink 1s step-end infinite;
		color: rgba(212, 175, 55, 0.8);
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	.continue-section {
		margin-top: 2rem;
	}

	.continue-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1.75rem;
		background: transparent;
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 12px;
		color: rgba(244, 208, 195, 0.9);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: inherit;
	}

	.continue-btn:hover {
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.5);
		transform: translateY(-2px);
	}

	.continue-btn svg {
		width: 18px;
		height: 18px;
	}

	@media (max-width: 640px) {
		.narrative-overlay {
			padding: 1rem;
		}

		.narrative-card {
			padding: 2rem 1.5rem;
		}

		.quote-mark {
			font-size: 3rem;
		}

		.quote-mark.open {
			top: -0.25rem;
			left: 1rem;
		}

		.quote-mark.close {
			bottom: -1.25rem;
			right: 1rem;
		}

		.decorative-corner {
			width: 40px;
			height: 40px;
		}

		.top-left,
		.top-right,
		.bottom-left,
		.bottom-right {
			top: 1rem;
			left: 1rem;
		}

		.top-right {
			left: auto;
			right: 1rem;
		}

		.bottom-left {
			top: auto;
			bottom: 1rem;
		}

		.bottom-right {
			top: auto;
			left: auto;
			bottom: 1rem;
			right: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor {
			animation: none;
			opacity: 1;
		}

		.continue-btn {
			transition: none;
		}
	}
</style>

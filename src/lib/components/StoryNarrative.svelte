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
	const narratives: Record<string, { intro: string; discovery: string; completion: string }> = {
		attic: {
			intro: "Dust motes dance in the golden light filtering through the attic window. Before you lies a trunk that hasn't been opened in decades. Grandmother's secrets wait within...",
			discovery: "A faded photograph slips from between the pages. Two young lovers smile up at you from a time long past. Their initials are carved into the trunk's lid...",
			completion: "The trunk reveals its final secret: a locket containing two intertwined strands of hair. Love, preserved across generations, has guided you here."
		},
		clock_tower: {
			intro: "The clock tower's gears click in rhythmic precision. Moonlight streams through the massive clock face, casting silver shadows. Somewhere in this mechanism lies a message from the past...",
			discovery: "You find initials carved into a brass gear: 'E + R'. Elizabeth and Robert, the clockmaker and his beloved. They built this tower together, hiding their story in its workings...",
			completion: "The clocks chime as one, and a hidden compartment springs open. Inside: a ring, crafted from a clock's spring. Time has kept their promise safe."
		},
		garden_conservatory: {
			intro: "Rain patters gently against the glass ceiling of the conservatory. Exotic flowers bloom in the humid air, their colors vibrant in the dawn light. Each petal holds a clue...",
			discovery: "A leather journal lies open on the potting bench. Sketches of hybrid flowers fill its pages, each one a product of patient love and careful tending...",
			completion: "The final flower blooms, its petals forming a perfect heart shape. In nature, as in love, patience and care create the most beautiful things."
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

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { backOut, quintOut } from 'svelte/easing';
	import { preferences, hasCompletedQuiz } from '$lib/stores/preferences';
	import { soundManager } from '$lib/audio';
	import type { CollaborationStyle, ChallengePreference, HintPreference, StoredPreferences } from '$lib/stores/preferences';

	export let isOpen = false;
	export let initialPlayerName = ''; // Pre-fill from landing page

	const dispatch = createEventDispatcher();

	// Quiz state
	let currentStep = 0;
	const totalSteps = 5;

	// Form data
	let playerAName = '';
	let playerBName = '';
	let collaboration: CollaborationStyle = 'talk_through';
	let challengePreference: ChallengePreference = 'balanced';
	let hintPreference: HintPreference = 'when_stuck';
	let difficultyTier = 3;

	// Animation state
	let isTransitioning = false;

	// Pre-fill on mount
	onMount(() => {
		if (initialPlayerName) {
			playerAName = initialPlayerName;
		}
	});

	// Options for each step
	const collaborationOptions: { value: CollaborationStyle; label: string; description: string; icon: string }[] = [
		{
			value: 'one_leads',
			label: 'One Leads',
			description: 'One person takes charge, the other supports',
			icon: '👑'
		},
		{
			value: 'independent_explore',
			label: 'Independent Exploration',
			description: 'We explore separately and share discoveries',
			icon: '🔍'
		},
		{
			value: 'talk_through',
			label: 'Talk It Through',
			description: 'We discuss everything together',
			icon: '💬'
		}
	];

	const challengeOptions: { value: ChallengePreference; label: string; description: string; icon: string }[] = [
		{
			value: 'relaxed',
			label: 'Relaxed',
			description: "We're here for the story and experience",
			icon: '🌿'
		},
		{
			value: 'balanced',
			label: 'Balanced',
			description: 'A good mix of challenge and fun',
			icon: '⚖️'
		},
		{
			value: 'challenge_seeking',
			label: 'Challenge Seeking',
			description: 'We want to be stumped',
			icon: '🔥'
		}
	];

	const hintOptions: { value: HintPreference; label: string; description: string; icon: string }[] = [
		{
			value: 'early',
			label: 'Early & Often',
			description: 'Offer hints as soon as we might need them',
			icon: '💡'
		},
		{
			value: 'when_stuck',
			label: 'When Stuck',
			description: 'Only when we are truly stuck',
			icon: '🆘'
		},
		{
			value: 'never',
			label: 'No Hints',
			description: 'We want to figure it out ourselves',
			icon: '🚫'
		}
	];

	const difficultyDescriptions: Record<number, { title: string; description: string }> = {
		1: { title: 'Very Easy', description: 'Relaxed pace, generous hints, forgiving puzzles' },
		2: { title: 'Easy', description: 'Gentle challenges, helpful guidance' },
		3: { title: 'Normal', description: 'Balanced experience, hints available' },
		4: { title: 'Hard', description: 'Demanding puzzles, limited hints' },
		5: { title: 'Expert', description: 'True test of skill, minimal assistance' }
	};

	const stepTitles = [
		'Your Names',
		'Collaboration Style',
		'Challenge Level',
		'Hint Preference',
		'Difficulty'
	];

	function playClickSound() {
		soundManager.playClick();
	}

	function nextStep() {
		playClickSound();

		// Validate current step
		if (currentStep === 0) {
			if (!playerAName.trim()) {
				soundManager.playPuzzleError();
				return;
			}
			if (!playerBName.trim()) {
				soundManager.playPuzzleError();
				return;
			}
		}

		if (currentStep < totalSteps - 1) {
			isTransitioning = true;
			setTimeout(() => {
				currentStep++;
				isTransitioning = false;
			}, 200);
		}
	}

	function prevStep() {
		playClickSound();
		if (currentStep > 0) {
			isTransitioning = true;
			setTimeout(() => {
				currentStep--;
				isTransitioning = false;
			}, 200);
		}
	}

	function saveAndClose() {
		playClickSound();

		// Save all preferences
		preferences.setPlayerNames(playerAName.trim(), playerBName.trim());
		preferences.setCollaboration(collaboration);
		preferences.setChallengePreference(challengePreference);
		preferences.setHintPreference(hintPreference);
		preferences.setDifficultyTier(difficultyTier);
		preferences.completeQuiz();

		soundManager.playNotification();

		dispatch('save', {
			playerNames: { playerA: playerAName.trim(), playerB: playerBName.trim() },
			collaboration,
			challengePreference,
			hintPreference,
			difficultyTier
		} as StoredPreferences);

		isOpen = false;
		dispatch('close');
	}

	function closeModal() {
		playClickSound();
		isOpen = false;
		dispatch('close');
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function setDifficulty(tier: number) {
		playClickSound();
		difficultyTier = tier;
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="quiz-overlay"
		in:fade={{ duration: 200 }}
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="quiz-title"
		tabindex="-1"
	>
		<!-- Modal -->
		<div
			class="quiz-modal"
			in:fly={{ y: 30, duration: 350, easing: backOut }}
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="modal-header">
				<div class="header-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
						<path d="M12 6v6l4 2"/>
					</svg>
				</div>
				<div class="header-text">
					<h2 id="quiz-title">Game Preferences</h2>
					<p class="step-indicator">Step {currentStep + 1} of {totalSteps}</p>
				</div>
				<button class="close-btn" on:click={closeModal} aria-label="Close preferences">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<!-- Progress Bar -->
			<div class="progress-bar">
				<div class="progress-track">
					{#each Array(totalSteps) as _, i}
						<div class="progress-segment {i <= currentStep ? 'completed' : ''} {i === currentStep ? 'active' : ''}">
						</div>
					{/each}
				</div>
			</div>

			<!-- Content Area -->
			<div class="modal-content" class:transitioning={isTransitioning}>
				<!-- Step 1: Player Names -->
				{#if currentStep === 0}
					<div class="step-content" in:fade={{ duration: 200 }}>
						<h3 class="step-title">{stepTitles[0]}</h3>
						<p class="step-description">Who's playing today?</p>

						<div class="name-inputs">
							<div class="input-group">
								<label for="playerA">Your Name</label>
								<input
									type="text"
									id="playerA"
									bind:value={playerAName}
									placeholder="Enter your name"
									maxlength={20}
									autocomplete="name"
								/>
							</div>

							<div class="input-group">
								<label for="playerB">Partner's Name</label>
								<input
									type="text"
									id="playerB"
									bind:value={playerBName}
									placeholder="Enter partner's name"
									maxlength={20}
									autocomplete="name"
								/>
							</div>
						</div>
					</div>

				<!-- Step 2: Collaboration Style -->
				{:else if currentStep === 1}
					<div class="step-content" in:fade={{ duration: 200 }}>
						<h3 class="step-title">{stepTitles[1]}</h3>
						<p class="step-description">How do you work together?</p>

						<div class="options-grid">
							{#each collaborationOptions as option}
								<button
									class="option-card"
									class:selected={collaboration === option.value}
									on:click={() => { playClickSound(); collaboration = option.value; }}
								>
									<span class="option-icon">{option.icon}</span>
									<span class="option-label">{option.label}</span>
									<span class="option-description">{option.description}</span>
								</button>
							{/each}
						</div>
					</div>

				<!-- Step 3: Challenge Preference -->
				{:else if currentStep === 2}
					<div class="step-content" in:fade={{ duration: 200 }}>
						<h3 class="step-title">{stepTitles[2]}</h3>
						<p class="step-description">What kind of experience are you looking for?</p>

						<div class="options-grid">
							{#each challengeOptions as option}
								<button
									class="option-card"
									class:selected={challengePreference === option.value}
									on:click={() => { playClickSound(); challengePreference = option.value; }}
								>
									<span class="option-icon">{option.icon}</span>
									<span class="option-label">{option.label}</span>
									<span class="option-description">{option.description}</span>
								</button>
							{/each}
						</div>
					</div>

				<!-- Step 4: Hint Preference -->
				{:else if currentStep === 3}
					<div class="step-content" in:fade={{ duration: 200 }}>
						<h3 class="step-title">{stepTitles[3]}</h3>
						<p class="step-description">When should we offer hints?</p>

						<div class="options-grid">
							{#each hintOptions as option}
								<button
									class="option-card"
									class:selected={hintPreference === option.value}
									on:click={() => { playClickSound(); hintPreference = option.value; }}
								>
									<span class="option-icon">{option.icon}</span>
									<span class="option-label">{option.label}</span>
									<span class="option-description">{option.description}</span>
								</button>
							{/each}
						</div>
					</div>

				<!-- Step 5: Difficulty Tier -->
				{:else if currentStep === 4}
					<div class="step-content" in:fade={{ duration: 200 }}>
						<h3 class="step-title">{stepTitles[4]}</h3>
						<p class="step-description">Select your difficulty level</p>

						<div class="difficulty-selector">
							<div class="star-rating">
								{#each [1, 2, 3, 4, 5] as tier}
									<button
										class="star-btn"
										class:active={tier <= difficultyTier}
										on:click={() => setDifficulty(tier)}
										aria-label="Set difficulty to {tier} stars"
									>
										<svg viewBox="0 0 24 24" fill={tier <= difficultyTier ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
											<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
										</svg>
									</button>
								{/each}
							</div>

							<div class="difficulty-info">
								<h4 class="difficulty-title">{difficultyDescriptions[difficultyTier].title}</h4>
								<p class="difficulty-description">{difficultyDescriptions[difficultyTier].description}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="modal-actions">
				{#if currentStep > 0}
					<button class="btn btn-secondary" on:click={prevStep}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15 18 9 12 15 6"/>
						</svg>
						Back
					</button>
				{:else}
					<div></div>
				{/if}

				{#if currentStep < totalSteps - 1}
					<button class="btn btn-primary" on:click={nextStep}>
						Continue
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9 18 15 12 9 6"/>
						</svg>
					</button>
				{:else}
					<button class="btn btn-primary" on:click={saveAndClose}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						Save Preferences
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.quiz-overlay {
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

	.quiz-modal {
		background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 20px;
		max-width: 520px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 40px rgba(212, 175, 55, 0.1);
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
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

	.step-indicator {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
		color: rgba(201, 169, 166, 0.7);
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

	/* Progress Bar */
	.progress-bar {
		padding: 0 1.5rem;
		flex-shrink: 0;
	}

	.progress-track {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 0;
	}

	.progress-segment {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		transition: all 0.3s ease;
	}

	.progress-segment.completed {
		background: linear-gradient(90deg, #D4AF37, #B8860B);
	}

	.progress-segment.active {
		background: #D4AF37;
		box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
	}

	/* Content */
	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		min-height: 300px;
	}

	.modal-content.transitioning {
		opacity: 0.5;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.step-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #FFFFFF;
		font-family: 'Playfair Display', Georgia, serif;
	}

	.step-description {
		margin: 0;
		font-size: 0.95rem;
		color: rgba(201, 169, 166, 0.8);
	}

	/* Name Inputs */
	.name-inputs {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.input-group input {
		width: 100%;
		padding: 14px 16px;
		background: rgba(15, 15, 35, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 10px;
		color: #fff;
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.25s;
		outline: none;
	}

	.input-group input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.input-group input:focus {
		border-color: #D4AF37;
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	/* Options Grid */
	.options-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
		text-align: left;
	}

	.option-card:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(4px);
	}

	.option-card.selected {
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
		border-color: rgba(212, 175, 55, 0.4);
		box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
	}

	.option-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}

	.option-label {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		color: #FFFFFF;
		margin-bottom: 0.25rem;
	}

	.option-description {
		display: block;
		font-size: 0.85rem;
		color: rgba(201, 169, 166, 0.7);
	}

	.option-card.selected .option-label {
		color: #D4AF37;
	}

	/* Difficulty Selector */
	.difficulty-selector {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem 0;
	}

	.star-rating {
		display: flex;
		gap: 0.5rem;
	}

	.star-btn {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		color: rgba(255, 255, 255, 0.2);
	}

	.star-btn:hover {
		transform: scale(1.1);
	}

	.star-btn.active {
		color: #D4AF37;
		filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
	}

	.star-btn svg {
		width: 32px;
		height: 32px;
	}

	.difficulty-info {
		text-align: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		width: 100%;
	}

	.difficulty-title {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #D4AF37;
	}

	.difficulty-description {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(201, 169, 166, 0.8);
	}

	/* Actions */
	.modal-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.25s ease;
		border: none;
		font-family: inherit;
		min-width: 140px;
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

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(212, 175, 55, 0.4);
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

	/* Responsive */
	@media (max-width: 480px) {
		.quiz-modal {
			max-height: 100vh;
			border-radius: 20px 20px 0 0;
			margin-top: auto;
		}

		.modal-content {
			min-height: 280px;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}

		.star-btn {
			width: 40px;
			height: 40px;
		}

		.star-btn svg {
			width: 28px;
			height: 28px;
		}
	}
</style>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import type { PlayerRole } from '$lib/types';
	import type {
		SecretMessageState,
		HiddenLetterObject,
		DiscoveredLetter
	} from '$lib/puzzles/room1/secret-message';
	import { puzzleImages } from '$lib/assets/images';

	import PuzzleContainer from './PuzzleContainer.svelte';

	// Props
	export let puzzleState: SecretMessageState;
	export let playerRole: PlayerRole;
	export let timeElapsed: number = 0;

	const dispatch = createEventDispatcher();

	// Internal state
	let firstNameInput: string = '';
	let secondNameInput: string = '';
	let selectedObject: string | null = null;

	// Computed values
	$: isExplorer = playerRole === 'explorer';
	$: objects = puzzleState?.objects || [];
	$: discoveredLetters = puzzleState?.discoveredLetters || [];
	$: lettersFound = puzzleState?.lettersFound || 0;
	$: completed = puzzleState?.completed || false;
	$: favoritesList = isExplorer ? null : getFavoritesList();

	// Progress
	$: progressPercent = Math.round((lettersFound / objects.length) * 100);

	// Get favorites list for analyst
	function getFavoritesList(): string[] {
		return objects.map(obj => obj.hint);
	}

	// Get discovered letters for display
	$: discoveredLetterSet = new Set(discoveredLetters.filter(l => l.discoveredBy).map(l => l.letter));

	// Handle object click (explorer)
	function handleObjectClick(objectId: string): void {
		if (isExplorer) {
			selectedObject = selectedObject === objectId ? null : objectId;
			dispatch('object:examine', { objectId });
		}
	}

	// Handle hint selection (analyst)
	function handleHintSelect(hint: string, index: number): void {
		if (!isExplorer) {
			dispatch('hint:select', { hint, index });
		}
	}

	// Submit answer
	function handleSubmit(): void {
		if (firstNameInput.trim() && secondNameInput.trim()) {
			dispatch('answer:submit', {
				first: firstNameInput.toUpperCase().trim(),
				second: secondNameInput.toUpperCase().trim()
			});
		}
	}

	// Check if object is discovered
	function isObjectDiscovered(objectId: string): boolean {
		return discoveredLetters.some(l => l.objectId === objectId && l.discoveredBy);
	}

	// Get object position style
	function getObjectPositionStyle(position: { x: number; y: number }): string {
		return `left: ${position.x}px; top: ${position.y}px;`;
	}

	onMount(() => {
		// Preload images
		const images = [
			puzzleImages.clueNote,
			puzzleImages.magnifyingGlass,
			puzzleImages.treasureMap
		];
		images.forEach(src => {
			const img = new Image();
			img.src = src;
		});
	});
</script>

<PuzzleContainer
	puzzleId="secret-message"
	puzzleTitle="The Secret Message"
	roomTheme="attic"
	description="Hidden letters are scattered throughout the attic. Find all the letters to discover your grandparents' names."
	{completed}
	timeElapsed={timeElapsed}
	on:hint:request
>
	<div class="secret-message-puzzle">
		<!-- Progress Bar -->
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progressPercent}%"></div>
			<span class="progress-text">{lettersFound}/{objects.length} Letters Found</span>
		</div>

		<!-- Main content split by role -->
		<div class="puzzle-content" class:explorer-view={isExplorer} class:analyst-view={!isExplorer}>

			<!-- Explorer View: Room with objects -->
			{#if isExplorer}
				<div class="room-view">
					<!-- Room background -->
					<div class="room-background">
						<img src={puzzleImages.treasureMap} alt="Attic room" class="room-image" />
					</div>

					<!-- Object layer -->
					<div class="objects-layer">
						{#each objects as object (object.id)}
							{@const isDiscovered = isObjectDiscovered(object.id)}
							{@const isSelected = selectedObject === object.id}

							<button
								class="room-object"
								class:discovered={isDiscovered}
								class:selected={isSelected}
								style={getObjectPositionStyle(object.position)}
								on:click={() => handleObjectClick(object.id)}
								aria-label="{object.name}: {object.description}"
							>
								<span class="object-icon">
									{#if isDiscovered}
										{object.letter}
									{:else}
										?
									{/if}
								</span>
							</button>
						{/each}
					</div>

					<!-- Magnifying glass indicator -->
					<div class="tool-indicator">
						<img src={puzzleImages.magnifyingGlass} alt="Magnifying glass" class="tool-icon" />
						<span>Click objects to examine them</span>
					</div>

					<!-- Selected object detail -->
					{#if selectedObject}
						{@const obj = objects.find(o => o.id === selectedObject)}
						{#if obj}
							<div class="object-detail" in:fly={{ y: 20, duration: 300 }}>
								<h4>{obj.name}</h4>
								<p class="description">{obj.description}</p>
								<p class="action-hint">{obj.examineAction}</p>
								{#if isObjectDiscovered(selectedObject)}
									<div class="letter-revealed">
										Letter found: <strong>{obj.letter}</strong>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- Analyst View: Favorites list -->
			{#if !isExplorer}
				<div class="analyst-view">
					<div class="favorites-panel">
						<h3>Grandparents' Favorites</h3>
						<p class="panel-hint">Share these hints with your partner to help find the letters!</p>

						<div class="hints-list">
							{#each favoritesList || [] as hint, index}
								<button
									class="hint-item"
									class:discovered={isObjectDiscovered(objects[index]?.id)}
									on:click={() => handleHintSelect(hint, index)}
								>
									<span class="hint-number">{index + 1}</span>
									<span class="hint-text">{hint}</span>
									{#if isObjectDiscovered(objects[index]?.id)}
										<span class="found-letter">{objects[index]?.letter}</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Clue note visual -->
					<div class="clue-visual">
						<img src={puzzleImages.clueNote} alt="Mysterious note" class="clue-image" />
						<p class="clue-hint">Match the hints to objects in the room</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Discovered Letters Display -->
		<div class="discovered-section">
			<h4>Discovered Letters</h4>
			<div class="letters-grid">
				{#each ['M', 'A', 'R', 'I', 'E', 'J', 'A', 'M', 'E', 'S'] as letter, index}
					{@const isFound = discoveredLetterSet.has(letter)}
					<div
						class="letter-box"
						class:found={isFound}
						class:first-name={index < 5}
						class:second-name={index >= 5}
					>
						{#if isFound}
							{letter}
						{:else}
							_
						{/if}
					</div>
					{#if index === 4}
						<div class="name-separator">+</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Answer Input (when enough letters found) -->
		{#if lettersFound >= 8}
			<div class="answer-section" in:fly={{ y: 20, duration: 300 }}>
				<h4>Enter the Names</h4>
				<div class="name-inputs">
					<div class="input-group">
						<label for="first-name">First Name:</label>
						<input
							id="first-name"
							type="text"
							bind:value={firstNameInput}
							placeholder="MARIE"
							maxlength="5"
							autocomplete="off"
						/>
					</div>
					<span class="plus-sign">+</span>
					<div class="input-group">
						<label for="second-name">Second Name:</label>
						<input
							id="second-name"
							type="text"
							bind:value={secondNameInput}
							placeholder="JAMES"
							maxlength="5"
							autocomplete="off"
						/>
					</div>
				</div>
				<button
					class="submit-btn"
					on:click={handleSubmit}
					disabled={!firstNameInput.trim() || !secondInput.trim()}
				>
					Submit Answer
				</button>
			</div>
		{/if}

		<!-- Completion -->
		{#if completed}
			<div class="completion-message" in:scale={{ start: 0.8 }}>
				<h3>Names Revealed!</h3>
				<p class="names">{puzzleState?.correctSolution?.first} + {puzzleState?.correctSolution?.second}</p>
				<p class="story">Your grandparents' names are finally discovered...</p>
			</div>
		{/if}
	</div>
</PuzzleContainer>

<style>
	.secret-message-puzzle {
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

	/* Room View */
	.room-view {
		position: relative;
		width: 100%;
		height: 300px;
		border-radius: 12px;
		overflow: hidden;
	}

	.room-background {
		position: absolute;
		inset: 0;
	}

	.room-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.6) sepia(0.3);
	}

	.objects-layer {
		position: absolute;
		inset: 0;
	}

	.room-object {
		position: absolute;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 183, 77, 0.3);
		border: 2px solid rgba(255, 183, 77, 0.5);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		transform: translate(-50%, -50%);
	}

	.room-object:hover {
		background: rgba(255, 183, 77, 0.5);
		border-color: #FFB74D;
		transform: translate(-50%, -50%) scale(1.1);
	}

	.room-object.selected {
		background: rgba(255, 183, 77, 0.8);
		border-color: #FFB74D;
		box-shadow: 0 0 15px rgba(255, 183, 77, 0.5);
	}

	.room-object.discovered {
		background: rgba(76, 175, 80, 0.5);
		border-color: #4CAF50;
	}

	.object-icon {
		font-size: 1rem;
		font-weight: 700;
		color: #FFB74D;
	}

	.room-object.discovered .object-icon {
		color: #4CAF50;
	}

	/* Tool Indicator */
	.tool-indicator {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 8px;
		font-size: 0.75rem;
		color: #d4d4d4;
	}

	.tool-icon {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	/* Object Detail */
	.object-detail {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 200px;
		padding: 1rem;
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid rgba(255, 183, 77, 0.3);
		border-radius: 12px;
	}

	.object-detail h4 {
		margin: 0 0 0.5rem;
		color: #FFB74D;
		font-size: 1rem;
	}

	.object-detail .description {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		color: #d4d4d4;
	}

	.object-detail .action-hint {
		margin: 0;
		font-size: 0.75rem;
		color: #8b8baa;
		font-style: italic;
	}

	.letter-revealed {
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: rgba(76, 175, 80, 0.2);
		border-radius: 6px;
		text-align: center;
		color: #4CAF50;
	}

	/* Analyst View */
	.analyst-view {
		display: grid;
		grid-template-columns: 1fr 200px;
		gap: 1rem;
	}

	.favorites-panel {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.favorites-panel h3 {
		margin: 0 0 0.5rem;
		color: #FFB74D;
	}

	.panel-hint {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		color: #8b8baa;
	}

	.hints-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.hint-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.hint-item:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 183, 77, 0.3);
	}

	.hint-item.discovered {
		background: rgba(76, 175, 80, 0.1);
		border-color: rgba(76, 175, 80, 0.3);
	}

	.hint-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 183, 77, 0.2);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		color: #FFB74D;
	}

	.hint-text {
		flex: 1;
		font-size: 0.75rem;
		color: #d4d4d4;
	}

	.found-letter {
		font-size: 1rem;
		font-weight: 700;
		color: #4CAF50;
	}

	/* Clue Visual */
	.clue-visual {
		text-align: center;
	}

	.clue-image {
		width: 100%;
		max-width: 150px;
		border-radius: 8px;
		filter: sepia(0.4);
	}

	.clue-hint {
		margin: 0.5rem 0 0;
		font-size: 0.625rem;
		color: #8b8baa;
	}

	/* Discovered Letters */
	.discovered-section {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
		text-align: center;
	}

	.discovered-section h4 {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: #8b8baa;
	}

	.letters-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.letter-box {
		width: 28px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		color: #8b8baa;
	}

	.letter-box.found {
		background: rgba(255, 183, 77, 0.2);
		border-color: #FFB74D;
		color: #FFB74D;
	}

	.name-separator {
		font-size: 1.25rem;
		color: #8b8baa;
		padding: 0 0.25rem;
	}

	/* Answer Section */
	.answer-section {
		padding: 1rem;
		background: rgba(30, 41, 59, 0.6);
		border: 1px solid rgba(255, 183, 77, 0.3);
		border-radius: 12px;
		text-align: center;
	}

	.answer-section h4 {
		margin: 0 0 1rem;
		color: #FFB74D;
	}

	.name-inputs {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.input-group label {
		font-size: 0.75rem;
		color: #8b8baa;
	}

	.input-group input {
		width: 100px;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: #ffffff;
		font-size: 1rem;
		text-transform: uppercase;
		text-align: center;
		letter-spacing: 0.1em;
	}

	.input-group input:focus {
		outline: none;
		border-color: #FFB74D;
	}

	.plus-sign {
		font-size: 1.5rem;
		color: #8b8baa;
		padding-bottom: 0.5rem;
	}

	.submit-btn {
		padding: 0.75rem 2rem;
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

	.completion-message .names {
		font-size: 2rem;
		font-weight: 700;
		color: #FFB74D;
		letter-spacing: 0.2em;
		margin: 1rem 0;
	}

	.completion-message .story {
		color: #8b8baa;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.analyst-view {
			grid-template-columns: 1fr;
		}

		.clue-visual {
			display: none;
		}

		.letter-box {
			width: 24px;
			height: 32px;
			font-size: 0.875rem;
		}

		.name-inputs {
			flex-direction: column;
			align-items: center;
		}

		.plus-sign {
			padding: 0.5rem 0;
		}
	}
</style>

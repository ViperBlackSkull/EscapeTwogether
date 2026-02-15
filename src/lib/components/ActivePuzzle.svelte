<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { PuzzleDefinition, PuzzleState } from '$lib/types';
	import { getPuzzleById } from '$lib/puzzles';
	import { getGameManager, gameState } from '$lib/stores/gameState';
	import { currentPlayerRole, performRoleSwap } from '$lib/stores/roles';
	import GameCanvas from './GameCanvas.svelte';
	import PuzzleSelection from './PuzzleSelection.svelte';
	import RoleBadge from './RoleBadge.svelte';
	import { soundManager } from '$lib/audio';

	export let puzzleId: string | null = null;
	export let roomId: string = 'attic';

	const dispatch = createEventDispatcher();
	const gameManager = getGameManager();

	let showPuzzleSelection = false;
	let currentPuzzle: PuzzleDefinition | null = null;
	let puzzleState: PuzzleState | null = null;
	let isLoading = false;
	let showVictoryAnimation = false;

	// Role information
	$: currentRole = $currentPlayerRole;

	$: if (puzzleId) {
		loadPuzzle(puzzleId);
	}

	$: roomForCanvas = roomId === 'garden_conservatory' ? 'garden' : roomId as any;

	async function loadPuzzle(id: string) {
		if (!browser) return;

		isLoading = true;
		currentPuzzle = getPuzzleById(id);

		if (!currentPuzzle) {
			console.error('Puzzle not found:', id);
			isLoading = false;
			return;
		}

		// Get puzzle state from game manager
		puzzleState = gameManager.getCurrentPuzzleState();

		// Initialize puzzle state if needed
		if (!puzzleState) {
			puzzleState = {
				puzzleId: id,
				solved: false,
				attempts: 0,
				data: {}
			};
		}

		isLoading = false;
	}

	function openPuzzleSelection() {
		showPuzzleSelection = true;
		soundManager.playClick();
	}

	function handlePuzzleSelect(event: CustomEvent) {
		const { puzzleId } = event.detail;
		dispatch('start', { puzzleId });
		soundManager.play('puzzle-start');
	}

	function handleCloseSelection() {
		showPuzzleSelection = false;
	}

	function handleSubmitSolution(solution: any) {
		if (!currentPuzzle || !puzzleState) return;

		const result = gameManager.submitPuzzleSolution(currentPuzzle.id, solution);

		if (result.success) {
			showVictoryAnimation = true;
			soundManager.playPuzzleSolved();

			// Update puzzle state
			puzzleState = { ...puzzleState, solved: true };

			// Perform role swap after puzzle completion
			performRoleSwap();

			// Emit solved event
			dispatch('solved', { puzzleId: currentPuzzle.id });

			// Reset after animation
			setTimeout(() => {
				showVictoryAnimation = false;
				currentPuzzle = null;
				puzzleState = null;
			}, 2000);
		} else {
			soundManager.play('error');
			dispatch('attempt', { puzzleId: currentPuzzle.id, success: false });
		}
	}

	function handlePuzzlePieceClick(event: CustomEvent) {
		const { pieceId } = event.detail;
		console.log('Puzzle piece clicked:', pieceId);
		dispatch('pieceClick', event.detail);
	}

	function handlePuzzlePieceHover(event: CustomEvent) {
		dispatch('pieceHover', event.detail);
	}

	function handleCanvasInteract(event: CustomEvent) {
		const { type, id } = event.detail;

		// Handle room interactions
		if (type === 'table' || type === 'chest') {
			// Open puzzle selection
			openPuzzleSelection();
		}
	}

	function handleGameCanvasReady() {
		console.log('Game canvas ready');
		dispatch('ready');
	}

	// Cleanup
	onDestroy(() => {
		// Cleanup handled by parent
	});
</script>

<div class="active-puzzle-container">
	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading puzzle...</p>
		</div>
	{:else if currentPuzzle && puzzleState}
		<div class="puzzle-active">
			<!-- Puzzle Header -->
			<div class="puzzle-header">
				<div class="puzzle-info">
					<RoleBadge role={currentRole} size="small" showLabel={false} animated={false} />
					<div class="puzzle-text-info">
						<h2 class="puzzle-title">{currentPuzzle.name}</h2>
						<p class="puzzle-description">{currentPuzzle.description}</p>
					</div>
				</div>
				<div class="puzzle-actions">
					<button class="action-btn hints" on:click={() => dispatch('requestHint')} aria-label="Request Hint">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
							<line x1="12" y1="17" x2="12.01" y2="17"/>
						</svg>
						<span>Hint</span>
					</button>
					<button class="action-btn back" on:click={openPuzzleSelection} aria-label="Back to Puzzle Selection">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="19" y1="12" x2="5" y2="12"/>
							<polyline points="12 19 5 12 12 5"/>
						</svg>
						<span>Back</span>
					</button>
				</div>
			</div>

			<!-- Puzzle Canvas -->
			<div class="puzzle-canvas">
				<GameCanvas
					bind:currentRoom={roomForCanvas}
					bind:currentPuzzleState={puzzleState}
					bind:currentPuzzleId={puzzleId}
					on:ready={handleGameCanvasReady}
					on:interact={handleCanvasInteract}
					on:puzzle:pieceClick={handlePuzzlePieceClick}
					on:puzzle:pieceHover={handlePuzzlePieceHover}
				/>
			</div>

			<!-- Victory Animation Overlay -->
			{#if showVictoryAnimation}
				<div class="victory-overlay">
					<div class="victory-content">
						<div class="victory-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
								<polyline points="22 4 12 14.01 9 11.01"/>
							</svg>
						</div>
						<h2>Puzzle Solved!</h2>
						<p>Great teamwork!</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- No Puzzle Active - Show Room View -->
		<div class="room-view">
			<GameCanvas
				bind:currentRoom={roomForCanvas}
				on:ready={handleGameCanvasReady}
				on:interact={handleCanvasInteract}
			/>

			<!-- Prompt to select puzzle -->
			<div class="room-prompt">
				<p>Click on objects in the room to find puzzles</p>
				<button class="select-puzzle-btn" on:click={openPuzzleSelection}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<polyline points="21 15 16 10 5 21"/>
					</svg>
					<span>Select Puzzle</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Puzzle Selection Modal -->
<PuzzleSelection
	bind:isOpen={showPuzzleSelection}
	on:select={handlePuzzleSelect}
	on:close={handleCloseSelection}
/>

<style>
	.active-puzzle-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: #c9a9a6;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(212, 175, 55, 0.2);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.puzzle-active {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.puzzle-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
		border-bottom: 1px solid rgba(212, 175, 55, 0.15);
		flex-shrink: 0;
	}

	.puzzle-info {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.puzzle-text-info {
		flex: 1;
		min-width: 0;
	}

	.puzzle-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0 0 0.25rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.puzzle-description {
		font-size: 0.85rem;
		color: #c9a9a6;
		margin: 0;
		line-height: 1.4;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.puzzle-actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #c9a9a6;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.25);
		color: #d4af37;
		transform: translateY(-1px);
	}

	.action-btn svg {
		width: 16px;
		height: 16px;
	}

	.puzzle-canvas {
		flex: 1;
		min-height: 0;
		position: relative;
	}

	.room-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	.room-prompt {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: rgba(26, 26, 46, 0.95);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		z-index: 10;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.room-prompt p {
		font-size: 0.9rem;
		color: #c9a9a6;
		margin: 0;
		text-align: center;
	}

	.select-puzzle-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #d4af37 0%, #8b7355 100%);
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
	}

	.select-puzzle-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
	}

	.select-puzzle-btn svg {
		width: 18px;
		height: 18px;
	}

	.victory-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		z-index: 100;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.victory-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background: linear-gradient(180deg, #1a1a2e 0%, #16162e 100%);
		border: 2px solid rgba(212, 175, 55, 0.4);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.victory-icon {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(74, 222, 128, 0.1);
		border: 2px solid rgba(74, 222, 128, 0.3);
		border-radius: 50%;
		color: #4ade80;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	.victory-icon svg {
		width: 32px;
		height: 32px;
	}

	.victory-content h2 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #4ade80;
		margin: 0;
	}

	.victory-content p {
		font-size: 1rem;
		color: #c9a9a6;
		margin: 0;
	}

	@media (max-width: 640px) {
		.puzzle-header {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.puzzle-info {
			flex-direction: row;
			gap: 0.75rem;
			width: 100%;
		}

		.puzzle-actions {
			width: 100%;
			justify-content: space-between;
		}

		.action-btn {
			flex: 1;
			justify-content: center;
		}

		.room-prompt {
			width: 90%;
			padding: 1rem 1.5rem;
		}
	}
</style>

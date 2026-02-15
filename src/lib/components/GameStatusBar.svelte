<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { gameState, currentRoom, gameElapsedTime } from '$lib/stores/gameState';
	import { rooms, getPuzzlesByRoom } from '$lib/puzzles';
	import { getGameFlowCoordinator } from '$lib/gameFlowCoordinator';
	import { currentPlayerRole } from '$lib/stores/roles';
	import RoleBadge from './RoleBadge.svelte';
	import GameProgress from './GameProgress';

	export let showPuzzleSelection = false;

	const dispatch = createEventDispatcher();
	const gameFlowCoordinator = getGameFlowCoordinator();

	$: currentRoomInfo = rooms.find(r => r.id === $currentRoom);
	$: roomProgress = gameFlowCoordinator.getCurrentRoomProgress();
	$: availablePuzzles = roomProgress?.puzzles.filter(p => !puzzle.solved) || [];
	$: canSelectPuzzle = availablePuzzles.length > 0;

	function openPuzzleSelection() {
		showPuzzleSelection = true;
		dispatch('openPuzzleSelection');
	}

	function selectPuzzle(puzzleId: string) {
		dispatch('selectPuzzle', { puzzleId });
		showPuzzleSelection = false;
	}
</script>

<div class="game-status-bar">
	<div class="room-info">
		<div class="room-header">
			<h3>{currentRoomInfo?.name || 'Loading...'}</h3>
			<span class="room-progress">{roomProgress?.solved || 0}/{roomProgress?.total || 0} Puzzles</span>
		</div>
		<p class="room-description">{currentRoomInfo?.description || ''}</p>
	</div>

	<div class="player-info">
		<RoleBadge role={$currentPlayerRole} size="small" />
	</div>

	{#if canSelectPuzzle}
		<button class="select-puzzle-btn" on:click={openPuzzleSelection}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
				<circle cx="8.5" cy="8.5" r="1.5"/>
				<polyline points="21 15 16 10 5 21"/>
			</svg>
			<span>Select Puzzle</span>
		</button>
	{/if}

	<div class="timer-info">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="timer-icon">
			<circle cx="12" cy="12" r="10"/>
			<polyline points="12 6 12 12 16 14"/>
		</svg>
		<span class="timer-value">{Math.floor((($gameElapsedTime || 0) / 1000) / 60)}:{Math.floor((($gameElapsedTime || 0) / 1000) % 60).toString().padStart(2, '0')}</span>
	</div>
</div>

{#if showPuzzleSelection && availablePuzzles.length > 0}
	<div class="puzzle-selection-overlay" on:click={() => showPuzzleSelection = false}>
		<div class="puzzle-selection-modal" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Select a Puzzle</h2>
				<button class="close-btn" on:click={() => showPuzzleSelection = false}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
			<div class="puzzle-list">
				{#each availablePuzzles as puzzle}
					<button class="puzzle-option" on:click={() => selectPuzzle(puzzle.id)}>
						<div class="puzzle-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
								<circle cx="8.5" cy="8.5" r="1.5"/>
								<polyline points="21 15 16 10 5 21"/>
							</svg>
						</div>
						<div class="puzzle-details">
							<h4>{puzzle.name}</h4>
							<p>Ready to solve</p>
						</div>
						<div class="puzzle-arrow">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 18 15 12 9 6"/>
							</svg>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.game-status-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(26, 26, 46, 0.95);
		border-bottom: 1px solid rgba(212, 175, 55, 0.15);
	}

	.room-info {
		flex: 1;
		min-width: 0;
	}

	.room-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.room-header h3 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.room-progress {
		font-size: 0.8rem;
		font-weight: 600;
		color: #4ade80;
		padding: 0.2rem 0.5rem;
		background: rgba(74, 222, 128, 0.1);
		border-radius: 4px;
		white-space: nowrap;
	}

	.room-description {
		font-size: 0.85rem;
		color: #c9a9a6;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player-info {
		flex-shrink: 0;
	}

	.select-puzzle-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #d4af37 0%, #8b7355 100%);
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.select-puzzle-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
	}

	.select-puzzle-btn svg {
		width: 16px;
		height: 16px;
	}

	.timer-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 8px;
	}

	.timer-icon {
		width: 16px;
		height: 16px;
		color: #d4af37;
	}

	.timer-value {
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
		font-size: 0.9rem;
		font-weight: 700;
		color: #ffffff;
	}

	.puzzle-selection-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.puzzle-selection-modal {
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		background: linear-gradient(180deg, #1a1a2e 0%, #16162e 100%);
		border: 2px solid rgba(212, 175, 55, 0.3);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(212, 175, 55, 0.15);
	}

	.modal-header h2 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: 1px solid rgba(201, 169, 166, 0.3);
		border-radius: 8px;
		color: #c9a9a6;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.4);
		color: #ef4444;
	}

	.close-btn svg {
		width: 18px;
		height: 18px;
	}

	.puzzle-list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: 1rem;
	}

	.puzzle-option {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		color: #c9a9a6;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 0.5rem;
	}

	.puzzle-option:hover {
		background: rgba(212, 175, 55, 0.08);
		border-color: rgba(212, 175, 55, 0.25);
		transform: translateY(-2px);
	}

	.puzzle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 8px;
		color: #d4af37;
	}

	.puzzle-icon svg {
		width: 20px;
		height: 20px;
	}

	.puzzle-details {
		flex: 1;
		text-align: left;
	}

	.puzzle-details h4 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.25rem 0;
	}

	.puzzle-details p {
		font-size: 0.85rem;
		color: #c9a9a6;
		margin: 0;
	}

	.puzzle-arrow {
		color: #d4af37;
	}

	.puzzle-arrow svg {
		width: 20px;
		height: 20px;
	}
</style>

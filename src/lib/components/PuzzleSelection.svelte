<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PuzzleDefinition } from '$lib/types';
	import { PUZZLE_ORDER, rooms, getPuzzlesByRoom } from '$lib/puzzles';
	import { currentRoom, getGameManager, gameState } from '$lib/stores';
	import { currentPlayerRole, ROLE_COLORS, ROLE_ICONS } from '$lib/stores/roles';
	import RoleBadge from './RoleBadge.svelte';

	export let isOpen = false;
	export let puzzles: PuzzleDefinition[] = [];

	// Get puzzles for current room if none provided
	$: availablePuzzles = puzzles.length > 0 ? puzzles : getPuzzlesByRoom($currentRoom);

	const dispatch = createEventDispatcher();
	const gameManager = getGameManager();

	$: roomInfo = rooms.find(r => r.id === $currentRoom);
	$: availablePuzzles = availablePuzzles.filter(p => {
		// Check game state for solved puzzles
		const puzzleState = $gameState.puzzleStates[p.id];
		return !puzzleState?.solved;
	});

	// Role information
	$: currentRole = $currentPlayerRole;
	$: roleIcon = ROLE_ICONS[currentRole];
	$: roleColor = ROLE_COLORS[currentRole].primary;
	$: partnerRole = currentRole === 'explorer' ? 'analyst' : 'explorer';
	$: partnerIcon = ROLE_ICONS[partnerRole];

	function selectPuzzle(puzzle: PuzzleDefinition) {
		dispatch('select', { puzzleId: puzzle.id });
		isOpen = false;
	}

	function close() {
		isOpen = false;
		dispatch('close');
	}
</script>

{#if isOpen}
	<div class="puzzle-selection-overlay">
		<div class="puzzle-selection-modal">
			<div class="modal-header">
				<div class="room-info">
					<h2 class="room-title">{roomInfo?.name || 'Select a Puzzle'}</h2>
					<p class="room-description">{roomInfo?.description || ''}</p>
				</div>
				<button class="close-btn" on:click={close} aria-label="Close">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<!-- Role Coordination Banner -->
			<div class="role-coordination-banner" style="--role-color: {roleColor};">
				<div class="role-info-section">
					<div class="your-role">
						<span class="role-label">Your Role</span>
						<div class="role-display">
							<span class="role-icon">{roleIcon}</span>
							<span class="role-name">{currentRole === 'explorer' ? 'Explorer' : 'Analyst'}</span>
						</div>
					</div>
					<div class="role-divider">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 5v14M5 12h14"/>
						</svg>
					</div>
					<div class="partner-role">
						<span class="role-label">Partner's Role</span>
						<div class="role-display">
							<span class="role-icon">{partnerIcon}</span>
							<span class="role-name">{partnerRole === 'explorer' ? 'Explorer' : 'Analyst'}</span>
						</div>
					</div>
				</div>
				<div class="coordination-prompt">
					<span class="prompt-icon">💬</span>
					<span class="prompt-text">
						{currentRole === 'explorer'
							? 'Describe what you see to your Analyst partner'
							: 'Guide your Explorer partner with clues'}
					</span>
				</div>
			</div>

			<div class="puzzle-grid">
				{#each availablePuzzles as puzzle (puzzle.id)}
					<button
						class="puzzle-card"
						on:click={() => selectPuzzle(puzzle)}
						class:disabled={puzzle.requiredRoles?.length === 0}
					>
						<div class="puzzle-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
								<circle cx="8.5" cy="8.5" r="1.5"/>
								<polyline points="21 15 16 10 5 21"/>
							</svg>
						</div>
						<div class="puzzle-info">
							<h3 class="puzzle-name">{puzzle.name}</h3>
							<p class="puzzle-description">{puzzle.description}</p>
							{#if puzzle.requiredRoles && puzzle.requiredRoles.length > 0}
								<div class="role-requirements">
									{#each puzzle.requiredRoles as role}
										<span class="role-badge">{role}</span>
									{/each}
								</div>
							{/if}
						</div>
						<div class="puzzle-status">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 18 15 12 9 6"/>
							</svg>
						</div>
					</button>
				{/each}

				{#if availablePuzzles.length === 0}
					<div class="no-puzzles">
						<p>No puzzles available in this room.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.puzzle-selection-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.puzzle-selection-modal {
		width: 90%;
		max-width: 900px;
		max-height: 80vh;
		background: linear-gradient(180deg, #1a1a2e 0%, #16162e 100%);
		border: 2px solid rgba(212, 175, 55, 0.3);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1);
		display: flex;
		flex-direction: column;
		animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(212, 175, 55, 0.15);
		gap: 1rem;
	}

	.room-info {
		flex: 1;
	}

	.room-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0 0 0.5rem 0;
		letter-spacing: 0.02em;
	}

	.room-description {
		font-size: 0.9rem;
		color: #c9a9a6;
		margin: 0;
		line-height: 1.5;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: transparent;
		border: 1px solid rgba(201, 169, 166, 0.3);
		border-radius: 8px;
		color: #c9a9a6;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.4);
		color: #ef4444;
		transform: rotate(90deg);
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
	}

	/* Role Coordination Banner */
	.role-coordination-banner {
		padding: 1.5rem 2rem;
		background: linear-gradient(135deg, var(--role-color) 0%, rgba(26, 26, 46, 0.8) 100%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.role-info-section {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}

	.your-role, .partner-role {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.role-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.role-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.role-icon {
		font-size: 1.25rem;
	}

	.role-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #ffffff;
	}

	.role-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: rgba(255, 255, 255, 0.4);
	}

	.role-divider svg {
		width: 20px;
		height: 20px;
	}

	.coordination-prompt {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.prompt-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-3px); }
	}

	.prompt-text {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
		flex: 1;
	}

	.puzzle-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
		padding: 2rem;
		overflow-y: auto;
	}

	.puzzle-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		color: #c9a9a6;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		text-align: left;
		position: relative;
		overflow: hidden;
	}

	.puzzle-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.puzzle-card:hover::before {
		opacity: 1;
	}

	.puzzle-card:hover {
		background: rgba(212, 175, 55, 0.08);
		border-color: rgba(212, 175, 55, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.puzzle-card:active {
		transform: translateY(0);
	}

	.puzzle-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.puzzle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 10px;
		color: #d4af37;
		flex-shrink: 0;
	}

	.puzzle-icon svg {
		width: 24px;
		height: 24px;
	}

	.puzzle-info {
		flex: 1;
		min-width: 0;
	}

	.puzzle-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.25rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.puzzle-description {
		font-size: 0.8rem;
		color: #c9a9a6;
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.role-requirements {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.role-badge {
		font-size: 0.65rem;
		font-weight: 600;
		color: #d4af37;
		padding: 0.2rem 0.5rem;
		background: rgba(212, 175, 55, 0.15);
		border-radius: 4px;
		text-transform: capitalize;
	}

	.puzzle-status {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		color: #c9a9a6;
	}

	.puzzle-status svg {
		width: 20px;
		height: 20px;
	}

	.no-puzzles {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem;
		color: #c9a9a6;
	}

	.no-puzzles p {
		font-size: 1rem;
		margin: 0;
	}

	@media (max-width: 640px) {
		.puzzle-selection-modal {
			width: 95%;
			max-height: 90vh;
		}

		.modal-header {
			padding: 1rem 1.5rem;
		}

		.room-title {
			font-size: 1.25rem;
		}

		.puzzle-grid {
			grid-template-columns: 1fr;
			padding: 1rem;
			gap: 0.75rem;
		}

		.puzzle-card {
			padding: 1rem;
		}
	}
</style>

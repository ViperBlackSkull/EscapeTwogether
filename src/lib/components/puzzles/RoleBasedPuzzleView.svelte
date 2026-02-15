<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ROLE_COLORS, ROLE_ICONS } from '$lib/stores/roles';
	import type { PlayerRole } from '$lib/types';

	export let playerRole: PlayerRole;
	export let puzzleTitle: string;
	export let puzzleDescription: string;
	export let children: import('svelte').Snippet;
	export let analystInfo: import('svelte').Snippet | undefined = undefined;

	const dispatch = createEventDispatcher();

	$: isExplorer = playerRole === 'explorer';
	$: isAnalyst = playerRole === 'analyst';
	$: roleColors = ROLE_COLORS[playerRole];
	$: roleIcon = ROLE_ICONS[playerRole];
	$: roleTitle = isExplorer ? 'Explorer' : 'Analyst';

	function requestHint() {
		dispatch('hint');
	}

	function communicate() {
		dispatch('communicate');
	}
</script>

<div class="role-based-puzzle-view" class:explorer={isExplorer} class:analyst={isAnalyst}>
	<!-- Role Header -->
	<div class="role-header" style="--role-primary: {roleColors.primary}; --role-bg: {roleColors.bg};">
		<div class="role-indicator">
			<span class="role-icon">{roleIcon}</span>
			<div class="role-text">
				<span class="role-title">{roleTitle}</span>
				<span class="role-action">
					{isExplorer ? 'You can interact with puzzle elements' : 'You have reference information'}
				</span>
			</div>
		</div>

		<div class="role-actions">
			{#if isAnalyst}
				<button class="role-action-btn hint" on:click={requestHint} aria-label="Request hint">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
					<span>Hint</span>
				</button>
			{/if}
			<button class="role-action-btn communicate" on:click={communicate} aria-label="Send message">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
				</svg>
				<span>Chat</span>
			</button>
		</div>
	</div>

	<!-- Puzzle Content -->
	<div class="puzzle-content-wrapper">
		<div class="puzzle-header">
			<h2 class="puzzle-title">{puzzleTitle}</h2>
			<p class="puzzle-description">{puzzleDescription}</p>
		</div>

		<!-- Main puzzle area -->
		<div class="puzzle-main">
			{@render children()}
		</div>

		<!-- Role-specific side panel -->
		{#if analystInfo && isAnalyst}
			<div class="analyst-panel">
				<div class="analyst-panel-header">
					<span class="panel-icon">🔍</span>
					<h3>Reference Information</h3>
				</div>
				<div class="analyst-panel-content">
					{@render analystInfo()}
				</div>
			</div>
		{/if}
	</div>

	<!-- Communication prompt -->
	<div class="communication-prompt">
		<span class="prompt-icon">💬</span>
		<span class="prompt-text">
			{isExplorer
				? 'Describe what you see to your Analyst partner'
				: 'Guide your Explorer partner with the information you have'}
		</span>
	</div>
</div>

<style>
	.role-based-puzzle-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%);
		border-radius: 12px;
		overflow: hidden;
	}

	/* Role Header */
	.role-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: var(--role-bg, rgba(59, 130, 246, 0.15));
		border-bottom: 2px solid var(--role-primary, #3B82F6);
		gap: 1rem;
	}

	.role-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.role-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.role-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.role-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--role-primary, #3B82F6);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.role-action {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Role Actions */
	.role-actions {
		display: flex;
		gap: 0.5rem;
	}

	.role-action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.role-action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--role-primary, #3B82F6);
		color: var(--role-primary, #3B82F6);
	}

	.role-action-btn svg {
		width: 14px;
		height: 14px;
	}

	.role-action-btn.hint:hover {
		background: rgba(250, 173, 20, 0.1);
		border-color: #faad14;
		color: #faad14;
	}

	/* Puzzle Content */
	.puzzle-content-wrapper {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.puzzle-header {
		flex: 1;
		padding: 1rem 1.25rem;
		border-right: 1px solid rgba(255, 255, 255, 0.06);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}

	.puzzle-title {
		font-size: 1rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0;
	}

	.puzzle-description {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.4;
		margin: 0;
	}

	.puzzle-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
	}

	/* Analyst Panel */
	.analyst-panel {
		width: 280px;
		border-left: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.analyst-panel-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(249, 115, 22, 0.1);
		border-bottom: 1px solid rgba(249, 115, 22, 0.2);
	}

	.panel-icon {
		font-size: 1rem;
	}

	.analyst-panel-header h3 {
		font-size: 0.75rem;
		font-weight: 600;
		color: #F97316;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.analyst-panel-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	/* Communication Prompt */
	.communication-prompt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(90deg, rgba(74, 155, 140, 0.1) 0%, rgba(74, 155, 140, 0.05) 100%);
		border-top: 1px solid rgba(74, 155, 140, 0.2);
	}

	.prompt-icon {
		font-size: 1rem;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-2px); }
	}

	.prompt-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		flex: 1;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.puzzle-content-wrapper {
			flex-direction: column;
		}

		.puzzle-header {
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		}

		.analyst-panel {
			width: 100%;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			max-height: 200px;
		}

		.role-actions span {
			display: none;
		}

		.role-action-btn {
			padding: 0.5rem;
		}
	}
</style>

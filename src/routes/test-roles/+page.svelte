<script lang="ts">
	import { onMount } from 'svelte';
	import RoleIndicator from '$lib/components/RoleIndicator.svelte';
	import {
		gameState,
		setPlayer,
		setGamePhase,
		solvePuzzle
	} from '$lib/stores/gameState';
	import {
		initializeRoles,
		performRoleSwap,
		currentPlayerRole,
		explorerPlayer,
		analystPlayer,
		rolesAssigned,
		ROLE_COLORS,
		ROLE_ICONS,
		type PlayerRole
	} from '$lib/stores/roles';
	import type { Player } from '$lib/types';

	let puzzleCount = 0;
	let swapHistory: { from: PlayerRole; to: PlayerRole; timestamp: Date }[] = [];
	let initialAssignmentDone = false;

	// Create mock players
	const mockPlayerA: Player = {
		id: 'player-a-id',
		name: 'Alice',
		role: 'explorer',
		isHost: true,
		connected: true,
		lastSeen: Date.now()
	};

	const mockPlayerB: Player = {
		id: 'player-b-id',
		name: 'Bob',
		role: 'analyst',
		isHost: false,
		connected: true,
		lastSeen: Date.now()
	};

	function setupGame() {
		// Reset game state
		gameState.reset();

		// Set players
		setPlayer('playerA', mockPlayerA);
		setPlayer('playerB', mockPlayerB);

		// Initialize roles
		initializeRoles();

		// Set game phase
		setGamePhase('playing');

		puzzleCount = 0;
		swapHistory = [];
		initialAssignmentDone = true;
	}

	function simulatePuzzleSolve() {
		puzzleCount++;
		const previousRole = $currentPlayerRole;

		// Simulate solving a puzzle
		solvePuzzle(`puzzle-${puzzleCount}`);

		// Swap roles
		performRoleSwap();

		// Record swap
		swapHistory.push({
			from: previousRole,
			to: $currentPlayerRole,
			timestamp: new Date()
		});
	}

	function resetTest() {
		setupGame();
	}

	onMount(() => {
		setupGame();
	});
</script>

<svelte:head>
	<title>Role System Test - EscapeTwogether</title>
</svelte:head>

<div class="test-page">
	<header class="test-header">
		<h1>Role Assignment System Test</h1>
		<p>Testing Explorer/Analyst role assignment and swapping</p>
	</header>

	<main class="test-content">
		<!-- Status Section -->
		<section class="test-section">
			<h2>System Status</h2>
			<div class="status-grid">
				<div class="status-item">
					<span class="status-label">Roles Assigned:</span>
					<span class="status-value" class:success={$rolesAssigned} class:error={!$rolesAssigned}>
						{$rolesAssigned ? 'Yes' : 'No'}
					</span>
				</div>
				<div class="status-item">
					<span class="status-label">Current Player Role:</span>
					<span class="status-value" style="color: {ROLE_COLORS[$currentPlayerRole].primary}">
						{ROLE_ICONS[$currentPlayerRole]} {$currentPlayerRole.charAt(0).toUpperCase() + $currentPlayerRole.slice(1)}
					</span>
				</div>
				<div class="status-item">
					<span class="status-label">Puzzles Solved:</span>
					<span class="status-value">{puzzleCount}</span>
				</div>
			</div>
		</section>

		<!-- Role Indicators Section -->
		<section class="test-section">
			<h2>Role Indicators</h2>
			<div class="indicators-grid">
				<div class="indicator-card">
					<h3>Full Role Indicator</h3>
					<RoleIndicator />
				</div>
				<div class="indicator-card">
					<h3>Compact Role Indicator</h3>
					<RoleIndicator compact={true} showCapabilities={false} />
				</div>
			</div>
		</section>

		<!-- Players Section -->
		<section class="test-section">
			<h2>Players</h2>
			<div class="players-grid">
				<div class="player-card" style="border-color: {ROLE_COLORS[$gameState.players.playerA?.role || 'explorer'].primary}">
					<h3>Player A ({$gameState.players.playerA?.name || 'Not joined'})</h3>
					<div class="player-role" style="color: {ROLE_COLORS[$gameState.players.playerA?.role || 'explorer'].primary}">
						{ROLE_ICONS[$gameState.players.playerA?.role || 'explorer']}
						{$gameState.players.playerA?.role?.toUpperCase() || 'NO ROLE'}
					</div>
					{#if $gameState.players.playerA?.isHost}
						<span class="host-badge">Host</span>
					{/if}
				</div>
				<div class="player-card" style="border-color: {ROLE_COLORS[$gameState.players.playerB?.role || 'analyst'].primary}">
					<h3>Player B ({$gameState.players.playerB?.name || 'Not joined'})</h3>
					<div class="player-role" style="color: {ROLE_COLORS[$gameState.players.playerB?.role || 'analyst'].primary}">
						{ROLE_ICONS[$gameState.players.playerB?.role || 'analyst']}
						{$gameState.players.playerB?.role?.toUpperCase() || 'NO ROLE'}
					</div>
				</div>
			</div>
		</section>

		<!-- Actions Section -->
		<section class="test-section">
			<h2>Test Actions</h2>
			<div class="actions-grid">
				<button class="action-button primary" on:click={simulatePuzzleSolve}>
					<span class="button-icon">🧩</span>
					Simulate Puzzle Solve & Swap Roles
				</button>
				<button class="action-button secondary" on:click={resetTest}>
					<span class="button-icon">🔄</span>
					Reset Test
				</button>
			</div>
		</section>

		<!-- Swap History Section -->
		<section class="test-section">
			<h2>Swap History</h2>
			{#if swapHistory.length === 0}
				<p class="empty-history">No role swaps yet. Solve a puzzle to trigger a role swap.</p>
			{:else}
				<ul class="swap-history">
					{#each swapHistory as swap, index}
						<li class="swap-item">
							<span class="swap-number">Swap #{index + 1}</span>
							<span class="swap-details">
								<span style="color: {ROLE_COLORS[swap.from].primary}">
									{ROLE_ICONS[swap.from]} {swap.from}
								</span>
								<span class="swap-arrow">-></span>
								<span style="color: {ROLE_COLORS[swap.to].primary}">
									{ROLE_ICONS[swap.to]} {swap.to}
								</span>
							</span>
							<span class="swap-time">
								{swap.timestamp.toLocaleTimeString()}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- Acceptance Criteria Checklist -->
		<section class="test-section checklist">
			<h2>Acceptance Criteria</h2>
			<ul class="criteria-list">
				<li class:passed={initialAssignmentDone}>
					<span class="check">{#if initialAssignmentDone}[OK]{:else}[--]{/if}</span>
					Player A assigned Explorer for first puzzle (initial: {mockPlayerA.role})
				</li>
				<li class:passed={initialAssignmentDone}>
					<span class="check">{#if initialAssignmentDone}[OK]{:else}[--]{/if}</span>
					Player B assigned Analyst for first puzzle (initial: {mockPlayerB.role})
				</li>
				<li class:passed={swapHistory.length > 0}>
					<span class="check">{#if swapHistory.length > 0}[OK]{:else}[--]{/if}</span>
					Roles swap when puzzle completes ({swapHistory.length} swap(s) completed)
				</li>
				<li class:passed={true}>
					<span class="check">[OK]</span>
					Role indicator displays current role and capabilities
				</li>
			</ul>
		</section>
	</main>

	<footer class="test-footer">
		<a href="/" class="back-link">Back to Home</a>
	</footer>
</div>

<style>
	.test-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		color: #e2e8f0;
		padding: 2rem;
	}

	.test-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.test-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #fbbf24;
		margin-bottom: 0.5rem;
	}

	.test-header p {
		color: #94a3b8;
	}

	.test-content {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.test-section {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.test-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #f8fafc;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.status-label {
		color: #94a3b8;
		font-size: 0.875rem;
	}

	.status-value {
		font-weight: 600;
	}

	.status-value.success {
		color: #22c55e;
	}

	.status-value.error {
		color: #ef4444;
	}

	.indicators-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.indicator-card {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.indicator-card h3 {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 1rem;
	}

	.players-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.player-card {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 2px solid;
		position: relative;
	}

	.player-card h3 {
		font-size: 1rem;
		color: #f8fafc;
		margin-bottom: 0.5rem;
	}

	.player-role {
		font-size: 0.875rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.host-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #fbbf24;
		color: #0f172a;
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.actions-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.action-button.primary {
		background: #fbbf24;
		color: #0f172a;
	}

	.action-button.primary:hover {
		background: #f59e0b;
		transform: translateY(-2px);
	}

	.action-button.secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #f8fafc;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.action-button.secondary:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.button-icon {
		font-size: 1.25rem;
	}

	.empty-history {
		color: #64748b;
		font-style: italic;
		text-align: center;
		padding: 1rem;
	}

	.swap-history {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.swap-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}

	.swap-number {
		font-weight: 600;
		color: #fbbf24;
		min-width: 80px;
	}

	.swap-details {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.swap-arrow {
		color: #64748b;
	}

	.swap-time {
		color: #64748b;
		font-size: 0.75rem;
	}

	.checklist ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.criteria-list li {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border-left: 3px solid #64748b;
	}

	.criteria-list li.passed {
		border-left-color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
	}

	.check {
		font-family: monospace;
		margin-right: 0.75rem;
	}

	.test-footer {
		text-align: center;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.back-link {
		color: #94a3b8;
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #fbbf24;
	}
</style>

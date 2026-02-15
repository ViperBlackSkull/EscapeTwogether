<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import {
		currentPlayerRole,
		roleNotification,
		ROLE_COLORS,
		ROLE_CAPABILITIES,
		ROLE_ICONS,
		type PlayerRole
	} from '$lib/stores/roles';
	import { gameState } from '$lib/stores/gameState';

	// Props
	export let playerId: string | null = null;
	export let compact: boolean = false;
	export let showCapabilities: boolean = true;

	// Get the role for this player
	$: role = $currentPlayerRole;
	$: colors = ROLE_COLORS[role];
	$: icon = ROLE_ICONS[role];
	$: capabilities = ROLE_CAPABILITIES[role];
	$: notification = $roleNotification;

	// Get player info from game state
	$: playerA = $gameState.players.playerA;
	$: playerB = $gameState.players.playerB;

	// Determine if this is the current player's indicator
	$: currentRole = playerId === playerA?.id ? playerA?.role :
					 playerId === playerB?.id ? playerB?.role :
					 $currentPlayerRole;
</script>

<div class="role-indicator-container" role="status" aria-live="polite">
	<!-- Role Indicator Badge -->
	<div
		class="role-badge {compact ? 'compact' : ''}"
		style="--role-primary: {colors.primary}; --role-secondary: {colors.secondary}; --role-bg: {colors.bg};"
	>
		<div class="role-icon" aria-hidden="true">
			{icon}
		</div>
		{#if !compact}
			<div class="role-info">
				<span class="role-label">Your Role</span>
				<span class="role-name">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
			</div>
		{/if}
	</div>

	<!-- Capabilities List (non-compact mode) -->
	{#if showCapabilities && !compact}
		<ul class="capabilities-list" aria-label="Role capabilities">
			{#each capabilities as capability}
				<li class="capability-item">
					<span class="capability-bullet" style="background-color: {colors.primary}" aria-hidden="true"></span>
					<span>{capability}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Role Swap Notification -->
	{#if notification.show}
		<div
			class="role-swap-notification"
			transition:fly={{ y: -20, duration: 400, easing: backOut }}
			role="alert"
			aria-live="assertive"
		>
			<div class="notification-content">
				<span class="swap-icon" aria-hidden="true">🔄</span>
				<div class="swap-text">
					<span class="swap-title">Roles Swapped!</span>
					<span class="swap-detail">
						{#if notification.previousRole}
							<span class="previous-role">
								{notification.previousRole === 'explorer' ? '🧭 Explorer' : '🔍 Analyst'}
							</span>
							<span class="swap-arrow">→</span>
						{/if}
						<span class="new-role">
							<strong>{notification.newRole === 'explorer' ? '🧭 Explorer' : '🔍 Analyst'}</strong>
						</span>
					</span>
				</div>
			</div>
			<button
				class="notification-dismiss"
				on:click={() => roleNotification.hide()}
				aria-label="Dismiss notification"
			>
				×
			</button>
			<div class="notification-progress" style="animation-duration: 3s;"></div>
		</div>
	{/if}
</div>

<style>
	.role-indicator-container {
		position: relative;
	}

	.role-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--role-bg, rgba(59, 130, 246, 0.15));
		border: 2px solid var(--role-primary, #3B82F6);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.role-badge:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.role-badge.compact {
		padding: 0.5rem 0.75rem;
		gap: 0.5rem;
	}

	.role-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.role-badge.compact .role-icon {
		font-size: 1.25rem;
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.role-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.6);
	}

	.role-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--role-primary, #3B82F6);
	}

	.capabilities-list {
		margin-top: 0.75rem;
		padding-left: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.capability-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.capability-bullet {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 0.375rem;
	}

	/* Role Swap Notification */
	.role-swap-notification {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border: 2px solid #fbbf24;
		border-radius: 12px;
		padding: 1rem 1.5rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		z-index: 1000;
		overflow: hidden;
		min-width: 300px;
	}

	.notification-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.swap-icon {
		font-size: 2rem;
		animation: spin 1s ease-in-out;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.swap-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.swap-title {
		font-size: 1rem;
		font-weight: 700;
		color: #fbbf24;
	}

	.swap-detail {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.swap-detail strong {
		color: #fbbf24;
	}

	.previous-role, .new-role {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.previous-role {
		color: rgba(255, 255, 255, 0.6);
	}

	.swap-arrow {
		margin: 0 0.5rem;
		color: #fbbf24;
		font-weight: bold;
	}

	.new-role {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.notification-dismiss {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		transition: color 0.2s;
	}

	.notification-dismiss:hover {
		color: white;
	}

	.notification-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: #fbbf24;
		animation: shrink linear forwards;
	}

	@keyframes shrink {
		from { width: 100%; }
		to { width: 0%; }
	}
</style>

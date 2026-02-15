<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { ROLE_COLORS, ROLE_ICONS, currentPlayerRole } from '$lib/stores/roles';
	import type { PlayerRole } from '$lib/types';

	export let role: PlayerRole;
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let showLabel: boolean = true;
	export let animated: boolean = true;

	$: colors = ROLE_COLORS[role];
	$: icon = ROLE_ICONS[role];
	$: displayName = role === 'explorer' ? 'Explorer' : 'Analyst';
	$: description = role === 'explorer'
		? 'Can interact with puzzle elements'
		: 'Has reference information & clues';
</script>

<div
	class="role-badge-wrapper size-{size}"
	style="--role-primary: {colors.primary}; --role-secondary: {colors.secondary}; --role-bg: {colors.bg};"
	role="img"
	aria-label="{displayName} Role"
>
	<div class="role-badge" class:animated>
		<div class="role-icon-container">
			<span class="role-icon">{icon}</span>
			{#if animated}
				<div class="role-pulse"></div>
			{/if}
		</div>

		{#if showLabel}
			<div class="role-text">
				<span class="role-name">{displayName}</span>
				<span class="role-desc">{description}</span>
			</div>
		{/if}

		<div class="role-accent"></div>
	</div>
</div>

<style>
	.role-badge-wrapper {
		display: inline-block;
		position: relative;
	}

	.role-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: var(--role-bg);
		border: 2px solid var(--role-primary);
		border-radius: 12px;
		position: relative;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.role-badge::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, var(--role-primary) 0%, var(--role-secondary) 100%);
		opacity: 0.1;
		transition: opacity 0.3s ease;
	}

	.role-badge:hover::before {
		opacity: 0.2;
	}

	/* Size variants */
	.size-small .role-badge {
		padding: 0.5rem 0.75rem;
		gap: 0.5rem;
		border-radius: 8px;
	}

	.size-small .role-icon {
		font-size: 1.25rem;
	}

	.size-small .role-name {
		font-size: 0.875rem;
	}

	.size-small .role-desc {
		display: none;
	}

	.size-medium .role-badge {
		padding: 0.75rem 1.25rem;
		gap: 0.75rem;
		border-radius: 12px;
	}

	.size-medium .role-icon {
		font-size: 1.5rem;
	}

	.size-medium .role-name {
		font-size: 1rem;
	}

	.size-medium .role-desc {
		font-size: 0.75rem;
	}

	.size-large .role-badge {
		padding: 1rem 1.5rem;
		gap: 1rem;
		border-radius: 16px;
	}

	.size-large .role-icon {
		font-size: 2rem;
	}

	.size-large .role-name {
		font-size: 1.125rem;
	}

	.size-large .role-desc {
		font-size: 0.875rem;
	}

	/* Icon */
	.role-icon-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.role-icon {
		font-size: 1.5rem;
		line-height: 1;
		position: relative;
		z-index: 2;
	}

	/* Pulse animation */
	.role-badge.animated .role-pulse {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: var(--role-primary);
		opacity: 0.3;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(0.9);
			opacity: 0.3;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.1;
		}
	}

	/* Text */
	.role-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		position: relative;
		z-index: 2;
	}

	.role-name {
		font-weight: 700;
		color: var(--role-primary);
		letter-spacing: 0.02em;
	}

	.role-desc {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Accent */
	.role-accent {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, var(--role-primary) 0%, var(--role-secondary) 100%);
		border-radius: 0 10px 0 10px;
		opacity: 0.8;
	}

	.size-small .role-accent {
		width: 12px;
		height: 12px;
		border-radius: 0 8px 0 8px;
	}

	.size-large .role-accent {
		width: 24px;
		height: 24px;
		border-radius: 0 16px 0 16px;
	}
</style>

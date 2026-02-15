<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { ROLE_COLORS, ROLE_CAPABILITIES, currentPlayerRole } from '$lib/stores/roles';
	import type { PlayerRole } from '$lib/types';

	export let show: boolean = true;
	export let autoHide: boolean = true;
	export let delay: number = 5000; // Auto-hide after 5 seconds

	let visible = show;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	$: if (show && autoHide) {
		visible = true;
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			visible = false;
		}, delay);
	} else if (!show) {
		visible = false;
		if (timeout) clearTimeout(timeout);
	}

	$: role = $currentPlayerRole;
	$: colors = ROLE_COLORS[role];
	$: capabilities = ROLE_CAPABILITIES[role];
	$: partnerRole = role === 'explorer' ? 'analyst' : 'explorer';
	$: partnerCapabilities = ROLE_CAPABILITIES[partnerRole];

	function dismiss() {
		visible = false;
		if (timeout) clearTimeout(timeout);
	}
</script>

{#if visible}
	<div
		class="role-prompt-overlay"
		transition:fade={{ duration: 300 }}
		on:click={dismiss}
	>
		<div
			class="role-prompt-container"
			style="--role-primary: {colors.primary}; --role-secondary: {colors.secondary}; --role-bg: {colors.bg};"
			transition:fly={{ y: 50, duration: 400, easing: quintOut }}
			on:click|stoppropagation
		>
			<div class="prompt-header">
				<div class="prompt-icon">💬</div>
				<h2 class="prompt-title">Work Together!</h2>
				<button class="prompt-dismiss" on:click={dismiss} aria-label="Dismiss">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="prompt-content">
				<div class="role-split">
					<div class="role-section your-role">
						<div class="role-label">Your Role: {role === 'explorer' ? 'Explorer' : 'Analyst'}</div>
						<ul class="capability-list">
							{#each capabilities as capability}
								<li class="capability-item">
									<span class="capability-icon">✓</span>
									<span>{capability}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="role-divider">
						<div class="divider-line"></div>
						<div class="divider-icon">🤝</div>
						<div class="divider-line"></div>
					</div>

					<div class="role-section partner-role">
						<div class="role-label">Partner's Role: {partnerRole === 'explorer' ? 'Explorer' : 'Analyst'}</div>
						<ul class="capability-list">
							{#each partnerCapabilities as capability}
								<li class="capability-item">
									<span class="capability-icon">⋯</span>
									<span>{capability}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div class="communication-tip">
					<div class="tip-icon">💡</div>
					<div class="tip-text">
						<strong>Tip:</strong> Communicate what you see! Share clues and coordinate your actions to solve puzzles together.
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.role-prompt-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.role-prompt-container {
		width: 100%;
		max-width: 600px;
		background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
		border: 2px solid rgba(212, 175, 55, 0.3);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Header */
	.prompt-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%);
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
	}

	.prompt-icon {
		font-size: 1.5rem;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}

	.prompt-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #d4af37;
		flex: 1;
	}

	.prompt-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.prompt-dismiss:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.prompt-dismiss svg {
		width: 18px;
		height: 18px;
	}

	/* Content */
	.prompt-content {
		padding: 1.5rem;
	}

	.role-split {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.role-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.role-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
		padding: 0.5rem;
		background: rgba(212, 175, 55, 0.1);
		border-radius: 8px;
	}

	.capability-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.capability-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
	}

	.capability-icon {
		color: #4ade80;
		font-weight: bold;
		flex-shrink: 0;
	}

	.partner-role .capability-icon {
		color: rgba(255, 255, 255, 0.4);
	}

	/* Divider */
	.role-divider {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.divider-line {
		width: 2px;
		height: 40px;
		background: linear-gradient(180deg, transparent 0%, rgba(212, 175, 55, 0.3) 50%, transparent 100%);
	}

	.divider-icon {
		font-size: 1.5rem;
		animation: handshake 2s ease-in-out infinite;
	}

	@keyframes handshake {
		0%, 100% { transform: rotate(-5deg); }
		50% { transform: rotate(5deg); }
	}

	/* Communication Tip */
	.communication-tip {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(90deg, rgba(74, 155, 140, 0.1) 0%, rgba(74, 155, 140, 0.05) 100%);
		border-left: 3px solid #4a9b8c;
		border-radius: 0 8px 8px 0;
	}

	.tip-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		animation: glow 2s ease-in-out infinite;
	}

	@keyframes glow {
		0%, 100% { filter: brightness(1); }
		50% { filter: brightness(1.2); }
	}

	.tip-text {
		flex: 1;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.4;
	}

	.tip-text strong {
		color: #4a9b8c;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.role-split {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.role-divider {
			flex-direction: row;
			padding: 0.5rem;
		}

		.divider-line {
			width: 40px;
			height: 2px;
			background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.3) 50%, transparent 100%);
		}

		.prompt-content {
			padding: 1rem;
		}
	}
</style>

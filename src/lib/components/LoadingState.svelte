<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	// Props
	export let message: string = 'Loading...';
	export let showProgress: boolean = false;
	export let progress: number = 0;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'spinner' | 'dots' | 'bar' | 'pulse' = 'spinner';
	export let fullScreen: boolean = false;

	// State
	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	// Size classes
	const sizeClasses = {
		sm: 'w-6 h-6',
		md: 'w-10 h-10',
		lg: 'w-16 h-16'
	};

	const dotSizeClasses = {
		sm: 'w-1.5 h-1.5',
		md: 'w-2.5 h-2.5',
		lg: 'w-4 h-4'
	};

	const pulseSizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-12 h-12',
		lg: 'w-20 h-20'
	};
</script>

{#if fullScreen}
	<div class="loading-overlay" in:fade={{ duration: 300 }}>
		<div class="loading-content" in:scale={{ delay: 100, duration: 400, easing: elasticOut }}>
			{#if variant === 'spinner'}
				<div class="spinner {sizeClasses[size]}">
					<div class="spinner-glow"></div>
				</div>
			{:else if variant === 'dots'}
				<div class="dots-container">
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 0ms;"></div>
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 150ms;"></div>
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 300ms;"></div>
				</div>
			{:else if variant === 'pulse'}
				<div class="pulse-loader {pulseSizeClasses[size]}">
					<div class="pulse-ring"></div>
					<div class="pulse-ring" style="animation-delay: 0.4s;"></div>
					<div class="pulse-ring" style="animation-delay: 0.8s;"></div>
				</div>
			{:else if variant === 'bar'}
				<div class="progress-bar-container {size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3'}">
					<div class="progress-bar" style="width: {progress}%"></div>
					{#if progress > 0}
						<div class="progress-glow" style="width: {progress}%"></div>
					{/if}
				</div>
			{/if}

			<p class="loading-message">{message}</p>

			{#if showProgress}
				<div class="progress-info">
					<p class="loading-progress">{Math.round(progress)}%</p>
					<div class="progress-dots">
						<span></span><span></span><span></span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="loading-inline" in:fade={{ duration: 200 }}>
		{#if variant === 'spinner'}
			<div class="spinner {sizeClasses[size]}"></div>
		{:else if variant === 'dots'}
			<div class="dots-container inline">
				<div class="dot {dotSizeClasses[size]}" style="animation-delay: 0ms;"></div>
				<div class="dot {dotSizeClasses[size]}" style="animation-delay: 150ms;"></div>
				<div class="dot {dotSizeClasses[size]}" style="animation-delay: 300ms;"></div>
			</div>
		{:else if variant === 'pulse'}
			<div class="pulse-loader inline {pulseSizeClasses.sm}">
				<div class="pulse-ring"></div>
			</div>
		{:else if variant === 'bar'}
			<div class="progress-bar-container {size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3'}">
				<div class="progress-bar" style="width: {progress}%"></div>
			</div>
		{/if}

		{#if message}
			<span class="loading-message inline">{message}</span>
		{/if}
	</div>
{/if}

<style>
	.loading-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 9999;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2.5rem;
		background: linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(22, 33, 62, 0.85));
		border: 1px solid rgba(212, 175, 55, 0.15);
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(212, 175, 55, 0.1);
	}

	.loading-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* Spinner with glow effect */
	.spinner {
		border: 3px solid rgba(212, 175, 55, 0.15);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		position: relative;
	}

	.spinner-glow {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: transparent;
		box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
		animation: glowPulse 1.5s ease-in-out infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes glowPulse {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.1); }
	}

	/* Dots with enhanced bounce */
	.dots-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.dots-container.inline {
		display: inline-flex;
	}

	.dot {
		background: linear-gradient(135deg, #d4af37, #b8962f);
		border-radius: 50%;
		animation: bounce 1.2s ease-in-out infinite;
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
	}

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0.6) translateY(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1) translateY(-4px);
			opacity: 1;
		}
	}

	/* Pulse loader */
	.pulse-loader {
		position: relative;
	}

	.pulse-loader.inline {
		width: 24px;
		height: 24px;
	}

	.pulse-ring {
		position: absolute;
		inset: 0;
		border: 2px solid #d4af37;
		border-radius: 50%;
		animation: pulseExpand 1.5s ease-out infinite;
	}

	@keyframes pulseExpand {
		0% {
			transform: scale(0.5);
			opacity: 1;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	/* Progress bar with shimmer */
	.progress-bar-container {
		width: 200px;
		background: rgba(212, 175, 55, 0.1);
		border-radius: 9999px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #b8962f, #d4af37, #e5c76b);
		border-radius: 9999px;
		transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
		position: relative;
		overflow: hidden;
	}

	.progress-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.3) 50%,
			transparent 100%
		);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.progress-glow {
		position: absolute;
		top: -4px;
		bottom: -4px;
		background: radial-gradient(ellipse at right, rgba(212, 175, 55, 0.4), transparent 70%);
		border-radius: inherit;
		pointer-events: none;
		transition: width 0.4s ease;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	/* Messages */
	.loading-message {
		color: #f5f5f5;
		font-size: 0.9rem;
		font-weight: 500;
		text-align: center;
		letter-spacing: 0.02em;
	}

	.loading-message.inline {
		font-size: 0.75rem;
		color: #a0a0b0;
	}

	.progress-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.loading-progress {
		color: #d4af37;
		font-size: 0.875rem;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
	}

	.progress-dots {
		display: flex;
		gap: 4px;
	}

	.progress-dots span {
		width: 4px;
		height: 4px;
		background: #d4af37;
		border-radius: 50%;
		animation: dotFade 1.2s ease-in-out infinite;
	}

	.progress-dots span:nth-child(1) { animation-delay: 0s; }
	.progress-dots span:nth-child(2) { animation-delay: 0.2s; }
	.progress-dots span:nth-child(3) { animation-delay: 0.4s; }

	@keyframes dotFade {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}

	/* Skeleton loading animation for content placeholders */
	:global(.skeleton) {
		background: linear-gradient(
			90deg,
			rgba(212, 175, 55, 0.08) 0%,
			rgba(212, 175, 55, 0.15) 50%,
			rgba(212, 175, 55, 0.08) 100%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s ease-in-out infinite;
		border-radius: 8px;
	}

	@keyframes skeleton-loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Responsive */
	@media (max-width: 640px) {
		.loading-content {
			padding: 1.5rem;
			margin: 1rem;
		}

		.progress-bar-container {
			width: 150px;
		}
	}
</style>

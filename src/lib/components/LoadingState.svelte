<script lang="ts">
	import { fade, pulse } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	// Props
	export let message: string = 'Loading...';
	export let showProgress: boolean = false;
	export let progress: number = 0;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'spinner' | 'dots' | 'bar' = 'spinner';
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
</script>

{#if fullScreen}
	<div class="loading-overlay" in:fade={{ duration: 300 }}>
		<div class="loading-content" in:fade={{ delay: 100, duration: 400, easing: quintOut }}>
			{#if variant === 'spinner'}
				<div class="spinner {sizeClasses[size]}"></div>
			{:else if variant === 'dots'}
				<div class="dots-container">
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 0ms;"></div>
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 150ms;"></div>
					<div class="dot {dotSizeClasses[size]}" style="animation-delay: 300ms;"></div>
				</div>
			{:else if variant === 'bar'}
				<div class="progress-bar-container {size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3'}">
					<div class="progress-bar" style="width: {progress}%"></div>
				</div>
			{/if}

			<p class="loading-message">{message}</p>

			{#if showProgress}
				<p class="loading-progress">{Math.round(progress)}%</p>
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
		backdrop-filter: blur(8px);
		z-index: 9999;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
	}

	.loading-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* Spinner */
	.spinner {
		border: 3px solid rgba(255, 183, 77, 0.2);
		border-top-color: #FFB74D;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Dots */
	.dots-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.dots-container.inline {
		display: inline-flex;
	}

	.dot {
		background-color: #FFB74D;
		border-radius: 50%;
		animation: bounce 1s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Progress bar */
	.progress-bar-container {
		width: 200px;
		background: rgba(255, 183, 77, 0.2);
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #FFB74D, #FFD700);
		border-radius: 9999px;
		transition: width 0.3s ease;
	}

	/* Messages */
	.loading-message {
		color: #F4D0C3;
		font-size: 0.875rem;
		text-align: center;
	}

	.loading-message.inline {
		font-size: 0.75rem;
	}

	.loading-progress {
		color: #FFB74D;
		font-size: 0.75rem;
		font-family: monospace;
	}

	/* Skeleton loading animation for content placeholders */
	:global(.skeleton) {
		background: linear-gradient(
			90deg,
			rgba(255, 183, 77, 0.1) 0%,
			rgba(255, 183, 77, 0.2) 50%,
			rgba(255, 183, 77, 0.1) 100%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s ease-in-out infinite;
		border-radius: 0.5rem;
	}

	@keyframes skeleton-loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Responsive */
	@media (max-width: 640px) {
		.loading-content {
			padding: 1.5rem;
		}

		.progress-bar-container {
			width: 150px;
		}
	}
</style>

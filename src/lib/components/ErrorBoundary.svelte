<script lang="ts">
	/**
	 * ErrorBoundary - Catches and handles component errors gracefully
	 * Provides fallback UI and error recovery options
	 */

	import { onMount } from 'svelte';
	import type { ErrorInfo } from '$lib/utils/errorHandler';
	import { errorHandler } from '$lib/utils/errorHandler';

	export let fallback: (() => void) | undefined;
	export let onError: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
	export let resetCondition: any = undefined;

	let error: Error | null = null;
	let errorInfo: ErrorInfo | null = null;
	let showError: boolean = false;

	onMount(() => {
		// Subscribe to global errors
		const unsubscribe = errorHandler.onError((info) => {
			if (info.context?.component === 'ErrorBoundary') {
				handleError(info);
			}
		});

		return unsubscribe;
	});

	function handleError(info: ErrorInfo) {
		error = new Error(info.message);
		errorInfo = info;
		showError = true;

		if (onError && error.stack) {
			onError(error, info);
		}
	}

	function reset() {
		error = null;
		errorInfo = null;
		showError = false;
		if (fallback) fallback();
	}

	function reload() {
		window.location.reload();
	}

	// Watch for reset condition changes
	$: if (resetCondition !== undefined && error) {
		reset();
	}
</script>

{#if showError && error}
	<div class="error-boundary" role="alert" aria-live="assertive">
		<div class="error-boundary-content">
			<div class="error-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<line x1="12" y1="8" x2="12" y2="12"/>
					<line x1="12" y1="16" x2="12.01" y2="16"/>
				</svg>
			</div>

			<h2 class="error-title">Oops! Something went wrong</h2>
			<p class="error-message">
				{errorHandler.getUserMessage(errorInfo!)}
			</p>

			{#if import.meta.env.DEV && errorInfo}
				<details class="error-details">
					<summary>Technical Details</summary>
					<pre class="error-stack">{error.stack}</pre>
					{#if errorInfo.context}
						<div class="error-context">
							<strong>Context:</strong>
							<ul>
								{#if errorInfo.context.component}
									<li>Component: {errorInfo.context.component}</li>
								{/if}
								{#if errorInfo.context.action}
									<li>Action: {errorInfo.context.action}</li>
								{/if}
							</ul>
						</div>
					{/if}
				</details>
			{/if}

			<div class="error-actions">
				{#if errorHandler.isRecoverable(errorInfo!)}
					<button class="btn-retry" on:click={reset}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="1 4 1 10 7 10"/>
							<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
						</svg>
						Try Again
					</button>
				{/if}
				<button class="btn-reload" on:click={reload}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6"/>
						<path d="M1 20v-6h6"/>
						<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
					</svg>
					Reload Page
				</button>
			</div>
		</div>
	</div>
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 15, 26, 0.95);
		backdrop-filter: blur(8px);
		z-index: 9999;
		padding: 1rem;
	}

	.error-boundary-content {
		max-width: 500px;
		width: 100%;
		background: linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.9));
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		text-align: center;
	}

	.error-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 2px solid rgba(239, 68, 68, 0.3);
		border-radius: 50%;
		color: #ef4444;
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #d4af37;
		margin: 0 0 1rem 0;
	}

	.error-message {
		color: #c9a9a6;
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 1.5rem 0;
	}

	.error-details {
		text-align: left;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(212, 175, 55, 0.1);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.error-details summary {
		cursor: pointer;
		color: #d4af37;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.error-stack {
		background: rgba(0, 0, 0, 0.5);
		border-radius: 4px;
		padding: 0.75rem;
		margin: 0.5rem 0;
		font-size: 0.75rem;
		color: #f5f5f5;
		overflow-x: auto;
		font-family: 'JetBrains Mono', monospace;
	}

	.error-context {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(212, 175, 55, 0.1);
		font-size: 0.875rem;
		color: #c9a9a6;
	}

	.error-context ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.25rem;
	}

	.error-context li {
		margin: 0.25rem 0;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.error-actions button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.25s ease;
	}

	.btn-retry {
		background: linear-gradient(135deg, #d4af37 0%, #b8962f 100%);
		color: #1a1a2e;
	}

	.btn-retry:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
	}

	.btn-reload {
		background: rgba(201, 169, 166, 0.1);
		border: 1px solid rgba(201, 169, 166, 0.3);
		color: #c9a9a6;
	}

	.btn-reload:hover {
		background: rgba(201, 169, 166, 0.15);
		border-color: rgba(201, 169, 166, 0.5);
	}

	@media (max-width: 640px) {
		.error-boundary-content {
			padding: 1.5rem;
		}

		.error-title {
			font-size: 1.25rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.error-actions button {
			width: 100%;
			justify-content: center;
		}
	}
</style>

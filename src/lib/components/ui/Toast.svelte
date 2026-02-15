<script lang="ts">
	/**
	 * Toast notification component for user feedback.
	 * Supports success, error, warning, and info variants.
	 */

	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
	export let message: string = '';
	export let duration: number = 3000;
	export let showIcon: boolean = true;
	export let dismissible: boolean = true;

	const dispatch = createEventDispatcher();

	let visible = true;
	let timeoutId: ReturnType<typeof setTimeout>;

	$: iconColor = {
		success: 'text-green-600',
		error: 'text-red-500',
		warning: 'text-amber-600',
		info: 'text-blue-500'
	}[type];

	$: bgColor = {
		success: 'bg-gradient-to-br from-green-100 to-green-50 border-green-200',
		error: 'bg-gradient-to-br from-red-100 to-red-50 border-red-200',
		warning: 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200',
		info: 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200'
	}[type];

	$: textColor = {
		success: 'text-green-800',
		error: 'text-red-800',
		warning: 'text-amber-800',
		info: 'text-blue-800'
	}[type];

	function dismiss() {
		visible = false;
		dispatch('dismiss');
	}

	function handleAction() {
		dispatch('action');
		dismiss();
	}

	$: if (visible && duration > 0) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			dismiss();
		}, duration);
	}

	$: icon = {
		success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>`,
		error: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>`,
		warning: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>`,
		info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
	}[type];
</script>

{#if visible}
	<div
		class="toast {bgColor} {textColor} border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
		role="alert"
		aria-live="polite"
		in:fly={{ y: -20, duration: 300 }}
		out:fade={{ duration: 200 }}
	>
		{#if showIcon}
			<div class="flex-shrink-0">
				<svg
					class="w-5 h-5 {iconColor}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					{@html icon}
				</svg>
			</div>
		{/if}

		<p class="flex-1 text-sm font-medium">
			{message}
		</p>

		{#if dismissible}
			<button
				type="button"
				on:click={dismiss}
				class="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
				aria-label="Dismiss notification"
			>
				<svg class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
			</button>
		{/if}
	</div>
{/if}

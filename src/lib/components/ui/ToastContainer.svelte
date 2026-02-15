<script lang="ts">
	/**
	 * ToastContainer - Manages multiple toast notifications.
	 * Import and place at the root level of your app.
	 */

	import { writable, get } from 'svelte/store';
	import Toast from './Toast.svelte';

	export let position: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right' = 'top-center';

	interface ToastItem {
		id: string;
		type: 'success' | 'error' | 'warning' | 'info';
		message: string;
		duration: number;
	}

	const toasts = writable<ToastItem[]>([]);

	function generateId(): string {
		return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	export function showSuccess(message: string, duration = 3000) {
		addToast('success', message, duration);
	}

	export function showError(message: string, duration = 4000) {
		addToast('error', message, duration);
	}

	export function showWarning(message: string, duration = 3500) {
		addToast('warning', message, duration);
	}

	export function showInfo(message: string, duration = 3000) {
		addToast('info', message, duration);
	}

	function addToast(type: ToastItem['type'], message: string, duration: number) {
		const id = generateId();
		toasts.update(items => [...items, { id, type, message, duration }]);
	}

	function removeToast(id: string) {
		toasts.update(items => items.filter(t => t.id !== id));
	}

	$: positionClasses = {
		'top-center': 'top-4 left-1/2 -translate-x-1/2',
		'top-right': 'top-4 right-4',
		'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
		'bottom-right': 'bottom-4 right-4'
	}[position];
</script>

<div
	class="toast-container fixed {positionClasses} z-[1000] flex flex-col gap-2 pointer-events-none"
	aria-live="polite"
	aria-label="Notifications"
>
	{#each $toasts as toast (toast.id)}
		<div class="pointer-events-auto">
			<Toast
				type={toast.type}
				message={toast.message}
				duration={toast.duration}
				on:dismiss={() => removeToast(toast.id)}
			/>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		max-width: 90vw;
		width: max-content;
	}

	@media (max-width: 480px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
			transform: none !important;
			max-width: none;
		}
	}
</style>

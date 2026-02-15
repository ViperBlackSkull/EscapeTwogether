<script lang="ts">
	/**
	 * Input component with label and error states.
	 * Uses the EscapeTogether design system colors with premium polish.
	 */

	import { createEventDispatcher } from 'svelte';

	export let value: string = '';
	export let type: 'text' | 'email' | 'password' | 'number' | 'search' = 'text';
	export let label: string = '';
	export let placeholder: string = '';
	export let error: string = '';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let id: string = `input-${Math.random().toString(36).slice(2, 9)}`;

	const dispatch = createEventDispatcher();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('input', value);
	}

	function handleChange(event: Event) {
		dispatch('change', value);
	}

	$: hasError = error && error.length > 0;
	$: inputClasses = [
		'w-full px-4 py-3 bg-soft-black/60 border rounded-lg text-sm text-white placeholder-white/40',
		'transition-all duration-300 cubic-bezier(0.22, 1, 0.36, 1)',
		'focus:outline-none focus:ring-2',
		hasError
			? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
			: 'border-white/10 hover:border-white/20 focus:border-accent-gold/50 focus:ring-accent-gold/20 focus:bg-soft-black/80',
		disabled ? 'opacity-50 cursor-not-allowed bg-soft-black/30' : ''
	].join(' ');
</script>

<div class="space-y-2">
	{#if label}
		<label
			for={id}
			class="block text-sm font-medium text-white/60 tracking-wide"
		>
			{label}
			{#if required}
				<span class="text-accent-gold ml-0.5" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			{id}
			{type}
			{value}
			{placeholder}
			{disabled}
			{required}
			on:input={handleInput}
			on:change={handleChange}
			class={inputClasses}
			class:shake-error={hasError}
			aria-invalid={hasError ? 'true' : 'false'}
			aria-describedby={hasError ? `${id}-error` : undefined}
			{...$$restProps}
		/>
		<!-- Focus glow effect -->
		<div class="absolute inset-0 rounded-lg pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" style="box-shadow: 0 0 20px rgba(212, 175, 55, 0.15);"></div>
	</div>

	{#if hasError}
		<p
			id="{id}-error"
			class="text-xs text-red-400 flex items-center gap-1.5 animate-slide-in-up"
			role="alert"
		>
			<svg class="h-3.5 w-3.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
			</svg>
			{error}
		</p>
	{/if}
</div>

<style>
	.shake-error {
		animation: shake 0.4s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-4px); }
		40%, 80% { transform: translateX(4px); }
	}

	.animate-slide-in-up {
		animation: slideUp 0.25s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

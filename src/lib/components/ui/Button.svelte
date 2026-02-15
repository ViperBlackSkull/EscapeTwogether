<script lang="ts">
	/**
	 * Button component with multiple variants and sizes.
	 * Uses the EscapeTogether design system colors with premium polish.
	 */

	export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let loading: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let fullWidth: boolean = false;

	// Compute classes based on props
	$: baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 cubic-bezier(0.22, 1, 0.36, 1) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep-navy disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

	$: sizeClasses = {
		sm: 'px-3 py-1.5 text-xs gap-1.5',
		md: 'px-5 py-2.5 text-sm gap-2',
		lg: 'px-7 py-3 text-base gap-2.5'
	}[size];

	$: variantClasses = {
		primary: 'bg-gradient-to-br from-accent-gold to-accent-gold-dark text-deep-navy hover:from-accent-gold-light hover:to-accent-gold active:scale-[0.98] focus:ring-accent-gold shadow-lg shadow-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/35 hover:-translate-y-0.5',
		secondary: 'bg-dusty-rose/15 text-dusty-rose border border-dusty-rose/25 hover:bg-dusty-rose/25 hover:border-dusty-rose/40 active:scale-[0.98] focus:ring-dusty-rose/50 hover:-translate-y-0.5',
		ghost: 'bg-transparent text-dusty-rose/70 hover:bg-dusty-rose/10 hover:text-dusty-rose focus:ring-dusty-rose/30'
	}[variant];

	$: widthClass = fullWidth ? 'w-full' : '';
</script>

<button
	{type}
	{disabled}
	class="{baseClasses} {sizeClasses} {variantClasses} {widthClass}"
	class:animate-pulse={loading}
	aria-busy={loading}
	aria-disabled={disabled}
	{...$$restProps}
>
	{#if loading}
		<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
	<slot />
</button>

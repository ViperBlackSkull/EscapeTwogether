<script lang="ts">
	/**
	 * Card component with elevation options.
	 * Uses the EscapeTogether design system colors with premium polish.
	 */

	export let elevation: 'none' | 'low' | 'medium' | 'high' = 'low';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let hoverable: boolean = false;
	export let glass: boolean = false;

	// Compute classes based on props
	$: baseClasses = glass
		? 'bg-deep-navy/70 border border-accent-gold/15 rounded-xl backdrop-blur-xl'
		: 'bg-gradient-to-br from-deep-navy/80 to-deep-navy/60 border border-white/5 rounded-xl backdrop-blur-sm';

	$: elevationClasses = {
		none: '',
		low: 'shadow-sm shadow-black/20',
		medium: 'shadow-md shadow-black/30',
		high: 'shadow-xl shadow-black/40 shadow-accent-gold/5'
	}[elevation];

	$: paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-5',
		lg: 'p-7'
	}[padding];

	$: hoverClasses = hoverable
		? 'cursor-pointer transition-all duration-350 cubic-bezier(0.22, 1, 0.36, 1) hover:border-accent-gold/25 hover:shadow-xl hover:shadow-black/30 hover:shadow-accent-gold/10 hover:-translate-y-1'
		: 'transition-all duration-300';
</script>

<div
	class="{baseClasses} {elevationClasses} {paddingClasses} {hoverClasses}"
	{...$$restProps}
>
	<slot />
</div>

<script lang="ts">
	/**
	 * SkeletonLoader - Animated placeholder for loading content
	 * Provides visual feedback while content loads
	 */

	export let width: string | number = '100%';
	export let height: string | number = '1rem';
	export let variant: 'text' | 'rect' | 'circle' | 'custom' = 'text';
	export let count: number = 1;
	export let animation: 'pulse' | 'wave' | 'none' = 'pulse';
	export let className: string = '';

	// Generate unique ID for animations
	let id = `skeleton-${Math.random().toString(36).substr(2, 9)}`;

	// Convert dimensions to CSS
	const widthStyle = typeof width === 'number' ? `${width}px` : width;
	const heightStyle = typeof height === 'number' ? `${height}px` : height;

	// Generate skeleton elements
	function generateSkeletons() {
		return Array.from({ length: count }, (_, i) => i);
	}
</script>

<div class="skeleton-container {className}" aria-hidden="true" aria-busy="true">
	{#each generateSkeletons() as i (i)}
		<div
			class="skeleton skeleton-{variant} skeleton-{animation}"
			style="width: {widthStyle}; height: {heightStyle};"
			class:delay-1={i === 1}
			class:delay-2={i === 2}
			class:delay-3={i === 3}
		></div>
	{/each}
</div>

<style>
	.skeleton-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skeleton {
		background: linear-gradient(
			90deg,
			rgba(212, 175, 55, 0.08) 0%,
			rgba(212, 175, 55, 0.15) 50%,
			rgba(212, 175, 55, 0.08) 100%
		);
		background-size: 200% 100%;
		border-radius: 4px;
	}

	/* Variant styles */
	.skeleton-text {
		height: 1em;
		border-radius: 4px;
	}

	.skeleton-rect {
		border-radius: 8px;
	}

	.skeleton-circle {
		border-radius: 50%;
	}

	.skeleton-custom {
		/* Custom styling applied via props */
	}

	/* Animation styles */
	.skeleton-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.skeleton-wave {
		animation: wave 1.5s ease-in-out infinite;
	}

	.skeleton-none {
		animation: none;
	}

	/* Animations */
	@keyframes pulse {
		0%, 100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}

	@keyframes wave {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Staggered animations */
	.delay-1 {
		animation-delay: 0.1s;
	}

	.delay-2 {
		animation-delay: 0.2s;
	}

	.delay-3 {
		animation-delay: 0.3s;
	}

	/* Accessibility: respect prefers-reduced-motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
		}
	}
</style>

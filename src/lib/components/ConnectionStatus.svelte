<script lang="ts">
	import { connectionStatus, getReconnectAttempts } from '$lib/socket';

	// Props
	export let showLabel: boolean = true;
	export let size: 'sm' | 'md' = 'sm';
	export let compact: boolean = false;

	$: status = $connectionStatus;
	$: attempts = getReconnectAttempts();

	interface StatusConfig {
		label: string;
		color: string;
		ringColor: string;
		animate: boolean;
	}

	function getStatusConfig(): StatusConfig {
		switch (status) {
			case 'connected':
				return {
					label: 'Connected',
					color: 'bg-soft-teal',
					ringColor: 'ring-soft-teal/30',
					animate: false
				};
			case 'connecting':
				return {
					label: 'Connecting',
					color: 'bg-yellow-400',
					ringColor: 'ring-yellow-400/30',
					animate: true
				};
			case 'reconnecting':
				return {
					label: `Reconnecting`,
					animate: true,
					color: 'bg-yellow-500',
					ringColor: 'ring-yellow-500/30'
				};
			case 'disconnected':
			default:
				return {
					label: 'Offline',
					color: 'bg-dusty-rose/40',
					ringColor: 'ring-dusty-rose/20',
					animate: false
				};
		}
	}

	$: config = getStatusConfig();
	$: dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
	$: textSize = size === 'sm' ? 'text-xs' : 'text-sm';
</script>

{#if compact}
	<!-- Compact mode: just the dot with a tooltip -->
	<div
		class="relative inline-flex items-center group"
		role="status"
		aria-label="Connection status: {config.label}"
	>
		<div
			class="{dotSize} rounded-full {config.color} ring-2 {config.ringColor}
				{config.animate ? 'animate-pulse' : ''} transition-all duration-300"
		></div>

		<!-- Tooltip -->
		<div
			class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
				bg-soft-black border border-dusty-rose/20 rounded-md text-xs text-dusty-rose
				opacity-0 group-hover:opacity-100 transition-opacity duration-200
				pointer-events-none whitespace-nowrap z-10"
		>
			{config.label}
			{#if status === 'reconnecting'}
				({attempts}/10)
			{/if}
		</div>
	</div>
{:else}
	<!-- Full mode: dot + label -->
	<div
		class="connection-status inline-flex items-center gap-2 {textSize} text-dusty-rose/70"
		role="status"
		aria-label="Connection status: {config.label}"
		aria-live="polite"
	>
		<div class="status-dot relative flex items-center justify-center">
			<div
				class="{dotSize} rounded-full {config.color} ring-2 {config.ringColor}
					{config.animate ? 'animate-pulse' : ''} transition-all duration-300"
			></div>

			<!-- Pulse ring animation for connecting states -->
			{#if config.animate}
				<div
					class="absolute inset-0 rounded-full {config.color} animate-ping opacity-30"
					aria-hidden="true"
				></div>
			{/if}
		</div>

		{#if showLabel}
			<span class="status-label font-medium">
				{config.label}
				{#if status === 'reconnecting'}
					<span class="text-dusty-rose/50">({attempts}/10)</span>
				{/if}
			</span>
		{/if}
	</div>
{/if}

<style>
	/* Reduced ping animation for better performance */
	@keyframes subtle-ping {
		75%, 100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}

	.connection-status .animate-ping {
		animation: subtle-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
</style>

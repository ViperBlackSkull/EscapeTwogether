<script lang="ts">
	import { connectionStatus, getReconnectAttempts } from '$lib/socket';

	$: status = $connectionStatus;
	$: attempts = getReconnectAttempts();

	function getStatusMessage(): string {
		switch (status) {
			case 'connected':
				return 'Connected';
			case 'connecting':
				return 'Connecting...';
			case 'reconnecting':
				return `Reconnecting (${attempts}/10)...`;
			case 'disconnected':
				return 'Disconnected';
			default:
				return 'Unknown';
		}
	}

	function getStatusColor(): string {
		switch (status) {
			case 'connected':
				return 'bg-green-500';
			case 'connecting':
				return 'bg-yellow-500';
			case 'reconnecting':
				return 'bg-orange-500';
			case 'disconnected':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getAnimationClass(): string {
		if (status === 'connecting' || status === 'reconnecting') {
			return 'animate-pulse';
		}
		return '';
	}
</script>

<div class="flex items-center gap-2 text-xs text-dusty-rose/70">
	<div
		class="w-2 h-2 rounded-full {getStatusColor()} {getAnimationClass()}"
		aria-label="Connection status: {getStatusMessage()}"
	></div>
	<span>{getStatusMessage()}</span>
</div>

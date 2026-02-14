<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { chatMessages, sendMessage, currentRoom } from '$lib/socket';
	import type { ChatMessage } from '$lib/socket';

	// Props
	export let placeholder: string = 'Type a message...';
	export let maxHeight: string = '300px';

	// Local state
	let newMessage = '';
	let chatContainer: HTMLDivElement;
	let inputId = `chat-input-${Math.random().toString(36).slice(2, 9)}`;

	// Reactive subscriptions
	$: messages = $chatMessages;
	$: room = $currentRoom;

	// Auto-scroll to bottom when new messages arrive
	afterUpdate(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});

	function handleSendMessage() {
		if (!newMessage.trim()) return;

		sendMessage(newMessage.trim());
		newMessage = '';
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	function formatTime(timestamp: Date | string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div
	class="flex flex-col h-full bg-deep-navy/50 rounded-lg border border-dusty-rose/10"
	role="region"
	aria-label="Chat"
>
	<!-- Header -->
	<div class="px-4 py-3 border-b border-dusty-rose/10 flex items-center justify-between">
		<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Chat</h2>
		<span class="text-xs text-dusty-rose/50" aria-live="polite">{messages.length} messages</span>
	</div>

	<!-- Messages -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-4 space-y-3"
		style="max-height: {maxHeight};"
		role="log"
		aria-label="Chat messages"
		aria-live="polite"
		aria-relevant="additions"
	>
		{#if messages.length === 0}
			<div class="text-center py-8">
				<p class="text-sm text-dusty-rose/40">No messages yet</p>
				<p class="text-xs text-dusty-rose/30 mt-1">Start a conversation with your partner</p>
			</div>
		{:else}
			{#each messages as msg (msg.id)}
				<article class="text-sm group" aria-label={`Message from ${msg.senderName}`}>
					<div class="flex items-baseline gap-2 mb-1">
						<span class="text-warm-amber font-medium">{msg.senderName}</span>
						<time class="text-xs text-dusty-rose/40" datetime={new Date(msg.timestamp).toISOString()}>
							{formatTime(msg.timestamp)}
						</time>
					</div>
					<p class="text-dusty-rose/80 pl-2 border-l-2 border-warm-amber/30">{msg.message}</p>
				</article>
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="p-3 border-t border-dusty-rose/10">
		{#if !room}
			<div class="text-center py-2">
				<p class="text-xs text-dusty-rose/40">Join a room to send messages</p>
			</div>
		{:else}
			<div class="flex gap-2">
				<label for={inputId} class="sr-only">Chat message</label>
				<input
					type="text"
					id={inputId}
					bind:value={newMessage}
					on:keypress={handleKeyPress}
					{placeholder}
					maxlength={500}
					aria-label="Type a chat message"
					class="flex-1 px-3 py-2 bg-soft-black border border-dusty-rose/20 rounded-lg
						text-sm text-dusty-rose placeholder-dusty-rose/40
						focus:outline-none focus:border-warm-amber/50 focus:ring-2 focus:ring-warm-amber/30
						transition-all duration-300"
				/>
				<button
					type="button"
					on:click={handleSendMessage}
					disabled={!newMessage.trim()}
					aria-label="Send message"
					class="px-4 py-2 bg-warm-amber text-deep-navy rounded-lg text-sm font-medium
						hover:bg-warm-amber/80 active:scale-95
						disabled:opacity-50 disabled:cursor-not-allowed
						transition-all duration-200
						focus:outline-none focus:ring-2 focus:ring-warm-amber focus:ring-offset-2 focus:ring-offset-deep-navy"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
					</svg>
				</button>
			</div>
		{/if}
	</div>
</div>

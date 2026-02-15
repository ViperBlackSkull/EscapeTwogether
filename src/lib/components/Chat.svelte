<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { chatMessages, sendMessage, currentRoom, getCurrentPlayerId } from '$lib/socket';
	import type { ChatMessage } from '$lib/socket';
	import { soundManager } from '$lib/audio';

	// Props
	export let placeholder: string = 'Type a message...';
	export let maxHeight: string = '300px';
	export let showTimestamps: boolean = true;

	// Local state
	let newMessage = '';
	let chatContainer: HTMLDivElement;
	let inputId = `chat-input-${Math.random().toString(36).slice(2, 9)}`;
	let previousMessageCount = 0;

	// Reactive subscriptions
	$: messages = $chatMessages;
	$: room = $currentRoom;

	// Get current player's socket ID to distinguish own messages
	$: myId = getCurrentPlayerId();

	// Auto-scroll to bottom when new messages arrive
	// Also play sound when receiving new messages
	afterUpdate(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}

		// Play receive sound if new messages came in (not from us sending)
		if (messages.length > previousMessageCount) {
			soundManager.playMessageReceive();
		}
		previousMessageCount = messages.length;
	});

	function handleSendMessage() {
		if (!newMessage.trim()) return;

		soundManager.playMessageSend();
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

	// Check if message is from current user
	function isOwnMessage(msg: ChatMessage): boolean {
		return msg.senderId === myId;
	}
</script>

<div
	class="chat-container flex flex-col h-full bg-deep-navy/50 rounded-xl border border-dusty-rose/10 backdrop-blur-sm"
	role="region"
	aria-label="Chat"
>
	<!-- Header -->
	<div class="chat-header px-4 py-3 border-b border-dusty-rose/10 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg class="h-4 w-4 text-warm-amber" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
			</svg>
			<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Chat</h2>
		</div>
		<span class="text-xs text-dusty-rose/50" aria-live="polite">
			{messages.length} message{messages.length !== 1 ? 's' : ''}
		</span>
	</div>

	<!-- Messages -->
	<div
		bind:this={chatContainer}
		class="chat-messages flex-1 overflow-y-auto p-4 space-y-3"
		style="max-height: {maxHeight};"
		role="log"
		aria-label="Chat messages"
		aria-live="polite"
		aria-relevant="additions"
	>
		{#if messages.length === 0}
			<div class="empty-state text-center py-8">
				<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-dusty-rose/10 mb-3">
					<svg class="h-6 w-6 text-dusty-rose/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
					</svg>
				</div>
				<p class="text-sm text-dusty-rose/40">No messages yet</p>
				<p class="text-xs text-dusty-rose/30 mt-1">Start a conversation with your partner</p>
			</div>
		{:else}
			{#each messages as msg (msg.id)}
				{@const own = isOwnMessage(msg)}
				<article
					class="message-wrapper flex flex-col {own ? 'items-end' : 'items-start'}"
					aria-label={`Message from ${msg.senderName}`}
				>
					<!-- Sender name and timestamp -->
					<div class="flex items-center gap-2 mb-1 {own ? 'flex-row-reverse' : ''}">
						<span class="text-xs font-medium {own ? 'text-warm-amber' : 'text-soft-teal'}">
							{own ? 'You' : msg.senderName}
						</span>
						{#if showTimestamps}
							<time
								class="text-[10px] text-dusty-rose/30"
								datetime={new Date(msg.timestamp).toISOString()}
							>
								{formatTime(msg.timestamp)}
							</time>
						{/if}
					</div>

					<!-- Message bubble -->
					<div
						class="message-bubble max-w-[85%] px-3 py-2 rounded-2xl {own
							? 'bg-warm-amber/20 text-dusty-rose rounded-br-sm border border-warm-amber/20'
							: 'bg-dusty-rose/10 text-dusty-rose/90 rounded-bl-sm border border-dusty-rose/15'}"
					>
						<p class="text-sm leading-relaxed break-words">{msg.message}</p>
					</div>
				</article>
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="chat-input p-3 border-t border-dusty-rose/10">
		{#if !room}
			<div class="disconnected-notice text-center py-2">
				<p class="text-xs text-dusty-rose/40 flex items-center justify-center gap-1.5">
					<svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					Join a room to send messages
				</p>
			</div>
		{:else}
			<form
				class="input-wrapper flex gap-2"
				on:submit|preventDefault={handleSendMessage}
			>
				<label for={inputId} class="sr-only">Chat message</label>
				<input
					type="text"
					id={inputId}
					bind:value={newMessage}
					on:keypress={handleKeyPress}
					{placeholder}
					maxlength={500}
					aria-label="Type a chat message"
					class="flex-1 px-4 py-2.5 bg-soft-black/80 border border-dusty-rose/15 rounded-xl
						text-sm text-dusty-rose placeholder-dusty-rose/40
						focus:outline-none focus:border-warm-amber/40 focus:ring-2 focus:ring-warm-amber/20
						transition-all duration-200"
				/>
				<button
					type="submit"
					disabled={!newMessage.trim()}
					aria-label="Send message"
					class="send-button px-4 py-2.5 bg-warm-amber text-deep-navy rounded-xl text-sm font-medium
						hover:bg-warm-amber/90 active:scale-95
						disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
						transition-all duration-200
						focus:outline-none focus:ring-2 focus:ring-warm-amber focus:ring-offset-2 focus:ring-offset-deep-navy
						flex items-center gap-1.5"
				>
					<span class="hidden sm:inline">Send</span>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
					</svg>
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	/* Custom scrollbar for chat messages */
	.chat-messages::-webkit-scrollbar {
		width: 6px;
	}

	.chat-messages::-webkit-scrollbar-track {
		background: transparent;
	}

	.chat-messages::-webkit-scrollbar-thumb {
		background: rgba(201, 169, 166, 0.2);
		border-radius: 3px;
	}

	.chat-messages::-webkit-scrollbar-thumb:hover {
		background: rgba(201, 169, 166, 0.3);
	}

	/* Smooth scroll behavior */
	.chat-messages {
		scroll-behavior: smooth;
	}
</style>

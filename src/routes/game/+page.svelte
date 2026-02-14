<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import { currentRoom, players, isConnected, disconnectSocket } from '$lib/socket';
	import type { Player } from '$lib/socket';

	// Chat state
	let chatMessages: { sender: string; message: string; timestamp: Date }[] = [];
	let newMessage = '';
	let chatContainer: HTMLDivElement;

	// Inventory state
	let inventory: { id: string; name: string; icon: string; description: string }[] = [];

	$: room = $currentRoom;
	$: playerList = $players;
	$: connected = $isConnected;

	// Redirect if not in a room
	$: if (browser && !room && !connected) {
		goto('/');
	}

	onMount(() => {
		// Load some sample inventory items for demo
		inventory = [
			{ id: '1', name: 'Rusty Key', icon: '🔑', description: 'An old rusty key. Might open something...' },
			{ id: '2', name: 'Flashlight', icon: '🔦', description: 'A battery-powered flashlight' },
			{ id: '3', name: 'Note', icon: '📜', description: 'A crumpled note with cryptic writing' }
		];

		// Add welcome message
		chatMessages.push({
			sender: 'System',
			message: 'Welcome to EscapeTogether! Work together to solve puzzles and escape.',
			timestamp: new Date()
		});
		chatMessages = chatMessages;
	});

	function sendMessage() {
		if (!newMessage.trim()) return;

		chatMessages.push({
			sender: 'You',
			message: newMessage.trim(),
			timestamp: new Date()
		});
		chatMessages = chatMessages;
		newMessage = '';

		// Scroll to bottom
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function leaveGame() {
		disconnectSocket();
		goto('/');
	}
</script>

<svelte:head>
	<title>EscapeTogether - Game</title>
</svelte:head>

<div class="h-screen bg-soft-black text-dusty-rose flex flex-col overflow-hidden">
	<!-- Header -->
	<header class="bg-deep-navy border-b border-dusty-rose/10 px-4 py-3 flex items-center justify-between flex-shrink-0">
		<div class="flex items-center gap-4">
			<h1 class="text-xl font-display font-bold text-warm-amber">EscapeTogether</h1>
			{#if room}
				<span class="text-sm text-dusty-rose/60">Room: <span class="text-antique-gold font-mono">{room.code}</span></span>
			{/if}
		</div>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<div class="w-2 h-2 rounded-full {connected ? 'bg-green-500' : 'bg-red-500'}"></div>
				<span class="text-sm text-dusty-rose/60">{playerList.length}/2 Players</span>
			</div>
			<button
				on:click={leaveGame}
				class="text-dusty-rose/60 hover:text-dusty-rose text-sm transition-colors"
			>
				Leave Game
			</button>
		</div>
	</header>

	<!-- Main Game Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Game Canvas Area -->
		<div class="flex-1 relative">
			<GameCanvas />

			<!-- Player overlays -->
			<div class="absolute top-4 left-4 bg-deep-navy/80 backdrop-blur-sm rounded-lg p-3 border border-dusty-rose/10">
				<div class="text-xs text-dusty-rose/60 mb-2 uppercase tracking-wider">Players</div>
				<div class="space-y-2">
					{#each playerList as player, index (player.id)}
						<div class="flex items-center gap-2">
							<div class="w-6 h-6 rounded-full bg-warm-amber/20 flex items-center justify-center text-xs">
								{index + 1}
							</div>
							<span class="text-sm text-dusty-rose">{player.name}</span>
							{#if player.isHost}
								<span class="text-xs text-antique-gold">★</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Right Sidebar: Chat + Inventory -->
		<div class="w-80 bg-deep-navy border-l border-dusty-rose/10 flex flex-col flex-shrink-0">
			<!-- Chat Section -->
			<div class="flex-1 flex flex-col min-h-0">
				<div class="px-4 py-3 border-b border-dusty-rose/10">
					<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Chat</h2>
				</div>

				<!-- Messages -->
				<div
					bind:this={chatContainer}
					class="flex-1 overflow-y-auto p-4 space-y-3"
				>
					{#each chatMessages as msg}
						<div class="text-sm">
							<span class="text-warm-amber font-medium">{msg.sender}: </span>
							<span class="text-dusty-rose/80">{msg.message}</span>
						</div>
					{/each}
				</div>

				<!-- Input -->
				<div class="p-3 border-t border-dusty-rose/10">
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newMessage}
							on:keypress={handleKeyPress}
							placeholder="Type a message..."
							class="flex-1 px-3 py-2 bg-soft-black border border-dusty-rose/20 rounded-lg text-sm text-dusty-rose placeholder-dusty-rose/40 focus:outline-none focus:border-warm-amber/50"
						/>
						<button
							on:click={sendMessage}
							class="px-4 py-2 bg-warm-amber text-deep-navy rounded-lg text-sm font-medium hover:bg-warm-amber/80 transition-colors"
						>
							Send
						</button>
					</div>
				</div>
			</div>

			<!-- Inventory Section -->
			<div class="h-48 border-t border-dusty-rose/10 flex flex-col">
				<div class="px-4 py-3 border-b border-dusty-rose/10">
					<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Inventory</h2>
				</div>
				<div class="flex-1 overflow-y-auto p-3">
					{#if inventory.length === 0}
						<p class="text-sm text-dusty-rose/50 text-center py-4">No items yet</p>
					{:else}
						<div class="grid grid-cols-4 gap-2">
							{#each inventory as item (item.id)}
								<button
									class="aspect-square bg-soft-black border border-dusty-rose/20 rounded-lg flex items-center justify-center text-xl hover:border-warm-amber/50 transition-colors group relative"
									title={item.name}
								>
									{item.icon}
									<!-- Tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep-navy border border-dusty-rose/20 rounded text-xs text-dusty-rose whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
										<div class="font-medium text-warm-amber">{item.name}</div>
										<div class="text-dusty-rose/60">{item.description}</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

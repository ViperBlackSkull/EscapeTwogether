<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import Chat from '$lib/components/Chat.svelte';
	import { currentRoom, players, isConnected, disconnectSocket } from '$lib/socket';
	import type { Player } from '$lib/socket';
	import { soundManager } from '$lib/audio';

	// Inventory state
	let inventory: { id: string; name: string; icon: string; description: string }[] = [];

	// Mobile UI state
	let showSidebar = false;
	let activeTab: 'chat' | 'inventory' = 'chat';
	let isMobile = false;

	$: room = $currentRoom;
	$: playerList = $players;
	$: connected = $isConnected;

	// Redirect if not in a room
	$: if (browser && !room && !connected) {
		goto('/');
	}

	onMount(() => {
		// Detect mobile
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

		// Handle resize
		const handleResize = () => {
			isMobile = window.innerWidth < 768;
			// Auto-close sidebar on desktop
			if (!isMobile) {
				showSidebar = false;
			}
		};
		window.addEventListener('resize', handleResize);

		// Load some sample inventory items for demo
		inventory = [
			{ id: '1', name: 'Rusty Key', icon: '🔑', description: 'An old rusty key. Might open something...' },
			{ id: '2', name: 'Flashlight', icon: '🔦', description: 'A battery-powered flashlight' },
			{ id: '3', name: 'Note', icon: '📜', description: 'A crumpled note with cryptic writing' }
		];

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function leaveGame() {
		soundManager.playClick();
		soundManager.playPlayerLeave();
		disconnectSocket();
		goto('/');
	}

	function toggleSidebar() {
		soundManager.playClick();
		showSidebar = !showSidebar;
	}

	function handleGameInteraction(event: CustomEvent) {
		console.log('Game interaction:', event.detail);
	}

	function handleTouchTap(event: CustomEvent) {
		console.log('Touch tap:', event.detail);
	}

	function handleItemClick(itemId: string) {
		soundManager.play('item-use');
	}

	function handleOpenChat() {
		soundManager.playClick();
		activeTab = 'chat';
		showSidebar = true;
	}

	function handleOpenInventory() {
		soundManager.playClick();
		activeTab = 'inventory';
		showSidebar = true;
	}
</script>

<svelte:head>
	<title>EscapeTogether - Game</title>
</svelte:head>

{#if showSidebar && isMobile}
	<!-- Announce sidebar state to screen readers -->
	<div role="status" aria-live="polite" class="sr-only">
		{activeTab === 'chat' ? 'Chat panel opened' : 'Inventory panel opened'}
	</div>
{/if}

<div
	id="main-content"
	class="h-screen h-[100dvh] bg-soft-black text-dusty-rose flex flex-col overflow-hidden"
	role="application"
	aria-label="EscapeTogether game interface"
	tabindex="-1"
>
	<!-- Header -->
	<header class="bg-deep-navy border-b border-dusty-rose/10 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between flex-shrink-0">
		<div class="flex items-center gap-2 md:gap-4">
			<h1 class="text-lg md:text-xl font-display font-bold text-warm-amber">EscapeTogether</h1>
			{#if room}
				<span class="text-xs md:text-sm text-dusty-rose/60 hidden sm:inline">Room: <span class="text-antique-gold font-mono">{room.code}</span></span>
			{/if}
		</div>
		<div class="flex items-center gap-2 md:gap-4">
			<div class="flex items-center gap-2" role="status" aria-label="Connection status">
				<div class="w-2 h-2 rounded-full {connected ? 'bg-green-500' : 'bg-red-500'}" aria-hidden="true"></div>
				<span class="text-xs md:text-sm text-dusty-rose/60">{playerList.length}/2 players</span>
			</div>

			<!-- Mobile sidebar toggle -->
			{#if isMobile}
				<button
					on:click={toggleSidebar}
					class="p-2 text-dusty-rose/60 hover:text-dusty-rose transition-colors"
					aria-label="Toggle sidebar"
				>
					{#if showSidebar}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
			{/if}

			<button
				on:click={leaveGame}
				class="text-dusty-rose/60 hover:text-dusty-rose text-xs md:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-warm-amber rounded px-2 py-1"
				aria-label="Leave game and return to home"
			>
				Leave
			</button>
		</div>
	</header>

	<!-- Main Game Area -->
	<div class="flex-1 flex overflow-hidden relative">
		<!-- Game Canvas Area -->
		<div class="flex-1 relative">
			<GameCanvas
				on:interact={handleGameInteraction}
				on:tap={handleTouchTap}
			/>

			<!-- Player overlays - smaller on mobile -->
			<div
				class="absolute top-2 left-2 md:top-4 md:left-4 bg-deep-navy/80 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-dusty-rose/10"
				role="region"
				aria-label="Players in room"
			>
				<div class="text-xs text-dusty-rose/60 mb-1 md:mb-2 uppercase tracking-wider" id="players-label">Players</div>
				<ul class="space-y-1 md:space-y-2" aria-labelledby="players-label" role="list">
					{#each playerList as player, index (player.id)}
						<li class="flex items-center gap-2">
							<div class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-warm-amber/20 flex items-center justify-center text-xs" aria-hidden="true">
								{index + 1}
							</div>
							<span class="text-xs md:text-sm text-dusty-rose truncate max-w-[80px] md:max-w-none">{player.name}</span>
							{#if player.isHost}
								<span class="text-xs text-antique-gold" aria-label="Host">★</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Mobile Sidebar Overlay -->
		{#if isMobile && showSidebar}
			<button
				class="fixed inset-0 bg-black/50 z-40"
				on:click={toggleSidebar}
				aria-label="Close sidebar"
			></button>
		{/if}

		<!-- Right Sidebar: Chat + Inventory -->
		<aside
			class="bg-deep-navy border-l border-dusty-rose/10 flex flex-col flex-shrink-0
				{isMobile
					? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ' +
						(showSidebar ? 'translate-x-0' : 'translate-x-full')
					: 'w-80'}"
			role="complementary"
			aria-label="Game sidebar with chat and inventory"
			aria-hidden={isMobile && !showSidebar ? 'true' : 'false'}
		>
			<!-- Mobile sidebar header -->
			{#if isMobile}
				<div class="px-4 py-3 border-b border-dusty-rose/10 flex items-center justify-between">
					<h2 class="text-lg font-display font-bold text-warm-amber">Menu</h2>
					<button
						on:click={toggleSidebar}
						class="p-2 text-dusty-rose/60 hover:text-dusty-rose transition-colors"
						aria-label="Close sidebar"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Mobile tab switcher -->
				<div class="flex border-b border-dusty-rose/10">
					<button
						on:click={() => activeTab = 'chat'}
						class="flex-1 py-3 text-sm font-medium transition-colors {activeTab === 'chat'
							? 'text-warm-amber border-b-2 border-warm-amber'
							: 'text-dusty-rose/60'}"
					>
						Chat
					</button>
					<button
						on:click={() => activeTab = 'inventory'}
						class="flex-1 py-3 text-sm font-medium transition-colors {activeTab === 'inventory'
							? 'text-warm-amber border-b-2 border-warm-amber'
							: 'text-dusty-rose/60'}"
					>
						Inventory
					</button>
				</div>
			{/if}

			<!-- Chat Section -->
			<div
				class="flex-1 flex flex-col min-h-0
					{isMobile && activeTab !== 'chat' ? 'hidden' : ''}"
			>
				{#if !isMobile}
					<div class="px-4 py-3 border-b border-dusty-rose/10">
						<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Chat</h2>
					</div>
				{/if}

				<div class="flex-1 overflow-hidden {isMobile ? '' : 'p-2'}">
					<Chat placeholder="Type a message..." maxHeight={isMobile ? '100%' : 'calc(100vh - 400px)'} />
				</div>
			</div>

			<!-- Inventory Section -->
			<div
				class="border-t border-dusty-rose/10 flex flex-col
					{isMobile
						? activeTab === 'inventory' ? 'flex-1' : 'hidden'
						: 'h-48'}"
			>
				{#if !isMobile}
					<div class="px-4 py-3 border-b border-dusty-rose/10">
						<h2 class="text-sm font-semibold text-antique-gold uppercase tracking-wider">Inventory</h2>
					</div>
				{/if}
				<div class="flex-1 overflow-y-auto p-3">
					{#if inventory.length === 0}
						<p class="text-sm text-dusty-rose/50 text-center py-4" role="status">No items yet</p>
					{:else}
						<div class="grid grid-cols-4 gap-2" role="list" aria-label="Inventory items">
							{#each inventory as item (item.id)}
								<button
									class="aspect-square bg-soft-black border border-dusty-rose/20 rounded-lg flex items-center justify-center text-xl hover:border-warm-amber/50 active:scale-95 transition-all group relative focus:outline-none focus:ring-2 focus:ring-warm-amber"
									on:click={() => handleItemClick(item.id)}
									aria-label="{item.name}: {item.description}"
									role="listitem"
								>
									<span aria-hidden="true">{item.icon}</span>
									<!-- Tooltip (desktop only) -->
									<div class="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep-navy border border-dusty-rose/20 rounded text-xs text-dusty-rose whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" role="tooltip">
										<div class="font-medium text-warm-amber">{item.name}</div>
										<div class="text-dusty-rose/60">{item.description}</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</aside>
	</div>

	<!-- Mobile bottom action bar -->
	{#if isMobile && !showSidebar}
		<div class="absolute bottom-4 right-4 flex gap-2">
			<button
				on:click={handleOpenChat}
				class="p-3 bg-warm-amber text-deep-navy rounded-full shadow-lg active:scale-95 transition-transform"
				aria-label="Open chat"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
			</button>
			<button
				on:click={handleOpenInventory}
				class="p-3 bg-soft-teal text-deep-navy rounded-full shadow-lg active:scale-95 transition-transform"
				aria-label="Open inventory"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
				</svg>
			</button>
		</div>
	{/if}
</div>

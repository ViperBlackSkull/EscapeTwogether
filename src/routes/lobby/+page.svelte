<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { io, Socket } from 'socket.io-client';
	import { onMount, onDestroy } from 'svelte';

	interface Player {
		id: string;
		name: string;
		isHost: boolean;
	}

	// Session data
	let roomCode = '';
	let playerName = '';
	let isHost = false;

	// Socket connection
	let socket: Socket | null = null;
	let isConnected = false;

	// Players in room
	let players: Player[] = [];
	let showPartnerNotification = false;
	let notificationTimeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		if (browser) {
			// Get session data
			roomCode = sessionStorage.getItem('roomCode') || '';
			playerName = sessionStorage.getItem('playerName') || '';
			isHost = sessionStorage.getItem('isHost') === 'true';

			// If no room code, redirect to home
			if (!roomCode) {
				goto('/');
				return;
			}

			// Initialize players with current player
			players = [{ id: 'self', name: playerName, isHost }];

			// Connect to socket
			socket = io('http://localhost:3001', {
				autoConnect: true,
				reconnection: true
			});

			socket.on('connect', () => {
				isConnected = true;
				console.log('Connected to server');
			});

			socket.on('disconnect', () => {
				isConnected = false;
				console.log('Disconnected from server');
			});

			socket.on('player-joined', (data: { player: Player }) => {
				console.log('Player joined:', data.player.name);
				players = [...players, data.player];

				// Show notification
				showPartnerNotification = true;
				clearTimeout(notificationTimeout);
				notificationTimeout = setTimeout(() => {
					showPartnerNotification = false;
				}, 3000);

				// Redirect to game when both players are present
				if (players.length >= 2) {
					setTimeout(() => {
						goto('/game');
					}, 1500);
				}
			});

			socket.on('player-left', (data: { playerId: string; playerName: string }) => {
				console.log('Player left:', data.playerName);
				players = players.filter(p => p.id !== data.playerId);
			});
		}
	});

	onDestroy(() => {
		clearTimeout(notificationTimeout);
	});

	function handleLeaveRoom() {
		if (socket) {
			socket.disconnect();
		}
		if (browser) {
			sessionStorage.clear();
		}
		goto('/');
	}

	function copyRoomCode() {
		if (roomCode) {
			navigator.clipboard.writeText(roomCode);
		}
	}
</script>

<svelte:head>
	<title>Lobby - EscapeTogether</title>
</svelte:head>

<main class="min-h-screen min-h-[100dvh] bg-soft-black text-dusty-rose font-body">
	<div class="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h1 class="text-3xl sm:text-4xl font-display font-bold text-warm-amber mb-2">Lobby</h1>
			<p class="text-sm sm:text-base text-dusty-rose/60">Waiting for players...</p>
		</div>

		<!-- Partner joined notification -->
		{#if showPartnerNotification}
			<div
				class="fixed top-4 left-1/2 -translate-x-1/2 bg-soft-teal/20 border border-soft-teal/40 rounded-xl px-4 sm:px-6 py-2 sm:py-3 z-50 animate-pulse"
			>
				<p class="text-sm sm:text-base text-soft-teal font-semibold text-center">Your partner has joined! Starting game...</p>
			</div>
		{/if}

		<!-- Room info card -->
		<div class="w-full max-w-md px-1 sm:px-0">
			<div class="bg-deep-navy/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl border border-dusty-rose/10">
				<!-- Connection status -->
				<div class="flex items-center justify-center mb-4 sm:mb-6">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse"></div>
						<span class="text-xs sm:text-sm text-dusty-rose/60">
							{isConnected ? 'Connected' : 'Connecting...'}
						</span>
					</div>
				</div>

				<!-- Room code display -->
				<div class="text-center mb-6 sm:mb-8">
					<p class="text-xs sm:text-sm text-dusty-rose/60 mb-2 uppercase tracking-wider">Room Code</p>
					<div class="flex items-center justify-center gap-2 sm:gap-3">
						<div class="bg-soft-black/50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg border border-dusty-rose/20">
							<span class="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-antique-gold tracking-widest">
								{roomCode}
							</span>
						</div>
						<button
							on:click={copyRoomCode}
							class="bg-warm-amber/20 hover:bg-warm-amber/30 active:bg-warm-amber/40 text-warm-amber px-2 sm:px-3 py-2 rounded-lg transition-all text-sm"
							title="Copy room code"
						>
							Copy
						</button>
					</div>
					<p class="text-xs text-dusty-rose/40 mt-3">Share this code with your partner</p>
				</div>

			<!-- Players list -->
			<div class="mb-6">
				<p class="text-sm text-dusty-rose/60 mb-3">Players ({players.length}/2)</p>
				<div class="space-y-2">
					{#each players as player, index (player.id)}
						<div
							class="bg-soft-black/30 px-4 py-3 rounded-lg border {index === 0
								? 'border-warm-amber/30'
								: 'border-soft-teal/30'} flex items-center justify-between"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold {index === 0
										? 'bg-warm-amber/20 text-warm-amber'
										: 'bg-soft-teal/20 text-soft-teal'}"
								>
									{index + 1}
								</div>
								<span class="text-dusty-rose">{player.name}</span>
							</div>
							<div class="flex items-center gap-2">
								{#if player.isHost}
									<span class="text-xs bg-antique-gold/20 text-antique-gold px-2 py-1 rounded">Host</span>
								{/if}
								<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Waiting message or starting message -->
			<div
				class="text-center py-4 mb-6 border border-dashed rounded-lg {players.length >= 2
					? 'border-soft-teal/40 bg-soft-teal/10'
					: 'border-dusty-rose/20'}"
			>
				{#if players.length >= 2}
					<div class="flex items-center justify-center gap-2 text-soft-teal">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span>Both players ready! Starting game...</span>
					</div>
				{:else}
					<div class="flex items-center justify-center gap-2 text-dusty-rose/40">
						<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Waiting for partner...</span>
					</div>
				{/if}
			</div>

			<!-- Leave button -->
			<button
				on:click={handleLeaveRoom}
				class="w-full py-3 bg-transparent border border-red-500/50 text-red-400 rounded-lg
					hover:bg-red-500/10 transition-all duration-300"
			>
				Leave Room
			</button>
		</div>
	</div>
</main>

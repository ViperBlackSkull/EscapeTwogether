<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { io, Socket } from 'socket.io-client';
	import { onMount } from 'svelte';

	// Session data
	let roomCode = '';
	let playerName = '';
	let isHost = false;

	// Socket connection
	let socket: Socket | null = null;
	let isConnected = false;

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

			socket.on('player-joined', (data: { player: { id: string; name: string; isHost: boolean } }) => {
				console.log('Player joined:', data.player.name);
			});

			socket.on('player-left', (data: { playerId: string; playerName: string }) => {
				console.log('Player left:', data.playerName);
			});
		}
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
</script>

<svelte:head>
	<title>Lobby - EscapeTogether</title>
</svelte:head>

<main class="min-h-screen bg-soft-black text-dusty-rose font-body">
	<div class="min-h-screen flex flex-col items-center justify-center px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-display font-bold text-warm-amber mb-2">Lobby</h1>
			<p class="text-dusty-rose/60">Waiting for players...</p>
		</div>

		<!-- Room info card -->
		<div class="w-full max-w-md bg-deep-navy/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-dusty-rose/10">
			<!-- Connection status -->
			<div class="flex items-center justify-center mb-6">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse"></div>
					<span class="text-sm text-dusty-rose/60">
						{isConnected ? 'Connected' : 'Connecting...'}
					</span>
				</div>
			</div>

			<!-- Room code display -->
			<div class="text-center mb-8">
				<p class="text-sm text-dusty-rose/60 mb-2">Room Code</p>
				<div class="bg-soft-black/50 px-6 py-4 rounded-lg border border-dusty-rose/20 inline-block">
					<span class="text-4xl font-display font-bold text-warm-amber tracking-widest">
						{roomCode}
					</span>
				</div>
				<p class="text-xs text-dusty-rose/40 mt-2">Share this code with your partner</p>
			</div>

			<!-- Player info -->
			<div class="mb-6">
				<p class="text-sm text-dusty-rose/60 mb-2">You</p>
				<div class="bg-soft-black/30 px-4 py-3 rounded-lg border border-dusty-rose/10 flex items-center justify-between">
					<span class="text-dusty-rose">{playerName}</span>
					{#if isHost}
						<span class="text-xs bg-warm-amber/20 text-warm-amber px-2 py-1 rounded">Host</span>
					{/if}
				</div>
			</div>

			<!-- Waiting message -->
			<div class="text-center py-4 mb-6 border border-dashed border-dusty-rose/20 rounded-lg">
				<p class="text-dusty-rose/40 text-sm">Waiting for other player to join...</p>
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createRoom, joinRoom, connectSocket, isConnected } from '$lib/socket';

	// Form state
	let playerName = '';
	let roomCode = '';
	let isLoading = false;
	let errorMessage = '';
	let connected = false;

	// Room code validation (4 characters, alphanumeric)
	const ROOM_CODE_REGEX = /^[A-Za-z0-9]{4}$/;

	onMount(() => {
		connectSocket();
		const unsubscribe = isConnected.subscribe((value) => {
			connected = value;
		});
		return unsubscribe;
	});

	// Handle create room
	async function handleCreateRoom() {
		if (!playerName.trim()) {
			errorMessage = 'Please enter your name';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const result = await createRoom(playerName.trim());
			if (result.success) {
				// Store room info in session storage
				if (browser) {
					sessionStorage.setItem('roomCode', result.room!.code);
					sessionStorage.setItem('playerName', playerName.trim());
					sessionStorage.setItem('isHost', 'true');
				}
				goto('/lobby');
			} else {
				errorMessage = result.error || 'Failed to create room';
			}
		} catch (e) {
			errorMessage = 'Connection error. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle join room
	async function handleJoinRoom() {
		if (!playerName.trim()) {
			errorMessage = 'Please enter your name';
			return;
		}

		if (!roomCode.trim()) {
			errorMessage = 'Please enter a room code';
			return;
		}

		if (!ROOM_CODE_REGEX.test(roomCode.trim())) {
			errorMessage = 'Room code must be 4 characters (letters and numbers)';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const result = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
			if (result.success) {
				// Store room info in session storage
				if (browser) {
					sessionStorage.setItem('roomCode', result.room!.code);
					sessionStorage.setItem('playerName', playerName.trim());
					sessionStorage.setItem('isHost', 'false');
				}
				goto('/lobby');
			} else {
				errorMessage = result.error || 'Failed to join room';
			}
		} catch (e) {
			errorMessage = 'Connection error. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle form submission with Enter key
	function handleKeyPress(event: KeyboardEvent, action: 'create' | 'join') {
		if (event.key === 'Enter') {
			if (action === 'create') {
				handleCreateRoom();
			} else {
				handleJoinRoom();
			}
		}
	}
</script>

<svelte:head>
	<title>EscapeTogether - A Cooperative Puzzle Adventure</title>
	<meta name="description" content="Work together to solve puzzles and escape mysterious rooms. A romantic cooperative gaming experience." />
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<main class="min-h-screen bg-soft-black text-dusty-rose font-body overflow-hidden relative">
	<!-- Ambient background effects -->
	<div class="fixed inset-0 pointer-events-none">
		<!-- Gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-br from-deep-navy via-soft-black to-deep-navy opacity-90"></div>

		<!-- Floating particles effect (CSS only) -->
		<div class="absolute top-1/4 left-1/4 w-2 h-2 bg-warm-amber/20 rounded-full animate-pulse"></div>
		<div class="absolute top-1/3 right-1/4 w-3 h-3 bg-dusty-rose/10 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
		<div class="absolute bottom-1/4 left-1/3 w-2 h-2 bg-soft-teal/15 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
		<div class="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-antique-gold/20 rounded-full animate-pulse" style="animation-delay: 1.5s;"></div>
		<div class="absolute bottom-1/3 right-1/5 w-2 h-2 bg-dusty-rose/10 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

		<!-- Subtle vignette -->
		<div class="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]"></div>
	</div>

	<!-- Main content -->
	<div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
		<!-- Header section -->
		<div class="text-center mb-12">
			<!-- Decorative element -->
			<div class="flex items-center justify-center mb-4">
				<div class="w-16 h-px bg-gradient-to-r from-transparent via-warm-amber/50 to-transparent"></div>
				<div class="mx-4 w-2 h-2 bg-warm-amber/60 rotate-45"></div>
				<div class="w-16 h-px bg-gradient-to-r from-transparent via-warm-amber/50 to-transparent"></div>
			</div>

			<h1 class="text-6xl md:text-7xl font-display font-bold text-warm-amber mb-4 tracking-wide">
				EscapeTogether
			</h1>

			<p class="text-xl md:text-2xl text-dusty-rose/80 font-light tracking-wider">
				Work together. Solve mysteries. Escape as one.
			</p>

			<!-- Decorative element -->
			<div class="flex items-center justify-center mt-6">
				<div class="w-24 h-px bg-gradient-to-r from-transparent via-antique-gold/30 to-transparent"></div>
			</div>
		</div>

		<!-- Connection Status -->
		<div class="mb-6 flex items-center gap-2">
			<div class="w-3 h-3 rounded-full {connected ? 'bg-green-500' : 'bg-red-500'}"></div>
			<span class="text-sm text-dusty-rose/60">{connected ? 'Connected' : 'Connecting...'}</span>
		</div>

		<!-- Main card -->
		<div class="w-full max-w-md">
			<div class="bg-deep-navy/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-dusty-rose/10">
				<!-- Error message -->
				{#if errorMessage}
					<div class="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
						{errorMessage}
					</div>
				{/if}

				<!-- Player name input -->
				<div class="mb-6">
					<label for="playerName" class="block text-sm font-medium text-dusty-rose/70 mb-2 tracking-wide">
						Your Name
					</label>
					<input
						type="text"
						id="playerName"
						bind:value={playerName}
						on:keypress={(e) => handleKeyPress(e, 'create')}
						placeholder="Enter your name..."
						maxlength={20}
						class="w-full px-4 py-3 bg-soft-black/50 border border-dusty-rose/20 rounded-lg
							text-dusty-rose placeholder-dusty-rose/30 font-body
							focus:outline-none focus:border-warm-amber/50 focus:ring-1 focus:ring-warm-amber/30
							transition-all duration-300"
					/>
				</div>

				<!-- Create Room section -->
				<div class="mb-8">
					<button
						on:click={handleCreateRoom}
						disabled={isLoading}
						class="w-full py-4 bg-gradient-to-r from-warm-amber/90 to-antique-gold/90
							text-deep-navy font-semibold text-lg rounded-lg
							hover:from-warm-amber hover:to-antique-gold
							active:scale-[0.98]
							disabled:opacity-50 disabled:cursor-not-allowed
							transition-all duration-300 shadow-lg hover:shadow-warm-amber/20
							transform hover:-translate-y-0.5"
					>
						{#if isLoading}
							<span class="flex items-center justify-center">
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-deep-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Creating...
							</span>
						{:else}
							Create Room
						{/if}
					</button>
					<p class="mt-2 text-center text-xs text-dusty-rose/50">
						Start a new game and invite your partner
					</p>
				</div>

				<!-- Divider -->
				<div class="flex items-center mb-6">
					<div class="flex-1 h-px bg-gradient-to-r from-transparent via-dusty-rose/20 to-transparent"></div>
					<span class="px-4 text-dusty-rose/40 text-sm tracking-wider">or</span>
					<div class="flex-1 h-px bg-gradient-to-r from-transparent via-dusty-rose/20 to-transparent"></div>
				</div>

				<!-- Join Room section -->
				<div class="mb-4">
					<label for="roomCode" class="block text-sm font-medium text-dusty-rose/70 mb-2 tracking-wide">
						Room Code
					</label>
					<input
						type="text"
						id="roomCode"
						bind:value={roomCode}
						on:keypress={(e) => handleKeyPress(e, 'join')}
						placeholder="Enter 4-character code..."
						maxlength={4}
						class="w-full px-4 py-3 bg-soft-black/50 border border-dusty-rose/20 rounded-lg
							text-dusty-rose placeholder-dusty-rose/30 font-body uppercase tracking-widest text-center
							focus:outline-none focus:border-warm-amber/50 focus:ring-1 focus:ring-warm-amber/30
							transition-all duration-300"
					/>
				</div>

				<button
					on:click={handleJoinRoom}
					disabled={isLoading}
					class="w-full py-3 bg-transparent border-2 border-soft-teal/70
						text-soft-teal font-semibold rounded-lg
						hover:bg-soft-teal/10 hover:border-soft-teal
						active:scale-[0.98]
						disabled:opacity-50 disabled:cursor-not-allowed
						transition-all duration-300"
				>
					{#if isLoading}
						<span class="flex items-center justify-center">
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-soft-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Joining...
						</span>
					{:else}
						Join Room
					{/if}
				</button>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-12 text-center">
			<p class="text-dusty-rose/40 text-sm tracking-wider">
				A cooperative puzzle escape game for two
			</p>
		</div>
	</div>
</main>

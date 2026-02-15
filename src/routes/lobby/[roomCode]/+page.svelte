<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	interface Player {
		id: string;
		name: string;
		isHost: boolean;
	}

	// Get room code from URL params
	$: roomCode = $page.params.roomCode?.toUpperCase() || '';

	// Session data
	let playerName = '';
	let isHost = false;

	// UI state
	let players: Player[] = [];
	let showPartnerNotification = false;
	let copySuccess = false;
	let notificationTimeout: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		if (browser) {
			// Get session data
			playerName = sessionStorage.getItem('playerName') || '';
			isHost = sessionStorage.getItem('isHost') === 'true';

			// If no player name, use demo mode for preview/testing
			if (!playerName) {
				// Demo mode - use placeholder data for testing the UI
				playerName = 'DemoPlayer';
				isHost = true;
			}

			// Initialize players with current player
			players = [{ id: 'self', name: playerName, isHost }];
		}
	});

	onDestroy(() => {
		clearTimeout(notificationTimeout);
	});

	async function handleLeaveRoom() {
		if (browser) {
			sessionStorage.clear();
		}
		goto('/');
	}

	async function copyRoomCode() {
		if (browser && roomCode) {
			try {
				await navigator.clipboard.writeText(roomCode);
				copySuccess = true;
				setTimeout(() => {
					copySuccess = false;
				}, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
		}
	}

	// Split room code into individual characters for display
	$: roomCodeChars = roomCode.split('');
</script>

<svelte:head>
	<title>Lobby - {roomCode} - EscapeTwogether</title>
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
		<div class="text-center mb-8">
			<!-- Decorative element -->
			<div class="flex items-center justify-center mb-4">
				<div class="w-16 h-px bg-gradient-to-r from-transparent via-warm-amber/50 to-transparent"></div>
				<div class="mx-4 w-2 h-2 bg-warm-amber/60 rotate-45"></div>
				<div class="w-16 h-px bg-gradient-to-r from-transparent via-warm-amber/50 to-transparent"></div>
			</div>

			<h1 class="text-4xl md:text-5xl font-display font-bold text-warm-amber mb-2 tracking-wide">
				Game Lobby
			</h1>

			<p class="text-lg text-dusty-rose/70 tracking-wider">
				Share the code with your partner
			</p>
		</div>

		<!-- Partner joined notification -->
		{#if showPartnerNotification}
			<div
				class="fixed top-4 left-1/2 -translate-x-1/2 bg-soft-teal/20 border border-soft-teal/40 rounded-xl px-6 py-3 z-50 animate-pulse"
			>
				<p class="text-soft-teal font-semibold">Your partner has joined! Starting game...</p>
			</div>
		{/if}

		<!-- Main card -->
		<div class="w-full max-w-lg">
			<div class="bg-deep-navy/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-dusty-rose/10">
				<!-- Room code section -->
				<div class="text-center mb-8">
					<p class="text-sm text-dusty-rose/60 mb-4 uppercase tracking-widest font-medium">
						Room Code
					</p>

					<!-- Large room code display with individual character boxes -->
					<div class="flex items-center justify-center gap-2 md:gap-3 mb-4">
						{#each roomCodeChars as char, i}
							<div
								class="w-14 h-16 md:w-16 md:h-20 bg-soft-black/60 border-2 border-antique-gold/40 rounded-lg
									flex items-center justify-center shadow-lg"
							>
								<span class="text-3xl md:text-4xl font-display font-bold text-antique-gold">
									{char}
								</span>
							</div>
						{/each}
					</div>

					<!-- Copy button with visual feedback -->
					<button
						on:click={copyRoomCode}
						class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
							transition-all duration-300 transform hover:scale-105
							{copySuccess
							? 'bg-green-600/80 text-white'
							: 'bg-warm-amber/20 hover:bg-warm-amber/30 text-warm-amber border border-warm-amber/40'}"
					>
						{#if copySuccess}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
							<span>Copied!</span>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
							</svg>
							<span>Copy Code</span>
						{/if}
					</button>
				</div>

				<!-- Divider -->
				<div class="flex items-center mb-6">
					<div class="flex-1 h-px bg-gradient-to-r from-transparent via-dusty-rose/20 to-transparent"></div>
				</div>

				<!-- Player info section -->
				<div class="mb-6">
					<p class="text-sm text-dusty-rose/60 mb-3 uppercase tracking-wider font-medium">
						Your Info
					</p>
					<div
						class="bg-soft-black/30 px-5 py-4 rounded-xl border border-warm-amber/30
							flex items-center justify-between"
					>
						<div class="flex items-center gap-4">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
									bg-warm-amber/20 text-warm-amber"
							>
								{playerName.charAt(0).toUpperCase()}
							</div>
							<div>
								<span class="text-dusty-rose text-lg font-medium">{playerName}</span>
								{#if isHost}
									<span class="ml-2 text-xs bg-antique-gold/20 text-antique-gold px-2 py-0.5 rounded">
										Host
									</span>
								{/if}
							</div>
						</div>
						<div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
					</div>
				</div>

				<!-- Waiting message with animation -->
				<div
					class="text-center py-5 mb-6 border-2 border-dashed rounded-xl border-dusty-rose/30
						bg-dusty-rose/5"
				>
					<div class="flex flex-col items-center gap-3">
						<!-- Animated loading indicator -->
						<div class="flex items-center gap-1.5">
							<div class="w-2.5 h-2.5 bg-warm-amber/60 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
							<div class="w-2.5 h-2.5 bg-warm-amber/60 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
							<div class="w-2.5 h-2.5 bg-warm-amber/60 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
						</div>
						<p class="text-dusty-rose/60 text-lg animate-pulse">
							Waiting for second player...
						</p>
						<p class="text-dusty-rose/40 text-sm">
							Share the room code above with your partner
						</p>
					</div>
				</div>

				<!-- Leave button -->
				<button
					on:click={handleLeaveRoom}
					class="w-full py-3.5 bg-transparent border-2 border-red-500/40 text-red-400/80 rounded-xl
						hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-400
						transition-all duration-300 font-medium"
				>
					Leave Room
				</button>
			</div>

			<!-- Help text -->
			<p class="mt-6 text-center text-dusty-rose/40 text-sm">
				Need help? Share the room code via any messaging app
			</p>
		</div>
	</div>
</main>

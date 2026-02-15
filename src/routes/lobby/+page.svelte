<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import {
		connectSocket,
		currentRoom,
		players as socketPlayers,
		isConnected,
		joinRoom,
		disconnectSocket
	} from '$lib/socket';
	import type { Player } from '$lib/socket';
	import { get } from 'svelte/store';

	// Session data
	let roomCode = '';
	let playerName = '';
	let isHost = false;

	// Players in room - use store subscription
	$: players = $socketPlayers;
	$: connected = $isConnected;
	$: room = $currentRoom;

	let showPartnerNotification = false;
	let notificationTimeout: ReturnType<typeof setTimeout>;
	let hasJoinedRoom = false;
	let copySuccess = false;

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

			// Connect to socket server if not already connected
			connectSocket();

			// Check if already in room, otherwise rejoin
			setTimeout(async () => {
				const currentRoomValue = get(currentRoom);
				// If we already have room data from the store, we're already in the room
				if (currentRoomValue && currentRoomValue.code === roomCode) {
					console.log('Already in room, no need to rejoin');
					hasJoinedRoom = true;
					return;
				}

				// Otherwise, rejoin the room
				if (!hasJoinedRoom && roomCode && playerName) {
					console.log('Re-joining room from lobby page:', roomCode);
					const result = await joinRoom(roomCode, playerName);
					if (result.success) {
						hasJoinedRoom = true;
						console.log('Successfully joined room in lobby');
					} else {
						console.error('Failed to join room in lobby:', result.error);
					}
				}
			}, 300);
		}
	});

	// Watch for players joining
	$: if (players.length >= 2 && !showPartnerNotification && hasJoinedRoom) {
		showPartnerNotification = true;
		clearTimeout(notificationTimeout);
		notificationTimeout = setTimeout(() => {
			showPartnerNotification = false;
			// Redirect to game when both players are present
			goto('/game');
		}, 1500);
	}

	onDestroy(() => {
		clearTimeout(notificationTimeout);
	});

	async function handleLeaveRoom() {
		disconnectSocket();
		if (browser) {
			sessionStorage.clear();
		}
		goto('/');
	}

	async function copyRoomCode() {
		if (roomCode) {
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

	function handleStartGame() {
		goto('/game');
	}
</script>

<svelte:head>
	<title>Lobby - EscapeTwogether</title>
</svelte:head>

<!-- Professional Game Lobby -->
<main class="lobby-page page-enter" style="min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; position: relative; overflow: hidden; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); font-family: 'Inter', -apple-system, sans-serif; color: #fff;">
	<!-- Ambient background -->
	<div class="lobby-bg" aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden;">
		<div class="bg-gradient-layer" style="position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212, 175, 55, 0.1), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(201, 169, 166, 0.06), transparent);"></div>
	</div>

	<div class="lobby-container" style="width: 100%; max-width: 440px; position: relative; z-index: 1;">
		<!-- Header -->
		<header class="lobby-header stagger-1" style="text-align: center; margin-bottom: 2rem;">
			<div class="header-icon" aria-hidden="true" style="width: 48px; height: 48px; margin: 0 auto 1rem; color: #d4af37; filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.4));">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 100%; height: 100%;">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
					<circle cx="9" cy="7" r="4"/>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
				</svg>
			</div>
			<h1 class="header-title" style="font-family: 'Playfair Display', Georgia, serif; font-size: 2.25rem; font-weight: 700; color: #d4af37; margin: 0 0 0.5rem; letter-spacing: -0.01em; text-shadow: 0 2px 20px rgba(212, 175, 55, 0.2);">Game Lobby</h1>
			<p class="header-subtitle" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.6); margin: 0; letter-spacing: 0.03em;">
				{#if players.length >= 2}
					Ready to begin your escape
				{:else}
					Waiting for your partner
				{/if}
			</p>
		</header>

		<!-- Room Code Card -->
		<section class="room-card card-premium stagger-2" style="background: linear-gradient(145deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.85) 100%); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 2rem; margin-bottom: 1rem; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04); text-align: center;">
			<!-- Connection Status -->
			<div class="connection-indicator" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem;">
				<div class="status-pulse {connected ? 'connected' : ''}" style="width: 10px; height: 10px; border-radius: 50%; background: {connected ? '#4ade80' : '#ef4444'}; box-shadow: 0 0 10px {connected ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'};"></div>
				<span class="status-label" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255, 255, 255, 0.5);">{connected ? 'Connected' : 'Connecting...'}</span>
			</div>

			<!-- Room Code Display -->
			<div class="room-code-section" style="margin-bottom: 1.5rem;">
				<p class="room-label" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255, 255, 255, 0.4); margin: 0 0 0.75rem;">Room Code</p>
				<div class="room-code-display" style="display: inline-block; padding: 1rem 1.5rem; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);">
					<span class="room-code-value" style="font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 2.25rem; font-weight: 700; color: #d4af37; letter-spacing: 0.3em; text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">{roomCode}</span>
				</div>
				<p class="room-hint" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); margin: 0.75rem 0 0;">Share this code with your partner</p>
			</div>

			<!-- Copy Button -->
			<button
				on:click={copyRoomCode}
				class="copy-btn"
				class:success={copySuccess}
				aria-label="Copy room code"
				style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: {copySuccess ? 'rgba(74, 222, 128, 0.15)' : 'rgba(212, 175, 55, 0.1)'}; border: 1px solid {copySuccess ? 'rgba(74, 222, 128, 0.35)' : 'rgba(212, 175, 55, 0.25)'}; border-radius: 8px; color: {copySuccess ? '#4ade80' : '#d4af37'}; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.25s ease;"
			>
				{#if copySuccess}
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
					</svg>
					<span>Copied!</span>
				{:else}
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
					<span>Copy Code</span>
				{/if}
			</button>
		</section>

		<!-- Players Section -->
		<section class="players-card card-premium stagger-3" style="background: linear-gradient(145deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.85) 100%); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);">
			<div class="section-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
				<h2 class="section-title" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255, 255, 255, 0.45); margin: 0;">
					<svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; color: #d4af37;">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
					Players
				</h2>
				<span class="player-count" style="font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.625rem; background: rgba(212, 175, 55, 0.12); border-radius: 12px; color: #d4af37;">{players.length}/2</span>
			</div>

			<!-- Player Cards -->
			<ul class="players-list" role="list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">
				{#each players as player, index (player.id)}
					<li class="player-card" style="display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px;">
						<div class="player-avatar" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(212, 175, 55, 0.15)); color: #d4af37; font-weight: 700; font-size: 1rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
							{player.name.charAt(0).toUpperCase()}
						</div>
						<div class="player-details" style="flex: 1; display: flex; flex-direction: column; gap: 0.125rem;">
							<span class="player-name" style="font-size: 0.9rem; font-weight: 500; color: #fff;">{player.name}</span>
							{#if player.isHost}
								<span class="player-role" style="font-size: 0.65rem; color: #d4af37; text-transform: uppercase; letter-spacing: 0.1em;">Host</span>
							{/if}
						</div>
						<div class="player-status" style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">
							<div class="online-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);"></div>
							<span>Online</span>
						</div>
					</li>
				{:else}
					<li class="loading-players" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.5rem; color: rgba(255, 255, 255, 0.4); font-size: 0.875rem;">
						<span>Loading players...</span>
					</li>
				{/each}

				<!-- Empty Player Slot -->
				{#if players.length < 2}
					<li class="empty-slot" aria-label="Waiting for second player" style="display: flex; align-items: center; justify-content: center; gap: 0.875rem; padding: 1rem; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 10px;">
						<div class="slot-avatar" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.3);">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 20px; height: 20px;">
								<path d="M12 5v14m7-7H5"/>
							</svg>
						</div>
						<span class="slot-text" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.35);">Waiting for partner...</span>
					</li>
				{/if}
			</ul>
		</section>

		<!-- Status / Action Section -->
		<section class="action-card card-premium stagger-4" style="background: linear-gradient(145deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.85) 100%); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04); text-align: center;">
			{#if players.length >= 2}
				<!-- Ready State -->
				<div class="ready-state" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
					<div class="ready-indicator" style="display: flex; align-items: center; gap: 0.625rem;">
						<div class="ready-check" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(74, 222, 128, 0.15); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; color: #4ade80;">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
						<span class="ready-text" style="font-size: 0.9rem; font-weight: 500; color: #4ade80;">Ready to start!</span>
					</div>

					<!-- Partner Notification -->
					{#if showPartnerNotification}
						<div class="partner-notification" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.25); border-radius: 8px; color: #4ade80; font-size: 0.85rem;">
							<div class="notification-icon" style="width: 18px; height: 18px;">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;">
									<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
									<path stroke-linecap="round" stroke-linejoin="round" d="M22 4L12 14.01l-3-3"/>
								</svg>
							</div>
							<span>Partner joined! Starting game...</span>
						</div>
					{/if}

					<button
						on:click={handleStartGame}
						class="start-btn btn-premium"
						style="width: 100%; padding: 1rem 1.5rem; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); border: none; border-radius: 12px; color: #0f0f23; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.625rem; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2); transition: all 0.3s ease;"
					>
						<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
							<polygon points="5 3 19 12 5 21 5 3"/>
						</svg>
						<span>Start Game</span>
					</button>
				</div>
			{:else}
				<!-- Waiting State -->
				<div class="waiting-state" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
					<div class="waiting-animation" style="padding: 0.5rem;">
						<div class="dots-loader large" style="display: flex; gap: 6px;">
							<span style="width: 10px; height: 10px; border-radius: 50%; background: #d4af37; animation: dotsBounce 1.4s ease-in-out infinite;"></span>
							<span style="width: 10px; height: 10px; border-radius: 50%; background: #d4af37; animation: dotsBounce 1.4s ease-in-out infinite 0.16s;"></span>
							<span style="width: 10px; height: 10px; border-radius: 50%; background: #d4af37; animation: dotsBounce 1.4s ease-in-out infinite 0.32s;"></span>
						</div>
					</div>
					<p class="waiting-text" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); margin: 0;">Waiting for partner...</p>
					<p class="waiting-hint" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); margin: 0;">Share the room code above with a friend</p>
				</div>
			{/if}
		</section>

		<!-- Leave Button -->
		<div class="leave-section stagger-5" style="text-align: center; margin-top: 1rem;">
			<button
				on:click={handleLeaveRoom}
				class="leave-btn"
				aria-label="Leave room"
				style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1rem; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; cursor: pointer; transition: all 0.25s ease;"
			>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
				</svg>
				<span>Leave Room</span>
			</button>
		</div>

		<!-- Footer -->
		<footer class="lobby-footer" style="text-align: center; margin-top: 2rem;">
			<p style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.25); margin: 0; letter-spacing: 0.1em;">EscapeTwogether</p>
		</footer>
	</div>
</main>

<style>
	/* Keyframe animations - must be in style block */
	@keyframes dotsBounce {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}

	/* Hover effects */
	.copy-btn:hover {
		background: rgba(212, 175, 55, 0.15) !important;
		border-color: rgba(212, 175, 55, 0.35) !important;
		transform: translateY(-1px);
	}

	.start-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(212, 175, 55, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
	}

	.leave-btn:hover {
		background: rgba(255, 255, 255, 0.05) !important;
		border-color: rgba(255, 255, 255, 0.2) !important;
		color: rgba(255, 255, 255, 0.8) !important;
	}

	.player-card:hover {
		background: rgba(255, 255, 255, 0.04) !important;
		border-color: rgba(255, 255, 255, 0.1) !important;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.header-title { font-size: 1.875rem !important; }
		.room-code-value { font-size: 1.75rem !important; }
	}
</style>

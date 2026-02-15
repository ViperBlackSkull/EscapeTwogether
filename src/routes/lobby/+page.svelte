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
<main class="lobby-page page-enter">
	<!-- Ambient background -->
	<div class="lobby-bg" aria-hidden="true">
		<div class="bg-gradient-layer"></div>
		<div class="particle particle-1"></div>
		<div class="particle particle-2"></div>
	</div>

	<div class="lobby-container">
		<!-- Header -->
		<header class="lobby-header stagger-1">
			<div class="header-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
					<circle cx="9" cy="7" r="4"/>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
				</svg>
			</div>
			<h1 class="header-title">Game Lobby</h1>
			<p class="header-subtitle">
				{#if players.length >= 2}
					Ready to begin your escape
				{:else}
					Waiting for your partner
				{/if}
			</p>
		</header>

		<!-- Room Code Card -->
		<section class="room-card card-premium stagger-2">
			<!-- Connection Status -->
			<div class="connection-indicator">
				<div class="status-pulse {connected ? 'connected' : ''}"></div>
				<span class="status-label">{connected ? 'Connected' : 'Connecting...'}</span>
			</div>

			<!-- Room Code Display -->
			<div class="room-code-section">
				<p class="room-label">Room Code</p>
				<div class="room-code-display">
					<span class="room-code-value">{roomCode}</span>
				</div>
				<p class="room-hint">Share this code with your partner</p>
			</div>

			<!-- Copy Button -->
			<button
				on:click={copyRoomCode}
				class="copy-btn"
				class:success={copySuccess}
				aria-label="Copy room code"
			>
				{#if copySuccess}
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
					</svg>
					<span>Copied!</span>
				{:else}
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
					<span>Copy Code</span>
				{/if}
			</button>
		</section>

		<!-- Players Section -->
		<section class="players-card card-premium stagger-3">
			<div class="section-header">
				<h2 class="section-title">
					<svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
					Players
				</h2>
				<span class="player-count">{players.length}/2</span>
			</div>

			<!-- Player Cards -->
			<ul class="players-list" role="list">
				{#each players as player, index (player.id)}
					<li class="player-card">
						<div class="player-avatar" style="--avatar-gradient: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(212, 175, 55, 0.15));">
							{player.name.charAt(0).toUpperCase()}
						</div>
						<div class="player-details">
							<span class="player-name">{player.name}</span>
							{#if player.isHost}
								<span class="player-role">Host</span>
							{/if}
						</div>
						<div class="player-status">
							<div class="online-dot"></div>
							<span>Online</span>
						</div>
					</li>
				{:else}
					<li class="loading-players">
						<div class="dots-loader">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<span>Loading players...</span>
					</li>
				{/each}

				<!-- Empty Player Slot -->
				{#if players.length < 2}
					<li class="empty-slot" aria-label="Waiting for second player">
						<div class="slot-avatar">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M12 5v14m7-7H5"/>
							</svg>
						</div>
						<span class="slot-text">Waiting for partner...</span>
					</li>
				{/if}
			</ul>
		</section>

		<!-- Status / Action Section -->
		<section class="action-card card-premium stagger-4">
			{#if players.length >= 2}
				<!-- Ready State -->
				<div class="ready-state">
					<div class="ready-indicator">
						<div class="ready-check">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
						<span class="ready-text">Ready to start!</span>
					</div>

					<!-- Partner Notification -->
					{#if showPartnerNotification}
						<div class="partner-notification">
							<div class="notification-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
					>
						<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="5 3 19 12 5 21 5 3"/>
						</svg>
						<span>Start Game</span>
					</button>
				</div>
			{:else}
				<!-- Waiting State -->
				<div class="waiting-state">
					<div class="waiting-animation">
						<div class="dots-loader large">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
					<p class="waiting-text">Waiting for partner...</p>
					<p class="waiting-hint">Share the room code above with a friend</p>
				</div>
			{/if}
		</section>

		<!-- Leave Button -->
		<div class="leave-section stagger-5">
			<button
				on:click={handleLeaveRoom}
				class="leave-btn"
				aria-label="Leave room"
			>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
				</svg>
				<span>Leave Room</span>
			</button>
		</div>

		<!-- Footer -->
		<footer class="lobby-footer">
			<p>EscapeTwogether</p>
		</footer>
	</div>
</main>

<style>
	/* Premium Lobby Styles */
	.lobby-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%);
	}

	/* Ambient Background */
	.lobby-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.bg-gradient-layer {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212, 175, 55, 0.1), transparent),
			radial-gradient(ellipse 60% 40% at 100% 100%, rgba(201, 169, 166, 0.06), transparent),
			radial-gradient(ellipse 50% 30% at 0% 80%, rgba(74, 155, 140, 0.04), transparent);
	}

	.particle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: #d4af37;
		border-radius: 50%;
		opacity: 0.3;
		animation: floatParticle 15s ease-in-out infinite;
	}

	.particle-1 {
		top: 15%;
		left: 10%;
		animation-delay: 0s;
	}

	.particle-2 {
		bottom: 20%;
		right: 15%;
		animation-delay: 5s;
		opacity: 0.2;
	}

	@keyframes floatParticle {
		0%, 100% { transform: translate(0, 0); opacity: 0.3; }
		25% { transform: translate(15px, -20px); opacity: 0.5; }
		50% { transform: translate(-10px, -10px); opacity: 0.3; }
		75% { transform: translate(20px, -25px); opacity: 0.4; }
	}

	/* Container */
	.lobby-container {
		width: 100%;
		max-width: 440px;
		position: relative;
		z-index: 1;
	}

	/* Header */
	.lobby-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		color: #d4af37;
		filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.4));
	}

	.header-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 2.25rem;
		font-weight: 700;
		color: #d4af37;
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
		text-shadow: 0 2px 20px rgba(212, 175, 55, 0.2);
	}

	.header-subtitle {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		letter-spacing: 0.03em;
	}

	/* Premium Card */
	.card-premium {
		background: linear-gradient(
			145deg,
			rgba(26, 26, 46, 0.9) 0%,
			rgba(22, 33, 62, 0.85) 100%
		);
		border: 1px solid rgba(212, 175, 55, 0.15);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card-premium:hover {
		border-color: rgba(212, 175, 55, 0.25);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.4),
			0 0 30px rgba(212, 175, 55, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	/* Room Code Card */
	.room-card {
		text-align: center;
		padding: 2rem;
	}

	/* Connection Indicator */
	.connection-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.status-pulse {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ef4444;
		box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
		animation: pulse 2s ease-in-out infinite;
	}

	.status-pulse.connected {
		background: #4ade80;
		box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(0.9); }
	}

	.status-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.5);
	}

	/* Room Code Display */
	.room-code-section {
		margin-bottom: 1.5rem;
	}

	.room-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: 0.75rem;
	}

	.room-code-display {
		display: inline-block;
		padding: 1rem 1.5rem;
		background: rgba(212, 175, 55, 0.08);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 12px;
		box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
	}

	.room-code-value {
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
		font-size: 2.25rem;
		font-weight: 700;
		color: #d4af37;
		letter-spacing: 0.3em;
		text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
	}

	.room-hint {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.35);
		margin-top: 0.75rem;
	}

	/* Copy Button */
	.copy-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 8px;
		color: #d4af37;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s ease;
	}

	.copy-btn:hover {
		background: rgba(212, 175, 55, 0.15);
		border-color: rgba(212, 175, 55, 0.35);
		transform: translateY(-1px);
	}

	.copy-btn.success {
		background: rgba(74, 222, 128, 0.15);
		border-color: rgba(74, 222, 128, 0.35);
		color: #4ade80;
	}

	.copy-btn .btn-icon {
		width: 16px;
		height: 16px;
	}

	/* Players Card */
	.players-card {
		padding: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.45);
		margin: 0;
	}

	.title-icon {
		width: 14px;
		height: 14px;
		color: #d4af37;
	}

	.player-count {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		background: rgba(212, 175, 55, 0.12);
		border-radius: 12px;
		color: #d4af37;
	}

	/* Players List */
	.players-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.player-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.player-card:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.player-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--avatar-gradient, linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(212, 175, 55, 0.1)));
		color: #d4af37;
		font-weight: 700;
		font-size: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.player-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.player-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: #fff;
	}

	.player-role {
		font-size: 0.65rem;
		color: #d4af37;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.player-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.online-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4ade80;
		box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
	}

	/* Loading Players */
	.loading-players {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.875rem;
	}

	.dots-loader {
		display: flex;
		gap: 6px;
	}

	.dots-loader span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #d4af37;
		animation: dotsBounce 1.4s ease-in-out infinite;
	}

	.dots-loader.large span {
		width: 10px;
		height: 10px;
	}

	.dots-loader span:nth-child(1) { animation-delay: 0s; }
	.dots-loader span:nth-child(2) { animation-delay: 0.16s; }
	.dots-loader span:nth-child(3) { animation-delay: 0.32s; }

	@keyframes dotsBounce {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}

	/* Empty Slot */
	.empty-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.875rem;
		padding: 1rem;
		border: 1px dashed rgba(255, 255, 255, 0.12);
		border-radius: 10px;
	}

	.slot-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.3);
	}

	.slot-avatar svg {
		width: 20px;
		height: 20px;
	}

	.slot-text {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.35);
	}

	/* Action Card */
	.action-card {
		padding: 1.5rem;
		text-align: center;
	}

	/* Ready State */
	.ready-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.ready-indicator {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.ready-check {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(74, 222, 128, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
	}

	.ready-check svg {
		width: 16px;
		height: 16px;
		color: #4ade80;
	}

	.ready-text {
		font-size: 0.9rem;
		font-weight: 500;
		color: #4ade80;
	}

	/* Partner Notification */
	.partner-notification {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(74, 222, 128, 0.1);
		border: 1px solid rgba(74, 222, 128, 0.25);
		border-radius: 8px;
		color: #4ade80;
		font-size: 0.85rem;
		animation: celebrationGlow 1.5s ease-in-out infinite;
	}

	.notification-icon {
		width: 18px;
		height: 18px;
	}

	@keyframes celebrationGlow {
		0%, 100% { box-shadow: 0 0 10px rgba(74, 222, 128, 0.2); }
		50% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.4); }
	}

	/* Start Button */
	.start-btn {
		width: 100%;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
		border: none;
		border-radius: 12px;
		color: #0f0f23;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
		box-shadow:
			0 4px 20px rgba(212, 175, 55, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.start-btn:hover {
		transform: translateY(-2px);
		box-shadow:
			0 8px 30px rgba(212, 175, 55, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.start-btn:active {
		transform: translateY(0);
	}

	.start-btn .btn-icon {
		width: 18px;
		height: 18px;
	}

	/* Waiting State */
	.waiting-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.waiting-animation {
		padding: 0.5rem;
	}

	.waiting-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.65);
	}

	.waiting-hint {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.35);
	}

	/* Leave Section */
	.leave-section {
		text-align: center;
		margin-top: 1rem;
	}

	.leave-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.25s ease;
	}

	.leave-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.8);
	}

	.leave-btn .btn-icon {
		width: 16px;
		height: 16px;
	}

	/* Footer */
	.lobby-footer {
		text-align: center;
		margin-top: 2rem;
	}

	.lobby-footer p {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
		margin: 0;
		letter-spacing: 0.1em;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.lobby-page {
			padding: 1rem;
		}

		.header-title {
			font-size: 1.875rem;
		}

		.room-code-value {
			font-size: 1.75rem;
		}

		.card-premium {
			padding: 1.25rem;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		*, *::before, *::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}

		.particle {
			display: none;
		}
	}
</style>

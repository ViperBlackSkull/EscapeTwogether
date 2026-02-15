<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createRoom, joinRoom, connectSocket, isConnected } from '$lib/socket';
	import { soundManager } from '$lib/audio';

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

	// Play button click sound
	function playClickSound() {
		soundManager.playClick();
	}

	// Handle create room
	async function handleCreateRoom() {
		playClickSound();

		if (!playerName.trim()) {
			errorMessage = 'Please enter your name';
			soundManager.playPuzzleError();
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
				soundManager.playNotification();
				goto('/lobby');
			} else {
				errorMessage = result.error || 'Failed to create room';
				soundManager.playPuzzleError();
			}
		} catch (e) {
			errorMessage = 'Connection error. Please try again.';
			soundManager.playPuzzleError();
		} finally {
			isLoading = false;
		}
	}

	// Handle join room
	async function handleJoinRoom() {
		playClickSound();

		if (!playerName.trim()) {
			errorMessage = 'Please enter your name';
			soundManager.playPuzzleError();
			return;
		}

		if (!roomCode.trim()) {
			errorMessage = 'Please enter a room code';
			soundManager.playPuzzleError();
			return;
		}

		if (!ROOM_CODE_REGEX.test(roomCode.trim())) {
			errorMessage = 'Room code must be 4 characters (letters and numbers)';
			soundManager.playPuzzleError();
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
				soundManager.playPlayerJoin();
				goto('/lobby');
			} else {
				errorMessage = result.error || 'Failed to join room';
				soundManager.playPuzzleError();
			}
		} catch (e) {
			errorMessage = 'Connection error. Please try again.';
			soundManager.playPuzzleError();
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
	<title>EscapeTwogether - Cooperative Puzzle Adventure</title>
	<meta name="description" content="A cooperative puzzle escape game. Work together to solve mysteries." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
</svelte:head>

<main class="landing page-enter" style="min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%); color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; overflow: hidden;">
	<!-- Ambient background with subtle particles -->
	<div class="bg-gradient" style="position: absolute; inset: 0; background: radial-gradient(ellipse 100% 60% at 50% -30%, rgba(212, 175, 55, 0.15), transparent), radial-gradient(ellipse 80% 50% at 80% 100%, rgba(201, 169, 166, 0.1), transparent); pointer-events: none;"></div>

	<!-- Decorative elements -->
	<div style="position: absolute; top: 10%; left: 5%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%); pointer-events: none;"></div>
	<div style="position: absolute; bottom: 10%; right: 5%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(74, 155, 140, 0.06) 0%, transparent 70%); pointer-events: none;"></div>

	<div class="ambient-particles" aria-hidden="true">
		<div class="particle particle-1"></div>
		<div class="particle particle-2"></div>
		<div class="particle particle-3"></div>
	</div>

	<!-- Main content container -->
	<div class="container" style="width: 100%; max-width: 440px; display: flex; flex-direction: column; align-items: center; gap: 28px; position: relative; z-index: 1;">
		<!-- Hero Section -->
		<section class="hero stagger-1" style="text-align: center;">
			<div class="title-wrapper" style="display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 16px;">
				<div class="title-icon" style="width: 48px; height: 48px; color: #d4af37; filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.5));" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 100%; height: 100%;">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
						<polyline points="10 17 15 12 10 7"/>
						<line x1="15" y1="12" x2="3" y2="12"/>
					</svg>
				</div>
				<h1 class="title" style="font-family: 'Playfair Display', Georgia, serif; font-size: 2.75rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; line-height: 1.1; background: linear-gradient(135deg, #ffffff 0%, #d4af37 50%, #ffffff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">EscapeTwogether</h1>
			</div>
			<p class="tagline" style="font-size: 1.2rem; color: rgba(255,255,255,0.7); margin: 0; font-weight: 400; letter-spacing: 0.03em;">Solve puzzles. Work together. Escape as one.</p>
		</section>

		<!-- Connection Status -->
		<div class="connection-status stagger-2" role="status" aria-live="polite" style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: rgba(255,255,255,0.5); padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 24px; border: 1px solid rgba(255,255,255,0.06);">
			<span class="status-dot" class:connected style="width: 8px; height: 8px; border-radius: 50%; background-color: {connected ? '#22c55e' : '#ef4444'}; box-shadow: 0 0 8px {connected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}; transition: background-color 0.3s;"></span>
			<span class="status-text">{connected ? 'Connected' : 'Connecting...'}</span>
		</div>

		<!-- Main Card -->
		<div class="card card-premium stagger-3" style="width: 100%; background: linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.9) 100%); border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255,255,255,0.05); border: 1px solid rgba(212, 175, 55, 0.15); backdrop-filter: blur(12px);">
			<!-- Error Message -->
			{#if errorMessage}
				<div class="error-message shake-error" role="alert" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; margin-bottom: 20px;">
					<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style="width: 18px; height: 18px; flex-shrink: 0;">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
					</svg>
					{errorMessage}
				</div>
			{/if}

			<!-- Form -->
			<form class="form" on:submit|preventDefault={() => {}} style="display: flex; flex-direction: column; gap: 18px;">
				<!-- Name Input -->
				<div class="input-group" style="display: flex; flex-direction: column; gap: 8px;">
					<label for="playerName" class="label" style="font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.7);">Your Name</label>
					<div class="input-wrapper" style="position: relative;">
						<input
							type="text"
							id="playerName"
							bind:value={playerName}
							on:keypress={(e) => handleKeyPress(e, 'create')}
							placeholder="Enter your name"
							maxlength={20}
							autocomplete="name"
							style="width: 100%; padding: 14px 16px; background: rgba(15, 15, 35, 0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #fff; font-size: 1rem; font-family: inherit; transition: all 0.25s; outline: none;"
						/>
					</div>
				</div>

				<!-- Create Room Button -->
				<button
					type="button"
					on:click={handleCreateRoom}
					disabled={isLoading}
					style="width: 100%; padding: 15px 24px; border-radius: 10px; font-size: 1rem; font-weight: 600; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; outline: none; background: linear-gradient(135deg, #d4af37 0%, #b8962f 100%); color: #0f0f23; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255,255,255,0.2); transition: all 0.3s;"
				>
					{#if isLoading}
						<span style="width: 18px; height: 18px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
						Creating...
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 18px; height: 18px;">
							<path d="M12 5v14M5 12h14"/>
						</svg>
						Create Room
					{/if}
				</button>

				<!-- Divider -->
				<div class="divider" style="display: flex; align-items: center; gap: 16px; color: rgba(255,255,255,0.4); font-size: 0.85rem;">
					<span style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);"></span>
					<span>or</span>
					<span style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);"></span>
				</div>

				<!-- Room Code Input -->
				<div class="input-group" style="display: flex; flex-direction: column; gap: 8px;">
					<label for="roomCode" class="label" style="font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.7);">Room Code</label>
					<div class="input-wrapper" style="position: relative;">
						<input
							type="text"
							id="roomCode"
							bind:value={roomCode}
							on:keypress={(e) => handleKeyPress(e, 'join')}
							placeholder="ABCD"
							maxlength={4}
							autocomplete="off"
							style="width: 100%; padding: 14px 16px; background: rgba(15, 15, 35, 0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #fff; font-size: 1.25rem; font-weight: 600; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; text-align: center; letter-spacing: 0.4em; transition: all 0.25s; outline: none;"
						/>
					</div>
				</div>

				<!-- Join Room Button -->
				<button
					type="button"
					on:click={handleJoinRoom}
					disabled={isLoading}
					style="width: 100%; padding: 15px 24px; border-radius: 10px; font-size: 1rem; font-weight: 600; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid rgba(255,255,255,0.15); outline: none; background: rgba(255,255,255,0.04); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s;"
				>
					{#if isLoading}
						<span style="width: 18px; height: 18px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
						Joining...
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 18px; height: 18px;">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
							<polyline points="10 17 15 12 10 7"/>
							<line x1="15" y1="12" x2="3" y2="12"/>
						</svg>
						Join Room
					{/if}
				</button>
			</form>
		</div>

		<!-- Footer -->
		<footer class="footer stagger-4" style="text-align: center;">
			<p style="font-size: 0.9rem; color: rgba(255,255,255,0.4); margin: 0; letter-spacing: 0.02em;">A cooperative puzzle game for two players</p>
		</footer>
	</div>

	<style>
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
		input:focus {
			border-color: #d4af37 !important;
			box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15), 0 0 20px rgba(212, 175, 55, 0.1) !important;
		}
		input::placeholder {
			color: rgba(255,255,255,0.35);
		}
		button:hover:not(:disabled) {
			transform: translateY(-2px);
		}
		button:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
	</style>
</main>

<style>
	/* CSS Variables */
	:global(:root) {
		--color-bg: #0f0f23;
		--color-bg-card: #1a1a2e;
		--color-gold: #d4af37;
		--color-gold-hover: #e5c04a;
		--color-gold-dark: #b8962f;
		--color-text: #ffffff;
		--color-text-muted: rgba(255, 255, 255, 0.6);
		--color-text-dim: rgba(255, 255, 255, 0.4);
		--color-border: rgba(255, 255, 255, 0.1);
		--color-error: #ef4444;
		--color-success: #22c55e;
		--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
		--shadow-md: 0 4px 24px rgba(0, 0, 0, 0.4);
		--shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.5);
		--radius-sm: 8px;
		--radius-md: 12px;
		--radius-lg: 16px;
	}

	/* Base Styles */
	.landing {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%);
		color: var(--color-text);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		position: relative;
		overflow: hidden;
	}

	/* Gradient Background with more depth */
	.bg-gradient {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 100% 60% at 50% -30%, rgba(212, 175, 55, 0.12), transparent),
			radial-gradient(ellipse 80% 50% at 80% 100%, rgba(201, 169, 166, 0.08), transparent),
			radial-gradient(ellipse 60% 40% at 10% 80%, rgba(74, 155, 140, 0.05), transparent);
		pointer-events: none;
	}

	/* Ambient floating particles */
	.ambient-particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.particle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: var(--color-gold);
		border-radius: 50%;
		opacity: 0.3;
		animation: floatParticle 12s ease-in-out infinite;
	}

	.particle-1 {
		top: 20%;
		left: 15%;
		animation-delay: 0s;
	}

	.particle-2 {
		top: 60%;
		right: 20%;
		animation-delay: 4s;
		opacity: 0.2;
	}

	.particle-3 {
		bottom: 30%;
		left: 25%;
		animation-delay: 8s;
		opacity: 0.25;
	}

	@keyframes floatParticle {
		0%, 100% {
			transform: translateY(0) translateX(0);
			opacity: 0.3;
		}
		25% {
			transform: translateY(-20px) translateX(10px);
			opacity: 0.5;
		}
		50% {
			transform: translateY(-10px) translateX(-10px);
			opacity: 0.3;
		}
		75% {
			transform: translateY(-30px) translateX(5px);
			opacity: 0.4;
		}
	}

	/* Container */
	.container {
		width: 100%;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
		position: relative;
		z-index: 1;
	}

	/* Hero Section */
	.hero {
		text-align: center;
	}

	.title-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.title-icon {
		width: 40px;
		height: 40px;
		color: var(--color-gold);
		filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.4));
	}

	.title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--color-text);
		margin: 0;
		line-height: 1.1;
		text-shadow: 0 2px 20px rgba(212, 175, 55, 0.15);
	}

	.tagline {
		font-size: 1.125rem;
		color: var(--color-text-muted);
		margin: 0;
		font-weight: 400;
		letter-spacing: 0.02em;
	}

	/* Connection Status */
	.connection-status {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: var(--color-text-dim);
		padding: 6px 14px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--color-error);
		transition: background-color 0.3s ease;
		box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
	}

	.status-dot.connected {
		background-color: var(--color-success);
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
	}

	/* Premium Card */
	.card {
		width: 100%;
		background: linear-gradient(
			145deg,
			rgba(26, 26, 46, 0.95) 0%,
			rgba(22, 33, 62, 0.9) 100%
		);
		border-radius: var(--radius-lg);
		padding: 32px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(212, 175, 55, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(212, 175, 55, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card-premium:hover {
		border-color: rgba(212, 175, 55, 0.25);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(212, 175, 55, 0.15),
			0 0 30px rgba(212, 175, 55, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	/* Error Message */
	.error-message {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		margin-bottom: 24px;
		text-align: center;
	}

	.error-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Input Group */
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
		letter-spacing: 0.01em;
	}

	/* Input Wrapper for glow effect */
	.input-wrapper {
		position: relative;
	}

	/* Premium Input */
	.input {
		width: 100%;
		padding: 14px 16px;
		background: rgba(15, 15, 35, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
		outline: none;
		position: relative;
	}

	.input::placeholder {
		color: var(--color-text-dim);
	}

	.input:hover {
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(15, 15, 35, 0.8);
	}

	.input:focus {
		border-color: var(--color-gold);
		background: rgba(15, 15, 35, 0.9);
		box-shadow:
			0 0 0 3px rgba(212, 175, 55, 0.15),
			0 0 20px rgba(212, 175, 55, 0.1);
	}

	.input-glow {
		position: absolute;
		inset: 0;
		border-radius: var(--radius-sm);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
		box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
	}

	.input:focus + .input-glow {
		opacity: 1;
	}

	.input-code {
		text-transform: uppercase;
		text-align: center;
		letter-spacing: 0.5em;
		font-size: 1.25rem;
		font-weight: 600;
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
	}

	/* Premium Buttons */
	.btn {
		width: 100%;
		padding: 14px 24px;
		border-radius: var(--radius-sm);
		font-size: 1rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: none;
		outline: none;
		position: relative;
		overflow: hidden;
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.2s ease;
	}

	.btn:hover .btn-icon {
		transform: scale(1.1);
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
		color: #0f0f23;
		box-shadow:
			0 4px 15px rgba(212, 175, 55, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.btn-primary::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--color-gold-hover) 0%, var(--color-gold) 100%);
		box-shadow:
			0 8px 25px rgba(212, 175, 55, 0.45),
			0 4px 12px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
	}

	.btn-primary:hover:not(:disabled)::before {
		opacity: 1;
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
		box-shadow:
			0 2px 10px rgba(212, 175, 55, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-text);
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.btn-secondary:active:not(:disabled) {
		transform: translateY(0);
	}

	/* Divider */
	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
	}

	/* Premium Spinner */
	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: elegantSpin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes elegantSpin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Footer */
	.footer {
		text-align: center;
	}

	.footer p {
		font-size: 0.875rem;
		color: var(--color-text-dim);
		margin: 0;
		letter-spacing: 0.02em;
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.landing {
			padding: 16px;
		}

		.container {
			gap: 24px;
		}

		.title-wrapper {
			gap: 8px;
		}

		.title-icon {
			width: 32px;
			height: 32px;
		}

		.title {
			font-size: 2.25rem;
		}

		.tagline {
			font-size: 1rem;
		}

		.card {
			padding: 24px;
		}

		.form {
			gap: 16px;
		}

		.input {
			padding: 12px 14px;
		}

		.btn {
			padding: 12px 20px;
		}
	}

	/* Accessibility - Focus visible */
	.btn:focus-visible {
		outline: 2px solid var(--color-gold);
		outline-offset: 3px;
		box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
	}

	.input:focus-visible {
		outline: none;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.hero,
		.card,
		.footer,
		.connection-status {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}

		.spinner {
			animation: none !important;
		}

		.btn,
		.input,
		.card {
			transition: none !important;
		}

		.particle {
			animation: none !important;
		}
	}
</style>

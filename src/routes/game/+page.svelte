<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import ActivePuzzle from '$lib/components/ActivePuzzle.svelte';
	import Chat from '$lib/components/Chat.svelte';
	import HintModal from '$lib/components/HintModal.svelte';
	import RoomTransition from '$lib/components/RoomTransition.svelte';
	import DefeatScreen from '$lib/components/DefeatScreen.svelte';
	import StoryNarrative from '$lib/components/StoryNarrative.svelte';
	import VictoryScreen from '$lib/components/VictoryScreen.svelte';
	import RoleIndicator from '$lib/components/RoleIndicator.svelte';
	import RoleBadge from '$lib/components/RoleBadge.svelte';
	import RolePrompt from '$lib/components/RolePrompt.svelte';
	import AudioSettings from '$lib/components/AudioSettings.svelte';
	import {
		currentRoom,
		players,
		isConnected,
		disconnectSocket,
		joinRoom,
		connectSocket,
		lastGameAction,
		emitGameAction
	} from '$lib/socket';
	import type { Player } from '$lib/socket';
	import { soundManager } from '$lib/audio';
	import { gameState, useHint, setGamePhase, setCurrentRoom, completeRoom, isGameCompleted } from '$lib/stores/gameState';
	import { getGameFlowCoordinator } from '$lib/gameFlowCoordinator';
	import { currentPlayerRole, performRoleSwap, roleNotification } from '$lib/stores/roles';
	import { preferences, difficultyDescription } from '$lib/stores/preferences';
	import { narrativeManager, currentNarrative } from '$lib/utils/narrativeManager';
	import { getHintsForPuzzle } from '$lib/data/hints';
	import type { PuzzleHint } from '$lib/types';

	// Inventory state
	let inventory: { id: string; name: string; icon: string; description: string }[] = [];

	// UI state
	let chatExpanded = true;
	let showSettings = false;
	let showMobileSheet = false;
	let mobileSheetTab: 'players' | 'chat' | 'inventory' = 'players';
	let isMobile = false;
	let showRolePrompt = false;

	// Hint system state
	let showHintModal = false;
	let currentPuzzleName = 'Select a Puzzle';
	let currentPuzzleId = '';
	let currentPuzzleHints: PuzzleHint[] = [];
	let currentAttempts = 0;
	let hintsRemaining = 3;

	// Room transition state
	let showRoomTransition = false;
	let transitionFromRoom = '';
	let transitionToRoom = '';
	let currentRoomId = 'attic';

	// Story narrative state
	let showStoryNarrative = false;
	let storyNarrativeType: 'intro' | 'discovery' | 'completion' = 'intro';
	let storyRoomId = 'attic';
	let storyNarrativeText = '';

	// Victory/Defeat state
	let showVictoryScreen = false;
	let showDefeatScreen = false;
	let defeatReason: 'timeout' | 'disconnected' | 'abandoned' = 'timeout';

	// Timer state
	let elapsedSeconds = 0;
	let timerInterval: ReturnType<typeof setInterval>;

	// Game Loop state
	let activePuzzleId: string | null = null;
	let isGameActive = false;
	let bothPlayersReady = false;

	// Session data
	let roomCode = '';
	let playerName = '';
	let hasJoinedRoom = false;

	// Game flow coordinator
	let gameFlowCoordinator = getGameFlowCoordinator();

	$: room = $currentRoom;
	$: playerList = $players;
	$: connected = $isConnected;

	// Subscribe to narrative manager
	$: if ($currentNarrative) {
		showStoryNarrative = $currentNarrative.text !== '';
		storyNarrativeText = $currentNarrative.text;
		storyRoomId = $currentNarrative.roomId;
		storyNarrativeType = $currentNarrative.type;
	}

	// Format timer as MM:SS
	$: timerDisplay = formatTime(elapsedSeconds);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Redirect if not in a room after connection attempt
	$: if (browser && !room && !connected && hasJoinedRoom) {
		goto('/');
	}

	onMount(() => {
		// Detect mobile
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

		// Handle resize
		const handleResize = () => {
			isMobile = window.innerWidth < 768;
		};
		window.addEventListener('resize', handleResize);

		// Start timer
		timerInterval = setInterval(() => {
			elapsedSeconds++;
		}, 1000);

		// Load sample inventory items for demo
		inventory = [
			{ id: '1', name: 'Rusty Key', icon: '🔑', description: 'An old rusty key' },
			{ id: '2', name: 'Flashlight', icon: '🔦', description: 'Battery-powered light' },
			{ id: '3', name: 'Note', icon: '📜', description: 'Cryptic writing' }
		];

		// Get session data and rejoin room if needed
		if (browser) {
			roomCode = sessionStorage.getItem('roomCode') || '';
			playerName = sessionStorage.getItem('playerName') || '';

			if (!roomCode) {
				goto('/');
				return;
			}

			connectSocket();

			setTimeout(async () => {
				if (!hasJoinedRoom && roomCode && playerName) {
					console.log('Re-joining room from game page:', roomCode);
					const result = await joinRoom(roomCode, playerName);
					if (result.success) {
						hasJoinedRoom = true;
						console.log('Successfully rejoined room in game');
					} else {
						console.error('Failed to rejoin room in game:', result.error);
					}
				}
			}, 300);
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			if (timerInterval) clearInterval(timerInterval);
		};
	});

	// Subscribe to game actions from other player
	$: if ($lastGameAction) {
		console.log('Received game action from other player:', $lastGameAction);
		handleRemoteGameAction($lastGameAction);
	}

	// Monitor player count for game initialization
	$: if ($players.length === 2 && !isGameActive && !bothPlayersReady) {
		bothPlayersReady = true;
		initializeGameplay();
	}

	// Subscribe to game completion
	$: if ($isGameCompleted && isGameActive) {
		isGameActive = false;
		handleGameCompletion();
	}

	function initializeGameplay() {
		if (!bothPlayersReady) return;

		console.log('Initializing gameplay with both players');
		isGameActive = true;

		// Initialize game flow coordinator
		gameFlowCoordinator.initializeGame();

		// Set game phase to playing
		setGamePhase('playing');

		// Start gameplay sounds
		soundManager.playGameStart();

		// Show intro narrative for current room
		storyNarrativeType = 'intro';
		storyRoomId = currentRoomId;
		showStoryNarrative = true;
	}

	function handleGameCompletion() {
		const progress = gameFlowCoordinator.getGameProgress();

		if (progress.rooms.completed === progress.rooms.total) {
			// Victory!
			triggerVictory();
		} else {
			// Defeat (timeout or other)
			triggerDefeat('timeout');
		}
	}

	function handleRemoteGameAction(action: { action: string; payload: any }) {
		switch (action.action) {
			case 'interact':
				console.log('Remote player interacted with:', action.payload);
				break;
			case 'puzzle_click':
				console.log('Remote player clicked puzzle:', action.payload);
				break;
			default:
				console.log('Unknown game action:', action);
		}
	}

	function leaveGame() {
		soundManager.playClick();
		soundManager.playPlayerLeave();
		disconnectSocket();
		if (browser) {
			sessionStorage.clear();
		}
		goto('/');
	}

	function handleGameInteraction(event: CustomEvent) {
		console.log('Game interaction:', event.detail);
		emitGameAction('interact', event.detail);
	}

	function handleTouchTap(event: CustomEvent) {
		console.log('Touch tap:', event.detail);
		emitGameAction('tap', event.detail);
	}

	function handleItemClick(itemId: string) {
		soundManager.play('item-use');
		emitGameAction('item_click', { itemId });
	}

	function toggleChat() {
		soundManager.playClick();
		chatExpanded = !chatExpanded;
	}

	function openMobileSheet(tab: 'players' | 'chat' | 'inventory') {
		soundManager.playClick();
		mobileSheetTab = tab;
		showMobileSheet = true;
	}

	function closeMobileSheet() {
		soundManager.playClick();
		showMobileSheet = false;
	}

	function openSettings() {
		soundManager.playClick();
		showSettings = true;
	}

	function getPlayerColor(index: number): string {
		const colors = ['#f4a460', '#4a9b8c', '#9b6b9e', '#6b8e9b'];
		return colors[index % colors.length];
	}

	function getPlayerInitial(name: string): string {
		return name.charAt(0).toUpperCase();
	}

	// Hint system functions
	function openHintModal() {
		soundManager.playClick();
		showHintModal = true;
	}

	function handleHintRequested(event: CustomEvent) {
		const { tier } = event.detail;
		useHint();
		hintsRemaining--;
		soundManager.playNotification();
		console.log(`Hint tier ${tier} requested. ${hintsRemaining} hints remaining.`);
	}

	// Room transition functions
	function triggerRoomTransition(fromRoom: string, toRoom: string) {
		transitionFromRoom = fromRoom;
		transitionToRoom = toRoom;
		showRoomTransition = true;
		soundManager.play('room-transition');
	}

	function handleRoomTransitionContinue() {
		showRoomTransition = false;
		currentRoomId = transitionToRoom;

		// Update game state room
		setCurrentRoom(transitionToRoom as any);

		// Show story narrative for new room
		storyNarrativeType = 'intro';
		storyRoomId = transitionToRoom;
		showStoryNarrative = true;

		// Play room-specific audio
		soundManager.handleRoomChange(transitionToRoom as any);
	}

	// Story narrative functions
	function handleStoryContinue() {
		soundManager.playClick();
		showStoryNarrative = false;
		narrativeManager.closeNarrative();
	}

	// Puzzle completion handler
	function handlePuzzleSolved() {
		// Swap player roles
		performRoleSwap();

		// Notify game flow coordinator
		if (activePuzzleId) {
			gameFlowCoordinator.handlePuzzleCompleted(activePuzzleId);
		}

		// Show discovery narrative
		storyNarrativeType = 'discovery';
		storyRoomId = currentRoomId;
		showStoryNarrative = true;

		soundManager.playPuzzleSolved();

		// Clear active puzzle
		activePuzzleId = null;
	}

	// Victory/Defeat handlers
	function triggerVictory() {
		showVictoryScreen = true;
		soundManager.playVictory();
	}

	function triggerDefeat(reason: 'timeout' | 'disconnected' | 'abandoned') {
		defeatReason = reason;
		showDefeatScreen = true;
		soundManager.playDefeat();
	}

	function handleRestart() {
		showVictoryScreen = false;
		showDefeatScreen = false;
		elapsedSeconds = 0;
		hintsRemaining = 3;
		currentAttempts = 0;
		// Reset game state...
	}

	function handleReturnToLobby() {
		showVictoryScreen = false;
		showDefeatScreen = false;
		leaveGame();
	}

	// Demo: Auto-show intro narrative on mount
	onMount(() => {
		// Show room intro after a delay
		setTimeout(() => {
			storyNarrativeType = 'intro';
			storyRoomId = currentRoomId;
			showStoryNarrative = true;
		}, 1500);

		// Show role collaboration prompt after game starts
		setTimeout(() => {
			showRolePrompt = true;
		}, 5000);
	});

	// Game Loop Functions
	function startGameplay() {
		if (!bothPlayersReady) {
			console.log('Waiting for both players');
			return;
		}

		isGameActive = true;
		setGamePhase('playing');
		soundManager.play('game-start');
		console.log('Gameplay started');
	}

	function handlePuzzleStart(event: CustomEvent) {
		const { puzzleId, puzzleName } = event.detail;
		activePuzzleId = puzzleId;
		currentPuzzleId = puzzleId;
		currentPuzzleName = puzzleName || 'Puzzle';

		// Load hints for this puzzle
		currentPuzzleHints = getHintsForPuzzle(puzzleId);
		currentAttempts = 0;
		hintsRemaining = 3;

		console.log('Starting puzzle:', puzzleId);
		soundManager.play('puzzle-select');
	}

	function handlePuzzleSolvedEvent(event: CustomEvent) {
		const { puzzleId } = event.detail;
		activePuzzleId = null;

		// Swap player roles
		performRoleSwap();

		// Show discovery narrative
		storyNarrativeType = 'discovery';
		storyRoomId = currentRoomId;
		showStoryNarrative = true;

		soundManager.playPuzzleSolved();

		// Check if room is complete
		checkRoomCompletion();
	}

	function checkRoomCompletion() {
		// This would check if all puzzles in current room are solved
		// For now, just show a completion message
		console.log('Checking room completion for:', currentRoomId);
	}

	function handlePuzzleRequestHint() {
		openHintModal();
	}

	function handleActivePuzzleReady() {
		console.log('Active puzzle ready');
	}


</script>

<svelte:head>
	<title>EscapeTwogether - Game Room</title>
</svelte:head>

<div class="game-container page-enter" style="display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden;">
	<!-- Top Bar -->
	<header class="top-bar" style="display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; height: auto;">
		<div class="top-bar-left" style="display: flex; align-items: center;">
			<!-- Logo -->
			<div class="logo" style="display: flex; align-items: center; gap: 0.5rem;">
				<div class="logo-icon" style="width: 24px; height: 24px; flex-shrink: 0;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
						<polyline points="10 17 15 12 10 7"/>
						<line x1="15" y1="12" x2="3" y2="12"/>
					</svg>
				</div>
				<span class="logo-text">EscapeTwogether</span>
			</div>

			<!-- Room Code -->
			{#if room}
				<div class="room-code">
					<span class="room-label">ROOM</span>
					<span class="room-value">{room.code}</span>
				</div>
			{/if}

			<!-- Role Badge (prominent display) -->
			<RoleBadge role={$currentPlayerRole} size="medium" showLabel={true} animated={true} />
		</div>

		<div class="top-bar-center">
			<!-- Timer -->
			<div class="timer">
				<svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<polyline points="12 6 12 12 16 14"/>
				</svg>
				<span class="timer-value">{timerDisplay}</span>
			</div>

			<!-- Difficulty Tier Indicator -->
			<div class="difficulty-indicator" title={$difficultyDescription}>
				{#each Array($preferences.difficultyTier) as _}
					<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="star-icon">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
					</svg>
				{/each}
			</div>
		</div>

		<div class="top-bar-right">
			<!-- Connection Status -->
			<div class="connection-status" class:connected>
				<span class="status-dot"></span>
				<span class="status-text">{connected ? 'Connected' : 'Reconnecting...'}</span>
			</div>

			<!-- Settings Button -->
			<button class="icon-button btn-premium" on:click={openSettings} aria-label="Settings">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"/>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
				</svg>
			</button>

			<!-- Leave Button -->
			<button class="leave-button" on:click={leaveGame}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" y1="12" x2="9" y2="12"/>
				</svg>
				<span>Leave</span>
			</button>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="main-content" style="display: flex; flex: 1; min-height: 0; overflow: hidden;">
		<!-- Puzzle Canvas Container -->
		<div class="canvas-wrapper" style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
			<!-- Room Title Header -->
			<div class="room-title-header" style="display: flex; align-items: center; flex-shrink: 0; padding: 0.75rem 1rem; height: auto; max-height: 50px;">
				<svg class="room-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; flex-shrink: 0;">
					<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
					<polyline points="9 22 9 12 15 12 15 22"/>
				</svg>
				<h3 style="margin: 0; font-size: 0.95rem;">The Mysterious Manor</h3>
				<span class="room-badge">Room 1 of 3</span>
			</div>

			<div class="canvas-frame game-frame-premium" style="flex: 1; display: flex; flex-direction: column; min-height: 0; max-height: 700px; overflow: hidden;">
				<div class="canvas-inner" style="width: 100%; height: 100%; flex: 1; min-height: 0;">
					<ActivePuzzle
						bind:puzzleId={activePuzzleId}
						roomId={currentRoomId}
						on:start={handlePuzzleStart}
						on:solved={handlePuzzleSolvedEvent}
						on:requestHint={handlePuzzleRequestHint}
						on:ready={handleActivePuzzleReady}
						on:interact={handleGameInteraction}
						on:tap={handleTouchTap}
					/>
				</div>
				<!-- Premium corner decorations -->
				<div class="frame-corner frame-corner-tl" aria-hidden="true"></div>
				<div class="frame-corner frame-corner-tr" aria-hidden="true"></div>
				<div class="frame-corner frame-corner-bl" aria-hidden="true"></div>
				<div class="frame-corner frame-corner-br" aria-hidden="true"></div>
				<!-- Ambient glow overlay -->
				<div class="canvas-ambient-glow" aria-hidden="true"></div>
			</div>
		</div>

		<!-- Right Sidebar (Desktop) -->
		<aside class="sidebar desktop-only" style="display: flex; flex-direction: column; width: 280px; min-width: 280px; overflow-y: auto;">
			<!-- Players Panel -->
			<section class="panel players-panel" style="flex-shrink: 0;">
				<div class="panel-header">
					<h2 class="panel-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
						Players
					</h2>
					<span class="player-count">{playerList.length}/2</span>
				</div>
				<div class="panel-content">
					<ul class="player-list">
						{#each playerList as player, index (player.id)}
							<li class="player-item">
								<div class="player-avatar" style="--player-color: {getPlayerColor(index)}">
									{getPlayerInitial(player.name)}
								</div>
								<div class="player-info">
									<span class="player-name">{player.name}</span>
									<div class="player-badges">
										{#if player.isHost}
											<span class="player-badge host">Host</span>
										{/if}
										{#if player.role}
											<span class="player-badge role" class:explorer={player.role === 'explorer'} class:analyst={player.role === 'analyst'}>
												{player.role === 'explorer' ? '🧭 Explorer' : '🔍 Analyst'}
											</span>
										{/if}
									</div>
								</div>
							</li>
						{:else}
							<li class="player-item placeholder">Waiting for players...</li>
						{/each}
					</ul>
				</div>
			</section>

			<!-- Chat Panel (Collapsible) -->
			<section class="panel chat-panel" class:collapsed={!chatExpanded}>
				<div class="panel-header clickable" on:click={toggleChat} role="button" tabindex="0">
					<h2 class="panel-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
						</svg>
						Chat
					</h2>
					<button class="collapse-btn" aria-label={chatExpanded ? 'Collapse chat' : 'Expand chat'}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points={chatExpanded ? "6 9 12 15 18 9" : "18 15 12 9 6 15"}/>
						</svg>
					</button>
				</div>
				{#if chatExpanded}
					<div class="panel-content chat-content">
						<Chat placeholder="Message your partner..." maxHeight="100%" />
					</div>
				{/if}
			</section>

			<!-- Inventory Panel -->
			<section class="panel inventory-panel">
				<div class="panel-header">
					<h2 class="panel-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
							<line x1="12" y1="22.08" x2="12" y2="12"/>
						</svg>
						Inventory
					</h2>
				</div>
				<div class="panel-content">
					{#if inventory.length === 0}
						<p class="empty-text">No items collected yet</p>
					{:else}
						<div class="inventory-grid">
							{#each inventory as item (item.id)}
								<button
									class="inventory-item"
									on:click={() => handleItemClick(item.id)}
									aria-label="{item.name}: {item.description}"
								>
									<span class="item-icon">{item.icon}</span>
									<span class="item-name">{item.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</section>

			<!-- Hints Button -->
			<button class="hints-button btn-premium" on:click={openHintModal}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
					<line x1="12" y1="17" x2="12.01" y2="17"/>
				</svg>
				<span>Request Hint</span>
			</button>

			<!-- Role Indicator -->
			<RoleIndicator showCapabilities={true} />
		</aside>
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav class="mobile-nav mobile-only">
		<button class="mobile-nav-btn" on:click={() => openMobileSheet('players')} class:active={mobileSheetTab === 'players'}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
				<circle cx="9" cy="7" r="4"/>
				<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
				<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
			</svg>
			<span>Players</span>
		</button>
		<button class="mobile-nav-btn" on:click={() => openMobileSheet('chat')} class:active={mobileSheetTab === 'chat'}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
			</svg>
			<span>Chat</span>
		</button>
		<button class="mobile-nav-btn" on:click={() => openMobileSheet('inventory')} class:active={mobileSheetTab === 'inventory'}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
			</svg>
			<span>Items</span>
		</button>
		<button class="mobile-nav-btn hints" on:click={openHintModal}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
				<line x1="12" y1="17" x2="12.01" y2="17"/>
			</svg>
			<span>Hint</span>
		</button>
	</nav>

	<!-- Mobile Bottom Sheet -->
	{#if isMobile && showMobileSheet}
		<div class="mobile-sheet-overlay" on:click={closeMobileSheet}></div>
		<div class="mobile-sheet">
			<div class="sheet-handle"></div>

			{#if mobileSheetTab === 'players'}
				<div class="sheet-content">
					<h3 class="sheet-title">Players ({playerList.length}/2)</h3>
					<ul class="mobile-player-list">
						{#each playerList as player, index (player.id)}
							<li class="mobile-player-item">
								<div class="player-avatar" style="--player-color: {getPlayerColor(index)}">
									{getPlayerInitial(player.name)}
								</div>
								<span class="player-name">{player.name}</span>
								{#if player.isHost}
									<span class="player-badge">Host</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{:else if mobileSheetTab === 'chat'}
				<div class="sheet-content chat-sheet">
					<Chat placeholder="Message your partner..." maxHeight="100%" />
				</div>
			{:else if mobileSheetTab === 'inventory'}
				<div class="sheet-content">
					<h3 class="sheet-title">Inventory</h3>
					{#if inventory.length === 0}
						<p class="empty-text">No items collected yet</p>
					{:else}
						<div class="mobile-inventory-grid">
							{#each inventory as item (item.id)}
								<button
									class="inventory-item"
									on:click={() => handleItemClick(item.id)}
								>
									<span class="item-icon">{item.icon}</span>
									<span class="item-name">{item.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Settings Modal -->
	{#if showSettings}
		<div class="modal-overlay" on:click={() => showSettings = false}></div>
		<div class="settings-modal">
			<div class="modal-header">
				<h2>Settings</h2>
				<button class="close-btn" on:click={() => showSettings = false}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
			<div class="modal-content">
				<!-- Audio Settings -->
				<div class="audio-settings-section">
					<h3>Audio Settings</h3>
					<AudioSettings />
				</div>

				<hr class="settings-divider" />

				<!-- Game Settings -->
				<div class="setting-item">
					<span>Notifications</span>
					<button class="toggle-btn active">ON</button>
				</div>
				<div class="setting-item">
					<span>Show Role Prompts</span>
					<button class="toggle-btn active">ON</button>
				</div>
				<div class="setting-item">
					<span>Vibration</span>
					<button class="toggle-btn active">ON</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hint Modal -->
	<HintModal
		bind:isOpen={showHintModal}
		puzzleId={currentPuzzleId}
		puzzleName={currentPuzzleName}
		hints={currentPuzzleHints}
		currentAttempts={currentAttempts}
		hintsRemaining={hintsRemaining}
		on:hintRequested={handleHintRequested}
		on:close={() => showHintModal = false}
	/>

	<!-- Room Transition -->
	<RoomTransition
		bind:isOpen={showRoomTransition}
		fromRoom={transitionFromRoom}
		toRoom={transitionToRoom}
		on:continue={handleRoomTransitionContinue}
	/>

	<!-- Story Narrative -->
	<StoryNarrative
		bind:isOpen={showStoryNarrative}
		roomId={storyRoomId}
		narrativeType={storyNarrativeType}
		customText={storyNarrativeText}
		on:continue={handleStoryContinue}
	/>

	<!-- Victory Screen -->
	{#if showVictoryScreen}
		<VictoryScreen
			totalPlayTime={elapsedSeconds * 1000}
			hintsUsed={3 - hintsRemaining}
			roomsCompleted={3}
			playerNames={{ playerA: playerList[0]?.name || 'Player 1', playerB: playerList[1]?.name || 'Player 2' }}
			onRestart={handleRestart}
			onReturnToLobby={handleReturnToLobby}
		/>
	{/if}

	<!-- Defeat Screen -->
	{#if showDefeatScreen}
		<DefeatScreen
			totalPlayTime={elapsedSeconds * 1000}
			roomsCompleted={0}
			puzzlesSolved={0}
			playerNames={{ playerA: playerList[0]?.name || 'Player 1', playerB: playerList[1]?.name || 'Player 2' }}
			{defeatReason}
			onRestart={handleRestart}
			onReturnToLobby={handleReturnToLobby}
		/>
	{/if}

	<!-- Role Collaboration Prompt -->
	<RolePrompt bind:show={showRolePrompt} autoHide={true} delay={8000} />
</div>

<style>
	/* ========================================
	   CSS Variables & Base
	   ======================================== */
	:root {
		--deep-navy: #1a1a2e;
		--soft-black: #0f0f1a;
		--navy-light: #252542;
		--warm-gold: #f4a460;
		--accent-gold: #d4af37;
		--antique-gold: #8b7355;
		--gold-dim: rgba(244, 164, 96, 0.15);
		--dusty-rose: #c9a9a6;
		--rose-dim: rgba(201, 169, 166, 0.6);
		--white: #ffffff;
		--border-subtle: rgba(201, 169, 166, 0.1);
		--border-gold: rgba(244, 164, 96, 0.3);
		--shadow-gold: rgba(244, 164, 96, 0.1);
		--success: #4ade80;
		--warning: #fbbf24;
	}

	/* ========================================
	   Container
	   ======================================== */
	.game-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		background: linear-gradient(135deg, var(--soft-black) 0%, var(--deep-navy) 50%, var(--soft-black) 100%);
		color: var(--dusty-rose);
		font-family: 'Inter', 'Lato', sans-serif;
		overflow: hidden;
	}

	/* ========================================
	   Top Bar
	   ======================================== */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(26, 26, 46, 0.92) 100%);
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		flex-shrink: 0;
		z-index: 100;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.top-bar-left, .top-bar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.top-bar-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	/* Logo */
	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		width: 28px;
		height: 28px;
		color: var(--accent-gold);
		filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.4));
	}

	.logo-text {
		font-family: 'Playfair Display', serif;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--accent-gold);
		letter-spacing: 0.02em;
		text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
	}

	/* Room Code */
	.room-code {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.25rem 0.75rem;
		background: rgba(212, 175, 55, 0.08);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 6px;
		transition: all 0.25s ease;
	}

	.room-code:hover {
		background: rgba(212, 175, 55, 0.12);
		border-color: rgba(212, 175, 55, 0.3);
	}

	.room-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--rose-dim);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.room-value {
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--accent-gold);
		letter-spacing: 0.15em;
	}

	/* Timer */
	.timer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.06) 100%);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 8px;
		box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
	}

	.timer-icon {
		width: 18px;
		height: 18px;
		color: var(--accent-gold);
	}

	.timer-value {
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--white);
		letter-spacing: 0.05em;
		min-width: 60px;
		text-align: center;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	/* Difficulty Indicator */
	.difficulty-indicator {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: rgba(212, 175, 55, 0.08);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 6px;
	}

	.difficulty-indicator .star-icon {
		width: 12px;
		height: 12px;
		color: var(--accent-gold);
		filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.4));
	}

	/* Connection Status */
	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 20px;
		transition: all 0.3s ease;
	}

	.connection-status.connected {
		background: rgba(74, 222, 128, 0.1);
		border-color: rgba(74, 222, 128, 0.3);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ef4444;
		animation: statusPulse 2s ease-in-out infinite;
		box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
	}

	.connection-status.connected .status-dot {
		background: var(--success);
		box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
	}

	@keyframes statusPulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(0.9); }
	}

	.status-text {
		font-size: 0.75rem;
		color: var(--rose-dim);
	}

	/* Icon Button */
	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: var(--dusty-rose);
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.icon-button:hover {
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.3);
		color: var(--accent-gold);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.icon-button:active {
		transform: translateY(0);
	}

	.icon-button svg {
		width: 20px;
		height: 20px;
	}

	/* Leave Button */
	.leave-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.leave-button:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.5);
		transform: translateY(-1px);
	}

	.leave-button svg {
		width: 16px;
		height: 16px;
	}

	/* ========================================
	   Main Content
	   ======================================== */
	.main-content {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	/* Canvas Wrapper */
	.canvas-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		min-width: 0;
		gap: 1rem;
	}

	/* Room Title Header */
	.room-title-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1.25rem;
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
		border: 1px solid rgba(212, 175, 55, 0.15);
		border-radius: 10px;
		width: 100%;
		max-width: 1200px;
	}

	.room-icon {
		width: 20px;
		height: 20px;
		color: var(--accent-gold);
	}

	.room-title-header h3 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--accent-gold);
		margin: 0;
		letter-spacing: 0.03em;
	}

	.room-badge {
		margin-left: auto;
		font-size: 0.7rem;
		font-weight: 500;
		color: rgba(201, 169, 166, 0.6);
		padding: 0.25rem 0.625rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	/* Premium Game Frame */
	.canvas-frame {
		position: relative;
		width: 100%;
		height: 100%;
		max-width: 1200px;
		max-height: 700px;
		flex: 1;
		background: linear-gradient(180deg, rgba(15, 15, 35, 0.95) 0%, rgba(26, 26, 46, 0.9) 100%);
		border: 2px solid rgba(212, 175, 55, 0.2);
		border-radius: 16px;
		box-shadow:
			0 0 0 1px rgba(212, 175, 55, 0.1),
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(212, 175, 55, 0.08),
			inset 0 0 80px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	/* Game Frame Premium Ambient Glow */
	.game-frame-premium::before {
		content: '';
		position: absolute;
		inset: -3px;
		background: linear-gradient(
			135deg,
			rgba(212, 175, 55, 0.25),
			rgba(201, 169, 166, 0.15),
			rgba(212, 175, 55, 0.2)
		);
		border-radius: inherit;
		z-index: -1;
		filter: blur(15px);
		opacity: 0.5;
		animation: frameGlow 4s ease-in-out infinite;
	}

	@keyframes frameGlow {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.6; }
	}

	.canvas-inner {
		width: 100%;
		height: 100%;
	}

	/* Premium Corner Decorations */
	.frame-corner {
		position: absolute;
		width: 28px;
		height: 28px;
		border: 2px solid var(--accent-gold);
		pointer-events: none;
		animation: cornerGlow 3s ease-in-out infinite;
	}

	@keyframes cornerGlow {
		0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.3)); }
		50% { opacity: 0.7; filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5)); }
	}

	.frame-corner-tl { top: 10px; left: 10px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
	.frame-corner-tr { top: 10px; right: 10px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
	.frame-corner-bl { bottom: 10px; left: 10px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
	.frame-corner-br { bottom: 10px; right: 10px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

	/* Ambient Glow Overlay */
	.canvas-ambient-glow {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212, 175, 55, 0.05), transparent),
			radial-gradient(ellipse 60% 40% at 0% 50%, rgba(201, 169, 166, 0.03), transparent),
			radial-gradient(ellipse 60% 40% at 100% 50%, rgba(74, 155, 140, 0.02), transparent);
		pointer-events: none;
		z-index: 1;
	}

	/* ========================================
	   Sidebar
	   ======================================== */
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 280px;
		min-width: 280px;
		background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%);
		border-left: 1px solid rgba(212, 175, 55, 0.1);
		overflow: hidden;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	/* Panel Base */
	.panel {
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: linear-gradient(90deg, rgba(37, 37, 66, 0.6) 0%, rgba(37, 37, 66, 0.3) 100%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		transition: background 0.2s ease;
	}

	.panel-header.clickable {
		cursor: pointer;
	}

	.panel-header.clickable:hover {
		background: linear-gradient(90deg, rgba(37, 37, 66, 0.9) 0%, rgba(37, 37, 66, 0.5) 100%);
	}

	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.panel-title svg {
		width: 14px;
		height: 14px;
	}

	.panel-content {
		flex: 1;
		padding: 0.75rem;
		overflow-y: auto;
	}

	/* Players Panel */
	.players-panel {
		flex-shrink: 0;
	}

	.player-count {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--rose-dim);
		padding: 0.125rem 0.5rem;
		background: rgba(212, 175, 55, 0.1);
		border-radius: 10px;
	}

	.player-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.player-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.player-item:hover {
		background: rgba(212, 175, 55, 0.05);
	}

	.player-item.placeholder {
		color: var(--rose-dim);
		font-size: 0.875rem;
		font-style: italic;
		padding: 1rem;
		justify-content: center;
	}

	.player-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--player-color, var(--accent-gold));
		color: var(--deep-navy);
		font-weight: 700;
		font-size: 0.875rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.player-name {
		font-size: 0.875rem;
		color: var(--white);
	}

	.player-badges {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.player-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		background: rgba(139, 115, 85, 0.2);
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.player-badge.host {
		color: var(--antique-gold);
		background: rgba(139, 115, 85, 0.2);
	}

	.player-badge.role {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.player-badge.role.explorer {
		color: #3B82F6;
		background: rgba(59, 130, 246, 0.15);
	}

	.player-badge.role.analyst {
		color: #F97316;
		background: rgba(249, 115, 22, 0.15);
	}

	/* Chat Panel */
	.chat-panel {
		flex: 1;
		min-height: 150px;
	}

	.chat-panel.collapsed {
		flex: none;
		min-height: auto;
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		color: var(--rose-dim);
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.collapse-btn:hover {
		color: var(--accent-gold);
	}

	.collapse-btn svg {
		width: 16px;
		height: 16px;
	}

	.chat-content {
		display: flex;
		flex-direction: column;
	}

	/* Inventory Panel */
	.inventory-panel {
		flex-shrink: 0;
		max-height: 180px;
	}

	.empty-text {
		color: var(--rose-dim);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
	}

	.inventory-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.inventory-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: rgba(15, 15, 26, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.inventory-item:hover {
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.item-icon {
		font-size: 1.25rem;
	}

	.item-name {
		font-size: 0.625rem;
		color: var(--rose-dim);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	/* Premium Hints Button */
	.hints-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 0.75rem;
		padding: 0.875rem;
		background: linear-gradient(135deg, var(--accent-gold) 0%, var(--antique-gold) 100%);
		border: none;
		border-radius: 10px;
		color: var(--deep-navy);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow:
			0 4px 16px rgba(212, 175, 55, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.hints-button:hover {
		transform: translateY(-2px);
		box-shadow:
			0 8px 24px rgba(212, 175, 55, 0.45),
			0 0 30px rgba(212, 175, 55, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.hints-button:active {
		transform: translateY(0);
	}

	.hints-button svg {
		width: 18px;
		height: 18px;
	}

	/* ========================================
	   Mobile Navigation
	   ======================================== */
	.mobile-nav {
		display: flex;
		justify-content: space-around;
		padding: 0.5rem;
		background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(15, 15, 35, 0.98) 100%);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
	}

	.mobile-nav-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: var(--rose-dim);
		font-size: 0.625rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mobile-nav-btn svg {
		width: 24px;
		height: 24px;
	}

	.mobile-nav-btn:hover {
		color: var(--accent-gold);
	}

	.mobile-nav-btn.active {
		color: var(--accent-gold);
	}

	.mobile-nav-btn.hints {
		color: var(--accent-gold);
	}

	/* ========================================
	   Mobile Sheet
	   ======================================== */
	.mobile-sheet-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 200;
	}

	.mobile-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 70vh;
		background: linear-gradient(180deg, var(--deep-navy) 0%, var(--soft-black) 100%);
		border-radius: 20px 20px 0 0;
		border-top: 1px solid rgba(212, 175, 55, 0.15);
		z-index: 201;
		animation: sheetSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes sheetSlideUp {
		from { transform: translateY(100%); opacity: 0.8; }
		to { transform: translateY(0); opacity: 1; }
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		margin: 0.75rem auto;
		background: rgba(212, 175, 55, 0.3);
		border-radius: 2px;
	}

	.sheet-content {
		padding: 0 1rem 1.5rem;
		max-height: calc(70vh - 40px);
		overflow-y: auto;
	}

	.sheet-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--accent-gold);
		margin-bottom: 1rem;
	}

	.chat-sheet {
		height: 50vh;
	}

	.mobile-player-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.mobile-player-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 10px;
		margin-bottom: 0.5rem;
		background: rgba(37, 37, 66, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.mobile-inventory-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	/* ========================================
	   Modal
	   ======================================== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 300;
	}

	.settings-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 400px;
		background: linear-gradient(180deg, var(--deep-navy) 0%, rgba(22, 33, 62, 0.95) 100%);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 16px;
		z-index: 301;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 40px rgba(212, 175, 55, 0.1);
		animation: modalFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.modal-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--accent-gold);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: var(--rose-dim);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--white);
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
	}

	.modal-content {
		padding: 1rem 1.5rem;
	}

	.audio-settings-section {
		margin-bottom: 1.5rem;
	}

	.audio-settings-section h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--accent-gold);
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.settings-divider {
		border: none;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin: 1.5rem 0;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.setting-item:last-child {
		border-bottom: none;
	}

	.toggle-btn {
		padding: 0.375rem 0.875rem;
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 20px;
		color: var(--accent-gold);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-btn:hover {
		background: rgba(212, 175, 55, 0.15);
		border-color: rgba(212, 175, 55, 0.35);
	}

	/* ========================================
	   Responsive Helpers
	   ======================================== */
	.desktop-only {
		display: flex;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 768px) {
		.top-bar {
			padding: 0.5rem 0.75rem;
		}

		.top-bar-center {
			position: static;
			transform: none;
		}

		.logo-text {
			display: none;
		}

		.room-code {
			display: none;
		}

		.status-text {
			display: none;
		}

		.leave-button span {
			display: none;
		}

		.canvas-wrapper {
			padding: 0.75rem;
		}

		.room-title-header {
			display: none;
		}

		.frame-corner {
			width: 18px;
			height: 18px;
		}

		.desktop-only {
			display: none !important;
		}

		.mobile-only {
			display: flex;
		}
	}

	/* ========================================
	   Accessibility
	   ======================================== */
	@media (prefers-reduced-motion: reduce) {
		*, *::before, *::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}

	*:focus-visible {
		outline: 2px solid var(--accent-gold);
		outline-offset: 3px;
		box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}


	/* ========================================
	   ENHANCED INTERACTIONS
	   ======================================== */

	/* Inventory item hover effect */
	.inventory-item {
		position: relative;
		overflow: hidden;
	}

	.inventory-item::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.inventory-item:hover::before {
		opacity: 1;
	}

	.inventory-item:hover {
		background: rgba(212, 175, 55, 0.08);
		border-color: rgba(212, 175, 55, 0.25);
		transform: translateY(-3px) scale(1.02);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
	}

	.inventory-item:active {
		transform: translateY(-1px) scale(1);
	}

	/* Panel header hover effect */
	.panel-header.clickable {
		position: relative;
	}

	.panel-header.clickable::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.panel-header.clickable:hover::after {
		opacity: 1;
	}

	/* Mobile nav button active state */
	.mobile-nav-btn {
		position: relative;
	}

	.mobile-nav-btn::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%) scaleX(0);
		width: 24px;
		height: 2px;
		background: var(--accent-gold);
		border-radius: 1px;
		transition: transform 0.25s ease;
	}

	.mobile-nav-btn.active::after {
		transform: translateX(-50%) scaleX(1);
	}

	/* Hints button pulse effect */
	.hints-button {
		position: relative;
		overflow: hidden;
	}

	.hints-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.hints-button:hover::before {
		opacity: 1;
	}

	.hints-button::after {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		border: 2px solid transparent;
		pointer-events: none;
		transition: border-color 0.3s ease;
	}

	.hints-button:focus-visible::after {
		border-color: rgba(255, 255, 255, 0.3);
	}


	/* ========================================
	   TOGGLE BUTTON STYLES
	   ======================================== */

	.toggle-btn {
		position: relative;
		overflow: hidden;
		min-width: 50px;
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.toggle-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(74, 222, 128, 0.15);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.toggle-btn.active {
		background: rgba(74, 222, 128, 0.15);
		border-color: rgba(74, 222, 128, 0.35);
		color: #4ade80;
	}

	.toggle-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}


	/* ========================================
	   MODAL ENHANCEMENTS
	   ======================================== */

	.modal-overlay {
		animation: overlayFadeIn 0.3s ease-out;
	}

	@keyframes overlayFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.settings-modal {
		animation: modalSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes modalSlideUp {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) translateY(0);
		}
	}

	.close-btn {
		position: relative;
		overflow: hidden;
	}

	.close-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(239, 68, 68, 0.1);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
		transform: rotate(90deg);
	}

	.close-btn:hover::before {
		opacity: 1;
	}


	/* ========================================
	   MOBILE SHEET ENHANCEMENTS
	   ======================================== */

	.mobile-sheet {
		animation: sheetSlideUpEnhanced 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes sheetSlideUpEnhanced {
		from {
			transform: translateY(100%);
			opacity: 0.8;
		}
		65% {
			transform: translateY(-2%);
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.sheet-handle {
		position: relative;
		overflow: hidden;
		cursor: grab;
	}

	.sheet-handle::before,
	.sheet-handle::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 2px;
		height: 4px;
		background: rgba(212, 175, 55, 0.3);
		border-radius: 1px;
	}

	.sheet-handle::before {
		left: 6px;
	}

	.sheet-handle::after {
		right: 6px;
	}


	/* ========================================
	   LOADING STATE ANIMATIONS
	   ======================================== */

	.player-item.placeholder {
		position: relative;
	}

	.player-item.placeholder::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.05) 50%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: shimmer 2s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}


	/* ========================================
	   PLAYER AVATAR ANIMATION
	   ======================================== */

	.player-avatar {
		transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.player-item:hover .player-avatar {
		transform: scale(1.05);
	}


	/* ========================================
	   CONNECTION STATUS ENHANCEMENT
	   ======================================== */

	.connection-status {
		transition: all 0.3s ease;
	}

	.connection-status:not(.connected) {
		animation: connectionPulse 1.5s ease-in-out infinite;
	}

	@keyframes connectionPulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>

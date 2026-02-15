<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { PuzzleDefinition, PlayerRole, PuzzleState } from '$lib/types';
	import { allPuzzles, rooms, getPuzzleById } from '$lib/puzzles';
	import {
		createInitialState,
		placePiece,
		checkAllCorrect,
		updateLockTimer,
		type TornPhotographsState,
		type PhotoPiece,
		type FrameOutline
	} from '$lib/puzzles/room1/torn-photographs';
	import { tornPhotograph } from '$lib/assets/puzzles/room1';

	export let data: PageData;

	// UI State
	let selectedPuzzleId: string = '';
	let currentPlayerRole: PlayerRole = 'explorer';
	let showHints: boolean = false;
	let currentHintTier: number = 0;
	let showSolution: boolean = false;
	let puzzleCompleted: boolean = false;
	let puzzleState: Record<string, unknown> = {};
	let attempts: number = 0;
	let timeStarted: number | null = null;
	let elapsedTime: number = 0;

	// Torn Photographs puzzle state
	let tornPhotoState: TornPhotographsState | null = null;
	let selectedPiece: PhotoPiece | null = null;
	let placementFeedback: { frameId: string; correct: boolean } | null = null;
	let lockTimerInterval: ReturnType<typeof setInterval> | null = null;

	// Computed properties
	$: selectedPuzzle = selectedPuzzleId ? getPuzzleById(selectedPuzzleId) : null;
	$: roomInfo = selectedPuzzle ? rooms.find(r => r.id === selectedPuzzle.roomId) : null;
	$: currentHints = selectedPuzzle?.hints.slice(0, currentHintTier) || [];

	// Theme colors by room
	const roomColors: Record<string, { primary: string; secondary: string; accent: string; bg: string }> = {
		attic: {
			primary: '#D4A574', // warm-amber
			secondary: '#8B7355', // wood brown
			accent: '#C9A66B', // golden light
			bg: '#1A1A2E' // deep navy
		},
		clock_tower: {
			primary: '#7B68EE', // medium slate blue
			secondary: '#4A4A6A', // dusk blue
			accent: '#C0C0C0', // silver
			bg: '#1A1A2E' // deep navy
		},
		garden_conservatory: {
			primary: '#90EE90', // light green
			secondary: '#FFB6C1', // light pink
			accent: '#FFD700', // gold
			bg: '#1A1A2E' // deep navy
		}
	};

	$: theme = selectedPuzzle?.roomId ? roomColors[selectedPuzzle.roomId] : roomColors.attic;

	// Initialize puzzle state
	function initializePuzzle() {
		if (!selectedPuzzle) return;

		puzzleState = {};
		puzzleCompleted = false;
		attempts = 0;
		timeStarted = Date.now();
		elapsedTime = 0;
		showHints = false;
		currentHintTier = 0;
		showSolution = false;
		selectedPiece = null;
		placementFeedback = null;

		// Initialize torn photographs puzzle if selected
		if (selectedPuzzleId === 'room1-torn-photographs') {
			tornPhotoState = createInitialState();
		}

		// Clear any existing lock timer
		if (lockTimerInterval) {
			clearInterval(lockTimerInterval);
			lockTimerInterval = null;
		}
	}

	// Reset puzzle
	function resetPuzzle() {
		initializePuzzle();
	}

	// Torn Photographs puzzle functions
	function selectPiece(piece: PhotoPiece) {
		if (puzzleCompleted) return;
		selectedPiece = selectedPiece?.id === piece.id ? null : piece;
	}

	function handleFrameClick(frame: FrameOutline) {
		if (!selectedPiece || puzzleCompleted || !tornPhotoState) return;

		attempts++;

		// Place the piece in the frame
		tornPhotoState = placePiece(tornPhotoState, selectedPiece.id, frame.id);

		// Check if placement is correct
		const isCorrect = frame.position === selectedPiece.correctFrame;
		placementFeedback = { frameId: frame.id, correct: isCorrect };

		// Clear feedback after animation
		setTimeout(() => {
			placementFeedback = null;
		}, 1000);

		// Clear selection
		selectedPiece = null;

		// Check if puzzle is solved
		if (tornPhotoState.allPlaced && checkAllCorrect(tornPhotoState)) {
			startLockTimer();
		}
	}

	function startLockTimer() {
		if (lockTimerInterval) {
			clearInterval(lockTimerInterval);
		}

		lockTimerInterval = setInterval(() => {
			if (!tornPhotoState || puzzleCompleted) {
				if (lockTimerInterval) clearInterval(lockTimerInterval);
				return;
			}

			tornPhotoState = updateLockTimer(tornPhotoState, 100);

			if (tornPhotoState.completed) {
				puzzleCompleted = true;
				if (lockTimerInterval) clearInterval(lockTimerInterval);
			}
		}, 100);
	}

	function getFrameWithPiece(frame: FrameOutline): { piece: PhotoPiece | null; isCorrect: boolean } {
		if (!tornPhotoState) return { piece: null, isCorrect: false };

		const piece = tornPhotoState.pieces.find(p => p.id === frame.occupyingPiece);
		const isCorrect = piece ? piece.correctFrame === frame.position : false;

		return { piece, isCorrect };
	}

	function isPiecePlaced(piece: PhotoPiece): boolean {
		if (!tornPhotoState) return false;
		return tornPhotoState.frames.some(f => f.occupyingPiece === piece.id);
	}

	function removePieceFromFrame(piece: PhotoPiece) {
		if (!tornPhotoState || puzzleCompleted) return;

		const frame = tornPhotoState.frames.find(f => f.occupyingPiece === piece.id);
		if (frame) {
			frame.occupied = false;
			frame.occupyingPiece = null;
			piece.placed = false;
			tornPhotoState.allPlaced = tornPhotoState.pieces.every(p => p.placed);
			tornPhotoState = { ...tornPhotoState };
		}
	}

	// Toggle player role
	function toggleRole() {
		currentPlayerRole = currentPlayerRole === 'explorer' ? 'analyst' : 'explorer';
	}

	// Show next hint
	function showNextHint() {
		if (!selectedPuzzle) return;

		showHints = true;
		if (currentHintTier < selectedPuzzle.hints.length) {
			currentHintTier++;
		}
	}

	// Toggle solution visibility
	function toggleSolution() {
		showSolution = !showSolution;
	}

	// Simulate puzzle solve (for testing)
	function simulateSolve() {
		puzzleCompleted = true;
		attempts++;
	}

	// Get room name from ID
	function getRoomName(roomId: string): string {
		const room = rooms.find(r => r.id === roomId);
		return room?.name || roomId;
	}

	// Get puzzle index in room
	function getPuzzleIndex(puzzleId: string): number {
		if (!selectedPuzzle) return 0;
		const roomPuzzles = allPuzzles.filter(p => p.roomId === selectedPuzzle.roomId);
		return roomPuzzles.findIndex(p => p.id === puzzleId) + 1;
	}

	// Format time elapsed
	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	// Update elapsed time
	let timerInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		timerInterval = setInterval(() => {
			if (timeStarted && !puzzleCompleted) {
				elapsedTime = Date.now() - timeStarted;
			}
		}, 100);

		// Select first puzzle by default
		if (data.allPuzzles.length > 0) {
			selectedPuzzleId = data.allPuzzles[0].id;
			initializePuzzle();
		}

		return () => {
			if (timerInterval) clearInterval(timerInterval);
			if (lockTimerInterval) clearInterval(lockTimerInterval);
		};
	});

	// Watch for puzzle selection changes
	$: if (selectedPuzzleId) {
		initializePuzzle();
	}
</script>

<svelte:head>
	<title>Puzzle Test Page - EscapeTwogether</title>
</svelte:head>

<div class="test-page" style="--theme-primary: {theme.primary}; --theme-secondary: {theme.secondary}; --theme-accent: {theme.accent};">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<h1>Puzzle Test Page</h1>
			<p class="subtitle">Test and validate all {data.totalPuzzles} puzzles across {data.rooms.length} rooms</p>
		</div>
		<a href="/" class="back-link">Back to Home</a>
	</header>

	<!-- Main Content -->
	<main class="main-content">
		<!-- Puzzle Selector Panel -->
		<section class="selector-panel">
			<div class="panel-header">
				<h2>Select Puzzle</h2>
				<span class="puzzle-count">{data.totalPuzzles} puzzles available</span>
			</div>

			<div class="room-selectors">
				{#each data.rooms as room}
					<div class="room-group">
						<div class="room-header" style="border-left-color: {roomColors[room.id]?.primary || theme.primary}">
							<h3>{room.name}</h3>
							<span class="room-puzzle-count">{room.puzzles.length} puzzles</span>
						</div>
						<div class="puzzle-buttons">
							{#each room.puzzles as puzzle, index}
								<button
									class="puzzle-btn"
									class:selected={selectedPuzzleId === puzzle.id}
									class:completed={false}
									on:click={() => selectedPuzzleId = puzzle.id}
									style="--btn-color: {roomColors[room.id]?.primary || theme.primary}"
								>
									<span class="puzzle-number">{index + 1}</span>
									<span class="puzzle-name">{puzzle.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Puzzle Display Panel -->
		<section class="puzzle-panel">
			{#if selectedPuzzle}
				<!-- Puzzle Header -->
				<div class="puzzle-header" style="background: linear-gradient(135deg, {theme.primary}15, {theme.secondary}10);">
					<div class="puzzle-info">
						<span class="room-badge" style="background: {theme.primary}20; color: {theme.primary};">
							{getRoomName(selectedPuzzle.roomId)}
						</span>
						<h2 class="puzzle-title">{selectedPuzzle.name}</h2>
						<p class="puzzle-description">{selectedPuzzle.description}</p>
					</div>

					<!-- Status Badges -->
					<div class="status-badges">
						{#if puzzleCompleted}
							<span class="badge completed">Completed</span>
						{:else}
							<span class="badge in-progress">In Progress</span>
						{/if}
						<span class="badge attempts">{attempts} attempts</span>
						<span class="badge time">{formatTime(elapsedTime)}</span>
					</div>
				</div>

				<!-- Player Role Toggle -->
				<div class="role-section">
					<div class="role-toggle">
						<button
							class="role-btn"
							class:active={currentPlayerRole === 'explorer'}
							on:click={() => currentPlayerRole = 'explorer'}
						>
							<span class="role-icon">🔍</span>
							<span>Explorer (Player A)</span>
						</button>
						<button
							class="role-btn"
							class:active={currentPlayerRole === 'analyst'}
							on:click={() => currentPlayerRole = 'analyst'}
						>
							<span class="role-icon">📊</span>
							<span>Analyst (Player B)</span>
						</button>
					</div>
					<p class="role-hint">
						{#if currentPlayerRole === 'explorer'}
							Explorer sees the puzzle interface and can interact with elements
						{:else}
							Analyst sees information and clues to help guide the explorer
						{/if}
					</p>
				</div>

				<!-- Puzzle Canvas Area -->
				<div class="puzzle-canvas" style="border-color: {theme.primary}30;">
					<div class="canvas-content">
						<!-- Torn Photographs Puzzle UI -->
						{#if selectedPuzzleId === 'room1-torn-photographs' && tornPhotoState}
							<div class="torn-photo-puzzle">
								<!-- Explorer View - Photo Pieces -->
								{#if currentPlayerRole === 'explorer'}
									<div class="puzzle-layout">
										<!-- Unplaced Pieces Tray -->
										<div class="pieces-tray">
											<h4>Photo Pieces</h4>
											<div class="pieces-grid">
												{#each tornPhotoState.pieces as piece (piece.id)}
													{@const placed = isPiecePlaced(piece)}
													{#if !placed}
														<button
															class="piece-btn"
															class:selected={selectedPiece?.id === piece.id}
															on:click={() => selectPiece(piece)}
															disabled={puzzleCompleted}
														>
															<div class="piece-preview">
																<div class="piece-icon" style="background-position: {(piece.position % 3) * 33.33}% {Math.floor(piece.position / 3) * 33.33}%;">
																	{piece.position + 1}
																</div>
															</div>
															<span class="piece-label">Piece {piece.position + 1}</span>
														</button>
													{/if}
												{/each}
											</div>
											{#if selectedPiece}
												<div class="selected-piece-info">
													<p><strong>Selected:</strong> Piece {selectedPiece.position + 1}</p>
													<p class="piece-description">{selectedPiece.description}</p>
													<p class="instruction">Click a frame below to place this piece</p>
												</div>
											{:else}
												<p class="instruction">Click a piece above to select it, then click a frame to place it.</p>
											{/if}
										</div>

										<!-- Frame Grid -->
										<div class="frame-area">
											<h4>Place Pieces Here</h4>
											<div class="frame-grid">
												{#each tornPhotoState.frames as frame (frame.id)}
													{@const { piece, isCorrect } = getFrameWithPiece(frame)}
													<button
														class="frame-btn"
														class:has-piece={frame.occupied}
														class:correct={frame.occupied && isCorrect}
														class:incorrect={frame.occupied && !isCorrect}
														class:feedback={placementFeedback?.frameId === frame.id}
														class:feedback-correct={placementFeedback?.frameId === frame.id && placementFeedback?.correct}
														class:feedback-incorrect={placementFeedback?.frameId === frame.id && !placementFeedback?.correct}
														on:click={() => frame.occupied && piece ? removePieceFromFrame(piece) : handleFrameClick(frame)}
														disabled={puzzleCompleted || (!frame.occupied && !selectedPiece)}
													>
														{#if frame.occupied && piece}
															<div class="placed-piece">
																<div class="piece-icon" style="background-position: {(piece.position % 3) * 33.33}% {Math.floor(piece.position / 3) * 33.33}%;">
																	{piece.position + 1}
																</div>
																{#if isCorrect}
																	<span class="correct-indicator">✓</span>
																{/if}
															</div>
														{:else}
															<span class="frame-number">{frame.position + 1}</span>
															<span class="frame-clue">{frame.cornerClue}</span>
														{/if}
													</button>
												{/each}
											</div>
										</div>
									</div>
								{:else}
									<!-- Analyst View - Frame Clues -->
									<div class="analyst-view">
										<h4>Frame Clues (Analyst View)</h4>
										<p class="analyst-instruction">Share these clues with your partner to help them place the correct pieces.</p>
										<div class="clues-grid">
											{#each tornPhotoState.frames as frame (frame.id)}
												<div class="clue-card">
													<span class="clue-position">Frame {frame.position + 1}</span>
													<span class="clue-text">{frame.cornerClue}</span>
													{#if frame.occupied}
														<span class="clue-status occupied">Occupied</span>
													{/if}
												</div>
											{/each}
										</div>
										<div class="piece-descriptions">
											<h5>Piece Descriptions to Share:</h5>
											<ul>
												{#each tornPhotoState.pieces as piece (piece.id)}
													<li>
														<strong>Piece {piece.position + 1}:</strong> {piece.description}
													</li>
												{/each}
											</ul>
										</div>
									</div>
								{/if}

								<!-- Progress indicator -->
								<div class="puzzle-progress">
									<span>Placed: {tornPhotoState.pieces.filter(p => p.placed).length} / 9</span>
									{#if tornPhotoState.allPlaced && !tornPhotoState.completed}
										<span class="locking">Verifying placement...</span>
									{/if}
									{#if tornPhotoState.lockTimer > 0}
										<div class="lock-progress">
											<div class="lock-bar" style="width: {(tornPhotoState.lockTimer / 3000) * 100}%"></div>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<!-- Default placeholder for other puzzles -->
							<div class="puzzle-visual">
								<div class="puzzle-icon" style="color: {theme.primary}">
									{#if selectedPuzzle.roomId === 'attic'}
										<svg viewBox="0 0 100 100" fill="currentColor">
											<rect x="20" y="30" width="60" height="50" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
											<path d="M50 15 L85 35 L15 35 Z" fill="none" stroke="currentColor" stroke-width="3"/>
											<rect x="35" y="50" width="30" height="25" rx="2" fill="currentColor" opacity="0.3"/>
										</svg>
									{:else if selectedPuzzle.roomId === 'clock_tower'}
										<svg viewBox="0 0 100 100" fill="currentColor">
											<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="3"/>
											<line x1="50" y1="50" x2="50" y2="25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
											<line x1="50" y1="50" x2="70" y2="55" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
											<circle cx="50" cy="50" r="4" fill="currentColor"/>
										</svg>
									{:else if selectedPuzzle.roomId === 'garden_conservatory'}
										<svg viewBox="0 0 100 100" fill="currentColor">
											<path d="M50 20 C35 35, 35 65, 50 80 C65 65, 65 35, 50 20" fill="currentColor" opacity="0.3"/>
											<path d="M50 30 L50 75" stroke="currentColor" stroke-width="2"/>
											<ellipse cx="50" cy="25" rx="15" ry="8" fill="currentColor" opacity="0.5"/>
										</svg>
									{/if}
								</div>

								<div class="puzzle-instructions">
									<h4>Puzzle Instructions</h4>
									<p>{selectedPuzzle.description}</p>
									<div class="role-info">
										<strong>As {currentPlayerRole}:</strong>
										{#if currentPlayerRole === 'explorer'}
											You can interact with the puzzle elements directly. Your partner will provide guidance.
										{:else}
											You have access to information that can help your partner solve the puzzle. Communicate clearly!
										{/if}
									</div>
								</div>

								<!-- Interactive Elements -->
								<div class="interaction-area">
									<div class="demo-controls">
										<button class="demo-btn" on:click={simulateSolve}>
											Simulate Solve
										</button>
										<button class="demo-btn secondary">
											Make Attempt
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- Completion Overlay -->
						{#if puzzleCompleted}
							<div class="completion-overlay">
								<div class="completion-content">
									<div class="completion-icon">✓</div>
									<h3>Puzzle Solved!</h3>
									<p>Congratulations on completing {selectedPuzzle.name}</p>
									<div class="completion-stats">
										<div class="stat">
											<span class="stat-value">{attempts}</span>
											<span class="stat-label">Attempts</span>
										</div>
										<div class="stat">
											<span class="stat-value">{formatTime(elapsedTime)}</span>
											<span class="stat-label">Time</span>
										</div>
										<div class="stat">
											<span class="stat-value">{currentHintTier}</span>
											<span class="stat-label">Hints Used</span>
										</div>
									</div>
									<button class="play-again-btn" on:click={resetPuzzle}>Play Again</button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Hints Section -->
				{#if showHints && currentHints.length > 0}
					<div class="hints-section">
						<h4>Hints Revealed ({currentHintTier}/{selectedPuzzle.hints.length})</h4>
						<div class="hints-list">
							{#each currentHints as hint, index}
								<div class="hint-card">
									<span class="hint-tier">Tier {hint.tier}</span>
									<p>{hint.text}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Solution Section -->
				{#if showSolution}
					<div class="solution-section">
						<h4>Solution</h4>
						<div class="solution-content">
							<p>This puzzle requires both players to coordinate:</p>
							<ul>
								{#each selectedPuzzle.requiredRoles as role}
									<li><strong>{role}:</strong> Role-specific actions required</li>
								{/each}
							</ul>
							<p class="solution-note">In single-player test mode, you can simulate both roles using the toggle above.</p>
						</div>
					</div>
				{/if}
			{:else}
				<div class="no-puzzle-selected">
					<div class="placeholder-icon">🧩</div>
					<h3>No Puzzle Selected</h3>
					<p>Select a puzzle from the list on the left to begin testing</p>
				</div>
			{/if}
		</section>

		<!-- Control Panel -->
		<aside class="control-panel">
			<div class="panel-header">
				<h2>Controls</h2>
			</div>

			<div class="controls-grid">
				<!-- Reset Button -->
				<button class="control-btn reset" on:click={resetPuzzle} disabled={!selectedPuzzle}>
					<span class="btn-icon">↺</span>
					<span class="btn-label">Reset Puzzle</span>
				</button>

				<!-- Hint Button -->
				<button
					class="control-btn hint"
					on:click={showNextHint}
					disabled={!selectedPuzzle || (showHints && currentHintTier >= (selectedPuzzle?.hints.length || 0))}
				>
					<span class="btn-icon">💡</span>
					<span class="btn-label">
						{#if !showHints}
							Show Hint
						{:else if currentHintTier < (selectedPuzzle?.hints.length || 0)}
							Next Hint
						{:else}
							No More Hints
						{/if}
					</span>
				</button>

				<!-- Toggle Role Button -->
				<button class="control-btn role" on:click={toggleRole} disabled={!selectedPuzzle}>
					<span class="btn-icon">🔄</span>
					<span class="btn-label">Toggle Role</span>
				</button>

				<!-- View Solution Button -->
				<button class="control-btn solution" on:click={toggleSolution} disabled={!selectedPuzzle}>
					<span class="btn-icon">📖</span>
					<span class="btn-label">{showSolution ? 'Hide' : 'View'} Solution</span>
				</button>
			</div>

			<!-- State Inspector -->
			<div class="state-inspector">
				<h3>State Inspector</h3>
				{#if selectedPuzzle}
					<div class="state-display">
						<div class="state-item">
							<span class="state-key">Puzzle ID:</span>
							<span class="state-value">{selectedPuzzle.id}</span>
						</div>
						<div class="state-item">
							<span class="state-key">Room:</span>
							<span class="state-value">{selectedPuzzle.roomId}</span>
						</div>
						<div class="state-item">
							<span class="state-key">Current Role:</span>
							<span class="state-value">{currentPlayerRole}</span>
						</div>
						<div class="state-item">
							<span class="state-key">Completed:</span>
							<span class="state-value">{puzzleCompleted ? 'Yes' : 'No'}</span>
						</div>
						<div class="state-item">
							<span class="state-key">Attempts:</span>
							<span class="state-value">{attempts}</span>
						</div>
						<div class="state-item">
							<span class="state-key">Hints Shown:</span>
							<span class="state-value">{currentHintTier}</span>
						</div>
						{#if selectedPuzzleId === 'room1-torn-photographs' && tornPhotoState}
							<div class="state-divider"></div>
							<div class="state-item">
								<span class="state-key">Pieces Placed:</span>
								<span class="state-value">{tornPhotoState.pieces.filter(p => p.placed).length}/9</span>
							</div>
							<div class="state-item">
								<span class="state-key">All Placed:</span>
								<span class="state-value">{tornPhotoState.allPlaced ? 'Yes' : 'No'}</span>
							</div>
							<div class="state-item">
								<span class="state-key">Lock Timer:</span>
								<span class="state-value">{(tornPhotoState.lockTimer / 1000).toFixed(1)}s</span>
							</div>
							<div class="state-item">
								<span class="state-key">Selected Piece:</span>
								<span class="state-value">{selectedPiece ? `Piece ${selectedPiece.position + 1}` : 'None'}</span>
							</div>
						{/if}
					</div>
				{:else}
					<p class="no-state">Select a puzzle to inspect state</p>
				{/if}
			</div>

			<!-- Puzzle Info Card -->
			{#if selectedPuzzle}
				<div class="info-card" style="border-color: {theme.primary}40;">
					<h4 style="color: {theme.primary}">Puzzle Info</h4>
					<div class="info-list">
						<div class="info-item">
							<span class="info-label">Required Roles:</span>
							<span class="info-value">{selectedPuzzle.requiredRoles.join(', ')}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Total Hints:</span>
							<span class="info-value">{selectedPuzzle.hints.length}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Puzzle #{getPuzzleIndex(selectedPuzzle.id)} in room</span>
						</div>
					</div>
				</div>
			{/if}
		</aside>
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<span class="footer-text">Puzzle Test Environment</span>
			<span class="footer-divider">•</span>
			<span class="footer-text">EscapeTwogether</span>
			<span class="footer-divider">•</span>
			<span class="footer-text">{data.totalPuzzles} Puzzles • {data.rooms.length} Rooms</span>
		</div>
	</footer>
</div>

<style>
	.test-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #1e293b 100%);
		color: #e2e8f0;
		display: flex;
		flex-direction: column;
		font-family: var(--font-body, 'Lato', sans-serif);
	}

	/* Header Styles */
	.header {
		padding: 1.5rem 2rem;
		background: rgba(15, 23, 42, 0.8);
		border-bottom: 1px solid rgba(201, 169, 166, 0.2);
		display: flex;
		justify-content: space-between;
		align-items: center;
		backdrop-filter: blur(10px);
	}

	.header h1 {
		font-family: var(--font-display, 'Playfair Display', serif);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--theme-primary, #f4a460);
		margin: 0;
	}

	.subtitle {
		color: rgba(201, 169, 166, 0.8);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.back-link {
		color: rgba(201, 169, 166, 0.8);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border: 1px solid rgba(201, 169, 166, 0.3);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.back-link:hover {
		color: #f4a460;
		border-color: #f4a460;
	}

	/* Main Content Layout */
	.main-content {
		flex: 1;
		display: grid;
		grid-template-columns: 280px 1fr 250px;
		gap: 1.5rem;
		padding: 1.5rem 2rem;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	/* Panel Styles */
	.selector-panel,
	.puzzle-panel,
	.control-panel {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		overflow: hidden;
	}

	.panel-header {
		padding: 1rem 1.25rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.panel-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #f8fafc;
		margin: 0;
	}

	.puzzle-count {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.7);
	}

	/* Room Selectors */
	.room-selectors {
		padding: 1rem;
		max-height: calc(100vh - 220px);
		overflow-y: auto;
	}

	.room-group {
		margin-bottom: 1rem;
	}

	.room-header {
		padding: 0.5rem 0.75rem;
		border-left: 3px solid;
		margin-bottom: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.room-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #f8fafc;
		margin: 0;
	}

	.room-puzzle-count {
		font-size: 0.7rem;
		color: rgba(201, 169, 166, 0.6);
	}

	.puzzle-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.puzzle-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.puzzle-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--btn-color, #f4a460);
	}

	.puzzle-btn.selected {
		background: rgba(244, 164, 96, 0.2);
		border-color: var(--btn-color, #f4a460);
		box-shadow: 0 0 0 1px var(--btn-color, #f4a460);
	}

	.puzzle-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.puzzle-name {
		font-size: 0.8125rem;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Puzzle Panel */
	.puzzle-panel {
		display: flex;
		flex-direction: column;
	}

	.puzzle-header {
		padding: 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.puzzle-info {
		margin-bottom: 0.75rem;
	}

	.room-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
	}

	.puzzle-title {
		font-family: var(--font-display, 'Playfair Display', serif);
		font-size: 1.5rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 0.5rem 0;
	}

	.puzzle-description {
		color: rgba(201, 169, 166, 0.8);
		font-size: 0.875rem;
		margin: 0;
	}

	.status-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.25rem 0.625rem;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.badge.completed {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.badge.in-progress {
		background: rgba(244, 164, 96, 0.2);
		color: #f4a460;
	}

	.badge.attempts,
	.badge.time {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(201, 169, 166, 0.8);
	}

	/* Role Section */
	.role-section {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.role-toggle {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.role-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(201, 169, 166, 0.7);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.8125rem;
	}

	.role-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.role-btn.active {
		background: rgba(244, 164, 96, 0.2);
		border-color: var(--theme-primary, #f4a460);
		color: var(--theme-primary, #f4a460);
	}

	.role-icon {
		font-size: 1rem;
	}

	.role-hint {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.6);
		margin: 0;
		text-align: center;
	}

	/* Puzzle Canvas */
	.puzzle-canvas {
		flex: 1;
		margin: 1rem;
		border: 2px dashed;
		border-radius: 12px;
		min-height: 400px;
		position: relative;
	}

	.canvas-content {
		height: 100%;
		padding: 1.5rem;
	}

	.puzzle-visual {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1.5rem;
	}

	.puzzle-icon {
		width: 80px;
		height: 80px;
		opacity: 0.7;
	}

	.puzzle-instructions {
		text-align: center;
		max-width: 400px;
	}

	.puzzle-instructions h4 {
		font-size: 1rem;
		color: #f8fafc;
		margin: 0 0 0.5rem 0;
	}

	.puzzle-instructions p {
		color: rgba(201, 169, 166, 0.8);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
	}

	.role-info {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.8125rem;
		color: rgba(201, 169, 166, 0.8);
		text-align: left;
	}

	.role-info strong {
		color: var(--theme-primary, #f4a460);
	}

	/* Demo Controls */
	.interaction-area {
		margin-top: 1rem;
	}

	.demo-controls {
		display: flex;
		gap: 0.75rem;
	}

	.demo-btn {
		padding: 0.625rem 1.25rem;
		background: linear-gradient(135deg, var(--theme-primary, #f4a460), var(--theme-accent, #c9a66b));
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.demo-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(244, 164, 96, 0.3);
	}

	.demo-btn.secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	.demo-btn.secondary:hover {
		background: rgba(255, 255, 255, 0.2);
		box-shadow: none;
	}

	/* Completion Overlay */
	.completion-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.completion-content {
		text-align: center;
	}

	.completion-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #22c55e, #4ade80);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		color: white;
		margin: 0 auto 1rem;
	}

	.completion-content h3 {
		font-family: var(--font-display, 'Playfair Display', serif);
		font-size: 1.5rem;
		color: #22c55e;
		margin: 0 0 0.5rem;
	}

	.completion-content p {
		color: rgba(201, 169, 166, 0.8);
		font-size: 0.875rem;
		margin: 0 0 1.5rem;
	}

	.completion-stats {
		display: flex;
		gap: 2rem;
		justify-content: center;
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #f4a460;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.6);
	}

	/* Hints Section */
	.hints-section {
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.hints-section h4 {
		font-size: 0.875rem;
		color: #f8fafc;
		margin: 0 0 0.75rem;
	}

	.hints-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hint-card {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border-left: 3px solid var(--theme-primary, #f4a460);
	}

	.hint-tier {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--theme-primary, #f4a460);
		margin-right: 0.5rem;
	}

	.hint-card p {
		font-size: 0.8125rem;
		color: rgba(201, 169, 166, 0.9);
		margin: 0;
		display: inline;
	}

	/* Solution Section */
	.solution-section {
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(34, 197, 94, 0.05);
	}

	.solution-section h4 {
		font-size: 0.875rem;
		color: #22c55e;
		margin: 0 0 0.75rem;
	}

	.solution-content {
		font-size: 0.8125rem;
		color: rgba(201, 169, 166, 0.9);
	}

	.solution-content ul {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}

	.solution-content li {
		margin-bottom: 0.25rem;
	}

	.solution-content strong {
		color: var(--theme-primary, #f4a460);
	}

	.solution-note {
		font-style: italic;
		color: rgba(201, 169, 166, 0.6);
		font-size: 0.75rem;
		margin-top: 0.75rem;
	}

	/* No Puzzle Selected */
	.no-puzzle-selected {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
	}

	.placeholder-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-puzzle-selected h3 {
		font-size: 1.25rem;
		color: #f8fafc;
		margin: 0 0 0.5rem;
	}

	.no-puzzle-selected p {
		color: rgba(201, 169, 166, 0.6);
		font-size: 0.875rem;
	}

	/* Control Panel */
	.control-panel {
		display: flex;
		flex-direction: column;
	}

	.controls-grid {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.control-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-btn.reset:hover:not(:disabled) {
		border-color: #ef4444;
	}

	.control-btn.hint:hover:not(:disabled) {
		border-color: #fbbf24;
	}

	.control-btn.role:hover:not(:disabled) {
		border-color: #8b5cf6;
	}

	.control-btn.solution:hover:not(:disabled) {
		border-color: #22c55e;
	}

	.btn-icon {
		font-size: 1.25rem;
	}

	.btn-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	/* State Inspector */
	.state-inspector {
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.state-inspector h3 {
		font-size: 0.875rem;
		color: #f8fafc;
		margin: 0 0 0.75rem;
	}

	.state-display {
		font-size: 0.75rem;
	}

	.state-item {
		display: flex;
		justify-content: space-between;
		padding: 0.375rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.state-divider {
		height: 1px;
		background: var(--theme-primary, #D4A574);
		opacity: 0.3;
		margin: 0.5rem 0;
	}

	.state-key {
		color: rgba(201, 169, 166, 0.6);
	}

	.state-value {
		color: #e2e8f0;
		font-weight: 500;
	}

	.no-state {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.5);
		text-align: center;
		padding: 0.5rem;
	}

	/* Info Card */
	.info-card {
		margin: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 10px;
		border: 1px solid;
	}

	.info-card h4 {
		font-size: 0.8125rem;
		margin: 0 0 0.75rem;
	}

	.info-list {
		font-size: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 0;
	}

	.info-label {
		color: rgba(201, 169, 166, 0.6);
	}

	.info-value {
		color: #e2e8f0;
	}

	/* Footer */
	.footer {
		padding: 1rem 2rem;
		background: rgba(15, 23, 42, 0.8);
		border-top: 1px solid rgba(201, 169, 166, 0.2);
		text-align: center;
	}

	.footer-content {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
	}

	.footer-text {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.6);
	}

	.footer-divider {
		color: rgba(201, 169, 166, 0.3);
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.main-content {
			grid-template-columns: 250px 1fr;
		}

		.control-panel {
			grid-column: 1 / -1;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.controls-grid {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.control-btn {
			flex: 1;
			min-width: 150px;
		}
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.main-content {
			grid-template-columns: 1fr;
			padding: 1rem;
		}

		.selector-panel {
			order: 1;
		}

		.puzzle-panel {
			order: 2;
		}

		.control-panel {
			order: 3;
			grid-template-columns: 1fr;
		}

		.room-selectors {
			max-height: 300px;
		}
	}

	/* Torn Photographs Puzzle Styles */
	.torn-photo-puzzle {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.puzzle-layout {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 1.5rem;
		flex: 1;
	}

	.pieces-tray, .frame-area {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
		padding: 1rem;
	}

	.pieces-tray h4, .frame-area h4 {
		font-size: 0.875rem;
		color: #f8fafc;
		margin: 0 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pieces-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.piece-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.piece-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--theme-primary, #D4A574);
		transform: translateY(-2px);
	}

	.piece-btn.selected {
		background: rgba(212, 165, 116, 0.2);
		border-color: var(--theme-primary, #D4A574);
		box-shadow: 0 0 12px rgba(212, 165, 116, 0.4);
	}

	.piece-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.piece-preview {
		width: 48px;
		height: 48px;
	}

	.piece-icon {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #d4a574, #b38b60);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a2e;
		position: relative;
		overflow: hidden;
	}

	.piece-icon::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(93, 78, 55, 0.4) 100%);
	}

	.piece-label {
		font-size: 0.625rem;
		color: rgba(201, 169, 166, 0.8);
	}

	.selected-piece-info {
		background: rgba(212, 165, 116, 0.15);
		border: 1px solid rgba(212, 165, 116, 0.3);
		border-radius: 8px;
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.selected-piece-info p {
		margin: 0.25rem 0;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.9);
	}

	.selected-piece-info .piece-description {
		color: #f8fafc;
		font-style: italic;
	}

	.selected-piece-info .instruction {
		color: var(--theme-primary, #D4A574);
		font-weight: 600;
	}

	.instruction {
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.6);
		text-align: center;
		margin-top: 0.5rem;
	}

	.frame-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.frame-btn {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		background: rgba(255, 255, 255, 0.03);
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
	}

	.frame-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-style: solid;
		border-color: var(--theme-primary, #D4A574);
	}

	.frame-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.frame-btn.has-piece {
		border-style: solid;
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
	}

	.frame-btn.correct {
		border-color: #22c55e;
		background: rgba(34, 197, 94, 0.15);
	}

	.frame-btn.incorrect {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.15);
	}

	.frame-btn.feedback {
		animation: pulse 0.5s ease;
	}

	.frame-btn.feedback-correct {
		animation: correctPulse 0.5s ease;
	}

	.frame-btn.feedback-incorrect {
		animation: incorrectShake 0.5s ease;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	@keyframes correctPulse {
		0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
		50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
		100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
	}

	@keyframes incorrectShake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}

	.frame-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
	}

	.frame-clue {
		font-size: 0.625rem;
		color: rgba(201, 169, 166, 0.6);
		text-align: center;
		padding: 0 0.25rem;
	}

	.placed-piece {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.placed-piece .piece-icon {
		width: 56px;
		height: 56px;
	}

	.correct-indicator {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 20px;
		height: 20px;
		background: #22c55e;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.puzzle-progress {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		font-size: 0.75rem;
		color: rgba(201, 169, 166, 0.8);
	}

	.locking {
		color: #fbbf24;
		font-weight: 600;
		animation: pulse 1s infinite;
	}

	.lock-progress {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.lock-bar {
		height: 100%;
		background: linear-gradient(90deg, #22c55e, #4ade80);
		transition: width 0.1s linear;
	}

	/* Analyst View Styles */
	.analyst-view {
		padding: 1rem;
	}

	.analyst-view h4 {
		font-size: 1rem;
		color: #f8fafc;
		margin: 0 0 0.5rem;
	}

	.analyst-instruction {
		font-size: 0.8125rem;
		color: rgba(201, 169, 166, 0.7);
		margin-bottom: 1rem;
	}

	.clues-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.clue-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.clue-position {
		font-size: 0.625rem;
		color: rgba(201, 169, 166, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.clue-text {
		font-size: 0.8125rem;
		color: var(--theme-primary, #D4A574);
		font-weight: 600;
	}

	.clue-status.occupied {
		font-size: 0.625rem;
		color: #22c55e;
		margin-top: 0.25rem;
	}

	.piece-descriptions {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		padding: 1rem;
	}

	.piece-descriptions h5 {
		font-size: 0.8125rem;
		color: #f8fafc;
		margin: 0 0 0.75rem;
	}

	.piece-descriptions ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.piece-descriptions li {
		font-size: 0.6875rem;
		color: rgba(201, 169, 166, 0.8);
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
	}

	.piece-descriptions li strong {
		color: var(--theme-primary, #D4A574);
		display: block;
		margin-bottom: 0.25rem;
	}

	/* Play Again button */
	.play-again-btn {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, var(--theme-primary, #D4A574), var(--theme-accent, #C9A66B));
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.play-again-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
	}
</style>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';
	import type { PlayerRole } from '$lib/types';
	import type {
		TornPhotographsState,
		PhotoPiece,
		FrameOutline
	} from '$lib/puzzles/room1/torn-photographs';
	import { tornPhotograph } from '$lib/assets/puzzles/room1';

	// Import the sub-components
	import PuzzleContainer from './PuzzleContainer.svelte';
	import PuzzlePiece from './PuzzlePiece.svelte';

	// Props
	export let puzzleState: TornPhotographsState;
	export let playerRole: PlayerRole;
	export let timeElapsed: number = 0;

	const dispatch = createEventDispatcher();

	// Internal state
	let selectedPiece: string | null = null;
	let selectedFrame: string | null = null;
	let draggedPieceId: string | null = null;
	let dragPosition = { x: 0, y: 0 };
	let completionProgress = 0;
	let containerElement: HTMLElement;

	// Computed values
	$: isExplorer = playerRole === 'explorer';
	$: isAnalyst = playerRole === 'analyst';
	$: pieces = puzzleState?.pieces || [];
	$: frames = puzzleState?.frames || [];
	$: allPlaced = puzzleState?.allPlaced || false;
	$: completed = puzzleState?.completed || false;

	// Calculate progress percentage
	$: {
		const placedCount = pieces.filter(p => p.placed).length;
		completionProgress = Math.round((placedCount / pieces.length) * 100);
	}

	// SVG asset loaded
	let tornPhotoSvg: string = tornPhotograph;

	// Frame SVG template
	const frameSvgTemplate = `
		<svg viewBox="0 0 100 100" class="frame-svg">
			<defs>
				<linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#8b7355;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
				</linearGradient>
			</defs>
			<rect x="2" y="2" width="96" height="96" rx="4" fill="none" stroke="url(#frameGrad)" stroke-width="4"/>
			<rect x="10" y="10" width="80" height="80" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
		</svg>
	`;

	// Piece SVG template with index
	function getPieceSvg(index: number, description: string): string {
		const colors = ['#d4a574', '#c4956a', '#b38b60', '#c9a87c', '#bfa070'];
		const color = colors[index % colors.length];
		return `
			<svg viewBox="0 0 80 80" class="piece-svg">
				<defs>
					<linearGradient id="pieceGrad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:${color};stop-opacity:1" />
						<stop offset="100%" style="stop-color:#a08060;stop-opacity:1" />
					</linearGradient>
					<filter id="pieceShadow${index}">
						<feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
					</filter>
				</defs>
				<g filter="url(#pieceShadow${index})">
					<path d="M5,5 L75,5 L75,75 L5,75 Z" fill="url(#pieceGrad${index})" stroke="#8b7355" stroke-width="2"/>
					<text x="40" y="40" text-anchor="middle" dominant-baseline="middle" fill="#2a2a4a" font-size="24" font-weight="bold">${index + 1}</text>
				</g>
			</svg>
		`;
	}

	// Event handlers
	function handlePieceClick(pieceId: string): void {
		if (isExplorer) {
			selectedPiece = selectedPiece === pieceId ? null : pieceId;
			dispatch('piece:selected', { pieceId, selected: selectedPiece === pieceId });
		}
	}

	function handleFrameClick(frameId: string): void {
		if (isAnalyst && selectedFrame) {
			// If a frame is already selected, deselect
			selectedFrame = selectedFrame === frameId ? null : frameId;
		} else if (isAnalyst) {
			selectedFrame = frameId;
			dispatch('frame:selected', { frameId });
		}

		// If we have both a piece and frame selected (from different players), attempt placement
		if (selectedPiece && selectedFrame) {
			attemptPlacement(selectedPiece, selectedFrame);
		}
	}

	function handleDrop(event: DragEvent, frameId: string): void {
		event.preventDefault();

		if (draggedPieceId) {
			attemptPlacement(draggedPieceId, frameId);
			draggedPieceId = null;
		}
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
	}

	function handlePieceDragStart(pieceId: string): void {
		draggedPieceId = pieceId;
		dispatch('piece:dragstart', { pieceId });
	}

	function handlePieceDragEnd(): void {
		draggedPieceId = null;
		dispatch('piece:dragend');
	}

	function attemptPlacement(pieceId: string, frameId: string): void {
		dispatch('placement:attempt', { pieceId, frameId });

		// Clear selections
		selectedPiece = null;
		selectedFrame = null;
	}

	function handleHintRequest(event: CustomEvent): void {
		dispatch('hint:request', event.detail);
	}

	// Check if a piece is correctly placed
	function isPieceCorrect(piece: PhotoPiece): boolean | null {
		if (!piece.placed) return null;
		const frame = frames.find(f => f.occupyingPiece === piece.id);
		return frame ? frame.position === piece.correctFrame : null;
	}

	// Get piece by ID
	function getPieceById(pieceId: string): PhotoPiece | undefined {
		return pieces.find(p => p.id === pieceId);
	}

	// Grid position calculator for 3x3 grid
	function getGridPosition(index: number): { x: number; y: number } {
		const col = index % 3;
		const row = Math.floor(index / 3);
		return { x: col, y: row };
	}

	// Format description for display
	function formatDescription(description: string): string {
		// Truncate if too long
		return description.length > 50
			? description.substring(0, 47) + '...'
			: description;
	}

	onMount(() => {
		// Initialize any animations or setup
	});
</script>

<PuzzleContainer
	puzzleId="torn-photographs"
	puzzleTitle="Torn Photographs"
	roomTheme="attic"
	description="Match scattered photo pieces to their correct frames by describing what you see."
	{completed}
	timeElapsed={timeElapsed}
	on:hint:request={handleHintRequest}
>
	<div class="torn-photographs-puzzle" bind:this={containerElement}>
		<!-- Progress Bar -->
		<div class="progress-bar">
			<div class="progress-fill" style="width: {completionProgress}%"></div>
			<span class="progress-text">{completionProgress}% Complete</span>
		</div>

		<!-- Main puzzle area split by role -->
		<div class="puzzle-area" class:explorer-view={isExplorer} class:analyst-view={isAnalyst}>

			<!-- Explorer View: Photo Pieces -->
			{#if isExplorer}
				<div class="pieces-section">
					<h3 class="section-title">
						<svg viewBox="0 0 24 24" class="section-icon">
							<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
						</svg>
						Photo Pieces
					</h3>
					<p class="section-hint">Describe these pieces to your partner!</p>

					<div class="pieces-grid">
						{#each pieces as piece, index (piece.id)}
							{@const isSelected = selectedPiece === piece.id}
							{@const isPlaced = piece.placed}
							{@const isCorrect = isPieceCorrect(piece)}

							<div
								class="photo-piece-wrapper"
								class:selected={isSelected}
								class:placed={isPlaced}
								class:correct={isCorrect === true}
								class:incorrect={isCorrect === false}
								in:fly={{ y: 20, delay: index * 50, duration: 300 }}
							>
								{#if !isPlaced}
									<div
										class="photo-piece-card"
										class:dragging={draggedPieceId === piece.id}
										draggable="true"
										role="button"
										tabindex="0"
										aria-label="Photo piece {index + 1}: {piece.description}"
										aria-pressed={isSelected}
										on:click={() => handlePieceClick(piece.id)}
										on:keydown={(e) => e.key === 'Enter' && handlePieceClick(piece.id)}
										on:dragstart={() => handlePieceDragStart(piece.id)}
										on:dragend={handlePieceDragEnd}
									>
										<div class="piece-number">{index + 1}</div>
										<div class="piece-visual">
											{@html getPieceSvg(index, piece.description)}
										</div>
										<div class="piece-description">
											"{formatDescription(piece.description)}"
										</div>
									</div>
								{:else}
									<div class="placed-piece-indicator">
										<svg viewBox="0 0 24 24" class="check-icon">
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
										</svg>
										<span>Placed</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Analyst View: Frame Grid -->
			{#if isAnalyst}
				<div class="frames-section">
					<h3 class="section-title">
						<svg viewBox="0 0 24 24" class="section-icon">
							<path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 5h12l-3-4-2.03 2.71L10 13zm7-4.5c0-.83-.67-1.5-1.5-1.5S14 7.67 14 8.5s.67 1.5 1.5 1.5S17 9.33 17 8.5zM20 2h-7v2h7v7h2V4c0-1.1-.9-2-2-2zm0 18h-7v2h7c1.1 0 2-.9 2-2v-7h-2v7zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7z" fill="currentColor"/>
						</svg>
						Photo Frames
					</h3>
					<p class="section-hint">Match the descriptions to these frames!</p>

					<div class="frames-grid">
						{#each frames as frame, index (frame.id)}
							<div
								class="frame-slot"
								class:selected={selectedFrame === frame.id}
								class:occupied={frame.occupied}
								class:drop-target={draggedPieceId !== null}
								role="button"
								tabindex="0"
								aria-label="Frame {index + 1}: {frame.cornerClue}"
								on:click={() => handleFrameClick(frame.id)}
								on:keydown={(e) => e.key === 'Enter' && handleFrameClick(frame.id)}
								on:dragover={handleDragOver}
								on:drop={(e) => handleDrop(e, frame.id)}
							>
								<div class="frame-border">
									{@html frameSvgTemplate}
								</div>

								<div class="frame-clue">
									<span class="clue-label">Clue:</span>
									<span class="clue-text">{frame.cornerClue}</span>
								</div>

								{#if frame.occupied && frame.occupyingPiece}
									<div class="placed-piece">
										<div class="placed-piece-number">
											{pieces.findIndex(p => p.id === frame.occupyingPiece) + 1}
										</div>
									</div>
								{/if}

								<div class="frame-position">
									{index + 1}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Lock Timer Display (when all pieces placed) -->
			{#if allPlaced && !completed}
				<div class="lock-timer" in:fly={{ y: 20, duration: 300 }}>
					<div class="lock-timer-content">
						<div class="lock-icon">
							<svg viewBox="0 0 24 24">
								<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
							</svg>
						</div>
						<span class="lock-text">Verifying placement...</span>
					</div>
					<div class="lock-progress">
						<div class="lock-progress-bar" style="width: {(puzzleState?.lockTimer || 0) / 30}%"></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Communication hint -->
		<div class="communication-hint">
			{#if isExplorer}
				<span class="hint-icon">💡</span>
				<span>Describe your pieces to help the Analyst find the right frame!</span>
			{:else}
				<span class="hint-icon">💡</span>
				<span>Listen to the Explorer's descriptions and match them to frame clues!</span>
			{/if}
		</div>
	</div>
</PuzzleContainer>

<style>
	.torn-photographs-puzzle {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
		padding: 1rem;
	}

	/* Progress Bar */
	.progress-bar {
		position: relative;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #FFB74D 0%, #F4D0C3 100%);
		border-radius: 12px;
		transition: width 0.5s ease;
	}

	.progress-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: #ffffff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	/* Puzzle Area */
	.puzzle-area {
		flex: 1;
		position: relative;
		min-height: 400px;
	}

	/* Section Styles */
	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #FFB74D;
	}

	.section-icon {
		width: 24px;
		height: 24px;
	}

	.section-hint {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: #8b8baa;
	}

	/* Pieces Grid (Explorer) */
	.pieces-section {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.pieces-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}

	.photo-piece-wrapper {
		position: relative;
	}

	.photo-piece-card {
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: grab;
		transition: all 0.2s ease;
	}

	.photo-piece-card:hover {
		border-color: #FFB74D;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(255, 183, 77, 0.2);
	}

	.photo-piece-card:focus {
		outline: none;
		border-color: #FFB74D;
		box-shadow: 0 0 0 3px rgba(255, 183, 77, 0.3);
	}

	.photo-piece-card.dragging {
		opacity: 0.5;
		cursor: grabbing;
	}

	.photo-piece-wrapper.selected .photo-piece-card {
		border-color: #FFB74D;
		background: rgba(255, 183, 77, 0.1);
	}

	.piece-number {
		position: absolute;
		top: -8px;
		left: -8px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #FFB74D;
		color: #1a1a2e;
		font-size: 0.875rem;
		font-weight: 700;
		border-radius: 50%;
		z-index: 1;
	}

	.piece-visual {
		width: 100%;
		aspect-ratio: 1;
		margin-bottom: 0.5rem;
		border-radius: 8px;
		overflow: hidden;
	}

	.piece-visual :global(svg) {
		width: 100%;
		height: 100%;
	}

	.piece-description {
		font-size: 0.75rem;
		font-style: italic;
		color: #8b8baa;
		line-height: 1.4;
	}

	.placed-piece-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 120px;
		background: rgba(76, 175, 80, 0.1);
		border: 2px dashed #4CAF50;
		border-radius: 12px;
		color: #4CAF50;
	}

	.check-icon {
		width: 32px;
		height: 32px;
		margin-bottom: 0.5rem;
	}

	/* Frames Grid (Analyst) */
	.frames-section {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.frames-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		max-width: 500px;
		margin: 0 auto;
	}

	.frame-slot {
		position: relative;
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.frame-slot:hover {
		border-color: rgba(255, 183, 77, 0.5);
		background: rgba(255, 255, 255, 0.05);
	}

	.frame-slot:focus {
		outline: none;
		border-color: #FFB74D;
		box-shadow: 0 0 0 3px rgba(255, 183, 77, 0.3);
	}

	.frame-slot.selected {
		border-color: #FFB74D;
		background: rgba(255, 183, 77, 0.1);
	}

	.frame-slot.drop-target {
		border-style: dashed;
		border-color: #5fb3b3;
	}

	.frame-slot.occupied {
		background: rgba(76, 175, 80, 0.1);
		border-color: #4CAF50;
	}

	.frame-border {
		width: 60%;
		aspect-ratio: 1;
		opacity: 0.8;
	}

	.frame-border :global(svg) {
		width: 100%;
		height: 100%;
	}

	.frame-clue {
		text-align: center;
		margin-top: 0.5rem;
	}

	.clue-label {
		display: block;
		font-size: 0.625rem;
		color: #8b8baa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.clue-text {
		display: block;
		font-size: 0.75rem;
		color: #d4d4d4;
		font-weight: 500;
	}

	.placed-piece {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placed-piece-number {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #4CAF50;
		color: #ffffff;
		font-size: 1rem;
		font-weight: 700;
		border-radius: 50%;
	}

	.frame-position {
		position: absolute;
		bottom: 4px;
		right: 4px;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		color: #8b8baa;
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 4px;
	}

	/* Lock Timer */
	.lock-timer {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 1rem 1.5rem;
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid #FFB74D;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		z-index: 50;
	}

	.lock-timer-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.lock-icon {
		width: 24px;
		height: 24px;
		color: #FFB74D;
		animation: pulse 1s ease-in-out infinite;
	}

	.lock-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: #FFB74D;
	}

	.lock-progress {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.lock-progress-bar {
		height: 100%;
		background: #FFB74D;
		transition: width 0.1s linear;
	}

	/* Communication Hint */
	.communication-hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 183, 77, 0.1);
		border: 1px solid rgba(255, 183, 77, 0.2);
		border-radius: 8px;
		font-size: 0.875rem;
		color: #d4d4d4;
	}

	.hint-icon {
		font-size: 1.25rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.pieces-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.frames-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}

		.frame-clue {
			display: none;
		}
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>

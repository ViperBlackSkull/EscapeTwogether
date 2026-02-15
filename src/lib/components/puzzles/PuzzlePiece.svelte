<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';

	// Props
	export let id: string;
	export let pieceData: Record<string, unknown> = {};
	export let svgContent: string | null = null;
	export let assetUrl: string | null = null;
	export let disabled: boolean = false;
	export let selected: boolean = false;
	export let correct: boolean | null = null;
	export let draggable: boolean = true;
	export let clickable: boolean = true;
	export let size: { width: number; height: number } = { width: 80, height: 80 };

	const dispatch = createEventDispatcher();

	// Internal state
	let isDragging = false;
	let isHovered = false;
	let dragOffset = { x: 0, y: 0 };
	let position = { x: 0, y: 0 };
	let shakeAnimation = false;
	let glowAnimation = false;

	// Expose methods
	export function shake(): void {
		shakeAnimation = true;
		setTimeout(() => {
			shakeAnimation = false;
		}, 500);
	}

	export function glow(): void {
		glowAnimation = true;
	}

	export function stopGlow(): void {
		glowAnimation = false;
	}

	export function setPosition(x: number, y: number): void {
		position = { x, y };
	}

	export function getPosition(): { x: number; y: number } {
		return position;
	}

	// Event handlers
	function handleClick(event: MouseEvent): void {
		if (disabled || !clickable) return;
		dispatch('click', { id, pieceData, event });
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (disabled) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			dispatch('click', { id, pieceData, event });
		}
	}

	function handleDragStart(event: DragEvent): void {
		if (disabled || !draggable) {
			event.preventDefault();
			return;
		}

		isDragging = true;
		dispatch('dragstart', { id, pieceData, event });

		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', id);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragEnd(event: DragEvent): void {
		isDragging = false;
		dispatch('dragend', { id, pieceData, event });
	}

	function handleMouseEnter(event: MouseEvent): void {
		isHovered = true;
		dispatch('hover', { id, pieceData, isHovering: true, event });
	}

	function handleMouseLeave(event: MouseEvent): void {
		isHovered = false;
		dispatch('hover', { id, pieceData, isHovering: false, event });
	}

	// Touch support
	function handleTouchStart(event: TouchEvent): void {
		if (disabled || !draggable) return;
		const touch = event.touches[0];
		dragOffset = {
			x: touch.clientX - position.x,
			y: touch.clientY - position.y
		};
		dispatch('touchstart', { id, pieceData, touch, event });
	}

	function handleTouchMove(event: TouchEvent): void {
		if (disabled || !draggable) return;
		const touch = event.touches[0];
		position = {
			x: touch.clientX - dragOffset.x,
			y: touch.clientY - dragOffset.y
		};
		dispatch('touchmove', { id, pieceData, position, touch, event });
	}

	function handleTouchEnd(event: TouchEvent): void {
		dispatch('touchend', { id, pieceData, position, event });
	}

	// Computed classes
	$: stateClass = [
		'puzzle-piece',
		disabled && 'disabled',
		selected && 'selected',
		correct === true && 'correct',
		correct === false && 'incorrect',
		shakeAnimation && 'shake',
		glowAnimation && 'glow',
		isDragging && 'dragging'
	].filter(Boolean).join(' ');
</script>

{#if svgContent}
	<div
		class={stateClass}
		style="width: {size.width}px; height: {size.height}px; transform: translate({position.x}px, {position.y}px);"
		draggable={draggable && !disabled}
		on:click={handleClick}
		on:keydown={handleKeyDown}
		on:dragstart={handleDragStart}
		on:dragend={handleDragEnd}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		on:touchstart|preventDefault={handleTouchStart}
		on:touchmove|preventDefault={handleTouchMove}
		on:touchend={handleTouchEnd}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-label="Puzzle piece {id}"
		aria-disabled={disabled}
		aria-pressed={selected}
	>
		<!-- Render SVG content directly -->
		{@html svgContent}

		<!-- Visual feedback overlays -->
		{#if selected}
			<div class="selection-overlay" in:scale={{ start: 0.9, easing: backOut }}></div>
		{/if}

		{#if correct === true}
			<div class="correct-overlay" in:fly={{ y: -10, duration: 300 }}>
				<svg viewBox="0 0 24 24" class="checkmark-icon">
					<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
				</svg>
			</div>
		{/if}

		{#if correct === false}
			<div class="incorrect-overlay" in:fly={{ y: 10, duration: 300 }}>
				<svg viewBox="0 0 24 24" class="cross-icon">
					<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
				</svg>
			</div>
		{/if}
	</div>
{:else if assetUrl}
	<div
		class={stateClass}
		style="width: {size.width}px; height: {size.height}px; transform: translate({position.x}px, {position.y}px);"
		draggable={draggable && !disabled}
		on:click={handleClick}
		on:keydown={handleKeyDown}
		on:dragstart={handleDragStart}
		on:dragend={handleDragEnd}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		on:touchstart|preventDefault={handleTouchStart}
		on:touchmove|preventDefault={handleTouchMove}
		on:touchend={handleTouchEnd}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-label="Puzzle piece {id}"
		aria-disabled={disabled}
		aria-pressed={selected}
	>
		<img src={assetUrl} alt="Puzzle piece {id}" draggable="false" />

		{#if selected}
			<div class="selection-overlay" in:scale={{ start: 0.9, easing: backOut }}></div>
		{/if}

		{#if correct === true}
			<div class="correct-overlay" in:fly={{ y: -10, duration: 300 }}>
				<svg viewBox="0 0 24 24" class="checkmark-icon">
					<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
				</svg>
			</div>
		{/if}

		{#if correct === false}
			<div class="incorrect-overlay" in:fly={{ y: 10, duration: 300 }}>
				<svg viewBox="0 0 24 24" class="cross-icon">
					<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
				</svg>
			</div>
		{/if}
	</div>
{:else}
	<div
		class={stateClass}
		style="width: {size.width}px; height: {size.height}px; transform: translate({position.x}px, {position.y}px);"
		draggable={draggable && !disabled}
		on:click={handleClick}
		on:keydown={handleKeyDown}
		on:dragstart={handleDragStart}
		on:dragend={handleDragEnd}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		on:touchstart|preventDefault={handleTouchStart}
		on:touchmove|preventDefault={handleTouchMove}
		on:touchend={handleTouchEnd}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-label="Puzzle piece {id}"
		aria-disabled={disabled}
		aria-pressed={selected}
	>
		<slot name="content">
			<div class="default-piece">
				<span class="piece-label">{id}</span>
			</div>
		</slot>

		{#if selected}
			<div class="selection-overlay" in:scale={{ start: 0.9, easing: backOut }}></div>
		{/if}
	</div>
{/if}

<style>
	.puzzle-piece {
		position: absolute;
		cursor: grab;
		user-select: none;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		border-radius: 8px;
		overflow: hidden;
		background: var(--piece-bg, #3a3a5a);
		border: 2px solid var(--piece-border, #4a4a6a);
	}

	.puzzle-piece:hover:not(.disabled) {
		box-shadow: 0 0 15px rgba(255, 183, 77, 0.4);
		transform: scale(1.05);
		z-index: 10;
	}

	.puzzle-piece:focus {
		outline: 3px solid #FFB74D;
		outline-offset: 2px;
	}

	.puzzle-piece:focus:not(:focus-visible) {
		outline: none;
	}

	.puzzle-piece:focus-visible {
		outline: 3px solid #FFB74D;
		outline-offset: 2px;
	}

	.puzzle-piece.disabled {
		cursor: not-allowed;
		opacity: 0.5;
		pointer-events: none;
	}

	.puzzle-piece.selected {
		border-color: #FFB74D;
		box-shadow: 0 0 20px rgba(255, 183, 77, 0.6);
	}

	.puzzle-piece.dragging {
		cursor: grabbing;
		opacity: 0.8;
		z-index: 100;
	}

	.puzzle-piece.correct {
		border-color: #4CAF50;
		animation: correctPulse 0.5s ease-out;
	}

	.puzzle-piece.incorrect {
		border-color: #f44336;
		animation: shake 0.5s ease-out;
	}

	.puzzle-piece.glow {
		animation: glowPulse 1s ease-in-out infinite;
	}

	.puzzle-piece.shake {
		animation: shake 0.5s ease-out;
	}

	.puzzle-piece :global(svg) {
		width: 100%;
		height: 100%;
	}

	.puzzle-piece img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	.default-piece {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #3a3a5a 0%, #2a2a4a 100%);
	}

	.piece-label {
		font-size: 0.75rem;
		color: #8b8baa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.selection-overlay {
		position: absolute;
		inset: -4px;
		border: 3px solid #FFB74D;
		border-radius: 12px;
		pointer-events: none;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.correct-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(76, 175, 80, 0.2);
		border-radius: 8px;
	}

	.incorrect-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(244, 67, 54, 0.2);
		border-radius: 8px;
	}

	.checkmark-icon {
		width: 32px;
		height: 32px;
		color: #4CAF50;
	}

	.cross-icon {
		width: 32px;
		height: 32px;
		color: #f44336;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
		20%, 40%, 60%, 80% { transform: translateX(5px); }
	}

	@keyframes glowPulse {
		0%, 100% { box-shadow: 0 0 10px rgba(255, 183, 77, 0.4); }
		50% { box-shadow: 0 0 25px rgba(255, 183, 77, 0.8); }
	}

	@keyframes correctPulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.1); }
		100% { transform: scale(1); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>

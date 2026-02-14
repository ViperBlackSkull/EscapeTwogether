<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { Application, Container, Graphics, Text } from 'pixi.js';

	let canvasContainer: HTMLDivElement;
	let app: Application | null = null;
	let resizeObserver: ResizeObserver | null = null;

	// Touch state for mobile interactions
	let touchStartPos = { x: 0, y: 0 };
	let isTouching = false;
	let lastTapTime = 0;

	const dispatch = createEventDispatcher();

	// Touch event handlers
	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			touchStartPos = { x: touch.clientX, y: touch.clientY };
			isTouching = true;
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isTouching || event.touches.length !== 1) return;

		const touch = event.touches[0];
		const deltaX = touch.clientX - touchStartPos.x;
		const deltaY = touch.clientY - touchStartPos.y;

		// Dispatch pan event for camera/object movement
		dispatch('pan', { deltaX, deltaY, x: touch.clientX, y: touch.clientY });
	}

	function handleTouchEnd(event: TouchEvent) {
		if (!isTouching) return;
		isTouching = false;

		const touch = event.changedTouches[0];
		const deltaX = Math.abs(touch.clientX - touchStartPos.x);
		const deltaY = Math.abs(touch.clientY - touchStartPos.y);

		// If movement was minimal, consider it a tap
		if (deltaX < 10 && deltaY < 10) {
			const currentTime = Date.now();
			const timeSinceLastTap = currentTime - lastTapTime;

			// Double tap detection
			if (timeSinceLastTap < 300) {
				dispatch('doubletap', { x: touch.clientX, y: touch.clientY });
			} else {
				dispatch('tap', { x: touch.clientX, y: touch.clientY });
			}

			lastTapTime = currentTime;
		}
	}

	// Pinch zoom handlers
	let initialPinchDistance = 0;
	let currentScale = 1;

	function handleTouchStartPinch(event: TouchEvent) {
		if (event.touches.length === 2) {
			initialPinchDistance = getPinchDistance(event.touches);
		}
	}

	function handleTouchMovePinch(event: TouchEvent) {
		if (event.touches.length === 2) {
			const currentDistance = getPinchDistance(event.touches);
			if (initialPinchDistance > 0) {
				const scale = currentDistance / initialPinchDistance;
				dispatch('pinch', { scale, currentScale: scale * currentScale });
			}
		}
	}

	function handleTouchEndPinch(event: TouchEvent) {
		if (event.touches.length < 2) {
			initialPinchDistance = 0;
		}
	}

	function getPinchDistance(touches: TouchList): number {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	onMount(async () => {
		if (!browser || !canvasContainer) return;

		try {
			// Get initial dimensions
			const width = canvasContainer.clientWidth || 800;
			const height = canvasContainer.clientHeight || 600;

			// Initialize PixiJS Application
			app = new Application();

			await app.init({
				background: '#1a1a2e',
				width,
				height,
				antialias: true,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true
			});

			// Add canvas to the container
			canvasContainer.appendChild(app.canvas);

			// Handle resize with ResizeObserver
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width: newWidth, height: newHeight } = entry.contentRect;
					if (app && newWidth > 0 && newHeight > 0) {
						app.renderer.resize(newWidth, newHeight);
						// Redraw elements on resize
						redrawGameElements();
					}
				}
			});
			resizeObserver.observe(canvasContainer);

			// Create main game container
			const gameContainer = new Container();
			gameContainer.label = 'gameContainer';
			app.stage.addChild(gameContainer);

			// Create game elements
			createGameElements();

			console.log('PixiJS Application initialized');
			dispatch('ready');
		} catch (error) {
			console.error('Failed to initialize PixiJS:', error);
		}
	});

	// Store references to drawable elements for resize
	let backgroundGraphics: Graphics | null = null;
	let roomGraphics: Graphics | null = null;

	function createGameElements() {
		if (!app) return;

		const gameContainer = app.stage.getChildByLabel('gameContainer') as Container;
		if (!gameContainer) return;

		// Clear existing elements
		gameContainer.removeChildren();

		// Create background grid
		backgroundGraphics = createBackgroundGrid();
		gameContainer.addChild(backgroundGraphics);

		// Create room elements
		const roomElements = createRoomElements();
		roomElements.forEach(el => gameContainer.addChild(el));

		// Create player positions
		const players = createPlayerPositions();
		players.forEach(p => gameContainer.addChild(p));

		// Create ambient effects
		createAmbientEffects(gameContainer);
	}

	function redrawGameElements() {
		if (!app) return;

		const gameContainer = app.stage.getChildByLabel('gameContainer') as Container;
		if (!gameContainer) return;

		// Redraw background
		if (backgroundGraphics) {
			gameContainer.removeChild(backgroundGraphics);
			backgroundGraphics.destroy();
		}
		backgroundGraphics = createBackgroundGrid();
		gameContainer.addChildAt(backgroundGraphics, 0);

		// Redraw room elements
		const existingRoomElements = [...gameContainer.children].filter(
			(c): c is Graphics => c.label === 'roomElement' || c.label === 'roomLabel'
		);
		existingRoomElements.forEach(el => {
			gameContainer.removeChild(el);
			el.destroy();
		});

		const roomElements = createRoomElements();
		roomElements.forEach((el, i) => gameContainer.addChildAt(el, i + 1));

		// Redraw players
		const existingPlayers = [...gameContainer.children].filter((c): c is Graphics => c.label === 'player');
		existingPlayers.forEach(el => {
			gameContainer.removeChild(el);
			el.destroy();
		});

		const players = createPlayerPositions();
		players.forEach(p => gameContainer.addChild(p));
	}

	function createBackgroundGrid(): Graphics {
		if (!app) return new Graphics();

		const gridSize = 40;
		const graphics = new Graphics();

		// Draw grid lines
		graphics.setStrokeStyle({ width: 1, color: 0x3d3d5c, alpha: 0.3 });

		// Vertical lines
		for (let x = 0; x <= app.screen.width; x += gridSize) {
			graphics.moveTo(x, 0);
			graphics.lineTo(x, app.screen.height);
		}

		// Horizontal lines
		for (let y = 0; y <= app.screen.height; y += gridSize) {
			graphics.moveTo(0, y);
			graphics.lineTo(app.screen.width, y);
		}

		graphics.stroke();
		return graphics;
	}

	function createRoomElements(): Graphics[] {
		if (!app) return [];

		const elements: Graphics[] = [];
		const centerX = app.screen.width / 2;
		const centerY = app.screen.height / 2;

		// Responsive scaling based on screen size
		const scale = Math.min(app.screen.width / 800, app.screen.height / 600);
		const margin = Math.max(50, 100 * scale);

		// Create room walls
		const wallGraphics = new Graphics();
		wallGraphics.label = 'roomElement';

		// Outer walls
		wallGraphics.setStrokeStyle({ width: Math.max(4, 8 * scale), color: 0x8b7355 });
		wallGraphics.rect(margin, margin, app.screen.width - margin * 2, app.screen.height - margin * 2);
		wallGraphics.stroke();

		// Fill walls with semi-transparent color
		wallGraphics.setFillStyle({ color: 0x2a2a4a, alpha: 0.5 });
		wallGraphics.rect(margin, margin, app.screen.width - margin * 2, app.screen.height - margin * 2);
		wallGraphics.fill();

		// Make walls interactive for touch
		wallGraphics.eventMode = 'static';
		wallGraphics.on('pointerdown', () => {
			dispatch('interact', { type: 'room', id: 'floor' });
		});

		elements.push(wallGraphics);

		// Create a puzzle table in the center
		const tableSize = { width: Math.max(80, 120 * scale), height: Math.max(50, 80 * scale) };
		const table = new Graphics();
		table.label = 'roomElement';
		table.setFillStyle({ color: 0x8b4513 });
		table.roundRect(centerX - tableSize.width / 2, centerY - tableSize.height / 2, tableSize.width, tableSize.height, Math.max(5, 10 * scale));
		table.fill();
		table.setStrokeStyle({ width: Math.max(1, 2 * scale), color: 0x654321 });
		table.roundRect(centerX - tableSize.width / 2, centerY - tableSize.height / 2, tableSize.width, tableSize.height, Math.max(5, 10 * scale));
		table.stroke();

		// Make table interactive with touch support
		table.eventMode = 'static';
		table.cursor = 'pointer';
		table.on('pointerdown', () => {
			console.log('Table touched!');
			dispatch('interact', { type: 'table', id: 'puzzle-table' });
		});
		// Touch-specific events
		table.on('touchstart', (e: PointerEvent) => {
			dispatch('interact', { type: 'table', id: 'puzzle-table', pointerEvent: e });
		});

		elements.push(table);

		// Add label to table
		const tableLabel = new Text({
			text: 'Puzzle Table',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: Math.max(10, 12 * scale),
				fill: 0xd4a574
			}
		});
		tableLabel.label = 'roomLabel';
		tableLabel.anchor.set(0.5);
		tableLabel.x = centerX;
		tableLabel.y = centerY + tableSize.height / 2 + Math.max(10, 20 * scale);
		elements.push(tableLabel as unknown as Graphics);

		// Create a door on the right wall
		const doorWidth = Math.max(6, 8 * scale);
		const doorHeight = Math.max(60, 100 * scale);
		const door = new Graphics();
		door.label = 'roomElement';
		door.setFillStyle({ color: 0x654321 });
		door.rect(app.screen.width - margin - doorWidth + Math.max(2, 8 * scale), centerY - doorHeight / 2, doorWidth, doorHeight);
		door.fill();
		door.setStrokeStyle({ width: Math.max(1, 2 * scale), color: 0x8b7355 });
		door.rect(app.screen.width - margin - doorWidth + Math.max(2, 8 * scale), centerY - doorHeight / 2, doorWidth, doorHeight);
		door.stroke();

		door.eventMode = 'static';
		door.cursor = 'pointer';
		door.on('pointerdown', () => {
			console.log('Door touched!');
			dispatch('interact', { type: 'door', id: 'exit-door' });
		});

		elements.push(door);

		// Door label
		const doorLabel = new Text({
			text: 'Exit',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: Math.max(10, 12 * scale),
				fill: 0xd4a574
			}
		});
		doorLabel.label = 'roomLabel';
		doorLabel.anchor.set(0.5);
		doorLabel.x = app.screen.width - margin - doorWidth / 2 + Math.max(2, 4 * scale);
		doorLabel.y = centerY + doorHeight / 2 + Math.max(10, 15 * scale);
		elements.push(doorLabel as unknown as Graphics);

		// Create a chest in the corner
		const chestWidth = Math.max(40, 60 * scale);
		const chestHeight = Math.max(25, 40 * scale);
		const chest = new Graphics();
		chest.label = 'roomElement';
		chest.setFillStyle({ color: 0x8b4513 });
		chest.roundRect(margin + Math.max(20, 30 * scale), margin + Math.max(20, 30 * scale), chestWidth, chestHeight, Math.max(3, 5 * scale));
		chest.fill();
		chest.setStrokeStyle({ width: Math.max(1, 2 * scale), color: 0x654321 });
		chest.roundRect(margin + Math.max(20, 30 * scale), margin + Math.max(20, 30 * scale), chestWidth, chestHeight, Math.max(3, 5 * scale));
		chest.stroke();

		// Chest lid
		chest.setFillStyle({ color: 0xa0522d });
		chest.roundRect(margin + Math.max(18, 28 * scale), margin + Math.max(10, 20 * scale), chestWidth + Math.max(2, 4 * scale), Math.max(8, 15 * scale), Math.max(2, 3 * scale));
		chest.fill();

		chest.eventMode = 'static';
		chest.cursor = 'pointer';
		chest.on('pointerdown', () => {
			console.log('Chest touched!');
			dispatch('interact', { type: 'chest', id: 'treasure-chest' });
		});

		elements.push(chest);

		// Chest label
		const chestLabel = new Text({
			text: 'Chest',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: Math.max(10, 12 * scale),
				fill: 0xd4a574
			}
		});
		chestLabel.label = 'roomLabel';
		chestLabel.anchor.set(0.5);
		chestLabel.x = margin + Math.max(20, 30 * scale) + chestWidth / 2;
		chestLabel.y = margin + Math.max(20, 30 * scale) + chestHeight + Math.max(8, 15 * scale);
		elements.push(chestLabel as unknown as Graphics);

		return elements;
	}

	function createPlayerPositions(): Graphics[] {
		if (!app) return [];

		const elements: Graphics[] = [];
		const centerX = app.screen.width / 2;
		const centerY = app.screen.height / 2;

		// Responsive scaling
		const scale = Math.min(app.screen.width / 800, app.screen.height / 600);
		const playerRadius = Math.max(15, 20 * scale);
		const playerOffset = Math.max(100, 150 * scale);

		// Player 1 position (left side)
		const player1 = new Graphics();
		player1.label = 'player';
		player1.setFillStyle({ color: 0xd4a574 });
		player1.circle(centerX - playerOffset, centerY + Math.max(60, 100 * scale), playerRadius);
		player1.fill();
		player1.setStrokeStyle({ width: Math.max(2, 3 * scale), color: 0xf4c794 });
		player1.circle(centerX - playerOffset, centerY + Math.max(60, 100 * scale), playerRadius);
		player1.stroke();

		// Player 1 label
		const player1Label = new Text({
			text: 'P1',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: Math.max(10, 14 * scale),
				fontWeight: 'bold',
				fill: 0x1a1a2e
			}
		});
		player1Label.label = 'player';
		player1Label.anchor.set(0.5);
		player1Label.x = centerX - playerOffset;
		player1Label.y = centerY + Math.max(60, 100 * scale);

		elements.push(player1);
		elements.push(player1Label as unknown as Graphics);

		// Player 2 position (right side)
		const player2 = new Graphics();
		player2.label = 'player';
		player2.setFillStyle({ color: 0x5fb3b3 });
		player2.circle(centerX + playerOffset, centerY + Math.max(60, 100 * scale), playerRadius);
		player2.fill();
		player2.setStrokeStyle({ width: Math.max(2, 3 * scale), color: 0x8fd4d4 });
		player2.circle(centerX + playerOffset, centerY + Math.max(60, 100 * scale), playerRadius);
		player2.stroke();

		// Player 2 label
		const player2Label = new Text({
			text: 'P2',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: Math.max(10, 14 * scale),
				fontWeight: 'bold',
				fill: 0x1a1a2e
			}
		});
		player2Label.label = 'player';
		player2Label.anchor.set(0.5);
		player2Label.x = centerX + playerOffset;
		player2Label.y = centerY + Math.max(60, 100 * scale);

		elements.push(player2);
		elements.push(player2Label as unknown as Graphics);

		return elements;
	}

	function createAmbientEffects(container: Container) {
		if (!app) return;

		// Create floating particles - fewer on mobile for performance
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		const particleCount = isMobile ? 5 : 10;
		const particles: Graphics[] = [];

		for (let i = 0; i < particleCount; i++) {
			const particle = new Graphics();
			particle.setFillStyle({ color: 0xd4a574, alpha: 0.3 });
			particle.circle(0, 0, Math.random() * 3 + 1);
			particle.fill();

			particle.x = Math.random() * app.screen.width;
			particle.y = Math.random() * app.screen.height;

			particles.push(particle);
			container.addChild(particle);
		}

		// Animate particles
		let time = 0;
		app.ticker.add(() => {
			time += 0.01;
			particles.forEach((particle, index) => {
				particle.y += Math.sin(time + index) * 0.2;
				particle.x += Math.cos(time + index * 0.5) * 0.1;

				// Wrap around screen
				if (particle.y > app!.screen.height) particle.y = 0;
				if (particle.y < 0) particle.y = app!.screen.height;
				if (particle.x > app!.screen.width) particle.x = 0;
				if (particle.x < 0) particle.x = app!.screen.width;
			});
		});
	}

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (app) {
			app.destroy(true, { children: true, texture: true });
			app = null;
		}
	});
</script>

<div
	bind:this={canvasContainer}
	class="w-full h-full touch-none"
	style="min-height: 300px;"
	on:touchstart|passive={handleTouchStart}
	on:touchmove|passive={handleTouchMove}
	on:touchend|passive={handleTouchEnd}
	on:touchstart|passive={handleTouchStartPinch}
	on:touchmove|passive={handleTouchMovePinch}
	on:touchend|passive={handleTouchEndPinch}
></div>

<style>
	div :global(canvas) {
		display: block;
	}
</style>

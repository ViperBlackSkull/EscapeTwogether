<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { Application, Container, Graphics, Text } from 'pixi.js';

	let canvasContainer: HTMLDivElement;
	let app: Application | null = null;
	let resizeObserver: ResizeObserver | null = null;

	const dispatch = createEventDispatcher();

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
					}
				}
			});
			resizeObserver.observe(canvasContainer);

			// Create main game container
			const gameContainer = new Container();
			app.stage.addChild(gameContainer);

			// Create background grid
			createBackgroundGrid(gameContainer);

			// Create placeholder room elements
			createRoomElements(gameContainer);

			// Create player positions
			createPlayerPositions(gameContainer);

			// Add some ambient effects
			createAmbientEffects(gameContainer);

			console.log('PixiJS Application initialized');
			dispatch('ready');
		} catch (error) {
			console.error('Failed to initialize PixiJS:', error);
		}
	});

	function createBackgroundGrid(container: Container) {
		if (!app) return;

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
		container.addChild(graphics);
	}

	function createRoomElements(container: Container) {
		if (!app) return;

		const centerX = app.screen.width / 2;
		const centerY = app.screen.height / 2;

		// Create room walls
		const wallGraphics = new Graphics();

		// Outer walls
		wallGraphics.setStrokeStyle({ width: 8, color: 0x8b7355 });
		wallGraphics.rect(100, 100, app.screen.width - 200, app.screen.height - 200);
		wallGraphics.stroke();

		// Fill walls with semi-transparent color
		wallGraphics.setFillStyle({ color: 0x2a2a4a, alpha: 0.5 });
		wallGraphics.rect(100, 100, app.screen.width - 200, app.screen.height - 200);
		wallGraphics.fill();

		container.addChild(wallGraphics);

		// Create a puzzle table in the center
		const table = new Graphics();
		table.setFillStyle({ color: 0x8b4513 });
		table.roundRect(centerX - 60, centerY - 40, 120, 80, 10);
		table.fill();
		table.setStrokeStyle({ width: 2, color: 0x654321 });
		table.roundRect(centerX - 60, centerY - 40, 120, 80, 10);
		table.stroke();

		// Make table interactive
		table.eventMode = 'static';
		table.cursor = 'pointer';
		table.on('pointerdown', () => {
			console.log('Table clicked!');
			dispatch('interact', { type: 'table', id: 'puzzle-table' });
		});

		container.addChild(table);

		// Add label to table
		const tableLabel = new Text({
			text: 'Puzzle Table',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: 12,
				fill: 0xd4a574
			}
		});
		tableLabel.anchor.set(0.5);
		tableLabel.x = centerX;
		tableLabel.y = centerY + 60;
		container.addChild(tableLabel);

		// Create a door on the right wall
		const door = new Graphics();
		door.setFillStyle({ color: 0x654321 });
		door.rect(app.screen.width - 108, centerY - 50, 8, 100);
		door.fill();
		door.setStrokeStyle({ width: 2, color: 0x8b7355 });
		door.rect(app.screen.width - 108, centerY - 50, 8, 100);
		door.stroke();

		door.eventMode = 'static';
		door.cursor = 'pointer';
		door.on('pointerdown', () => {
			console.log('Door clicked!');
			dispatch('interact', { type: 'door', id: 'exit-door' });
		});

		container.addChild(door);

		// Door label
		const doorLabel = new Text({
			text: 'Exit Door',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: 12,
				fill: 0xd4a574
			}
		});
		doorLabel.anchor.set(0.5);
		doorLabel.x = app.screen.width - 104;
		doorLabel.y = centerY + 70;
		container.addChild(doorLabel);

		// Create a chest in the corner
		const chest = new Graphics();
		chest.setFillStyle({ color: 0x8b4513 });
		chest.roundRect(130, 130, 60, 40, 5);
		chest.fill();
		chest.setStrokeStyle({ width: 2, color: 0x654321 });
		chest.roundRect(130, 130, 60, 40, 5);
		chest.stroke();

		// Chest lid
		chest.setFillStyle({ color: 0xa0522d });
		chest.roundRect(128, 120, 64, 15, 3);
		chest.fill();

		chest.eventMode = 'static';
		chest.cursor = 'pointer';
		chest.on('pointerdown', () => {
			console.log('Chest clicked!');
			dispatch('interact', { type: 'chest', id: 'treasure-chest' });
		});

		container.addChild(chest);

		// Chest label
		const chestLabel = new Text({
			text: 'Chest',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: 12,
				fill: 0xd4a574
			}
		});
		chestLabel.anchor.set(0.5);
		chestLabel.x = 160;
		chestLabel.y = 185;
		container.addChild(chestLabel);
	}

	function createPlayerPositions(container: Container) {
		if (!app) return;

		const centerX = app.screen.width / 2;
		const centerY = app.screen.height / 2;

		// Player 1 position (left side)
		const player1 = new Graphics();
		player1.setFillStyle({ color: 0xd4a574 });
		player1.circle(centerX - 150, centerY + 100, 20);
		player1.fill();
		player1.setStrokeStyle({ width: 3, color: 0xf4c794 });
		player1.circle(centerX - 150, centerY + 100, 20);
		player1.stroke();

		// Player 1 label
		const player1Label = new Text({
			text: 'P1',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: 14,
				fontWeight: 'bold',
				fill: 0x1a1a2e
			}
		});
		player1Label.anchor.set(0.5);
		player1Label.x = centerX - 150;
		player1Label.y = centerY + 100;
		container.addChild(player1);
		container.addChild(player1Label);

		// Player 2 position (right side)
		const player2 = new Graphics();
		player2.setFillStyle({ color: 0x5fb3b3 });
		player2.circle(centerX + 150, centerY + 100, 20);
		player2.fill();
		player2.setStrokeStyle({ width: 3, color: 0x8fd4d4 });
		player2.circle(centerX + 150, centerY + 100, 20);
		player2.stroke();

		// Player 2 label
		const player2Label = new Text({
			text: 'P2',
			style: {
				fontFamily: 'Lato, sans-serif',
				fontSize: 14,
				fontWeight: 'bold',
				fill: 0x1a1a2e
			}
		});
		player2Label.anchor.set(0.5);
		player2Label.x = centerX + 150;
		player2Label.y = centerY + 100;
		container.addChild(player2);
		container.addChild(player2Label);
	}

	function createAmbientEffects(container: Container) {
		if (!app) return;

		// Create floating particles
		const particles: Graphics[] = [];

		for (let i = 0; i < 10; i++) {
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
	class="w-full h-full"
	style="min-height: 400px;"
></div>

<style>
	div :global(canvas) {
		display: block;
	}
</style>

/**
 * PuzzleRenderer - Visual puzzle rendering system for EscapeTwogether
 * Handles SVG asset loading, PixiJS rendering, and animations for puzzles
 *
 * Supports both SVG assets from /puzzles/assets/ and PNG assets from /assets/images/puzzles/
 */

import {
	Application,
	Container,
	Graphics,
	Sprite,
	Texture,
	Assets,
	Text,
	FederatedPointerEvent,
	AnimatedSprite,
	Ticker
} from 'pixi.js';
import type { PuzzleState, RoomId } from '$lib/types';
import { puzzleImages, type PuzzleImageKey } from '$lib/assets/images';

// ============================================
// Type Definitions
// ============================================

export interface PuzzlePiece {
	id: string;
	type: 'interactive' | 'static' | 'background';
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	scale?: number;
	visible?: boolean;
	interactive?: boolean;
	assetKey?: string;
	container?: Container;
	sprite?: Sprite;
	data?: Record<string, unknown>;
}

export interface PuzzleAsset {
	id: string;
	url: string;
	texture?: Texture;
	loaded: boolean;
}

export interface AnimationConfig {
	type: 'fadeIn' | 'fadeOut' | 'scale' | 'glow' | 'shake' | 'bounce' | 'rotate' | 'pulse';
	duration: number; // ms
	easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
	delay?: number;
	repeat?: number;
	from?: Record<string, number>;
	to?: Record<string, number>;
	onComplete?: () => void;
}

export interface HighlightConfig {
	color: number;
	alpha: number;
	pulseSpeed: number;
	glowSize: number;
}

export interface PuzzleRendererOptions {
	container: Container;
	room: RoomId;
	puzzleId: string;
	width: number;
	height: number;
	onPieceClick?: (pieceId: string, event: FederatedPointerEvent) => void;
	onPieceHover?: (pieceId: string, isHovering: boolean) => void;
}

// ============================================
// Animation Presets
// ============================================

export const ANIMATION_PRESETS = {
	puzzleAppear: {
		type: 'fadeIn' as const,
		duration: 500,
		easing: 'easeOut' as const,
		from: { alpha: 0, scale: 0.8 },
		to: { alpha: 1, scale: 1 }
	},
	pieceHover: {
		type: 'glow' as const,
		duration: 200,
		easing: 'easeOut' as const
	},
	pieceClick: {
		type: 'scale' as const,
		duration: 100,
		easing: 'easeInOut' as const,
		from: { scale: 1 },
		to: { scale: 0.95 },
		repeat: 2
	},
	puzzleComplete: {
		type: 'scale' as const,
		duration: 600,
		easing: 'easeOut' as const,
		from: { scale: 1 },
		to: { scale: 1.1 },
		repeat: 1
	},
	hintAppear: {
		type: 'pulse' as const,
		duration: 1000,
		easing: 'easeInOut' as const,
		repeat: 3
	}
};

// ============================================
// Puzzle Renderer Class
// ============================================

export class PuzzleRenderer {
	private container: Container;
	private puzzleContainer: Container;
	private highlightContainer: Container;
	private piecesContainer: Container;
	private overlayContainer: Container;

	private room: RoomId;
	private puzzleId: string;
	private width: number;
	private height: number;

	private assets: Map<string, PuzzleAsset> = new Map();
	private pieces: Map<string, PuzzlePiece> = new Map();
	private animations: Map<string, AnimationConfig[]> = new Map();
	private highlights: Map<string, Graphics> = new Map();

	private onPieceClick?: (pieceId: string, event: FederatedPointerEvent) => void;
	private onPieceHover?: (pieceId: string, isHovering: boolean) => void;

	private isLoaded: boolean = false;
	private isDestroyed: boolean = false;
	private tickerCallback?: () => void;
	private glowFilterTime: number = 0;

	constructor(options: PuzzleRendererOptions) {
		this.container = options.container;
		this.room = options.room;
		this.puzzleId = options.puzzleId;
		this.width = options.width;
		this.height = options.height;
		this.onPieceClick = options.onPieceClick;
		this.onPieceHover = options.onPieceHover;

		// Create container hierarchy
		this.puzzleContainer = new Container();
		this.puzzleContainer.label = `puzzle-${this.puzzleId}`;

		this.highlightContainer = new Container();
		this.highlightContainer.label = 'highlights';

		this.piecesContainer = new Container();
		this.piecesContainer.label = 'pieces';

		this.overlayContainer = new Container();
		this.overlayContainer.label = 'overlay';

		// Add containers in order
		this.puzzleContainer.addChild(this.highlightContainer);
		this.puzzleContainer.addChild(this.piecesContainer);
		this.puzzleContainer.addChild(this.overlayContainer);

		this.container.addChild(this.puzzleContainer);
	}

	// ============================================
	// Asset Loading
	// ============================================

	/**
	 * Load puzzle SVG assets for a specific room and puzzle
	 */
	async loadPuzzleAssets(room: string, puzzleId: string): Promise<void> {
		const roomKey = this.getRoomKey(room);
		const assetBasePath = `/puzzles/assets/${roomKey}/${puzzleId}`;

		// Define standard puzzle assets
		const assetManifest = this.getAssetManifest(roomKey, puzzleId);

		try {
			// Load all assets in the manifest
			const loadPromises = assetManifest.map(async (asset) => {
				const fullUrl = `${assetBasePath}/${asset.url}`;

				try {
					// For SVG files, we'll use Assets.load
					const texture = await Assets.load(fullUrl);

					const puzzleAsset: PuzzleAsset = {
						id: asset.id,
						url: fullUrl,
						texture: texture,
						loaded: true
					};

					this.assets.set(asset.id, puzzleAsset);
					return puzzleAsset;
				} catch (error) {
					console.warn(`Failed to load asset: ${asset.id}`, error);
					return {
						id: asset.id,
						url: fullUrl,
						loaded: false
					};
				}
			});

			await Promise.all(loadPromises);
			this.isLoaded = true;
			console.log(`Puzzle assets loaded for ${puzzleId}`);
		} catch (error) {
			console.error('Error loading puzzle assets:', error);
			throw error;
		}
	}

	/**
	 * Get the room key for asset paths
	 */
	private getRoomKey(room: string): string {
		const roomMap: Record<string, string> = {
			attic: 'room1',
			clock_tower: 'room2',
			garden_conservatory: 'room3'
		};
		return roomMap[room] || room;
	}

	/**
	 * Get the asset manifest for a puzzle
	 */
	private getAssetManifest(roomKey: string, puzzleId: string): Array<{ id: string; url: string }> {
		// Return a standard set of assets that puzzles typically need
		return [
			{ id: `${puzzleId}-background`, url: 'background.svg' },
			{ id: `${puzzleId}-frame`, url: 'frame.svg' },
			{ id: `${puzzleId}-pieces`, url: 'pieces.svg' }
		];
	}

	/**
	 * Register a custom asset
	 */
	registerAsset(id: string, url: string): void {
		this.assets.set(id, {
			id,
			url,
			loaded: false
		});
	}

	/**
	 * Load a registered asset
	 */
	async loadAsset(id: string): Promise<boolean> {
		const asset = this.assets.get(id);
		if (!asset) return false;

		if (asset.loaded && asset.texture) return true;

		try {
			const texture = await Assets.load(asset.url);
			asset.texture = texture;
			asset.loaded = true;
			return true;
		} catch {
			return false;
		}
	}

	// ============================================
	// Puzzle Rendering
	// ============================================

	/**
	 * Render the puzzle based on current state
	 */
	renderPuzzle(state: PuzzleState): void {
		if (!this.isLoaded) {
			console.warn('Assets not loaded, cannot render puzzle');
			return;
		}

		// Clear existing pieces
		this.clearPieces();

		// Render puzzle based on puzzle ID
		switch (this.puzzleId) {
			case 'torn-photographs':
				this.renderTornPhotographs(state);
				break;
			case 'music-box':
				this.renderMusicBox(state);
				break;
			case 'love-letter-cipher':
				this.renderLoveLetterCipher(state);
				break;
			case 'secret-message':
				this.renderSecretMessage(state);
				break;
			case 'trunk-lock':
				this.renderTrunkLock(state);
				break;
			case 'clock-face':
			case 'gear-alignment':
			case 'pendulum':
			case 'windup-key':
			case 'midnight-chime':
			case 'bell-codes':
				this.renderClockTowerPuzzle(state);
				break;
			case 'seed-packets':
			case 'light-spectrum':
			case 'water-flow':
			case 'bloom-timing':
			case 'hybridization':
			case 'trellis':
			case 'final-bloom':
				this.renderGardenPuzzle(state);
				break;
			default:
				this.renderGenericPuzzle(state);
		}
	}

	/**
	 * Clear all pieces from the renderer
	 */
	private clearPieces(): void {
		this.piecesContainer.removeChildren();
		this.pieces.clear();
		this.highlights.clear();

		// Clear highlight container as well
		this.highlightContainer.removeChildren();
	}

	/**
	 * Add a piece to the puzzle
	 */
	addPiece(piece: PuzzlePiece): void {
		// Create container for the piece
		const pieceContainer = new Container();
		pieceContainer.label = piece.id;
		pieceContainer.x = piece.x;
		pieceContainer.y = piece.y;
		pieceContainer.rotation = piece.rotation ?? 0;
		pieceContainer.scale.set(piece.scale ?? 1);
		pieceContainer.visible = piece.visible ?? true;

		// Create sprite from asset if available
		if (piece.assetKey) {
			const asset = this.assets.get(piece.assetKey);
			if (asset?.texture) {
				const sprite = new Sprite(asset.texture);
				sprite.width = piece.width;
				sprite.height = piece.height;
				sprite.anchor.set(0.5);
				piece.sprite = sprite;
				pieceContainer.addChild(sprite);
			}
		}

		// Make interactive if specified
		if (piece.interactive) {
			pieceContainer.eventMode = 'static';
			pieceContainer.cursor = 'pointer';

			pieceContainer.on('pointerdown', (event: FederatedPointerEvent) => {
				this.handlePieceClick(piece.id, event);
			});

			pieceContainer.on('pointerover', () => {
				this.handlePieceHover(piece.id, true);
			});

			pieceContainer.on('pointerout', () => {
				this.handlePieceHover(piece.id, false);
			});
		}

		piece.container = pieceContainer;
		this.pieces.set(piece.id, piece);
		this.piecesContainer.addChild(pieceContainer);
	}

	/**
	 * Update a piece's properties
	 */
	updatePiece(pieceId: string, updates: Partial<PuzzlePiece>): void {
		const piece = this.pieces.get(pieceId);
		if (!piece) return;

		Object.assign(piece, updates);

		if (piece.container) {
			if (updates.x !== undefined) piece.container.x = updates.x;
			if (updates.y !== undefined) piece.container.y = updates.y;
			if (updates.rotation !== undefined) piece.container.rotation = updates.rotation;
			if (updates.scale !== undefined) piece.container.scale.set(updates.scale);
			if (updates.visible !== undefined) piece.container.visible = updates.visible;
		}
	}

	/**
	 * Remove a piece from the puzzle
	 */
	removePiece(pieceId: string): void {
		const piece = this.pieces.get(pieceId);
		if (!piece) return;

		if (piece.container) {
			this.piecesContainer.removeChild(piece.container);
			piece.container.destroy();
		}

		this.pieces.delete(pieceId);
		this.highlights.delete(pieceId);
	}

	// ============================================
	// Puzzle-Specific Renderers
	// ============================================

	private renderTornPhotographs(state: PuzzleState): void {
		const data = state.data as Record<string, unknown>;
		const fragments = (data.fragments as Array<{ id: string; x: number; y: number; rotation: number }>) || [];

		// Render each photograph fragment
		fragments.forEach((fragment, index) => {
			this.addPiece({
				id: fragment.id,
				type: 'interactive',
				x: fragment.x,
				y: fragment.y,
				width: 100,
				height: 80,
				rotation: fragment.rotation,
				interactive: true,
				assetKey: `photo-fragment-${index}`,
				data: { index }
			});
		});
	}

	private renderMusicBox(state: PuzzleState): void {
		const data = state.data as Record<string, unknown>;
		const gears = (data.gears as Array<{ id: string; placed: boolean; slot?: string }>) || [];
		const slots = (data.slots as Array<{ id: string; position: number }>) || [];

		// Render gear slots
		slots.forEach((slot, index) => {
			const placedGear = gears.find(g => g.slot === slot.id);
			this.addPiece({
				id: slot.id,
				type: 'interactive',
				x: 150 + index * 120,
				y: this.height / 2,
				width: 80,
				height: 80,
				interactive: true,
				data: { type: 'slot', position: slot.position, hasGear: !!placedGear }
			});
		});

		// Render available gears
		gears.filter(g => !g.placed).forEach((gear, index) => {
			this.addPiece({
				id: gear.id,
				type: 'interactive',
				x: 100,
				y: 100 + index * 90,
				width: 60,
				height: 60,
				interactive: true,
				data: { type: 'gear' }
			});
		});
	}

	private renderLoveLetterCipher(state: PuzzleState): void {
		const data = state.data as Record<string, unknown>;
		const letters = (data.letters as Array<{ char: string; position: number }>) || [];

		// Render cipher grid
		letters.forEach((letter, index) => {
			const row = Math.floor(index / 10);
			const col = index % 10;
			this.addPiece({
				id: `letter-${index}`,
				type: 'interactive',
				x: 50 + col * 40,
				y: 50 + row * 40,
				width: 35,
				height: 35,
				interactive: true,
				data: { char: letter.char, position: letter.position }
			});
		});
	}

	private renderSecretMessage(state: PuzzleState): void {
		const data = state.data as Record<string, unknown>;
		const clues = (data.clues as Array<{ id: string; revealed: boolean }>) || [];

		clues.forEach((clue, index) => {
			this.addPiece({
				id: clue.id,
				type: clue.revealed ? 'static' : 'interactive',
				x: 100 + (index % 3) * 150,
				y: 100 + Math.floor(index / 3) * 100,
				width: 120,
				height: 80,
				interactive: !clue.revealed,
				data: { revealed: clue.revealed }
			});
		});
	}

	private renderTrunkLock(state: PuzzleState): void {
		const data = state.data as Record<string, unknown>;
		const dials = (data.dials as Array<{ id: string; position: number; value: string }>) || [];

		dials.forEach((dial, index) => {
			this.addPiece({
				id: dial.id,
				type: 'interactive',
				x: 150 + index * 80,
				y: this.height / 2,
				width: 60,
				height: 120,
				interactive: true,
				data: { position: dial.position, value: dial.value }
			});
		});
	}

	private renderClockTowerPuzzle(state: PuzzleState): void {
		// Generic clock tower puzzle rendering
		const data = state.data as Record<string, unknown>;
		const pieces = (data.pieces as Array<{ id: string; x: number; y: number }>) || [];

		pieces.forEach(piece => {
			this.addPiece({
				id: piece.id,
				type: 'interactive',
				x: piece.x,
				y: piece.y,
				width: 60,
				height: 60,
				interactive: true,
				data: { puzzleType: this.puzzleId }
			});
		});
	}

	private renderGardenPuzzle(state: PuzzleState): void {
		// Generic garden puzzle rendering
		const data = state.data as Record<string, unknown>;
		const elements = (data.elements as Array<{ id: string; x: number; y: number; type: string }>) || [];

		elements.forEach(element => {
			this.addPiece({
				id: element.id,
				type: 'interactive',
				x: element.x,
				y: element.y,
				width: 80,
				height: 80,
				interactive: true,
				data: { elementType: element.type }
			});
		});
	}

	private renderGenericPuzzle(state: PuzzleState): void {
		// Generic fallback renderer
		const data = state.data as Record<string, unknown>;
		const items = (data.items as Array<{ id: string }>) || [];

		items.forEach((item, index) => {
			const row = Math.floor(index / 4);
			const col = index % 4;
			this.addPiece({
				id: item.id,
				type: 'interactive',
				x: 80 + col * 120,
				y: 80 + row * 100,
				width: 80,
				height: 80,
				interactive: true,
				data: {}
			});
		});
	}

	// ============================================
	// Animation System
	// ============================================

	/**
	 * Animate a specific piece
	 */
	animatePiece(pieceId: string, animation: string | AnimationConfig): Promise<void> {
		return new Promise((resolve) => {
			const piece = this.pieces.get(pieceId);
			if (!piece?.container) {
				resolve();
				return;
			}

			// Get animation config
			const config: AnimationConfig = typeof animation === 'string'
				? { ...ANIMATION_PRESETS[animation as keyof typeof ANIMATION_PRESETS] }
				: animation;

			config.onComplete = () => {
				this.animations.delete(pieceId);
				resolve();
			};

			// Start animation
			this.runAnimation(piece, config);
		});
	}

	/**
	 * Run an animation on a piece
	 */
	private runAnimation(piece: PuzzlePiece, config: AnimationConfig): void {
		const container = piece.container;
		if (!container) return;

		const startTime = performance.now() + (config.delay ?? 0);
		let currentRepeat = 0;
		const maxRepeats = config.repeat ?? 1;

		const animate = () => {
			if (this.isDestroyed) return;

			const now = performance.now();
			if (now < startTime) {
				requestAnimationFrame(animate);
				return;
			}

			const elapsed = now - startTime;
			let progress = Math.min(elapsed / config.duration, 1);

			// Apply easing
			progress = this.applyEasing(progress, config.easing ?? 'linear');

			// Apply animation based on type
			switch (config.type) {
				case 'fadeIn':
				case 'fadeOut':
					this.applyFadeAnimation(container, config, progress);
					break;
				case 'scale':
					this.applyScaleAnimation(container, config, progress);
					break;
				case 'glow':
					this.applyGlowAnimation(piece, config, progress);
					break;
				case 'shake':
					this.applyShakeAnimation(container, config, progress);
					break;
				case 'bounce':
					this.applyBounceAnimation(container, config, progress);
					break;
				case 'rotate':
					this.applyRotateAnimation(container, config, progress);
					break;
				case 'pulse':
					this.applyPulseAnimation(container, config, progress);
					break;
			}

			// Check if animation is complete
			if (elapsed >= config.duration) {
				currentRepeat++;

				if (currentRepeat < maxRepeats) {
					// Reset for next repeat
					if (config.from) {
						this.applyAnimationState(container, config.from);
					}
					// Restart animation
					this.runAnimation(piece, { ...config, delay: 0 });
					return;
				}

				// Animation complete
				if (config.to) {
					this.applyAnimationState(container, config.to);
				}
				config.onComplete?.();
				return;
			}

			requestAnimationFrame(animate);
		};

		// Set initial state
		if (config.from) {
			this.applyAnimationState(container, config.from);
		}

		requestAnimationFrame(animate);
	}

	private applyAnimationState(container: Container, state: Record<string, number>): void {
		if (state.alpha !== undefined) container.alpha = state.alpha;
		if (state.scale !== undefined) container.scale.set(state.scale);
		if (state.rotation !== undefined) container.rotation = state.rotation;
		if (state.x !== undefined) container.x = state.x;
		if (state.y !== undefined) container.y = state.y;
	}

	private applyEasing(progress: number, easing: string): number {
		switch (easing) {
			case 'easeIn':
				return progress * progress;
			case 'easeOut':
				return 1 - (1 - progress) * (1 - progress);
			case 'easeInOut':
				return progress < 0.5
					? 2 * progress * progress
					: 1 - Math.pow(-2 * progress + 2, 2) / 2;
			default:
				return progress;
		}
	}

	private applyFadeAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const fromAlpha = config.from?.alpha ?? 0;
		const toAlpha = config.to?.alpha ?? 1;
		container.alpha = fromAlpha + (toAlpha - fromAlpha) * progress;

		if (config.from?.scale !== undefined && config.to?.scale !== undefined) {
			const fromScale = config.from.scale;
			const toScale = config.to.scale;
			container.scale.set(fromScale + (toScale - fromScale) * progress);
		}
	}

	private applyScaleAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const fromScale = config.from?.scale ?? 1;
		const toScale = config.to?.scale ?? 1;
		container.scale.set(fromScale + (toScale - fromScale) * progress);
	}

	private applyGlowAnimation(piece: PuzzlePiece, config: AnimationConfig, progress: number): void {
		// Create or get highlight graphic
		let highlight = this.highlights.get(piece.id);
		if (!highlight && piece.container) {
			highlight = new Graphics();
			this.highlights.set(piece.id, highlight);
			this.highlightContainer.addChild(highlight);
		}

		if (highlight) {
			highlight.clear();
			const intensity = Math.sin(progress * Math.PI) * 0.5 + 0.5;
			const glowColor = 0xffd700;
			const glowAlpha = intensity * 0.6;
			const glowSize = 10 + intensity * 10;

			if (piece.container) {
				highlight
					.setFillStyle({ color: glowColor, alpha: glowAlpha })
					.roundRect(
						piece.container.x - piece.width / 2 - glowSize,
						piece.container.y - piece.height / 2 - glowSize,
						piece.width + glowSize * 2,
						piece.height + glowSize * 2,
						8
					)
					.fill();
			}
		}
	}

	private applyShakeAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const intensity = config.to?.x ?? 5;
		const originalX = container.x;
		const shake = Math.sin(progress * Math.PI * 10) * intensity * (1 - progress);
		container.x = originalX + shake;
	}

	private applyBounceAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const bounceHeight = config.to?.y ?? -20;
		const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * bounceHeight * (1 - progress);
		container.y += bounce;
	}

	private applyRotateAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const fromRotation = config.from?.rotation ?? 0;
		const toRotation = config.to?.rotation ?? Math.PI * 2;
		container.rotation = fromRotation + (toRotation - fromRotation) * progress;
	}

	private applyPulseAnimation(container: Container, config: AnimationConfig, progress: number): void {
		const pulseAmount = Math.sin(progress * Math.PI * 2) * 0.1;
		container.scale.set(1 + pulseAmount);
		container.alpha = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
	}

	// ============================================
	// Interactive Highlighting
	// ============================================

	/**
	 * Highlight all interactive elements
	 */
	highlightInteractive(config?: Partial<HighlightConfig>): void {
		const defaultConfig: HighlightConfig = {
			color: 0xffd700,
			alpha: 0.3,
			pulseSpeed: 2,
			glowSize: 10
		};

		const highlightConfig = { ...defaultConfig, ...config };

		// Clear existing highlights
		this.highlightContainer.removeChildren();
		this.highlights.clear();

		// Create highlights for all interactive pieces
		this.pieces.forEach((piece, id) => {
			if (piece.interactive && piece.container) {
				const highlight = this.createHighlight(piece, highlightConfig);
				this.highlights.set(id, highlight);
				this.highlightContainer.addChild(highlight);
			}
		});

		// Start pulse animation
		this.startHighlightPulse(highlightConfig);
	}

	/**
	 * Create a highlight graphic for a piece
	 */
	private createHighlight(piece: PuzzlePiece, config: HighlightConfig): Graphics {
		const highlight = new Graphics();
		highlight.label = `highlight-${piece.id}`;

		highlight
			.setFillStyle({ color: config.color, alpha: config.alpha })
			.roundRect(
				-config.glowSize,
				-config.glowSize,
				piece.width + config.glowSize * 2,
				piece.height + config.glowSize * 2,
				8
			)
			.fill();

		highlight.x = piece.x;
		highlight.y = piece.y;

		return highlight;
	}

	/**
	 * Start the pulsing animation for highlights
	 */
	private startHighlightPulse(config: HighlightConfig): void {
		this.glowFilterTime = 0;

		this.tickerCallback = () => {
			this.glowFilterTime += 0.016 * config.pulseSpeed;
			const pulse = Math.sin(this.glowFilterTime) * 0.5 + 0.5;

			this.highlights.forEach((highlight, id) => {
				const piece = this.pieces.get(id);
				if (piece?.container) {
					highlight.alpha = config.alpha + pulse * 0.3;
					highlight.x = piece.container.x;
					highlight.y = piece.container.y;
				}
			});
		};

		Ticker.shared.add(this.tickerCallback);
	}

	/**
	 * Stop highlighting interactive elements
	 */
	stopHighlight(): void {
		if (this.tickerCallback) {
			Ticker.shared.remove(this.tickerCallback);
			this.tickerCallback = undefined;
		}

		this.highlightContainer.removeChildren();
		this.highlights.clear();
	}

	/**
	 * Highlight a specific piece
	 */
	highlightPiece(pieceId: string, config?: Partial<HighlightConfig>): void {
		const piece = this.pieces.get(pieceId);
		if (!piece?.container) return;

		// Remove existing highlight for this piece
		const existing = this.highlights.get(pieceId);
		if (existing) {
			this.highlightContainer.removeChild(existing);
			existing.destroy();
		}

		const defaultConfig: HighlightConfig = {
			color: 0xffd700,
			alpha: 0.5,
			pulseSpeed: 3,
			glowSize: 8
		};

		const highlightConfig = { ...defaultConfig, ...config };
		const highlight = this.createHighlight(piece, highlightConfig);
		this.highlights.set(pieceId, highlight);
		this.highlightContainer.addChild(highlight);
	}

	// ============================================
	// Event Handlers
	// ============================================

	private handlePieceClick(pieceId: string, event: FederatedPointerEvent): void {
		// Play click animation
		this.animatePiece(pieceId, 'pieceClick');

		// Notify callback
		this.onPieceClick?.(pieceId, event);
	}

	private handlePieceHover(pieceId: string, isHovering: boolean): void {
		const piece = this.pieces.get(pieceId);
		if (!piece?.container) return;

		if (isHovering) {
			// Apply hover effect
			piece.container.alpha = 0.9;
			piece.container.scale.set(1.05);

			// Show highlight
			this.highlightPiece(pieceId, {
				color: 0x5fb3b3,
				alpha: 0.3,
				glowSize: 5
			});
		} else {
			// Remove hover effect
			piece.container.alpha = 1;
			piece.container.scale.set(piece.scale ?? 1);

			// Remove highlight
			const highlight = this.highlights.get(pieceId);
			if (highlight) {
				this.highlightContainer.removeChild(highlight);
				highlight.destroy();
				this.highlights.delete(pieceId);
			}
		}

		this.onPieceHover?.(pieceId, isHovering);
	}

	// ============================================
	// Utility Methods
	// ============================================

	/**
	 * Get a piece by ID
	 */
	getPiece(pieceId: string): PuzzlePiece | undefined {
		return this.pieces.get(pieceId);
	}

	/**
	 * Get all pieces
	 */
	getAllPieces(): PuzzlePiece[] {
		return Array.from(this.pieces.values());
	}

	/**
	 * Get the puzzle container
	 */
	getContainer(): Container {
		return this.puzzleContainer;
	}

	/**
	 * Resize the puzzle renderer
	 */
	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		// Pieces will be repositioned by renderPuzzle
	}

	/**
	 * Check if assets are loaded
	 */
	isReady(): boolean {
		return this.isLoaded;
	}

	/**
	 * Show celebration effect when puzzle is complete
	 */
	showCelebration(): void {
		// Animate all pieces
		this.pieces.forEach((piece, id) => {
			this.animatePiece(id, 'puzzleComplete');
		});

		// Add celebration overlay
		const overlay = new Graphics();
		overlay.label = 'celebration-overlay';
		overlay
			.setFillStyle({ color: 0xffd700, alpha: 0 })
			.rect(0, 0, this.width, this.height)
			.fill();

		this.overlayContainer.addChild(overlay);

		// Animate overlay
		let startTime = performance.now();
		const animateOverlay = () => {
			const elapsed = performance.now() - startTime;
			const progress = Math.min(elapsed / 500, 1);

			overlay.alpha = Math.sin(progress * Math.PI) * 0.3;

			if (progress < 1) {
				requestAnimationFrame(animateOverlay);
			} else {
				this.overlayContainer.removeChild(overlay);
				overlay.destroy();
			}
		};

		requestAnimationFrame(animateOverlay);
	}

	/**
	 * Show a hint for a specific piece
	 */
	showHint(pieceId: string, hintText?: string): void {
		this.animatePiece(pieceId, 'hintAppear');
		this.highlightPiece(pieceId, {
			color: 0x88ff88,
			alpha: 0.5,
			pulseSpeed: 2
		});

		// If hint text is provided, show it
		if (hintText) {
			const hint = new Text({
				text: hintText,
				style: {
					fontFamily: 'Lato, sans-serif',
					fontSize: 14,
					fill: 0xffffff,
					dropShadow: {
						alpha: 0.5,
						blur: 2,
						distance: 2
					}
				}
			});

			hint.anchor.set(0.5);
			const piece = this.pieces.get(pieceId);
			if (piece) {
				hint.x = piece.x;
				hint.y = piece.y - piece.height / 2 - 20;
			}

			this.overlayContainer.addChild(hint);

			// Remove hint after 3 seconds
			setTimeout(() => {
				this.overlayContainer.removeChild(hint);
				hint.destroy();
			}, 3000);
		}
	}

	/**
	 * Clean up and destroy the renderer
	 */
	destroy(): void {
		this.isDestroyed = true;

		// Stop any running animations
		this.stopHighlight();

		// Clear pieces
		this.clearPieces();

		// Remove containers
		this.container.removeChild(this.puzzleContainer);
		this.puzzleContainer.destroy({ children: true });

		// Clear maps
		this.assets.clear();
		this.pieces.clear();
		this.animations.clear();
		this.highlights.clear();
	}
}

export default PuzzleRenderer;

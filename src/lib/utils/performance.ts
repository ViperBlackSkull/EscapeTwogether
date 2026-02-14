/**
 * Performance Utilities for EscapeTogether
 *
 * Provides lazy loading, frame rate monitoring, and device capability detection
 */

// ============================================
// Device Capability Detection
// ============================================

export interface DeviceCapabilities {
	isMobile: boolean;
	isLowEnd: boolean;
	tier: 'low' | 'medium' | 'high';
	cores: number;
	memory: number; // GB, approximate
	webgl2: boolean;
	touchSupport: boolean;
}

let cachedCapabilities: DeviceCapabilities | null = null;

export function getDeviceCapabilities(): DeviceCapabilities {
	if (cachedCapabilities) return cachedCapabilities;

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);

	// Check for low-end device indicators
	const cores = navigator.hardwareConcurrency || 2;
	const memory = (navigator as any).deviceMemory || 4; // GB

	// WebGL capability check
	let webgl2 = false;
	try {
		const canvas = document.createElement('canvas');
		webgl2 = !!canvas.getContext('webgl2');
	} catch {
		webgl2 = false;
	}

	const touchSupport = 'ontouchstart' in window;

	// Determine tier
	let tier: 'low' | 'medium' | 'high';
	const isLowEnd = cores <= 2 || memory <= 2;

	if (isLowEnd || isMobile) {
		tier = 'low';
	} else if (cores >= 8 && memory >= 8 && webgl2) {
		tier = 'high';
	} else {
		tier = 'medium';
	}

	cachedCapabilities = {
		isMobile,
		isLowEnd,
		tier,
		cores,
		memory,
		webgl2,
		touchSupport
	};

	return cachedCapabilities;
}

// ============================================
// Particle Effect Scaling
// ============================================

export function getParticleScale(): number {
	const caps = getDeviceCapabilities();

	switch (caps.tier) {
		case 'low':
			return 0.3; // 30% of particles
		case 'medium':
			return 0.6; // 60% of particles
		case 'high':
			return 1.0; // 100% of particles
		default:
			return 0.5;
	}
}

export function shouldEnableParticles(): boolean {
	const caps = getDeviceCapabilities();
	return caps.tier !== 'low';
}

// ============================================
// Frame Rate Monitor
// ============================================

export class FrameRateMonitor {
	private frames: number[] = [];
	private lastFrameTime: number = 0;
	private isMonitoring: boolean = false;

	// Target frame rates
	private targetDesktop = 60;
	private targetMobile = 30;

	start(): void {
		this.isMonitoring = true;
		this.lastFrameTime = performance.now();
		this.tick();
	}

	stop(): void {
		this.isMonitoring = false;
	}

	private tick = (): void => {
		if (!this.isMonitoring) return;

		const now = performance.now();
		const delta = now - this.lastFrameTime;
		this.lastFrameTime = now;

		// Keep last 60 frame times
		this.frames.push(delta);
		if (this.frames.length > 60) {
			this.frames.shift();
		}

		requestAnimationFrame(this.tick);
	};

	getAverageFPS(): number {
		if (this.frames.length === 0) return 0;

		const avgDelta = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
		return 1000 / avgDelta;
	}

	getCurrentFPS(): number {
		if (this.frames.length === 0) return 0;
		return 1000 / this.frames[this.frames.length - 1];
	}

	isPerformant(): boolean {
		const caps = getDeviceCapabilities();
		const targetFPS = caps.isMobile ? this.targetMobile : this.targetDesktop;
		return this.getAverageFPS() >= targetFPS * 0.9; // 90% of target
	}

	getPerformanceLevel(): 'good' | 'medium' | 'poor' {
		const fps = this.getAverageFPS();
		const caps = getDeviceCapabilities();
		const target = caps.isMobile ? this.targetMobile : this.targetDesktop;

		if (fps >= target * 0.9) return 'good';
		if (fps >= target * 0.7) return 'medium';
		return 'poor';
	}
}

// Global monitor instance
export const frameRateMonitor = new FrameRateMonitor();

// ============================================
// Lazy Loading Utilities
// ============================================

// Lazy load a module with retry
export async function lazyLoad<T>(
	importFn: () => Promise<T>,
	retries: number = 3
): Promise<T> {
	let lastError: Error | null = null;

	for (let i = 0; i < retries; i++) {
		try {
			return await importFn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			// Wait before retry
			await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
		}
	}

	throw lastError;
}

// Preload critical assets
export function preloadAssets(urls: string[]): Promise<void[]> {
	return Promise.all(
		urls.map((url) => {
			return new Promise<void>((resolve, reject) => {
				const link = document.createElement('link');
				link.rel = 'preload';
				link.href = url;
				link.as = url.endsWith('.js')
					? 'script'
					: url.endsWith('.css')
						? 'style'
						: 'image';

				link.onload = () => resolve();
				link.onerror = () => reject(new Error(`Failed to preload: ${url}`));

				document.head.appendChild(link);
			});
		})
	);
}

// ============================================
// Image Optimization
// ============================================

// Get appropriate image size based on device
export function getOptimizedImageUrl(baseUrl: string, width?: number): string {
	const caps = getDeviceCapabilities();

	// If already has query params, append; otherwise create
	const url = new URL(baseUrl, window.location.origin);
	const params = url.searchParams;

	// Set quality based on device tier
	const quality = caps.tier === 'low' ? 60 : caps.tier === 'medium' ? 75 : 90;
	params.set('q', quality.toString());

	// Set width if provided
	if (width) {
		params.set('w', width.toString());
	} else {
		// Default width based on device
		const defaultWidth = caps.isMobile ? 640 : 1280;
		params.set('w', defaultWidth.toString());
	}

	return url.toString();
}

// ============================================
// Animation Frame Throttling
// ============================================

export class ThrottledRenderer {
	private lastRender: number = 0;
	private frameCount: number = 0;
	private targetInterval: number;

	constructor(targetFPS: number = 60) {
		this.targetInterval = 1000 / targetFPS;
	}

	shouldRender(): boolean {
		const now = performance.now();
		const elapsed = now - this.lastRender;

		if (elapsed >= this.targetInterval) {
			this.lastRender = now;
			this.frameCount++;
			return true;
		}

		return false;
	}

	setTargetFPS(fps: number): void {
		this.targetInterval = 1000 / fps;
	}

	getFrameCount(): number {
		return this.frameCount;
	}
}

// Auto-adjusting renderer based on performance
export class AdaptiveRenderer {
	private renderer: ThrottledRenderer;
	private monitor: FrameRateMonitor;
	private adjustmentInterval: number = 5000; // Check every 5 seconds
	private lastAdjustment: number = 0;
	private currentFPS: number = 60;

	constructor() {
		const caps = getDeviceCapabilities();
		const initialFPS = caps.isMobile ? 30 : 60;

		this.renderer = new ThrottledRenderer(initialFPS);
		this.monitor = new FrameRateMonitor();
	}

	start(): void {
		this.monitor.start();
	}

	stop(): void {
		this.monitor.stop();
	}

	shouldRender(): boolean {
		this.maybeAdjustFPS();
		return this.renderer.shouldRender();
	}

	private maybeAdjustFPS(): void {
		const now = performance.now();
		if (now - this.lastAdjustment < this.adjustmentInterval) return;

		this.lastAdjustment = now;
		const performance = this.monitor.getPerformanceLevel();

		switch (performance) {
			case 'poor':
				if (this.currentFPS > 20) {
					this.currentFPS -= 5;
					this.renderer.setTargetFPS(this.currentFPS);
				}
				break;
			case 'good':
				const caps = getDeviceCapabilities();
				const maxFPS = caps.isMobile ? 30 : 60;
				if (this.currentFPS < maxFPS) {
					this.currentFPS = Math.min(this.currentFPS + 5, maxFPS);
					this.renderer.setTargetFPS(this.currentFPS);
				}
				break;
		}
	}

	getCurrentFPS(): number {
		return this.currentFPS;
	}
}

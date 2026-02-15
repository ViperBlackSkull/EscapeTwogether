/**
 * Image optimization utilities for production
 */

interface ImageOptimizationOptions {
	quality?: number;
	format?: 'webp' | 'jpeg' | 'png';
	maxWidth?: number;
	maxHeight?: number;
	lazy?: boolean;
}

/**
 * Generate optimized image URL with parameters
 */
export function optimizeImageUrl(
	url: string,
	options: ImageOptimizationOptions = {}
): string {
	if (!url) return '';

	const {
		quality = 85,
		format = 'webp',
		maxWidth = 1920,
		maxHeight = 1080,
		lazy = true
	} = options;

	// For static assets, add query parameters for optimization
	if (url.startsWith('/')) {
		const params = new URLSearchParams({
			q: quality.toString(),
			fm: format,
			w: maxWidth.toString(),
			h: maxHeight.toString()
		});

		return `${url}?${params.toString()}`;
	}

	return url;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
	baseUrl: string,
	sizes: number[] = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
): string {
	return sizes
		.map((size) => `${optimizeImageUrl(baseUrl, { maxWidth: size })} ${size}w`)
		.join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
	breakpoints: Record<string, string> = {
		'640px': '100vw',
		'1024px': '50vw',
		'1280px': '33vw'
	}
): string {
	return Object.entries(breakpoints)
		.map(([breakpoint, size]) => `(min-width: ${breakpoint}) ${size}`)
		.join(', ');
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(
	selector: string = 'img[data-lazy]',
	options?: IntersectionObserverInit
): void {
	if (typeof IntersectionObserver === 'undefined') {
		// Fallback: load all images immediately
		document.querySelectorAll(selector).forEach((img) => {
			const element = img as HTMLImageElement;
			if (element.dataset.src) {
				element.src = element.dataset.src;
			}
		});
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target as HTMLImageElement;
					if (img.dataset.src) {
						img.src = img.dataset.src;
						img.removeAttribute('data-src');
						observer.unobserve(img);
					}
				}
			});
		},
		{
			rootMargin: '50px',
			...options
		}
	);

	document.querySelectorAll(selector).forEach((img) => observer.observe(img));
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(urls: string[]): void {
	if (typeof document === 'undefined') return;

	urls.forEach((url) => {
		const link = document.createElement('link');
		link.rel = 'preload';
		link.as = 'image';
		link.href = url;
		document.head.appendChild(link);
	});
}

/**
 * Get image dimensions from URL
 */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = reject;
		img.src = url;
	});
}

/**
 * Generate placeholder image (blur effect)
 */
export function generatePlaceholder(width: number, height: number, blur: number = 10): string {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) return '';

	canvas.width = width;
	canvas.height = height;

	// Create gradient background
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, '#1a1a2e');
	gradient.addColorStop(1, '#2a2a4e');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	// Add blur effect
	if (blur > 0) {
		ctx.filter = `blur(${blur}px)`;
	}

	return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * WebP detection and fallback
 */
export function supportsWebP(): Promise<boolean> {
	return new Promise((resolve) => {
		if (typeof document === 'undefined') {
			resolve(false);
			return;
		}

		const webP = new Image();
		webP.onload = webP.onerror = () => {
			resolve(webP.height === 2);
		};
		webP.src =
			'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
	});
}

/**
 * Get optimal image format for browser
 */
export async function getOptimalFormat(): Promise<'webp' | 'jpeg'> {
	const webPSupported = await supportsWebP();
	return webPSupported ? 'webp' : 'jpeg';
}

/**
 * Image loading utility with progress tracking
 */
export class ImageLoader {
	private cache: Map<string, HTMLImageElement> = new Map();
	private loading: Map<string, Promise<HTMLImageElement>> = new Map();

	/**
	 * Load an image with caching
	 */
	async load(url: string): Promise<HTMLImageElement> {
		// Return cached if available
		if (this.cache.has(url)) {
			return this.cache.get(url)!;
		}

		// Return in-progress load if available
		if (this.loading.has(url)) {
			return this.loading.get(url)!;
		}

		// Load the image
		const promise = new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.cache.set(url, img);
				this.loading.delete(url);
				resolve(img);
			};
			img.onerror = () => {
				this.loading.delete(url);
				reject(new Error(`Failed to load image: ${url}`));
			};
			img.src = url;
		});

		this.loading.set(url, promise);
		return promise;
	}

	/**
	 * Preload multiple images
	 */
	async preload(urls: string[]): Promise<HTMLImageElement[]> {
		const promises = urls.map((url) => this.load(url).catch(() => null));
		const results = await Promise.all(promises);
		return results.filter((img): img is HTMLImageElement => img !== null);
	}

	/**
	 * Clear cache
	 */
	clear(): void {
		this.cache.clear();
		this.loading.clear();
	}
}

// Global image loader instance
export const imageLoader = new ImageLoader();

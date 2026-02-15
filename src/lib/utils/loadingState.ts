/**
 * Enhanced loading state management with skeleton screens
 */

import { writable, type Writable } from 'svelte/store';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStatus {
	state: LoadingState;
	message?: string;
	progress?: number;
	error?: Error;
}

export interface LoadingManager {
	status: Writable<LoadingStatus>;
	start: (message?: string) => void;
	updateProgress: (progress: number, message?: string) => void;
	success: (message?: string) => void;
	error: (error: Error, message?: string) => void;
	reset: () => void;
}

/**
 * Create a loading manager for tracking async operations
 */
export function createLoadingManager(initialMessage?: string): LoadingManager {
	const status = writable<LoadingStatus>({
		state: 'idle',
		message: initialMessage
	});

	return {
		status,

		start(message?: string) {
			status.set({ state: 'loading', message });
		},

		updateProgress(progress: number, message?: string) {
			status.update((current) => ({
				...current,
				progress: Math.max(0, Math.min(100, progress)),
				message: message || current.message
			}));
		},

		success(message?: string) {
			status.set({ state: 'success', message });
		},

		error(error: Error, message?: string) {
			status.set({ state: 'error', message: message || error.message, error });
		},

		reset() {
			status.set({ state: 'idle' });
		}
	};
}

/**
 * Wrap an async function with loading state tracking
 */
export async function withLoading<T>(
	loading: LoadingManager,
	fn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>
): Promise<T> {
	loading.start();

	try {
		const result = await fn((progress, message) => {
			loading.updateProgress(progress, message);
		});
		loading.success();
		return result;
	} catch (error) {
		loading.error(error as Error);
		throw error;
	}
}

/**
 * Create skeleton placeholder configuration
 */
export interface SkeletonConfig {
	width?: string | number;
	height?: string | number;
	variant?: 'text' | 'rect' | 'circle';
	animation?: 'pulse' | 'wave' | 'none';
	className?: string;
}

export function createSkeletonProps(config: SkeletonConfig = {}) {
	const {
		width = '100%',
		height = '1rem',
		variant = 'text',
		animation = 'pulse',
		className = ''
	} = config;

	return {
		class: `skeleton skeleton-${variant} skeleton-${animation} ${className}`.trim(),
		style: `width: ${typeof width === 'number' ? `${width}px` : width}; height: ${typeof height === 'number' ? `${height}px` : height};`
	};
}

/**
 * Progressive image loading with skeleton
 */
export function createImageLoadingProps(src: string, alt: string, className = '') {
	return {
		'data-lazy': src,
		alt,
		class: `${className} lazy-image`,
		style: 'background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite;'
	};
}

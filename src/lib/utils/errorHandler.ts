/**
 * Centralized error handling for production applications
 * Provides error logging, user notification, and recovery strategies
 */

export interface ErrorContext {
	component?: string;
	action?: string;
	userData?: Record<string, unknown>;
	timestamp?: Date;
}

export interface ErrorInfo {
	message: string;
	stack?: string;
	context?: ErrorContext;
	fatal?: boolean;
}

type ErrorListener = (error: ErrorInfo) => void;

class ErrorHandler {
	private listeners: ErrorListener[] = [];
	private offlineMode: boolean = false;
	private errorCount: number = 0;
	private maxErrors: number = 10;
	private rateLimitWindow: number = 60000; // 1 minute
	private lastErrorTime: number = 0;

	constructor() {
		if (typeof window !== 'undefined') {
			// Track online/offline status
			window.addEventListener('online', () => this.handleOnline());
			window.addEventListener('offline', () => this.handleOffline());
			this.offlineMode = !navigator.onLine;

			// Global error handler
			window.onerror = (message, source, lineno, colno, error) => {
				this.handleError(error || new Error(String(message)), {
					component: source,
					action: 'global',
					userData: { source, lineno, colno }
				});
				return true; // Prevent default error handling
			};

			// Unhandled promise rejection handler
			window.onunhandledrejection = (event) => {
				this.handleError(
					event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
					{
						component: 'Promise',
						action: 'unhandledRejection'
					}
				);
			};
		}
	}

	/**
	 * Subscribe to error events
	 */
	onError(listener: ErrorListener): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	/**
	 * Handle an error with context
	 */
	handleError(error: Error | ErrorInfo, context?: ErrorContext): void {
		const errorInfo: ErrorInfo = error instanceof Error
			? { message: error.message, stack: error.stack, context }
			: error;

		errorInfo.context = { ...errorInfo.context, ...context };
		errorInfo.context = errorInfo.context || {};
		errorInfo.context.timestamp = errorInfo.context.timestamp || new Date();

		// Rate limiting
		const now = Date.now();
		if (now - this.lastErrorTime < this.rateLimitWindow) {
			this.errorCount++;
			if (this.errorCount > this.maxErrors) {
				console.warn('Error rate limit exceeded, suppressing further errors');
				return;
			}
		} else {
			this.errorCount = 1;
			this.lastErrorTime = now;
		}

		// Log to console in development
		if (import.meta.env.DEV) {
			console.error('Error:', errorInfo);
		}

		// Notify listeners
		this.listeners.forEach(listener => {
			try {
				listener(errorInfo);
			} catch (err) {
				console.error('Error in error listener:', err);
			}
		});

		// Send to error reporting service in production
		if (!import.meta.env.DEV && this.offlineMode === false) {
			this.reportError(errorInfo).catch(console.error);
		}
	}

	/**
	 * Report error to external service
	 */
	private async reportError(error: ErrorInfo): Promise<void> {
		// In production, send to error tracking service
		// For now, just log to console
		if (import.meta.env.PROD) {
			console.error('Production error:', error);
			// TODO: Integrate with Sentry, LogRocket, etc.
		}
	}

	/**
	 * Handle offline mode
	 */
	private handleOffline(): void {
		this.offlineMode = true;
		this.handleError(new Error('Connection lost. Working in offline mode.'), {
			component: 'Network',
			action: 'offline',
			fatal: false
		});
	}

	/**
	 * Handle coming back online
	 */
	private handleOnline(): void {
		this.offlineMode = false;
		this.errorCount = 0; // Reset error count
	}

	/**
	 * Create a user-friendly error message
	 */
	getUserMessage(error: ErrorInfo): string {
		if (error.context?.component === 'Network') {
			return 'Having trouble connecting. Please check your internet connection.';
		}
		if (error.fatal) {
			return 'Something went wrong. Please refresh the page to continue.';
		}
		return 'An error occurred. Please try again.';
	}

	/**
	 * Determine if an error is recoverable
	 */
	isRecoverable(error: ErrorInfo): boolean {
		return !error.fatal && error.context?.component !== 'Network';
	}
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Decorator for async functions to automatically handle errors
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
	fn: T,
	context?: ErrorContext
): T {
	return (async (...args: unknown[]) => {
		try {
			return await fn(...args);
		} catch (error) {
			errorHandler.handleError(error as Error, context);
			throw error; // Re-throw for caller to handle
		}
	}) as T;
}

/**
 * Wrap a component's error boundary
 */
export function createErrorHandler(componentName: string) {
	return {
		handleError: (error: Error, errorInfo?: Record<string, unknown>) => {
			errorHandler.handleError(error, {
				component: componentName,
				action: 'render',
				userData: errorInfo
			});
		}
	};
}

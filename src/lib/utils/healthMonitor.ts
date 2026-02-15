/**
 * Production health monitoring and metrics collection
 */

import { writable } from 'svelte/store';

export interface HealthMetrics {
	uptime: number;
	memory: NodeJS.MemoryUsage | null;
	cpu: number;
	responseTime: number;
	errorRate: number;
	activeConnections: number;
	timestamp: number;
}

export interface PerformanceMetrics {
	fcp: number; // First Contentful Paint
	lcp: number; // Largest Contentful Paint
	cls: number; // Cumulative Layout Shift
	fid: number; // First Input Delay
	ttfb: number; // Time to First Byte
}

class HealthMonitor {
	private metrics: HealthMetrics | null = null;
	private performanceMetrics: Partial<PerformanceMetrics> = {};
	private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
	private healthStore = writable<HealthMetrics | null>(null);
	private errorCount = 0;
	private requestCount = 0;

	constructor() {
		if (typeof window !== 'undefined') {
			this.initializeWebVitals();
		}
	}

	/**
	 * Initialize Web Vitals monitoring
	 */
	private initializeWebVitals() {
		// First Contentful Paint
		if ('PerformanceObserver' in window) {
			try {
				const fcpObserver = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const fcpEntry = entries.find(
						(entry) => entry.name === 'first-contentful-paint'
					);
					if (fcpEntry) {
						this.performanceMetrics.fcp = fcpEntry.startTime;
					}
				});
				fcpObserver.observe({ entryTypes: ['paint'] });
			} catch (e) {
				console.warn('FCP monitoring not available');
			}

			// Largest Contentful Paint
			try {
				const lcpObserver = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1];
					if (lastEntry) {
						this.performanceMetrics.lcp = lastEntry.startTime;
					}
				});
				lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
			} catch (e) {
				console.warn('LCP monitoring not available');
			}

			// Cumulative Layout Shift
			try {
				let clsValue = 0;
				const clsObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (!(entry as any).hadRecentInput) {
							clsValue += (entry as any).value;
						}
					}
					this.performanceMetrics.cls = clsValue;
				});
				clsObserver.observe({ entryTypes: ['layout-shift'] });
			} catch (e) {
				console.warn('CLS monitoring not available');
			}
		}
	}

	/**
	 * Start health monitoring
	 */
	startMonitoring(intervalMs: number = 30000) {
		if (this.healthCheckInterval) {
			this.stopMonitoring();
		}

		this.healthCheckInterval = setInterval(() => {
			this.collectMetrics();
		}, intervalMs);

		// Initial collection
		this.collectMetrics();
	}

	/**
	 * Stop health monitoring
	 */
	stopMonitoring() {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}
	}

	/**
	 * Collect current health metrics
	 */
	private collectMetrics() {
		if (typeof window === 'undefined') return;

		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		const ttfb = navigation ? navigation.responseStart - navigation.requestStart : 0;

		this.performanceMetrics.ttfb = ttfb;

		this.metrics = {
			uptime: performance.now(),
			memory: null, // Not available in browser
			cpu: 0, // Not available in browser
			responseTime: ttfb,
			errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
			activeConnections: 1, // Browser connection
			timestamp: Date.now()
		};

		this.healthStore.set(this.metrics);
	}

	/**
	 * Record an API request
	 */
	recordRequest(duration: number, error: boolean = false) {
		this.requestCount++;
		if (error) {
			this.errorCount++;
		}
	}

	/**
	 * Get current health status
	 */
	getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
		if (!this.metrics) return 'unhealthy';

		// Check error rate
		if (this.metrics.errorRate > 0.1) return 'unhealthy';
		if (this.metrics.errorRate > 0.05) return 'degraded';

		// Check response time
		if (this.metrics.responseTime > 5000) return 'unhealthy';
		if (this.metrics.responseTime > 2000) return 'degraded';

		return 'healthy';
	}

	/**
	 * Get performance metrics
	 */
	getPerformanceMetrics(): Partial<PerformanceMetrics> {
		return { ...this.performanceMetrics };
	}

	/**
	 * Get health store for reactive updates
	 */
	getHealthStore() {
		return this.healthStore;
	}

	/**
	 * Generate health report
	 */
	generateHealthReport() {
		return {
			status: this.getHealthStatus(),
			metrics: this.metrics,
			performance: this.performanceMetrics,
			timestamp: new Date().toISOString()
		};
	}
}

// Global health monitor instance
export const healthMonitor = new HealthMonitor();

/**
 * Send health check to server
 */
export async function sendHealthCheck(endpoint: string = '/api/health') {
	try {
		const report = healthMonitor.generateHealthReport();
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(report)
		});
		return response.ok;
	} catch (error) {
		console.error('Health check failed:', error);
		return false;
	}
}

/**
 * Setup automatic health monitoring
 */
export function setupHealthMonitoring(config: {
	enabled?: boolean;
	interval?: number;
	endpoint?: string;
	autoSend?: boolean;
} = {}) {
	const {
		enabled = true,
		interval = 30000,
		endpoint = '/api/health',
		autoSend = true
	} = config;

	if (!enabled) return;

	// Start monitoring
	healthMonitor.startMonitoring(interval);

	// Send health checks if enabled
	if (autoSend && typeof window !== 'undefined') {
		setInterval(() => {
			sendHealthCheck(endpoint);
		}, interval);
	}

	return healthMonitor;
}

/**
 * Notification Store
 * Manages toast notifications for the application
 */

import { writable, get } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration: number;
	dismissed: boolean;
}

interface NotificationOptions {
	duration?: number;
}

const defaultDurations: Record<NotificationType, number> = {
	success: 3000,
	error: 4000,
	warning: 3500,
	info: 3000
};

function createNotificationStore() {
	const { subscribe, update, set } = writable<Notification[]>([]);

	function generateId(): string {
		return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	function show(type: NotificationType, message: string, options?: NotificationOptions): string {
		const id = generateId();
		const duration = options?.duration ?? defaultDurations[type];

		const notification: Notification = {
			id,
			type,
			message,
			duration,
			dismissed: false
		};

		update(notifications => [...notifications, notification]);

		// Auto-dismiss after duration
		if (duration > 0) {
			setTimeout(() => {
				dismiss(id);
			}, duration);
		}

		return id;
	}

	function dismiss(id: string): void {
		update(notifications =>
			notifications.map(n =>
				n.id === id ? { ...n, dismissed: true } : n
			)
		);

		// Remove from store after animation
		setTimeout(() => {
			update(notifications => notifications.filter(n => n.id !== id));
		}, 300);
	}

	function dismissAll(): void {
		update(notifications => notifications.map(n => ({ ...n, dismissed: true })));

		setTimeout(() => {
			set([]);
		}, 300);
	}

	// Convenience methods
	function success(message: string, options?: NotificationOptions): string {
		return show('success', message, options);
	}

	function error(message: string, options?: NotificationOptions): string {
		return show('error', message, options);
	}

	function warning(message: string, options?: NotificationOptions): string {
		return show('warning', message, options);
	}

	function info(message: string, options?: NotificationOptions): string {
		return show('info', message, options);
	}

	return {
		subscribe,
		show,
		dismiss,
		dismissAll,
		success,
		error,
		warning,
		info
	};
}

export const notifications = createNotificationStore();

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Accessibility settings interface
export interface AccessibilitySettings {
	highContrast: boolean;
	reducedMotion: boolean;
	largeText: boolean;
	screenReaderMode: boolean;
	focusIndicators: boolean;
}

// Default settings
const defaultSettings: AccessibilitySettings = {
	highContrast: false,
	reducedMotion: false,
	largeText: false,
	screenReaderMode: false,
	focusIndicators: true
};

// Load settings from localStorage
function loadSettings(): AccessibilitySettings {
	if (!browser) return defaultSettings;

	try {
		const stored = localStorage.getItem('accessibility-settings');
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaultSettings, ...parsed };
		}
	} catch (e) {
		console.warn('Failed to load accessibility settings:', e);
	}

	// Check for system preferences
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

	return {
		...defaultSettings,
		reducedMotion: prefersReducedMotion,
		highContrast: prefersHighContrast
	};
}

// Create the store
function createAccessibilityStore() {
	const { subscribe, set, update } = writable<AccessibilitySettings>(loadSettings());

	return {
		subscribe,
		set: (settings: AccessibilitySettings) => {
			if (browser) {
				localStorage.setItem('accessibility-settings', JSON.stringify(settings));
			}
			set(settings);
		},
		update: (updater: (settings: AccessibilitySettings) => AccessibilitySettings) => {
			update(settings => {
				const newSettings = updater(settings);
				if (browser) {
					localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
				}
				return newSettings;
			});
		},
		toggle: (key: keyof AccessibilitySettings) => {
			update(settings => ({
				...settings,
				[key]: !settings[key]
			}));
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem('accessibility-settings');
			}
			set(defaultSettings);
		}
	};
}

export const accessibilitySettings = createAccessibilityStore();

// Derived stores for individual settings
export const highContrast = derived(accessibilitySettings, $s => $s.highContrast);
export const reducedMotion = derived(accessibilitySettings, $s => $s.reducedMotion);
export const largeText = derived(accessibilitySettings, $s => $s.largeText);
export const screenReaderMode = derived(accessibilitySettings, $s => $s.screenReaderMode);
export const focusIndicators = derived(accessibilitySettings, $s => $s.focusIndicators);

// CSS classes based on settings
export const accessibilityClasses = derived(
	accessibilitySettings,
	$s => ({
		'high-contrast': $s.highContrast,
		'reduced-motion': $s.reducedMotion,
		'large-text': $s.largeText,
		'screen-reader-mode': $s.screenReaderMode,
		'enhanced-focus': $s.focusIndicators
	})
);

// Helper to announce to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
	if (!browser) return;

	const announcer = document.getElementById('sr-announcer');
	if (announcer) {
		announcer.setAttribute('aria-live', priority);
		announcer.textContent = '';
		// Force re-read by clearing and setting
		requestAnimationFrame(() => {
			announcer.textContent = message;
		});
	}
}

// Keyboard navigation helper
export function handleKeyboardNavigation(
	event: KeyboardEvent,
	actions: Record<string, () => void>
) {
	const { key } = event;

	if (key in actions) {
		event.preventDefault();
		actions[key]();
		return true;
	}

	return false;
}

// Focus trap for modals
export function createFocusTrap(element: HTMLElement) {
	const focusableSelectors = [
		'button:not([disabled])',
		'[href]',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	function getFocusableElements(): HTMLElement[] {
		return Array.from(element.querySelectorAll(focusableSelectors)) as HTMLElement[];
	}

	function trapFocus(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements();
		const firstFocusable = focusable[0];
		const lastFocusable = focusable[focusable.length - 1];

		if (event.shiftKey) {
			if (document.activeElement === firstFocusable) {
				event.preventDefault();
				lastFocusable?.focus();
			}
		} else {
			if (document.activeElement === lastFocusable) {
				event.preventDefault();
				firstFocusable?.focus();
			}
		}
	}

	function activate() {
		element.addEventListener('keydown', trapFocus);
		const focusable = getFocusableElements();
		focusable[0]?.focus();
	}

	function deactivate() {
		element.removeEventListener('keydown', trapFocus);
	}

	return { activate, deactivate };
}

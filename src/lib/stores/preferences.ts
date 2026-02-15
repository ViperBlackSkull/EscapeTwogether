// EscapeTwogether - Preferences Store
// Svelte store for managing couple preferences with localStorage persistence

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type {
	CollaborationStyle,
	ChallengePreference,
	HintPreference
} from '$lib/types';

// ============================================
// Types
// ============================================

export interface StoredPreferences {
	playerNames: {
		playerA: string;
		playerB: string;
	};
	collaboration: CollaborationStyle;
	challengePreference: ChallengePreference;
	hintPreference: HintPreference;
	difficultyTier: number; // 1-5
	completedAt: number | null; // When the quiz was completed
}

// ============================================
// Constants
// ============================================

const LOCAL_STORAGE_KEY = 'escapetogether_preferences';
const PERSIST_DEBOUNCE_MS = 500;

// Default preferences
const defaultPreferences: StoredPreferences = {
	playerNames: {
		playerA: '',
		playerB: ''
	},
	collaboration: 'talk_through',
	challengePreference: 'balanced',
	hintPreference: 'when_stuck',
	difficultyTier: 3,
	completedAt: null
};

// ============================================
// Helper Functions
// ============================================

function loadFromLocalStorage(): StoredPreferences {
	if (!browser) return { ...defaultPreferences };

	try {
		const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<StoredPreferences>;
			// Merge with defaults to ensure all fields exist
			return {
				...defaultPreferences,
				...parsed
			};
		}
	} catch (error) {
		console.error('Failed to load preferences from localStorage:', error);
	}

	return { ...defaultPreferences };
}

// ============================================
// Core Store
// ============================================

function createPreferencesStore() {
	const initialState = loadFromLocalStorage();
	const { subscribe, set, update } = writable<StoredPreferences>(initialState);

	// Debounce timer for localStorage persistence
	let persistTimeout: ReturnType<typeof setTimeout> | null = null;

	// Persist to localStorage with debouncing
	function persist(state: StoredPreferences): void {
		if (!browser) return;

		// Clear any pending persist
		if (persistTimeout) {
			clearTimeout(persistTimeout);
		}

		// Debounce the persist operation
		persistTimeout = setTimeout(() => {
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
			} catch (error) {
				console.error('Failed to persist preferences to localStorage:', error);
			}
		}, PERSIST_DEBOUNCE_MS);
	}

	return {
		subscribe,
		set: (state: StoredPreferences) => {
			set(state);
			persist(state);
		},
		update: (updater: (state: StoredPreferences) => StoredPreferences) => {
			update((state) => {
				const newState = updater(state);
				persist(newState);
				return newState;
			});
		},

		// Update specific preference fields
		setPlayerNames: (playerA: string, playerB: string) => {
			update((state) => ({
				...state,
				playerNames: { playerA, playerB }
			}));
		},

		setCollaboration: (style: CollaborationStyle) => {
			update((state) => ({
				...state,
				collaboration: style
			}));
		},

		setChallengePreference: (preference: ChallengePreference) => {
			update((state) => ({
				...state,
				challengePreference: preference
			}));
		},

		setHintPreference: (preference: HintPreference) => {
			update((state) => ({
				...state,
				hintPreference: preference
			}));
		},

		setDifficultyTier: (tier: number) => {
			update((state) => ({
				...state,
				difficultyTier: Math.max(1, Math.min(5, tier))
			}));
		},

		// Mark quiz as completed
		completeQuiz: () => {
			update((state) => ({
				...state,
				completedAt: Date.now()
			}));
		},

		// Reset to defaults
		reset: () => {
			const defaultState = { ...defaultPreferences };
			set(defaultState);
			if (browser) {
				try {
					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultState));
				} catch (error) {
					console.error('Failed to reset preferences:', error);
				}
			}
		},

		// Clear persisted data
		clearPersisted: () => {
			if (browser) {
				try {
					localStorage.removeItem(LOCAL_STORAGE_KEY);
				} catch (error) {
					console.error('Failed to clear persisted preferences:', error);
				}
			}
		},

		// Force persist current state
		forcePersist: () => {
			const state = loadFromLocalStorage();
			if (browser) {
				try {
					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
				} catch (error) {
					console.error('Failed to force persist preferences:', error);
				}
			}
		}
	};
}

// Create the store instance
export const preferences = createPreferencesStore();

// ============================================
// Derived Stores (Computed Values)
// ============================================

// Check if preferences have been set (quiz completed)
export const hasCompletedQuiz = derived(
	preferences,
	($preferences) => $preferences.completedAt !== null
);

// Check if player names are set
export const hasPlayerNames = derived(
	preferences,
	($preferences) => $preferences.playerNames.playerA.trim() !== '' && $preferences.playerNames.playerB.trim() !== ''
);

// Get primary player name (playerA)
export const primaryPlayerName = derived(
	preferences,
	($preferences) => $preferences.playerNames.playerA
);

// Get difficulty description
export const difficultyDescription = derived(
	preferences,
	($preferences) => {
		const descriptions: Record<number, string> = {
			1: 'Very Easy - Relaxed pace, generous hints',
			2: 'Easy - Forgiving challenges',
			3: 'Normal - Balanced experience',
			4: 'Hard - Demanding puzzles',
			5: 'Expert - True test of skill'
		};
		return descriptions[$preferences.difficultyTier] || descriptions[3];
	}
);

// Get collaboration style description
export const collaborationDescription = derived(
	preferences,
	($preferences) => {
		const descriptions: Record<CollaborationStyle, string> = {
			one_leads: 'One person leads, the other follows',
			independent_explore: 'Explore independently and share findings',
			talk_through: 'Talk through everything together'
		};
		return descriptions[$preferences.collaboration] || descriptions.talk_through;
	}
);

// Get hint preference description
export const hintPreferenceDescription = derived(
	preferences,
	($preferences) => {
		const descriptions: Record<HintPreference, string> = {
			early: 'Offer hints early and often',
			when_stuck: 'Only when truly stuck',
			never: 'Never - figure it out ourselves'
		};
		return descriptions[$preferences.hintPreference] || descriptions.when_stuck;
	}
);

// ============================================
// Export Types
// ============================================

// Note: CollaborationStyle, ChallengePreference, HintPreference are exported from $lib/types.ts
// StoredPreferences is already exported via the interface definition above

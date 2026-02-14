// EscapeTogether - Role Assignment System
// Manages Explorer/Analyst roles for players

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import { gameState } from './gameState';
import type { Player, PlayerRole, GameState } from '$lib/types';
import { browser } from '$app/environment';

// ============================================
// Constants
// ============================================

export const ROLE_COLORS: Record<PlayerRole, { primary: string; secondary: string; bg: string }> = {
	explorer: {
		primary: '#3B82F6', // Blue
		secondary: '#60A5FA',
		bg: 'rgba(59, 130, 246, 0.15)'
	},
	analyst: {
		primary: '#F97316', // Orange
		secondary: '#FB923C',
		bg: 'rgba(249, 115, 22, 0.15)'
	}
};

export const ROLE_CAPABILITIES: Record<PlayerRole, string[]> = {
	explorer: [
		'Can see and interact with puzzle elements',
		'Can move around the room',
		'Can collect and use items',
		'Can trigger mechanisms'
	],
	analyst: [
		'Can see reference materials',
		'Can access hint system',
		'Can take notes',
		'Can see puzzle clues from a different perspective'
	]
};

export const ROLE_ICONS: Record<PlayerRole, string> = {
	explorer: '🧭',
	analyst: '🔍'
};

// ============================================
// Role Notification Store
// ============================================

interface RoleNotification {
	show: boolean;
	previousRole: PlayerRole | null;
	newRole: PlayerRole;
	timestamp: number;
}

function createRoleNotificationStore() {
	const { subscribe, set, update }: Writable<RoleNotification> = writable({
		show: false,
		previousRole: null,
		newRole: 'explorer',
		timestamp: 0
	});

	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	return {
		subscribe,
		/** Show a role swap notification */
		showNotification: (previousRole: PlayerRole | null, newRole: PlayerRole) => {
			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}

			set({
				show: true,
				previousRole,
				newRole,
				timestamp: Date.now()
			});

			// Auto-hide after 3 seconds
			hideTimeout = setTimeout(() => {
				update((state) => ({ ...state, show: false }));
			}, 3000);
		},
		/** Hide the notification immediately */
		hide: () => {
			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}
			update((state) => ({ ...state, show: false }));
		}
	};
}

export const roleNotification = createRoleNotificationStore();

// ============================================
// Role Assignment Functions
// ============================================

/**
 * Assigns roles to players when a new game starts.
 * Player A gets Explorer, Player B gets Analyst.
 */
export function assignRoles(state: GameState): GameState {
	const updatedPlayers = { ...state.players };

	if (updatedPlayers.playerA) {
		updatedPlayers.playerA = {
			...updatedPlayers.playerA,
			role: 'explorer'
		};
	}

	if (updatedPlayers.playerB) {
		updatedPlayers.playerB = {
			...updatedPlayers.playerB,
			role: 'analyst'
		};
	}

	return {
		...state,
		players: updatedPlayers
	};
}

/**
 * Swaps roles between players when a puzzle is solved.
 * Explorer becomes Analyst and vice versa.
 */
export function swapRoles(state: GameState): GameState {
	const updatedPlayers = { ...state.players };

	if (updatedPlayers.playerA && updatedPlayers.playerB) {
		const playerARole = updatedPlayers.playerA.role;
		const playerBRole = updatedPlayers.playerB.role;

		updatedPlayers.playerA = {
			...updatedPlayers.playerA,
			role: playerBRole
		};

		updatedPlayers.playerB = {
			...updatedPlayers.playerB,
			role: playerARole
		};
	}

	return {
		...state,
		players: updatedPlayers
	};
}

/**
 * Gets the current role for a specific player by ID.
 */
export function getCurrentRole(playerId: string): PlayerRole | null {
	const state = get(gameState);

	const playerA = state.players.playerA;
	const playerB = state.players.playerB;

	if (playerA?.id === playerId) {
		return playerA.role;
	}

	if (playerB?.id === playerId) {
		return playerB.role;
	}

	return null;
}

/**
 * Gets a player by their role.
 */
export function getPlayerByRole(role: PlayerRole): Player | null {
	const state = get(gameState);

	const playerA = state.players.playerA;
	const playerB = state.players.playerB;

	if (playerA?.role === role) {
		return playerA;
	}

	if (playerB?.role === role) {
		return playerB;
	}

	return null;
}

/**
 * Checks if a player can perform an action based on their role.
 */
export function canPerformRoleAction(playerId: string, requiredRole: PlayerRole): boolean {
	const role = getCurrentRole(playerId);
	return role === requiredRole;
}

// ============================================
// Store Actions
// ============================================

/**
 * Initialize roles for a new game.
 * Call this when the game starts.
 */
export function initializeRoles(): void {
	gameState.update((state) => assignRoles(state));
}

/**
 * Swap roles between players.
 * Call this when a puzzle is solved.
 */
export function performRoleSwap(): void {
	gameState.update((state) => {
		const previousRole = state.players.playerA?.role ?? null;
		const newState = swapRoles(state);

		// Show notification for the swap
		if (browser) {
			roleNotification.showNotification(previousRole, previousRole === 'explorer' ? 'analyst' : 'explorer');
		}

		return newState;
	});
}

/**
 * Handle puzzle solved event - swap roles automatically.
 */
export function onPuzzleSolved(): void {
	performRoleSwap();
}

// ============================================
// Derived Stores
// ============================================

/** Get the current player's role (assumes you are playerA for demo) */
export const currentPlayerRole: Readable<PlayerRole> = derived(
	gameState,
	($state) => $state.players.playerA?.role ?? 'explorer'
);

/** Get the Explorer player */
export const explorerPlayer: Readable<Player | null> = derived(
	gameState,
	($state) => {
		if ($state.players.playerA?.role === 'explorer') return $state.players.playerA;
		if ($state.players.playerB?.role === 'explorer') return $state.players.playerB;
		return null;
	}
);

/** Get the Analyst player */
export const analystPlayer: Readable<Player | null> = derived(
	gameState,
	($state) => {
		if ($state.players.playerA?.role === 'analyst') return $state.players.playerA;
		if ($state.players.playerB?.role === 'analyst') return $state.players.playerB;
		return null;
	}
);

/** Check if roles are assigned */
export const rolesAssigned: Readable<boolean> = derived(
	gameState,
	($state) => {
		const playerA = $state.players.playerA;
		const playerB = $state.players.playerB;
		return playerA !== null && playerB !== null &&
			   playerA.role !== undefined && playerB.role !== undefined;
	}
);

// ============================================
// Export Types
// ============================================

export type { PlayerRole };

// EscapeTwogether - Role-based UI utilities
// Helps puzzle components render differently based on player roles

import type { PlayerRole } from '$lib/types';
import { ROLE_COLORS, ROLE_CAPABILITIES } from '$lib/stores/roles';

/**
 * Get role-specific CSS classes for styling
 */
export function getRoleClasses(role: PlayerRole): string {
	const base = 'role-based';
	return `${base} ${base}-${role}`;
}

/**
 * Get role-specific inline styles
 */
export function getRoleStyles(role: PlayerRole): Record<string, string> {
	const colors = ROLE_COLORS[role];
	return {
		'--role-primary': colors.primary,
		'--role-secondary': colors.secondary,
		'--role-bg': colors.bg
	};
}

/**
 * Check if a role can perform a specific action
 */
export function canRolePerformAction(role: PlayerRole, action: 'interact' | 'hint' | 'examine'): boolean {
	const capabilities: Record<PlayerRole, string[]> = {
		explorer: ['interact', 'examine'],
		analyst: ['hint', 'examine']
	};

	return capabilities[role].includes(action);
}

/**
 * Get role-specific UI prompts
 */
export function getRolePrompt(role: PlayerRole, context: 'general' | 'puzzle' | 'coordination'): string {
	const prompts: Record<PlayerRole, Record<string, string[]>> = {
		explorer: {
			general: [
				'Click on objects to examine them',
				'Drag items to move them',
				'Interact with puzzle mechanisms'
			],
			puzzle: [
				'Try interacting with the puzzle elements',
				'Describe what you see to your partner',
				'Look for clues in the environment'
			],
			coordination: [
				'Tell your Analyst what you discover',
				'Ask for hints when stuck',
				'Work together to find solutions'
			]
		},
		analyst: {
			general: [
				'Review reference materials',
				'Access hints and clues',
				'Guide your Explorer partner'
			],
			puzzle: [
				'Check the reference information',
				'Provide guidance to your Explorer',
				'Look for patterns in clues'
			],
			coordination: [
				'Share what you find in references',
				'Guide your Explorer to solutions',
				'Coordinate your discoveries'
			]
		}
	};

	const rolePrompts = prompts[role][context];
	return rolePrompts[Math.floor(Math.random() * rolePrompts.length)];
}

/**
 * Get role-specific icon for UI elements
 */
export function getRoleIcon(role: PlayerRole): string {
	return role === 'explorer' ? '🧭' : '🔍';
}

/**
 * Get role-specific color for UI elements
 */
export function getRoleColor(role: PlayerRole): string {
	return ROLE_COLORS[role].primary;
}

/**
 * Format role name for display
 */
export function formatRoleName(role: PlayerRole): string {
	return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Get a message encouraging role-based cooperation
 */
export function getCooperationMessage(playerRole: PlayerRole, partnerRole: PlayerRole): string {
	const messages = [
		`As the ${formatRoleName(playerRole)}, work with your ${formatRoleName(partnerRole)} partner to solve this!`,
		`Your ${formatRoleName(partnerRole)} partner has different information - coordinate with them!`,
		`Combine your ${formatRoleName(playerRole)} abilities with your partner's ${formatRoleName(partnerRole)} skills!`
	];

	return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Check if role interaction is required for a puzzle element
 */
export function requiresRoleInteraction(elementRole: PlayerRole | 'both', playerRole: PlayerRole): boolean {
	return elementRole === 'both' || elementRole === playerRole;
}

/**
 * Get aria-label for role-based UI elements
 */
export function getRoleAriaLabel(role: PlayerRole, action: string): string {
	return `${formatRoleName(role)} role - ${action}`;
}

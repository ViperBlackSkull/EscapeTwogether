// Puzzle 5: The Secret Message
// Player A must get close to objects to see hidden letters (proximity trigger)
// Player B sees the "Grandparents' Favorites" list with hints about which objects
// Goal: Find all 10 letters and spell "MARIE + JAMES"

import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Re-export puzzle ID for test compatibility
export { ROOM1_PUZZLE_IDS };

// Object containing a hidden letter
export interface HiddenLetterObject {
	id: string;
	name: string;
	letter: string;
	position: { x: number; y: number };
	hint: string; // B sees this hint
	description: string; // For A to describe
	examineAction: string; // What A must do to reveal
}

// Discovered letter info
export interface DiscoveredLetter {
	objectId: string;
	letter: string;
	discoveredBy: 'A' | 'B' | null;
	timestamp: number | null;
}

// Puzzle state
export interface SecretMessageState {
	objects: HiddenLetterObject[];
	discoveredLetters: DiscoveredLetter[];
	lettersFound: number;
	playerInput: {
		A: string; // Player A's guess for first name
		B: string; // Player B's guess for second name
	};
	correctSolution: {
		first: string; // "MARIE"
		second: string; // "JAMES"
		combined: string; // "MARIE+JAMES"
	};
	completed: boolean;
	wrongSubmissions: number;
}

// All hidden letter objects in the room (from spec)
const HIDDEN_OBJECTS: HiddenLetterObject[] = [
	{
		id: 'music_box',
		name: 'Music Box',
		letter: 'M',
		position: { x: 200, y: 150 },
		hint: 'They loved waltzes',
		description: 'An ornate wooden box with a ballerina inside',
		examineAction: 'Look at the embossed letter on top'
	},
	{
		id: 'photo_frame',
		name: 'Photo Frame',
		letter: 'A',
		position: { x: 400, y: 100 },
		hint: 'First dance, 1947',
		description: 'A silver frame on the mantle',
		examineAction: 'Check the carved corner'
	},
	{
		id: 'rosary',
		name: 'Rosary Beads',
		letter: 'R',
		position: { x: 600, y: 200 },
		hint: 'Sunday morning ritual',
		description: 'Pearl beads hanging on a hook',
		examineAction: 'Turn over to see the back'
	},
	{
		id: 'inkwell',
		name: 'Inkwell',
		letter: 'I',
		position: { x: 300, y: 350 },
		hint: 'Grandpa wrote love letters',
		description: 'A glass inkwell on the desk',
		examineAction: 'Examine the painted bottom'
	},
	{
		id: 'jewelry_box',
		name: 'Jewelry Box',
		letter: 'E',
		position: { x: 500, y: 400 },
		hint: 'Where she kept her ring',
		description: 'A velvet-lined box',
		examineAction: 'Open to see inside'
	},
	{
		id: 'journal',
		name: 'Journal',
		letter: 'J',
		position: { x: 150, y: 250 },
		hint: 'Her diary, locked for 60 years',
		description: 'A leather-bound book',
		examineAction: 'Look at the cover initials'
	},
	{
		id: 'apron',
		name: 'Apron',
		letter: 'A',
		position: { x: 650, y: 150 },
		hint: 'She baked every Sunday',
		description: 'A flowered apron on a hook',
		examineAction: 'Check the embroidered pocket'
	},
	{
		id: 'mirror',
		name: 'Mirror',
		letter: 'M',
		position: { x: 350, y: 450 },
		hint: 'Her vanity, her pride',
		description: 'A small hand mirror on the dresser',
		examineAction: 'Look at the painted reflection'
	},
	{
		id: 'doily',
		name: 'Lace Doily',
		letter: 'E',
		position: { x: 550, y: 300 },
		hint: 'Handmade with love',
		description: 'A lace doily under the trunk',
		examineAction: 'Lift the trunk edge'
	},
	{
		id: 'spectacles_case',
		name: 'Spectacles Case',
		letter: 'S',
		position: { x: 250, y: 180 },
		hint: 'How she read his letters',
		description: 'A worn leather case',
		examineAction: 'Check the scratched bottom'
	}
];

// B's favorites list (all hints)
const FAVORITES_LIST = HIDDEN_OBJECTS.map(obj => obj.hint);

// Hints
const HINTS: PuzzleHint[] = [
	{
		tier: 1,
		text: 'One object pulses with a golden glow. Move closer to objects to reveal their secrets.',
		triggerAttempts: 2
	},
	{
		tier: 2,
		text: 'The letters seem to form two names. Sort them into two groups of five letters each.',
		triggerAttempts: 4
	},
	{
		tier: 3,
		text: 'Her name is first: M _ _ _ E. His name is second: J _ _ _ S. The names are MARIE and JAMES!',
		triggerAttempts: 6
	}
];

// Create initial state
export function createInitialState(): SecretMessageState {
	return {
		objects: [...HIDDEN_OBJECTS],
		discoveredLetters: HIDDEN_OBJECTS.map(obj => ({
			objectId: obj.id,
			letter: obj.letter,
			discoveredBy: null,
			timestamp: null
		})),
		lettersFound: 0,
		playerInput: {
			A: '',
			B: ''
		},
		correctSolution: {
			first: 'MARIE',
			second: 'JAMES',
			combined: 'MARIE+JAMES'
		},
		completed: false,
		wrongSubmissions: 0
	};
}

// Check if player A is close enough to an object (proximity check)
export function isPlayerNearObject(
	objectPosition: { x: number; y: number },
	playerPosition: { x: number; y: number },
	proximityThreshold: number = 50
): boolean {
	const dx = objectPosition.x - playerPosition.x;
	const dy = objectPosition.y - playerPosition.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance <= proximityThreshold;
}

// Discover a letter from an object
export function discoverLetter(
	state: SecretMessageState,
	objectId: string,
	playerRole: PlayerRole
): SecretMessageState {
	const discoveredLetter = state.discoveredLetters.find(l => l.objectId === objectId);

	if (!discoveredLetter || discoveredLetter.discoveredBy !== null) {
		return state; // Already discovered or not found
	}

	const playerLetter = playerRole === 'explorer' ? 'A' : 'B';
	discoveredLetter.discoveredBy = playerLetter;
	discoveredLetter.timestamp = Date.now();

	state.lettersFound = state.discoveredLetters.filter(l => l.discoveredBy !== null).length;

	return { ...state };
}

// Get nearby objects for Player A
export function getNearbyObjects(
	state: SecretMessageState,
	playerPosition: { x: number; y: number },
	threshold: number = 50
): HiddenLetterObject[] {
	return state.objects.filter(obj =>
		isPlayerNearObject(obj.position, playerPosition, threshold)
	);
}

// Submit answer
export function submitAnswer(
	state: SecretMessageState,
	first: string,
	second: string
): { state: SecretMessageState; correct: boolean; message: string } {
	const combined = `${first.toUpperCase()}+${second.toUpperCase()}`;

	if (combined === state.correctSolution.combined && state.lettersFound >= 8) {
		state.completed = true;
		state.playerInput.A = first.toUpperCase();
		state.playerInput.B = second.toUpperCase();
		return {
			state: { ...state },
			correct: true,
			message: 'The names are revealed: Marie and James - your grandparents! Their love story is unlocked.'
		};
	}

	state.wrongSubmissions++;
	return {
		state: { ...state },
		correct: false,
		message: 'That doesn\'t seem right. Keep searching for more letters.'
	};
}

// Get the favorites list for Player B
export function getFavoritesList(): string[] {
	return [...FAVORITES_LIST];
}

// Match a hint to an object
export function matchHintToObject(state: SecretMessageState, hint: string): HiddenLetterObject | undefined {
	return state.objects.find(obj => obj.hint === hint);
}

// Get discovered letters as a string
export function getDiscoveredLettersString(state: SecretMessageState): string {
	return state.discoveredLetters
		.filter(l => l.discoveredBy !== null)
		.map(l => l.letter)
		.join('');
}

// Get letters sorted by discovery time
export function getLettersByDiscoveryOrder(state: SecretMessageState): DiscoveredLetter[] {
	return state.discoveredLetters
		.filter(l => l.discoveredBy !== null)
		.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

// Auto-sort letters into two groups (hint feature)
export function autoSortLetters(state: SecretMessageState): {
	firstName: string[];
	secondName: string[];
} {
	const discovered = state.discoveredLetters.filter(l => l.discoveredBy !== null);
	const letters = discovered.map(l => l.letter);

	// Known solution mapping
	const firstNameLetters = ['M', 'A', 'R', 'I', 'E'];
	const secondNameLetters = ['J', 'A', 'M', 'E', 'S'];

	const first: string[] = [];
	const second: string[] = [];

	for (const letter of letters) {
		if (firstNameLetters.includes(letter) && !first.includes(letter)) {
			first.push(letter);
		} else if (secondNameLetters.includes(letter) && !second.includes(letter)) {
			second.push(letter);
		}
	}

	return { firstName: first, secondName: second };
}

// Validate solution
export function validateSolution(state: PuzzleState): boolean {
	const puzzleState = state.data as unknown as SecretMessageState;
	if (!puzzleState) return false;

	return puzzleState.completed;
}

// Get player-specific view
export function getPlayerView(state: SecretMessageState, role: PlayerRole, playerPosition?: { x: number; y: number }): {
	role: PlayerRole;
	lettersFound: number;
	totalLetters: number;
	discoveredLetters: DiscoveredLetter[];
	completed: boolean;
	nearbyObjects?: HiddenLetterObject[];
	favoritesList?: string[];
	objects?: HiddenLetterObject[];
	playerInput: { A: string; B: string };
	correctSolution: { first: string; second: string };
} {
	const view: ReturnType<typeof getPlayerView> = {
		role,
		lettersFound: state.lettersFound,
		totalLetters: state.objects.length,
		discoveredLetters: state.discoveredLetters.filter(l => l.discoveredBy !== null),
		completed: state.completed,
		playerInput: state.playerInput,
		correctSolution: state.correctSolution
	};

	if (role === 'explorer') {
		// Player A sees objects and can discover letters when nearby
		view.objects = state.objects;
		if (playerPosition) {
			view.nearbyObjects = getNearbyObjects(state, playerPosition);
		}
	} else {
		// Player B sees the favorites list with hints
		view.favoritesList = getFavoritesList();
	}

	return view;
}

// Get progress percentage
export function getProgress(state: SecretMessageState): number {
	return (state.lettersFound / state.objects.length) * 100;
}

// Alias for progress (for test compatibility)
export const getDiscoveryProgress = getProgress;

// Alias for isPlayerNearObject (for test compatibility)
export const checkProximity = isPlayerNearObject;

// Alias for discoverLetter - examines an object to reveal its letter
export function examineObject(
	state: SecretMessageState,
	objectId: string,
	playerRole: PlayerRole
): SecretMessageState {
	return discoverLetter(state, objectId, playerRole);
}

// Update player position and return nearby objects (for UI updates)
export function updatePlayerPosition(
	state: SecretMessageState,
	position: { x: number; y: number }
): { state: SecretMessageState; nearbyObjects: HiddenLetterObject[] } {
	return {
		state,
		nearbyObjects: getNearbyObjects(state, position)
	};
}

// Puzzle definition
export const SecretMessagePuzzle: PuzzleDefinition = {
	id: ROOM1_PUZZLE_IDS.SECRET_MESSAGE,
	roomId: 'attic',
	name: 'The Secret Message',
	description: 'Hidden letters are scattered throughout the attic. Find all the letters to discover your grandparents\' names.',
	requiredRoles: ['explorer', 'analyst'],
	solutionValidator: validateSolution,
	hints: HINTS
};

export default SecretMessagePuzzle;

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState, setGamePhase, gameElapsedTime, isGameCompleted } from '$lib/stores/gameState';
	import { getGameManager } from '$lib/gameManager';
	import type { RoomId } from '$lib/types';

	export let onVictory: () => void = () => {};
	export let onDefeat: (reason: 'timeout' | 'disconnected' | 'abandoned') => void = () => {};
	export let onRoomTransition: (fromRoom: RoomId, toRoom: RoomId) => void = () => {};

	const gameManager = getGameManager();

	let checkInterval: NodeJS.Timeout | null = null;

	// Monitor game state for completion
	$: if ($isGameCompleted && checkInterval) {
		cleanup();
	}

	onMount(() => {
		// Start monitoring game state
		startMonitoring();
	});

	onDestroy(() => {
		cleanup();
	});

	function startMonitoring() {
		// Check every second for game state changes
		checkInterval = setInterval(() => {
			const state = $gameState;

			// Check for timeout
			if (state.timeLimit && state.startedAt) {
				const elapsed = Date.now() - state.startedAt - state.totalPauseTime;
				if (elapsed >= state.timeLimit) {
					handleDefeat('timeout');
					return;
				}
			}

			// Check for room completion
			checkRoomCompletion();

		}, 1000);
	}

	function checkRoomCompletion() {
		const state = $gameState;
		const currentRoom = state.currentRoom;

		// Get puzzle IDs for current room
		const roomPuzzles = getRoomPuzzleIds(currentRoom);

		// Check if all puzzles in room are solved
		const allSolved = roomPuzzles.every(puzzleId =>
			state.puzzleStates[puzzleId]?.solved
		);

		if (allSolved && !state.roomsCompleted.includes(currentRoom)) {
			// Complete current room
			handleRoomComplete(currentRoom);
		}
	}

	function getRoomPuzzleIds(roomId: RoomId): string[] {
		// This would come from puzzle definitions
		// For now, return empty array
		return [];
	}

	function handleRoomComplete(roomId: RoomId) {
		console.log('Room completed:', roomId);

		// Determine next room
		const roomOrder: RoomId[] = ['attic', 'clock_tower', 'garden_conservatory'];
		const currentIndex = roomOrder.indexOf(roomId);

		if (currentIndex < roomOrder.length - 1) {
			// Transition to next room
			const nextRoom = roomOrder[currentIndex + 1];
			onRoomTransition(roomId, nextRoom);
		} else {
			// All rooms completed - victory!
			handleVictory();
		}
	}

	function handleVictory() {
		console.log('Victory!');
		setGamePhase('completed');
		onVictory();
		cleanup();
	}

	function handleDefeat(reason: 'timeout' | 'disconnected' | 'abandoned') {
		console.log('Defeat:', reason);
		setGamePhase('completed');
		onDefeat(reason);
		cleanup();
	}

	function cleanup() {
		if (checkInterval) {
			clearInterval(checkInterval);
			checkInterval = null;
		}
	}

	// Export helper functions
	export function forceVictory() {
		handleVictory();
	}

	export function forceDefeat(reason: 'timeout' | 'disconnected' | 'abandoned') {
		handleDefeat(reason);
	}
</script>

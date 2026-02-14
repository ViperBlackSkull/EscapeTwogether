<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		gameState,
		gamePhase,
		currentRoom,
		roomCode,
		players,
		bothPlayersPresent,
		isGameInProgress,
		isGamePaused,
		isGameCompleted,
		puzzlesSolved,
		gameElapsedTime,
		setRoomCode,
		setGamePhase,
		setCurrentRoom,
		useHint,
		reset
	} from '$lib/stores/gameState';
	import type { RoomId, GamePhase } from '$lib/types';

	// Local state for testing
	let testRoomCode = 'TEST';
	let selectedPhase: GamePhase = 'lobby';
	let selectedRoom: RoomId = 'attic';

	// Subscribe to stores and display values
	let currentPhaseValue: GamePhase = 'lobby';
	let currentRoomValue: RoomId = 'attic';
	let roomCodeValue = '';
	let elapsedTimeValue: number | null = null;
	let puzzlesSolvedValue = 0;
	let bothPlayersValue = false;
	let inProgressValue = false;
	let pausedValue = false;
	let completedValue = false;

	let phaseUnsubscribe: () => void;
	let roomUnsubscribe: () => void;
	let codeUnsubscribe: () => void;
	let elapsedUnsubscribe: () => void;
	let solvedUnsubscribe: () => void;
	let bothPlayersUnsubscribe: () => void;
	let inProgressUnsubscribe: () => void;
	let pausedUnsubscribe: () => void;
	let completedUnsubscribe: () => void;

	onMount(() => {
		phaseUnsubscribe = gamePhase.subscribe((v) => (currentPhaseValue = v));
		roomUnsubscribe = currentRoom.subscribe((v) => (currentRoomValue = v));
		codeUnsubscribe = roomCode.subscribe((v) => (roomCodeValue = v));
		elapsedUnsubscribe = gameElapsedTime.subscribe((v) => (elapsedTimeValue = v));
		solvedUnsubscribe = puzzlesSolved.subscribe((v) => (puzzlesSolvedValue = v));
		bothPlayersUnsubscribe = bothPlayersPresent.subscribe((v) => (bothPlayersValue = v));
		inProgressUnsubscribe = isGameInProgress.subscribe((v) => (inProgressValue = v));
		pausedUnsubscribe = isGamePaused.subscribe((v) => (pausedValue = v));
		completedUnsubscribe = isGameCompleted.subscribe((v) => (completedValue = v));
	});

	onDestroy(() => {
		phaseUnsubscribe?.();
		roomUnsubscribe?.();
		codeUnsubscribe?.();
		elapsedUnsubscribe?.();
		solvedUnsubscribe?.();
		bothPlayersUnsubscribe?.();
		inProgressUnsubscribe?.();
		pausedUnsubscribe?.();
		completedUnsubscribe?.();
	});

	// Test actions
	function testSetRoomCode() {
		setRoomCode(testRoomCode);
	}

	function testSetPhase() {
		setGamePhase(selectedPhase);
	}

	function testSetRoom() {
		setCurrentRoom(selectedRoom);
	}

	function testUseHint() {
		useHint();
	}

	function testReset() {
		reset();
	}
</script>

<div class="game-state-debug p-4 bg-slate-800 rounded-lg text-white max-w-md">
	<h2 class="text-xl font-bold mb-4 text-amber-400">Game State Store Debug</h2>

	<!-- Current State Display -->
	<div class="mb-6 space-y-2">
		<h3 class="text-lg font-semibold text-teal-400">Current Store Values</h3>
		<div class="grid grid-cols-2 gap-2 text-sm">
			<span class="text-gray-400">Room Code:</span>
			<span class="font-mono">{roomCodeValue || '(none)'}</span>

			<span class="text-gray-400">Game Phase:</span>
			<span class="font-mono text-amber-300">{currentPhaseValue}</span>

			<span class="text-gray-400">Current Room:</span>
			<span class="font-mono">{currentRoomValue}</span>

			<span class="text-gray-400">Elapsed Time:</span>
			<span class="font-mono">{elapsedTimeValue !== null ? `${elapsedTimeValue}s` : 'N/A'}</span>

			<span class="text-gray-400">Puzzles Solved:</span>
			<span class="font-mono text-green-400">{puzzlesSolvedValue}</span>

			<span class="text-gray-400">Both Players:</span>
			<span class={bothPlayersValue ? 'text-green-400' : 'text-red-400'}>
				{bothPlayersValue ? 'Yes' : 'No'}
			</span>

			<span class="text-gray-400">In Progress:</span>
			<span class={inProgressValue ? 'text-green-400' : 'text-gray-500'}>
				{inProgressValue ? 'Yes' : 'No'}
			</span>

			<span class="text-gray-400">Paused:</span>
			<span class={pausedValue ? 'text-yellow-400' : 'text-gray-500'}>
				{pausedValue ? 'Yes' : 'No'}
			</span>

			<span class="text-gray-400">Completed:</span>
			<span class={completedValue ? 'text-green-400' : 'text-gray-500'}>
				{completedValue ? 'Yes' : 'No'}
			</span>
		</div>
	</div>

	<!-- Test Controls -->
	<div class="space-y-4">
		<h3 class="text-lg font-semibold text-teal-400">Test Controls</h3>

		<!-- Set Room Code -->
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={testRoomCode}
				placeholder="Room Code"
				maxlength="4"
				class="flex-1 px-2 py-1 bg-slate-700 rounded text-white text-sm"
			/>
			<button
				on:click={testSetRoomCode}
				class="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium"
			>
				Set Code
			</button>
		</div>

		<!-- Set Game Phase -->
		<div class="flex gap-2">
			<select
				bind:value={selectedPhase}
				class="flex-1 px-2 py-1 bg-slate-700 rounded text-white text-sm"
			>
				<option value="lobby">Lobby</option>
				<option value="playing">Playing</option>
				<option value="paused">Paused</option>
				<option value="completed">Completed</option>
			</select>
			<button
				on:click={testSetPhase}
				class="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium"
			>
				Set Phase
			</button>
		</div>

		<!-- Set Current Room -->
		<div class="flex gap-2">
			<select
				bind:value={selectedRoom}
				class="flex-1 px-2 py-1 bg-slate-700 rounded text-white text-sm"
			>
				<option value="attic">Attic</option>
				<option value="clock_tower">Clock Tower</option>
				<option value="garden_conservatory">Garden Conservatory</option>
			</select>
			<button
				on:click={testSetRoom}
				class="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium"
			>
				Set Room
			</button>
		</div>

		<!-- Use Hint -->
		<div class="flex gap-2">
			<button
				on:click={testUseHint}
				class="flex-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium"
			>
				Use Hint (+1)
			</button>
		</div>

		<!-- Reset -->
		<div class="flex gap-2">
			<button
				on:click={testReset}
				class="flex-1 px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
			>
				Reset State
			</button>
		</div>
	</div>

	<!-- Store Subscription Status -->
	<div class="mt-4 pt-4 border-t border-slate-600">
		<p class="text-xs text-gray-500">
			This component subscribes to the game state store and displays values reactively.
			Changes are persisted to localStorage.
		</p>
	</div>
</div>

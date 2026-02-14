<script lang="ts">
	import GameStateDebug from '$lib/components/GameStateDebug.svelte';
</script>

<svelte:head>
	<title>Test Game State Store - EscapeTogether</title>
</svelte:head>

<main class="min-h-screen bg-slate-900 py-8 px-4">
	<div class="max-w-2xl mx-auto">
		<h1 class="text-3xl font-bold text-white mb-2 text-center">Game State Store Test</h1>
		<p class="text-gray-400 text-center mb-8">
			This page tests the Svelte store for synchronized game state
		</p>

		<div class="flex justify-center">
			<GameStateDebug />
		</div>

		<div class="mt-8 p-4 bg-slate-800 rounded-lg text-gray-300 text-sm">
			<h2 class="font-bold text-white mb-2">Verification Checklist:</h2>
			<ul class="list-disc list-inside space-y-1">
				<li>Store initializes with default state</li>
				<li>Click "Set Code" to update room code - value should update reactively</li>
				<li>Click "Set Phase" to change game phase - derived values should update</li>
				<li>Click "Set Room" to change current room</li>
				<li>Click "Use Hint" to increment hints used</li>
				<li>Refresh the page - state should persist from localStorage</li>
				<li>Click "Reset State" to clear all state</li>
			</ul>
		</div>
	</div>
</main>

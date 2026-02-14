<script lang="ts">
	import { currentRoom, isGamePaused, pauseGame, resumeGame } from '$lib/socket';

	export let show: boolean = false;

	$: room = $currentRoom;
	$: roomCode = room?.code || '';

	function copyRoomCode() {
		navigator.clipboard.writeText(roomCode);
	}

	async function handleResume() {
		await resumeGame();
	}

	async function handleReturnToMenu() {
		// Navigate back to home
		window.location.href = '/';
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 bg-deep-navy/90 backdrop-blur-sm z-50 flex items-center justify-center"
		on:click|self={() => {}}
	>
		<div class="bg-soft-black border border-dusty-rose/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
			<!-- Pause Icon -->
			<div class="text-center mb-6">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-warm-amber/20 rounded-full mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-warm-amber" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<h2 class="text-2xl font-semibold text-antique-gold">Game Paused</h2>
				<p class="text-sm text-dusty-rose/60 mt-2">Timer is stopped</p>
			</div>

			<!-- Room Code Display -->
			<div class="bg-deep-navy/50 rounded-lg p-4 mb-6">
				<p class="text-xs text-dusty-rose/50 uppercase tracking-wider mb-2 text-center">Room Code</p>
				<div class="flex items-center justify-center gap-3">
					<span class="text-3xl font-mono font-bold text-warm-amber tracking-widest">{roomCode}</span>
					<button
						on:click={copyRoomCode}
						class="p-2 bg-dusty-rose/10 rounded-lg hover:bg-dusty-rose/20 transition-colors"
						title="Copy room code"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-dusty-rose" viewBox="0 0 20 20" fill="currentColor">
							<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
							<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
						</svg>
					</button>
				</div>
				<p class="text-xs text-dusty-rose/40 text-center mt-2">Share this code with your partner to reconnect</p>
			</div>

			<!-- Actions -->
			<div class="space-y-3">
				<button
					on:click={handleResume}
					class="w-full py-3 bg-warm-amber text-deep-navy font-semibold rounded-lg hover:bg-warm-amber/80 transition-colors flex items-center justify-center gap-2"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
					</svg>
					Resume Game
				</button>

				<button
					on:click={handleReturnToMenu}
					class="w-full py-3 bg-transparent border border-dusty-rose/30 text-dusty-rose font-medium rounded-lg hover:bg-dusty-rose/10 transition-colors"
				>
					Return to Menu
				</button>
			</div>

			<!-- Reconnection Note -->
			<div class="mt-6 p-3 bg-warm-amber/5 border border-warm-amber/20 rounded-lg">
				<p class="text-xs text-dusty-rose/60 text-center">
					<span class="text-warm-amber">Tip:</span> Your partner can rejoin using the room code above
				</p>
			</div>
		</div>
	</div>
{/if}

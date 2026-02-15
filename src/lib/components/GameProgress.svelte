<script lang="ts">
	import { gameState, puzzlesSolved } from '$lib/stores/gameState';
	import { rooms } from '$lib/puzzles';

	export let showDetailed = false;

	$: gameProgress = calculateProgress();

	function calculateProgress() {
		const state = $gameState;
		const totalRooms = rooms.length;
		const completedRooms = state.roomsCompleted.length;
		const totalPuzzles = rooms.reduce((sum, room) => sum + room.puzzleCount, 0);
		const solvedPuzzles = Object.values(state.puzzleStates).filter(p => p.solved).length;

		return {
			rooms: { completed: completedRooms, total: totalRooms },
			puzzles: { solved: solvedPuzzles, total: totalPuzzles },
			percentage: Math.round((solvedPuzzles / totalPuzzles) * 100)
		};
	}

	function getCurrentRoomProgress() {
		const state = $gameState;
		const currentRoom = rooms.find(r => r.id === state.currentRoom);

		if (!currentRoom) return null;

		const roomPuzzles = currentRoom.puzzleIds || [];
		const solvedInRoom = roomPuzzles.filter(id =>
			state.puzzleStates[id]?.solved
		).length;

		return {
			solved: solvedInRoom,
			total: roomPuzzles.length,
			percentage: Math.round((solvedInRoom / roomPuzzles.length) * 100)
		};
	}

	$: roomProgress = getCurrentRoomProgress();
</script>

{#if showDetailed}
	<div class="game-progress-detailed">
		<div class="progress-section">
			<h3>Overall Progress</h3>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {gameProgress.percentage}%"></div>
			</div>
			<p>{gameProgress.puzzles.solved} / {gameProgress.puzzles.total} puzzles solved</p>
		</div>

		<div class="progress-section">
			<h3>Room Progress</h3>
			<div class="room-list">
				{#each rooms as room}
					<div class="room-item" class:completed={$gameState.roomsCompleted.includes(room.id)} class:current={$gameState.currentRoom === room.id}>
						<div class="room-info">
							<span class="room-name">{room.name}</span>
							<span class="room-status">
								{#if $gameState.roomsCompleted.includes(room.id)}
									Completed
								{:else if $gameState.currentRoom === room.id}
									In Progress
								{:else}
									Locked
								{/if}
							</span>
						</div>
						<div class="room-puzzles">
							{#each room.puzzleIds as puzzleId}
								<div class="puzzle-dot" class:solved={$gameState.puzzleStates[puzzleId]?.solved}></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="game-progress-compact">
		<div class="progress-item">
			<span class="progress-label">Puzzles</span>
			<span class="progress-value">{gameProgress.puzzles.solved}/{gameProgress.puzzles.total}</span>
		</div>
		<div class="progress-item">
			<span class="progress-label">Rooms</span>
			<span class="progress-value">{gameProgress.rooms.completed}/{gameProgress.rooms.total}</span>
		</div>
		{#if roomProgress}
			<div class="progress-item current-room">
				<span class="progress-label">Current Room</span>
				<span class="progress-value">{roomProgress.solved}/{roomProgress.total}</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.game-progress-detailed {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	.progress-section h3 {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1rem;
		font-weight: 600;
		color: #d4af37;
		margin: 0 0 1rem 0;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #d4af37 0%, #8b7355 100%);
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.progress-section p {
		font-size: 0.85rem;
		color: #c9a9a6;
		margin: 0;
	}

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.room-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.room-item.completed {
		border-color: rgba(74, 222, 128, 0.2);
		background: rgba(74, 222, 128, 0.05);
	}

	.room-item.current {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.08);
	}

	.room-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.room-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: #ffffff;
	}

	.room-status {
		font-size: 0.75rem;
		color: #c9a9a6;
		text-transform: capitalize;
	}

	.room-puzzles {
		display: flex;
		gap: 0.25rem;
	}

	.puzzle-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}

	.puzzle-dot.solved {
		background: #4ade80;
		box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
	}

	.game-progress-compact {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
	}

	.progress-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8rem;
	}

	.progress-item.current-room {
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		margin-top: 0.25rem;
	}

	.progress-label {
		color: #c9a9a6;
	}

	.progress-value {
		font-weight: 600;
		color: #d4af37;
	}
</style>

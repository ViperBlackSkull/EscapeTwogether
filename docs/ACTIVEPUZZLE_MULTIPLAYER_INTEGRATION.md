# ActivePuzzle Multiplayer Integration Guide

This guide shows how to integrate multiplayer sync into the ActivePuzzle component.

## Integration Steps

### 1. Add Imports

```svelte
import { broadcastAction, sendPuzzleState } from '$lib/utils/multiplayer';
import { SharedCursor, PingSystem, PlayerActionBanner } from './multiplayer';
```

### 2. Add Container Reference

```svelte
let gameContainer: HTMLElement;
```

### 3. Broadcast Puzzle Loading

In the `loadPuzzle` function, after getting the puzzle:

```svelte
// Broadcast puzzle loading action
broadcastAction('examining', currentPuzzle.name);
```

### 4. Broadcast Puzzle Solved

In `handleSubmitSolution`, when puzzle is solved:

```svelte
// Broadcast puzzle solved
broadcastAction('solved', currentPuzzle.name);
sendPuzzleState(currentPuzzle.id, {
  solved: true,
  solvedAt: Date.now(),
  solution
});
```

### 5. Broadcast Failed Attempts

In `handleSubmitSolution`, when attempt fails:

```svelte
// Broadcast failed attempt
broadcastAction('attempted', currentPuzzle.name);
sendPuzzleState(currentPuzzle.id, {
  solved: false,
  attempts: (puzzleState?.attempts || 0) + 1,
  lastAttempt: solution
});
```

### 6. Broadcast Piece Interactions

In `handlePuzzlePieceClick`:

```svelte
// Broadcast piece interaction
if (currentPuzzle) {
  broadcastAction('interacting', `${currentPuzzle.name} piece`);
}
```

### 7. Wrap Canvas with Multiplayer Components

Wrap the GameCanvas component:

```svelte
<div class="puzzle-canvas" bind:this={gameContainer}>
  <SharedCursor container={gameContainer} enabled={true}>
    <PingSystem container={gameContainer} enabled={true}>
      <GameCanvas
        bind:currentRoom={roomForCanvas}
        bind:currentPuzzleState={puzzleState}
        bind:currentPuzzleId={puzzleId}
        on:ready={handleGameCanvasReady}
        on:interact={handleCanvasInteract}
        on:puzzle:pieceClick={handlePuzzlePieceClick}
        on:puzzle:pieceHover={handlePuzzlePieceHover}
      />
    </PingSystem>
  </SharedCursor>
</div>
```

### 8. Add PlayerActionBanner

Add at the top of the puzzle container:

```svelte
<div class="active-puzzle-container">
  <PlayerActionBanner enabled={true} position="top" maxActions={3} />
  <!-- rest of content -->
</div>
```

## Complete Example

Here's how the integrated component should look:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import type { PuzzleDefinition, PuzzleState } from '$lib/types';
  import { getPuzzleById } from '$lib/puzzles';
  import { getGameManager } from '$lib/stores/gameState';
  import { currentPlayerRole, performRoleSwap } from '$lib/stores/roles';
  import GameCanvas from './GameCanvas.svelte';
  import PuzzleSelection from './PuzzleSelection.svelte';
  import RoleBadge from './RoleBadge.svelte';
  import { soundManager } from '$lib/audio';
  import { broadcastAction, sendPuzzleState } from '$lib/utils/multiplayer';
  import { SharedCursor, PingSystem, PlayerActionBanner } from './multiplayer';

  export let puzzleId: string | null = null;
  export let roomId: string = 'attic';

  const dispatch = createEventDispatcher();
  const gameManager = getGameManager();

  let showPuzzleSelection = false;
  let currentPuzzle: PuzzleDefinition | null = null;
  let puzzleState: PuzzleState | null = null;
  let isLoading = false;
  let showVictoryAnimation = false;
  let gameContainer: HTMLElement;

  $: currentRole = $currentPlayerRole;

  $: if (puzzleId) {
    loadPuzzle(puzzleId);
  }

  $: roomForCanvas = roomId === 'garden_conservatory' ? 'garden' : roomId as any;

  async function loadPuzzle(id: string) {
    if (!browser) return;

    isLoading = true;
    currentPuzzle = getPuzzleById(id);

    if (!currentPuzzle) {
      console.error('Puzzle not found:', id);
      isLoading = false;
      return;
    }

    // Broadcast puzzle loading action
    broadcastAction('examining', currentPuzzle.name);

    puzzleState = gameManager.getCurrentPuzzleState();

    if (!puzzleState) {
      puzzleState = {
        puzzleId: id,
        solved: false,
        attempts: 0,
        data: {}
      };
    }

    isLoading = false;
  }

  function handleSubmitSolution(solution: any) {
    if (!currentPuzzle || !puzzleState) return;

    const result = gameManager.submitPuzzleSolution(currentPuzzle.id, solution);

    if (result.success) {
      showVictoryAnimation = true;
      soundManager.playPuzzleSolved();

      puzzleState = { ...puzzleState, solved: true };

      // Perform role swap after puzzle completion
      performRoleSwap();

      // Broadcast puzzle solved
      broadcastAction('solved', currentPuzzle.name);
      sendPuzzleState(currentPuzzle.id, {
        solved: true,
        solvedAt: Date.now(),
        solution
      });

      dispatch('solved', { puzzleId: currentPuzzle.id });

      setTimeout(() => {
        showVictoryAnimation = false;
        currentPuzzle = null;
        puzzleState = null;
      }, 2000);
    } else {
      soundManager.play('error');

      // Broadcast failed attempt
      broadcastAction('attempted', currentPuzzle.name);
      sendPuzzleState(currentPuzzle.id, {
        solved: false,
        attempts: (puzzleState?.attempts || 0) + 1,
        lastAttempt: solution
      });

      dispatch('attempt', { puzzleId: currentPuzzle.id, success: false });
    }
  }

  function handlePuzzlePieceClick(event: CustomEvent) {
    const { pieceId } = event.detail;

    // Broadcast piece interaction
    if (currentPuzzle) {
      broadcastAction('interacting', `${currentPuzzle.name} piece`);
    }

    dispatch('pieceClick', event.detail);
  }

  // ... rest of the component
</script>

<div class="active-puzzle-container">
  <PlayerActionBanner enabled={true} position="top" maxActions={3} />

  {#if isLoading}
    <!-- loading state -->
  {:else if currentPuzzle && puzzleState}
    <div class="puzzle-active">
      <div class="puzzle-header">
        <!-- header content -->
      </div>

      <div class="puzzle-canvas" bind:this={gameContainer}>
        <SharedCursor container={gameContainer} enabled={true}>
          <PingSystem container={gameContainer} enabled={true}>
            <GameCanvas
              bind:currentRoom={roomForCanvas}
              bind:currentPuzzleState={puzzleState}
              bind:currentPuzzleId={puzzleId}
              on:ready={handleGameCanvasReady}
              on:interact={handleCanvasInteract}
              on:puzzle:pieceClick={handlePuzzlePieceClick}
              on:puzzle:pieceHover={handlePuzzlePieceHover}
            />
          </PingSystem>
        </SharedCursor>
      </div>
    </div>
  {/if}
</div>
```

## Testing

1. Start the server: `cd server && npm run dev`
2. Open the game in two browser windows
3. Join the same room with different player names
4. Test the multiplayer features:
   - Move mouse - see shared cursors
   - Shift+Click - create ping highlights
   - Load a puzzle - see "Player X is examining..."
   - Solve a puzzle - see "Player X solved..."
   - Fail an attempt - see "Player X attempted..."

## Benefits

- Players can see each other's cursor positions
- Players can highlight important locations with pings
- Players are notified of each other's actions
- Puzzle state is synchronized between players
- Enhanced cooperation and communication

## Notes

- All broadcasts are throttled to prevent spam
- SharedCursor automatically shows unique colors per player
- PingSystem requires Shift+Click to prevent accidental pings
- PlayerActionBanner automatically fades out old actions
- All components clean up automatically on disconnect

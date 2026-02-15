# Game Page Multiplayer Integration Example

This example shows how to integrate the multiplayer communication tools into the game page.

## Basic Integration

Add these imports to your game page:

```svelte
<script>
  import { onMount } from 'svelte';
  import { SharedCursor, PingSystem, PlayerActionBanner } from '$lib/components/multiplayer';
  import { broadcastAction, sendPuzzleState } from '$lib/utils/multiplayer';

  let gameContainer;

  onMount(() => {
    // Multiplayer handlers are automatically initialized
    // when the socket connects
  });
</script>
```

## Wrap Your Game Content

```svelte
<div bind:this={gameContainer} class="game-container">
  <PlayerActionBanner enabled={true} position="top" />

  <SharedCursor container={gameContainer} enabled={true}>
    <PingSystem container={gameContainer} enabled={true}>
      <!-- Your existing game content here -->
      <div class="game-canvas">
        <!-- Puzzle components, etc. -->
      </div>
    </PingSystem>
  </SharedCursor>
</div>
```

## Broadcast Player Actions

When players interact with puzzles:

```svelte
<script>
  function handlePuzzleInteraction(puzzleId, interaction) {
    // Broadcast action to other player
    broadcastAction('examining', puzzleId);

    // Send puzzle state update
    sendPuzzleState(puzzleId, {
      lastInteraction: Date.now(),
      currentState: getCurrentPuzzleState()
    });
  }

  function handlePuzzleSolved(puzzleId) {
    broadcastAction('solved', puzzleId);
    sendPuzzleState(puzzleId, { solved: true });
  }
</script>
```

## Complete Example with ActivePuzzle

```svelte
<script>
  import { SharedCursor, PingSystem, PlayerActionBanner } from '$lib/components/multiplayer';
  import { broadcastAction, sendPuzzleState } from '$lib/utils/multiplayer';
  import ActivePuzzle from '$lib/components/ActivePuzzle.svelte';

  let gameContainer;
  let activePuzzleId = null;

  function handlePuzzleStart(event) {
    const { puzzleId } = event.detail;
    activePuzzleId = puzzleId;
    broadcastAction('examining', puzzleId);
  }

  function handlePuzzleSolved(event) {
    const { puzzleId } = event.detail;
    broadcastAction('solved', puzzleId);
    sendPuzzleState(puzzleId, { solved: true, solvedAt: Date.now() });
    activePuzzleId = null;
  }

  function handleInteraction(event) {
    if (activePuzzleId) {
      sendPuzzleState(activePuzzleId, {
        lastInteraction: Date.now(),
        interaction: event.detail
      });
    }
  }
</script>

<div bind:this={gameContainer} class="game-wrapper">
  <PlayerActionBanner enabled={true} position="top" maxActions={3} />

  <SharedCursor container={gameContainer} enabled={true}>
    <PingSystem container={gameContainer} enabled={true}>
      <ActivePuzzle
        bind:puzzleId={activePuzzleId}
        on:start={handlePuzzleStart}
        on:solved={handlePuzzleSolved}
        on:interact={handleInteraction}
      />
    </PingSystem>
  </SharedCursor>
</div>

<style>
  .game-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
```

## Mobile Considerations

The components work on mobile, but you may want to adjust the ping trigger:

```svelte
<PingSystem
  container={gameContainer}
  enabled={true}
  pingKey="Long Press"  <!-- Displayed to user -->
/>
```

## Performance Tips

1. **Disable when not needed**: If multiplayer features aren't needed in certain sections, set `enabled={false}`

2. **Adjust throttling**: For slower connections, you can increase the throttle intervals in `multiplayer.ts`

3. **Limit puzzle state updates**: Only send state when it actually changes, not on every frame

## Testing

1. Open the game in two browser windows
2. Join the same room with different player names
3. Move your mouse - see the other player's cursor
4. Hold Shift and click to create a ping
5. Interact with puzzles - see actions in the banner

## Troubleshooting

**Cursors not showing?**
- Ensure both players are in the same room
- Check that the container element is properly bound
- Verify the socket is connected

**Pings not working?**
- Make sure you're holding Shift while clicking
- Check that PingSystem is enabled
- Verify the container element is properly bound

**Actions not appearing?**
- Ensure broadcastAction is being called
- Check that PlayerActionBanner is enabled
- Verify the action text is recognized

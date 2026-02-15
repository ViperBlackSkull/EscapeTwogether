# Multiplayer Communication Tools - Integration Guide

This guide explains how to integrate the new multiplayer communication tools into the game.

## Components Added

### 1. SharedCursor Component
Shows the real-time cursor position of your partner player.

**Usage:**
```svelte
<script>
  import { SharedCursor } from '$lib/components/multiplayer';
  let gameContainer;
</script>

<div bind:this={gameContainer} class="game-container">
  <SharedCursor container={gameContainer} enabled={true}>
    <!-- Your game content here -->
  </SharedCursor>
</div>
```

### 2. PingSystem Component
Allows players to highlight locations for attention by Shift+Clicking.

**Usage:**
```svelte
<script>
  import { PingSystem } from '$lib/components/multiplayer';
  let gameContainer;
</script>

<div bind:this={gameContainer} class="game-container">
  <PingSystem container={gameContainer} enabled={true}>
    <!-- Your game content here -->
  </PingSystem>
</div>
```

### 3. PlayerActionBanner Component
Displays recent actions from other players (e.g., "Player X is examining...").

**Usage:**
```svelte
<script>
  import { PlayerActionBanner } from '$lib/components/multiplayer';
</script>

<PlayerActionBanner enabled={true} position="top" maxActions={3} />
```

## Utility Functions

### Broadcasting Player Actions
```typescript
import { broadcastAction } from '$lib/utils/multiplayer';

// Broadcast an action
broadcastAction('examining', 'Music Box');
broadcastAction('solved', 'Bell Codes Puzzle');
broadcastAction('room_changed', 'Library');
```

### Sharing Puzzle State
```typescript
import { sendPuzzleState } from '$lib/utils/multiplayer';

// Send puzzle state updates
sendPuzzleState('music-box', {
  pieces: [1, 2, 3],
  currentPosition: { x: 100, y: 200 }
});
```

### Sharing Photos
```typescript
import { sharePhoto } from '$lib/utils/multiplayer';

// Share a completed photo piece
sharePhoto('photo-fragment-1', {
  imageData: 'base64...',
  position: { x: 100, y: 100 }
});
```

### Handling State Sync
```typescript
import { requestStateSync } from '$lib/utils/multiplayer';

// Request state sync from other players
requestStateSync();
```

## Integration with Game Components

### Example: Integrating with Puzzle Components

```svelte
<script>
  import { onMount } from 'svelte';
  import { sendPuzzleState, broadcastAction } from '$lib/utils/multiplayer';

  export let puzzleId = '';

  // Broadcast when player interacts
  function handleInteraction(event) {
    broadcastAction('examining', puzzleId);

    // Send state updates
    sendPuzzleState(puzzleId, {
      lastInteraction: Date.now(),
      currentState: getCurrentState()
    });
  }

  // Broadcast when puzzle is solved
  function handleSolve() {
    broadcastAction('solved', puzzleId);
    sendPuzzleState(puzzleId, {
      solved: true,
      solvedAt: Date.now()
    });
  }
</script>
```

### Example: Game Page Integration

```svelte
<script>
  import { onMount } from 'svelte';
  import { SharedCursor } from '$lib/components/multiplayer';
  import { PingSystem } from '$lib/components/multiplayer';
  import { PlayerActionBanner } from '$lib/components/multiplayer';
  import { initializeMultiplayerHandlers } from '$lib/utils/multiplayer';

  let gameContainer;

  onMount(() => {
    // Initialize multiplayer handlers
    initializeMultiplayerHandlers();

    return () => {
      // Cleanup happens automatically
    };
  });
</script>

<div class="game-page">
  <PlayerActionBanner enabled={true} position="top" />

  <div bind:this={gameContainer} class="game-container">
    <SharedCursor container={gameContainer} enabled={true}>
      <PingSystem container={gameContainer} enabled={true}>
        <!-- Game content -->
      </PingSystem>
    </SharedCursor>
  </div>
</div>
```

## Server-Side Events

The server now handles these new events:

### Client → Server
- `cursor:move` - Send cursor position
- `cursor:ping` - Send a ping highlight
- `puzzle:state` - Sync puzzle state
- `photo:share` - Share photo data
- `player:action` - Broadcast player actions
- `sync:request` - Request state sync

### Server → Client
- `cursor:move` - Receive partner's cursor
- `cursor:ping` - Receive ping highlight
- `puzzle:state` - Receive puzzle state update
- `photo:share` - Receive shared photo
- `player:action` - Receive player action
- `sync:request` - Receive state sync request

## Performance Considerations

### Throttling
- Cursor updates: Throttled to 20fps (50ms)
- Minimum movement threshold: 5 pixels
- Ping events: Limited to 1 per second
- Action broadcasts: Limited to 1 per 0.5 seconds

### Automatic Cleanup
- Remote cursors are removed after 5 seconds of inactivity
- Pings are automatically removed after 3 seconds
- Player actions are removed after 5 seconds
- Maximum 10 recent actions stored

## Reconnection Handling

When a player disconnects and reconnects:

1. Socket automatically attempts reconnection (up to 10 attempts)
2. Room info is preserved for rejoining
3. Use `requestStateSync()` to sync game state after reconnection
4. Other players' cursors are cleaned up on disconnect

## Customization

### Cursor Appearance
Cursor colors are automatically generated from player IDs using HSL color space. Each player gets a unique color.

### Ping Messages
You can add custom messages to pings:
```typescript
import { sendPing } from '$lib/utils/multiplayer';

sendPing(x, y, 'Look here!');
```

### Action Text
Customize action text in the PlayerActionBanner component by modifying the `getActionText()` function.

## Testing

To test the multiplayer features:

1. Start the server: `cd server && npm run dev`
2. Open the game in two browser windows/tabs
3. Join the same room with different player names
4. Observe:
   - Shared cursors moving in real-time
   - Shift+Click creating ping highlights
   - Player actions appearing in the banner
   - Puzzle state syncing between players

## Troubleshooting

### Cursors not showing
- Ensure both players are in the same room
- Check browser console for WebSocket errors
- Verify the container element is properly bound

### Pings not working
- Make sure you're holding Shift while clicking
- Check that the PingSystem component is enabled
- Verify the container element is properly bound

### Actions not appearing
- Ensure broadcastAction is being called with correct parameters
- Check that PlayerActionBanner is enabled
- Verify the action text is recognized

### State sync issues
- Call requestStateSync() after reconnection
- Ensure both players have compatible game state versions
- Check browser console for sync-related errors

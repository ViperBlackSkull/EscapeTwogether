// Multiplayer utilities for synchronized features
import { get, writable, type Writable } from 'svelte/store';
import { getSocket, currentRoom } from '$lib/socket';

// ============================================
// Types
// ============================================

export interface CursorPosition {
  playerId: string;
  playerName: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface CursorPing {
  playerId: string;
  playerName: string;
  x: number;
  y: number;
  message?: string;
  timestamp: number;
}

export interface PuzzleStateUpdate {
  playerId: string;
  puzzleId: string;
  state: any;
  timestamp: number;
}

export interface PhotoShare {
  playerId: string;
  playerName: string;
  photoId: string;
  photoData: any;
  timestamp: number;
}

export interface PlayerAction {
  playerId: string;
  playerName: string;
  action: string;
  target?: string;
  timestamp: number;
}

// ============================================
// Stores
// ============================================

// Remote player cursors (excluding self)
export const remoteCursors: Writable<Map<string, CursorPosition>> = writable(new Map());

// Active ping displays
export const activePings: Writable<CursorPing[]> = writable([]);

// Recent player actions
export const recentActions: Writable<PlayerAction[]> = writable([]);

// ============================================
// Cursor Tracking
// ============================================

let cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
let lastCursorPosition = { x: 0, y: 0 };
const CURSOR_THROTTLE_MS = 50; // Throttle cursor updates to 20fps
const CURSOR_MOVE_THRESHOLD = 5; // Minimum pixels to trigger update

/**
 * Send local cursor position to other players
 * Throttled to prevent excessive network traffic
 */
export function sendCursorPosition(x: number, y: number): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  // Clear existing timer
  if (cursorThrottleTimer) {
    clearTimeout(cursorThrottleTimer);
  }

  // Check if position changed enough
  const deltaX = Math.abs(x - lastCursorPosition.x);
  const deltaY = Math.abs(y - lastCursorPosition.y);

  if (deltaX < CURSOR_MOVE_THRESHOLD && deltaY < CURSOR_MOVE_THRESHOLD) {
    return; // Not enough movement
  }

  lastCursorPosition = { x, y };

  // Throttle the actual send
  cursorThrottleTimer = setTimeout(() => {
    try {
      socket.emit('cursor:move', {
        roomCode: room.code,
        x: Math.round(x),
        y: Math.round(y)
      });
    } catch (error) {
      console.error('Error sending cursor position:', error);
    }
  }, CURSOR_THROTTLE_MS);
}

/**
 * Update remote cursor position in store
 */
export function updateRemoteCursor(cursor: CursorPosition): void {
  remoteCursors.update((cursors) => {
    const updated = new Map(cursors);
    updated.set(cursor.playerId, cursor);
    return updated;
  });

  // Clean up old cursors after timeout
  setTimeout(() => {
    remoteCursors.update((cursors) => {
      const updated = new Map(cursors);
      const stored = updated.get(cursor.playerId);
      if (stored && stored.timestamp === cursor.timestamp) {
        updated.delete(cursor.playerId);
      }
      return updated;
    });
  }, 5000); // Remove cursor after 5 seconds of inactivity
}

/**
 * Remove remote cursor (when player disconnects)
 */
export function removeRemoteCursor(playerId: string): void {
  remoteCursors.update((cursors) => {
    const updated = new Map(cursors);
    updated.delete(playerId);
    return updated;
  });
}

// ============================================
// Ping System
// ============================================

let pingThrottleTimer: ReturnType<typeof setTimeout> | null = null;
const PING_THROTTLE_MS = 1000; // Limit pings to once per second

/**
 * Send a ping to highlight a location
 */
export function sendPing(x: number, y: number, message?: string): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  // Throttle ping sends
  if (pingThrottleTimer) {
    return;
  }

  pingThrottleTimer = setTimeout(() => {
    pingThrottleTimer = null;
  }, PING_THROTTLE_MS);

  try {
    socket.emit('cursor:ping', {
      roomCode: room.code,
      x: Math.round(x),
      y: Math.round(y),
      message
    });
  } catch (error) {
    console.error('Error sending ping:', error);
  }
}

/**
 * Add a ping to display
 */
export function addPing(ping: CursorPing): void {
  activePings.update((pings) => [...pings, ping]);

  // Automatically remove ping after animation
  setTimeout(() => {
    activePings.update((pings) => pings.filter((p) => p.timestamp !== ping.timestamp));
  }, 3000); // Show ping for 3 seconds
}

// ============================================
// Puzzle State Sync
// ============================================

/**
 * Send puzzle state update to other players
 */
export function sendPuzzleState(puzzleId: string, state: any): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  try {
    socket.emit('puzzle:state', {
      roomCode: room.code,
      puzzleId,
      state
    });
  } catch (error) {
    console.error('Error sending puzzle state:', error);
  }
}

/**
 * Handle incoming puzzle state update
 */
export function handlePuzzleStateUpdate(update: PuzzleStateUpdate, callback?: (update: PuzzleStateUpdate) => void): void {
  // Can be used to trigger UI updates or game state changes
  if (callback) {
    callback(update);
  }
}

// ============================================
// Photo Sharing
// ============================================

/**
 * Share a completed photo/puzzle piece
 */
export function sharePhoto(photoId: string, photoData: any): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  try {
    socket.emit('photo:share', {
      roomCode: room.code,
      photoId,
      photoData
    });
  } catch (error) {
    console.error('Error sharing photo:', error);
  }
}

/**
 * Handle incoming photo share
 */
export function handlePhotoShare(share: PhotoShare, callback?: (share: PhotoShare) => void): void {
  if (callback) {
    callback(share);
  }
}

// ============================================
// Player Action Broadcasting
// ============================================

let actionThrottleTimer: ReturnType<typeof setTimeout> | null = null;
const ACTION_THROTTLE_MS = 500; // Limit actions to once per 0.5 seconds

/**
 * Broadcast a player action
 */
export function broadcastAction(action: string, target?: string): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  // Throttle action broadcasts
  if (actionThrottleTimer) {
    return;
  }

  actionThrottleTimer = setTimeout(() => {
    actionThrottleTimer = null;
  }, ACTION_THROTTLE_MS);

  try {
    socket.emit('player:action', {
      roomCode: room.code,
      action,
      target
    });
  } catch (error) {
    console.error('Error broadcasting action:', error);
  }
}

/**
 * Handle incoming player action
 */
export function handlePlayerAction(action: PlayerAction): void {
  recentActions.update((actions) => {
    // Keep only last 10 actions
    const updated = [action, ...actions].slice(0, 10);
    return updated;
  });

  // Auto-remove old actions after 5 seconds
  setTimeout(() => {
    recentActions.update((actions) => actions.filter((a) => a.timestamp !== action.timestamp));
  }, 5000);
}

// ============================================
// Reconnection State Sync
// ============================================

/**
 * Request state sync from other players
 */
export function requestStateSync(): void {
  const socket = getSocket();
  const room = get(currentRoom);

  if (!socket.connected || !room) {
    return;
  }

  try {
    socket.emit('sync:request', {
      roomCode: room.code
    }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        console.error('State sync request failed:', response.error);
      }
    });
  } catch (error) {
    console.error('Error requesting state sync:', error);
  }
}

/**
 * Handle state sync request and send current state
 */
export function handleStateSyncRequest(callback: () => any): void {
  // Send current game state to requesting player
  try {
    const state = callback();
    if (state) {
      sharePhoto('full-game-state', state);
    }
  } catch (error) {
    console.error('Error handling state sync request:', error);
  }
}

// ============================================
// Socket Event Handlers Setup
// ============================================

/**
 * Initialize multiplayer socket event handlers
 */
export function initializeMultiplayerHandlers(): void {
  const socket = getSocket();

  // Cursor movement from other players
  socket.on('cursor:move', (data: CursorPosition) => {
    updateRemoteCursor(data);
  });

  // Cursor pings
  socket.on('cursor:ping', (data: CursorPing) => {
    addPing(data);
  });

  // Puzzle state updates
  socket.on('puzzle:state', (data: PuzzleStateUpdate) => {
    handlePuzzleStateUpdate(data);
  });

  // Photo shares
  socket.on('photo:share', (data: PhotoShare) => {
    handlePhotoShare(data);
  });

  // Player actions
  socket.on('player:action', (data: PlayerAction) => {
    handlePlayerAction(data);
  });

  // State sync requests
  socket.on('sync:request', () => {
    handleStateSyncRequest(() => {
      // This will be overridden by actual game state getter
      return null;
    });
  });
}

/**
 * Cleanup multiplayer handlers
 */
export function cleanupMultiplayerHandlers(): void {
  const socket = getSocket();

  socket.off('cursor:move');
  socket.off('cursor:ping');
  socket.off('puzzle:state');
  socket.off('photo:share');
  socket.off('player:action');
  socket.off('sync:request');

  // Clear stores
  remoteCursors.set(new Map());
  activePings.set([]);
  recentActions.set([]);
}

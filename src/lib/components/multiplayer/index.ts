// Multiplayer components exports
export { default as SharedCursor } from './SharedCursor.svelte';
export { default as PingSystem } from './PingSystem.svelte';
export { default as PlayerActionBanner } from './PlayerActionBanner.svelte';

// Re-export utilities
export {
  sendCursorPosition,
  updateRemoteCursor,
  removeRemoteCursor,
  sendPing,
  addPing,
  sendPuzzleState,
  handlePuzzleStateUpdate,
  sharePhoto,
  handlePhotoShare,
  broadcastAction,
  handlePlayerAction,
  requestStateSync,
  handleStateSyncRequest,
  initializeMultiplayerHandlers,
  cleanupMultiplayerHandlers
} from '$lib/utils/multiplayer';

// Re-export types
export type {
  CursorPosition,
  CursorPing,
  PuzzleStateUpdate,
  PhotoShare,
  PlayerAction
} from '$lib/utils/multiplayer';

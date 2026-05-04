import { playMessageReceived, playNotification, playPuzzleComplete, playDoorUnlock, playHint } from '../services/soundEffects.js';

export function playMessageSound() {
  try { playMessageReceived(); } catch { /* silent fallback */ }
}

export function playSystemSound() {
  try { playNotification(); } catch { /* silent fallback */ }
}

export function playPuzzleSolvedSound() {
  try { playPuzzleComplete(); } catch { /* silent fallback */ }
}

export function playDoorUnlockSound() {
  try { playDoorUnlock(); } catch { /* silent fallback */ }
}

export function playHintSound() {
  try { playHint(); } catch { /* silent fallback */ }
}

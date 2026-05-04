import { GAME_CONFIG } from '../config.js';
import type { PuzzleActionPayload } from '../types.js';

const HTML_TAG_RE = /<[^>]*>/g;
const MAX_STRING_LENGTH = 500;
const MAX_PLAYER_NAME_LENGTH = 20;
const MIN_PLAYER_NAME_LENGTH = 1;

export function sanitizeString(input: string): string {
  return input.replace(HTML_TAG_RE, '').trim();
}

export function validateRoomCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Room code is required' };
  }
  const sanitized = code.toUpperCase().trim();
  if (sanitized.length !== GAME_CONFIG.roomCodeLength) {
    return { valid: false, error: `Room code must be ${GAME_CONFIG.roomCodeLength} characters` };
  }
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return { valid: false, error: 'Room code must be alphanumeric' };
  }
  return { valid: true };
}

export function validatePlayerName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Player name is required' };
  }
  const sanitized = sanitizeString(name);
  if (sanitized.length < MIN_PLAYER_NAME_LENGTH) {
    return { valid: false, error: 'Player name cannot be empty' };
  }
  if (sanitized.length > MAX_PLAYER_NAME_LENGTH) {
    return { valid: false, error: `Player name must be ${MAX_PLAYER_NAME_LENGTH} characters or fewer` };
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(sanitized)) {
    return { valid: false, error: 'Player name must be alphanumeric (spaces allowed)' };
  }
  return { valid: true, sanitized };
}

export function validateChatMessage(message: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  const sanitized = sanitizeString(message);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (sanitized.length > MAX_STRING_LENGTH) {
    return { valid: false, error: `Message must be ${MAX_STRING_LENGTH} characters or fewer` };
  }
  return { valid: true, sanitized };
}

export function validatePuzzleAction(payload: PuzzleActionPayload): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid puzzle action payload' };
  }
  if (!payload.puzzleId || typeof payload.puzzleId !== 'string') {
    return { valid: false, error: 'puzzleId is required' };
  }
  if (!payload.action || typeof payload.action !== 'string') {
    return { valid: false, error: 'action is required' };
  }
  if (payload.action.length > 50) {
    return { valid: false, error: 'action is too long' };
  }
  if (payload.data && typeof payload.data === 'object') {
    const serialized = JSON.stringify(payload.data);
    if (serialized.length > MAX_STRING_LENGTH) {
      return { valid: false, error: 'Puzzle action data is too large' };
    }
  }
  return { valid: true };
}

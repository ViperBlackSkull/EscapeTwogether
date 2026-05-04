import { mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GameRoom, Player } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SESSIONS_DIR = join(__dirname, '../../data/sessions');
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RECONNECTION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface SerializedSession {
  room: GameRoom;
  players: Array<{ id: string; name: string; disconnectedAt: number | null }>;
  savedAt: number;
  chatHistory: Array<{ sender: string; senderId: string; message: string; timestamp: number; type: string }>;
  cumulativeScore: number;
}

// In-memory tracking of disconnected players for reconnection
const disconnectedPlayers = new Map<string, {
  playerId: string;
  playerName: string;
  roomId: string;
  disconnectedAt: number;
  reconnectionToken: string;
}>();

// Map roomId -> last N chat messages (for replay on reconnect)
const chatHistory = new Map<string, Array<{ sender: string; senderId: string; message: string; timestamp: number; type: string }>>();
const MAX_CHAT_HISTORY = 200;

function ensureSessionsDir(): void {
  mkdirSync(SESSIONS_DIR, { recursive: true });
}

function sessionPath(roomId: string): string {
  return join(SESSIONS_DIR, `${roomId}.json`);
}

export function saveSession(room: GameRoom, cumulativeScore?: number): void {
  try {
    ensureSessionsDir();
    const playersSerialized = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      disconnectedAt: null as number | null,
    }));
    const serialized: SerializedSession = {
      room: {
        ...room,
        players: room.players.map((p) => ({ ...p })) as Player[],
      },
      players: playersSerialized,
      savedAt: Date.now(),
      chatHistory: chatHistory.get(room.id) ?? [],
      cumulativeScore: cumulativeScore ?? 0,
    };
    writeFileSync(sessionPath(room.id), JSON.stringify(serialized, null, 2));
  } catch {
    // Persistence is best-effort; don't crash the server
  }
}

export function loadSession(roomId: string): SerializedSession | null {
  try {
    const raw = readFileSync(sessionPath(roomId), 'utf-8');
    const session: SerializedSession = JSON.parse(raw);

    if (Date.now() - session.savedAt > SESSION_EXPIRY_MS) {
      deleteSession(roomId);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function deleteSession(roomId: string): void {
  try {
    unlinkSync(sessionPath(roomId));
  } catch {
    // Already deleted or never existed
  }
  chatHistory.delete(roomId);
}

export function cleanupExpiredSessions(): number {
  let cleaned = 0;
  try {
    ensureSessionsDir();
    const files = readdirSync(SESSIONS_DIR);
    const now = Date.now();
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const filePath = join(SESSIONS_DIR, file);
        const stat = statSync(filePath);
        if (now - stat.mtimeMs > SESSION_EXPIRY_MS) {
          unlinkSync(filePath);
          cleaned++;
        }
      } catch {
        // Skip files we can't stat
      }
    }
  } catch {
    // Directory might not exist
  }
  return cleaned;
}

// Track disconnected player for reconnection
export function trackDisconnectedPlayer(
  playerId: string,
  playerName: string,
  roomId: string,
): string {
  const reconnectionToken = `${playerId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  disconnectedPlayers.set(playerId, {
    playerId,
    playerName,
    roomId,
    disconnectedAt: Date.now(),
    reconnectionToken,
  });
  return reconnectionToken;
}

// Validate reconnection token and return player info
export function validateReconnection(token: string): {
  playerId: string;
  playerName: string;
  roomId: string;
} | null {
  for (const [playerId, info] of disconnectedPlayers) {
    if (info.reconnectionToken === token) {
      if (Date.now() - info.disconnectedAt > RECONNECTION_WINDOW_MS) {
        disconnectedPlayers.delete(playerId);
        return null;
      }
      return { playerId: info.playerId, playerName: info.playerName, roomId: info.roomId };
    }
  }
  return null;
}

export function clearDisconnectedPlayer(playerId: string): void {
  disconnectedPlayers.delete(playerId);
}

export function isPlayerDisconnected(playerId: string): boolean {
  return disconnectedPlayers.has(playerId);
}

export function getDisconnectedPlayerRoomId(playerId: string): string | null {
  return disconnectedPlayers.get(playerId)?.roomId ?? null;
}

export function addChatToHistory(
  roomId: string,
  message: { sender: string; senderId: string; message: string; timestamp: number; type: string },
): void {
  let history = chatHistory.get(roomId);
  if (!history) {
    history = [];
    chatHistory.set(roomId, history);
  }
  history.push(message);
  if (history.length > MAX_CHAT_HISTORY) {
    chatHistory.set(roomId, history.slice(-MAX_CHAT_HISTORY));
  }
}

export function getChatHistory(roomId: string): Array<{ sender: string; senderId: string; message: string; timestamp: number; type: string }> {
  return chatHistory.get(roomId) ?? [];
}

export function clearChatHistory(roomId: string): void {
  chatHistory.delete(roomId);
}

// Get all disconnected players for a room (for tracking who's offline)
export function getDisconnectedPlayersForRoom(roomId: string): Array<{
  playerId: string;
  playerName: string;
  disconnectedAt: number;
}> {
  const result: Array<{ playerId: string; playerName: string; disconnectedAt: number }> = [];
  for (const [, info] of disconnectedPlayers) {
    if (info.roomId === roomId) {
      result.push({
        playerId: info.playerId,
        playerName: info.playerName,
        disconnectedAt: info.disconnectedAt,
      });
    }
  }
  return result;
}

// Cleanup stale disconnected player entries (older than reconnection window)
export function cleanupStaleDisconnections(): void {
  const now = Date.now();
  for (const [playerId, info] of disconnectedPlayers) {
    if (now - info.disconnectedAt > RECONNECTION_WINDOW_MS) {
      disconnectedPlayers.delete(playerId);
    }
  }
}

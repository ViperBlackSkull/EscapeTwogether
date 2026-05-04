import type { RoomNarrative, PuzzleNarrative, GameEvent } from '../../../shared/types/narrative.js';
import { generateRoomNarrative, generatePuzzleNarrative } from './narrativeService.js';
import { ROOMS } from '../gameFlow.js';

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
}

const ROOM_THEMES = ROOMS.map((r) => r.name);
const PUZZLE_TYPES = ROOMS.flatMap((r) => r.puzzles);

const cache = new Map<string, CacheEntry<RoomNarrative | PuzzleNarrative>>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

type GenerationTask = {
  type: 'room' | 'puzzle';
  id: string;
};

const generationQueue: GenerationTask[] = [];
let isProcessing = false;

function cacheKey(type: 'room' | 'puzzle', id: string): string {
  return `${type}:${id}`;
}

export function getCachedRoomNarrative(roomIndex: number): RoomNarrative | null {
  const theme = ROOM_THEMES[roomIndex];
  if (!theme) return null;
  const entry = cache.get(cacheKey('room', theme));
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(cacheKey('room', theme));
    return null;
  }
  return entry.value as RoomNarrative;
}

export function getCachedPuzzleNarrative(puzzleType: string): PuzzleNarrative | null {
  const entry = cache.get(cacheKey('puzzle', puzzleType));
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(cacheKey('puzzle', puzzleType));
    return null;
  }
  return entry.value as PuzzleNarrative;
}

export function enqueueRoomGeneration(roomIndex: number, previousEvents: GameEvent[] = []): void {
  const theme = ROOM_THEMES[roomIndex];
  if (!theme) return;
  const key = cacheKey('room', theme);
  if (cache.has(key)) return;

  generationQueue.push({ type: 'room', id: `${roomIndex}:${theme}:${JSON.stringify(previousEvents.slice(-3))}` });
  processQueue(previousEvents);
}

export function enqueuePuzzleGeneration(puzzleType: string, roomTheme: string): void {
  const key = cacheKey('puzzle', puzzleType);
  if (cache.has(key)) return;

  generationQueue.push({ type: 'puzzle', id: `${puzzleType}:${roomTheme}` });
  processQueue();
}

async function processQueue(previousEvents?: GameEvent[]): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (generationQueue.length > 0) {
    const task = generationQueue.shift()!;
    try {
      if (task.type === 'room') {
        const [idxStr, theme, eventsJson] = task.id.split(':');
        const roomIndex = parseInt(idxStr!, 10);
        let events: GameEvent[] = [];
        try { events = JSON.parse(eventsJson ?? '[]'); } catch { /* empty */ }

        const narrative = await generateRoomNarrative(roomIndex, theme!, events);
        cache.set(cacheKey('room', theme!), {
          key: cacheKey('room', theme!),
          value: narrative,
          timestamp: Date.now(),
        });
      } else if (task.type === 'puzzle') {
        const [puzzleType, roomTheme] = task.id.split(':');
        const narrative = await generatePuzzleNarrative(puzzleType!, roomTheme!);
        cache.set(cacheKey('puzzle', puzzleType!), {
          key: cacheKey('puzzle', puzzleType!),
          value: narrative,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error(`NarrativeCache: generation failed for ${task.type}:${task.id}`, err);
    }
  }

  isProcessing = false;
}

export function preGenerateAllRoomNarratives(): void {
  for (let i = 0; i < ROOM_THEMES.length; i++) {
    enqueueRoomGeneration(i);
  }
}

export function preGenerateUpcomingRoom(currentRoomIndex: number): void {
  const nextIndex = currentRoomIndex + 1;
  if (nextIndex < ROOM_THEMES.length) {
    enqueueRoomGeneration(nextIndex);
  }
  // Also pre-generate puzzle narratives for the next room
  const nextConfig = ROOMS[nextIndex];
  if (nextConfig) {
    for (const puzzleType of nextConfig.puzzles) {
      enqueuePuzzleGeneration(puzzleType, nextConfig.name);
    }
  }
}

export function clearCache(): void {
  cache.clear();
  generationQueue.length = 0;
}

export function cacheSize(): number {
  return cache.size;
}

export function queueLength(): number {
  return generationQueue.length;
}

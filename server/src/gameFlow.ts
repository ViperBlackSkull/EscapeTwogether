import { ROOMS, TOTAL_ROOMS } from '../../shared/types/gameFlow.js';
import type { RoomConfig, HotspotConfig } from '../../shared/types/gameFlow.js';

export { ROOMS, TOTAL_ROOMS } from '../../shared/types/gameFlow.js';

export function getRoomConfig(index: number): RoomConfig | undefined {
  return ROOMS[index];
}

export function isLastRoom(index: number): boolean {
  return index >= TOTAL_ROOMS - 1;
}

export function getCurrentPuzzleTypes(roomIndex: number): string[] {
  return ROOMS[roomIndex]?.puzzles ?? [];
}

export function areAllRoomPuzzlesSolved(
  roomIndex: number,
  solvedPuzzles: Record<string, { type: string; solved: boolean }>,
): boolean {
  const config = ROOMS[roomIndex];
  if (!config) return false;
  return config.puzzles.every((type) => {
    const puzzle = Object.values(solvedPuzzles).find((p) => p.type === type);
    return puzzle?.solved ?? false;
  });
}

export function getTotalPuzzleCount(): number {
  return ROOMS.reduce((sum: number, room: RoomConfig) => sum + room.puzzles.length, 0);
}

export function getSolvedPuzzleCount(
  solvedPuzzles: Record<string, { type: string; solved: boolean }>,
): number {
  return Object.values(solvedPuzzles).filter((p) => p.solved).length;
}

export function getProgressSummary(
  currentRoomIndex: number,
  solvedPuzzles: Record<string, { type: string; solved: boolean }>,
): {
  roomsCompleted: number;
  totalRooms: number;
  puzzlesSolved: number;
  totalPuzzles: number;
} {
  let roomsCompleted = 0;
  for (let i = 0; i < currentRoomIndex; i++) {
    if (areAllRoomPuzzlesSolved(i, solvedPuzzles)) roomsCompleted++;
  }
  return {
    roomsCompleted,
    totalRooms: TOTAL_ROOMS,
    puzzlesSolved: getSolvedPuzzleCount(solvedPuzzles),
    totalPuzzles: getTotalPuzzleCount(),
  };
}

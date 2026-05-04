import {
  ROOMS,
  TOTAL_ROOMS,
  DIFFICULTY_PROGRESSION,
} from '../../../shared/types/gameFlow.js';
import type {
  RoomConfig,
  RoomDifficultyVariant,
  DifficultyLevel,
  NarrativeBeat,
  DifficultyProgression,
} from '../../../shared/types/gameFlow.js';

export { ROOMS, TOTAL_ROOMS, DIFFICULTY_PROGRESSION };
export type { RoomConfig, RoomDifficultyVariant, DifficultyLevel, NarrativeBeat, DifficultyProgression };

// Narrative arc mapping: which narrative beat applies to each room index
const BEAT_ORDER: NarrativeBeat[] = ['introduction', 'discovery', 'tension', 'climax', 'resolution'];

export function getNarrativeBeat(roomIndex: number): NarrativeBeat {
  const room = ROOMS[roomIndex];
  if (room) return room.narrativeBeat;
  if (roomIndex >= 0 && roomIndex < BEAT_ORDER.length) return BEAT_ORDER[roomIndex]!;
  return 'introduction';
}

export function getTargetDuration(roomIndex: number): number {
  return ROOMS[roomIndex]?.targetDurationMinutes ?? 15;
}

export function getTotalTargetDuration(): number {
  return ROOMS.reduce((sum, room) => sum + room.targetDurationMinutes, 0);
}

export function selectDifficultyVariant(
  roomIndex: number,
  performanceScore: number,
): RoomDifficultyVariant {
  const room = ROOMS[roomIndex];
  if (!room) return { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 };

  // performanceScore: 0-10, higher = better performance
  if (performanceScore >= 7) return room.difficultyVariants[2]; // hard
  if (performanceScore >= 4) return room.difficultyVariants[1]; // medium
  return room.difficultyVariants[0]; // easy
}

export function calculatePerformanceScore(
  timeMs: number,
  hintsUsed: number,
  wrongAttempts: number,
  targetDurationMinutes: number,
): number {
  const targetMs = targetDurationMinutes * 60 * 1000;
  const timeRatio = timeMs / targetMs;

  // Speed component: 0-4 points
  let speedScore = 4;
  if (timeRatio > DIFFICULTY_PROGRESSION.slowThresholdMultiplier) speedScore = 1;
  else if (timeRatio > 1.0) speedScore = 2;
  else if (timeRatio > DIFFICULTY_PROGRESSION.speedBonusThreshold) speedScore = 3;

  // Hint component: 0-3 points
  let hintScore = 3;
  if (hintsUsed >= 4) hintScore = 0;
  else if (hintsUsed >= 2) hintScore = 1;
  else if (hintsUsed >= 1) hintScore = 2;

  // Accuracy component: 0-3 points
  let accuracyScore = 3;
  if (wrongAttempts >= 5) accuracyScore = 0;
  else if (wrongAttempts >= 3) accuracyScore = 1;
  else if (wrongAttempts >= 1) accuracyScore = 2;

  return Math.min(10, speedScore + hintScore + accuracyScore);
}

export function getRoomTheme(roomIndex: number): string {
  return ROOMS[roomIndex]?.theme ?? 'mystery';
}

export function getDifficultyForRoom(
  roomIndex: number,
  completedRoomSummaries: Array<{
    timeSpentMs: number;
    hintsUsed: number;
    wrongAttempts: number;
  }>,
): RoomDifficultyVariant {
  if (completedRoomSummaries.length === 0) {
    return ROOMS[0]?.difficultyVariants[0] ?? { level: 'easy', timeMultiplier: 1.0, hintAllowance: 4, puzzleComplexity: 1 };
  }

  const avgScore = completedRoomSummaries.reduce((sum, room) => {
    const targetDuration = getTargetDuration(
      Math.min(completedRoomSummaries.indexOf(room), TOTAL_ROOMS - 1),
    );
    return sum + calculatePerformanceScore(room.timeSpentMs, room.hintsUsed, room.wrongAttempts, targetDuration);
  }, 0) / completedRoomSummaries.length;

  return selectDifficultyVariant(roomIndex, avgScore);
}

export function getNarrativeArc(): Array<{ roomIndex: number; beat: NarrativeBeat; description: string }> {
  return ROOMS.map((room, index) => ({
    roomIndex: index,
    beat: room.narrativeBeat,
    description: NARRATIVE_BEAT_DESCRIPTIONS[room.narrativeBeat],
  }));
}

const NARRATIVE_BEAT_DESCRIPTIONS: Record<NarrativeBeat, string> = {
  introduction: 'The world draws you in with mystery and wonder. Learn the mechanics, feel the atmosphere, take your first steps together.',
  discovery: 'New challenges reveal themselves. Cooperation becomes essential as the puzzles grow more complex.',
  tension: 'Pressure mounts as the stakes rise. Memory and communication are tested under increasing difficulty.',
  climax: 'The deepest challenge yet. Navigation and trust are pushed to their limits in the shifting labyrinth.',
  resolution: 'Everything you have learned converges in a triumphant finale. The grand vault demands mastery of every skill.',
};

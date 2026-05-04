import { generateHint } from './aiService.js';
import type { Hint, HintUsage } from '../../../shared/types/hint.js';
import { isHintsEnabled } from '../config/ai.js';

const MAX_HINT_LEVEL = 3;
const COOLDOWN_MS = 30_000;
const RELATIONSHIP_POINTS = [5, 10, 15];

const hintUsageMap = new Map<string, HintUsage>();

function usageKey(roomId: string, puzzleId: string): string {
  return `${roomId}:${puzzleId}`;
}

export async function getHint(
  roomId: string,
  puzzleId: string,
  currentLevel: number,
): Promise<Hint> {
  const key = usageKey(roomId, puzzleId);
  const usage = hintUsageMap.get(key);

  if (usage) {
    const elapsed = Date.now() - usage.lastUsedAt;
    if (elapsed < COOLDOWN_MS) {
      return {
        text: '',
        level: usage.level,
        maxLevel: MAX_HINT_LEVEL,
        relationshipPointsCost: RELATIONSHIP_POINTS[usage.level] ?? 0,
        cooldownRemaining: Math.ceil((COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  if (currentLevel >= MAX_HINT_LEVEL) {
    return {
      text: 'You\'ve used all available hints for this puzzle.',
      level: MAX_HINT_LEVEL,
      maxLevel: MAX_HINT_LEVEL,
      relationshipPointsCost: 0,
      cooldownRemaining: 0,
    };
  }

  const nextLevel = currentLevel + 1;
  const cost = RELATIONSHIP_POINTS[nextLevel - 1] ?? 10;

  const levelDescriptions: Record<number, string> = {
    1: 'Look at the patterns more carefully...',
    2: 'Focus on the details that seem out of place.',
    3: 'Try combining the clues you have so far.',
  };

  let hintText: string;
  try {
    hintText = isHintsEnabled()
      ? await generateHint(puzzleId, {}, nextLevel)
      : levelDescriptions[nextLevel] ?? levelDescriptions[3]!;
  } catch {
    hintText = levelDescriptions[nextLevel] ?? levelDescriptions[3]!;
  }

  hintUsageMap.set(key, {
    level: nextLevel,
    lastUsedAt: Date.now(),
    totalHintsUsed: (usage?.totalHintsUsed ?? 0) + 1,
    relationshipPointsSpent: (usage?.relationshipPointsSpent ?? 0) + cost,
  });

  return {
    text: hintText,
    level: nextLevel,
    maxLevel: MAX_HINT_LEVEL,
    relationshipPointsCost: cost,
    cooldownRemaining: 0,
  };
}

export function getHintUsage(roomId: string, puzzleId: string): HintUsage | undefined {
  return hintUsageMap.get(usageKey(roomId, puzzleId));
}

export function clearHintsForRoom(roomId: string): void {
  for (const key of hintUsageMap.keys()) {
    if (key.startsWith(`${roomId}:`)) {
      hintUsageMap.delete(key);
    }
  }
}

export function getTotalHintsUsed(roomId: string): number {
  let total = 0;
  for (const [key, usage] of hintUsageMap.entries()) {
    if (key.startsWith(`${roomId}:`)) {
      total += usage.totalHintsUsed;
    }
  }
  return total;
}

export { COOLDOWN_MS, MAX_HINT_LEVEL, RELATIONSHIP_POINTS };

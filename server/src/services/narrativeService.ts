import {
  generateNarrative,
  generateDialogue,
} from './aiService.js';
import type { GameContext } from './aiTypes.js';
import type {
  RoomNarrative,
  PuzzleNarrative,
  CompletionNarrative,
  GameEvent,
} from '../../../shared/types/narrative.js';
import { isNarrativeEnabled } from '../config/ai.js';
import { TOTAL_ROOMS } from '../../../shared/types/gameFlow.js';

const NARRATIVE_ARC_POSITIONS = ['introduction', 'rising', 'climax', 'resolution'] as const;

function getArcPosition(roomIndex: number, totalRooms: number): string {
  if (totalRooms <= 1) return 'climax';
  const ratio = roomIndex / (totalRooms - 1);
  const idx = Math.min(Math.floor(ratio * NARRATIVE_ARC_POSITIONS.length), NARRATIVE_ARC_POSITIONS.length - 1);
  return NARRATIVE_ARC_POSITIONS[idx]!;
}

export async function generateRoomNarrative(
  roomIndex: number,
  theme: string,
  previousEvents: GameEvent[],
  context?: Partial<GameContext>,
): Promise<RoomNarrative> {
  const arcPosition = getArcPosition(roomIndex, TOTAL_ROOMS);
  const previousEventTexts = previousEvents.slice(-5).map((e) => `${e.type}: ${e.message}`).join('\n');

  const fullContext: GameContext = {
    roomName: theme,
    roomIndex,
    playerNames: context?.playerNames ?? ['Player 1', 'Player 2'],
    previousEvents: previousEvents.map((e) => ({ type: e.type, message: e.message, timestamp: e.timestamp })),
    puzzlesSolved: context?.puzzlesSolved ?? 0,
    totalPuzzles: context?.totalPuzzles ?? 9,
    elapsedTimeMs: context?.elapsedTimeMs ?? 0,
  };

  if (!isNarrativeEnabled()) {
    return getRoomFallback(roomIndex, theme);
  }

  try {
    const description = await generateNarrative(
      `Describe room ${roomIndex + 1} of ${TOTAL_ROOMS}, themed "${theme}". This is the "${arcPosition}" phase of the story arc. Previous events:\n${previousEventTexts || 'None yet.'}`,
      fullContext,
    );

    const entranceText = await generateNarrative(
      `Write the entrance narration for when players enter the "${theme}" room (room ${roomIndex + 1}/${TOTAL_ROOMS}, ${arcPosition} phase). Make it atmospheric and mysterious, 2-3 sentences.`,
      fullContext,
    );

    const ambientRaw = await generateNarrative(
      `Write 3 short ambient description snippets for a "${theme}" escape room. Each should be one sentence. Separate them with a pipe | character.`,
      fullContext,
    );
    const ambientDescriptions = ambientRaw.split('|').map((s) => s.trim()).filter(Boolean);

    const dialogueRaw = await generateDialogue(
      'Mysterious Voice',
      `Players enter the ${theme} room. Say something cryptic that hints at the puzzles within.`,
      previousEventTexts ? [previousEventTexts] : [],
    );
    const characterDialogue = [dialogueRaw];

    return {
      roomName: theme,
      description,
      entranceText,
      ambientDescriptions: ambientDescriptions.length >= 1
        ? ambientDescriptions
        : getFallbackAmbient(theme),
      characterDialogue,
    };
  } catch {
    return getRoomFallback(roomIndex, theme);
  }
}

export async function generatePuzzleNarrative(
  puzzleName: string,
  roomTheme: string,
): Promise<PuzzleNarrative> {
  const context: GameContext = {
    roomName: roomTheme,
    roomIndex: 0,
    playerNames: [],
    previousEvents: [],
    puzzlesSolved: 0,
    totalPuzzles: 9,
    elapsedTimeMs: 0,
  };

  if (!isNarrativeEnabled()) {
    return getPuzzleFallback(puzzleName, roomTheme);
  }

  try {
    const backstory = await generateNarrative(
      `Write a brief backstory (2-3 sentences) for a puzzle called "${puzzleName}" in a "${roomTheme}" escape room. Make it mysterious and tie it to the room theme.`,
      context,
    );

    const clueText = await generateNarrative(
      `Write a cryptic clue for the "${puzzleName}" puzzle. It should hint at the solution without giving it away. One sentence.`,
      context,
    );

    const successMessage = await generateNarrative(
      `Write a celebratory success message (1-2 sentences) for solving the "${puzzleName}" puzzle. Make it thematic to "${roomTheme}".`,
      context,
    );

    const hintFlavorRaw = await generateNarrative(
      `Write 3 flavor texts for hints about "${puzzleName}" in "${roomTheme}". Each is one sentence. Separate with pipe |. They should range from cryptic to nearly helpful.`,
      context,
    );
    const hintFlavorTexts = hintFlavorRaw.split('|').map((s) => s.trim()).filter(Boolean);

    return {
      backstory,
      clueText,
      successMessage,
      hintFlavorTexts: hintFlavorTexts.length >= 1 ? hintFlavorTexts : getFallbackHintFlavor(puzzleName),
    };
  } catch {
    return getPuzzleFallback(puzzleName, roomTheme);
  }
}

export async function generateCompletionNarrative(
  totalTime: number,
  puzzlesSolved: number,
  hintsUsed: number,
  playerNames: string[] = [],
): Promise<string> {
  const context: GameContext = {
    roomName: 'Victory',
    roomIndex: TOTAL_ROOMS - 1,
    playerNames,
    previousEvents: [],
    puzzlesSolved,
    totalPuzzles: puzzlesSolved,
    elapsedTimeMs: totalTime,
  };

  const timeSeconds = (totalTime / 1000).toFixed(1);
  const rating = totalTime < 300_000 ? 'exceptional' : totalTime < 540_000 ? 'impressive' : 'admirable';

  if (!isNarrativeEnabled()) {
    return getCompletionFallback(timeSeconds, puzzlesSolved, playerNames);
  }

  try {
    return await generateNarrative(
      `The players have completed the escape room in ${timeSeconds} seconds, solving ${puzzlesSolved} puzzles with ${hintsUsed} hints. Their performance was ${rating}. Write a personalized, celebratory victory message for ${playerNames.join(' and ') || 'our brave players'}. Mention their teamwork and ${rating} speed. 2-3 sentences.`,
      context,
    );
  } catch {
    return getCompletionFallback(timeSeconds, puzzlesSolved, playerNames);
  }
}

// --- Fallback content ---

function getFallbackAmbient(theme: string): string[] {
  const map: Record<string, string[]> = {
    'The Invitation': [
      'A wax seal glistens in the candlelight, its symbol unfamiliar yet alluring.',
      'The parchment crackles softly as you unfold it.',
      'Strange symbols dance at the edges of the page.',
    ],
    'The Workshop': [
      'Dust motes dance in shafts of light through cracked windows.',
      'Somewhere, an old clock ticks insistently.',
      'The smell of machine oil and sawdust fills the air.',
    ],
    'The Laboratory': [
      'Bubbling beakers cast eerie colored shadows on the walls.',
      'Screens flicker with indecipherable data streams.',
      'A hum of electricity resonates through the floor.',
    ],
    'The Labyrinth': [
      'Walls groan and shift, rearranging the maze around you.',
      'Distant dripping echoes through stone corridors.',
      'A cold breeze carries whispers from unseen passages.',
    ],
    'The Vault': [
      'The vault door groans under immense pressure.',
      'Security lights blink in hypnotic patterns.',
      'The glint of something precious catches your eye.',
    ],
  };
  return map[theme] ?? [
    'The air feels charged with anticipation.',
    'Strange sounds echo through the room.',
    'Light flickers across the walls.',
  ];
}

function getRoomFallback(roomIndex: number, theme: string): RoomNarrative {
  const roomNarratives: RoomNarrative[] = [
    {
      roomName: 'The Invitation',
      description: 'A mysterious letter arrives at your door, sealed with an ancient cipher. The elegant script hints at an adventure that awaits beyond the veil of the ordinary world...',
      entranceText: 'An envelope materializes before you, heavy with promise. The wax seal bears an insignia you have never seen, yet somehow recognize. Break the cipher within, and the journey begins.',
      ambientDescriptions: getFallbackAmbient('The Invitation'),
      characterDialogue: ['A whisper from the seal: "Every journey begins with a single decoded truth..."'],
    },
    {
      roomName: 'The Workshop',
      description: 'A dusty workshop filled with old machinery and half-finished contraptions. Mechanical devices guard the path forward, demanding both careful observation and precise communication...',
      entranceText: 'The heavy door creaks open to reveal a workshop frozen in time. Tools hang on the walls, each placed with deliberate precision. Something about this room feels like it was waiting for you.',
      ambientDescriptions: getFallbackAmbient('The Workshop'),
      characterDialogue: ['A whisper echoes: "Every tool has its purpose. Look closely..."'],
    },
    {
      roomName: 'The Laboratory',
      description: 'A sterile laboratory glows with chemical vials and tangled wires. Experimental technology hums with dormant power, waiting for the right sequence to reactivate...',
      entranceText: 'Fluorescent lights hum overhead as you step into the laboratory. Banks of equipment line the walls, their screens displaying cryptic readouts. You sense this room demands cooperation.',
      ambientDescriptions: getFallbackAmbient('The Laboratory'),
      characterDialogue: ['A synthesized voice intones: "Two minds are better than one. Prove it."'],
    },
    {
      roomName: 'The Labyrinth',
      description: 'The walls shift and rearrange in an ancient maze. Fog obscures the path ahead, and only by combining your unique perspectives can you navigate the passages within...',
      entranceText: 'Stone walls tower around you, ancient and alive with shifting mechanisms. The labyrinth breathes, rearranging itself. One of you must see the whole; the other must walk the path.',
      ambientDescriptions: getFallbackAmbient('The Labyrinth'),
      characterDialogue: ['An echo from the depths: "See the whole, walk the part. Trust is the compass."'],
    },
    {
      roomName: 'The Vault',
      description: 'A grand vault door looms before you, sealed by the ultimate lock combining every mechanism you have encountered. This final challenge tests all the skills and trust you have built together...',
      entranceText: 'The grand vault door towers above you, its surface covered in glowing sigils that pulse with ancient power. Every puzzle type you have mastered is represented here. This is the final test.',
      ambientDescriptions: getFallbackAmbient('The Vault'),
      characterDialogue: ['An ancient mechanism rumbles: "Only those who remember, navigate, and connect shall pass through the final gate."'],
    },
  ];
  return roomNarratives[roomIndex] ?? roomNarratives[0]!;
}

function getPuzzleFallback(puzzleName: string, roomTheme: string): PuzzleNarrative {
  const map: Record<string, PuzzleNarrative> = {
    'cipher-lock': {
      backstory: 'The old locksmith who once worked here left behind a cipher — a code that only the observant could crack.',
      clueText: 'The numbers hide in plain sight, scattered across the room like breadcrumbs.',
      successMessage: 'The lock clicks open! The cipher yields to your keen eye.',
      hintFlavorTexts: getFallbackHintFlavor('cipher-lock'),
    },
    'split-screen': {
      backstory: 'Two screens, two perspectives, one truth. The previous team split their knowledge — now you must reunite it.',
      clueText: 'Each screen shows only half the answer. Share what you see.',
      successMessage: 'With shared knowledge, the screen glows green! Cooperation conquers all.',
      hintFlavorTexts: getFallbackHintFlavor('split-screen'),
    },
    'wire-connection': {
      backstory: 'The lab\'s power grid was sabotaged — wires pulled and scrambled. Restore the connections to reactivate the door.',
      clueText: 'Colors and symbols guide the way. Match them correctly to complete the circuit.',
      successMessage: 'Current flows! The door mechanism hums back to life.',
      hintFlavorTexts: getFallbackHintFlavor('wire-connection'),
    },
    'sequence-memory': {
      backstory: 'The vault\'s ancient memory seals require perfect recall. Those who came before left the pattern for the worthy.',
      clueText: 'Watch carefully, remember precisely. The sequence holds the key.',
      successMessage: 'The seals glow in unison! Your memory is flawless.',
      hintFlavorTexts: getFallbackHintFlavor('sequence-memory'),
    },
    'map-navigator': {
      backstory: 'A labyrinth lies between you and the vault\'s inner chamber. The map shows the way — if you can read it together.',
      clueText: 'One sees the path, the other walks it. Guide each other through.',
      successMessage: 'You navigate the labyrinth together! The path is clear.',
      hintFlavorTexts: getFallbackHintFlavor('map-navigator'),
    },
  };
  return map[puzzleName] ?? {
    backstory: `A mysterious puzzle awaits in the ${roomTheme}.`,
    clueText: 'Look closely at what surrounds you.',
    successMessage: 'Puzzle solved! You make a fine team.',
    hintFlavorTexts: ['Observe carefully...', 'Look for patterns.', 'Try combining what you\'ve found.'],
  };
}

function getFallbackHintFlavor(puzzleName: string): string[] {
  const map: Record<string, string[]> = {
    'cipher-lock': [
      'The answer is written all around you — if you know how to read it.',
      'Numbers and letters share a secret language here.',
      'Count what you see. The first digit is closer than you think.',
    ],
    'split-screen': [
      'Your partner sees something you don\'t — and vice versa.',
      'Describe exactly what you observe. Details matter.',
      'The answer combines both screens. Share everything.',
    ],
    'wire-connection': [
      'Colors tell a story of connections.',
      'Follow the symbols — each wire has a match.',
      'Start from the source and trace each path.',
    ],
    'sequence-memory': [
      'The pattern reveals itself only to those who watch closely.',
      'Count the steps. The sequence builds on itself.',
      'Repetition is key. Watch for the anchor point.',
    ],
    'map-navigator': [
      'One mind sees the whole, the other walks the path.',
      'Give clear directions — left, right, up, down.',
      'The shortest path isn\'t always the safest.',
    ],
  };
  return map[puzzleName] ?? [
    'Look at the patterns more carefully...',
    'Focus on the details that seem out of place.',
    'Try combining the clues you have so far.',
  ];
}

function getCompletionFallback(timeSeconds: string, puzzlesSolved: number, playerNames: string[]): string {
  const names = playerNames.length > 0 ? playerNames.join(' and ') : 'our brave players';
  return `In ${timeSeconds} seconds, ${names} conquered all ${puzzlesSolved} puzzles across five rooms and escaped to freedom. Your teamwork was the key that no lock could hold. Until the next adventure!`;
}

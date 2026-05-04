export type PuzzleType =
  | 'cipher-lock'
  | 'split-screen'
  | 'wire-connection'
  | 'sequence-memory'
  | 'map-navigator';

const PHRASES: Record<PuzzleType, string[]> = {
  'cipher-lock': [
    'I found a clue!',
    'Try rotating the dial',
    'That combination didn\'t work',
    'I see a pattern!',
    'Let me check the clues again',
    'We\'re close, keep trying!',
  ],
  'split-screen': [
    'I see a symbol on my side',
    'Cell at row __, col __ is __',
    'Can you describe your side?',
    'I placed a cell, check yours',
    'The grid is almost complete!',
    'That cell doesn\'t match',
  ],
  'wire-connection': [
    'The __ wire is on my side',
    'I see red, blue, and green',
    'Wire __ connects to color __',
    'Try connecting __ to __',
    'That connection looks wrong',
    'All wires are connected!',
  ],
  'sequence-memory': [
    'I see the sequence!',
    'First symbol is __',
    'The order is: __',
    'Phase 1: __',
    'Phase 2: __',
    'Let me show you the symbols',
  ],
  'map-navigator': [
    'There\'s an obstacle to the __',
    'Move __ steps',
    'The treasure is near __',
    'Watch out for the wall!',
    'You\'re going the right way',
    'Almost there, __ more steps!',
  ],
};

export function getQuickPhrases(puzzleType: string | null): string[] {
  if (!puzzleType) return [];
  return PHRASES[puzzleType as PuzzleType] ?? [];
}

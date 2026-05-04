import { PuzzleBase } from './puzzleBase.js';
import type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
import { registerPuzzle } from './puzzleRegistry.js';

interface CipherLockPuzzleData extends PuzzleData {
  encodedMessage: string;
  cipherKey: Record<string, number>;
  currentDigits: number[];
  hintLevel: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class CipherLockPuzzle extends PuzzleBase {
  readonly id = 'cipher-lock';
  readonly type = 'cipher-lock';
  readonly name = 'Cipher Lock';
  readonly description = 'Decode the encrypted message using a cipher key and enter the correct code into the lock.';

  protected onGenerate(playerIds: string[], _seed?: string): CipherLockPuzzleData {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
    const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const cipherKey: Record<string, number> = {};
    letters.forEach((letter, i) => {
      cipherKey[letter] = digits[i];
    });

    const messageLetters: string[] = [];
    const availableLetters = [...letters];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * availableLetters.length);
      messageLetters.push(availableLetters.splice(idx, 1)[0]);
    }

    const encodedMessage = messageLetters.join('-');
    this.solution = messageLetters.map((l) => cipherKey[l]);

    const roles: Record<string, PlayerRole> = {};
    if (playerIds.length >= 2) {
      roles[playerIds[0]] = 'decoder';
      roles[playerIds[1]] = 'lock-holder';
    }

    return {
      encodedMessage,
      cipherKey,
      currentDigits: [0, 0, 0, 0],
      roles,
      hintLevel: 0,
    };
  }

  protected onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult {
    if (action.type === 'update-digits') {
      this.state.currentDigits = action.data.digits;
      return { success: true, updatedState: { currentDigits: action.data.digits } };
    }

    if (action.type === 'submit-code') {
      const submitted = action.data.digits as number[];
      const correctCode = this.solution as number[];
      this.state.currentDigits = submitted;

      if (
        submitted.length === correctCode.length &&
        submitted.every((d, i) => d === correctCode[i])
      ) {
        return { success: true, solved: true };
      }
      return { success: false, message: 'Incorrect code', updatedState: { currentDigits: submitted } };
    }

    if (action.type === 'request-hint') {
      const hintLevel = Math.min(((this.state.hintLevel as number) || 0) + 1, 4);
      this.state.hintLevel = hintLevel;
      return { success: true, updatedState: { hintLevel } };
    }

    return { success: false, message: `Unknown action: ${action.type}` };
  }

  getHint(hintLevel: number): string {
    const encodedMessage = this.state.encodedMessage as string;
    const cipherKey = this.state.cipherKey as Record<string, number>;
    const letters = encodedMessage.split('-');
    const decoded = letters.map((l) => cipherKey[l]);

    if (hintLevel === 0) {
      return 'Look at the cipher key carefully. Each letter maps to a single digit.';
    }
    if (hintLevel === 1) {
      return `The first symbol "${letters[0]}" decodes to the digit ${decoded[0]}. Now figure out the rest!`;
    }
    if (hintLevel === 2) {
      return `The first two symbols decode to: ${decoded[0]}-${decoded[1]}. Keep going!`;
    }
    return `The full code is: ${decoded.join('-')}. Enter it in the lock!`;
  }
}

registerPuzzle(CipherLockPuzzle);

// Legacy exports for backward compatibility during migration
export type { CipherLockPuzzleData };
export { shuffle };

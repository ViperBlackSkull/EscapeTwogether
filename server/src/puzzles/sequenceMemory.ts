import { PuzzleBase } from './puzzleBase.js';
import type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
import { registerPuzzle } from './puzzleRegistry.js';

interface SequenceMemoryData extends PuzzleData {
  sequence: { symbol: string; color: string }[];
  phaseOneLength: number;
  playerARole: string;
  playerBRole: string;
  revealedPositions: number[];
  playerBSequence: (string | null)[];
  phase: 'showing' | 'relay' | 'input' | 'solved';
  hintLevel: number;
  showStartTime: number | null;
  communicationLog: { sender: string; message: string }[];
}

const SYMBOLS = ['★', '◆', '▲', '●', '■', '♣', '♥', '✦'];
const SYMBOL_COLORS = [
  '#e76f51', '#3b82f6', '#2a9d8f', '#e9c46a',
  '#a855f7', '#f4a261', '#ec4899', '#6ee7b7',
];

function randomFrom<T>(arr: T[], count: number, rng: () => number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function seededRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
}

export class SequenceMemoryPuzzle extends PuzzleBase {
  readonly id = 'sequence-memory';
  readonly type = 'sequence-memory';
  readonly name = 'Sequence Memory';
  readonly description = 'One player memorizes a flashing sequence of symbols and relays it to their partner, who must recreate it.';

  protected onGenerate(playerIds: string[], seed?: string): SequenceMemoryData {
    const rng = seed ? seededRng(seed) : Math.random;
    const length = 5 + Math.floor(rng() * 3); // 5-7 symbols
    const chosenSymbols = randomFrom(SYMBOLS, length, rng);
    const chosenColors = randomFrom(SYMBOL_COLORS, length, rng);

    const sequence = chosenSymbols.map((symbol, i) => ({
      symbol,
      color: chosenColors[i],
    }));

    const phaseOneLength = Math.max(3, Math.floor(length / 2));
    this.solution = sequence;

    const roles: Record<string, PlayerRole> = {};
    if (playerIds.length >= 2) {
      roles[playerIds[0]] = 'watcher';
      roles[playerIds[1]] = 'repeater';
    }

    const playerBSequence: (string | null)[] = new Array(length).fill(null);

    return {
      sequence,
      phaseOneLength,
      playerARole: 'watcher',
      playerBRole: 'repeater',
      revealedPositions: [],
      playerBSequence,
      phase: 'showing',
      hintLevel: 0,
      showStartTime: Date.now(),
      communicationLog: [],
      roles,
    };
  }

  protected onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult {
    if (action.type === 'start-relay') {
      if (role !== 'watcher') {
        return { success: false, message: 'Only the watcher can start the relay phase' };
      }
      const seqLen = (this.state.sequence as any[]).length;
      const phaseOneLen = this.state.phaseOneLength as number;
      const phaseOne = (this.state.sequence as any[]).slice(0, phaseOneLen);
      this.state.phase = 'relay';
      return {
        success: true,
        updatedState: {
          phase: 'relay',
          phaseOneSymbols: phaseOne.map((s: any) => ({ symbol: s.symbol, color: s.color })),
          totalLength: seqLen,
        },
      };
    }

    if (action.type === 'start-input') {
      if (role !== 'repeater') {
        return { success: false, message: 'Only the repeater can start entering the sequence' };
      }
      this.state.phase = 'input';
      return {
        success: true,
        updatedState: { phase: 'input' },
      };
    }

    if (action.type === 'send-relay-info') {
      const { message } = action.data;
      if (typeof message !== 'string' || !message.trim()) {
        return { success: false, message: 'Invalid message' };
      }
      const log = [...(this.state.communicationLog || []), { sender: role, message }];
      this.state.communicationLog = log;
      return {
        success: true,
        updatedState: { communicationLog: log },
      };
    }

    if (action.type === 'place-symbol') {
      if (role !== 'repeater') {
        return { success: false, message: 'Only the repeater can place symbols' };
      }
      const { position, symbol } = action.data;
      const seq = this.state.sequence as { symbol: string; color: string }[];
      if (typeof position !== 'number' || position < 0 || position >= seq.length) {
        return { success: false, message: 'Invalid position' };
      }
      if (typeof symbol !== 'string') {
        return { success: false, message: 'Invalid symbol' };
      }

      const playerBSeq = [...(this.state.playerBSequence as (string | null)[])];
      playerBSeq[position] = symbol;
      this.state.playerBSequence = playerBSeq;

      return {
        success: true,
        updatedState: { playerBSequence: playerBSeq },
      };
    }

    if (action.type === 'clear-symbol') {
      if (role !== 'repeater') {
        return { success: false, message: 'Only the repeater can clear symbols' };
      }
      const { position } = action.data;
      const seq = this.state.sequence as { symbol: string; color: string }[];
      if (typeof position !== 'number' || position < 0 || position >= seq.length) {
        return { success: false, message: 'Invalid position' };
      }

      const playerBSeq = [...(this.state.playerBSequence as (string | null)[])];
      playerBSeq[position] = null;
      this.state.playerBSequence = playerBSeq;

      return {
        success: true,
        updatedState: { playerBSequence: playerBSeq },
      };
    }

    if (action.type === 'submit-sequence') {
      if (role !== 'repeater') {
        return { success: false, message: 'Only the repeater can submit the sequence' };
      }

      const playerBSeq = this.state.playerBSequence as (string | null)[];
      const solution = this.solution as { symbol: string; color: string }[];

      const allFilled = playerBSeq.every((s) => s !== null);
      if (!allFilled) {
        return { success: false, message: 'Fill all sequence slots before submitting!' };
      }

      let correct = 0;
      for (let i = 0; i < solution.length; i++) {
        if (playerBSeq[i] === solution[i].symbol && solution[i].symbol) {
          correct++;
        }
      }

      if (correct === solution.length) {
        return { success: true, solved: true };
      }

      const wrongPositions: number[] = [];
      for (let i = 0; i < solution.length; i++) {
        if (playerBSeq[i] !== solution[i].symbol) {
          wrongPositions.push(i + 1);
        }
      }

      return {
        success: false,
        message: `${correct}/${solution.length} symbols are correct. Positions ${wrongPositions.join(', ')} are wrong.`,
        updatedState: {},
      };
    }

    if (action.type === 'request-hint') {
      const seq = this.state.sequence as { symbol: string; color: string }[];
      const revealed = [...(this.state.revealedPositions as number[])];
      const unrevealed = seq
        .map((_, i) => i)
        .filter((i) => !revealed.includes(i));

      if (unrevealed.length === 0) {
        return { success: false, message: 'All positions already revealed!' };
      }

      const hintIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      revealed.push(hintIdx);
      this.state.revealedPositions = revealed;
      this.state.hintLevel = ((this.state.hintLevel as number) || 0) + 1;

      return {
        success: true,
        updatedState: {
          revealedPositions: revealed,
          hintLevel: this.state.hintLevel,
          revealedHint: { position: hintIdx, symbol: seq[hintIdx].symbol },
        },
      };
    }

    return { success: false, message: `Unknown action: ${action.type}` };
  }

  getHint(hintLevel: number): string {
    const seq = this.state.sequence as { symbol: string; color: string }[];
    if (hintLevel === 0) {
      return 'The watcher sees a sequence of symbols flash briefly. Memorize them and tell your partner the order. The repeater must recreate the sequence.';
    }
    if (hintLevel === 1) {
      return `The first symbol in the sequence is ${seq[0].symbol}.`;
    }
    const randomIdx = Math.min(hintLevel, seq.length - 1);
    return `Position ${randomIdx + 1} in the sequence is ${seq[randomIdx].symbol}.`;
  }
}

registerPuzzle(SequenceMemoryPuzzle);

export type { SequenceMemoryData };

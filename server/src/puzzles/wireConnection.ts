import { PuzzleBase } from './puzzleBase.js';
import type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
import { registerPuzzle } from './puzzleRegistry.js';

interface WireMapping {
  color: string;
  outputIndex: number;
}

interface WireConnectionData extends PuzzleData {
  wires: WireMapping[];
  playerAColors: string[];
  playerBOutputs: number[];
  connections: Record<number, string | null>;
  communicationLog: { sender: string; message: string }[];
  hintLevel: number;
}

const WIRE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const COLOR_HEX: Record<string, string> = {
  red: '#e76f51',
  blue: '#3b82f6',
  green: '#2a9d8f',
  yellow: '#e9c46a',
  purple: '#a855f7',
  orange: '#f4a261',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class WireConnectionPuzzle extends PuzzleBase {
  readonly id = 'wire-connection';
  readonly type = 'wire-connection';
  readonly name = 'Wire Connection';
  readonly description = 'One player sees colored wires, the other sees numbered outputs. Communicate to connect them correctly.';

  protected onGenerate(playerIds: string[], _seed?: string): WireConnectionData {
    const shuffledOutputs = shuffle([1, 2, 3, 4, 5, 6]);
    const shuffledColors = shuffle([...WIRE_COLORS]);

    const wires: WireMapping[] = shuffledColors.map((color, i) => ({
      color,
      outputIndex: shuffledOutputs[i],
    }));

    this.solution = wires;

    const roles: Record<string, PlayerRole> = {};
    if (playerIds.length >= 2) {
      roles[playerIds[0]] = 'player-a';
      roles[playerIds[1]] = 'player-b';
    }

    const connections: Record<number, string | null> = {};
    for (let i = 1; i <= 6; i++) {
      connections[i] = null;
    }

    return {
      wires,
      playerAColors: shuffledColors,
      playerBOutputs: shuffledOutputs,
      connections,
      communicationLog: [],
      roles,
      hintLevel: 0,
    };
  }

  protected onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult {
    if (action.type === 'send-color-info') {
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

    if (action.type === 'connect-wire') {
      if (role !== 'player-b') {
        return { success: false, message: 'Only the output operator can connect wires' };
      }

      const { outputIndex, color } = action.data;
      if (typeof outputIndex !== 'number' || typeof color !== 'string') {
        return { success: false, message: 'Invalid connection data' };
      }

      if (outputIndex < 1 || outputIndex > 6) {
        return { success: false, message: 'Output index must be 1-6' };
      }

      const connections = { ...(this.state.connections as Record<number, string | null>) };

      for (const key of Object.keys(connections)) {
        if (connections[Number(key)] === color) {
          connections[Number(key)] = null;
        }
      }

      connections[outputIndex] = color;
      this.state.connections = connections;

      return {
        success: true,
        updatedState: { connections },
      };
    }

    if (action.type === 'disconnect-wire') {
      if (role !== 'player-b') {
        return { success: false, message: 'Only the output operator can disconnect wires' };
      }

      const { outputIndex } = action.data;
      if (typeof outputIndex !== 'number') {
        return { success: false, message: 'Invalid output index' };
      }

      const connections = { ...(this.state.connections as Record<number, string | null>) };
      connections[outputIndex] = null;
      this.state.connections = connections;

      return {
        success: true,
        updatedState: { connections },
      };
    }

    if (action.type === 'check-connections') {
      const connections = this.state.connections as Record<number, string | null>;
      const wires = this.solution as WireMapping[];

      let allConnected = true;
      for (let i = 1; i <= 6; i++) {
        if (!connections[i]) {
          allConnected = false;
          break;
        }
      }

      if (!allConnected) {
        return {
          success: false,
          message: 'Connect all 6 wires before checking!',
          updatedState: {},
        };
      }

      let correct = 0;
      for (const wire of wires) {
        if (connections[wire.outputIndex] === wire.color) {
          correct++;
        }
      }

      if (correct === 6) {
        return { success: true, solved: true };
      }

      return {
        success: false,
        message: `${correct}/6 wires are connected correctly. Keep trying!`,
        updatedState: {},
      };
    }

    if (action.type === 'request-hint') {
      const hintLevel = Math.min(((this.state.hintLevel as number) || 0) + 1, 4);
      this.state.hintLevel = hintLevel;
      return { success: true, updatedState: { hintLevel } };
    }

    return { success: false, message: `Unknown action: ${action.type}` };
  }

  getHint(hintLevel: number): string {
    const wires = this.solution as WireMapping[];
    if (hintLevel === 0) {
      return 'Player A should describe each wire color to Player B. Player B connects them to the correct numbered outputs.';
    }
    if (hintLevel === 1) {
      const wire = wires[0];
      return `The first wire on the left is ${wire.color}. It connects to output #${wire.outputIndex}.`;
    }
    if (hintLevel === 2) {
      const wire = wires[3];
      return `The fourth wire is ${wire.color}. It connects to output #${wire.outputIndex}.`;
    }
    const randomWire = wires[Math.floor(Math.random() * wires.length)];
    return `The ${randomWire.color} wire connects to output #${randomWire.outputIndex}.`;
  }
}

registerPuzzle(WireConnectionPuzzle);

export type { WireConnectionData, WireMapping };
export { COLOR_HEX };

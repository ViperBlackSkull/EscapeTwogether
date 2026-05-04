import { PuzzleBase } from './puzzleBase.js';
import type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
import { registerPuzzle } from './puzzleRegistry.js';

interface GridCell {
  symbol: string;
  color: string;
}

interface SplitScreenData extends PuzzleData {
  fullGrid: GridCell[][];
  playerAView: (GridCell | null)[][];
  playerBView: (GridCell | null)[][];
  playerAPlacements: (GridCell | null)[][];
  playerBPlacements: (GridCell | null)[][];
  communicationLog: { sender: string; row: number; col: number; cell: GridCell }[];
  hintLevel: number;
}

const SYMBOLS = ['★', '◆', '▲', '●', '■', '♣', '♥', '✦'];
const COLORS = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#a855f7', '#3b82f6', '#ef4444'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < 4; c++) {
      row.push({
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    grid.push(row);
  }
  return grid;
}

function makeView(fullGrid: GridCell[][], side: 'left' | 'right'): (GridCell | null)[][] {
  return fullGrid.map((row) =>
    row.map((cell, col) => {
      if (side === 'left' && col < 2) return { ...cell };
      if (side === 'right' && col >= 2) return { ...cell };
      return null;
    })
  );
}

function emptyGrid(): (GridCell | null)[][] {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

function gridsMatch(a: (GridCell | null)[][], b: GridCell[][]): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const av = a[r][c];
      const bv = b[r][c];
      if (!av || !bv) return false;
      if (av.symbol !== bv.symbol || av.color !== bv.color) return false;
    }
  }
  return true;
}

export class SplitScreenPuzzle extends PuzzleBase {
  readonly id = 'split-screen';
  readonly type = 'split-screen';
  readonly name = 'Split Screen';
  readonly description = 'Each player sees only half of a 4x4 grid. Communicate to reconstruct the full board.';

  protected onGenerate(playerIds: string[], _seed?: string): SplitScreenData {
    const fullGrid = generateGrid();
    this.solution = fullGrid;

    const roles: Record<string, PlayerRole> = {};
    if (playerIds.length >= 2) {
      roles[playerIds[0]] = 'player-a';
      roles[playerIds[1]] = 'player-b';
    }

    return {
      fullGrid,
      playerAView: makeView(fullGrid, 'left'),
      playerBView: makeView(fullGrid, 'right'),
      playerAPlacements: emptyGrid(),
      playerBPlacements: emptyGrid(),
      communicationLog: [],
      roles,
      hintLevel: 0,
    };
  }

  protected onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult {
    if (action.type === 'send-cell') {
      const { row, col, cell } = action.data;
      if (typeof row !== 'number' || typeof col !== 'number' || !cell) {
        return { success: false, message: 'Invalid cell data' };
      }

      const log = [...(this.state.communicationLog || []), { sender: role, row, col, cell }];
      this.state.communicationLog = log;

      return {
        success: true,
        updatedState: { communicationLog: log },
      };
    }

    if (action.type === 'place-cell') {
      const { row, col, cell } = action.data;
      if (typeof row !== 'number' || typeof col !== 'number' || !cell) {
        return { success: false, message: 'Invalid placement data' };
      }

      const placementKey = role === 'player-a' ? 'playerAPlacements' : 'playerBPlacements';
      const placements = (this.state[placementKey] as (GridCell | null)[][]).map((r) => r.map((c) => (c ? { ...c } : null)));
      placements[row][col] = cell;
      this.state[placementKey] = placements;

      return {
        success: true,
        updatedState: { [placementKey]: placements },
      };
    }

    if (action.type === 'check-solution') {
      const aPlacements = this.state.playerAPlacements as (GridCell | null)[][];
      const bPlacements = this.state.playerBPlacements as (GridCell | null)[][];
      const fullGrid = this.solution as GridCell[][];

      // Merge placements: player-a fills left, player-b fills right
      const merged: (GridCell | null)[][] = aPlacements.map((row, r) =>
        row.map((cell, c) => {
          if (c < 2) return cell;
          return bPlacements[r][c];
        })
      );

      if (gridsMatch(merged, fullGrid)) {
        return { success: true, solved: true };
      }

      // Count how many cells are correct
      let correct = 0;
      let total = 16;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const placed = merged[r][c];
          const expected = fullGrid[r][c];
          if (placed && placed.symbol === expected.symbol && placed.color === expected.color) {
            correct++;
          }
        }
      }

      return {
        success: false,
        message: `Not quite right. ${correct}/${total} cells are correct.`,
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
    const fullGrid = this.solution as GridCell[][];
    if (hintLevel === 0) {
      return 'Tell your partner about the symbols and colors you see on your side. Work together to fill in the blanks.';
    }
    if (hintLevel === 1) {
      const cell = fullGrid[0][2];
      return `Top-right area: the cell at row 1, column 3 is a "${cell.symbol}" in ${cell.color}.`;
    }
    if (hintLevel === 2) {
      const cell = fullGrid[3][0];
      return `Bottom-left area: the cell at row 4, column 1 is a "${cell.symbol}" in ${cell.color}.`;
    }
    const r = Math.floor(Math.random() * 4);
    const c = Math.floor(Math.random() * 4);
    const cell = fullGrid[r][c];
    return `The cell at row ${r + 1}, column ${c + 1} is a "${cell.symbol}" in ${cell.color}.`;
  }
}

registerPuzzle(SplitScreenPuzzle);

export type { SplitScreenData, GridCell };

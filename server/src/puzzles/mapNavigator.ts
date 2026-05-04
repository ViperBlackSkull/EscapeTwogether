import { PuzzleBase } from './puzzleBase.js';
import type { PuzzleAction, ActionResult, PuzzleData, PlayerRole } from '../../../shared/types/puzzle.js';
import { registerPuzzle } from './puzzleRegistry.js';

interface MapCell {
  type: 'empty' | 'obstacle' | 'treasure' | 'start';
  label?: string;
}

interface Position {
  row: number;
  col: number;
}

interface MapNavigatorData extends PuzzleData {
  grid: MapCell[][];
  startPosition: Position;
  treasurePosition: Position;
  explorerPosition: Position;
  fogOfWar: boolean[][];
  directions: string[];
  penaltySeconds: number;
  moveHistory: string[];
  highlightedCells: Position[];
  communicationLog: { sender: string; message: string }[];
  phase: 'playing' | 'solved';
  hintLevel: number;
}

const GRID_SIZE = 8;
const OBSTACLE_COUNT = 12;
const DIRECTION_NAMES: Record<string, string> = {
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
};

const OBSTACLE_TYPES = ['wall', 'pit', 'boulder', 'thorns'];

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

function key(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function bfs(grid: MapCell[][], start: Position, end: Position): Position[] | null {
  const queue: Position[] = [start];
  const visited = new Set<string>([key(start)]);
  const parent = new Map<string, Position | null>();
  parent.set(key(start), null);

  const dirs: Position[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.row === end.row && current.col === end.col) {
      const path: Position[] = [];
      let k: string | null = key(current);
      while (k !== null) {
        const p = parent.get(k);
        if (p !== undefined) {
          path.unshift({ row: parseInt(k.split(',')[0]), col: parseInt(k.split(',')[1]) });
        }
        k = p ? key(p) : null;
      }
      return path;
    }

    for (const d of dirs) {
      const nr = current.row + d.row;
      const nc = current.col + d.col;
      const nk = `${nr},${nc}`;
      if (
        nr >= 0 && nr < GRID_SIZE &&
        nc >= 0 && nc < GRID_SIZE &&
        !visited.has(nk) &&
        grid[nr][nc].type !== 'obstacle'
      ) {
        visited.add(nk);
        parent.set(nk, current);
        queue.push({ row: nr, col: nc });
      }
    }
  }
  return null;
}

function generateDirections(path: Position[]): string[] {
  const directions: string[] = [];
  for (let i = 1; i < path.length; i++) {
    const dr = path[i].row - path[i - 1].row;
    const dc = path[i].col - path[i - 1].col;
    if (dr === -1) directions.push('Up');
    else if (dr === 1) directions.push('Down');
    else if (dc === -1) directions.push('Left');
    else if (dc === 1) directions.push('Right');
  }
  return directions;
}

function consolidateDirections(directions: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < directions.length) {
    const dir = directions[i];
    let count = 1;
    while (i + count < directions.length && directions[i + count] === dir) {
      count++;
    }
    result.push(`${dir} ${count}`);
    i += count;
  }
  return result;
}

export class MapNavigatorPuzzle extends PuzzleBase {
  readonly id = 'map-navigator';
  readonly type = 'map-navigator';
  readonly name = 'Map Navigator';
  readonly description = 'One player sees the map with obstacles and treasure; the other receives step-by-step directions. Navigate together to find the treasure!';

  protected onGenerate(playerIds: string[], seed?: string): MapNavigatorData {
    const rng = seed ? seededRng(seed + '-map') : Math.random;

    let grid: MapCell[][] = [];
    let start: Position = { row: 7, col: 0 };
    let treasure: Position = { row: 0, col: 7 };
    let path: Position[] | null = null;

    const startPositions: Position[] = [
      { row: 7, col: 0 }, { row: 7, col: 1 }, { row: 6, col: 0 },
    ];
    const treasurePositions: Position[] = [
      { row: 0, col: 7 }, { row: 0, col: 6 }, { row: 1, col: 7 },
    ];

    let attempts = 0;
    while (!path && attempts < 100) {
      attempts++;
      grid = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, (): MapCell => ({ type: 'empty' }))
      );

      start = startPositions[Math.floor(rng() * startPositions.length)];
      treasure = treasurePositions[Math.floor(rng() * treasurePositions.length)];

      grid[start.row][start.col] = { type: 'start', label: 'Start' };
      grid[treasure.row][treasure.col] = { type: 'treasure', label: 'Treasure' };

      const forbidden = new Set([key(start), key(treasure)]);
      let placed = 0;
      let obsAttempts = 0;
      while (placed < OBSTACLE_COUNT && obsAttempts < 200) {
        obsAttempts++;
        const r = Math.floor(rng() * GRID_SIZE);
        const c = Math.floor(rng() * GRID_SIZE);
        const k = `${r},${c}`;
        if (!forbidden.has(k) && grid[r][c].type === 'empty') {
          grid[r][c] = {
            type: 'obstacle',
            label: OBSTACLE_TYPES[Math.floor(rng() * OBSTACLE_TYPES.length)],
          };
          forbidden.add(k);
          placed++;
        }
      }

      path = bfs(grid, start, treasure);
    }

    if (!path || !grid || !start || !treasure) {
      grid = Array.from({ length: GRID_SIZE }, (_, r) =>
        Array.from({ length: GRID_SIZE }, (_, c): MapCell => {
          if (r === 7 && c === 0) return { type: 'start', label: 'Start' };
          if (r === 0 && c === 7) return { type: 'treasure', label: 'Treasure' };
          if (r === 3 && c === 3) return { type: 'obstacle', label: 'wall' };
          return { type: 'empty' };
        })
      );
      start = { row: 7, col: 0 };
      treasure = { row: 0, col: 7 };
      path = bfs(grid, start, treasure) || [start, treasure];
    }

    const rawDirections = generateDirections(path);
    const directions = consolidateDirections(rawDirections);

    const fogOfWar = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => false)
    );

    const revealAround = (pos: Position) => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = pos.row + dr;
          const nc = pos.col + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            fogOfWar[nr][nc] = true;
          }
        }
      }
    };
    revealAround(start);

    const roles: Record<string, PlayerRole> = {};
    if (playerIds.length >= 2) {
      roles[playerIds[0]] = 'guide';
      roles[playerIds[1]] = 'explorer';
    }

    return {
      grid,
      startPosition: start,
      treasurePosition: treasure,
      explorerPosition: start,
      fogOfWar,
      directions,
      penaltySeconds: 0,
      moveHistory: [],
      highlightedCells: [],
      communicationLog: [],
      phase: 'playing',
      hintLevel: 0,
      roles,
    };
  }

  protected onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult {
    if (this.state.phase === 'solved') {
      return { success: false, message: 'Puzzle already solved!' };
    }

    if (action.type === 'move') {
      if (role !== 'explorer') {
        return { success: false, message: 'Only the explorer can move!' };
      }
      const { direction } = action.data;
      if (!DIRECTION_NAMES[direction]) {
        return { success: false, message: `Invalid direction: ${direction}` };
      }

      const pos = this.state.explorerPosition as Position;
      let dr = 0, dc = 0;
      if (direction === 'up') dr = -1;
      else if (direction === 'down') dr = 1;
      else if (direction === 'left') dc = -1;
      else if (direction === 'right') dc = 1;

      const nr = pos.row + dr;
      const nc = pos.col + dc;

      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
        return { success: false, message: "Can't move outside the map!", updatedState: {} };
      }

      const grid = this.state.grid as MapCell[][];
      if (grid[nr][nc].type === 'obstacle') {
        const penalty = Math.min((this.state.penaltySeconds as number) + 30, 180);
        this.state.penaltySeconds = penalty;
        const label = grid[nr][nc].label || 'obstacle';
        return {
          success: false,
          message: `You hit a ${label}! +30 second penalty. Total penalty: ${penalty}s`,
          updatedState: { penaltySeconds: penalty },
        };
      }

      const newPos: Position = { row: nr, col: nc };
      this.state.explorerPosition = newPos;

      const fog = (this.state.fogOfWar as boolean[][]).map(row => [...row]);
      for (let ddr = -1; ddr <= 1; ddr++) {
        for (let ddc = -1; ddc <= 1; ddc++) {
          const fr = nr + ddr;
          const fc = nc + ddc;
          if (fr >= 0 && fr < GRID_SIZE && fc >= 0 && fc < GRID_SIZE) {
            fog[fr][fc] = true;
          }
        }
      }
      this.state.fogOfWar = fog;

      const history = [...(this.state.moveHistory as string[]), DIRECTION_NAMES[direction]];
      this.state.moveHistory = history;

      if (grid[nr][nc].type === 'treasure') {
        this.state.phase = 'solved';
        return {
          success: true,
          solved: true,
          updatedState: {
            explorerPosition: newPos,
            fogOfWar: fog,
            moveHistory: history,
            phase: 'solved',
          },
        };
      }

      return {
        success: true,
        updatedState: {
          explorerPosition: newPos,
          fogOfWar: fog,
          moveHistory: history,
        },
      };
    }

    if (action.type === 'highlight-cell') {
      if (role !== 'guide') {
        return { success: false, message: 'Only the guide can highlight cells!' };
      }
      const { row, col } = action.data;
      if (typeof row !== 'number' || typeof col !== 'number' ||
        row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return { success: false, message: 'Invalid cell position' };
      }

      const highlighted = [...(this.state.highlightedCells as Position[])];
      const idx = highlighted.findIndex(c => c.row === row && c.col === col);
      if (idx >= 0) {
        highlighted.splice(idx, 1);
      } else {
        if (highlighted.length >= 5) {
          return { success: false, message: 'Maximum 5 highlighted cells. Remove one first.' };
        }
        highlighted.push({ row, col });
      }
      this.state.highlightedCells = highlighted;

      return {
        success: true,
        updatedState: { highlightedCells: highlighted },
      };
    }

    if (action.type === 'send-message') {
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

    if (action.type === 'request-hint') {
      const grid = this.state.grid as MapCell[][];
      const explorerPos = this.state.explorerPosition as Position;
      const treasurePos = this.state.treasurePosition as Position;

      const hintPath = bfs(grid, explorerPos, treasurePos);
      if (!hintPath || hintPath.length < 2) {
        return { success: false, message: 'No hint available' };
      }

      const hl = ((this.state.hintLevel as number) || 0) + 1;
      this.state.hintLevel = hl;

      const firstStep = hintPath[1];
      let dirHint = '';
      const dr = firstStep.row - explorerPos.row;
      const dc = firstStep.col - explorerPos.col;
      if (dr === -1) dirHint = 'up';
      else if (dr === 1) dirHint = 'down';
      else if (dc === -1) dirHint = 'left';
      else if (dc === 1) dirHint = 'right';

      const dist = hintPath.length - 1;
      return {
        success: true,
        updatedState: { hintLevel: hl },
        message: `Hint ${hl}: Try moving ${dirHint}. The treasure is ${dist} steps away.`,
      };
    }

    return { success: false, message: `Unknown action: ${action.type}` };
  }

  getHint(hintLevel: number): string {
    const explorerPos = this.state.explorerPosition as Position;
    const treasurePos = this.state.treasurePosition as Position;
    const grid = this.state.grid as MapCell[][];

    if (hintLevel === 0) {
      return 'The Guide sees the full map with obstacles and the treasure. The Explorer can only see nearby cells. Communicate to navigate safely!';
    }
    if (hintLevel === 1) {
      const dist = Math.abs(explorerPos.row - treasurePos.row) + Math.abs(explorerPos.col - treasurePos.col);
      return `The treasure is approximately ${dist} steps away (Manhattan distance).`;
    }

    const hintPath = bfs(grid, explorerPos, treasurePos);
    if (hintPath && hintPath.length >= 2) {
      const firstStep = hintPath[1];
      const dr = firstStep.row - explorerPos.row;
      const dc = firstStep.col - explorerPos.col;
      let dirHint = '';
      if (dr === -1) dirHint = 'up';
      else if (dr === 1) dirHint = 'down';
      else if (dc === -1) dirHint = 'left';
      else if (dc === 1) dirHint = 'right';
      return `Try moving ${dirHint} from your current position.`;
    }

    return 'Look for a clear path toward the treasure!';
  }
}

registerPuzzle(MapNavigatorPuzzle);

export type { MapNavigatorData, MapCell, Position };

import type { PuzzleAction, ActionResult, PuzzleData, PuzzleState, PlayerRole } from '../../../shared/types/puzzle.js';

export abstract class PuzzleBase {
  abstract readonly id: string;
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly description: string;

  protected state: Record<string, any> = {};
  protected solved = false;
  protected playerRoles: Record<string, PlayerRole> = {};
  protected solution: any = null;

  generate(playerIds: string[], seed?: string): PuzzleData {
    const puzzleData = this.onGenerate(playerIds, seed);
    this.playerRoles = puzzleData.roles;
    this.state = { ...puzzleData };
    return puzzleData;
  }

  protected abstract onGenerate(playerIds: string[], seed?: string): PuzzleData;

  validateAction(playerId: string, action: PuzzleAction): ActionResult {
    const role = this.playerRoles[playerId];
    if (!role) {
      return { success: false, message: 'Player has no role in this puzzle' };
    }
    return this.onValidateAction(role, action);
  }

  protected abstract onValidateAction(role: PlayerRole, action: PuzzleAction): ActionResult;

  getState(): PuzzleState {
    return {
      id: this.id,
      type: this.type,
      solved: this.solved,
      data: { ...this.state },
    };
  }

  abstract getHint(hintLevel: number): string;

  onSolve(): void {
    this.solved = true;
  }

  markSolved(): void {
    this.onSolve();
  }

  isSolved(): boolean {
    return this.solved;
  }

  getSolution(): any {
    return this.solution;
  }
}

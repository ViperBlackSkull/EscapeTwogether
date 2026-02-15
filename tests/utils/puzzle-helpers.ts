import type { Page } from '@playwright/test';

/**
 * Puzzle testing utilities for validating puzzle mechanics
 */

export interface PuzzleTestConfig {
  puzzleId: string;
  puzzleName: string;
  expectedSolution: any;
}

/**
 * Base class for puzzle test helpers
 */
export class PuzzleTestHelper {
  constructor(
    protected page: Page,
    protected config: PuzzleTestConfig
  ) {}

  /**
   * Navigate to a specific puzzle
   */
  async navigateToPuzzle(roomCode?: string) {
    const url = roomCode
      ? `/game/${roomCode}?puzzle=${this.config.puzzleId}`
      : `/?puzzle=${this.config.puzzleId}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if puzzle is visible and interactive
   */
  async isPuzzleVisible(): Promise<boolean> {
    const puzzleElement = this.page.locator(`[data-puzzle="${this.config.puzzleId}"], [data-testid="${this.config.puzzleId}"]`);
    return puzzleElement.isVisible();
  }

  /**
   * Reset puzzle to initial state
   */
  async resetPuzzle() {
    const resetButton = this.page.locator('[data-testid="reset-puzzle"], button:has-text("Reset")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  }

  /**
   * Check if puzzle is solved
   */
  async isPuzzleSolved(): Promise<boolean> {
    const solvedIndicator = this.page.locator('[data-puzzle-solved="true"], .puzzle-solved, [data-testid="puzzle-complete"]');
    return solvedIndicator.isVisible();
  }

  /**
   * Submit current puzzle state
   */
  async submitPuzzle() {
    const submitButton = this.page.locator('[data-testid="submit-puzzle"], button:has-text("Submit"), button:has-text("Check")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  }
}

/**
 * Drag and drop helper for puzzle pieces
 */
export async function dragAndDrop(page: Page, sourceSelector: string, targetSelector: string) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);

  await source.hover();
  await page.mouse.down();
  await target.hover();
  await page.mouse.up();
}

/**
 * Click sequence helper for pattern puzzles
 */
export async function clickSequence(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    await page.click(selector);
    await page.waitForTimeout(100);
  }
}

/**
 * Input text helper for cipher puzzles
 */
export async function inputText(page: Page, text: string, inputSelector: string = 'input[type="text"]') {
  const input = page.locator(inputSelector);
  await input.fill(text);
}

/**
 * Wait for puzzle animation to complete
 */
export async function waitForPuzzleAnimation(page: Page, timeout = 2000) {
  await page.waitForTimeout(timeout);
}

/**
 * Verify puzzle state matches expected
 */
export async function verifyPuzzleState(page: Page, puzzleId: string, expectedState: any): Promise<boolean> {
  const currentState = await page.evaluate((id) => {
    const puzzleElement = document.querySelector(`[data-puzzle="${id}"]`);
    if (puzzleElement) {
      return (puzzleElement as any).__puzzleState;
    }
    return null;
  }, puzzleId);

  return JSON.stringify(currentState) === JSON.stringify(expectedState);
}

/**
 * Get all interactive elements in a puzzle
 */
export async function getInteractiveElements(page: Page, puzzleId: string): Promise<string[]> {
  return page.evaluate((id) => {
    const puzzleElement = document.querySelector(`[data-puzzle="${id}"]`);
    if (!puzzleElement) return [];

    const interactives = puzzleElement.querySelectorAll('button, input, [role="button"], [draggable="true"]');
    return Array.from(interactives).map((el, index) => {
      if (el.id) return `#${el.id}`;
      if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
      return `${el.tagName.toLowerCase()}:nth-child(${index + 1})`;
    });
  }, puzzleId);
}

/**
 * Screenshot helper for visual regression testing
 */
export async function takePuzzleScreenshot(page: Page, puzzleId: string, state: string) {
  const puzzleElement = page.locator(`[data-puzzle="${puzzleId}"], [data-testid="${puzzleId}"]`);
  if (await puzzleElement.isVisible()) {
    await puzzleElement.screenshot({
      path: `tests/screenshots/${puzzleId}-${state}.png`
    });
  } else {
    await page.screenshot({
      path: `tests/screenshots/${puzzleId}-${state}-full.png`
    });
  }
}

/**
 * Create a test harness for validating puzzle solvability
 */
export class PuzzleValidator {
  constructor(private page: Page) {}

  /**
   * Run a full solve test on a puzzle
   */
  async validatePuzzleSolvability(config: PuzzleTestConfig, solveSteps: (page: Page) => Promise<void>): Promise<{
    solvable: boolean;
    time: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const helper = new PuzzleTestHelper(this.page, config);
      await helper.navigateToPuzzle();

      if (!(await helper.isPuzzleVisible())) {
        return {
          solvable: false,
          time: 0,
          error: 'Puzzle not visible'
        };
      }

      await helper.resetPuzzle();

      // Execute solve steps
      await solveSteps(this.page);

      // Check if solved
      const isSolved = await helper.isPuzzleSolved();

      return {
        solvable: isSolved,
        time: Date.now() - startTime
      };
    } catch (error) {
      return {
        solvable: false,
        time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

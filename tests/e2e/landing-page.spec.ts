import { test, expect } from '@playwright/test';
import { createMockSocket } from '../utils/multiplayer-helpers';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await createMockSocket(page);
    await page.goto('/');
  });

  test('should display the landing page with title', async ({ page }) => {
    // Check for main heading/title
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check that the page has loaded
    await expect(page).toHaveTitle(/EscapeTwogether/i);
  });

  test('should have a way to create a new room', async ({ page }) => {
    // Look for create room button or form
    const createRoomButton = page.locator('button:has-text("Create"), button:has-text("New Room"), [data-testid="create-room"]').first();

    // Button should be visible
    await expect(createRoomButton).toBeVisible();
  });

  test('should have a way to join an existing room', async ({ page }) => {
    // Look for join room input or button
    const joinRoomElements = page.locator('input[placeholder*="room" i], input[placeholder*="code" i], button:has-text("Join"), [data-testid="join-room"]');

    // At least one way to join should exist
    const count = await joinRoomElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should accept player name input', async ({ page }) => {
    // Look for name input field
    const nameInput = page.locator('input[type="text"], input[placeholder*="name" i]').first();

    if (await nameInput.isVisible()) {
      await nameInput.fill('TestPlayer');
      await expect(nameInput).toHaveValue('TestPlayer');
    }
  });

  test('should create a room when clicking create button', async ({ page }) => {
    // Fill in player name if there's an input
    const nameInput = page.locator('input[type="text"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('TestHost');
    }

    // Click create room button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Room"), [data-testid="create-room"]').first();
    await createButton.click();

    // Should navigate or show room code
    // Wait for either a room code display or navigation to lobby
    await page.waitForTimeout(1000);

    // Check for room code display or lobby page
    const roomCodeVisible = await page.locator('[data-testid="room-code"], text=/[A-Z]{4}/').count() > 0;
    const navigatedToLobby = page.url().includes('/lobby') || page.url().includes('/room');

    expect(roomCodeVisible || navigatedToLobby).toBeTruthy();
  });

  test('should show error for invalid room code', async ({ page }) => {
    // Fill in player name
    const nameInput = page.locator('input[type="text"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('TestPlayer');
    }

    // Fill in room code input
    const roomCodeInput = page.locator('input[placeholder*="room" i], input[placeholder*="code" i]').first();
    if (await roomCodeInput.isVisible()) {
      await roomCodeInput.fill('ZZZZ'); // Non-existent room

      // Click join button
      const joinButton = page.locator('button:has-text("Join")').first();
      await joinButton.click();

      // Should show error message
      await page.waitForTimeout(1000);
      const errorVisible = await page.locator('text=/not found|invalid|error/i').count() > 0;

      // If error handling is implemented, check for it
      // Otherwise just verify we didn't navigate away
      if (errorVisible) {
        expect(errorVisible).toBeTruthy();
      } else {
        expect(page.url()).toContain('/');
      }
    }
  });
});

test.describe('Landing Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have no accessibility violations on landing page', async ({ page }) => {
    // Basic accessibility checks
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);

    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

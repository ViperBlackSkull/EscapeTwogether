# EscapeTwogether Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the EscapeTwogether multiplayer escape room game. The tests are organized into E2E (End-to-End) tests using Playwright and unit tests using Vitest.

## Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── landing-page.spec.ts      # Landing page functionality
│   ├── chat.spec.ts              # Chat system tests
│   ├── puzzles.spec.ts           # Puzzle interaction tests
│   ├── multiplayer.spec.ts       # Multiplayer flow tests
│   ├── two-player-gameplay.spec.ts # Complete two-player flow
│   ├── visual-validation.spec.ts # Visual regression tests
│   ├── puzzle-sync.spec.ts       # NEW: State synchronization
│   └── reconnection.spec.ts      # NEW: Reconnection handling
├── unit/                         # Vitest unit tests
│   ├── puzzle-logic/             # Puzzle logic tests
│   │   ├── torn-photographs.test.ts
│   │   ├── clock-face.test.ts
│   │   └── gear-alignment.test.ts
│   ├── game-state.test.ts        # NEW: Game state management
│   ├── socket-events.test.ts     # NEW: Socket event handling
│   └── all-puzzles.test.ts       # NEW: Integration validation
├── puzzles/                      # Existing puzzle tests
│   ├── music-box.test.ts
│   ├── trunk-lock.test.ts
│   ├── love-letter-cipher.test.ts
│   ├── secret-message.test.ts
│   └── room2/                    # Room 2 puzzle tests
└── utils/                        # Test utilities
    ├── multiplayer-helpers.ts    # Multiplayer test helpers
    └── puzzle-helpers.ts         # Puzzle test helpers
```

## Running Tests

### Unit Tests
```bash
npm test                    # Run all unit tests once
npm run test:watch          # Run tests in watch mode
```

### E2E Tests
```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Run E2E tests with UI
npm run test:debug          # Debug E2E tests
npm run test:report         # View test report
```

### Specific Tests
```bash
# Run specific test file
npm test -- puzzle-sync

# Run tests matching pattern
npm test -- --grep "synchronization"

# Run E2E tests for specific file
npx playwright test puzzle-sync.spec.ts
```

## Test Coverage

### E2E Test Coverage (Playwright)

| Test Suite | Scenarios | Coverage |
|------------|-----------|----------|
| Landing Page | 5+ | Navigation, form validation |
| Chat | 6+ | Message sending, receiving, UI |
| Multiplayer Flow | 10+ | Room creation, joining, sync |
| Two-Player Gameplay | 10+ | Complete flow, cooperation |
| Puzzle Sync | 4+ | State synchronization |
| Reconnection | 8+ | Disconnect/reconnect handling |

### Unit Test Coverage (Vitest)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Music Box | 18+ | Gear placement, validation |
| Torn Photographs | 17+ | Piece placement, rotation |
| Secret Message | 7+ | Decoding logic |
| Trunk Lock | 6+ | Combination logic |
| Bell Codes | 20+ | Morse code, timing |
| Clock Face | 31+ | Time setting, validation |
| Gear Alignment | 18+ | Placement, rotation, meshing |
| Pendulum | 18+ | Swing mechanics |
| Midnight Chime | 18+ | Time-based triggers |
| Windup Key | 26+ | Synchronization |
| Bloom Timing | 12+ | Timing sequences |
| Seed Packets | 15+ | Pattern matching |
| Light Spectrum | 15+ | Color combinations |
| Water Flow | 10+ | Path routing |
| Game State | 40+ | State management |
| Socket Events | 35+ | Event handling |
| All Puzzles | 20+ | Integration validation |

## Test Helpers

### Multiplayer Helpers (`tests/utils/multiplayer-helpers.ts`)

```typescript
// Create mock socket for testing
await createMockSocket(page);

// Set up two-player test
const { host, player, roomCode } = await setupMultiplayerTest(browser);

// Create room as host
const roomCode = await createRoomAsHost(page, 'PlayerName');

// Join room as player
const success = await joinRoomAsPlayer(page, 'ROOM', 'PlayerName');

// Wait for socket event
const data = await waitForSocketEvent(page, 'player-joined');
```

### Puzzle Helpers (`tests/utils/puzzle-helpers.ts`)

```typescript
// Test if puzzle is visible
const isVisible = await helper.isPuzzleVisible();

// Submit puzzle
await helper.submitPuzzle();

// Check if solved
const isSolved = await helper.isPuzzleSolved();

// Drag and drop
await dragAndDrop(page, '#piece-1', '#slot-1');

// Click sequence
await clickSequence(page, ['#btn1', '#btn2', '#btn3']);

// Take screenshot
await takePuzzleScreenshot(page, 'music-box', 'solved');
```

## Writing New Tests

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';
import { createMockSocket } from '../utils/multiplayer-helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await createMockSocket(page);
    await page.goto('/');

    // Test implementation
    expect(true).toBe(true);
  });

  test('should handle multiplayer', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    // Multiplayer test implementation

    await context1.close();
    await context2.close();
  });
});
```

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '$lib/module';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    const result = functionToTest(edgeCaseInput);
    expect(result).toBe(expected);
  });
});
```

## CI/CD Integration

The tests are configured to run in CI/CD environments:

- **Unit tests**: Run on every push/PR
- **E2E tests**: Run on every push/PR with retries
- **Coverage**: Tracked and reported
- **Parallel execution**: Configured for faster runs

### GitHub Actions Example

```yaml
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Test Reliability

To ensure tests are reliable and not flaky:

1. **Use explicit waits**: `await page.waitForSelector()`
2. **Avoid fixed timeouts**: Use `waitForSelector` instead of `waitForTimeout`
3. **Mock external dependencies**: Use `createMockSocket` for network tests
4. **Clean up resources**: Always close browser contexts
5. **Use data-testid**: More stable than CSS selectors

## Debugging Tests

### Debug E2E Tests
```bash
# Run with headed mode
HEADLESS=false npm run test:e2e

# Run specific test with debugger
npm run test:debug -- puzzle-sync.spec.ts

# Take screenshots on failure
# Already configured in playwright.config.ts
```

### Debug Unit Tests
```bash
# Run with console output
npm test -- --reporter=verbose

# Run specific test file
npm test -- puzzle-sync

# Watch mode for development
npm run test:watch
```

## Coverage Goals

Current coverage targets:

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Critical paths should have 100% coverage:
- Puzzle validation logic
- Game state updates
- Socket event handlers
- Multiplayer synchronization

## Common Issues

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check for slow network requests
- Use more explicit selectors

### Flaky tests
- Add proper waits for async operations
- Mock external dependencies
- Avoid race conditions with proper state checks

### Import errors
- Ensure `src/lib` modules are properly exported
- Check alias configuration in `vitest.config.ts`
- Verify path mappings in `tsconfig.json`

## Contributing

When adding new features:

1. Write unit tests for logic
2. Write E2E tests for user flows
3. Test multiplayer scenarios
4. Test edge cases and error handling
5. Update test documentation

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

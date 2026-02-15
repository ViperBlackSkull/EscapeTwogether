# Contributing to EscapeTogether

Thank you for your interest in contributing to EscapeTogether! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install && cd server && npm install && cd ..`
3. Start development servers: `./init.sh`
4. Open http://localhost:5173

## Code Style

### TypeScript

- Use TypeScript for all new files
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` when type is truly unknown

### Svelte

- Use `<script lang="ts">` for TypeScript support
- Keep component logic in the script section
- Use Svelte stores for shared state
- Follow the existing component structure

### CSS/Styling

- Use Tailwind CSS utility classes
- Custom colors are defined in `src/app.css`:
  - `deep-navy` (#1a1a2e)
  - `soft-black` (#0f0f1a)
  - `dusty-rose` (#c9a9a6)
  - `antique-gold` (#8b7355)
  - `warm-amber` (#f4a460)
  - `soft-teal` (#4a9b8c)

### Commit Messages

Follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

Example: `feat(puzzles): Add combination lock puzzle to attic`

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── effects/        # Particle effects system
│   ├── puzzles/        # Puzzle definitions by room
│   │   ├── room1/      # The Attic
│   │   ├── room2/      # Clock Tower
│   │   └── room3/      # Garden Conservatory
│   ├── audio.ts        # Sound effects manager
│   ├── socket.ts       # WebSocket client
│   └── types.ts        # Shared TypeScript types
└── routes/
    ├── +page.svelte    # Landing page
    ├── lobby/          # Room waiting area
    └── game/           # Main game view
```

## Adding a New Puzzle

1. Create a new file in the appropriate room folder:
   ```
   src/lib/puzzles/room{1-3}/my-puzzle.ts
   ```

2. Export a `PuzzleDefinition` object:

```typescript
import type { PuzzleState, PuzzleHint, PuzzleDefinition, PlayerRole } from '$lib/types';
import { ROOM1_PUZZLE_IDS } from './ids';

// Define your puzzle state interface
export interface MyPuzzleState {
  solved: boolean;
  // ... other state fields
}

// Create initial state factory
export function createInitialState(): MyPuzzleState {
  return {
    solved: false,
    // ...
  };
}

// Validate solution
export function validateSolution(state: PuzzleState): boolean {
  const puzzleState = state.data as MyPuzzleState;
  return puzzleState.solved;
}

// Define hints
const HINTS: PuzzleHint[] = [
  { tier: 1, text: 'First hint', triggerAttempts: 3 },
  { tier: 2, text: 'Second hint', triggerAttempts: 6 },
  { tier: 3, text: 'Final hint', triggerAttempts: 10 },
];

// Export puzzle definition
export const MyPuzzle: PuzzleDefinition = {
  id: 'room1-my-puzzle',
  roomId: 'attic',
  name: 'My Puzzle',
  description: 'Description of the puzzle',
  requiredRoles: ['explorer', 'analyst'],
  solutionValidator: validateSolution,
  hints: HINTS
};
```

3. Export from the room's `index.ts`
4. Add tests in `tests/puzzles/`

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npx playwright test
npx playwright test --ui  # Interactive mode
```

### Type Checking

```bash
npm run check
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Add/update tests as needed
4. Update documentation if applicable
5. Ensure all tests pass: `npm test && npm run check`
6. Submit a pull request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript compiles without errors
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional format

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

Thank you for contributing!

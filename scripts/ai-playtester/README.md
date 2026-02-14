# AI Playtester

Autonomous testing agent for the EscapeTogether game.

## Overview

The AI Playtester connects to the game server and performs automated testing of:
- Server connectivity
- Room creation and joining
- Player state management
- Multi-player interactions
- Disconnection handling
- Response time performance

## Prerequisites

- Node.js 18+
- Running game server (default: http://localhost:3001)

## Installation

```bash
cd scripts/ai-playtester
npm install
```

## Usage

### Run all tests

```bash
npm start
```

### Run with custom server URL

```bash
SERVER_URL=http://localhost:3001 npm start
```

### Build for production

```bash
npm run build
```

## Test Suite

| Test | Description |
|------|-------------|
| Server Connection | Verifies connection to game server |
| Room Creation | Tests room creation functionality |
| Room Code Validation | Validates 4-character room codes |
| Player State | Checks player initialization and host status |
| Multiple Player Handling | Simulates multiple players joining |
| Disconnection Handling | Tests player leave events |
| Invalid Room Join | Verifies error handling for non-existent rooms |
| Server Response Time | Measures server performance |

## Output

The playtester outputs:
- Real-time test progress
- Pass/fail status for each test
- Test duration metrics
- Summary report with statistics

### Example Output

```
========================================
Starting AI Playtester Test Suite
========================================

--- Running Test: Server Connection ---
[12:00:00] [AI-Playtester] Connected to server
✓ PASSED: Server Connection (152ms)

--- Running Test: Room Creation ---
✓ PASSED: Room Creation (89ms)

========================================
AI Playtester Test Report
========================================
Total Tests: 8
Passed: 8
Failed: 0
Total Duration: 5234ms
========================================
```

## Programmatic Usage

```typescript
import { AIPlaytester } from './playtester';

const playtester = new AIPlaytester({
  serverUrl: 'http://localhost:3001',
  playerName: 'MyTestBot',
  verbose: true
});

// Run all tests
const results = await playtester.runAllTests();

// Or use individual methods
await playtester.connect();
const room = await playtester.createRoom();
console.log('Created room:', room.code);

// Get event log
const events = playtester.getEventLog();

// Clean up
playtester.disconnect();
```

## Extending the Playtester

The playtester is designed to be extended for puzzle testing:

```typescript
class ExtendedPlaytester extends AIPlaytester {
  async testPuzzle(puzzleId: string) {
    const state = this.analyzePuzzleState(puzzleId);
    const decision = this.makePuzzleDecision(puzzleId);
    // Implement puzzle-specific testing
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| serverUrl | string | http://localhost:3001 | Game server URL |
| playerName | string | AI_Playtester | Bot player name |
| verbose | boolean | true | Enable verbose logging |
| testTimeout | number | 30000 | Test timeout in ms |

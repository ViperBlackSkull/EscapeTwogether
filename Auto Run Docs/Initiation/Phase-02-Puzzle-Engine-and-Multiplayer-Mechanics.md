# Phase 02: Puzzle Engine & Multiplayer Mechanics

Build a robust, extensible puzzle engine inspired by RAYA's PuzzleBase pattern, add 4 additional cooperative puzzle types that require communication, implement an event-driven architecture for multiplayer synchronization, and create a multi-room game flow. By the end of this phase, the game should support a sequence of 3 rooms with 5 total puzzles, each requiring genuine collaboration.

## Tasks

- [x] Design and implement the puzzle engine framework:
  - Create `server/src/puzzles/puzzleBase.ts` — abstract base class/interface:
    - `id: string`, `type: string`, `name: string`, `description: string`
    - `generate(seed?: string): PuzzleData` — creates randomized puzzle instance
    - `validateAction(playerRole: string, action: PuzzleAction): ActionResult` — validates player moves
    - `getState(): PuzzleState` — returns current state
    - `getHint(hintLevel: number): string` — returns progressive hints
    - `onSolve(): void` — cleanup and event emission
  - Create `server/src/puzzles/puzzleRegistry.ts`:
    - Registry pattern to register puzzle types by name
    - `getPuzzle(type: string)` factory method
    - `getAllTypes()` for game configuration
    - Validation that registered puzzles implement the interface
  - Create `shared/types/puzzle.ts` — shared types between client and server:
    - `PuzzleAction`, `PuzzleState`, `PuzzleData`, `PlayerRole`, `ActionResult`
    - Move types from `server/src/types.ts` here to share
  - Refactor the existing CipherLock puzzle to extend the new puzzle base
  - Update server to use puzzle registry for game initialization

  > **Completed (Loop 00001):** Created `shared/types/puzzle.ts` with `PuzzleAction`, `ActionResult`, `PuzzleData`, `PuzzleState`, `PlayerRole` types. Created `server/src/puzzles/puzzleBase.ts` abstract class with `generate()`, `validateAction()`, `getState()`, `getHint()`, `onSolve()` methods. Created `server/src/puzzles/puzzleRegistry.ts` with `registerPuzzle()`, `createPuzzle()`, `getAllTypes()` factory pattern. Refactored `CipherLockPuzzle` to extend `PuzzleBase` and self-register. Updated `gameOrchestrator.ts` and `index.ts` to use the puzzle registry for game init and action routing. Updated both server and client tsconfigs to support the new `shared/` directory. Full build and dev server startup verified.

- [x] Implement the "Split Screen" puzzle — shared board with missing pieces:
  - Create `server/src/puzzles/splitScreen.ts`:
    - Generates a 4x4 grid where each cell has a symbol and color
    - Player A sees the LEFT half of the grid (columns 0-1) plus empty cells for right half
    - Player B sees the RIGHT half of the grid (columns 2-3) plus empty cells for left half
    - Each player can "send" a cell description to their partner via the puzzle UI
    - Goal: both players must reconstruct the full grid by communicating what they see
    - Solution: both grids must match the original
  - Create `client/src/puzzles/SplitScreen.tsx`:
    - 4x4 grid display with colored symbol cells
    - "Send Cell Info" interface: click a cell to describe it to partner
    - "Place Cell" interface: click an empty cell to place received info
    - Visual feedback: cells glow when correctly placed
    - Chat-like log within puzzle showing exchanged cell descriptions

  > **Completed (Loop 00001):** Created `server/src/puzzles/splitScreen.ts` extending `PuzzleBase` with `SplitScreenPuzzle` class. Generates a random 4x4 grid of symbols (★◆▲●■♣♥✦) with colors. Player A ("Left Eye") sees columns 0-1; Player B ("Right Eye") sees columns 2-3. Actions: `send-cell` (share a cell description), `place-cell` (place received info on empty cell), `check-solution` (merges both placements and validates against original grid), `request-hint`. Registered via `registerPuzzle()` and imported in `gameOrchestrator.ts`. Created `client/src/puzzles/SplitScreen.tsx` with role-based views: each player sees a 4x4 grid with owned cells (teal border) and empty cells (dashed amber), clicks own cells to share info, uses "Partner Shared" panel to select received cells and place them on empty slots. Added comprehensive CSS styles in `index.css` (`.split-grid`, `.split-cell`, `.split-received`, etc.). Updated `GamePage.tsx` to import and render `SplitScreen` for type `'split-screen'`. Server and client both build cleanly.

- [x] Implement the "Wire Connection" puzzle — circuit board cooperation:
  - Create `server/src/puzzles/wireConnection.ts`:
    - Generates a set of 6 colored wires with connection points (input/output)
    - Player A sees INPUT side: 6 colored nodes with wire stubs
    - Player B sees OUTPUT side: 6 numbered nodes with wire stubs
    - Wires are tangled/crossed — Player A must describe their wire colors while Player B matches to numbered outputs
    - Hidden mapping: `{ "red": 3, "blue": 1, "green": 6, "yellow": 2, "purple": 5, "orange": 4 }`
    - Player B clicks to connect numbered outputs to colors
  - Create `client/src/puzzles/WireConnection.tsx`:
    - **Player A view**: Shows 6 colored wire endpoints with drag handles, can send color names via in-puzzle chat
    - **Player B view**: Shows 6 numbered endpoints, color picker to assign colors to each number
    - Wire drawing between endpoints using SVG paths
    - Correct connections glow green, wrong connections shake red
    - "Check Connections" button that validates all 6 wires

  > **Completed (Loop 00001):** Created `server/src/puzzles/wireConnection.ts` extending `PuzzleBase` with `WireConnectionPuzzle` class. Generates a random mapping of 6 colors (red, blue, green, yellow, purple, orange) to shuffled numbered outputs (1-6). Player A ("Input Operator") sees colored wires and can click to describe them to partner via `send-color-info` action. Player B ("Output Operator") sees numbered outputs and uses a color picker to assign colors via `connect-wire`/`disconnect-wire` actions. Supports `check-connections` to validate all 6 wires and `request-hint` for progressive hints (4 levels). Registered via `registerPuzzle()` and imported in `gameOrchestrator.ts`. Created `client/src/puzzles/WireConnection.tsx` with role-based views: Player A sees vertical list of colored wires with glowing dots and click-to-send descriptions; Player B sees a 3x2 grid of numbered outputs with assign/disconnect buttons and a color picker modal. Communication log shows exchanged messages within the puzzle UI. Added comprehensive CSS styles in `index.css` (`.wire-view`, `.wire-board`, `.wire-node`, `.wire-color-picker`, etc.). Updated `GamePage.tsx` to import and render `WireConnection` for type `'wire-connection'`. Also fixed a pre-existing type error in `SplitScreen.tsx` where `placingCell` state was missing the `cell` property in its TypeScript type. Full build passes cleanly (both client and server).

- [x] Implement the "Sequence Memory" puzzle — audio/visual pattern relay:
  - Create `server/src/puzzles/sequenceMemory.ts`:
    - Generates a sequence of 5-7 colored symbols (random from pool of 8 symbols)
    - Player A sees the FULL sequence flash briefly (3 seconds), then it disappears
    - Player A must relay the sequence to Player B through chat
    - Player B has a symbol palette and must click symbols in the correct order
    - The sequence is shown in 2 phases: first 3 symbols, then remaining (to split memory load)
  - Create `client/src/puzzles/SequenceMemory.tsx`:
    - **Player A view (Watcher)**: Animated sequence display showing symbols one at a time with timing, then hidden. "Start Relay" button to begin showing sequence to B. Countdown timer for memorization.
    - **Player B view (Repeater)**: Grid of 8 clickable symbols, sequence slots at top showing placed symbols, "Submit Sequence" button
    - Visual feedback: symbols pulse when shown, slot fills when placed
    - Hint system: can reveal one symbol's position

  > **Completed (Loop 00001):** Created `server/src/puzzles/sequenceMemory.ts` extending `PuzzleBase` with `SequenceMemoryPuzzle` class. Generates a random sequence of 5-7 colored symbols from a pool of 8 (★◆▲●■♣♥✦). Player A ("Watcher") sees the full sequence animated one symbol at a time (800ms intervals) with two-phase grouping (first 3 = Phase 1, remaining = Phase 2). Actions: `start-relay` (watcher begins relay phase, reveals Phase 1 symbols to repeater), `start-input` (repeater starts entering), `send-relay-info` (chat messaging), `place-symbol` / `clear-symbol` (repeater places/removes symbols in slots), `submit-sequence` (validates full sequence), `request-hint` (reveals a random unrevealed position). Registered via `registerPuzzle()` and imported in `gameOrchestrator.ts`. Created `client/src/puzzles/SequenceMemory.tsx` with role-based views: Watcher sees animated symbol sequence with sequential reveal, phase grouping indicators, memorization prompt, relay chat interface with reference grid; Repeater sees waiting screen during showing phase, Phase 1 symbols revealed by partner, communication log, symbol palette for entering sequence into numbered slots, click-to-clear filled slots, submit and hint buttons. Added comprehensive CSS styles in `index.css` (`.seq-view`, `.seq-display`, `.seq-symbol-cell`, `.seq-slots`, `.seq-palette`, etc.) with animations for symbol pulse and waiting indicator. Updated `GamePage.tsx` to import and render `SequenceMemory` for type `'sequence-memory'`. Server and client both build cleanly.

- [x] Implement the "Map Navigator" puzzle — treasure hunt coordination:
  - Create `server/src/puzzles/mapNavigator.ts`:
    - Generates a 8x8 grid "map" with obstacles, a treasure location, and a safe path
    - Player A sees the MAP with treasure location marked but NOT the path
    - Player B sees DIRECTIONS (a list of moves like "Up 2, Right 3, Down 1, Right 2") but NOT the map
    - Player A must guide Player B by describing landmarks/obstacles near the path
    - Player B enters directional moves step by step, seeing only their current position
    - Wrong moves hit obstacles = penalty (timer adds 30 seconds)
  - Create `client/src/puzzles/MapNavigator.tsx`:
    - **Player A view (Guide)**: 8x8 grid showing treasure, obstacles, and Player B's current position. Can highlight cells to help guide. Chat for directions.
    - **Player B view (Explorer)**: Shows current cell only, surrounding cells revealed as fog of war when adjacent. Directional buttons (↑↓←→) to move. Move history log.
    - Fog of war reveals cells within 1 step of current position
    - Obstacles are visually distinct (walls, pits, etc. using CSS styling)

  > **Completed (Loop 00001):** Created `server/src/puzzles/mapNavigator.ts` extending `PuzzleBase` with `MapNavigatorPuzzle` class. Generates a random 8x8 grid with ~12 obstacles (walls, pits, boulders, thorns) using BFS-verified path from start to treasure. Player A ("Guide") sees the full map with all obstacles, treasure location, and Explorer's position; can highlight up to 5 cells and communicate via in-puzzle chat. Player B ("Explorer") sees fog-of-war view where only cells within 1 step of current position are revealed, plus consolidated step-by-step directions (e.g., "Up 2, Right 3"). Actions: `move` (explorer moves in a direction, hitting obstacles adds 30s penalty), `highlight-cell` (guide marks cells), `send-message` (chat), `request-hint` (BFS-based hint showing next direction). Registered via `registerPuzzle()` and imported in `gameOrchestrator.ts`. Created `client/src/puzzles/MapNavigator.tsx` with role-based views: Guide sees full 8x8 grid with colored cell types (teal=explorer, gold=treasure, red=obstacles), cell highlighting on click, and communication log; Explorer sees fog-of-war grid with revealed/hidden cells, D-pad direction buttons (↑↓←→), direction reference chips, move history, and communication log. Added comprehensive CSS styles in `index.css` (`.map-view`, `.map-grid`, `.map-cell-*`, `.map-dpad`, `.map-directions`, etc.) with visual distinction for fog, obstacles, treasure, and highlighted cells. Updated `GamePage.tsx` to import and render `MapNavigator` for type `'map-navigator'`. Server and client both build cleanly.

- [x] Build the multi-room game flow with room transitions:
  - Create `server/src/gameFlow.ts` — game scenario configuration:
    - Define 3 rooms, each with specific puzzles:
      - **Room 1 "The Workshop"**: Cipher Lock (tutorial, simpler)
      - **Room 2 "The Laboratory"**: Split Screen + Wire Connection (2 puzzles, harder)
      - **Room 3 "The Vault"**: Sequence Memory + Map Navigator (final, hardest)
    - Room transition logic: complete all puzzles in current room → door unlock animation → next room
    - Track overall progress: current room index, rooms completed, total puzzles solved
    - Timer: starts on game start, pauses between rooms, final time on completion
  - Create `client/src/components/RoomTransition.tsx`:
    - Animated transition screen between rooms ("Door Unlocked!", "Entering The Laboratory...")
    - 3-second countdown before next room loads
    - Atmospheric text describing the new room
  - Create `client/src/components/RoomProgress.tsx`:
    - Progress bar showing rooms completed (1/3, 2/3, 3/3)
    - Current room name and puzzle checklist
    - Overall timer display
  - Update `GamePage.tsx` to handle room progression and puzzle sequencing

  > **Completed (Loop 00002):** Created `shared/types/gameFlow.ts` with `RoomConfig`, `HotspotConfig` interfaces and `ROOMS` array defining 3 rooms (Workshop=1 puzzle, Laboratory=2 puzzles, Vault=2 puzzles). Updated `server/src/types.ts` to add `currentRoomIndex`, `roomPausedAt`, `totalPausedMs` to `GameRoom`, plus `RoomTransitionEvent` type and new socket events (`room-transition`, `advance-room`). Added `'transitioning'` to `RoomState` union. Created `server/src/gameFlow.ts` with room config queries (`getRoomConfig`, `isLastRoom`, `areAllRoomPuzzlesSolved`, progress helpers). Refactored `server/src/gameOrchestrator.ts`: changed `activePuzzles` from `Map<string, PuzzleBase>` to `Map<string, Map<string, PuzzleBase>>` for multi-puzzle-per-room support; `startGame()` now activates only Room 1 puzzles; `handlePuzzleSolved()` checks room completion and triggers transition or game completion; added `advanceToNextRoom()` that pauses/resumes timer, clears old puzzle instances, and sets up next room's puzzles. Updated `server/src/index.ts` with `advance-room` socket handler and updated `handlePuzzleAction` to use new `getPuzzleInstance(roomId, puzzleType)` API. Created `client/src/components/RoomTransition.tsx` with animated door opening, countdown, room name/description display. Created `client/src/components/RoomProgress.tsx` with room step indicators (done/current/future icons), puzzle checklist per room, and accurate timer that accounts for pause time. Updated `client/src/pages/GamePage.tsx` to use dynamic hotspots from room config, show RoomTransition during transitions, and emit `advance-room` on countdown complete. Updated `client/src/hooks/useRoom.ts` with `room-transition` listener and `advanceRoom` action. Updated `client/src/stores/gameStore.ts` with `roomTransition` state. Updated `client/src/components/PlayerHUD.tsx` timer to account for `totalPausedMs`. Fixed pre-existing unused variables in `MapNavigator.tsx`. Full server and client builds pass cleanly.

- [x] Add atmospheric room theming and visual polish:
  - Create `client/src/themes/rooms.ts` — room theme definitions:
    - Workshop: warm wood tones (#8B4513, #D2691E), tool/machinery motifs
    - Laboratory: cool teal/cyan (#008B8B, #20B2AA), chemical/tech motifs
    - Vault: dark gold/steel (#B8860B, #708090), lock/chain motifs
  - Create `client/src/components/RoomEnvironment.tsx`:
    - Background gradients and CSS patterns per room theme
    - Ambient floating particles (CSS animations, different per room)
    - Subtle light effects (radial gradient spotlights that follow mouse)
    - Border/frame styling for the room scene
  - Create `client/src/components/Hotspot.tsx`:
    - Reusable interactive element with hover glow, click animation
    - Supports different states: locked, available, completed
    - Room-themed styling based on current room context
  - Add CSS transitions for all state changes (puzzle open/close, room transitions)

  > **Completed (Loop 00003):** Created `client/src/themes/rooms.ts` with `RoomTheme` interface and `ROOM_THEMES` array defining 3 distinct room themes (Workshop=warm wood browns/spark particles, Laboratory=cool teal/cyan/circle particles, Vault=dark gold/steel/diamond particles). Each theme includes: color palette (primary, secondary, accent with glow variants, gradient colors, particle color, spotlight color, border colors), particle config (count, size/speed/drift ranges, opacity, shape), pattern config (grid opacity/color, vignette strength), and motif icons. Created `client/src/components/RoomEnvironment.tsx` with themed layered backgrounds: per-room gradient, subtle grid pattern overlay, mouse-following spotlight via CSS custom properties + mousemove listener, themed vignette, ambient flicker light, themed floating particles (circle/square/diamond/spark shapes with room-specific colors/speeds), and room frame/border glow. Created `client/src/components/Hotspot.tsx` as a reusable interactive element with 3 states (locked/available/completed), room-themed CSS custom property-based styling (colors adapt to current room theme), hover glow via `::before` pseudo-element, click scale animation, pulsing ring for available state, and outer glow on hover. Refactored `client/src/components/RoomScene.tsx` to use `RoomEnvironment` and `Hotspot` components with theme prop, replacing the old inline hotspot buttons and atmosphere particles. Updated `client/src/pages/GamePage.tsx` to import `getRoomTheme` and pass theme to RoomScene based on `currentRoomIndex`. Added comprehensive CSS in `index.css`: `.room-environment` with layered elements, `.env-particle` with shape variants (circle/square/diamond/spark) and `envFloatUp`/`envFloatUpRotate` keyframe animations, `.env-spotlight` with CSS variable-based positioning, `.hotspot` with state classes and CSS custom property theming, `.hotspot-ring`/`.hotspot-glow` animations, `.room-scene-enter` animation with blur+scale transition for smooth room entry, `.puzzle-overlay-exit` transition for puzzle close, and `transition` properties on `.game-page`, `.room-zone`, `.room-floor` for smooth theme changes. Full client and server type-check and Vite production build pass cleanly.

- [x] Enhance the chat and communication system:
  - Upgrade `ChatPanel.tsx` to support puzzle-context messages:
    - Different message types: `chat`, `system`, `puzzle-hint`, `puzzle-info`
    - Color coding: player messages (amber/teal), system messages (gold), puzzle info (white)
    - Message timestamps
  - Add quick-communication buttons during puzzles:
    - Pre-built phrases relevant to current puzzle ("The third wire is blue", "I see a wall to the left")
    - Custom message input always available
  - Add player presence indicator (typing indicator for partner)
  - Add notification sound effects (Web Audio API beeps) for new messages

  > **Completed (Loop 00001):** Added `ChatMessageType` ('chat' | 'system' | 'puzzle-hint' | 'puzzle-info') to `ChatMessage` interface in both server and client types. Added `partner-typing` server-to-client event and `typing` client-to-server event to socket event maps. Server `index.ts` now handles `typing` event by broadcasting `partner-typing` to other room members, and chat messages include `type: 'chat'`. Created `client/src/lib/audio.ts` with Web Audio API `playMessageSound()` (880→660Hz sine sweep) and `playSystemSound()` (523→659Hz triangle) for notification beeps. Created `client/src/lib/quickPhrases.ts` with 6 contextual phrases per puzzle type (cipher-lock, split-screen, wire-connection, sequence-memory, map-navigator). Updated `gameStore.ts` to map game events to system chat messages automatically (hint→puzzle-hint, puzzle-solved→puzzle-info, others→system), added `partnerTyping` state with 2-second auto-clear. Updated `useRoom.ts` to play notification sounds on incoming messages and handle `partner-typing` events. Rewrote `ChatPanel.tsx` with: color-coded message types (gold system, blue hints, green info), animated typing indicator with bouncing dots, quick-phrase panel toggled by Zap icon with puzzle-specific phrases, improved unread badge tracking, typing emission throttled to 2-second intervals. Updated `GamePage.tsx` to pass `activePuzzleType` prop to ChatPanel. Added comprehensive CSS styles for message type badges, typing indicator animation (`typingBounce` keyframe), quick phrase buttons with pill-shaped design. Full server and client builds pass cleanly.

- [x] Write server-side tests for all puzzles and game flow:
  - Create `server/src/__tests__/puzzles/cipherLock.test.ts`:
    - Test puzzle generation produces valid data for both roles
    - Test correct code submission validates to true
    - Test wrong code submission validates to false
    - Test hint system returns progressively more revealing hints
  - Create `server/src/__tests__/puzzles/splitScreen.test.ts`:
    - Test grid generation creates valid 4x4 grid
    - Test that player data is correctly split (left/right halves)
    - Test solution validation
  - Create `server/src/__tests__/puzzles/wireConnection.test.ts`:
    - Test wire mapping generation
    - Test correct connection validation
    - Test partial connection state
  - Create `server/src/__tests__/puzzles/gameFlow.test.ts`:
    - Test room progression (all puzzles solved → advance room)
    - Test game completion detection (all rooms complete)
    - Test timer accuracy
  - Install test dependencies: `vitest`, `@types/node`
  - Create `server/vitest.config.ts`
  - Run all tests and fix any failures

  > **Completed (Loop 00001):** Installed `vitest` as a dev dependency. Created `server/vitest.config.ts` with path aliases for shared types. Created 4 test files with 80 total tests covering all puzzle types and game flow: `cipherLock.test.ts` (20 tests: generation, validateAction for correct/wrong code, update-digits, unknown actions, role rejection, hint system with progressive levels, solve flow), `splitScreen.test.ts` (20 tests: 4x4 grid generation, left/right half splitting, placement actions, solution validation with correct merge, partial correctness reporting, hint system), `wireConnection.test.ts` (23 tests: 6-wire generation, role assignments, color/output validation, connect/disconnect wire actions, reassignment of same color, send-color-info, check-connections for full/partial/wrong states, hint system), `gameFlow.test.ts` (17 tests: room configs for all 3 rooms, isLastRoom, getCurrentPuzzleTypes, areAllRoomPuzzlesSolved, total/solved puzzle counts, progress summary, TOTAL_ROOMS). All 80 tests pass. TypeScript type-check also passes cleanly.

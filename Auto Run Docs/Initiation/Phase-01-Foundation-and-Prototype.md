# Phase 01: Foundation & Working Prototype

Build the complete project scaffolding and a working two-player prototype with a single escape room puzzle. By the end of this phase, two players should be able to open browsers on separate PCs, join a room, see a shared room scene, and cooperatively solve a puzzle that requires communication. This validates the entire stack end-to-end: React frontend, Node.js + Socket.io server, real-time multiplayer sync, and Docker containerization.

## Tasks

- [x] Initialize the monorepo project structure:
  - Create `/home/viper/Code/EscapeTwogether/package.json` at root with workspaces for `client` and `server`
  - Create `client/` folder with Vite + React + TypeScript (use `npm create vite@latest client -- --template react-ts`)
  - Create `server/` folder with Express + TypeScript + Socket.io (`npm install express socket.io cors uuid`)
  - Create root `tsconfig.base.json` with strict mode, ES2022 target, and shared compiler options
  - Add root scripts: `"dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""`, `"dev:server"`, `"dev:client"`, `"build"`, `"docker:build"`, `"docker:run"`
  - Install root dev dependencies: `concurrently`, `typescript`, `@types/node`
  - Create `.gitignore` covering `node_modules`, `dist`, `.env`, `*.png` (generated assets), `.vite`

- [x] Build the Socket.io server with room-based multiplayer:
  - Create `server/src/index.ts` — Express + HTTP server + Socket.io with CORS enabled for `http://localhost:5173`
  - Define TypeScript types in `server/src/types.ts`:
    - `Player`: `{ id, name, socketId, currentRoom }`
    - `GameRoom`: `{ id, players: Player[], state: RoomState, puzzles: Record<string, PuzzleState>, createdAt }`
    - `RoomState`: `'waiting' | 'playing' | 'completed'`
    - `PuzzleState`: `{ id, type, solved, data: Record<string, any> }`
    - Socket event types: `join-room`, `room-updated`, `puzzle-action`, `puzzle-updated`, `chat-message`, `game-event`
  - Implement room lifecycle: `create-room` (generates 4-char room code), `join-room` (max 2 players), `leave-room`
  - Broadcast `room-updated` to all players in room on any state change
  - Handle `puzzle-action` events: validate, update puzzle state, broadcast `puzzle-updated`
  - Handle disconnections: remove player, notify remaining player
  - Create `server/tsconfig.json` extending root config with `"outDir": "./dist"`

- [x] Create the React client with Socket.io integration:
  - Create `client/src/lib/socket.ts` — Socket.io client singleton connecting to `http://localhost:3001`
  - Create `client/src/types/index.ts` mirroring server types
  - Create `client/src/hooks/useSocket.ts` — React hook wrapping socket events with useState/useEffect
  - Create `client/src/hooks/useRoom.ts` — Hook managing room state (join, leave, actions)
  - Create `client/src/stores/gameStore.ts` — Zustand store for global game state (current room, player ID, puzzle states)
  - Install client dependencies: `socket.io-client`, `zustand`, `lucide-react`

- [x] Build the lobby UI and room system:
  - Create `client/src/pages/LobbyPage.tsx`:
    - Input for player name
    - "Create Room" button → generates room code and navigates to waiting room
    - "Join Room" input for room code + "Join" button
    - Clean dark theme with warm accent colors (escape room atmosphere)
  - Create `client/src/pages/WaitingRoomPage.tsx`:
    - Display room code prominently (large, copyable)
    - Show connected players (waiting for Player 2 state)
    - "Start Game" button (only active when 2 players connected, only host can press)
    - Leave room button
  - Create `client/src/App.tsx` with React Router routing: `/` → Lobby, `/room/:roomId` → WaitingRoom, `/game/:roomId` → GamePage
  - Create `client/src/components/Layout.tsx` — dark themed wrapper with subtle ambient background
  - Install: `react-router-dom`

- [x] Build the game room view and interactive scene system:
  - Create `client/src/pages/GamePage.tsx` — main game view with room scene and puzzle overlay
  - Create `client/src/components/RoomScene.tsx`:
    - Full-screen room background container with dark atmospheric styling
    - CSS-based room environment (no images yet — use gradient backgrounds, colored zones, atmospheric effects)
    - Interactive hotspot overlay (clickable areas positioned over room zones)
    - Each hotspot has an ID, position (CSS absolute), visual indicator (glowing border), and label
  - Create `client/src/components/PlayerHUD.tsx`:
    - Shows player name, room timer, connected indicator for partner
    - Subtle notification area for game events
  - Create `client/src/components/ChatPanel.tsx`:
    - Side panel for player-to-player text communication (essential for cooperative puzzles)
    - Messages with sender name and timestamp
    - Auto-scroll to latest message
  - Style everything with CSS modules or inline styles using a dark, moody escape room palette:
    - Background: deep navy/charcoal (#0a0a1a, #1a1a2e)
    - Accents: warm amber (#f4a261), teal (#2a9d8f), soft gold (#e9c46a)
    - Interactive elements: subtle glow effects, hover animations

- [x] Implement the asymmetric communication puzzle — "The Cipher Lock":
  - This puzzle REQUIRES communication between players. Player A sees the lock mechanism. Player B sees the cipher key. They must talk to solve it.
  - Create `client/src/puzzles/CipherLock.tsx`:
    - Puzzle component that receives a `role` prop (`'decoder'` or `'lock-holder'`)
    - **Decoder view (Player A)**: Shows a substitution cipher key (e.g., A=3, B=7, C=1...) and an encoded message like "7-3-1-5"
    - **Lock-holder view (Player B)**: Shows a 4-digit combination lock with clickable number wheels (0-9)
    - The lock-holder must enter the decoded digits to solve the puzzle
    - On solve: emit puzzle completion, show success animation
    - Include a "Request Hint" button that gives progressively more revealing hints
  - Create `server/src/puzzles/cipherLock.ts`:
    - `generatePuzzle()`: creates random substitution cipher and encoded 4-digit code
    - Returns `{ decoderData: { cipherKey, encodedMessage }, lockData: { correctCode } }`
    - `validateAction()`: checks if submitted code matches solution
  - Wire puzzle into server: on `start-game`, generate puzzle data and assign roles (Player 1 = decoder, Player 2 = lock-holder)
  - When puzzle is solved, emit `game-event` with completion message and trigger room transition or win state

- [x] Add game flow orchestration on server:
  - Create `server/src/gameOrchestrator.ts`:
    - `startGame(roomId)`: transitions room state to `'playing'`, generates first puzzle, assigns asymmetric roles, broadcasts start event
    - `handlePuzzleSolved(roomId, puzzleId)`: records solve time, triggers celebration event, checks if game complete
    - `checkGameCompletion(roomId)`: if all puzzles solved, set state to `'completed'`, broadcast win event
    - Timer tracking: start timestamp, current elapsed time
  - Create a simple game configuration: single room with one puzzle (expand in later phases)
  - Create `server/src/config.ts` with game settings (max players per room = 2, hint cooldowns, etc.)

- [x] Create the win/completion screen and game polish:
  - Create `client/src/pages/VictoryPage.tsx`:
    - Celebration screen with completion time
    - "Play Again" button returning to lobby
    - Subtle particle/confetti animation (CSS-only)
  - Create `client/src/components/GameNotification.tsx`:
    - Toast-style notification for game events (player joined, puzzle hint, puzzle solved)
    - Auto-dismiss after 5 seconds, stack multiple notifications
  - Add ambient CSS animations to room scene: subtle floating particles, gentle light flicker, pulsing hotspot indicators
  - Add sound effect placeholders (console.log for now, real sounds in later phase)
  - Add loading states and error handling for socket disconnections

- [x] Set up Docker and development environment:
  - Create `Dockerfile` at project root:
    - Multi-stage build: `node:20-alpine` for build, `node:20-alpine` for production
    - Build both client and server, copy to production image
    - Expose port 3000 (combined Express serving static client + Socket.io)
    - In production: Express serves the built React app AND handles Socket.io
  - Create `docker-compose.yml`:
    - Single service `escapetwogether` building from `.`
    - Port mapping `3000:3000`
    - Environment variable for `ANTHROPIC_AUTH_TOKEN` (read from `.env` file)
    - Volume mount for generated assets: `./assets:/app/assets`
  - Update `server/src/index.ts` to serve static files from `../client/dist` in production
  - Create `.env.example` with required environment variables documented
  - Create `docker-compose.dev.yml` for development:
    - Separate client (port 5173) and server (port 3001) services
    - Volume mounts for hot reload: `./client/src:/app/client/src`, `./server/src:/app/server/src`

- [x] Test the complete prototype end-to-end:
  - Start the dev server (`npm run dev`)
  - Verify server starts on port 3001 without errors
  - Verify client starts on port 5173 and renders the lobby page
  - Open two browser tabs/windows to `http://localhost:5173`
  - In tab 1: enter name "Player 1", click "Create Room", note the room code
  - In tab 2: enter name "Player 2", enter the room code, click "Join"
  - Verify both tabs show "Waiting Room" with 2 players connected
  - Click "Start Game" in tab 1
  - Verify tab 1 shows the Cipher Lock puzzle in "Decoder" mode (sees cipher key and encoded message)
  - Verify tab 2 shows the Cipher Lock puzzle in "Lock-Holder" mode (sees combination dials)
  - Use the chat panel in tab 1 to send the decoded digits to tab 2
  - Enter the correct code in tab 2's combination lock
  - Verify both tabs show the victory screen with completion time
  - Fix any bugs found during testing
  - Document any issues or improvements for future phases in a comment at the bottom of this file

## Testing Notes

- **Tested on:** 2026-05-03 using server port 3004 and client port 5175 (other projects occupied default ports)
- **Default port changed** from 3001 to 3004 to avoid conflict with another project. Server and client config updated accordingly. CORS updated to accept any localhost port via regex.
- **Bug fixed: Duplicate chat messages.** The `useRoom()` hook was called from both `GamePage` and `ChatPanel`, causing socket event listeners to be registered twice. Each chat message appeared twice in the UI. Fixed by converting socket listener registration to a singleton pattern using a module-level flag (`listenersRegistered`) and direct `useGameStore.getState()` calls instead of hook-bound closures.
- **Files modified during testing:**
  - `server/src/index.ts` — default port changed to 3004, CORS regex for any localhost port
  - `client/src/lib/socket.ts` — default server URL updated to port 3004, made configurable via `VITE_SERVER_URL` env var
  - `client/src/hooks/useRoom.ts` — singleton socket listener registration to fix duplicate message bug

## Issues and Improvements for Future Phases

- **Stale GameNotification from previous room:** The victory notification "Puzzle solved in 173.2s!" persists when navigating back to lobby via "Play Again". The notification component should clear on route change.
- **Old Painting and Bookshelf hotspots** are present in the UI but have no puzzle implementation yet — they show "Investigating... Nothing to interact with yet." These are placeholders for future phases.
- **Sound effects** are console.log placeholders only. Real audio files needed.
- **No reconnection logic:** If a player's socket disconnects and reconnects, there's no mechanism to restore their room/game state.
- **Chat panel** doesn't persist across puzzle overlay — messages are visible but the panel feels cramped when a puzzle is open.
- **Dial controls** for the lock holder require many clicks (one socket round-trip per click). Consider allowing click-and-drag or direct number input for faster interaction.
- **No game timer persistence:** Timer starts from when the game page loads on the client side, not from server-side `startedAt`. This could lead to timer discrepancies between players.
- **Port configuration:** Consider making the server port configurable via a shared `.env` file rather than hardcoded defaults, especially since default ports (3001, 5173) may conflict with other dev servers.

# EscapeTogether

A cooperative puzzle escape room game designed for couples. Two players work together to solve puzzles that require genuine communication, trust, and teamwork. Inspired by "Keep Talking and Nobody Explodes" and "We Were Here" series, but with a romantic, intimate atmosphere.

## Game Overview

In EscapeTogether, each player sees things the other cannot. The core gameplay loop is:
1. **See** - Each player observes different information
2. **Describe** - Communicate what you see to your partner
3. **Understand** - Work together to comprehend the puzzle
4. **Act Together** - Coordinate to solve and progress

### The Three Rooms

1. **The Attic** - Grandmother's Love Letters & Lost Memories
   - Discover a locked trunk with decades of encoded love letters
   - 5 puzzles, ~20 minutes playtime
   - Theme: Warm, nostalgic, filled with golden light

2. **The Clock Tower** - Time & Connection Across Distance
   - A century-old story of separated lovers
   - 6 puzzles, ~30 minutes playtime
   - Theme: Romantic, mysterious, moonlit

3. **The Garden Conservatory** - Growth & New Beginnings
   - Help a rare flower bloom through light, water, and care
   - 7 puzzles, ~35 minutes playtime
   - Theme: Hopeful, alive, growing

## Features

- **Asymmetric Information** - Each player sees different aspects of puzzles
- **Role Rotation** - Players switch between Explorer and Analyst roles
- **Real-time Communication** - Built-in chat system (or use external voice chat)
- **AI-Powered Hints** - Adaptive hint system based on player behavior
- **Mobile Support** - Touch controls, pinch-to-zoom, responsive design
- **Particle Effects** - Ambient dust motes, sparkles, and celebration effects
- **Sound Design** - Atmospheric music and interaction sounds

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend Framework | SvelteKit |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Game Rendering | PixiJS v8 |
| Real-time Communication | Socket.IO |
| Backend | Express + Node.js |
| Containerization | Docker |

## Project Structure

```
EscapeTwogether/
├── src/
│   ├── lib/
│   │   ├── components/       # Svelte UI components
│   │   │   ├── Chat.svelte   # In-game chat
│   │   │   ├── GameCanvas.svelte  # PixiJS game canvas
│   │   │   └── ParticleEffects.svelte
│   │   ├── effects/          # Particle system
│   │   │   └── ParticleSystem.ts
│   │   ├── puzzles/          # Puzzle definitions by room
│   │   │   ├── room1/        # The Attic puzzles
│   │   │   ├── room2/        # Clock Tower puzzles
│   │   │   └── room3/        # Garden Conservatory puzzles
│   │   ├── audio.ts          # Sound management
│   │   ├── socket.ts         # WebSocket client
│   │   └── types.ts          # TypeScript type definitions
│   └── routes/
│       ├── +page.svelte      # Landing page
│       ├── lobby/            # Waiting room
│       └── game/             # Main game view
├── server/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.IO server
│   │   └── RoomManager.ts    # Room state management
│   └── package.json
├── static/                   # Static assets
├── tests/                    # E2E tests with Playwright
├── Dockerfile
└── docker-compose.yml
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/ViperBlackSkull/EscapeTwogether.git
   cd EscapeTwogether
   ```

2. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. Start both servers:
   ```bash
   ./init.sh
   ```

   Or manually in separate terminals:
   ```bash
   # Terminal 1 - Backend Server
   cd server && npm run dev

   # Terminal 2 - Frontend Dev Server
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

### Docker Setup

```bash
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend: http://localhost:3001

## How to Play

1. **Create a Room** - One player creates a room and gets a 4-character code
2. **Share the Code** - Share the room code with your partner
3. **Join the Room** - Your partner enters the code to join
4. **Communicate** - Describe what you see to each other
5. **Solve Puzzles** - Work together to solve each room's puzzles
6. **Escape Together** - Complete all three rooms to finish the game!

### Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move/Interact | Click | Tap |
| Pan Camera | Click + Drag | Touch + Drag |
| Zoom | Scroll Wheel | Pinch |
| Open Chat | Type in chat box | Tap chat button |

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run check    # Type-check with svelte-check
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

### Adding New Puzzles

1. Create a new file in `src/lib/puzzles/room{X}/`
2. Export a `PuzzleDefinition` object with:
   - `id`: Unique puzzle identifier
   - `roomId`: Which room ('attic', 'clock_tower', 'garden_conservatory')
   - `name`: Display name
   - `description`: Player-facing description
   - `requiredRoles`: Which roles can interact
   - `solutionValidator`: Function to check if solved
   - `hints`: Array of hint tiers

### Code Style

- Use TypeScript for all new files
- Follow existing ESLint/Prettier configuration
- Write descriptive comments for complex logic
- Add JSDoc comments for public functions

## Testing

```bash
# Run all tests
npm test

# Run E2E tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## License

MIT License - see LICENSE file for details

## Credits

Built with love for couples who enjoy solving puzzles together.

# EscapeTwogether

Cooperative multiplayer escape room game where players work together to solve puzzles and escape.

## Technologies

- **SvelteKit** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **PixiJS** - 2D WebGL rendering engine
- **Socket.IO** - Real-time WebSocket communication

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ViperBlackSkull/EscapeTwogether.git
   cd EscapeTwogether
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. Start the development servers:
   ```bash
   ./init.sh
   ```

   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

## Development

- Frontend runs on: http://localhost:5173
- Backend API runs on: http://localhost:3001

## License

MIT

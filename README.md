# EscapeTwogether 🎮

A cooperative multiplayer escape room game built with SvelteKit, PixiJS, and Socket.IO. Work together with a partner to solve puzzles and escape mysterious rooms in real-time!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-4.2.0-orange)](https://svelte.dev/)
[![Node](https://img.shields.io/badge/Node-20%2B-green)](https://nodejs.org/)

## ✨ Features

### Core Gameplay
- 🎭 **Asymmetric Roles** - Each player has unique abilities and perspectives
- 🧩 **Interactive Puzzles** - Drag-and-drop puzzles with real-time synchronization
- 🎨 **Beautiful Graphics** - PixiJS-powered canvas rendering with particle effects
- 🎵 **Immersive Audio** - Dynamic soundscapes and puzzle feedback

### Multiplayer
- 🌐 **Real-time Sync** - WebSocket-based state synchronization
- 💬 **In-Game Chat** - Coordinate with your partner
- 🔄 **Auto-Reconnect** - Seamless reconnection if connection drops
- 📱 **Mobile Support** - Touch-optimized controls and responsive design

### Accessibility
- ♿ **WCAG 2.1 AA** - Comprehensive accessibility support
- 🎹 **Full Keyboard Nav** - Complete keyboard accessibility
- 🔊 **Screen Reader Support** - Enhanced ARIA labels and announcements
- 🎨 **High Contrast Mode** - Improved visibility options

### Performance
- ⚡ **Lazy Loading** - Code splitting and on-demand loading
- 🖼️ **Image Optimization** - WebP conversion and responsive images
- 🎯 **Bundle Optimization** - Tree-shaking and minification
- 📊 **Performance Monitoring** - Built-in health checks and metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- npm or yarn package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/escapetogether.git
cd escapetogether
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development servers:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173`

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Player Guide](./docs/PLAYER_GUIDE.md)** - How to play the game
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run all tests
npm run test:unit       # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Test coverage report

# Code Quality
npm run lint            # Lint code
npm run format          # Format code with Prettier
npm run check           # Type checking with Svelte

# Performance
npm run build:analyze   # Analyze bundle size
npm run lighthouse      # Run Lighthouse audit
npm run optimize:images # Optimize images

# Docker
npm run docker:build    # Build Docker containers
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
```

### Project Structure

```
escapetogether/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable components
│   │   ├── puzzles/        # Puzzle components
│   │   ├── stores/         # Svelte stores
│   │   ├── utils/          # Utility functions
│   │   ├── effects/        # Particle effects
│   │   └── audio/          # Audio system
│   ├── routes/             # SvelteKit routes
│   └── app.html            # HTML template
├── static/                 # Static assets
├── server/                 # Socket.IO backend
├── tests/                  # Test files
├── docs/                   # Documentation
└── scripts/                # Build scripts
```

## 🎯 Game Mechanics

### Puzzle System

The game features multiple puzzle types:

- **Matching Puzzles** - Match items based on visual characteristics
- **Sequence Puzzles** - Enter correct orders and patterns
- **Logic Puzzles** - Deductive reasoning challenges
- **Coordination Puzzles** - Real-time collaborative tasks

### Role System

**Explorer:**
- Can interact with room objects
- Examines details up close
- Manipulates puzzle pieces

**Analyst:**
- Access to codes and clues
- Research capabilities
- Strategy coordination

### Rooms

1. **The Attic** - Introduction puzzles
2. **The Clock Tower** - Timing challenges
3. **The Garden Conservatory** - Complex puzzles

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Frontend
VITE_BACKEND_URL=http://localhost:3001

# Backend
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-secret-key
```

### Accessibility Settings

Configure accessibility features in `src/lib/stores/accessibility.ts`:

```typescript
export const accessibilitySettings = {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderMode: false,
    focusIndicators: true
};
```

## 🐳 Docker Deployment

### Quick Start

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Performance

### Target Metrics

- **Lighthouse Score:** >90
- **Initial Load:** <3 seconds on 4G
- **First Contentful Paint:** <1.5 seconds
- **Time to Interactive:** <3 seconds
- **No FPS drops** during gameplay

### Optimization

- Code splitting and lazy loading
- Image optimization (WebP, responsive sizes)
- Tree-shaking and dead code elimination
- Gzip/Brotli compression
- CDN-ready static assets

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Svelte team for the amazing framework
- PixiJS for the powerful graphics library
- Socket.IO for real-time communication
- The open-source community

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/escapetogether/issues)
- **Discord:** [Join our Discord](https://discord.gg/escapetogether)
- **Email:** support@escapetogether.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/escapetogether&type=Date)](https://star-history.com/#yourusername/escapetogether&Date)

---

**Built with ❤️ by the EscapeTwogether team**

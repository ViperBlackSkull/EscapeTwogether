# Phase 05: Deployment, Production Readiness & Hosting

Prepare EscapeTwogether for production deployment to your Proxmox VPS. Optimize the Docker setup, add monitoring and health checks, create the deployment pipeline, and ensure the game runs reliably for two players connecting from different networks. By the end of this phase, you should be able to share a URL with Raya and play together from separate locations.

## Tasks

- [x] Optimize the production Docker setup:
  - Create `Dockerfile` (production-optimized):
    - Multi-stage build: `node:20-alpine` for build, `gcr.io/distroless/nodejs20` for runtime (minimal attack surface)
    - Build client and server in single stage, copy only dist artifacts + node_modules production deps
    - Non-root user for runtime (`USER node`)
    - Health check: `curl -f http://localhost:3000/health || exit 1`
    - Labels: version, description, maintainer
    - Image size target: under 200MB
  - Create `docker-compose.yml` (production):
    - Single `escapetwogether` service
    - Port `3000:3000`
    - Environment variables from `.env` file
    - Named volumes: `escapetwogether-assets` for generated images, `escapetwogether-sessions` for game data
    - Restart policy: `unless-stopped`
    - Resource limits: 1GB memory, 1 CPU core
    - Health check with 30s interval
    - Logging driver with 10MB max size, 3 files rotation
  - Create `docker-compose.dev.yml` (development, refined):
    - Hot-reload for both client and server via volume mounts
    - Debug ports exposed
    - Environment: `NODE_ENV=development`
  - **Notes:** Docker daemon on this system has a containerd TTRPC issue preventing build verification. The Dockerfile logic has been manually validated for path resolution (server `import.meta.dirname` + `../../client/dist` correctly resolves to `/app/client/dist/`). Health check in docker-compose uses `node -e "fetch(...)"` instead of `curl` since distroless has no shell/curl. Dev compose uses workspace-root build context with separate Dockerfiles (`Dockerfile.dev.server`, `Dockerfile.dev.client`) to properly access shared types from the monorepo root. Node.js inspector exposed on port 9229 for server debugging.

- [x] Add reverse proxy configuration for Proxmox deployment:
  - Create `nginx/nginx.conf`:
    - Upstream to EscapeTwogether on port 3000
    - WebSocket proxy configuration (critical for Socket.io):
      ```
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header X-Real-IP $remote_addr;
      ```
    - Proxy buffer settings optimized for real-time communication
    - Static asset caching (generated images: 7 day cache)
    - Gzip compression for JS/CSS/HTML
    - Security headers (X-Frame-Options, CSP, X-Content-Type-Options)
  - Create `docker-compose.proxmox.yml`:
    - Includes nginx as reverse proxy
    - Let's Encrypt / certbot for HTTPS (optional, documented)
    - Network isolation: nginx on public port, app on internal network only
    - Volume for SSL certificates if HTTPS is used
  - Create `docs/deployment/proxmox-setup.md`:
    - Step-by-step guide: create LXC container or VM on Proxmox, install Docker, clone repo, configure `.env`, run `docker compose up`
    - Network setup: port forwarding or reverse DNS for external access
    - SSL setup with Let's Encrypt
    - Backup strategy for game session data
  - **Notes:** nginx.conf includes WebSocket upgrade headers for Socket.io (`proxy_buffering off`, `proxy_read_timeout 86400s` for long-lived connections), security headers (X-Frame-Options, CSP, X-Content-Type-Options), gzip compression for JS/CSS/HTML, and 7-day caching for generated images and static assets. docker-compose.proxmox.yml uses dual networks: `internal` (app-only, not routable) and `public` (nginx exposes ports 80/443). SSL certbot service is commented out but ready to enable. Deployment guide covers LXC container creation with nesting enabled, Docker install, HTTPS setup with Let's Encrypt, NAT port forwarding, iptables rules for bridged Proxmox networking, backup/restore procedures, and update workflow.
  - Create `server/src/routes/health.ts`:
    - `GET /health` — basic liveness check (returns `{ status: "ok", uptime }`)
    - `GET /health/ready` — readiness check (verifies: server up, Socket.io ready, ComfyUI reachable if enabled, Anthropic API reachable if enabled)
    - `GET /health/stats` — basic stats (active rooms, active players, total games completed)
  - Create `server/src/services/monitoringService.ts`:
    - Track: active connections, rooms created, games completed, average completion time
    - Memory usage logging every 5 minutes (console output)
    - Error tracking: count errors by type, log to file
  - Create `server/src/middleware/errorHandler.ts`:
    - Global error handler for Express
    - Socket.io error handler for unhandled socket errors
    - Structured error logging (timestamp, error type, message, stack trace summary)
    - Never expose internal details to clients

- [x] Implement rate limiting and security hardening:
  - Create `server/src/middleware/rateLimiter.ts`:
    - Socket.io rate limiting: max 30 messages per minute per socket, max 10 puzzle actions per minute
    - HTTP rate limiting: 100 requests per minute per IP for API routes
    - Room creation limit: 3 rooms per minute per IP (prevent spam)
    - Exceeding limits: disconnect socket or return 429 with cooldown info
  - Create `server/src/middleware/validation.ts`:
    - Input sanitization for all socket events: strip HTML, limit string lengths
    - Room code validation: must be exactly 4 alphanumeric characters
    - Player name validation: 1-20 characters, alphanumeric + spaces only
    - Puzzle action validation: ensure action structure matches expected schema
  - Update Socket.io server configuration:
    - Add `maxHttpBufferSize: 1e6` (1MB max message size)
    - Add `pingTimeout: 10000`, `pingInterval: 5000` for connection stability
    - Add `connectTimeout: 10000`
    - CORS: configurable allowed origins (default localhost + deployed domain)
  - **Notes:** Implemented token-bucket rate limiter with per-socket, per-IP, and per-room-creation tracking. Periodic cleanup of stale buckets every 60s. Input validation strips HTML tags, enforces length limits, and validates structure for all socket events (create-room, join-room, chat-message, puzzle-action). Socket.io config updated with maxHttpBufferSize, pingTimeout, pingInterval, connectTimeout, and configurable CORS origins via `CORS_ORIGINS` env var. HTTP rate limiter returns 429 with `retryAfter` field. All 44 new tests pass; all 343 existing tests still pass with no regressions.

- [x] Create the deployment scripts and environment management:
  - Create `scripts/deploy.sh`:
    - Pulls latest code (if git), builds Docker image, runs migrations if any, restarts container
    - Pre-deploy health check: verify new container starts before stopping old one
    - Rollback capability: keep previous image tagged, rollback if health check fails
  - Create `scripts/backup.sh`:
    - Backs up game session data and generated assets
    - Timestamped tar.gz archive
    - Configurable backup retention (default: keep last 7)
  - Create `.env.example` (comprehensive):
    ```
    # Server
    NODE_ENV=production
    PORT=3000

    # Anthropic API (for AI narrative & hints)
    ANTHROPIC_AUTH_TOKEN=your-token-here
    ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
    ANTHROPIC_MODEL=claude-sonnet-4-20250514

    # ComfyUI (for image generation)
    COMFYUI_URL=https://806ba3e40.hacktive.olares.local

    # AI Feature Flags
    AI_ENABLED=true
    AI_NARRATIVE_ENABLED=true
    AI_HINTS_ENABLED=true
    AI_IMAGES_ENABLED=true

    # Game Settings
    MAX_PLAYERS_PER_ROOM=2
    SESSION_EXPIRY_HOURS=24
    RECONNECT_TIMEOUT_MINUTES=5
    ```
  - Create `scripts/setup-dev.sh`:
    - Checks Node.js version (requires 20+), installs dependencies, creates `.env` from `.env.example`, runs asset pre-generation, starts dev server
  - **Notes:** All four deliverables created. `scripts/deploy.sh` supports `--rollback` flag to restore previous image (retains 3 most recent rollback tags). Pre-deploy tags current `latest` image before building. Health check polls `/health` for up to 60s after container start; auto-rolls back on failure. `scripts/backup.sh` backs up both Docker volumes (`escapetwogether-assets` and `escapetwogether-sessions`) into a single timestamped tar.gz. Supports `--restore <file>` for restoring from backup. Retention defaults to 7 backups (configurable via `BACKUP_RETENTION` env var). `.env.example` updated with all categories: server, Anthropic API, ComfyUI, AI feature flags, AI rate limiting, and game settings. `scripts/setup-dev.sh` checks Node.js 20+, runs `npm ci`, copies `.env.example` to `.env` if missing, attempts optional asset pre-generation (gracefully skips if ComfyUI unavailable), and starts the dev server.

- [x] Add a landing page and game introduction experience:
  - Create `client/src/pages/LandingPage.tsx` (replaces LobbyPage as the entry point):
    - Atmospheric intro screen with game title "EscapeTwogether" in stylized typography
    - Tagline: "A two-player escape room built for two"
    - Animated background (dark with subtle floating particles)
    - "Create Room" and "Join Room" buttons with name input
    - Brief "How to Play" expandable section:
      - 2 players, separate screens, communicate to solve puzzles
      - Each player sees different clues — you MUST talk to each other
      - Solve all rooms to escape together
    - Credits/version footer
  - Create `client/src/components/HowToPlay.tsx`:
    - Modal with illustrated guide (using CSS illustrations):
      - Step 1: Create or join a room
      - Step 2: Share the room code with your partner
      - Step 3: Communicate! You each see different clues
      - Step 4: Solve puzzles together to unlock rooms
      - Step 5: Escape before time runs out
    - Show only on first visit (localStorage flag)
  - Update routing: `/` → LandingPage, `/room/:roomId` → WaitingRoomPage, `/game/:roomId` → GamePage, `/victory/:roomId` → VictoryPage
  - **Notes:** LandingPage replaces LobbyPage as the `/` route. Uses existing `ParticleField` (dust style, 30 particles) for atmospheric background. Title split into "Escape" (amber) and "Twogether" (teal) with glow effects. Room creation/join functionality integrated directly into the landing card. HowToPlay modal auto-shows on first visit (1.2s delay) with localStorage flag `escapetwogether-how-to-play-seen`. 5 steps with numbered badges and emoji icons. Close via backdrop click, X button, or "Got it!" button. CSS styles added to `index.css` (~200 lines). All 5 new tests pass; all 44 existing client tests pass; all 343 server tests pass. TypeScript compiles cleanly.

- [ ] Final production testing and validation:
  - Build the Docker image and verify it starts: `docker compose build && docker compose up -d`
  - Run the complete health check suite: `curl http://localhost:3000/health/ready`
  - Test the full game from two separate browser instances (or two different machines on LAN):
    - Verify room creation and joining works across network
    - Verify Socket.io WebSocket connections are stable (check browser console for no errors)
    - Play through all 5 rooms with all puzzles
    - Verify AI narrative generation works in production Docker environment
    - Verify ComfyUI image generation works (check images load correctly)
    - Verify audio works across browsers (Chrome, Firefox)
    - Verify reconnection works (disconnect wifi briefly, reconnect)
  - Performance check:
    - Monitor Docker container memory usage during gameplay (should stay under 512MB)
    - Verify no memory leaks (play 2 full games, check memory doesn't grow)
    - Verify Socket.io messages are fast (under 100ms latency on LAN)
  - Security check:
    - Verify rate limiting works (spam messages get blocked)
    - Verify input validation works (HTML in names is stripped)
    - Verify CORS only allows configured origins
    - Verify no sensitive data in client-visible socket events
  - Fix all issues found during testing
  - Tag the release: `git tag v1.0.0 -a -m "EscapeTwogether v1.0.0 - Full release"`

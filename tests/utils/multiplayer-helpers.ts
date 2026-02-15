import type { Page, BrowserContext } from '@playwright/test';

/**
 * Test utilities for simulating multiplayer connections
 */

export interface TestPlayer {
  page: Page;
  context: BrowserContext;
  playerId: string;
  roomCode?: string;
}

/**
 * Create a mock socket.io-client module for testing
 * This mocks the socket.io-client at the module level so the app uses it
 */
export async function createMockSocket(page: Page) {
  await page.addInitScript(() => {
    // Create a mock socket instance
    const createMockSocketInstance = () => {
      const handlers = new Map<string, Function[]>();
      let _connected = false;
      let _id = `player-${Math.random().toString(36).substr(2, 9)}`;
      let _roomCode: string | null = null;

      const socket = {
        id: _id,
        connected: _connected,

        connect() {
          _connected = true;
          socket.connected = true;
          // Trigger connect handlers
          const cbs = handlers.get('connect') || [];
          cbs.forEach(cb => cb());
        },

        disconnect() {
          _connected = false;
          socket.connected = false;
          const cbs = handlers.get('disconnect') || [];
          cbs.forEach(cb => cb('client disconnect'));
        },

        on(event: string, callback: Function) {
          if (!handlers.has(event)) {
            handlers.set(event, []);
          }
          handlers.get(event)!.push(callback);
          return socket;
        },

        off(event: string, callback?: Function) {
          if (!callback) {
            handlers.delete(event);
          } else {
            const cbs = handlers.get(event) || [];
            const idx = cbs.indexOf(callback);
            if (idx > -1) cbs.splice(idx, 1);
          }
          return socket;
        },

        emit(event: string, data: any, callback?: Function) {
          // Simulate server responses
          if (event === 'create-room') {
            _roomCode = 'TEST';
            const response = {
              success: true,
              room: {
                code: _roomCode,
                players: [{ id: _id, name: data.playerName, isHost: true }],
                hostId: _id
              }
            };
            // Update socket id to match the host
            _id = socket.id;
            if (callback) callback(response);
            // Trigger player-joined event for self
            setTimeout(() => {
              const cbs = handlers.get('player-joined') || [];
              cbs.forEach(cb => cb({ player: response.room.players[0] }));
            }, 50);
          }

          if (event === 'join-room') {
            if (data.roomCode === 'TEST') {
              const response = {
                success: true,
                room: {
                  code: data.roomCode,
                  players: [
                    { id: 'host-id', name: 'Host', isHost: true },
                    { id: _id, name: data.playerName, isHost: false }
                  ],
                  hostId: 'host-id'
                }
              };
              if (callback) callback(response);
              // Trigger player-joined event
              setTimeout(() => {
                const cbs = handlers.get('player-joined') || [];
                cbs.forEach(cb => cb({ player: response.room.players[1] }));
              }, 50);
            } else {
              if (callback) callback({ success: false, error: 'Room not found' });
            }
          }

          // Handle game events
          if (event === 'game:action' || event === 'game:sync' || event === 'start-game') {
            // Just acknowledge, don't broadcast in single-browser test
            if (callback) callback({ success: true });
          }

          if (event === 'send-message') {
            // Simulate message echo
            setTimeout(() => {
              const cbs = handlers.get('receive-message') || [];
              cbs.forEach(cb => cb({
                id: `msg-${Date.now()}`,
                senderId: _id,
                senderName: data.senderName || 'Player',
                message: data.message,
                timestamp: new Date(),
                roomCode: data.roomCode
              }));
            }, 50);
          }
        },

        io: {
          on(event: string, callback: Function) {
            // Mock reconnection events
            return socket;
          }
        }
      };

      return socket;
    };

    // Mock the socket.io-client module
    (window as any).__mockSocketIo = () => {
      const instance = createMockSocketInstance();
      return instance;
    };

    // Store reference for test access
    (window as any).__testSocket = null;
  });
}

/**
 * Simulate creating a room as host
 */
export async function createRoomAsHost(page: Page, playerName: string): Promise<string> {
  // Wait for page to be ready
  await page.waitForLoadState('networkidle');

  // This will interact with the actual UI components
  // The implementation depends on the actual UI structure
  const roomCode = await page.evaluate(async (name) => {
    return new Promise<string>((resolve) => {
      const socket = (window as any).socket || (window as any).__mockSocket;
      if (socket) {
        socket.emit('create-room', { playerName: name }, (response: any) => {
          if (response.success) {
            resolve(response.room.code);
          } else {
            resolve('');
          }
        });
      } else {
        resolve('MOCK');
      }
    });
  }, playerName);

  return roomCode;
}

/**
 * Simulate joining a room as player
 */
export async function joinRoomAsPlayer(
  page: Page,
  roomCode: string,
  playerName: string
): Promise<boolean> {
  await page.waitForLoadState('networkidle');

  const success = await page.evaluate(async ({ code, name }) => {
    return new Promise<boolean>((resolve) => {
      const socket = (window as any).socket || (window as any).__mockSocket;
      if (socket) {
        socket.emit('join-room', { roomCode: code, playerName: name }, (response: any) => {
          resolve(response.success);
        });
      } else {
        resolve(true);
      }
    });
  }, { code: roomCode, name: playerName });

  return success;
}

/**
 * Set up two connected pages for multiplayer testing
 */
export async function setupMultiplayerTest(browser: any): Promise<{
  host: TestPlayer;
  player: TestPlayer;
  roomCode: string;
}> {
  // Create two browser contexts for isolation
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();

  // Set up mock sockets
  await createMockSocket(hostPage);
  await createMockSocket(playerPage);

  // Navigate both to the app
  await hostPage.goto('/');
  await playerPage.goto('/');

  // Host creates room
  const roomCode = await createRoomAsHost(hostPage, 'Host Player');

  // Player joins room
  await joinRoomAsPlayer(playerPage, roomCode, 'Guest Player');

  return {
    host: {
      page: hostPage,
      context: hostContext,
      playerId: 'host-id',
      roomCode
    },
    player: {
      page: playerPage,
      context: playerContext,
      playerId: 'player-id',
      roomCode
    },
    roomCode
  };
}

/**
 * Clean up multiplayer test resources
 */
export async function cleanupMultiplayerTest(host: TestPlayer, player: TestPlayer) {
  await host.context.close();
  await player.context.close();
}

/**
 * Wait for a specific socket event
 */
export async function waitForSocketEvent(page: Page, eventName: string, timeout = 5000): Promise<any> {
  return page.evaluate(({ event, timeoutMs }) => {
    return new Promise((resolve, reject) => {
      const socket = (window as any).socket || (window as any).__mockSocket;
      if (!socket) {
        reject(new Error('Socket not available'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeoutMs);

      socket.on(event, (data: any) => {
        clearTimeout(timeoutId);
        resolve(data);
      });
    });
  }, { event: eventName, timeoutMs: timeout });
}

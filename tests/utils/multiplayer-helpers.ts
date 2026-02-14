import { Page, BrowserContext } from '@playwright/test';

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
 * Create a mock socket connection for testing
 */
export async function createMockSocket(page: Page) {
  await page.addInitScript(() => {
    // Mock Socket.IO client
    (window as any).__mockSocket = {
      id: `player-${Math.random().toString(36).substr(2, 9)}`,
      connected: true,
      handlers: new Map<string, Function[]>(),

      on(event: string, callback: Function) {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(callback);
      },

      emit(event: string, data: any, callback?: Function) {
        // Simulate server responses
        if (event === 'create-room' && callback) {
          const roomCode = `TEST`;
          callback({
            success: true,
            room: {
              code: roomCode,
              players: [{ id: this.id, name: data.playerName, isHost: true }],
              hostId: this.id
            }
          });
          this.roomCode = roomCode;
        }

        if (event === 'join-room' && callback) {
          if (data.roomCode === 'TEST') {
            callback({
              success: true,
              room: {
                code: data.roomCode,
                players: [
                  { id: 'host-id', name: 'Host', isHost: true },
                  { id: this.id, name: data.playerName, isHost: false }
                ],
                hostId: 'host-id'
              }
            });
          } else {
            callback({ success: false, error: 'Room not found' });
          }
        }
      },

      disconnect() {
        this.connected = false;
      }
    };
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

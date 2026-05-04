import { useEffect } from 'react';
import { socket } from '../lib/socket.js';
import type { GameRoom, ChatMessage, GameEvent, PuzzleState, RoomTransitionEvent, RoomNarrativeEvent, CompletionNarrativeEvent, ScoreUpdateEvent, FinalScoreEvent, ReconnectInfo } from '../types/index.js';
import { ROOMS } from '../types/index.js';
import { useGameStore } from '../stores/gameStore.js';
import type { Clue } from '../stores/gameStore.js';
import { playMessageSound, playSystemSound, playPuzzleSolvedSound, playDoorUnlockSound, playHintSound } from '../lib/audio.js';

let listenersRegistered = false;

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

function registerSocketListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  socket.on('room-joined', (room: GameRoom) => {
    useGameStore.getState().setRoom(room);
  });

  socket.on('room-updated', (room: GameRoom) => {
    useGameStore.getState().setRoom(room);
  });

  socket.on('player-assigned', (playerId: string) => {
    useGameStore.getState().setPlayerId(playerId);
  });

  socket.on('chat-message', (msg: ChatMessage) => {
    const state = useGameStore.getState();
    state.addChatMessage(msg);
    if (msg.senderId !== state.playerId) {
      if (msg.type === 'chat') {
        playMessageSound();
      } else {
        playSystemSound();
      }
    }
  });

  socket.on('game-event', (event: GameEvent) => {
    const state = useGameStore.getState();
    state.addGameEvent(event);
    if (event.type === 'puzzle-solved') {
      playPuzzleSolvedSound();
      // Extract solved clue from puzzle narrative
      const puzzleId = (event.data?.puzzleId as string) ?? '';
      const narrative = state.puzzleNarratives[puzzleId];
      if (puzzleId && narrative?.successMessage) {
        const roomIdx = state.room?.currentRoomIndex ?? 0;
        const clue: Clue = {
          id: `solved-${puzzleId}-${roomIdx}`,
          puzzleId,
          label: puzzleId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          text: narrative.successMessage,
          roomIndex: roomIdx,
          roomName: ROOMS[roomIdx]?.name ?? `Room ${roomIdx + 1}`,
          timestamp: event.timestamp,
          type: 'solved',
        };
        state.addClue(clue);
      }
    } else if (event.type === 'hint') {
      playHintSound();
      // Extract hint as a clue
      const puzzleId = (event.data?.puzzleId as string) ?? '';
      if (puzzleId && event.message) {
        const roomIdx = state.room?.currentRoomIndex ?? 0;
        const clue: Clue = {
          id: `hint-${puzzleId}-${roomIdx}-${event.timestamp}`,
          puzzleId,
          label: `Hint: ${puzzleId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
          text: event.message,
          roomIndex: roomIdx,
          roomName: ROOMS[roomIdx]?.name ?? `Room ${roomIdx + 1}`,
          timestamp: event.timestamp,
          type: 'hint',
        };
        state.addClue(clue);
      }
    } else {
      playSystemSound();
    }
  });

  socket.on('puzzle-updated', (puzzle: PuzzleState) => {
    useGameStore.getState().updatePuzzle(puzzle);
  });

  socket.on('room-transition', (event: RoomTransitionEvent) => {
    useGameStore.getState().setRoomTransition(event);
    playDoorUnlockSound();
  });

  socket.on('error', (message: string) => {
    useGameStore.getState().setError(message);
  });

  socket.on('partner-typing', () => {
    const state = useGameStore.getState();
    state.setPartnerTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      useGameStore.getState().setPartnerTyping(false);
    }, 2000);
  });

  socket.on('room-narrative', (data: RoomNarrativeEvent) => {
    useGameStore.getState().setRoomNarrative(data);
  });

  socket.on('completion-narrative', (data: CompletionNarrativeEvent) => {
    useGameStore.getState().setCompletionNarrative(data);
  });

  socket.on('score-update', (data: ScoreUpdateEvent) => {
    useGameStore.getState().setScoreUpdate(data);
  });

  socket.on('final-score', (data: FinalScoreEvent) => {
    useGameStore.getState().setFinalScore(data);
  });

  socket.on('partner-disconnected', (playerName: string) => {
    useGameStore.getState().setPartnerDisconnected(Date.now());
    useGameStore.getState().addGameEvent({
      type: 'partner-disconnected',
      message: `${playerName} disconnected. Waiting for reconnection...`,
      timestamp: Date.now(),
    });
  });

  socket.on('partner-reconnected', (playerName: string) => {
    useGameStore.getState().setPartnerConnected(true);
    useGameStore.getState().addGameEvent({
      type: 'partner-reconnected',
      message: `${playerName} reconnected!`,
      timestamp: Date.now(),
    });
  });

  socket.on('reconnection-offer', (info: ReconnectInfo) => {
    useGameStore.getState().setReconnectionInfo(info);
    // Persist to localStorage so we can reconnect after a page reload
    try {
      localStorage.setItem('escape-twogether-reconnect', JSON.stringify(info));
    } catch { /* ignore */ }
  });

  socket.on('chat-history', (messages: ChatMessage[]) => {
    useGameStore.getState().setChatMessages(messages);
  });
}

export function useRoom() {
  const { clearRoom } = useGameStore();

  useEffect(() => {
    registerSocketListeners();
  }, []);

  const createRoom = (playerName: string) => {
    socket.emit('create-room', playerName);
  };

  const joinRoom = (roomId: string, playerName: string) => {
    socket.emit('join-room', { roomId: roomId.toUpperCase(), playerName });
  };

  const leaveRoom = () => {
    socket.emit('leave-room');
    clearRoom();
  };

  const startGame = () => {
    socket.emit('start-game');
  };

  const advanceRoom = () => {
    socket.emit('advance-room');
  };

  const sendPuzzleAction = (puzzleId: string, action: string, data: Record<string, any>) => {
    const room = useGameStore.getState().room;
    if (!room) return;
    socket.emit('puzzle-action', {
      roomId: room.id,
      puzzleId,
      action,
      data,
    });
  };

  const sendChatMessage = (message: string) => {
    socket.emit('chat-message', message);
  };

  const sendTyping = () => {
    socket.emit('typing');
  };

  const attemptReconnect = (token: string) => {
    socket.emit('reconnect', token);
  };

  const clearReconnection = () => {
    useGameStore.getState().setReconnectionInfo(null);
    useGameStore.getState().setReconnectionToken(null);
    try {
      localStorage.removeItem('escape-twogether-reconnect');
    } catch { /* ignore */ }
  };

  // On mount, check for stored reconnection token
  useEffect(() => {
    try {
      const stored = localStorage.getItem('escape-twogether-reconnect');
      if (stored) {
        const info: ReconnectInfo = JSON.parse(stored);
        // Only offer reconnect if it's from the last 5 minutes
        if (Date.now() - parseInt(info.reconnectionToken.split(':')[1] || '0') < 5 * 60 * 1000) {
          useGameStore.getState().setReconnectionInfo(info);
        } else {
          localStorage.removeItem('escape-twogether-reconnect');
        }
      }
    } catch { /* ignore */ }
  }, []);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    advanceRoom,
    sendPuzzleAction,
    sendChatMessage,
    sendTyping,
    attemptReconnect,
    clearReconnection,
  };
}

import { create } from 'zustand';
import type { GameRoom, ChatMessage, ChatMessageType, GameEvent, PuzzleState, RoomTransitionEvent, RoomNarrativeEvent, CompletionNarrativeEvent, ScoreUpdateEvent, FinalScoreEvent, ReconnectInfo } from '../types/index.js';
import type { PuzzleNarrative } from '../types/index.js';

export interface Clue {
  id: string;
  puzzleId: string;
  label: string;
  text: string;
  roomIndex: number;
  roomName: string;
  timestamp: number;
  type: 'clue' | 'hint' | 'solved';
}

interface GameState {
  room: GameRoom | null;
  playerId: string | null;
  playerName: string | null;
  chatMessages: ChatMessage[];
  gameEvents: GameEvent[];
  error: string | null;
  roomTransition: RoomTransitionEvent | null;
  partnerTyping: boolean;
  roomNarrative: RoomNarrativeEvent | null;
  puzzleNarratives: Record<string, PuzzleNarrative>;
  completionNarrative: CompletionNarrativeEvent | null;
  cumulativeScore: number;
  relationshipTier: string;
  lastScoreUpdate: ScoreUpdateEvent | null;
  finalScore: FinalScoreEvent | null;
  clues: Clue[];
  partnerConnected: boolean;
  partnerDisconnectedAt: number | null;
  reconnectionToken: string | null;
  reconnectionInfo: ReconnectInfo | null;

  setRoom: (room: GameRoom) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addGameEvent: (event: GameEvent) => void;
  updatePuzzle: (puzzle: PuzzleState) => void;
  clearRoom: () => void;
  setError: (msg: string | null) => void;
  setRoomTransition: (event: RoomTransitionEvent | null) => void;
  setPartnerTyping: (typing: boolean) => void;
  setRoomNarrative: (data: RoomNarrativeEvent) => void;
  setCompletionNarrative: (data: CompletionNarrativeEvent) => void;
  setScoreUpdate: (data: ScoreUpdateEvent) => void;
  setFinalScore: (data: FinalScoreEvent) => void;
  addClue: (clue: Clue) => void;
  setPartnerConnected: (connected: boolean) => void;
  setPartnerDisconnected: (at: number | null) => void;
  setReconnectionToken: (token: string | null) => void;
  setReconnectionInfo: (info: ReconnectInfo | null) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
}

function eventTypeToChatType(eventType: string): ChatMessageType {
  if (eventType === 'hint') return 'puzzle-hint';
  if (eventType === 'puzzle-solved') return 'puzzle-info';
  return 'system';
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  playerId: null,
  playerName: null,
  chatMessages: [],
  gameEvents: [],
  error: null,
  roomTransition: null,
  partnerTyping: false,
  roomNarrative: null,
  puzzleNarratives: {},
  completionNarrative: null,
  cumulativeScore: 0,
  relationshipTier: 'New Acquaintances',
  lastScoreUpdate: null,
  finalScore: null,
  clues: [],
  partnerConnected: true,
  partnerDisconnectedAt: null,
  reconnectionToken: null,
  reconnectionInfo: null,

  setRoom: (room) => set({ room }),

  setPlayerId: (id) => set({ playerId: id }),

  setPlayerName: (name) => set({ playerName: name }),

  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  addGameEvent: (event) =>
    set((state) => ({
      gameEvents: [...state.gameEvents, event],
      chatMessages: [
        ...state.chatMessages,
        {
          sender: 'System',
          senderId: 'system',
          message: event.message,
          timestamp: event.timestamp,
          type: eventTypeToChatType(event.type),
        },
      ],
    })),

  updatePuzzle: (puzzle) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          puzzles: {
            ...state.room.puzzles,
            [puzzle.id]: puzzle,
          },
        },
      };
    }),

  clearRoom: () =>
    set({
      room: null,
      chatMessages: [],
      gameEvents: [],
      error: null,
      roomTransition: null,
      partnerTyping: false,
      roomNarrative: null,
      puzzleNarratives: {},
      completionNarrative: null,
      cumulativeScore: 0,
      relationshipTier: 'New Acquaintances',
      lastScoreUpdate: null,
      finalScore: null,
      clues: [],
      partnerConnected: true,
      partnerDisconnectedAt: null,
      reconnectionToken: null,
      reconnectionInfo: null,
    }),

  setError: (msg) => set({ error: msg }),

  setRoomTransition: (event) => set({ roomTransition: event }),

  setPartnerTyping: (typing) => set({ partnerTyping: typing }),

  setRoomNarrative: (data) => set((state) => {
    const newClues: Clue[] = [];
    const roomIdx = state.room?.currentRoomIndex ?? 0;
    const roomName = data.roomNarrative.roomName;
    for (const [puzzleId, narrative] of Object.entries(data.puzzleNarratives)) {
      if (narrative.clueText) {
        const id = `clue-${puzzleId}-${roomIdx}`;
        if (!state.clues.some((c) => c.id === id)) {
          newClues.push({
            id,
            puzzleId,
            label: puzzleId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            text: narrative.clueText,
            roomIndex: roomIdx,
            roomName,
            timestamp: Date.now(),
            type: 'clue',
          });
        }
      }
    }
    return {
      roomNarrative: data,
      puzzleNarratives: data.puzzleNarratives,
      clues: [...state.clues, ...newClues],
    };
  }),

  setCompletionNarrative: (data) => set({ completionNarrative: data }),

  setScoreUpdate: (data) => set({
    cumulativeScore: data.cumulativeScore,
    relationshipTier: data.relationshipTier,
    lastScoreUpdate: data,
  }),

  setFinalScore: (data) => set({ finalScore: data }),

  addClue: (clue) => set((state) => {
    if (state.clues.some((c) => c.id === clue.id)) return state;
    return { clues: [...state.clues, clue] };
  }),

  setPartnerConnected: (connected) => set({
    partnerConnected: connected,
    partnerDisconnectedAt: connected ? null : Date.now(),
  }),

  setPartnerDisconnected: (at) => set({
    partnerConnected: at === null,
    partnerDisconnectedAt: at,
  }),

  setReconnectionToken: (token) => set({ reconnectionToken: token }),

  setReconnectionInfo: (info) => set({ reconnectionInfo: info }),

  setChatMessages: (messages) => set({ chatMessages: messages }),
}));

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Clue } from '../../stores/gameStore.js';

describe('gameStore clue tracking', () => {
  beforeEach(() => {
    useGameStore.getState().clearRoom();
  });

  it('starts with empty clues', () => {
    const state = useGameStore.getState();
    expect(state.clues).toEqual([]);
  });

  it('addClue adds a clue to the store', () => {
    const clue: Clue = {
      id: 'clue-test-1',
      puzzleId: 'cipher-lock',
      label: 'Cipher Lock',
      text: 'The code is 3-1-4',
      roomIndex: 0,
      roomName: 'The Invitation',
      timestamp: Date.now(),
      type: 'clue',
    };
    useGameStore.getState().addClue(clue);
    expect(useGameStore.getState().clues).toHaveLength(1);
    expect(useGameStore.getState().clues[0].text).toBe('The code is 3-1-4');
  });

  it('addClue deduplicates by id', () => {
    const clue: Clue = {
      id: 'clue-dup-1',
      puzzleId: 'cipher-lock',
      label: 'Cipher Lock',
      text: 'First',
      roomIndex: 0,
      roomName: 'The Invitation',
      timestamp: Date.now(),
      type: 'clue',
    };
    useGameStore.getState().addClue(clue);
    useGameStore.getState().addClue({ ...clue, text: 'Second' });
    expect(useGameStore.getState().clues).toHaveLength(1);
    expect(useGameStore.getState().clues[0].text).toBe('First');
  });

  it('clears clues on clearRoom', () => {
    const clue: Clue = {
      id: 'clue-clear-1',
      puzzleId: 'cipher-lock',
      label: 'Cipher Lock',
      text: 'Gone',
      roomIndex: 0,
      roomName: 'The Invitation',
      timestamp: Date.now(),
      type: 'clue',
    };
    useGameStore.getState().addClue(clue);
    expect(useGameStore.getState().clues).toHaveLength(1);
    useGameStore.getState().clearRoom();
    expect(useGameStore.getState().clues).toHaveLength(0);
  });

  it('setRoomNarrative extracts clues from puzzle narratives with clueText', () => {
    useGameStore.getState().setRoom({
      id: 'TEST',
      players: [],
      state: 'playing',
      puzzles: {},
      createdAt: Date.now(),
      startedAt: Date.now(),
      completedAt: null,
      puzzleSolveTimes: {},
      currentRoomIndex: 1,
      roomPausedAt: null,
      totalPausedMs: 0,
    });

    useGameStore.getState().setRoomNarrative({
      roomNarrative: {
        roomName: 'The Workshop',
        description: 'A dusty workshop',
        entranceText: 'You enter...',
        ambientDescriptions: [],
        characterDialogue: [],
      },
      puzzleNarratives: {
        'split-screen': {
          backstory: 'A mechanical display',
          clueText: 'Symbols must align in the center column',
          successMessage: 'Well done!',
          hintFlavorTexts: [],
        },
        'wire-connection': {
          backstory: 'A wire panel',
          clueText: '',
          successMessage: 'Connected!',
          hintFlavorTexts: [],
        },
      },
    });

    const clues = useGameStore.getState().clues;
    expect(clues).toHaveLength(1);
    expect(clues[0].puzzleId).toBe('split-screen');
    expect(clues[0].text).toBe('Symbols must align in the center column');
    expect(clues[0].roomIndex).toBe(1);
    expect(clues[0].roomName).toBe('The Workshop');
    expect(clues[0].type).toBe('clue');
  });

  it('setRoomNarrative does not duplicate clues already in store', () => {
    useGameStore.getState().setRoom({
      id: 'TEST',
      players: [],
      state: 'playing',
      puzzles: {},
      createdAt: Date.now(),
      startedAt: Date.now(),
      completedAt: null,
      puzzleSolveTimes: {},
      currentRoomIndex: 0,
      roomPausedAt: null,
      totalPausedMs: 0,
    });

    const narrative = {
      roomNarrative: {
        roomName: 'The Invitation',
        description: 'A mysterious letter',
        entranceText: 'You find...',
        ambientDescriptions: [],
        characterDialogue: [],
      },
      puzzleNarratives: {
        'cipher-lock': {
          backstory: 'A sealed letter',
          clueText: 'Look for the underlined letters',
          successMessage: 'Unlocked!',
          hintFlavorTexts: [],
        },
      },
    };

    useGameStore.getState().setRoomNarrative(narrative);
    useGameStore.getState().setRoomNarrative(narrative);
    expect(useGameStore.getState().clues).toHaveLength(1);
  });

  it('tracks hint and solved clues separately', () => {
    const hintClue: Clue = {
      id: 'hint-cipher-lock-0-1000',
      puzzleId: 'cipher-lock',
      label: 'Hint: Cipher Lock',
      text: 'Try looking at the third letter',
      roomIndex: 0,
      roomName: 'The Invitation',
      timestamp: 1000,
      type: 'hint',
    };
    const solvedClue: Clue = {
      id: 'solved-cipher-lock-0',
      puzzleId: 'cipher-lock',
      label: 'Cipher Lock',
      text: 'You cracked the code!',
      roomIndex: 0,
      roomName: 'The Invitation',
      timestamp: 2000,
      type: 'solved',
    };

    useGameStore.getState().addClue(hintClue);
    useGameStore.getState().addClue(solvedClue);
    expect(useGameStore.getState().clues).toHaveLength(2);
    expect(useGameStore.getState().clues.find((c) => c.type === 'hint')).toBeDefined();
    expect(useGameStore.getState().clues.find((c) => c.type === 'solved')).toBeDefined();
  });
});

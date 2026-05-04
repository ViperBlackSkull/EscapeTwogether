import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateNextRoom,
  validateScenario,
  calculateDifficulty,
  getScenarioTemplates,
  FALLBACK_TEMPLATES,
  VALID_PUZZLE_TYPES,
} from '../../services/scenarioService.js';
import type { RoomSummary } from '../../../../shared/types/scenario.js';
import type { RoomConfig } from '../../../../shared/types/gameFlow.js';

vi.mock('../../services/aiService.js', () => ({
  generateScenario: vi.fn(),
}));

const defaultRoomFields: Pick<RoomConfig, 'targetDurationMinutes' | 'narrativeBeat' | 'difficultyVariants'> = {
  targetDurationMinutes: 12,
  narrativeBeat: 'discovery',
  difficultyVariants: [
    { level: 'easy', timeMultiplier: 1.2, hintAllowance: 4, puzzleComplexity: 2 },
    { level: 'medium', timeMultiplier: 1.0, hintAllowance: 3, puzzleComplexity: 3 },
    { level: 'hard', timeMultiplier: 0.85, hintAllowance: 2, puzzleComplexity: 4 },
  ],
};

describe('scenarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateScenario', () => {
    it('validates a correct scenario', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'The Invitation',
        description: 'A mysterious letter...',
        puzzles: ['cipher-lock'],
        hotspots: [{ id: 'cipher-lock', label: 'Sealed Letter', x: 32, y: 28, width: 36, height: 40 }],
      };
      expect(validateScenario(scenario)).toBe(true);
    });

    it('validates a multi-puzzle scenario', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'The Workshop',
        description: 'A dusty workshop...',
        puzzles: ['split-screen', 'wire-connection'],
        hotspots: [
          { id: 'split-screen', label: 'Mechanical Display', x: 5, y: 15, width: 40, height: 38 },
          { id: 'wire-connection', label: 'Wire Panel', x: 55, y: 15, width: 40, height: 38 },
        ],
      };
      expect(validateScenario(scenario)).toBe(true);
    });

    it('validates a 3-puzzle scenario', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'The Vault',
        description: 'A grand vault...',
        puzzles: ['wire-connection', 'sequence-memory', 'map-navigator'],
        hotspots: [
          { id: 'wire-connection', label: 'Power Grid', x: 5, y: 5, width: 28, height: 40 },
          { id: 'sequence-memory', label: 'Memory Seals', x: 36, y: 5, width: 28, height: 40 },
          { id: 'map-navigator', label: 'Passage Map', x: 67, y: 5, width: 28, height: 40 },
        ],
      };
      expect(validateScenario(scenario)).toBe(true);
    });

    it('rejects empty name', () => {
      const scenario = {
        ...defaultRoomFields,
        name: '',
        description: 'A room...',
        puzzles: ['cipher-lock'],
        hotspots: [{ id: 'cipher-lock', label: 'Cipher Lock', x: 32, y: 28, width: 36, height: 40 }],
      };
      expect(validateScenario(scenario)).toBe(false);
    });

    it('rejects empty description', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'Room',
        description: '',
        puzzles: ['cipher-lock'],
        hotspots: [{ id: 'cipher-lock', label: 'Cipher Lock', x: 32, y: 28, width: 36, height: 40 }],
      };
      expect(validateScenario(scenario)).toBe(false);
    });

    it('rejects empty puzzles array', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'Room',
        description: 'A room...',
        puzzles: [],
        hotspots: [],
      };
      expect(validateScenario(scenario)).toBe(false);
    });

    it('rejects invalid puzzle type', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'Room',
        description: 'A room...',
        puzzles: ['invalid-puzzle'],
        hotspots: [{ id: 'invalid-puzzle', label: 'Invalid', x: 32, y: 28, width: 36, height: 40 }],
      };
      expect(validateScenario(scenario)).toBe(false);
    });

    it('rejects mismatched hotspot count', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'Room',
        description: 'A room...',
        puzzles: ['cipher-lock', 'split-screen'],
        hotspots: [{ id: 'cipher-lock', label: 'Cipher Lock', x: 32, y: 28, width: 36, height: 40 }],
      };
      expect(validateScenario(scenario)).toBe(false);
    });

    it('rejects missing hotspot for puzzle', () => {
      const scenario = {
        ...defaultRoomFields,
        name: 'Room',
        description: 'A room...',
        puzzles: ['cipher-lock'],
        hotspots: [{ id: 'split-screen', label: 'Split Screen', x: 5, y: 15, width: 40, height: 38 }],
      };
      expect(validateScenario(scenario)).toBe(false);
    });
  });

  describe('calculateDifficulty', () => {
    it('returns easy for no completed rooms', () => {
      const diff = calculateDifficulty([]);
      expect(diff.level).toBe('easy');
      expect(diff.puzzleCount).toBe(1);
    });

    it('returns medium for moderate performance', () => {
      const rooms: RoomSummary[] = [{
        name: 'The Invitation',
        timeSpentMs: 120_000,
        hintsUsed: 2,
        puzzlesSolved: 1,
        totalPuzzlesInRoom: 1,
        communicationFrequency: 8,
      }];
      const diff = calculateDifficulty(rooms);
      expect(['easy', 'medium']).toContain(diff.level);
    });

    it('scales up for fast solvers with few hints', () => {
      const rooms: RoomSummary[] = [{
        name: 'The Invitation',
        timeSpentMs: 30_000,
        hintsUsed: 0,
        puzzlesSolved: 1,
        totalPuzzlesInRoom: 1,
        communicationFrequency: 15,
      }];
      const diff = calculateDifficulty(rooms);
      expect(['medium', 'hard']).toContain(diff.level);
    });

    it('stays easier for slow solvers using many hints', () => {
      const rooms: RoomSummary[] = [
        { name: 'Room 1', timeSpentMs: 300_000, hintsUsed: 6, puzzlesSolved: 1, totalPuzzlesInRoom: 1, communicationFrequency: 3 },
        { name: 'Room 2', timeSpentMs: 300_000, hintsUsed: 6, puzzlesSolved: 1, totalPuzzlesInRoom: 1, communicationFrequency: 3 },
      ];
      const diff = calculateDifficulty(rooms);
      expect(['easy', 'medium']).toContain(diff.level);
    });
  });

  describe('generateNextRoom', () => {
    it('returns a valid RoomConfig from AI generation', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        name: 'The Clocktower',
        theme: 'mystery',
        description: 'Gears grind overhead as time runs out...',
        entranceText: 'You step into the clocktower.',
        ambientDescriptions: ['Tick tock.'],
        puzzleSuggestions: ['cipher-lock', 'split-screen'],
        difficulty: 'medium',
      });

      const room = await generateNextRoom([], ['Alice', 'Bob']);
      expect(room.name).toBe('The Clocktower');
      expect(room.puzzles).toEqual(['cipher-lock', 'split-screen']);
      expect(room.hotspots).toHaveLength(2);
      expect(validateScenario(room)).toBe(true);
    });

    it('personalizes entrance text with player names', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        name: 'The Library',
        theme: 'mystery',
        description: 'Ancient books line the walls...',
        entranceText: 'You enter a vast library of forgotten knowledge.',
        ambientDescriptions: ['Pages rustle.'],
        puzzleSuggestions: ['cipher-lock'],
        difficulty: 'easy',
      });

      const room = await generateNextRoom([], ['Alice', 'Bob']);
      expect(room.name).toBe('The Library');
    });

    it('filters out invalid puzzle types from AI response', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        name: 'The Maze',
        theme: 'intrigue',
        description: 'Walls shift around you...',
        entranceText: 'You enter the maze.',
        ambientDescriptions: [],
        puzzleSuggestions: ['fake-puzzle', 'cipher-lock'],
        difficulty: 'medium',
      });

      const room = await generateNextRoom([], []);
      expect(room.puzzles).toEqual(['cipher-lock']);
    });

    it('falls back to first room (The Invitation) when AI fails with no completed rooms', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const room = await generateNextRoom([], []);
      expect(room.name).toBe('The Invitation');
      expect(room.puzzles.length).toBeGreaterThan(0);
      expect(validateScenario(room)).toBe(true);
    });

    it('falls back when AI returns invalid scenario', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        name: '',
        theme: 'mystery',
        description: '',
        entranceText: '',
        ambientDescriptions: [],
        puzzleSuggestions: ['not-a-puzzle'],
        difficulty: 'easy',
      });

      const room = await generateNextRoom([], []);
      expect(room.name).toBeTruthy();
      expect(validateScenario(room)).toBe(true);
    });

    it('uses second fallback template (The Workshop) after one room completed', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const completedRooms: RoomSummary[] = [{
        name: 'The Invitation',
        timeSpentMs: 60_000,
        hintsUsed: 1,
        puzzlesSolved: 1,
        totalPuzzlesInRoom: 1,
        communicationFrequency: 5,
      }];

      const room = await generateNextRoom(completedRooms, []);
      expect(room.name).toBe('The Workshop');
      expect(room.puzzles).toEqual(['split-screen', 'wire-connection']);
    });

    it('uses third fallback template (The Laboratory) after two rooms completed', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const completedRooms: RoomSummary[] = [
        { name: 'Room 1', timeSpentMs: 60_000, hintsUsed: 1, puzzlesSolved: 1, totalPuzzlesInRoom: 1, communicationFrequency: 5 },
        { name: 'Room 2', timeSpentMs: 90_000, hintsUsed: 2, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 8 },
      ];

      const room = await generateNextRoom(completedRooms, []);
      expect(room.name).toBe('The Laboratory');
    });

    it('uses fourth fallback template (The Labyrinth) after three rooms completed', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const completedRooms: RoomSummary[] = [
        { name: 'Room 1', timeSpentMs: 60_000, hintsUsed: 1, puzzlesSolved: 1, totalPuzzlesInRoom: 1, communicationFrequency: 5 },
        { name: 'Room 2', timeSpentMs: 90_000, hintsUsed: 2, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 8 },
        { name: 'Room 3', timeSpentMs: 100_000, hintsUsed: 2, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 10 },
      ];

      const room = await generateNextRoom(completedRooms, []);
      expect(room.name).toBe('The Labyrinth');
    });

    it('uses last fallback template (The Vault) after four rooms completed', async () => {
      const { generateScenario } = await import('../../services/aiService.js');
      (generateScenario as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API down'));

      const completedRooms: RoomSummary[] = [
        { name: 'Room 1', timeSpentMs: 60_000, hintsUsed: 1, puzzlesSolved: 1, totalPuzzlesInRoom: 1, communicationFrequency: 5 },
        { name: 'Room 2', timeSpentMs: 90_000, hintsUsed: 2, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 8 },
        { name: 'Room 3', timeSpentMs: 100_000, hintsUsed: 2, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 10 },
        { name: 'Room 4', timeSpentMs: 110_000, hintsUsed: 1, puzzlesSolved: 2, totalPuzzlesInRoom: 2, communicationFrequency: 12 },
      ];

      const room = await generateNextRoom(completedRooms, []);
      expect(room.name).toBe('The Vault');
      expect(room.puzzles).toEqual(['wire-connection', 'sequence-memory', 'map-navigator']);
    });
  });

  describe('getScenarioTemplates', () => {
    it('returns 5 templates', () => {
      const templates = getScenarioTemplates();
      expect(templates).toHaveLength(5);
      expect(templates[0]!.name).toBe('The Invitation');
      expect(templates[1]!.name).toBe('The Workshop');
      expect(templates[2]!.name).toBe('The Laboratory');
      expect(templates[3]!.name).toBe('The Labyrinth');
      expect(templates[4]!.name).toBe('The Vault');
    });

    it('returns copies not references', () => {
      const a = getScenarioTemplates();
      const b = getScenarioTemplates();
      expect(a).not.toBe(b);
    });
  });

  describe('constants', () => {
    it('has valid puzzle types', () => {
      expect(VALID_PUZZLE_TYPES).toEqual([
        'cipher-lock', 'split-screen', 'wire-connection', 'sequence-memory', 'map-navigator',
      ]);
    });

    it('has 5 fallback templates', () => {
      expect(FALLBACK_TEMPLATES).toHaveLength(5);
    });
  });
});

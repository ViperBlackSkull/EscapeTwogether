import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRoomScene,
  generatePuzzleIllustration,
  generateClueImage,
  batchGenerate,
  getGeneratedImage,
  getGenerationStatus,
  getComfyuiUrl,
  isComfyuiAvailable,
} from '../../services/imageService.js';

// Mock fs/promises so we don't touch the real filesystem
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  stat: vi.fn().mockRejectedValue(new Error('ENOENT')),
}));

// Mock global fetch to simulate ComfyUI API
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockComfyuiSuccess() {
  // POST /prompt → returns prompt_id
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    const urlStr = url.toString();

    if (urlStr.includes('/prompt') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ prompt_id: 'test-prompt-123' }),
      } as Response);
    }

    // GET /history/{id} → returns success with output filename
    if (urlStr.includes('/history/')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            'test-prompt-123': {
              status: { status_str: 'success' },
              outputs: {
                '13': {
                  images: [{ filename: 'room-workshop_001.png' }],
                },
              },
            },
          }),
      } as Response);
    }

    // GET /view → returns fake image data
    if (urlStr.includes('/view')) {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response);
    }

    // GET /system_stats → health check
    if (urlStr.includes('/system_stats')) {
      return Promise.resolve({ ok: true } as Response);
    }

    return Promise.resolve({ ok: false, status: 404 } as Response);
  });
}

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getComfyuiUrl', () => {
    it('returns the configured ComfyUI URL', () => {
      const url = getComfyuiUrl();
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });
  });

  describe('isComfyuiAvailable', () => {
    it('returns true when ComfyUI responds', async () => {
      mockComfyuiSuccess();
      const available = await isComfyuiAvailable();
      expect(available).toBe(true);
    });

    it('returns false when ComfyUI is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      const available = await isComfyuiAvailable();
      expect(available).toBe(false);
    });
  });

  describe('generateRoomScene', () => {
    it('generates a room background image', async () => {
      mockComfyuiSuccess();

      const result = await generateRoomScene('A mysterious workshop', 'workshop');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('type', 'background');
      expect(result).toHaveProperty('width', 1280);
      expect(result).toHaveProperty('height', 720);
      expect(result.prompt).toContain('atmospheric escape room');
      expect(result.prompt).toContain('workshop');
    });

    it('includes room-specific modifiers in the prompt', async () => {
      mockComfyuiSuccess();

      const labResult = await generateRoomScene('A dark laboratory', 'laboratory');
      expect(labResult.prompt).toContain('laboratory');
      expect(labResult.prompt).toContain('bubbling beakers');
    });
  });

  describe('generatePuzzleIllustration', () => {
    it('generates a puzzle illustration', async () => {
      mockComfyuiSuccess();

      const result = await generatePuzzleIllustration('cipher-lock', 'workshop');

      expect(result).toHaveProperty('type', 'puzzle-illustration');
      expect(result).toHaveProperty('width', 512);
      expect(result).toHaveProperty('height', 512);
      expect(result.prompt).toContain('cipher-lock');
      expect(result.prompt).toContain('workshop');
    });
  });

  describe('generateClueImage', () => {
    it('generates a clue/prop image', async () => {
      mockComfyuiSuccess();

      const result = await generateClueImage('A torn blueprint with red markings');

      expect(result).toHaveProperty('type', 'clue');
      expect(result).toHaveProperty('width', 512);
      expect(result).toHaveProperty('height', 512);
      expect(result.prompt).toContain('torn blueprint');
      expect(result.filename).toContain('clue-');
    });
  });

  describe('batchGenerate', () => {
    it('generates multiple images and returns results', async () => {
      mockComfyuiSuccess();

      const results = await batchGenerate([
        {
          prompt: 'Room 1 background',
          filename: 'room-1',
          type: 'background',
          width: 1280,
          height: 720,
        },
        {
          prompt: 'Room 2 background',
          filename: 'room-2',
          type: 'background',
          width: 1280,
          height: 720,
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('filename');
      expect(results[1]).toHaveProperty('filename');
    });

    it('continues if one image fails', async () => {
      let callCount = 0;
      mockFetch.mockImplementation((url: string, init?: RequestInit) => {
        callCount++;
        if (url.toString().includes('/prompt') && init?.method === 'POST') {
          // First prompt succeeds, second fails
          if (callCount <= 2) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ prompt_id: 'test-ok' }),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Server Error',
          } as Response);
        }

        if (url.toString().includes('/history/')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                'test-ok': {
                  status: { status_str: 'success' },
                  outputs: { '13': { images: [{ filename: 'out.png' }] } },
                },
              }),
          } as Response);
        }

        if (url.toString().includes('/view')) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          } as Response);
        }

        return Promise.resolve({ ok: false } as Response);
      });

      const results = await batchGenerate([
        {
          prompt: 'First image',
          filename: 'first',
          type: 'background',
          width: 1280,
          height: 720,
        },
        {
          prompt: 'Second image',
          filename: 'second',
          type: 'background',
          width: 1280,
          height: 720,
        },
      ]);

      // At least one should succeed
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getGeneratedImage', () => {
    it('returns undefined for unknown image id', () => {
      expect(getGeneratedImage('nonexistent')).toBeUndefined();
    });
  });

  describe('getGenerationStatus', () => {
    it('returns undefined for unknown generation id', () => {
      expect(getGenerationStatus('nonexistent')).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws when ComfyUI POST fails', async () => {
      mockFetch.mockImplementation((url: string, init?: RequestInit) => {
        if (url.toString().includes('/prompt') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          } as Response);
        }
        return Promise.resolve({ ok: false } as Response);
      });

      await expect(
        generateRoomScene('A workshop', 'workshop'),
      ).rejects.toThrow();
    });
  });
});

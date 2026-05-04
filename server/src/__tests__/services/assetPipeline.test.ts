import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateRoomScene = vi.fn();
const mockGeneratePuzzleIllustration = vi.fn();
const mockIsComfyuiAvailable = vi.fn();
const mockGetGeneratedDir = vi.fn();

vi.mock('../../services/imageService.js', () => ({
  generateRoomScene: mockGenerateRoomScene,
  generatePuzzleIllustration: mockGeneratePuzzleIllustration,
  isComfyuiAvailable: mockIsComfyuiAvailable,
  getGeneratedDir: mockGetGeneratedDir,
}));

vi.mock('fs/promises', () => ({
  stat: vi.fn().mockRejectedValue(new Error('ENOENT')),
  readdir: vi.fn().mockResolvedValue([]),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

function makeImage(overrides: Partial<{ id: string; filename: string; type: string; prompt: string }> = {}) {
  return {
    id: overrides.id ?? 'test-id',
    filename: overrides.filename ?? 'test.png',
    prompt: overrides.prompt ?? 'test prompt',
    type: overrides.type ?? 'background',
    width: 1280,
    height: 720,
    createdAt: Date.now(),
    localPath: `/fake/${overrides.filename ?? 'test.png'}`,
  };
}

describe('assetPipeline', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetGeneratedDir.mockReturnValue('/fake/generated');
    const { stat } = vi.mocked(await import('fs/promises'));
    vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));
  });

  describe('preGenerateAssets', () => {
    it('returns empty result when ComfyUI is unavailable', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(false);

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      expect(result.total).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('generates assets for all 5 rooms and their puzzles', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);

      // 5 room backgrounds
      mockGenerateRoomScene
        .mockResolvedValueOnce(makeImage({ filename: 'room-invitation.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-workshop.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-laboratory.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-labyrinth.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-vault.png' }));

      // 10 puzzle illustrations (1 + 2 + 2 + 2 + 3)
      mockGeneratePuzzleIllustration.mockResolvedValue(
        makeImage({ filename: 'puzzle.png', type: 'puzzle-illustration' }),
      );

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      // 5 room backgrounds + 10 puzzle illustrations = 15 total
      expect(result.total).toBe(15);
      expect(result.succeeded).toBe(15);
      expect(result.failed).toBe(0);
      expect(result.assets).toHaveLength(15);
    });

    it('includes backgrounds for all 5 rooms', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);

      mockGenerateRoomScene
        .mockResolvedValueOnce(makeImage({ filename: 'room-invitation.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-workshop.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-laboratory.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-labyrinth.png' }))
        .mockResolvedValueOnce(makeImage({ filename: 'room-vault.png' }));

      mockGeneratePuzzleIllustration.mockResolvedValue(
        makeImage({ filename: 'puzzle.png', type: 'puzzle-illustration' }),
      );

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      const backgrounds = result.assets.filter((a) => a.type === 'background');
      expect(backgrounds).toHaveLength(5);

      const filenames = backgrounds.map((a) => a.filename);
      expect(filenames.some((f) => f.includes('invitation'))).toBe(true);
      expect(filenames.some((f) => f.includes('workshop'))).toBe(true);
      expect(filenames.some((f) => f.includes('laboratory'))).toBe(true);
      expect(filenames.some((f) => f.includes('labyrinth'))).toBe(true);
      expect(filenames.some((f) => f.includes('vault'))).toBe(true);
    });

    it('generates puzzle illustrations for each puzzle instance across rooms', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);

      mockGenerateRoomScene.mockResolvedValue(
        makeImage({ filename: 'room-bg.png' }),
      );

      mockGeneratePuzzleIllustration.mockResolvedValue(
        makeImage({ filename: 'puzzle.png', type: 'puzzle-illustration' }),
      );

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      // 10 puzzle instances total (1 + 2 + 2 + 2 + 3)
      const puzzles = result.assets.filter((a) => a.type === 'puzzle-illustration');
      expect(puzzles).toHaveLength(10);
    });

    it('skips assets that already exist on disk', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);

      const { stat } = await import('fs/promises');
      vi.mocked(stat).mockResolvedValue({ isFile: () => true } as any);

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      expect(result.total).toBe(15);
      expect(result.skipped).toBe(15);
      expect(result.succeeded).toBe(0);
      expect(mockGenerateRoomScene).not.toHaveBeenCalled();
      expect(mockGeneratePuzzleIllustration).not.toHaveBeenCalled();
    });

    it('calls progress callback during generation', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);
      mockGenerateRoomScene.mockResolvedValue(makeImage({ filename: 'bg.png' }));
      mockGeneratePuzzleIllustration.mockResolvedValue(makeImage({ filename: 'pz.png', type: 'puzzle-illustration' }));

      const progressMessages: string[] = [];
      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      await preGenerateAssets((msg) => progressMessages.push(msg));

      expect(progressMessages.length).toBeGreaterThan(0);
      expect(progressMessages.some((m) => m.includes('[GEN]') || m.includes('[OK]'))).toBe(true);
    });

    it('counts failures and continues generating remaining assets', async () => {
      mockIsComfyuiAvailable.mockResolvedValue(true);

      // First background succeeds, second fails
      mockGenerateRoomScene
        .mockResolvedValueOnce(makeImage({ filename: 'room-invitation.png' }))
        .mockRejectedValueOnce(new Error('ComfyUI server error'))
        .mockResolvedValue(makeImage({ filename: 'room-bg.png' }));

      mockGeneratePuzzleIllustration.mockResolvedValue(
        makeImage({ filename: 'puzzle.png', type: 'puzzle-illustration' }),
      );

      const { preGenerateAssets } = await import('../../services/assetPipeline.js');
      const result = await preGenerateAssets();

      expect(result.total).toBe(15);
      expect(result.failed).toBe(1);
      expect(result.succeeded).toBe(14);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('ComfyUI server error');
    });
  });

  describe('listExistingAssets', () => {
    it('returns empty array when directory does not exist', async () => {
      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockRejectedValueOnce(new Error('ENOENT'));

      const { listExistingAssets } = await import('../../services/assetPipeline.js');
      const files = await listExistingAssets();
      expect(files).toEqual([]);
    });

    it('returns only PNG files from generated directory', async () => {
      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce([
        'room-workshop.png',
        'room-laboratory.png',
        'notes.txt',
        'puzzle-cipher-lock-workshop.png',
      ] as any);

      const { listExistingAssets } = await import('../../services/assetPipeline.js');
      const files = await listExistingAssets();
      expect(files).toHaveLength(3);
      expect(files.every((f) => f.endsWith('.png'))).toBe(true);
    });
  });
});

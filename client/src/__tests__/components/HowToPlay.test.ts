import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
  });
});

describe('HowToPlay', () => {
  it('exports the component as default', async () => {
    const mod = await import('../../components/HowToPlay.js');
    expect(mod.default).toBeTypeOf('function');
  });

  it('exports hasSeenHowToPlay helper', async () => {
    const { hasSeenHowToPlay } = await import('../../components/HowToPlay.js');
    expect(hasSeenHowToPlay()).toBe(false);
    localStorage.setItem('escapetwogether-how-to-play-seen', 'true');
    expect(hasSeenHowToPlay()).toBe(true);
  });

  it('exports markHowToPlaySeen helper', async () => {
    const { markHowToPlaySeen, hasSeenHowToPlay } = await import('../../components/HowToPlay.js');
    markHowToPlaySeen();
    expect(hasSeenHowToPlay()).toBe(true);
    expect(localStorage.getItem('escapetwogether-how-to-play-seen')).toBe('true');
  });
});

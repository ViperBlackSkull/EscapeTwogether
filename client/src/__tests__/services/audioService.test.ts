import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Web Audio API
class MockGainNode {
  gain = { value: 0.7, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';
  frequency = { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  detune = { setValueAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode {
  type = 'lowpass';
  frequency = { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  Q = { value: 1, setValueAtTime: vi.fn() };
  connect = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioBuffer {
  sampleRate = 44100;
  length = 44100;
  getChannelData = vi.fn(() => new Float32Array(44100));
}

class MockAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 44100;
  currentTime = 0;
  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn(() => new MockAudioBuffer());
  destination = { connect: vi.fn() };
  resume = vi.fn();
  close = vi.fn();
}

const mockCtx = new MockAudioContext();

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};

vi.stubGlobal('localStorage', localStorageMock);

// We need to import after mocking, but since audioService uses `new AudioContext()` inside init(),
// we can mock the constructor

beforeEach(() => {
  // Reset the module to get fresh instance
  vi.resetModules();
  localStorageMock.clear();

  // Stub AudioContext constructor
  globalThis.AudioContext = class {
    state: AudioContextState = 'running';
    sampleRate = 44100;
    currentTime = 0;
    createGain = mockCtx.createGain;
    createOscillator = mockCtx.createOscillator;
    createBiquadFilter = mockCtx.createBiquadFilter;
    createBufferSource = mockCtx.createBufferSource;
    createBuffer = mockCtx.createBuffer;
    destination = mockCtx.destination;
    resume = mockCtx.resume;
    close = mockCtx.close;
  } as any;

  // Reset mock calls
  vi.clearAllMocks();
});

describe('audioService', () => {
  async function getAudioService() {
    const mod = await import('../../services/audioService.js');
    return mod.audioService;
  }

  it('initializes AudioContext with default preferences', async () => {
    const svc = await getAudioService();
    const ctx = svc.init();

    expect(ctx).toBeTruthy();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it('creates category gain nodes on init', async () => {
    const svc = await getAudioService();
    svc.init();

    // createGain is called for master + 4 categories
    expect(mockCtx.createGain).toHaveBeenCalledTimes(5);
  });

  it('loads preferences from localStorage', async () => {
    localStorageMock.store['escape-twogether-audio'] = JSON.stringify({
      masterVolume: 0.3,
      masterMuted: true,
      categories: { ambient: { volume: 0.5, muted: false }, sfx: { volume: 0.2, muted: true }, notification: { volume: 0.6, muted: false }, music: { volume: 0.4, muted: false } },
    });

    const svc = await getAudioService();
    svc.init();

    const prefs = svc.getPreferences();
    expect(prefs.masterVolume).toBe(0.3);
    expect(prefs.masterMuted).toBe(true);
    expect(prefs.categories.sfx.muted).toBe(true);
  });

  it('saves preferences to localStorage on volume change', async () => {
    const svc = await getAudioService();
    svc.init();
    svc.setMasterVolume(0.5);

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const saved = JSON.parse(localStorageMock.store['escape-twogether-audio']);
    expect(saved.masterVolume).toBe(0.5);
  });

  it('clamps master volume to 0-1', async () => {
    const svc = await getAudioService();
    svc.init();
    svc.setMasterVolume(1.5);
    expect(svc.getMasterVolume()).toBe(1);

    svc.setMasterVolume(-0.5);
    expect(svc.getMasterVolume()).toBe(0);
  });

  it('toggles master mute', async () => {
    const svc = await getAudioService();
    svc.init();
    expect(svc.isMasterMuted()).toBe(false);

    svc.setMasterMuted(true);
    expect(svc.isMasterMuted()).toBe(true);

    svc.setMasterMuted(false);
    expect(svc.isMasterMuted()).toBe(false);
  });

  it('toggles category mute', async () => {
    const svc = await getAudioService();
    svc.init();

    expect(svc.isCategoryMuted('sfx')).toBe(false);
    svc.setCategoryMuted('sfx', true);
    expect(svc.isCategoryMuted('sfx')).toBe(true);

    svc.setCategoryMuted('sfx', false);
    expect(svc.isCategoryMuted('sfx')).toBe(false);
  });

  it('sets category volume', async () => {
    const svc = await getAudioService();
    svc.init();

    svc.setCategoryVolume('ambient', 0.9);
    expect(svc.getCategoryVolume('ambient')).toBe(0.9);
  });

  it('clamps category volume to 0-1', async () => {
    const svc = await getAudioService();
    svc.init();

    svc.setCategoryVolume('sfx', 2.0);
    expect(svc.getCategoryVolume('sfx')).toBe(1);
  });

  it('resumes suspended AudioContext', async () => {
    const svc = await getAudioService();
    svc.init();
    // Manually set state to suspended on the context instance
    const ctx = svc.getContext()!;
    (ctx as any).state = 'suspended';
    svc.ensureResumed();
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('returns null context before init', async () => {
    const svc = await getAudioService();
    expect(svc.getContext()).toBeNull();
  });

  it('returns null category gain before init', async () => {
    const svc = await getAudioService();
    expect(svc.getCategoryGain('sfx')).toBeNull();
  });

  it('returns null createBufferSource before init', async () => {
    const svc = await getAudioService();
    expect(svc.createBufferSource('sfx')).toBeNull();
  });

  it('returns null createNoiseSource before init', async () => {
    const svc = await getAudioService();
    expect(svc.createNoiseSource('sfx')).toBeNull();
  });

  it('playOscillator skips when not initialized', async () => {
    const svc = await getAudioService();
    // Should not throw
    svc.playOscillator('sfx', { type: 'sine', frequency: 440, duration: 0.1, gain: 0.1 });
  });

  it('destroys audio context and cleans up', async () => {
    const svc = await getAudioService();
    svc.init();
    svc.destroy();
    expect(mockCtx.close).toHaveBeenCalled();
    expect(svc.getContext()).toBeNull();
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorageMock.store['escape-twogether-audio'] = 'not-json';
    const svc = await getAudioService();
    svc.init();
    // Should use defaults
    expect(svc.getMasterVolume()).toBe(0.7);
  });

  it('handles localStorage write failure gracefully', async () => {
    localStorageMock.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    const svc = await getAudioService();
    svc.init();
    // Should not throw
    svc.setMasterVolume(0.5);
  });
});

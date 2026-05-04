import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  length = 88200;
  getChannelData = vi.fn(() => new Float32Array(88200));
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
  destination = {};
  resume = vi.fn();
  close = vi.fn();
}

const mockCtx = new MockAudioContext();

const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  vi.resetModules();
  localStorageMock.clear();
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
  vi.clearAllMocks();
});

describe('soundEffects', () => {
  async function getSoundEffects() {
    return await import('../../services/soundEffects.js');
  }

  it('playClick creates oscillator nodes', async () => {
    const { playClick } = await getSoundEffects();
    playClick();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it('playSuccess creates multiple oscillators for arpeggio', async () => {
    const { playSuccess } = await getSoundEffects();
    playSuccess();
    // 4 notes in the arpeggio
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('playError creates sawtooth oscillator', async () => {
    const { playError } = await getSoundEffects();
    playError();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('playNotification creates bell-like tones', async () => {
    const { playNotification } = await getSoundEffects();
    playNotification();
    // Two oscillators for the two-tone bell
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('playDoorUnlock creates noise buffer and oscillator', async () => {
    const { playDoorUnlock } = await getSoundEffects();
    playDoorUnlock();
    expect(mockCtx.createBuffer).toHaveBeenCalled();
    expect(mockCtx.createBufferSource).toHaveBeenCalled();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('playPuzzleComplete creates fanfare with harmonics', async () => {
    const { playPuzzleComplete } = await getSoundEffects();
    playPuzzleComplete();
    // 4 notes + 4 harmonics = 8 oscillators
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(8);
  });

  it('playHint creates filtered noise whoosh', async () => {
    const { playHint } = await getSoundEffects();
    playHint();
    expect(mockCtx.createBuffer).toHaveBeenCalled();
    expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
  });

  it('playMessageSent creates rising tone', async () => {
    const { playMessageSent } = await getSoundEffects();
    playMessageSent();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('playMessageReceived creates falling tone', async () => {
    const { playMessageReceived } = await getSoundEffects();
    playMessageReceived();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });
});

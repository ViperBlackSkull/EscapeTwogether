export type SoundCategory = 'ambient' | 'sfx' | 'notification' | 'music';

interface CategoryState {
  volume: number;
  muted: boolean;
  gainNode: GainNode | null;
}

const STORAGE_KEY = 'escape-twogether-audio';

interface AudioPreferences {
  masterVolume: number;
  masterMuted: boolean;
  categories: Record<SoundCategory, { volume: number; muted: boolean }>;
}

const DEFAULT_PREFS: AudioPreferences = {
  masterVolume: 0.7,
  masterMuted: false,
  categories: {
    ambient: { volume: 0.5, muted: false },
    sfx: { volume: 0.8, muted: false },
    notification: { volume: 0.6, muted: false },
    music: { volume: 0.4, muted: false },
  },
};

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private categories: Map<SoundCategory, CategoryState> = new Map();
  private prefs: AudioPreferences = DEFAULT_PREFS;

  init(): AudioContext {
    if (this.ctx) return this.ctx;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.prefs = this.loadPrefs();
    this.masterGain.gain.value = this.prefs.masterMuted ? 0 : this.prefs.masterVolume;

    for (const [cat, settings] of Object.entries(this.prefs.categories)) {
      const gain = this.ctx.createGain();
      gain.gain.value = settings.muted ? 0 : settings.volume;
      gain.connect(this.masterGain);
      this.categories.set(cat as SoundCategory, {
        volume: settings.volume,
        muted: settings.muted,
        gainNode: gain,
      });
    }

    return this.ctx;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  ensureResumed(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getCategoryGain(category: SoundCategory): GainNode | null {
    return this.categories.get(category)?.gainNode ?? null;
  }

  playOscillator(
    category: SoundCategory,
    config: {
      type: OscillatorType;
      frequency: number | ((t: number) => [number, number][]);
      duration: number;
      gain: number;
      detune?: number;
    },
  ): void {
    const catState = this.categories.get(category);
    if (!catState?.gainNode || !this.ctx || catState.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(catState.gainNode);

    osc.type = config.type;
    if (typeof config.frequency === 'number') {
      osc.frequency.setValueAtTime(config.frequency, this.ctx.currentTime);
    } else {
      const ramps = config.frequency(this.ctx.currentTime);
      osc.frequency.setValueAtTime(ramps[0][0], this.ctx.currentTime);
      for (let i = 1; i < ramps.length; i++) {
        osc.frequency.linearRampToValueAtTime(ramps[i][0], ramps[i][1]);
      }
    }
    if (config.detune) osc.detune.setValueAtTime(config.detune, this.ctx.currentTime);

    gain.gain.setValueAtTime(config.gain, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + config.duration);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + config.duration);
  }

  createBufferSource(category: SoundCategory): { source: AudioBufferSourceNode; gain: GainNode } | null {
    const catState = this.categories.get(category);
    if (!catState?.gainNode || !this.ctx || catState.muted) return null;

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(catState.gainNode);
    return { source, gain };
  }

  createNoiseSource(category: SoundCategory): { source: AudioBufferSourceNode; gain: GainNode } | null {
    if (!this.ctx) return null;
    const catState = this.categories.get(category);
    if (!catState?.gainNode || catState.muted) return null;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(catState.gainNode);
    return { source, gain };
  }

  getMasterVolume(): number {
    return this.prefs.masterVolume;
  }

  setMasterVolume(vol: number): void {
    this.prefs.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.prefs.masterMuted) {
      this.masterGain.gain.value = this.prefs.masterVolume;
    }
    this.savePrefs();
  }

  isMasterMuted(): boolean {
    return this.prefs.masterMuted;
  }

  setMasterMuted(muted: boolean): void {
    this.prefs.masterMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.prefs.masterVolume;
    }
    this.savePrefs();
  }

  getCategoryVolume(category: SoundCategory): number {
    return this.categories.get(category)?.volume ?? 0;
  }

  setCategoryVolume(category: SoundCategory, vol: number): void {
    const state = this.categories.get(category);
    if (!state) return;
    state.volume = Math.max(0, Math.min(1, vol));
    if (state.gainNode && !state.muted) {
      state.gainNode.gain.value = state.volume;
    }
    this.prefs.categories[category].volume = state.volume;
    this.savePrefs();
  }

  isCategoryMuted(category: SoundCategory): boolean {
    return this.categories.get(category)?.muted ?? true;
  }

  setCategoryMuted(category: SoundCategory, muted: boolean): void {
    const state = this.categories.get(category);
    if (!state) return;
    state.muted = muted;
    if (state.gainNode) {
      state.gainNode.gain.value = muted ? 0 : state.volume;
    }
    this.prefs.categories[category].muted = muted;
    this.savePrefs();
  }

  getPreferences(): AudioPreferences {
    return { ...this.prefs };
  }

  private loadPrefs(): AudioPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AudioPreferences>;
        return {
          masterVolume: parsed.masterVolume ?? DEFAULT_PREFS.masterVolume,
          masterMuted: parsed.masterMuted ?? DEFAULT_PREFS.masterMuted,
          categories: {
            ...DEFAULT_PREFS.categories,
            ...parsed.categories,
          },
        };
      }
    } catch {
      // ignore corrupt data
    }
    return { ...DEFAULT_PREFS, categories: { ...DEFAULT_PREFS.categories } };
  }

  private savePrefs(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      // storage unavailable
    }
  }

  destroy(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.categories.clear();
  }
}

export const audioService = new AudioService();

import { audioService } from './audioService.js';

export type AmbientRoomId = 'workshop' | 'laboratory' | 'labyrinth' | 'vault';

interface ActiveAmbient {
  sources: AudioNode[];
  gainNode: GainNode;
}

const CROSSFADE_DURATION = 2;

class AmbientAudioService {
  private active: ActiveAmbient | null = null;
  private fadingOut: ActiveAmbient | null = null;
  private currentRoomId: AmbientRoomId | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  play(roomId: AmbientRoomId): void {
    if (this.currentRoomId === roomId) return;
    this.currentRoomId = roomId;

    audioService.init();
    audioService.ensureResumed();
    const ctx = audioService.getContext();
    const catGain = audioService.getCategoryGain('ambient');
    if (!ctx || !catGain) return;

    const newAmbient = this.createAmbient(ctx, catGain, roomId);
    if (!newAmbient) return;

    // Fade in new ambient
    newAmbient.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    newAmbient.gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + CROSSFADE_DURATION);

    // Crossfade out old ambient
    if (this.active) {
      const old = this.active;
      old.gainNode.gain.setValueAtTime(old.gainNode.gain.value, ctx.currentTime);
      old.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + CROSSFADE_DURATION);
      this.scheduleCleanup(old);
    }

    this.active = newAmbient;
  }

  stop(): void {
    const ctx = audioService.getContext();
    if (this.active && ctx) {
      this.active.gainNode.gain.setValueAtTime(this.active.gainNode.gain.value, ctx.currentTime);
      this.active.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      this.scheduleCleanup(this.active);
      this.active = null;
    }
    this.currentRoomId = null;
  }

  destroy(): void {
    this.cleanupSources(this.active);
    this.cleanupSources(this.fadingOut);
    this.active = null;
    this.fadingOut = null;
    this.currentRoomId = null;
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private createAmbient(ctx: AudioContext, destination: AudioNode, roomId: AmbientRoomId): ActiveAmbient | null {
    const gainNode = ctx.createGain();
    gainNode.connect(destination);
    const sources: AudioNode[] = [];

    switch (roomId) {
      case 'workshop':
        this.createWorkshopAmbient(ctx, gainNode, sources);
        break;
      case 'laboratory':
        this.createLaboratoryAmbient(ctx, gainNode, sources);
        break;
      case 'labyrinth':
        this.createLabyrinthAmbient(ctx, gainNode, sources);
        break;
      case 'vault':
        this.createVaultAmbient(ctx, gainNode, sources);
        break;
    }

    return { sources, gainNode };
  }

  private createWorkshopAmbient(ctx: AudioContext, gain: GainNode, sources: AudioNode[]): void {
    // Rhythmic creaking: low filtered noise pulses
    const creakBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const creakData = creakBuf.getChannelData(0);
    for (let i = 0; i < creakData.length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.pow(Math.sin(t * Math.PI * 0.5), 2) * Math.exp(-t * 0.8);
      creakData[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }
    const creakSource = ctx.createBufferSource();
    creakSource.buffer = creakBuf;
    creakSource.loop = true;
    const creakFilter = ctx.createBiquadFilter();
    creakFilter.type = 'bandpass';
    creakFilter.frequency.value = 300;
    creakFilter.Q.value = 5;
    const creakGain = ctx.createGain();
    creakGain.gain.value = 0.25;
    creakSource.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(gain);
    creakSource.start();
    sources.push(creakSource);

    // Distant ticking: periodic clicks
    const tickOsc = ctx.createOscillator();
    tickOsc.type = 'square';
    tickOsc.frequency.value = 2;
    const tickGain = ctx.createGain();
    tickGain.gain.value = 0.03;
    const tickFilter = ctx.createBiquadFilter();
    tickFilter.type = 'highpass';
    tickFilter.frequency.value = 2000;
    tickOsc.connect(tickFilter);
    tickFilter.connect(tickGain);
    tickGain.connect(gain);
    tickOsc.start();
    sources.push(tickOsc);

    // Low mechanical hum
    const humOsc = ctx.createOscillator();
    humOsc.type = 'sawtooth';
    humOsc.frequency.value = 55;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.04;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 120;
    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(gain);
    humOsc.start();
    sources.push(humOsc);
  }

  private createLaboratoryAmbient(ctx: AudioContext, gain: GainNode, sources: AudioNode[]): void {
    // Electric hum: 60Hz + harmonics
    const humOsc = ctx.createOscillator();
    humOsc.type = 'sawtooth';
    humOsc.frequency.value = 60;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.03;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 300;
    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(gain);
    humOsc.start();
    sources.push(humOsc);

    // Bubbling: filtered noise with slow modulation
    const bubbleBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const bubbleData = bubbleBuf.getChannelData(0);
    for (let i = 0; i < bubbleData.length; i++) {
      const t = i / ctx.sampleRate;
      const mod = 0.5 + 0.5 * Math.sin(t * 4 * Math.PI);
      bubbleData[i] = (Math.random() * 2 - 1) * mod * 0.15;
    }
    const bubbleSource = ctx.createBufferSource();
    bubbleSource.buffer = bubbleBuf;
    bubbleSource.loop = true;
    const bubbleFilter = ctx.createBiquadFilter();
    bubbleFilter.type = 'bandpass';
    bubbleFilter.frequency.value = 800;
    bubbleFilter.Q.value = 8;
    const bubbleGain = ctx.createGain();
    bubbleGain.gain.value = 0.2;
    bubbleSource.connect(bubbleFilter);
    bubbleFilter.connect(bubbleGain);
    bubbleGain.connect(gain);
    bubbleSource.start();
    sources.push(bubbleSource);

    // Periodic beeps
    const beepOsc = ctx.createOscillator();
    beepOsc.type = 'sine';
    beepOsc.frequency.value = 1200;
    const beepGain = ctx.createGain();
    beepGain.gain.value = 0;
    // LFO to gate beeps on/off
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(beepGain.gain);
    beepOsc.connect(beepGain);
    beepGain.connect(gain);
    beepOsc.start();
    lfo.start();
    sources.push(beepOsc, lfo);
  }

  private createLabyrinthAmbient(ctx: AudioContext, gain: GainNode, sources: AudioNode[]): void {
    // Dripping water: periodic short noise bursts
    const dripBuf = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
    const dripData = dripBuf.getChannelData(0);
    const dripInterval = Math.floor(ctx.sampleRate * 1.2);
    for (let drip = 0; drip < 5; drip++) {
      const offset = drip * dripInterval + Math.floor(Math.random() * ctx.sampleRate * 0.4);
      for (let i = 0; i < Math.min(ctx.sampleRate * 0.08, dripBuf.length - offset); i++) {
        const t = i / ctx.sampleRate;
        dripData[offset + i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.5;
      }
    }
    const dripSource = ctx.createBufferSource();
    dripSource.buffer = dripBuf;
    dripSource.loop = true;
    const dripFilter = ctx.createBiquadFilter();
    dripFilter.type = 'bandpass';
    dripFilter.frequency.value = 3000;
    dripFilter.Q.value = 3;
    const dripGain = ctx.createGain();
    dripGain.gain.value = 0.15;
    dripSource.connect(dripFilter);
    dripFilter.connect(dripGain);
    dripGain.connect(gain);
    dripSource.start();
    sources.push(dripSource);

    // Wind: slowly modulated filtered noise
    const windBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const windData = windBuf.getChannelData(0);
    for (let i = 0; i < windData.length; i++) {
      windData[i] = (Math.random() * 2 - 1);
    }
    const windSource = ctx.createBufferSource();
    windSource.buffer = windBuf;
    windSource.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.15;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 200;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(gain);
    windSource.start();
    windLfo.start();
    sources.push(windSource, windLfo);

    // Echoes: reverb-like filtered noise
    const echoBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const echoData = echoBuf.getChannelData(0);
    for (let i = 0; i < echoData.length; i++) {
      const t = i / ctx.sampleRate;
      echoData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 1.5) * 0.1;
    }
    const echoSource = ctx.createBufferSource();
    echoSource.buffer = echoBuf;
    echoSource.loop = true;
    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'bandpass';
    echoFilter.frequency.value = 600;
    echoFilter.Q.value = 2;
    const echoGain = ctx.createGain();
    echoGain.gain.value = 0.15;
    echoSource.connect(echoFilter);
    echoFilter.connect(echoGain);
    echoGain.connect(gain);
    echoSource.start();
    sources.push(echoSource);
  }

  private createVaultAmbient(ctx: AudioContext, gain: GainNode, sources: AudioNode[]): void {
    // Deep resonant drone
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 40;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.08;
    droneOsc.connect(droneGain);
    droneGain.connect(gain);
    droneOsc.start();
    sources.push(droneOsc);

    // Second drone a fifth up for richness
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 60;
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.04;
    drone2.connect(drone2Gain);
    drone2Gain.connect(gain);
    drone2.start();
    sources.push(drone2);

    // Metallic reverberation: filtered noise bursts
    const reverbBuf = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
    const reverbData = reverbBuf.getChannelData(0);
    for (let i = 0; i < reverbData.length; i++) {
      const t = i / ctx.sampleRate;
      const burst = Math.random() < 0.0005 ? 1 : 0;
      reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2) * 0.15 + burst * (Math.random() * 2 - 1) * 0.3;
    }
    const reverbSource = ctx.createBufferSource();
    reverbSource.buffer = reverbBuf;
    reverbSource.loop = true;
    const reverbFilter = ctx.createBiquadFilter();
    reverbFilter.type = 'bandpass';
    reverbFilter.frequency.value = 500;
    reverbFilter.Q.value = 4;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.12;
    reverbSource.connect(reverbFilter);
    reverbFilter.connect(reverbGain);
    reverbGain.connect(gain);
    reverbSource.start();
    sources.push(reverbSource);

    // Slow shimmer: high-frequency oscillator with tremolo
    const shimmerOsc = ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = 2200;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 0.08;
    const shimmerLfoGain = ctx.createGain();
    shimmerLfoGain.gain.value = 0.02;
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain.gain);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(gain);
    shimmerOsc.start();
    shimmerLfo.start();
    sources.push(shimmerOsc, shimmerLfo);
  }

  private scheduleCleanup(ambient: ActiveAmbient): void {
    const oldFading = this.fadingOut;
    if (oldFading) this.cleanupSources(oldFading);
    this.fadingOut = ambient;
    const timer = setTimeout(() => {
      if (this.fadingOut === ambient) {
        this.cleanupSources(ambient);
        this.fadingOut = null;
      }
    }, (CROSSFADE_DURATION + 0.5) * 1000);
    this.timers.push(timer);
  }

  private cleanupSources(ambient: ActiveAmbient | null): void {
    if (!ambient) return;
    for (const node of ambient.sources) {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
      } catch {
        // already stopped
      }
      try { node.disconnect(); } catch { /* ignore */ }
    }
    try { ambient.gainNode.disconnect(); } catch { /* ignore */ }
  }
}

export const ambientAudio = new AmbientAudioService();

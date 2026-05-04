import { audioService } from './audioService.js';

function ensureAudio(): boolean {
  audioService.init();
  audioService.ensureResumed();
  return audioService.getContext() !== null;
}

export function playClick(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(catGain);
  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

export function playSuccess(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(catGain);
    osc.type = 'sine';
    const start = ctx.currentTime + i * 0.12;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export function playError(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(catGain);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

export function playNotification(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('notification');
  if (!catGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(catGain);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(catGain);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);
  gain2.gain.setValueAtTime(0, ctx.currentTime);
  gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc2.start(ctx.currentTime + 0.15);
  osc2.stop(ctx.currentTime + 0.6);
}

export function playDoorUnlock(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  // Metallic slide: filtered noise burst + descending tone
  const bufLen = ctx.sampleRate * 0.6;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
  filter.Q.setValueAtTime(2, ctx.currentTime);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(catGain);
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.6);

  // Descending metallic tone
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.connect(oscGain);
  oscGain.connect(catGain);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
  oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

export function playPuzzleComplete(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  // Triumphant fanfare: major chord arpeggio with harmonics
  const notes = [
    { freq: 523.25, time: 0, dur: 0.8 },
    { freq: 659.25, time: 0.15, dur: 0.7 },
    { freq: 783.99, time: 0.3, dur: 0.6 },
    { freq: 1046.5, time: 0.45, dur: 1.0 },
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(catGain);
    osc.type = 'sine';
    const start = ctx.currentTime + time;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
    gain.gain.setValueAtTime(0.15, start + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.start(start);
    osc.stop(start + dur);

    // Harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(catGain);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, start);
    gain2.gain.setValueAtTime(0, start);
    gain2.gain.linearRampToValueAtTime(0.04, start + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.7);
    osc2.start(start);
    osc2.stop(start + dur * 0.7);
  });
}

export function playHint(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('notification');
  if (!catGain) return;

  // Soft whoosh: filtered noise with rising pitch
  const bufLen = ctx.sampleRate * 0.5;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
  filter.Q.setValueAtTime(1, ctx.currentTime);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(catGain);
  noiseGain.gain.setValueAtTime(0, ctx.currentTime);
  noiseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.5);
}

export function playMessageSent(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(catGain);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playMessageReceived(): void {
  if (!ensureAudio()) return;
  const ctx = audioService.getContext()!;
  const catGain = audioService.getCategoryGain('sfx');
  if (!catGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(catGain);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

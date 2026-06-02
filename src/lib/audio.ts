// Precise Web Audio API Engine for Resonance Lab

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Translate dynamic midi values to frequency
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Root mapping for scale generation
export const ROOT_MIDIS: Record<string, number> = {
  'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
  'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_FORMULAS: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11, 12],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10, 12],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11, 12],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11, 12],
  'Pentatonic Major': [0, 2, 4, 7, 9, 12],
  'Pentatonic Minor': [0, 3, 5, 7, 10, 12],
  'Dorian': [0, 2, 3, 5, 7, 9, 10, 12],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10, 12]
};

export const CHORD_FORMULAS: Record<string, { intervals: number[], name: string }> = {
  'Major triad': { intervals: [0, 4, 7], name: 'Maj' },
  'Minor triad': { intervals: [0, 3, 7], name: 'min' },
  'Diminished triad': { intervals: [0, 3, 6], name: 'dim' },
  'Dominant 7th': { intervals: [0, 4, 7, 10], name: '7' },
  'Major 7th': { intervals: [0, 4, 7, 11], name: 'maj7' },
  'Minor 7th': { intervals: [0, 3, 7, 10], name: 'min7' },
  'Dominant 9th': { intervals: [0, 4, 7, 10, 14], name: '9' }
};

// Circle of Fifths array: Major outer, Minor inner roots
export const CIRCLE_OF_FIFTHS = [
  { major: 'C', minor: 'Am', id: 0, sharpsFlats: '0 ♯/♭', degreeName: 'Tonic' },
  { major: 'G', minor: 'Em', id: 1, sharpsFlats: '1 ♯', degreeName: 'Dominant' },
  { major: 'D', minor: 'Bm', id: 2, sharpsFlats: '2 ♯', degreeName: 'Subdominant Of Dominant' },
  { major: 'A', minor: 'F#m', id: 3, sharpsFlats: '3 ♯', degreeName: 'Supertonic' },
  { major: 'E', minor: 'C#m', id: 4, sharpsFlats: '4 ♯', degreeName: 'Mediant' },
  { major: 'B', minor: 'G#m', id: 5, sharpsFlats: '5 ♯', degreeName: 'Leading Tone' },
  { major: 'F#', minor: 'D#m', id: 6, sharpsFlats: '6 ♯ / 6 ♭', degreeName: 'Tritone' },
  { major: 'C#', minor: 'A#m', id: 7, sharpsFlats: '7 ♯', degreeName: 'Neapolitan key' },
  { major: 'Ab', minor: 'Fm', id: 8, sharpsFlats: '4 ♭', degreeName: 'Flat Submediant' },
  { major: 'Eb', minor: 'Cm', id: 9, sharpsFlats: '3 ♭', degreeName: 'Flat Mediant' },
  { major: 'Bb', minor: 'Gm', id: 10, sharpsFlats: '2 ♭', degreeName: 'Supertonic Flat' },
  { major: 'F', minor: 'Dm', id: 11, sharpsFlats: '1 ♭', degreeName: 'Subdominant' }
];

export type BeatSoundType = 'woodblock' | 'beep' | 'drum' | 'cowbell' | 'hihat' | 'bell' | 'shaker' | 'clap' | 'marimba' | 'rimshot' | 'sine';

// Reusable noise buffer for shaker, hihat, clap, rimshot
let noiseBuffer: AudioBuffer | null = null;
export function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

// Play a synthesized single note nicely
export function playSynthNote(freq: number, duration: number, type: BeatSoundType = 'sine', volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    
    // For non-tonal/percussion clicks, we can route directly to triggerClickAtTime
    if (type !== 'sine' && type !== 'beep' && type !== 'woodblock' && type !== 'drum' && type !== 'bell' && type !== 'marimba') {
      triggerClickAtTime(ctx, ctx.currentTime, freq, type, volume);
      return;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    if (type === 'beep') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
    } else if (type === 'woodblock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Quick pitch drop for realistic knock
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.05);
    } else if (type === 'drum') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1, ctx.currentTime + 0.08); // rapid kick pitch sweep
    } else if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.5, ctx.currentTime);
      overtoneGain.gain.setValueAtTime(0, ctx.currentTime);
      overtoneGain.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 0.005);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);
      overtone.start(ctx.currentTime);
      overtone.stop(ctx.currentTime + 0.1);
    } else if (type === 'marimba') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 3.0, ctx.currentTime);
      overtoneGain.gain.setValueAtTime(0, ctx.currentTime);
      overtoneGain.gain.linearRampToValueAtTime(volume * 0.25, ctx.currentTime + 0.002);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);
      overtone.start(ctx.currentTime);
      overtone.stop(ctx.currentTime + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
    }

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Audio execution failed/blocked:', err);
  }
}

// Play chord voices (array of frequencies)
export function playSynthChord(freqs: number[], duration: number, volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const delayStagger = idx * 0.025; // Subtle arpeggiated voicing strum

      gainNode.gain.setValueAtTime(0, ctx.currentTime + delayStagger);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, ctx.currentTime + delayStagger + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delayStagger + duration);

      osc.type = 'triangle'; // triangle sounds richer for organs/chords
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delayStagger);

      osc.start(ctx.currentTime + delayStagger);
      osc.stop(ctx.currentTime + delayStagger + duration);
    });
  } catch (err) {
    console.warn('Audio execution failed/blocked:', err);
  }
}

// Click Trigger for scheduler metronome
export function triggerClickAtTime(
  ctx: AudioContext,
  time: number,
  freq: number,
  type: BeatSoundType = 'beep',
  volume: number = 1
) {
  try {
    const mainGain = ctx.createGain();
    mainGain.connect(ctx.destination);

    if (type === 'beep' || type === 'sine') {
      const osc = ctx.createOscillator();
      osc.connect(mainGain);
      osc.type = type === 'beep' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, time);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.004);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.start(time);
      osc.stop(time + 0.15);
    } 
    else if (type === 'woodblock') {
      const osc = ctx.createOscillator();
      osc.connect(mainGain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.35, time + 0.04);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.6, time + 0.003);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

      osc.start(time);
      osc.stop(time + 0.12);
    } 
    else if (type === 'drum') { // Kick model
      const osc = ctx.createOscillator();
      osc.connect(mainGain);
      osc.type = 'sine';
      // Low punchy sweep
      const kickFreq = freq < 200 ? freq : 110; 
      osc.frequency.setValueAtTime(kickFreq * 2.2, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.07);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.8, time + 0.002);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc.start(time);
      osc.stop(time + 0.16);
    } 
    else if (type === 'cowbell') {
      // 808 Cowbell is dual-square wave with highpass
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const bandpass = ctx.createBiquadFilter();
      
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1000, time);
      bandpass.Q.setValueAtTime(1.5, time);

      osc1.type = 'square';
      osc2.type = 'square';
      
      const fBase = freq > 400 ? freq : 540;
      osc1.frequency.setValueAtTime(fBase, time);
      osc2.frequency.setValueAtTime(fBase * 1.481, time); // 1.48 ratio approximate

      osc1.connect(bandpass);
      osc2.connect(bandpass);
      bandpass.connect(mainGain);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.45, time + 0.005);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.18);
      osc2.stop(time + 0.18);
    } 
    else if (type === 'hihat') {
      // Crisp synthetic noise hihat
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(8000, time);

      noise.connect(highpass);
      highpass.connect(mainGain);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.35, time + 0.002);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045); // highly crisp short tick

      noise.start(time);
      noise.stop(time + 0.06);
    } 
    else if (type === 'shaker') {
      // Noise with slightly broader envelope and mid-high filter
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(4500, time);
      bandpass.Q.setValueAtTime(2.0, time);

      noise.connect(bandpass);
      bandpass.connect(mainGain);

      mainGain.gain.setValueAtTime(0, time);
      // Soft attack shake definition
      mainGain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.012);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.095);

      noise.start(time);
      noise.stop(time + 0.12);
    } 
    else if (type === 'bell') {
      // Crystal glass bell with overtones
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      const bellFreq = freq > 450 ? freq : 1200;
      osc1.frequency.setValueAtTime(bellFreq, time);
      osc2.frequency.setValueAtTime(bellFreq * 2.5, time); // 5th partial crystal sound

      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, time);
      g2.gain.linearRampToValueAtTime(volume * 0.12, time + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, time + 0.06); // fast secondary decay

      osc1.connect(mainGain);
      osc2.connect(g2);
      g2.connect(ctx.destination);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.003);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45); // ring resonance decay

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.5);
      osc2.stop(time + 0.1);
    } 
    else if (type === 'clap') {
      // Overlay double/triple noise tick snaps
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, time);
      bandpass.Q.setValueAtTime(1.0, time);

      noise.connect(bandpass);
      bandpass.connect(mainGain);

      // Clap double-tap envelope
      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.001);
      mainGain.gain.setValueAtTime(volume * 0.1, time + 0.01);
      mainGain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.012);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

      noise.start(time);
      noise.stop(time + 0.13);
    } 
    else if (type === 'marimba') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 3.0, time); // acoustic wooden overtone third-harmonic

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0, time);
      overtoneGain.gain.linearRampToValueAtTime(volume * 0.25, time + 0.002);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025); // overtone dies instantly

      osc1.connect(mainGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.004);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.16);
      osc2.stop(time + 0.04);
    } 
    else if (type === 'rimshot') {
      const osc = ctx.createOscillator();
      const bandpass = ctx.createBiquadFilter();
      
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, time);
      bandpass.Q.setValueAtTime(1.5, time);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.8, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.02);

      osc.connect(bandpass);
      bandpass.connect(mainGain);

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(volume * 0.65, time + 0.002);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04); // high snappy decay

      osc.start(time);
      osc.stop(time + 0.05);
    }
  } catch (err) {
    console.warn('Click visual trigger failed:', err);
  }
}

// Complex Drum Groove Scheduler
export function triggerGrooveAtTime(
  ctx: AudioContext,
  time: number,
  bpm: number,
  beatIndex: number,
  grooveType: 'basic-rock' | 'funk' | 'jazz',
  volume: number = 1
) {
  const secondsPerBeat = 60 / bpm;
  const eighth = secondsPerBeat / 2;

  if (grooveType === 'basic-rock') {
    // 1: Kick, 2: Snare, 3: Kick, 4: Snare | All have 8th note hihats
    // Hi-hats
    triggerClickAtTime(ctx, time, 1000, 'hihat', volume * 0.4);
    triggerClickAtTime(ctx, time + eighth, 1000, 'hihat', volume * 0.25);

    if (beatIndex === 0 || beatIndex === 2) {
      triggerClickAtTime(ctx, time, 100, 'drum', volume * 0.8);
    } else if (beatIndex === 1 || beatIndex === 3) {
      triggerClickAtTime(ctx, time, 1000, 'rimshot', volume * 0.7);
    }
  } 
  else if (grooveType === 'funk') {
    // Syncopated funk feel
    triggerClickAtTime(ctx, time, 1000, 'hihat', volume * 0.5);
    
    if (beatIndex === 0) {
      triggerClickAtTime(ctx, time, 100, 'drum', volume * 0.9);
      triggerClickAtTime(ctx, time + eighth * 0.5, 100, 'drum', volume * 0.4);
    } else if (beatIndex === 1) {
      triggerClickAtTime(ctx, time, 1000, 'rimshot', volume * 0.8);
    } else if (beatIndex === 2) {
      triggerClickAtTime(ctx, time + eighth, 100, 'drum', volume * 0.6);
    } else if (beatIndex === 3) {
      triggerClickAtTime(ctx, time, 1000, 'rimshot', volume * 0.8);
      triggerClickAtTime(ctx, time + eighth * 1.5, 1000, 'hihat', volume * 0.3);
    }
  }
  else if (grooveType === 'jazz') {
    // Swing / Jazz ride pattern: 1, 2-and, 3, 4-and
    triggerClickAtTime(ctx, time, 1000, 'bell', volume * 0.3); // Ride cymbal proxy
    
    const swingOffset = eighth * 1.33; // Triplet-feel offset
    
    if (beatIndex === 1 || beatIndex === 3) {
      triggerClickAtTime(ctx, time + swingOffset, 1000, 'hihat', volume * 0.4);
      triggerClickAtTime(ctx, time, 1000, 'hihat', volume * 0.6); // Foot hi-hat on 2 and 4
    }
    
    if (beatIndex === 0) {
      triggerClickAtTime(ctx, time, 100, 'drum', volume * 0.4); // Feathered kick
    }
  }
}

// Frequency to Note name converter
export function freqToNote(frequency: number): { note: string; octave: number; cents: number } {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const roundedNoteNum = Math.round(noteNum) + 69;
  const note = NOTE_NAMES[roundedNoteNum % 12];
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  const cents = Math.round(100 * (noteNum - Math.round(noteNum)));
  return { note, octave, cents };
}

// Basic Autocorrelation Pitch Detection
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // Not enough signal

  let r1 = 0, r2 = SIZE - 1, threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }

  const buf = buffer.slice(r1, r2);
  const size = buf.length;

  const c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

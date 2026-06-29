// @ts-nocheck
// Audio Engine for MPC Sampler — Full Featured

let audioCtx: AudioContext | null = null;
export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// ─── Recording ───────────────────────────────────────────
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export const startRecording = async (): Promise<void> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.start();
};

export const stopRecording = (): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) return reject(new Error("No recording in progress"));
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = getAudioContext();
      try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (err) { reject(err); }
      mediaRecorder?.stream.getTracks().forEach(t => t.stop());
      mediaRecorder = null;
    };
    mediaRecorder.stop();
  });
};

// ─── Slice / Chop ────────────────────────────────────────
export interface Slice {
  id: number;
  start: number;
  end: number;
}

export const autoChop = (buffer: AudioBuffer, numSlices: number = 16): Slice[] => {
  const duration = buffer.duration;
  const sliceLength = duration / numSlices;
  return Array.from({ length: numSlices }, (_, i) => ({
    id: i + 1,
    start: i * sliceLength,
    end: (i + 1) * sliceLength,
  }));
};

// ─── Playback ────────────────────────────────────────────
export const playSlice = (
  buffer: AudioBuffer, start: number, end: number,
  volume = 1, pitchOffset = 0, filterCutoff = 20000, loop = false
) => {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  if (loop) { source.loopStart = start; source.loopEnd = end; }
  if (pitchOffset !== 0) source.playbackRate.value = Math.pow(2, pitchOffset / 12);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterCutoff;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);

  if (!loop) {
    const duration = (end - start) / source.playbackRate.value;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + Math.max(0, duration - 0.005));
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    source.start(ctx.currentTime, start, duration);
  } else {
    source.start(ctx.currentTime, start);
  }

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  return { source, gainNode, filter };
};

export const stopAudioNodes = (nodes: any) => {
  if (!nodes) return;
  const ctx = getAudioContext();
  if (nodes.gainNode) {
    const g = nodes.gainNode.gain.value;
    nodes.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    nodes.gainNode.gain.setValueAtTime(g, ctx.currentTime);
    nodes.gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
    nodes.gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.02);
  }
  if (nodes.source) setTimeout(() => { try { nodes.source.stop(); } catch(e){} }, 25);
};

// ─── Expanded Synth Engine ───────────────────────────────
// All synth functions return { source, gainNode } for Note-On gating

const synthOut = (ctx: AudioContext) => {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  return gain;
};

export const synthFunctions: Record<string, (ctx: AudioContext) => any> = {
  kick_deep: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.connect(g);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    g.gain.setValueAtTime(1.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  kick_hard: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.connect(g);
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    g.gain.setValueAtTime(2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  kick_909: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'sine';
    osc.connect(g);
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    g.gain.setValueAtTime(1.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  snare: (ctx) => {
    // Body
    const osc = ctx.createOscillator(); const g1 = synthOut(ctx);
    osc.type = 'triangle'; osc.frequency.value = 250;
    osc.connect(g1);
    g1.gain.setValueAtTime(0.8, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    // Noise
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=1500;
    const g2 = synthOut(ctx);
    ns.connect(flt); flt.connect(g2);
    g2.gain.setValueAtTime(0.7, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    ns.start(ctx.currentTime);
    return { source: osc, gainNode: g1 };
  },
  snare_909: (ctx) => {
    const osc = ctx.createOscillator(); const g1 = synthOut(ctx);
    osc.type = 'triangle'; osc.frequency.value = 300;
    osc.connect(g1);
    g1.gain.setValueAtTime(1, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=2000;
    const g2 = synthOut(ctx);
    ns.connect(flt); flt.connect(g2);
    g2.gain.setValueAtTime(0.8, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    ns.start(ctx.currentTime);
    return { source: osc, gainNode: g1 };
  },
  hihat_closed: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=7000;
    const g = synthOut(ctx);
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.6, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  hihat_open: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=6000;
    const g = synthOut(ctx);
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  clap: (ctx) => {
    const makeNoise = (delay: number, dur: number, vol: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      const ns = ctx.createBufferSource(); ns.buffer = buf;
      const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=1500; flt.Q.value=3;
      const g = synthOut(ctx);
      ns.connect(flt); flt.connect(g);
      g.gain.setValueAtTime(vol, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      ns.start(ctx.currentTime + delay);
      return { source: ns, gainNode: g };
    };
    makeNoise(0, 0.02, 0.5);
    makeNoise(0.015, 0.02, 0.5);
    return makeNoise(0.03, 0.25, 0.7);
  },
  tom_low: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.connect(g);
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
    g.gain.setValueAtTime(1.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  tom_mid: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.connect(g);
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(1.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  tom_high: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.connect(g);
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(1.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  rim: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'square';
    osc.connect(g);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    g.gain.setValueAtTime(0.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  cowbell: (ctx) => {
    const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
    const g = synthOut(ctx);
    osc1.type = 'square'; osc2.type = 'square';
    osc1.frequency.value = 540; osc2.frequency.value = 800;
    osc1.connect(g); osc2.connect(g);
    g.gain.setValueAtTime(0.6, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime); osc2.start(ctx.currentTime);
    return { source: osc1, gainNode: g };
  },
  clave: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'triangle'; osc.frequency.value = 2500;
    osc.connect(g);
    g.gain.setValueAtTime(0.7, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  clave_hi: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'triangle'; osc.frequency.value = 3500;
    osc.connect(g);
    g.gain.setValueAtTime(0.7, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  crash: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=3000;
    const g = synthOut(ctx);
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  ride: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=8000; flt.Q.value=2;
    const g = synthOut(ctx);
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  shaker: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=10000; flt.Q.value=5;
    const g = synthOut(ctx);
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  noise_hit: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const g = synthOut(ctx);
    ns.connect(g);
    g.gain.setValueAtTime(0.6, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    ns.start(ctx.currentTime);
    return { source: ns, gainNode: g };
  },
  // Bass notes for Lo-Fi / Trap kits
  bass_c: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'sawtooth'; osc.frequency.value = 65.41;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  bass_d: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'sawtooth'; osc.frequency.value = 73.42;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  bass_e: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'sawtooth'; osc.frequency.value = 82.41;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  bass_g: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx);
    osc.type = 'sawtooth'; osc.frequency.value = 98.00;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    return { source: osc, gainNode: g };
  },
  // Chord stabs
  chord_cm: (ctx) => {
    const g = synthOut(ctx);
    [261.63, 311.13, 392.00].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(ctx.currentTime);
    });
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    return { source: null, gainNode: g };
  },
  chord_fm: (ctx) => {
    const g = synthOut(ctx);
    [349.23, 415.30, 523.25].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(ctx.currentTime);
    });
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    return { source: null, gainNode: g };
  },
  chord_gm: (ctx) => {
    const g = synthOut(ctx);
    [392.00, 466.16, 587.33].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(ctx.currentTime);
    });
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    return { source: null, gainNode: g };
  },
  chord_bb: (ctx) => {
    const g = synthOut(ctx);
    [466.16, 587.33, 698.46].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(ctx.currentTime);
    });
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    return { source: null, gainNode: g };
  },
};

// ─── Step Sequencer Engine ───────────────────────────────
let seqInterval: ReturnType<typeof setInterval> | null = null;
let seqStep = 0;

export const startSequencer = (
  bpm: number,
  tracks: { padId: number; steps: boolean[] }[],
  onStep: (step: number) => void,
  triggerPad: (id: number) => void,
) => {
  stopSequencer();
  seqStep = 0;
  const intervalMs = (60 / bpm / 4) * 1000; // 16th notes
  seqInterval = setInterval(() => {
    tracks.forEach(track => {
      if (track.steps[seqStep]) triggerPad(track.padId);
    });
    onStep(seqStep);
    seqStep = (seqStep + 1) % 16;
  }, intervalMs);
};

export const stopSequencer = () => {
  if (seqInterval) { clearInterval(seqInterval); seqInterval = null; }
  seqStep = 0;
};

export const isSequencerRunning = () => seqInterval !== null;

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

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let analyserNode: AnalyserNode | null = null;
let micStream: MediaStream | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

export const startMicMonitor = async (): Promise<void> => {
  if (micStream) return;
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = getAudioContext();
  sourceNode = ctx.createMediaStreamSource(micStream);
  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 256;
  sourceNode.connect(analyserNode);
};

export const stopMicMonitor = (): void => {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (analyserNode) {
    analyserNode.disconnect();
    analyserNode = null;
  }
};

export const getMicLevel = (): number => {
  if (!analyserNode) return 0;
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const val = (dataArray[i] - 128) / 128;
    sum += val * val;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  // Convert RMS to a percentage roughly (0-100)
  return Math.min(100, rms * 400); 
};

export const startRecording = async (): Promise<void> => {
  await startMicMonitor();
  if (!micStream) throw new Error("No mic stream");
  mediaRecorder = new MediaRecorder(micStream);
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
      mediaRecorder = null;
      // keep monitor active if we are still in Sample Record mode? 
      // Actually we let the component handle stopMicMonitor when it unmounts or leaves mode
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
  volume = 1, pitchOffset = 0, filterCutoff = 20000, loop = false, time?: number
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
  const t = time !== undefined ? time : ctx.currentTime;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(volume, t + 0.005);

  if (!loop) {
    const duration = (end - start) / source.playbackRate.value;
    gainNode.gain.setValueAtTime(volume, t + Math.max(0, duration - 0.005));
    gainNode.gain.linearRampToValueAtTime(0, t + duration);
    source.start(t, start, duration);
  } else {
    source.start(t, start);
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
    nodes.gainNode.gain.cancelScheduledValues(t);
    nodes.gainNode.gain.setValueAtTime(g, t);
    nodes.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    nodes.gainNode.gain.setValueAtTime(0, t + 0.02);
  }
  if (nodes.source) setTimeout(() => { try { nodes.source.stop(); } catch(e){} }, 25);
};

// ─── Expanded Synth Engine ───────────────────────────────
// All synth functions return { source, gainNode } for Note-On gating

const synthOut = (ctx: AudioContext, time?: number) => {
      const t = time !== undefined ? time : ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  return gain;
};

export const synthFunctions: Record<string, (ctx: AudioContext, time?: number) => any> = {
  kick_deep: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.connect(g);
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.8);
    g.gain.setValueAtTime(1.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  kick_hard: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.connect(g);
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    g.gain.setValueAtTime(2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  kick_909: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'sine';
    osc.connect(g);
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.6);
    g.gain.setValueAtTime(1.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  snare: (ctx) => {
    // Body
    const osc = ctx.createOscillator(); const g1 = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'triangle'; osc.frequency.value = 250;
    osc.connect(g1);
    g1.gain.setValueAtTime(0.8, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    // Noise
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=1500;
    const g2 = synthOut(ctx);
    ns.connect(flt); flt.connect(g2);
    g2.gain.setValueAtTime(0.7, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    ns.start(t);
    return { source: osc, gainNode: g1 };
  },
  snare_909: (ctx) => {
    const osc = ctx.createOscillator(); const g1 = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'triangle'; osc.frequency.value = 300;
    osc.connect(g1);
    g1.gain.setValueAtTime(1, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=2000;
    const g2 = synthOut(ctx);
    ns.connect(flt); flt.connect(g2);
    g2.gain.setValueAtTime(0.8, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    ns.start(t);
    return { source: osc, gainNode: g1 };
  },
  hihat_closed: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=7000;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  hihat_open: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=6000;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  clap: (ctx) => {
    const makeNoise = (delay: number, dur: number, vol: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      const ns = ctx.createBufferSource(); ns.buffer = buf;
      const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=1500; flt.Q.value=3;
      const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
      ns.connect(flt); flt.connect(g);
      g.gain.setValueAtTime(vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      ns.start(t + delay);
      return { source: ns, gainNode: g };
    };
    makeNoise(0, 0.02, 0.5);
    makeNoise(0.015, 0.02, 0.5);
    return makeNoise(0.03, 0.25, 0.7);
  },
  tom_low: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.connect(g);
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.4);
    g.gain.setValueAtTime(1.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  tom_mid: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.connect(g);
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.35);
    g.gain.setValueAtTime(1.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  tom_high: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.connect(g);
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    g.gain.setValueAtTime(1.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  rim: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'square';
    osc.connect(g);
    osc.frequency.setValueAtTime(800, t);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  cowbell: (ctx) => {
    const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc1.type = 'square'; osc2.type = 'square';
    osc1.frequency.value = 540; osc2.frequency.value = 800;
    osc1.connect(g); osc2.connect(g);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc1.start(t); osc2.start(t);
    return { source: osc1, gainNode: g };
  },
  clave: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'triangle'; osc.frequency.value = 2500;
    osc.connect(g);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  clave_hi: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'triangle'; osc.frequency.value = 3500;
    osc.connect(g);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  crash: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=3000;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  ride: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=8000; flt.Q.value=2;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  shaker: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=10000; flt.Q.value=5;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  noise_hit: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    ns.connect(g);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    ns.start(t);
    return { source: ns, gainNode: g };
  },
  // Bass notes for Lo-Fi / Trap kits
  bass_c: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'sawtooth'; osc.frequency.value = 65.41;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  bass_d: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'sawtooth'; osc.frequency.value = 73.42;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  bass_e: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'sawtooth'; osc.frequency.value = 82.41;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  bass_g: (ctx) => {
    const osc = ctx.createOscillator(); const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    osc.type = 'sawtooth'; osc.frequency.value = 98.00;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=400;
    osc.connect(flt); flt.connect(g);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    return { source: osc, gainNode: g };
  },
  // Chord stabs
  chord_cm: (ctx) => {
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    [261.63, 311.13, 392.00].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(t);
    });
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    return { source: null, gainNode: g };
  },
  chord_fm: (ctx) => {
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    [349.23, 415.30, 523.25].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(t);
    });
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    return { source: null, gainNode: g };
  },
  chord_gm: (ctx) => {
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    [392.00, 466.16, 587.33].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(t);
    });
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    return { source: null, gainNode: g };
  },
  chord_bb: (ctx) => {
    const g = synthOut(ctx); const t = time !== undefined ? time : ctx.currentTime;
    [466.16, 587.33, 698.46].forEach(f => {
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.connect(g); o.start(t);
    });
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
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
  triggerPad: (id: number, time?: number) => void,
) => {
  stopSequencer();
  seqStep = 0;
  let nextNoteTime = getAudioContext().currentTime;

  const scheduler = () => {
    const ctx = getAudioContext();
    // Schedule notes up to 0.1s in the future
    while (nextNoteTime < ctx.currentTime + 0.1) {
      const currentStep = seqStep;
      
      // Schedule visual update via timeout
      const timeToPlay = nextNoteTime - ctx.currentTime;
      setTimeout(() => onStep(currentStep), Math.max(0, timeToPlay * 1000));
      
      tracks.forEach(track => {
        if (track.steps[currentStep]) {
          triggerPad(track.padId, nextNoteTime);
        }
      });
      
      // Advance step
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime += 0.25 * secondsPerBeat; // 16th note
      seqStep = (seqStep + 1) % 16;
    }
    seqInterval = window.setTimeout(scheduler, 25.0) as any;
  };
  
  scheduler();
};

export const stopSequencer = () => {
  if (seqInterval) { clearTimeout(seqInterval); seqInterval = null; }
  seqStep = 0;
};

export const isSequencerRunning = () => seqInterval !== null;

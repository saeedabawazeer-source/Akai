// Audio Engine for MPC Sampler

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

export const startRecording = async (): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    
    mediaRecorder.start();
  } catch (err) {
    console.error("Microphone access denied or error occurred:", err);
    throw err;
  }
};

export const stopRecording = (): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      return reject(new Error("No recording in progress"));
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = getAudioContext();
      
      try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (err) {
        reject(err);
      }
      
      // Cleanup stream
      mediaRecorder?.stream.getTracks().forEach(t => t.stop());
      mediaRecorder = null;
    };
    
    mediaRecorder.stop();
  });
};

export interface Slice {
  id: number;
  start: number;
  end: number;
}

export const autoChop = (buffer: AudioBuffer, numSlices: number = 16): Slice[] => {
  const duration = buffer.duration;
  const sliceLength = duration / numSlices;
  const slices: Slice[] = [];
  
  for (let i = 0; i < numSlices; i++) {
    slices.push({
      id: i + 1, // Pads 1-16
      start: i * sliceLength,
      end: (i + 1) * sliceLength,
    });
  }
  
  return slices;
};

export const playSlice = (
  buffer: AudioBuffer,
  start: number,
  end: number,
  volume: number = 1,
  pitchOffset: number = 0 // in semitones
): AudioBufferSourceNode => {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  // Apply pitch shift (playbackRate)
  // 1.0 = original pitch, 2.0 = octave up, 0.5 = octave down
  if (pitchOffset !== 0) {
    source.playbackRate.value = Math.pow(2, pitchOffset / 12);
  }
  
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  
  // Slight attack/release to prevent clicks
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
  
  // Calculate when to start releasing based on duration, adjusting for playbackRate
  const duration = (end - start) / source.playbackRate.value;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.005);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start(ctx.currentTime, start, duration);
  
  return source;
};

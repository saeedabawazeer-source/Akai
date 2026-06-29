// Shared types for MPC state management

export type ScreenMode = 
  | 'MAIN' 
  | 'SAMPLE_EDIT' 
  | 'SAMPLE_RECORD' 
  | 'SEQUENCE' 
  | 'SONG' 
  | 'PAD_FX' 
  | 'KNOB_FX' 
  | 'PROGRAM_EDIT' 
  | 'BROWSER' 
  | 'MIXER';

export type PlayMode = 'ONE SHOT' | 'NOTE ON' | 'LOOP';
export type PadBank = 'A' | 'B' | 'C' | 'D';
export type SampleEditTab = 'Trim' | 'Chop' | 'Program';
export type ProgramEditTab = 'Layer' | 'Tune' | 'Filter' | 'Amp';

export interface Slice {
  id: number;
  start: number;
  end: number;
}

export interface PadSettings {
  tune: number;        // -24 to +24 semitones
  filterFreq: number;  // 20 to 20000 Hz
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  filterRes: number;   // 0 to 20
  attack: number;      // 0 to 2 seconds
  decay: number;       // 0 to 2 seconds
  sustain: number;     // 0 to 1
  release: number;     // 0 to 5 seconds
  volume: number;      // 0 to 100
  pan: number;         // -50 to 50
  muted: boolean;
  soloed: boolean;
  layers: number[];    // indices of layered samples
}

export interface SequenceStep {
  active: boolean;
  velocity: number;   // 0-127
  padId: number;
}

export interface SequenceTrack {
  padId: number;
  steps: boolean[];   // 16 steps
}

export interface Song {
  sequences: number[];  // ordered list of sequence indices
}

export interface KnobMapping {
  label: string;
  param: string;
  value: number;
  min: number;
  max: number;
}

export interface PadFXSlot {
  name: string;
  type: 'lpf' | 'hpf' | 'delay' | 'reverb' | 'flanger' | 'bitcrush' | 'vinylstop' | 'gate';
  active: boolean;
  params: Record<string, number>;
}

export interface PresetKit {
  name: string;
  pads: { name: string; synthType: string }[];
}

export const DEFAULT_PAD_SETTINGS: PadSettings = {
  tune: 0,
  filterFreq: 20000,
  filterType: 'lowpass',
  filterRes: 0,
  attack: 0,
  decay: 0.3,
  sustain: 0.8,
  release: 0.1,
  volume: 80,
  pan: 0,
  muted: false,
  soloed: false,
  layers: [],
};

export const PRESET_KITS: PresetKit[] = [

  {
    name: 'House Kit',
    pads: [
      { name: 'House Kick', synthType: 'kick_909' },
      { name: 'House Snare', synthType: 'snare_909' },
      { name: 'House CH', synthType: 'hihat_closed' },
      { name: 'House OH', synthType: 'hihat_open' },
      { name: 'Punch Kick', synthType: 'kick_hard' },
      { name: 'House Clap', synthType: 'clap' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Ride', synthType: 'ride' },
      { name: 'Bass C', synthType: 'bass_c' },
      { name: 'Bass D', synthType: 'bass_d' },
      { name: 'Bass E', synthType: 'bass_e' },
      { name: 'Bass G', synthType: 'bass_g' },
      { name: 'Stab Cm', synthType: 'chord_cm' },
      { name: 'Stab Fm', synthType: 'chord_fm' },
      { name: 'Stab Gm', synthType: 'chord_gm' },
      { name: 'Stab Bb', synthType: 'chord_bb' },
    ],
  },
  {
    name: 'Drill Kit',
    pads: [
      { name: 'Slide 808', synthType: 'kick_deep' },
      { name: 'Drill Snare', synthType: 'snare' },
      { name: 'Drill Hat 1', synthType: 'hihat_closed' },
      { name: 'Drill Hat 2', synthType: 'hihat_open' },
      { name: 'Punch Kick', synthType: 'kick_hard' },
      { name: 'Counter Snr', synthType: 'clap' },
      { name: 'Perc', synthType: 'clave' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Glitch C', synthType: 'bass_c' },
      { name: 'Glitch D', synthType: 'bass_d' },
      { name: 'Glitch E', synthType: 'bass_e' },
      { name: 'Glitch G', synthType: 'bass_g' },
      { name: 'Dark Bell 1', synthType: 'chord_cm' },
      { name: 'Dark Bell 2', synthType: 'chord_fm' },
      { name: 'Dark Bell 3', synthType: 'chord_gm' },
      { name: 'Crash', synthType: 'crash' },
    ],
  },
  {
    name: 'Acoustic Kit',
    pads: [
      { name: 'Kick', synthType: 'kick_hard' },
      { name: 'Snare', synthType: 'snare' },
      { name: 'Hat Closed', synthType: 'hihat_closed' },
      { name: 'Hat Open', synthType: 'hihat_open' },
      { name: 'Kick Alt', synthType: 'kick_deep' },
      { name: 'Snare Alt', synthType: 'snare_909' },
      { name: 'Stick', synthType: 'clave' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Tom Floor', synthType: 'tom_low' },
      { name: 'Tom Mid', synthType: 'tom_mid' },
      { name: 'Tom High', synthType: 'tom_high' },
      { name: 'Cowbell', synthType: 'cowbell' },
      { name: 'Crash 1', synthType: 'crash' },
      { name: 'Crash 2', synthType: 'noise_hit' },
      { name: 'Ride', synthType: 'ride' },
      { name: 'Shaker', synthType: 'shaker' },
    ],
  },

  {
    name: '808 Kit',
    pads: [
      { name: 'Kick Deep', synthType: 'kick_deep' },
      { name: 'Snare Tight', synthType: 'snare' },
      { name: 'Closed Hat', synthType: 'hihat_closed' },
      { name: 'Open Hat', synthType: 'hihat_open' },
      { name: 'Kick Hard', synthType: 'kick_hard' },
      { name: 'Rim Shot', synthType: 'rim' },
      { name: 'Cowbell', synthType: 'cowbell' },
      { name: 'Clap', synthType: 'clap' },
      { name: 'Tom Low', synthType: 'tom_low' },
      { name: 'Tom Mid', synthType: 'tom_mid' },
      { name: 'Tom High', synthType: 'tom_high' },
      { name: 'Clave', synthType: 'clave' },
      { name: 'Crash', synthType: 'crash' },
      { name: 'Ride', synthType: 'ride' },
      { name: 'Shaker', synthType: 'shaker' },
      { name: 'Claves Hi', synthType: 'clave_hi' },
    ],
  },
  {
    name: '909 Kit',
    pads: [
      { name: 'Kick 909', synthType: 'kick_909' },
      { name: 'Snare 909', synthType: 'snare_909' },
      { name: 'CH 909', synthType: 'hihat_closed' },
      { name: 'OH 909', synthType: 'hihat_open' },
      { name: 'Kick Alt', synthType: 'kick_deep' },
      { name: 'Clap 909', synthType: 'clap' },
      { name: 'Rim 909', synthType: 'rim' },
      { name: 'Ride 909', synthType: 'ride' },
      { name: 'Lo Tom', synthType: 'tom_low' },
      { name: 'Mid Tom', synthType: 'tom_mid' },
      { name: 'Hi Tom', synthType: 'tom_high' },
      { name: 'Crash 909', synthType: 'crash' },
      { name: 'Shaker', synthType: 'shaker' },
      { name: 'Clave', synthType: 'clave' },
      { name: 'Cowbell', synthType: 'cowbell' },
      { name: 'Noise Hit', synthType: 'noise_hit' },
    ],
  },
  {
    name: 'Lo-Fi Kit',
    pads: [
      { name: 'Dusty Kick', synthType: 'kick_deep' },
      { name: 'Vinyl Snare', synthType: 'snare' },
      { name: 'Tape Hat', synthType: 'hihat_closed' },
      { name: 'Foil Hat', synthType: 'hihat_open' },
      { name: 'Sub Kick', synthType: 'kick_hard' },
      { name: 'Finger Snap', synthType: 'clap' },
      { name: 'Wood Block', synthType: 'clave' },
      { name: 'Tamb Hit', synthType: 'shaker' },
      { name: 'Bass Note C', synthType: 'bass_c' },
      { name: 'Bass Note D', synthType: 'bass_d' },
      { name: 'Bass Note E', synthType: 'bass_e' },
      { name: 'Bass Note G', synthType: 'bass_g' },
      { name: 'Chord Cm', synthType: 'chord_cm' },
      { name: 'Chord Fm', synthType: 'chord_fm' },
      { name: 'Chord Gm', synthType: 'chord_gm' },
      { name: 'Chord Bb', synthType: 'chord_bb' },
    ],
  },
  {
    name: 'Trap Kit',
    pads: [
      { name: '808 Sub', synthType: 'kick_deep' },
      { name: 'Trap Snare', synthType: 'snare' },
      { name: 'Trap Hat', synthType: 'hihat_closed' },
      { name: 'Open Hat', synthType: 'hihat_open' },
      { name: '808 Kick', synthType: 'kick_hard' },
      { name: 'Trap Clap', synthType: 'clap' },
      { name: 'Perc 1', synthType: 'clave' },
      { name: 'Perc 2', synthType: 'rim' },
      { name: '808 Bass C', synthType: 'bass_c' },
      { name: '808 Bass D', synthType: 'bass_d' },
      { name: '808 Bass E', synthType: 'bass_e' },
      { name: '808 Bass G', synthType: 'bass_g' },
      { name: 'FX Rise', synthType: 'noise_hit' },
      { name: 'FX Down', synthType: 'crash' },
      { name: 'Vox Chop', synthType: 'shaker' },
      { name: 'Gun Cock', synthType: 'cowbell' },
    ],
  },
];

export const DEFAULT_PAD_FX: PadFXSlot[] = [
  { name: 'LPF Sweep', type: 'lpf', active: false, params: { cutoff: 1000, resonance: 5 } },
  { name: 'HPF Sweep', type: 'hpf', active: false, params: { cutoff: 200, resonance: 5 } },
  { name: 'Delay', type: 'delay', active: false, params: { time: 0.25, feedback: 0.4, mix: 0.3 } },
  { name: 'Reverb', type: 'reverb', active: false, params: { decay: 2, mix: 0.3 } },
  { name: 'Flanger', type: 'flanger', active: false, params: { rate: 0.5, depth: 0.5, mix: 0.3 } },
  { name: 'Bitcrush', type: 'bitcrush', active: false, params: { bits: 8, rate: 0.5 } },
  { name: 'Vinyl Stop', type: 'vinylstop', active: false, params: { speed: 0.5 } },
  { name: 'Gate', type: 'gate', active: false, params: { rate: 4, mix: 0.5 } },
];

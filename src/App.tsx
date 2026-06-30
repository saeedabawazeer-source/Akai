// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import {
  getAudioContext, startRecording, stopRecording, autoChop, playSlice,
  stopAudioNodes, synthFunctions, startSequencer, stopSequencer, isSequencerRunning,
  startMicMonitor, stopMicMonitor, getMicLevel, getMasterBus, updateMasterFX
} from './audioEngine';
import {
  ScreenMode, PlayMode, PadBank, PadSettings, SequenceTrack,
  DEFAULT_PAD_SETTINGS, PRESET_KITS, DEFAULT_PAD_FX, KnobMapping,
  SampleColumn1, SampleColumn2, SampleColumn3, ActiveSampleColumn
} from './types';

// Lazy screen imports
import SampleScreen from './screens/SampleScreen';
import SampleRecordScreen from './screens/SampleRecordScreen';
import SequenceScreen from './screens/SequenceScreen';
import SongScreen from './screens/SongScreen';
import PadFXScreen from './screens/PadFXScreen';
import KnobFXScreen from './screens/KnobFXScreen';
import BrowserScreen from './screens/BrowserScreen';
import MenuScreen from './screens/MenuScreen';

// ─── Reusable UI Components ─────────────────────────────

const SilverKnob = ({ label, size = 60, onChange, value = 50, onValueChange, absoluteCatchup = false }) => {
  const knobRef = useRef(null);
  const [internalVal, setInternalVal] = useState(value);
  const [isSynced, setIsSynced] = useState(true);

  useEffect(() => {
    if (absoluteCatchup) {
      if (Math.abs(internalVal - value) > 1.5) {
        setIsSynced(false);
      }
    } else {
      setInternalVal(value);
    }
  }, [value, absoluteCatchup]); // do not depend on internalVal

  // Value 0-100 maps to -135 to +135 degrees
  const angle = -135 + ((absoluteCatchup ? internalVal : value) / 100) * 270;
  const startY = useRef(0);
  const startVal = useRef(absoluteCatchup ? internalVal : value);
  const syncedRef = useRef(isSynced);

  useEffect(() => {
    syncedRef.current = isSynced;
  }, [isSynced]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    startY.current = e.clientY;
    startVal.current = absoluteCatchup ? internalVal : value;
    const targetVal = value;
    
    const move = (ev) => {
      const deltaY = startY.current - ev.clientY;
      let newVal = startVal.current + deltaY * 0.5;
      newVal = Math.max(0, Math.min(100, newVal));
      
      if (absoluteCatchup) {
        setInternalVal(newVal);
        if (!syncedRef.current) {
          if ((startVal.current <= targetVal && newVal >= targetVal) || (startVal.current >= targetVal && newVal <= targetVal)) {
            syncedRef.current = true;
            setIsSynced(true);
          }
        }
        if (syncedRef.current) {
          if (onChange) onChange(newVal);
          if (onValueChange) onValueChange(newVal);
        }
      } else {
        if (onChange) onChange(newVal);
        if (onValueChange) onValueChange(newVal);
      }
    };
    const up = () => { 
      document.removeEventListener('pointermove', move); 
      document.removeEventListener('pointerup', up); 
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  
  let arrow = '';
  if (absoluteCatchup && !isSynced) {
    arrow = internalVal < value ? '▶' : '◀';
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={knobRef} onPointerDown={handlePointerDown}
        className="rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.3)] relative flex items-center justify-center cursor-ns-resize touch-none"
        style={{ width: size, height: size, background: 'conic-gradient(from 180deg at 50% 50%, #d4d5d9 0deg, #f4f5f7 90deg, #c4c5c9 180deg, #f4f5f7 270deg, #d4d5d9 360deg)', border: '1px solid #a0a0a0' }}>
        <div className="rounded-full bg-gradient-to-br from-[#eef0f2] to-[#b4b6ba] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.4)] relative flex justify-center"
          style={{ width: size*0.75, height: size*0.75, transform: `rotate(${angle}deg)` }}>
          <div className="w-[3px] bg-white shadow-sm rounded-sm mt-1" style={{ height: size*0.35 }}></div>
        </div>
      </div>
      {label && <span className="text-[10px] font-bold text-black mt-2 tracking-wide uppercase">{arrow} {label} {arrow === '▶' ? '' : arrow}</span>}
    </div>
  );
};

const MPCButton = ({ children, color = 'gray', label, subLabel, width = 'w-16', height = 'h-8', onClick, active }) => {
  const colors = {
    gray: 'bg-gradient-to-b from-[#7e8085] to-[#606368] text-black hover:brightness-110 active:brightness-90',
    orange: 'bg-gradient-to-b from-[#f26d41] to-[#e04a1c] text-black hover:brightness-110 active:brightness-90',
    blue: 'bg-gradient-to-b from-[#25b5eb] to-[#0494d1] text-black hover:brightness-110 active:brightness-90',
    black: 'bg-gradient-to-b from-[#2a2a2a] to-[#111111] text-white hover:brightness-125 active:brightness-75',
    red: 'bg-gradient-to-b from-[#e21836] to-[#a01020] text-white hover:brightness-110 active:brightness-90',
  };
  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-[7px] font-bold text-[#888] mb-0.5 tracking-widest uppercase">{label}</span>}
      <button onPointerDown={(e) => { e.preventDefault(); onClick?.(); }}
        className={`${width} ${height} rounded-md flex flex-col items-center justify-center font-bold text-[9px]
          border-b-2 border-r-[1px] border-black/30 shadow-[0_3px_4px_rgba(0,0,0,0.3)]
          ${active ? colors.red : colors[color]}`}>
        {children}
      </button>
      {subLabel && <span className="text-[7px] font-bold text-[#fa5c2e] mt-0.5 tracking-widest uppercase">{subLabel}</span>}
    </div>
  );
};

// ─── Main App ────────────────────────────────────────────

export default function App() {
  // ── Screen navigation ──
  const [screenMode, setScreenMode] = useState<ScreenMode>('SAMPLE');
  const [shiftHeld, setShiftHeld] = useState(false);
  const [b1Held, setB1Held] = useState(false);

  // ── Audio state ──
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [slices, setSlices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const [micInputLevel, setMicInputLevel] = useState(0);

  // ── Pad state ──
  const [activePad, setActivePad] = useState(null);
  const [padBank, setPadBank] = useState<PadBank>('A');
  const [playMode, setPlayMode] = useState<PlayMode>('ONE SHOT');
  const activeNodesRef = useRef({});

  // ── Per-pad settings (16 pads × 4 banks = 64 total, start with bank A) ──
  const [allPadSettings, setAllPadSettings] = useState(() =>
    Array.from({ length: 16 }, () => ({ ...DEFAULT_PAD_SETTINGS }))
  );

  // ── Volume ──
  const [mainVolume, setMainVolume] = useState(80);

  // ── Current kit ──
  const [currentKit, setCurrentKit] = useState(0); // index into PRESET_KITS
  const [padAssignments, setPadAssignments] = useState(() =>
    PRESET_KITS[0].pads.map(p => p.name)
  );
  const [padSynthTypes, setPadSynthTypes] = useState(() =>
    PRESET_KITS[0].pads.map(p => p.synthType)
  );

  // ── Sample Edit state ──
  const [sampleEditTab, setSampleEditTab] = useState('Trim');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [chopMarkers, setChopMarkers] = useState([]);
  const [selectedChopMarker, setSelectedChopMarker] = useState(0);

  // ── Program Edit state ──
  const [programEditTab, setProgramEditTab] = useState('Layer');

  // ── Sequencer state ──
  const [bpm, setBpm] = useState(120);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [totalSequences, setTotalSequences] = useState(4);
  const [seqLength, setSeqLength] = useState(2); // bars
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeqRecording, setIsSeqRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tracks, setTracks] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({ padId: i + 1, steps: Array(16).fill(false) }))
  );

  // ── Song state ──
  const [songSequences, setSongSequences] = useState([1, 2, 3]);
  const [currentSongStep, setCurrentSongStep] = useState(0);

  // ── FX state ──
  const [effects, setEffects] = useState(() => [...DEFAULT_PAD_FX]);
  const [activeFXPad, setActiveFXPad] = useState(null);
  const [masterFXParams, setMasterFXParams] = useState({ p1: 0.5, p2: 0.5, p3: 0.5, type: 'LP Filter' });
  const [knobMappings, setKnobMappings] = useState<KnobMapping[]>([
    { label: 'K1', param: '-', value: 50, min: 0, max: 100 },
    { label: 'K2', param: '-', value: 50, min: 0, max: 100 },
    { label: 'K3', param: '-', value: 50, min: 0, max: 100 },
  ]);


  // ── Browser state ──
  const [selectedBrowserKit, setSelectedBrowserKit] = useState(0);
  const [browserPreviewOn, setBrowserPreviewOn] = useState(true);
  const [browserDrive, setBrowserDrive] = useState<'Internal' | 'External'>('Internal');
  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0);

  // ── Note Repeat ──
  const [noteRepeat, setNoteRepeat] = useState(false);
  const noteRepeatRef = useRef(null);

  // ── Metronome ──
  const [metronome, setMetronome] = useState(false);

  // ── Mute state ──
  const [muteMode, setMuteMode] = useState(false);

  // ── 16 Levels state ──
  const [sixteenLevels, setSixteenLevels] = useState(false);
  const [sixteenLevelsPad, setSixteenLevelsPad] = useState(1);
  const [sixteenLevelsType, setSixteenLevelsType] = useState('VELOCITY');

  // ── Sample column navigation ──
  const [sampleCol1, setSampleCol1] = useState<SampleColumn1>('Trim');
  const [sampleCol2, setSampleCol2] = useState<SampleColumn2>('Tune');
  const [sampleCol3, setSampleCol3] = useState<SampleColumn3>('Filter');
  const [activeSampleCol, setActiveSampleCol] = useState<ActiveSampleColumn>(1);

  // ── Chop / Loop / Reverse state ──
  const [chopMode, setChopMode] = useState(false);
  const [chopType, setChopType] = useState('Equal');
  const [loopStart, setLoopStart] = useState(0);
  const [isReversed, setIsReversed] = useState(false);

  // ── Sync Knob Mappings ──
  useEffect(() => {
    const padSet = allPadSettings[(activePad || 1) - 1] || DEFAULT_PAD_SETTINGS;
    
    if (screenMode === 'SAMPLE') {
      if (chopMode) {
         const slice = slices.find(s => s.id === (activePad || 1));
         setKnobMappings([
           { label: 'K1', param: 'Start', value: slice ? slice.start * 100 : 0, min: 0, max: 100 },
           { label: 'K2', param: 'End', value: slice ? slice.end * 100 : 100, min: 0, max: 100 },
           { label: 'K3', param: 'Chop Type', value: 0, min: 0, max: 100 },
         ]);
      } else if (activeSampleCol === 1) {
         if (sampleCol1 === 'Trim') {
           setKnobMappings([
             { label: 'K1', param: 'Start', value: trimStart * 100, min: 0, max: 100 },
             { label: 'K2', param: 'End', value: trimEnd * 100, min: 0, max: 100 },
             { label: 'K3', param: 'Loop', value: loopStart * 100, min: 0, max: 100 },
           ]);
         } else if (sampleCol1 === 'Mix') {
           setKnobMappings([
             { label: 'K1', param: 'Volume', value: padSet.volume, min: 0, max: 100 },
             { label: 'K2', param: 'Kit Vol', value: 100, min: 0, max: 100 },
             { label: 'K3', param: 'Pan', value: ((padSet.pan + 50) / 100) * 100, min: 0, max: 100 },
           ]);
         } else if (sampleCol1 === 'Amp Env') {
           setKnobMappings([
             { label: 'K1', param: 'Attack', value: (padSet.attack / 2) * 100, min: 0, max: 100 },
             { label: 'K2', param: playMode === 'NOTE ON' ? 'Release' : 'Decay', value: playMode === 'NOTE ON' ? (padSet.release / 5) * 100 : (padSet.decay / 2) * 100, min: 0, max: 100 },
             { label: 'K3', param: 'Vel Sens', value: 100, min: 0, max: 100 },
           ]);
         }
      } else if (activeSampleCol === 2) {
         if (sampleCol2 === 'Tune') {
           setKnobMappings([
             { label: 'K1', param: 'Semi Tune', value: ((padSet.tune + 24) / 48) * 100, min: 0, max: 100 },
             { label: 'K2', param: 'Fine Tune', value: 50, min: 0, max: 100 },
             { label: 'K3', param: 'Warp', value: 0, min: 0, max: 100 },
           ]);
         } else if (sampleCol2 === 'Play') {
           setKnobMappings([
             { label: 'K1', param: 'Polyphony', value: 100, min: 0, max: 100 },
             { label: 'K2', param: 'Mute Grp', value: 0, min: 0, max: 100 },
             { label: 'K3', param: 'Offset', value: 0, min: 0, max: 100 },
           ]);
         }
      } else if (activeSampleCol === 3) {
         if (sampleCol3 === 'Filter') {
           const normFreq = Math.sqrt(Math.max(0, padSet.filterFreq - 20) / 19980) * 100;
           setKnobMappings([
             { label: 'K1', param: 'Cutoff', value: normFreq, min: 0, max: 100 },
             { label: 'K2', param: 'Resonance', value: (padSet.filterRes / 20) * 100, min: 0, max: 100 },
             { label: 'K3', param: 'Type', value: 50, min: 0, max: 100 },
           ]);
         } else if (sampleCol3 === 'Filt Env') {
           setKnobMappings([
             { label: 'K1', param: 'Attack', value: 0, min: 0, max: 100 },
             { label: 'K2', param: 'Decay', value: 0, min: 0, max: 100 },
             { label: 'K3', param: 'Depth', value: 0, min: 0, max: 100 },
           ]);
         }
      }
    } else if (screenMode === 'KNOB_FX' || screenMode === 'PAD_FX') {
        setKnobMappings([
          { label: 'K1', param: 'Param 1', value: masterFXParams.p1 * 100, min: 0, max: 100 },
          { label: 'K2', param: 'Param 2', value: masterFXParams.p2 * 100, min: 0, max: 100 },
          { label: 'K3', param: 'Param 3', value: masterFXParams.p3 * 100, min: 0, max: 100 },
        ]);
    } else if (screenMode === 'SEQUENCE') {
        setKnobMappings([
          { label: 'K1', param: 'Seq Length', value: ((seqLength - 1) / 7) * 100, min: 0, max: 100 },
          { label: 'K2', param: 'Quantize', value: 50, min: 0, max: 100 },
          { label: 'K3', param: 'Swing', value: 50, min: 0, max: 100 },
        ]);
    } else {
        setKnobMappings([
          { label: 'K1', param: '-', value: 0, min: 0, max: 100 },
          { label: 'K2', param: '-', value: 0, min: 0, max: 100 },
          { label: 'K3', param: '-', value: 0, min: 0, max: 100 },
        ]);
    }
  }, [screenMode, activeSampleCol, sampleCol1, sampleCol2, sampleCol3, chopMode, activePad, allPadSettings, trimStart, trimEnd, loopStart, slices, playMode, seqLength, masterFXParams]);

  // ── Sync Master FX ──
  useEffect(() => {
    updateMasterFX(masterFXParams);
  }, [masterFXParams]);


  // ── Sample Record settings ──
  const [recSource, setRecSource] = useState('Input 1/2');
  const [recLength, setRecLength] = useState(4); // bars
  const [recThreshold, setRecThreshold] = useState(0); // dB

  // ─── Keyboard mapping ─────────────────────────────────
  useEffect(() => {
    const keyMap = { '1':13,'2':14,'3':15,'4':16,'q':9,'w':10,'e':11,'r':12,'a':5,'s':6,'d':7,'f':8,'z':1,'x':2,'c':3,'v':4 };
    const down = (e) => {
      if (e.key === 'Shift') {
        setShiftHeld(true);
        return;
      }
      const p = keyMap[e.key.toLowerCase()];
      if (p && !e.repeat) triggerPad(p);
    };
    const up = (e) => {
      if (e.key === 'Shift') {
        setShiftHeld(false);
        return;
      }
      const p = keyMap[e.key.toLowerCase()];
      if (p) releasePad(p);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [slices, audioBuffer, mainVolume, playMode, padSynthTypes, allPadSettings, screenMode, activeFXPad]);

  // ─── MIC MONITORING ───────────────────────────────────────
  useEffect(() => {
    let intervalId: any = null;
    if (screenMode === 'SAMPLE_RECORD') {
      startMicMonitor().catch(err => console.error("Mic error:", err));
      intervalId = setInterval(() => {
        setMicInputLevel(getMicLevel());
      }, 50); // poll at 20fps
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (screenMode === 'SAMPLE_RECORD') {
        stopMicMonitor();
        setMicInputLevel(0);
      }
    };
  }, [screenMode]);

  // ─── Pad trigger / release ─────────────────────────────
  const triggerPad = useCallback((id: number, time?: number) => {
    const ctx = getAudioContext();
    const delay = time ? Math.max(0, (time - ctx.currentTime) * 1000) : 0;
    
    setTimeout(() => {
      setActivePad(id);
    }, delay);

    if (activeNodesRef.current[id]) {
      if (!time) stopAudioNodes(activeNodesRef.current[id]);
    }

    if (noteRepeat) {
      if (noteRepeatRef.current) clearInterval(noteRepeatRef.current);
      const intervalMs = (60000 / bpm) / 4; // 16th notes
      noteRepeatRef.current = setInterval(() => {
        playPadSound(id);
      }, intervalMs);
    }

    playPadSound(id, time);
  }, [slices, audioBuffer, mainVolume, playMode, padSynthTypes, allPadSettings, screenMode, effects, muteMode, isSeqRecording, currentStep, sixteenLevels, sixteenLevelsPad, noteRepeat, bpm]);

  const playPadSound = (id: number, time?: number) => {
    if (!time && activeNodesRef.current[id]) stopAudioNodes(activeNodesRef.current[id]);

    // In PAD FX mode, toggling effects
    if (screenMode === 'PAD_FX') {
      const fxIdx = id - 1;
      if (fxIdx >= 0 && fxIdx < effects.length) {
        setActiveFXPad(id);
        setEffects(prev => prev.map((fx, i) => i === fxIdx ? { ...fx, active: !fx.active } : fx));
      }
      return;
    }

    // Mute toggle
    if (muteMode) {
      setAllPadSettings(prev => prev.map((s, i) => i === id - 1 ? { ...s, muted: !s.muted } : s));
      return;
    }

    // Check muted
    if (allPadSettings[id - 1]?.muted) return;

    // Seq recording: add step
    if (isSeqRecording && currentStep >= 0) {
      setTracks(prev => prev.map(t => t.padId === id ? { ...t, steps: t.steps.map((s, i) => i === currentStep ? true : s) } : t));
    }

    // 16 Levels: play same pad at different velocities
    if (sixteenLevels) {
      const vol = (id / 16) * (mainVolume / 66);
      const synthType = padSynthTypes[sixteenLevelsPad - 1];
      if (synthType && synthFunctions[synthType]) {
        const ctx = getAudioContext();
        const nodes = synthFunctions[synthType](ctx, time);
        if (nodes?.gainNode) nodes.gainNode.gain.value *= vol;
        activeNodesRef.current[id] = nodes;
      }
      return;
    }

    // Check for recorded slice first
    const slice = slices.find(s => s.id === id);
    let nodes = null;
    const padSet = allPadSettings[id - 1] || DEFAULT_PAD_SETTINGS;

    if (slice && audioBuffer) {
      nodes = playSlice(
        audioBuffer, slice.start, slice.end,
        (padSet.volume / 100) * (mainVolume / 66),
        padSet.tune, padSet.filterFreq,
        playMode === 'LOOP',
        time
      );
    } else {
      const synthType = padSynthTypes[id - 1];
      if (synthType && synthFunctions[synthType]) {
        const ctx = getAudioContext();
        nodes = synthFunctions[synthType](ctx, time);
        if (nodes?.gainNode) nodes.gainNode.gain.value *= (padSet.volume / 100) * (mainVolume / 66);
      }
    }

    if (nodes) activeNodesRef.current[id] = nodes;
  };

  const releasePad = useCallback((id) => {
    setActivePad(null);
    if (noteRepeatRef.current) {
      clearInterval(noteRepeatRef.current);
      noteRepeatRef.current = null;
    }
    if (screenMode === 'PAD_FX') { setActiveFXPad(null); return; }
    if (playMode === 'NOTE ON' || playMode === 'LOOP') {
      const i = id || activePad;
      if (i && activeNodesRef.current[i]) {
        stopAudioNodes(activeNodesRef.current[i]);
        delete activeNodesRef.current[i];
      }
    }
  }, [playMode, activePad, screenMode]);

  // ─── Function Buttons (B1, B2, B3) ────────────────────
  const handleB1 = () => {
    if (screenMode === 'BROWSER' || screenMode.startsWith('MENU_')) {
      setScreenMode('SAMPLE'); // Back button
    } else if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Trim', 'Mix', 'Amp Env'];
      setSampleCol1(prev => cycle[(cycle.indexOf(prev) + 1) % 3]);
      setActiveSampleCol(1);
    }
  };
  const handleB2 = () => {
    if (screenMode === 'BROWSER') {
      setBrowserDrive(prev => prev === 'Internal' ? 'External' : 'Internal');
    } else if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Tune', 'Play'];
      setSampleCol2(prev => cycle[(cycle.indexOf(prev) + 1) % 2]);
      setActiveSampleCol(2);
    }
  };
  const handleB3 = () => {
    if (screenMode === 'BROWSER') {
      setBrowserPreviewOn(!browserPreviewOn);
    } else if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Filter', 'Filt Env'];
      setSampleCol3(prev => cycle[(cycle.indexOf(prev) + 1) % 2]);
      setActiveSampleCol(3);
    }
  };

  // ─── Button handlers ──────────────────────────────────
  const consumeShift = () => {
    if (shiftHeld) setShiftHeld(false);
  };

  const handleSampleButton = () => {
    setScreenMode(shiftHeld ? 'MENU_INPUT_CONFIG' : 'SAMPLE');
    consumeShift();
  };
  const handleSeqButton = () => {
    setScreenMode(shiftHeld ? 'SONG' : 'SEQUENCE');
    consumeShift();
  };
  const handlePadFXButton = () => {
    setScreenMode('PAD_FX');
    consumeShift();
  };
  const handleKnobFXButton = () => {
    setScreenMode('KNOB_FX');
    consumeShift();
  };
  const handleShiftToggle = () => setShiftHeld(prev => !prev);

  const handlePadBank = () => {
    const banks: PadBank[] = ['A','B','C','D'];
    setPadBank(prev => banks[(banks.indexOf(prev) + 1) % 4]);
  };

  const handleErase = () => {
    if (shiftHeld) {
      // Copy mode - placeholder
      consumeShift();
    } else {
      // Erase last event - clear active pad's track
      if (activePad) {
        setTracks(prev => prev.map(t => t.padId === activePad ? { ...t, steps: Array(16).fill(false) } : t));
      }
    }
  };

  const handleNoteRepeat = () => {
    if (shiftHeld) {
      // Triplet mode toggle - placeholder
      consumeShift();
    } else {
      setNoteRepeat(!noteRepeat);
    }
  };

  const handleChop = () => {
    if (shiftHeld) {
      setPlayMode('NOTE ON'); // SHIFT + CHOP = NOTE ON
      consumeShift();
    } else {
      setChopMode(!chopMode);
      setScreenMode('SAMPLE');
      if (!chopMode && audioBuffer) {
        // Just entering chop mode
        if (chopMarkers.length === 0) {
          const newSlices = autoChop(audioBuffer, 16);
          setSlices(newSlices);
          setChopMarkers(newSlices.map(s => s.start));
        }
      }
    }
  };

  const handleMute = () => setMuteMode(!muteMode);

  const handleLoop = () => {
    if (shiftHeld) {
      setIsReversed(prev => !prev);
      consumeShift();
    } else {
      setPlayMode(prev => prev === 'LOOP' ? 'ONE SHOT' : 'LOOP');
    }
  };

  const handle16Levels = () => {
    if (shiftHeld) {
      // Pad Perform mode - placeholder
      consumeShift();
    } else {
      if (sixteenLevels) {
        setSixteenLevels(false);
      } else {
        setSixteenLevels(true);
        setSixteenLevelsPad(activePad || 1);
      }
    }
  };

  const handleSampleSelect = () => {
    if (shiftHeld) {
      // Save sample - placeholder
      consumeShift();
    } else {
      setScreenMode('BROWSER');
    }
  };

  const handleTapTempo = () => {
    if (shiftHeld) {
      setMetronome(!metronome);
      consumeShift();
    }
    // Normal tap tempo - could implement with timestamps
  };

  const handleMinus = () => {
    // Decrement selected value based on context
    if (screenMode === 'SEQUENCE') setBpm(prev => Math.max(40, prev - 1));
    if (screenMode === 'BROWSER') setSelectedBrowserKit(prev => Math.max(0, prev - 1));
  };

  const handlePlus = () => {
    if (screenMode === 'SEQUENCE') setBpm(prev => Math.min(300, prev + 1));
    if (screenMode === 'BROWSER') setSelectedBrowserKit(prev => Math.min(PRESET_KITS.length - 1, prev + 1));
  };

  const handleSampleRecord = () => {
    setScreenMode('SAMPLE_RECORD');
    toggleRecording();
  };

  const handleSeqRecord = () => {
    setIsSeqRecording(!isSeqRecording);
  };

  const handleStop = () => {
    setIsPlaying(false);
    stopSequencer();
    setCurrentStep(-1);
  };

  const handlePlay = () => {
    if (isPlaying) {
      handleStop();
    } else {
      setIsPlaying(true);
      startSequencer(bpm, tracks, (step) => setCurrentStep(step), triggerPad);
    }
  };

  // ─── Recording ─────────────────────────────────────────
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        await startRecording();
        setIsRecording(true);
        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 0.1), 100);
      } catch (e) { alert("Microphone access denied!"); }
    } else {
      clearInterval(recordingTimerRef.current);
      const buffer = await stopRecording();
      setAudioBuffer(buffer);
      setSlices([]);
      setIsRecording(false);
      setScreenMode('SAMPLE');
    }
  };

  // ─── Data Wheel handler ────────────────────────────────
  const handleDataWheel = (dx) => {
    if (screenMode === 'SAMPLE') {
      if (chopMode) setSelectedChopMarker(prev => Math.max(0, Math.min(chopMarkers.length - 1, prev + Math.sign(dx))));
    }
    if (screenMode === 'SEQUENCE') {
      if (b1Held) setBpm(prev => Math.max(40, Math.min(300, prev + dx * 0.5)));
      // Else could move playhead
    }
    if (screenMode === 'BROWSER') setSelectedBrowserKit(prev => Math.max(0, Math.min(PRESET_KITS.length - 1, prev + Math.sign(dx))));
    if (screenMode.startsWith('MENU_')) setMenuSelectedIndex(prev => Math.max(0, prev + Math.sign(dx)));
  };

  // ─── Knob handlers ────────────────────────────────────
  const handleK1Change = (v) => {
    if (screenMode === 'SAMPLE') {
      if (chopMode) {
        setSlices(prev => prev.map(s => s.id === (activePad || 1) ? { ...s, start: Math.min(s.end - 0.01, v / 100) } : s));
      }
      else if (activeSampleCol === 1) {
        if (sampleCol1 === 'Trim') setTrimStart(Math.min(trimEnd - 0.01, v / 100));
        if (sampleCol1 === 'Mix') updatePadSetting('volume', Math.max(1, v)); // ensure never 0 to prevent click issues
        if (sampleCol1 === 'Amp Env') updatePadSetting('attack', (v / 100) * 2);
      } else if (activeSampleCol === 2) {
        if (sampleCol2 === 'Tune') updatePadSetting('tune', Math.floor((v / 100) * 48) - 24);
      } else if (activeSampleCol === 3) {
        if (sampleCol3 === 'Filter') updatePadSetting('filterFreq', 20 + Math.pow(v / 100, 2) * 19980);
      }
    } else if (screenMode === 'SEQUENCE') {
      setSeqLength(Math.max(1, Math.min(8, Math.round((v / 100) * 7) + 1)));
    } else if (screenMode === 'KNOB_FX' || screenMode === 'PAD_FX') {
      setMasterFXParams(prev => ({ ...prev, p1: v / 100 }));
    } else if (screenMode === 'SAMPLE_RECORD') {
      const sources = ['Input 1/2', 'Input 3/4', 'Main Out', 'Resample'];
      const idx = Math.min(sources.length - 1, Math.floor((v / 100) * sources.length));
      setRecSource(sources[idx]);
    }
  };
  const handleK2Change = (v) => {
    if (screenMode === 'SAMPLE') {
      if (chopMode) {
        setSlices(prev => prev.map(s => s.id === (activePad || 1) ? { ...s, end: Math.max(s.start + 0.01, v / 100) } : s));
      }
      else if (activeSampleCol === 1) {
        if (sampleCol1 === 'Trim') setTrimEnd(Math.max(trimStart + 0.01, v / 100));
        if (sampleCol1 === 'Amp Env') { playMode === 'NOTE ON' ? updatePadSetting('release', Math.max(0.01, (v/100)*5)) : updatePadSetting('decay', Math.max(0.01, (v/100)*2)); }
      } else if (activeSampleCol === 3) {
        if (sampleCol3 === 'Filter') updatePadSetting('filterRes', (v / 100) * 20);
      }
    } else if (screenMode === 'KNOB_FX' || screenMode === 'PAD_FX') {
      setMasterFXParams(prev => ({ ...prev, p2: v / 100 }));
    } else if (screenMode === 'SAMPLE_RECORD') {
      setRecLength(Math.max(1, Math.min(64, Math.round((v / 100) * 63) + 1)));
    }
  };
  const handleK3Change = (v) => {
    if (screenMode === 'SAMPLE') {
      if (chopMode) { /* K3 = Chop Type */ }
      else if (activeSampleCol === 1) {
        if (sampleCol1 === 'Trim') setLoopStart(v / 100);
        if (sampleCol1 === 'Mix') updatePadSetting('pan', Math.floor((v / 100) * 100) - 50);
      }
    } else if (screenMode === 'KNOB_FX' || screenMode === 'PAD_FX') {
      setMasterFXParams(prev => ({ ...prev, p3: v / 100 }));
    } else if (screenMode === 'SEQUENCE') {
      /* K3 = Swing (placeholder) */
    } else if (screenMode === 'SAMPLE_RECORD') {
      setRecThreshold(Math.round((v / 100) * -60));
    }
  };

  // ─── Browser load kit ─────────────────────────────────
  const loadKit = (kitIdx) => {
    const kit = PRESET_KITS[kitIdx];
    if (!kit) return;
    setCurrentKit(kitIdx);
    setPadAssignments(kit.pads.map(p => p.name));
    setPadSynthTypes(kit.pads.map(p => p.synthType));
    setScreenMode('SAMPLE');
  };

  // ─── Seq step toggle ──────────────────────────────────
  const toggleStep = (padId, stepIdx) => {
    setTracks(prev => prev.map(t =>
      t.padId === padId ? { ...t, steps: t.steps.map((s, i) => i === stepIdx ? !s : s) } : t
    ));
  };

  // ─── Pad settings update ──────────────────────────────
  const updatePadSetting = (key, value) => {
    const padIdx = (activePad || 1) - 1;
    setAllPadSettings(prev => prev.map((s, i) => i === padIdx ? { ...s, [key]: value } : s));
  };

  // ─── Screen renderer ──────────────────────────────────
  const renderScreen = () => {
    const padIdx = (activePad || 1) - 1;
    const currentPadSettings = allPadSettings[padIdx] || DEFAULT_PAD_SETTINGS;

    const sampleScreenProps = {
      audioBuffer,
      slices,
      activePad: activePad || 1,
      padBank,
      padAssignments,
      sampleCol1,
      sampleCol2,
      sampleCol3,
      activeSampleCol,
      padSettings: currentPadSettings,
      trimStart,
      trimEnd,
      loopStart,
      chopMode,
      chopType,
      chopMarkers,
      selectedChopMarker,
      playMode,
      sixteenLevels,
      sixteenLevelsType,
      isReversed,
      onWaveformClick: (pos: number) => {
        if (chopMode) {
          setSelectedChopMarker(chopMarkers.reduce((closest, m, i) => Math.abs(m - pos) < Math.abs(chopMarkers[closest] - pos) ? i : closest, 0));
        } else {
          setTrimStart(pos);
        }
      },
    };

    switch (screenMode) {
      case 'SAMPLE':
        return <SampleScreen {...sampleScreenProps} />;
      case 'SAMPLE_RECORD':
        return <SampleRecordScreen isRecording={isRecording} recordingTime={recordingTime}
          inputLevel={micInputLevel} />;
      case 'SEQUENCE':
        return <SequenceScreen currentStep={currentStep}
          isPlaying={isPlaying} seqLength={seqLength} bpm={bpm}
          currentSeq={currentSeq} />;
      case 'SONG':
        return <SongScreen songSequences={songSequences} currentSongStep={currentSongStep}
          isPlaying={isPlaying} totalSequences={totalSequences} />;
      case 'PAD_FX':
        return <PadFXScreen knobMappings={knobMappings} activeEffectIndex={activeFXPad} />;
      case 'KNOB_FX':
        return <KnobFXScreen knobMappings={knobMappings} activeEffect={knobMappings[0]?.param || 'LP Filter'} />;
      case 'BROWSER':
        return <BrowserScreen
          presetKits={PRESET_KITS}
          selectedKit={selectedBrowserKit}
          isPreviewOn={browserPreviewOn}
          drive={browserDrive}
        />;
      case 'MENU_INPUT_CONFIG':
        return <MenuScreen title="Input Config" selectedIndex={menuSelectedIndex} items={[
          { label: 'Input Source', value: 'Input 1/2' },
          { label: 'Monitor', value: 'On' },
          { label: 'Input Gain', value: '0 dB' },
          { label: 'Phantom Power', value: 'Off' },
        ]} />;
      case 'MENU_FADER':
        return <MenuScreen title="Fader" selectedIndex={menuSelectedIndex} items={[
          { label: 'Fader Mode', value: 'Volume' },
          { label: 'Channel', value: 'All' },
        ]} />;
      case 'MENU_TIME_CORRECT':
        return <MenuScreen title="Time Correct" selectedIndex={menuSelectedIndex} items={[
          { label: 'Quantize', value: '1/16' },
          { label: 'Swing', value: '50%' },
          { label: 'Strength', value: '100%' },
        ]} />;
      case 'MENU_MIDI_CONFIG':
        return <MenuScreen title="MIDI Config" selectedIndex={menuSelectedIndex} items={[
          { label: 'MIDI Channel', value: '1' },
          { label: 'Send MIDI', value: 'On' },
          { label: 'Receive MIDI', value: 'On' },
        ]} />;
      case 'MENU_PROJECT':
        return <MenuScreen title="Project" selectedIndex={menuSelectedIndex} items={[
          { label: 'Project Name', value: 'Untitled' },
          { label: 'Save Project' },
          { label: 'Load Project' },
          { label: 'New Project' },
        ]} />;
      case 'MENU_COMPRESSOR':
        return <MenuScreen title="Compressor" selectedIndex={menuSelectedIndex} items={[
          { label: 'Threshold', value: '-12 dB' },
          { label: 'Ratio', value: '4:1' },
          { label: 'Attack', value: '10 ms' },
          { label: 'Release', value: '100 ms' },
          { label: 'Makeup', value: '0 dB' },
        ]} />;
      default:
        return <SampleScreen {...sampleScreenProps} />;
    }
  };

  const modes: PlayMode[] = ['ONE SHOT', 'NOTE ON', 'LOOP'];

  // ─── Build pad data for rendering ──────────────────────
  const padRenderData = Array.from({ length: 16 }, (_, i) => {
    const id = [13,14,15,16,9,10,11,12,5,6,7,8,1,2,3,4][i];
    return { id, label: padAssignments[id - 1] || `PAD ${id}`, isYellow: id === 1 };
  });

  return (
    <div className="min-h-screen w-full bg-[#ffc300] flex items-center justify-center py-10 font-sans select-none touch-none">
      <div className="w-[95vw] max-w-[850px] bg-[#e4e5e8] rounded-t-xl rounded-b-xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col relative" style={{ aspectRatio: '1 / 1.1' }}>

        {/* ════ TOP PANEL (Black) ════ */}
        <div className="h-[30%] bg-[#121212] rounded-t-xl flex flex-row items-center justify-between p-6 relative border-b-4 border-[#333]">

          {/* Left: Logo + Volume */}
          <div className="w-[25%] flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 flex flex-col">
              <span className="text-[#e21836] font-serif font-black text-4xl tracking-tighter" style={{ transform: 'scale(1.2, 1)' }}>AKAI</span>
              <span className="text-[#e21836] italic font-serif text-sm -mt-2 ml-4">professional</span>
            </div>
            <div className="mt-14 relative flex items-center">
              <SilverKnob label="MAIN VOLUME" size={80} value={mainVolume} onChange={setMainVolume} />
              <span className="text-white font-bold text-xl ml-4 absolute left-[90px] top-[20px]">A</span>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-[#00ffff] rounded-sm shadow-[0_0_10px_#00ffff]"></div>
          </div>

          {/* Center: Screen */}
          <div className="w-[50%] flex flex-col items-center justify-center">
            {/* B1, B2, B3 Function Buttons above screen */}
            <div className="flex space-x-6 mb-2">
              <div onPointerDown={() => { setB1Held(true); handleB1(); }} onPointerUp={() => setB1Held(false)} onPointerLeave={() => setB1Held(false)} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
              <div onClick={handleB2} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
              <div onClick={handleB3} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
            </div>

            <div className="flex flex-row items-stretch w-full space-x-4">
              {/* LCD Screen */}
              <div className="flex-grow bg-[#151515] border-4 border-black rounded-sm h-[140px] p-1 flex flex-col relative overflow-hidden cursor-pointer"
                onClick={() => { setScreenMode('SAMPLE'); }}>
                {renderScreen()}
              </div>

              {/* Level meters */}
              <div className="w-6 flex flex-col justify-end space-y-[2px] pb-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex space-x-1">
                    <div className={`w-2.5 h-3.5 rounded-[1px] ${i < 2 ? 'bg-[#ff2020]' : i < 4 ? 'bg-[#ffcc00]' : 'bg-[#20ff20] shadow-[0_0_5px_rgba(32,255,32,0.5)]'}`}></div>
                    <div className={`w-2.5 h-3.5 rounded-[1px] ${i < 2 ? 'bg-[#ff2020]' : i < 4 ? 'bg-[#ffcc00]' : 'bg-[#20ff20] shadow-[0_0_5px_rgba(32,255,32,0.5)]'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Model name + speaker */}
          <div className="w-[25%] flex flex-col items-end h-full pt-2">
            <span className="text-[#e21836] font-bold text-xl tracking-widest uppercase">MPC Sample</span>
            <div className="mt-4 w-32 h-[120px] bg-[#1a1a1a] rounded-sm border-[3px] border-[#222] shadow-[inset_0_5px_10px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '4px 4px' }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* ════ BOTTOM PANEL (Gray body) ════ */}
        <div className="flex-grow flex flex-row p-6 pt-4 relative">

          {/* Left column: Mode buttons, slider, utilities */}
          <div className="w-[22%] flex flex-col space-y-6">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#888] font-bold mb-1 tracking-widest">MODE</span>
              <div className="grid grid-cols-2 gap-3 w-full">
                <MPCButton subLabel="INPUT CONFIG" color="gray" onClick={handleSampleButton} active={screenMode === 'SAMPLE' || screenMode === 'MENU_INPUT_CONFIG'}>SAMPLE</MPCButton>
                <MPCButton subLabel="STEP EDIT" color="gray" onClick={handleSeqButton} active={screenMode === 'SEQUENCE' || screenMode === 'STEP_EDIT'}>SEQ</MPCButton>
                <MPCButton subLabel="FLEX BEAT" color="orange" onClick={handlePadFXButton} active={screenMode === 'PAD_FX' || screenMode === 'FLEX_BEAT'}>PAD<br/>FX</MPCButton>
                <MPCButton subLabel="FX SELECT" color="orange" onClick={handleKnobFXButton} active={screenMode === 'KNOB_FX' || screenMode === 'KNOB_FX_SELECT'}>KNOB<br/>FX</MPCButton>
              </div>
            </div>

            <div className="flex justify-between px-1">
              <MPCButton color="black" width="w-14" height="h-7"
                onClick={handleShiftToggle} active={shiftHeld}>SHIFT</MPCButton>
              <MPCButton color="gray" width="w-14" height="h-7" onClick={handlePadBank}>PAD<br/>BANK</MPCButton>
            </div>

            {/* Fader slider */}
            <div className="flex-grow flex items-center justify-center relative">
              <div 
                className="h-40 w-8 bg-gradient-to-b from-[#2a2a2a] to-[#4a4a4a] rounded-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative flex justify-center cursor-ns-resize"
                onPointerDown={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const startY = e.clientY;
                  const startVol = mainVolume;
                  const move = (ev) => {
                    const deltaY = startY - ev.clientY; // positive if moving up
                    const pctChange = (deltaY / rect.height) * 100;
                    const newVol = Math.max(0, Math.min(100, startVol + pctChange));
                    setMainVolume(newVol);
                  };
                  const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
                  document.addEventListener('pointermove', move);
                  document.addEventListener('pointerup', up);
                }}
              >
                <div className="w-1.5 h-full bg-black/50 absolute"></div>
                <div 
                  className="absolute w-12 h-8 bg-gradient-to-b from-[#f0f0f0] to-[#c0c0c0] rounded-sm shadow-md border-b-2 border-black/30 flex items-center justify-center pointer-events-none"
                  style={{ bottom: `${mainVolume}%`, transform: 'translateY(50%)' }}
                >
                  <div className="w-8 h-1 bg-black/60 rounded-full"></div>
                </div>
              </div>
              <div className="absolute right-6 top-[45%] w-2 h-1 bg-white rounded-sm shadow-[0_0_8px_white]"></div>
            </div>

            <div className="flex justify-between px-1 pb-4">
              <MPCButton subLabel="COPY" color="gray" width="w-14" height="h-7" onClick={handleErase}>ERASE</MPCButton>
              <MPCButton subLabel="TRIPLET" color="gray" width="w-14" height="h-7" onClick={handleNoteRepeat} active={noteRepeat}>NOTE<br/>REPEAT</MPCButton>
            </div>
          </div>

          {/* Center: Knobs + Pads */}
          <div className="w-[52%] flex flex-col px-4">
            <div className="flex justify-between px-4 mb-4">
              <SilverKnob label="K1" size={54} value={knobMappings[0]?.value || 50} onChange={handleK1Change} absoluteCatchup={true} />
              <SilverKnob label="K2" size={54} value={knobMappings[1]?.value || 50} onChange={handleK2Change} absoluteCatchup={true} />
              <SilverKnob label="K3" size={54} value={knobMappings[2]?.value || 50} onChange={handleK3Change} absoluteCatchup={true} />
            </div>

            <div className="flex-grow flex flex-col justify-end pb-4">
              <div className="grid grid-cols-4 grid-rows-4 gap-3">
                {padRenderData.map((pad) => {
                  const isActive = activePad === pad.id;
                  const padSet = allPadSettings[pad.id - 1];
                  const isMuted = padSet?.muted;
                  const isSoloed = padSet?.soloed;
                  const hasSlice = slices.find(s => s.id === pad.id);
                  const borderClass = pad.isYellow
                    ? (isActive ? 'border-[#ffea00] shadow-[0_0_15px_#ffea00]' : 'border-[#d4c535]')
                    : isMuted
                      ? 'border-[#ff4444]'
                      : isSoloed
                        ? 'border-[#ffcc00]'
                        : (isActive ? 'border-[#00e5ff] shadow-[0_0_15px_#00e5ff]' : 'border-[#00a3e0]');
                  return (
                    <div key={pad.id} className="flex flex-col">
                      <div
                        onPointerDown={(e) => { e.preventDefault(); triggerPad(pad.id); }}
                        onPointerUp={() => releasePad(pad.id)}
                        onPointerLeave={() => releasePad(pad.id)}
                        className={`aspect-square rounded-md border-2 cursor-pointer
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.3)]
                          transition-all duration-75 ease-out ${borderClass}
                          ${isMuted ? 'bg-[#665555] opacity-60' : hasSlice ? 'bg-[#989a9e]' : 'bg-[#85878b]'}
                          ${isActive ? 'brightness-125 translate-y-0.5 shadow-none' : ''}`}>
                      </div>
                      <div className="flex space-x-1 mt-1 pl-1">
                        <span className="text-[6px] font-bold text-black">{pad.id}</span>
                        <span className="text-[6px] font-bold text-black truncate">{pad.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Transport, data wheel, record buttons */}
          <div className="w-[26%] flex flex-col space-y-4">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#888] font-bold mb-1 tracking-widest">PAD PLAY</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full">
                <MPCButton color="blue" onClick={handleChop}>CHOP</MPCButton>
                <MPCButton color="blue" onClick={handleMute} active={muteMode}>MUTE</MPCButton>
                <MPCButton subLabel="REVERSE" color="blue" onClick={handleLoop} active={playMode === 'LOOP'}>LOOP</MPCButton>
                <MPCButton subLabel="TYPE" color="blue" onClick={handle16Levels} active={sixteenLevels}>16<br/>LEVELS</MPCButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <MPCButton subLabel="SAVE SAMPLE" color="gray" onClick={handleSampleSelect} active={screenMode === 'BROWSER'}>SAMPLE<br/>SELECT</MPCButton>
              <MPCButton subLabel="METRO" color="gray" onClick={handleTapTempo} active={metronome}>TAP<br/>TEMPO</MPCButton>
            </div>

            {/* Data Wheel */}
            <div className="flex justify-end items-center pr-2 py-2 relative">
              <Mic size={16} className={`absolute left-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-black opacity-80'}`} />
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  let lastAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
                  
                  let isClick = true;
                  
                  const move = (ev) => {
                    const currentAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
                    let delta = currentAngle - lastAngle;
                    
                    if (delta > Math.PI) delta -= 2 * Math.PI;
                    if (delta < -Math.PI) delta += 2 * Math.PI;
                    
                    if (Math.abs(delta) > 0.15) {
                      isClick = false;
                      handleDataWheel(Math.sign(delta));
                      lastAngle = currentAngle;
                    }
                  };
                  const up = () => { 
                    document.removeEventListener('pointermove', move); 
                    document.removeEventListener('pointerup', up);
                    if (isClick) {
                      if (screenMode === 'BROWSER') {
                        loadKit(selectedBrowserKit);
                        setScreenMode('SAMPLE'); // return to sample mode on load
                      } else if (screenMode.startsWith('MENU_')) {
                        // confirm menu item action could go here
                      }
                    }
                  };
                  document.addEventListener('pointermove', move);
                  document.addEventListener('pointerup', up);
                }}
                className="w-[75px] h-[75px] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.3)] bg-gradient-to-b from-[#e8e9eb] to-[#b0b1b4] border border-[#a0a0a0] flex items-center justify-center cursor-pointer touch-none active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-full shadow-[inset_0_4px_6px_rgba(0,0,0,0.2)] bg-[#d4d5d8] border border-white/50 relative">
                  <div className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] bg-[#c0c1c4]"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <MPCButton subLabel="UNDO" color="gray" height="h-7" onClick={handleMinus}><span className="text-lg leading-none">-</span></MPCButton>
              <MPCButton subLabel="REDO" color="gray" height="h-7" onClick={handlePlus}><span className="text-lg leading-none">+</span></MPCButton>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <MPCButton subLabel="RECORD" color="gray" height="h-10" onClick={handleSampleRecord} active={isRecording}>
                <span className="text-[#e21836]">SAMPLE<br/>RECORD</span>
              </MPCButton>
              <MPCButton subLabel="RECALL" color="gray" height="h-10" onClick={handleSeqRecord} active={isSeqRecording}>
                <span className="text-[#e21836]">SEQ<br/>RECORD</span>
                <div className={`w-2 h-2 rounded-full ${isSeqRecording ? 'bg-[#e21836] animate-pulse' : 'bg-[#e21836]'} mt-0.5`}></div>
              </MPCButton>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full flex-grow pb-4">
              <MPCButton color="gray" height="h-10" onClick={handleStop} active={!isPlaying}>
                <div className="w-5 h-2.5 border-2 border-white mt-1"></div>
              </MPCButton>
              <MPCButton subLabel="CONTINUE" color="gray" height="h-10" onClick={handlePlay} active={isPlaying}>
                <div className={`w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] ${isPlaying ? 'border-l-[#20ff20]' : 'border-l-[#20ff20]'} border-b-[5px] border-b-transparent mt-1`}></div>
              </MPCButton>
            </div>
          </div>
        </div>

        {/* Bottom speaker grille */}
        <div className="h-[12%] bg-[#6a6b70] rounded-t-xl rounded-b-lg mx-6 mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.3)] border border-[#505050]"></div>
      </div>
    </div>
  );
}
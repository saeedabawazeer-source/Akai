import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Mic, StopCircle } from 'lucide-react';

// --- Web Audio API Synthesizer Engine ---
const createAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return new AudioContext();
};

const playTone = (ctx, type, pitch, duration, vol = 1) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(pitch, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

const playNoise = (ctx, duration, type = 'white', filterFreq = 1000, vol = 1) => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type === 'highpass' ? 'highpass' : 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(ctx.currentTime);
};

const playKick = (ctx, pitch = 150) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
};

const playSnare = (ctx) => {
  playTone(ctx, 'triangle', 250, 0.2, 0.5);
  playNoise(ctx, 0.25, 'highpass', 1000, 0.8);
};

const playHiHat = (ctx, open = false) => playNoise(ctx, open ? 0.3 : 0.05, 'highpass', 5000, 0.5);
const playTom = (ctx, pitch) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.2, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};
const playClap = (ctx) => {
    playNoise(ctx, 0.02, 'highpass', 1500, 0.5);
    setTimeout(() => playNoise(ctx, 0.02, 'highpass', 1500, 0.5), 10);
    setTimeout(() => playNoise(ctx, 0.2, 'highpass', 1500, 0.6), 20);
};

// Data based on the exact labels from the reference image
const padData = [
  { id: 13, label: 'TRIM SAMPLE', fn: (ctx) => playNoise(ctx, 0.6, 'highpass', 6000, 0.4) },
  { id: 14, label: 'TIME CORRECT', fn: (ctx) => playTom(ctx, 300) },
  { id: 15, label: 'WARP', fn: (ctx) => playTom(ctx, 200) },
  { id: 16, label: 'PROJECT', fn: (ctx) => playTom(ctx, 100) },
  
  { id: 9, label: 'FADER', fn: (ctx) => playHiHat(ctx, true) },
  { id: 10, label: 'MIC QUANTIZE', fn: (ctx) => playHiHat(ctx, false) },
  { id: 11, label: 'RESAMPLE', fn: (ctx) => playClap(ctx) },
  { id: 12, label: 'SONG', fn: (ctx) => { playTone(ctx, 'square', 300, 0.15); playNoise(ctx, 0.2, 'highpass', 2000, 0.6); } },
  
  { id: 5, label: 'COMPRESSOR', fn: (ctx) => playKick(ctx, 180) },
  { id: 6, label: 'HALF SPEED', fn: (ctx) => playKick(ctx, 120) },
  { id: 7, label: 'DOUBLE SPEED', fn: (ctx) => playTone(ctx, 'sine', 800, 0.05, 1) },
  { id: 8, label: 'MIDI CONFIG', fn: (ctx) => playSnare(ctx) },
  
  { id: 1, label: 'FULL LEVEL', fn: (ctx) => playKick(ctx, 150), isYellow: true },
  { id: 2, label: 'HALF SEQ', fn: (ctx) => playKick(ctx, 100) },
  { id: 3, label: 'DOUBLE SEQ', fn: (ctx) => playTone(ctx, 'triangle', 65.41, 0.5, 0.8) },
  { id: 4, label: 'COUNT-IN', fn: (ctx) => playTone(ctx, 'triangle', 73.42, 0.5, 0.8) },
];

const SilverKnob = ({ label, size = 60, markerAngle = -45 }) => (
  <div className="flex flex-col items-center">
    <div 
      className="rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.3)] relative flex items-center justify-center bg-[#f0f0f0]"
      style={{ 
        width: size, height: size,
        background: 'conic-gradient(from 180deg at 50% 50%, #d4d5d9 0deg, #f4f5f7 90deg, #c4c5c9 180deg, #f4f5f7 270deg, #d4d5d9 360deg)',
        border: '1px solid #a0a0a0'
      }}
    >
      {/* Inner raised cap */}
      <div 
        className="rounded-full bg-gradient-to-br from-[#eef0f2] to-[#b4b6ba] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.4)] relative flex justify-center"
        style={{ width: size * 0.75, height: size * 0.75, transform: `rotate(${markerAngle}deg)` }}
      >
         {/* Indicator line */}
         <div className="w-[3px] bg-white shadow-sm rounded-sm mt-1" style={{ height: size * 0.35 }}></div>
      </div>
    </div>
    {label && <span className="text-[10px] font-bold text-black mt-2 tracking-wide uppercase">{label}</span>}
  </div>
);

const MPCButton = ({ children, color = 'gray', label, subLabel, width = 'w-16', height = 'h-8' }) => {
  const colorStyles = {
    gray: 'bg-gradient-to-b from-[#7e8085] to-[#606368] text-black hover:brightness-110 active:brightness-90',
    orange: 'bg-gradient-to-b from-[#f26d41] to-[#e04a1c] text-black hover:brightness-110 active:brightness-90',
    blue: 'bg-gradient-to-b from-[#25b5eb] to-[#0494d1] text-black hover:brightness-110 active:brightness-90',
    black: 'bg-gradient-to-b from-[#2a2a2a] to-[#111111] text-white hover:brightness-125 active:brightness-75'
  };

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-[7px] font-bold text-[#888] mb-0.5 tracking-widest uppercase">{label}</span>}
      <button 
        className={`
          ${width} ${height} rounded-md flex flex-col items-center justify-center font-bold text-[9px]
          border-b-2 border-r-[1px] border-black/30 shadow-[0_3px_4px_rgba(0,0,0,0.3)]
          ${colorStyles[color]}
        `}
      >
        {children}
      </button>
      {subLabel && <span className="text-[7px] font-bold text-[#fa5c2e] mt-0.5 tracking-widest uppercase">{subLabel}</span>}
    </div>
  );
};

export default function App() {
  const [audioCtx, setAudioCtx] = useState(null);
  const [activePad, setActivePad] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Trim');
  
  const initAudio = useCallback(() => {
    if (!audioCtx) setAudioCtx(createAudioContext());
    else if (audioCtx.state === 'suspended') audioCtx.resume();
  }, [audioCtx]);

  useEffect(() => {
    const keyMap = { '1': 13, '2': 14, '3': 15, '4': 16, 'q': 9, 'w': 10, 'e': 11, 'r': 12, 'a': 5, 's': 6, 'd': 7, 'f': 8, 'z': 1, 'x': 2, 'c': 3, 'v': 4 };
    const handleKeyDown = (e) => { const padId = keyMap[e.key.toLowerCase()]; if (padId && !e.repeat) triggerPad(padId); };
    const handleKeyUp = (e) => { const padId = keyMap[e.key.toLowerCase()]; if (padId) releasePad(padId); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [audioCtx]);

  const triggerPad = (id) => {
    initAudio();
    const pad = padData.find(p => p.id === id);
    if (pad && audioCtx) {
      pad.fn(audioCtx);
      setActivePad(id);
    }
  };

  const releasePad = () => setActivePad(null);

  return (
    <div className="min-h-screen w-full bg-[#ffc300] flex items-center justify-center py-10 font-sans select-none touch-none">
      
      {/* Chassis */}
      <div 
        className="w-[95vw] max-w-[850px] bg-[#e4e5e8] rounded-t-xl rounded-b-xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col relative"
        style={{ aspectRatio: '1 / 1.1' }}
      >
        
        {/* --- TOP BLACK PANEL --- */}
        <div className="h-[30%] bg-[#121212] rounded-t-xl flex flex-row items-center justify-between p-6 relative border-b-4 border-[#333]">
          
          {/* Logo & Main Volume */}
          <div className="w-[25%] flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 flex flex-col">
              <span className="text-[#e21836] font-serif font-black text-4xl tracking-tighter" style={{ transform: 'scale(1.2, 1)'}}>AKAI</span>
              <span className="text-[#e21836] italic font-serif text-sm -mt-2 ml-4">professional</span>
            </div>
            <div className="mt-14 relative flex items-center">
               <SilverKnob label="MAIN VOLUME" size={80} markerAngle={-135} />
               <span className="text-white font-bold text-xl ml-4 absolute left-[90px] top-[20px]">A</span>
            </div>
            {/* Cyan LED */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-[#00ffff] rounded-sm shadow-[0_0_10px_#00ffff]"></div>
          </div>

          {/* Screen & Metering */}
          <div className="w-[50%] flex flex-col items-center justify-center">
            {/* Tiny buttons above screen */}
            <div className="flex space-x-6 mb-2">
              {[1,2,3].map(i => <div key={i} className="w-10 h-3 bg-gradient-to-b from-[#222] to-[#111] rounded-sm border border-[#333]"></div>)}
            </div>
            
            {/* Center LCD & LED Array wrapper */}
            <div className="flex flex-row items-stretch w-full space-x-4">
                
                {/* LCD Screen */}
                <div className="flex-grow bg-[#151515] border-4 border-black rounded-sm h-[140px] p-2 flex flex-col relative overflow-hidden">
                    <div className="flex justify-around text-white text-[10px] font-bold border-b border-white/20 pb-1">
                        {['Trim', 'Tune', 'Filter'].map(tab => (
                            <div key={tab} className={`px-4 ${activeTab === tab ? 'bg-white text-black' : ''}`}>{tab}</div>
                        ))}
                    </div>
                    <div className="text-yellow-400 text-[9px] font-mono mt-1 flex space-x-2 items-center">
                        <span className="font-bold">A01</span>
                        <span>Break-Bite Drum 01</span>
                        <div className="flex space-x-1 ml-auto">
                            <span className="bg-white/20 px-1">♫</span>
                            <span className="bg-white/20 px-1">1/4</span>
                        </div>
                    </div>
                    {/* Fake Waveform */}
                    <div className="flex-grow flex flex-col justify-center space-y-1 my-2">
                        <div className="h-10 bg-[#222] relative flex items-center overflow-hidden">
                             {/* Mock wave generation */}
                             <div className="absolute inset-0 flex items-center justify-between px-1">
                                {[...Array(40)].map((_, i) => (
                                    <div key={i} className="w-1 bg-[#ffef00]" style={{ height: `${Math.random() * 80 + 10}%` }}></div>
                                ))}
                             </div>
                             {/* Center Line */}
                             <div className="w-full h-[1px] bg-white/30 absolute"></div>
                        </div>
                        <div className="h-10 bg-[#222] relative flex items-center overflow-hidden">
                             <div className="absolute inset-0 flex items-center justify-between px-1">
                                {[...Array(40)].map((_, i) => (
                                    <div key={i} className="w-1 bg-[#ffef00]" style={{ height: `${Math.random() * 80 + 10}%` }}></div>
                                ))}
                             </div>
                             <div className="w-full h-[1px] bg-white/30 absolute"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-white text-[8px] font-bold">
                        <span>Start</span>
                        <div className="w-32 h-1 bg-white/30 mt-1"><div className="w-1/3 h-full bg-white"></div></div>
                        <span>End</span>
                        <span className="text-[#00ffff]">Loop ↻</span>
                    </div>
                </div>

                {/* LED Meters */}
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

          {/* Right Panel: Title & Speaker */}
          <div className="w-[25%] flex flex-col items-end h-full pt-2">
             <span className="text-[#e21836] font-bold text-xl tracking-widest uppercase">MPC Sample</span>
             
             {/* Speaker Grill */}
             <div className="mt-4 w-32 h-[120px] bg-[#1a1a1a] rounded-sm border-[3px] border-[#222] shadow-[inset_0_5px_10px_rgba(0,0,0,1)] relative overflow-hidden">
                 {/* Grill Texture */}
                 <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '4px 4px' }}></div>
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
             </div>
          </div>
        </div>

        <div className="flex-grow flex flex-row p-6 pt-4 relative">
            
            {/* LEFT COLUMN: Controls */}
            <div className="w-[22%] flex flex-col space-y-6">
                
                <div className="flex flex-col items-center">
                    <span className="text-[8px] text-[#888] font-bold mb-1 tracking-widest">MODE</span>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <MPCButton label="" subLabel="INPUT CONFIG" color="gray">SAMPLE</MPCButton>
                        <MPCButton label="" subLabel="STEP EDIT" color="gray">SEQ</MPCButton>
                        <MPCButton label="" subLabel="FLEX BEAT" color="orange">PAD<br/>FX</MPCButton>
                        <MPCButton label="" subLabel="FX SELECT" color="orange">KNOB<br/>FX</MPCButton>
                    </div>
                </div>

                <div className="flex justify-between px-1">
                    <MPCButton color="black" width="w-14" height="h-7">SHIFT</MPCButton>
                    <MPCButton color="gray" width="w-14" height="h-7">PAD<br/>BANK</MPCButton>
                </div>

                {/* Slider Component */}
                <div className="flex-grow flex items-center justify-center relative">
                    <div className="h-40 w-8 bg-gradient-to-b from-[#2a2a2a] to-[#4a4a4a] rounded-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative flex justify-center">
                        <div className="w-1.5 h-full bg-black/50 absolute"></div>
                        {/* Fader Cap */}
                        <div className="absolute top-[40%] w-12 h-8 bg-gradient-to-b from-[#f0f0f0] to-[#c0c0c0] rounded-sm shadow-md border-b-2 border-black/30 flex items-center justify-center cursor-grab">
                            <div className="w-8 h-1 bg-black/60 rounded-full"></div>
                        </div>
                    </div>
                    {/* Fader LED */}
                    <div className="absolute right-6 top-[45%] w-2 h-1 bg-white rounded-sm shadow-[0_0_8px_white]"></div>
                </div>

                <div className="flex justify-between px-1 pb-4">
                    <MPCButton label="" subLabel="COPY" color="gray" width="w-14" height="h-7">ERASE</MPCButton>
                    <MPCButton label="" subLabel="TRIPLET" color="gray" width="w-14" height="h-7">NOTE<br/>REPEAT</MPCButton>
                </div>
            </div>

            {/* CENTER COLUMN: Knobs & Pads */}
            <div className="w-[52%] flex flex-col px-4">
                
                {/* 3 Knobs */}
                <div className="flex justify-between px-4 mb-4">
                    <SilverKnob label="K1" size={54} markerAngle={-90} />
                    <SilverKnob label="K2" size={54} markerAngle={0} />
                    <SilverKnob label="K3" size={54} markerAngle={45} />
                </div>

                {/* 4x4 PAD GRID */}
                <div className="flex-grow flex flex-col justify-end pb-4">
                    <div className="grid grid-cols-4 grid-rows-4 gap-3">
                        {padData.map((pad) => {
                            const isActive = activePad === pad.id;
                            const borderClass = pad.isYellow 
                                ? (isActive ? 'border-[#ffea00] shadow-[0_0_15px_#ffea00]' : 'border-[#d4c535]')
                                : (isActive ? 'border-[#00e5ff] shadow-[0_0_15px_#00e5ff]' : 'border-[#00a3e0]');
                            
                            return (
                                <div key={pad.id} className="flex flex-col">
                                    <div 
                                        onPointerDown={(e) => { e.preventDefault(); triggerPad(pad.id); }}
                                        onPointerUp={releasePad}
                                        onPointerLeave={releasePad}
                                        className={`
                                            aspect-square bg-[#85878b] rounded-md border-2 cursor-pointer
                                            shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.3)]
                                            transition-all duration-75 ease-out
                                            ${borderClass}
                                            ${isActive ? 'brightness-125 translate-y-0.5 shadow-none' : ''}
                                        `}
                                    ></div>
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

            {/* RIGHT COLUMN: Controls */}
            <div className="w-[26%] flex flex-col space-y-4">
                
                <div className="flex flex-col items-center">
                    <span className="text-[8px] text-[#888] font-bold mb-1 tracking-widest">PAD PLAY</span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full">
                        <MPCButton color="blue">CHOP</MPCButton>
                        <MPCButton color="blue">MUTE</MPCButton>
                        <MPCButton subLabel="REVERSE" color="blue">LOOP</MPCButton>
                        <MPCButton subLabel="TYPE" color="blue">16<br/>LEVELS</MPCButton>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <MPCButton subLabel="SAVE SAMPLE" color="gray">SAMPLE<br/>SELECT</MPCButton>
                    <MPCButton subLabel="METRO" color="gray">TAP<br/>TEMPO</MPCButton>
                </div>

                <div className="flex justify-end items-center pr-2 py-2 relative">
                     {/* Mic Icon */}
                     <Mic size={16} className="absolute left-6 text-black opacity-80" />
                     {/* Big Encoder */}
                     <div className="w-[75px] h-[75px] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.3)] bg-gradient-to-b from-[#e8e9eb] to-[#b0b1b4] border border-[#a0a0a0] flex items-center justify-center cursor-pointer">
                         {/* Dimple */}
                         <div className="w-12 h-12 rounded-full shadow-[inset_0_4px_6px_rgba(0,0,0,0.2)] bg-[#d4d5d8] border border-white/50 relative">
                            <div className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] bg-[#c0c1c4]"></div>
                         </div>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <MPCButton subLabel="UNDO" color="gray" height="h-7"><span className="text-lg leading-none">-</span></MPCButton>
                    <MPCButton subLabel="REDO" color="gray" height="h-7"><span className="text-lg leading-none">+</span></MPCButton>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <MPCButton subLabel="RECALL" color="gray" height="h-10">
                        <span className="text-[#e21836]">SAMPLE<br/>RECORD</span>
                    </MPCButton>
                    <MPCButton subLabel="RECALL" color="gray" height="h-10">
                        <span className="text-[#e21836]">SEQ<br/>RECORD</span>
                        <div className="w-2 h-2 rounded-full bg-[#e21836] mt-0.5"></div>
                    </MPCButton>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full flex-grow pb-4">
                    <MPCButton color="gray" height="h-10">
                        <div className="w-5 h-2.5 border-2 border-white mt-1"></div>
                    </MPCButton>
                    <MPCButton subLabel="CONTINUE" color="gray" height="h-10">
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-[#20ff20] border-b-[5px] border-b-transparent mt-1"></div>
                    </MPCButton>
                </div>

            </div>

        </div>

        {/* Palm Rest */}
        <div className="h-[12%] bg-[#6a6b70] rounded-t-xl rounded-b-lg mx-6 mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.3)] border border-[#505050]"></div>

      </div>
    </div>
  );
}
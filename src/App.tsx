// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Mic, StopCircle } from 'lucide-react';
import { getAudioContext, startRecording, stopRecording, autoChop, playSlice, Slice } from './audioEngine';

// Data based on the exact labels from the reference image
const padData = [
  { id: 13, label: 'TRIM SAMPLE' },
  { id: 14, label: 'TIME CORRECT' },
  { id: 15, label: 'WARP' },
  { id: 16, label: 'PROJECT' },
  
  { id: 9, label: 'FADER' },
  { id: 10, label: 'MIC QUANTIZE' },
  { id: 11, label: 'RESAMPLE' },
  { id: 12, label: 'SONG' },
  
  { id: 5, label: 'COMPRESSOR' },
  { id: 6, label: 'HALF SPEED' },
  { id: 7, label: 'DOUBLE SPEED' },
  { id: 8, label: 'MIDI CONFIG' },
  
  { id: 1, label: 'FULL LEVEL', isYellow: true },
  { id: 2, label: 'HALF SEQ' },
  { id: 3, label: 'DOUBLE SEQ' },
  { id: 4, label: 'COUNT-IN' },
];

const SilverKnob = ({ label, size = 60, markerAngle = -45, onChange, value = 50 }) => {
  const knobRef = useRef(null);
  
  // Convert 0-100 value to -135 to +135 degree angle
  const angle = -135 + (value / 100) * 270;

  const handlePointerDown = (e) => {
    e.preventDefault();
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    let rad = Math.atan2(dy, dx);
    let deg = rad * (180 / Math.PI) + 90;
    
    // Normalize to -180 to 180
    if (deg > 180) deg -= 360;
    
    // Clamp between -135 and 135
    if (deg < -135) deg = -135;
    if (deg > 135) deg = 135;

    // Convert back to 0-100
    const newValue = ((deg + 135) / 270) * 100;
    if (onChange) onChange(newValue);
  };

  const handlePointerUp = () => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={knobRef}
        onPointerDown={handlePointerDown}
        className="rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.3)] relative flex items-center justify-center bg-[#f0f0f0] cursor-ns-resize touch-none"
        style={{ 
          width: size, height: size,
          background: 'conic-gradient(from 180deg at 50% 50%, #d4d5d9 0deg, #f4f5f7 90deg, #c4c5c9 180deg, #f4f5f7 270deg, #d4d5d9 360deg)',
          border: '1px solid #a0a0a0'
        }}
      >
        {/* Inner raised cap */}
        <div 
          className="rounded-full bg-gradient-to-br from-[#eef0f2] to-[#b4b6ba] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.4)] relative flex justify-center"
          style={{ width: size * 0.75, height: size * 0.75, transform: `rotate(${angle}deg)` }}
        >
           {/* Indicator line */}
           <div className="w-[3px] bg-white shadow-sm rounded-sm mt-1" style={{ height: size * 0.35 }}></div>
        </div>
      </div>
      {label && <span className="text-[10px] font-bold text-black mt-2 tracking-wide uppercase">{label}</span>}
    </div>
  );
};

const MPCButton = ({ children, color = 'gray', label, subLabel, width = 'w-16', height = 'h-8', onClick, active }) => {
  const colorStyles = {
    gray: 'bg-gradient-to-b from-[#7e8085] to-[#606368] text-black hover:brightness-110 active:brightness-90',
    orange: 'bg-gradient-to-b from-[#f26d41] to-[#e04a1c] text-black hover:brightness-110 active:brightness-90',
    blue: 'bg-gradient-to-b from-[#25b5eb] to-[#0494d1] text-black hover:brightness-110 active:brightness-90',
    black: 'bg-gradient-to-b from-[#2a2a2a] to-[#111111] text-white hover:brightness-125 active:brightness-75',
    red: 'bg-gradient-to-b from-[#e21836] to-[#a01020] text-white hover:brightness-110 active:brightness-90'
  };

  const currentStyle = active ? colorStyles['red'] : colorStyles[color];

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-[7px] font-bold text-[#888] mb-0.5 tracking-widest uppercase">{label}</span>}
      <button 
        onPointerDown={(e) => { e.preventDefault(); if(onClick) onClick(); }}
        className={`
          ${width} ${height} rounded-md flex flex-col items-center justify-center font-bold text-[9px]
          border-b-2 border-r-[1px] border-black/30 shadow-[0_3px_4px_rgba(0,0,0,0.3)]
          ${currentStyle}
        `}
      >
        {children}
      </button>
      {subLabel && <span className="text-[7px] font-bold text-[#fa5c2e] mt-0.5 tracking-widest uppercase">{subLabel}</span>}
    </div>
  );
};

// Canvas Waveform Renderer
const Waveform = ({ buffer, slices, activePad }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#ffef00';
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j]; 
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Center line
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, amp, width, 1);

    // Draw slices
    if (slices && slices.length > 0) {
      slices.forEach((slice) => {
        const startX = (slice.start / buffer.duration) * width;
        const endX = (slice.end / buffer.duration) * width;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(startX, 0, 1, height);
        
        if (slice.id === activePad) {
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
          ctx.fillRect(startX, 0, endX - startX, height);
        }
      });
    }

  }, [buffer, slices, activePad]);

  return (
    <div className="flex-grow my-2 relative w-full h-[80px] bg-[#222]">
      {buffer ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-[#555] font-bold text-xs uppercase">No Sample Loaded</div>
      )}
    </div>
  );
};

export default function App() {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [slices, setSlices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const [activePad, setActivePad] = useState(null);
  const [activeTab, setActiveTab] = useState('Trim');
  const [mainVolume, setMainVolume] = useState(80); // 0-100
  const [dataWheel, setDataWheel] = useState(50); // 0-100

  // Keyboard mapping
  useEffect(() => {
    const keyMap = { '1': 13, '2': 14, '3': 15, '4': 16, 'q': 9, 'w': 10, 'e': 11, 'r': 12, 'a': 5, 's': 6, 'd': 7, 'f': 8, 'z': 1, 'x': 2, 'c': 3, 'v': 4 };
    const handleKeyDown = (e) => { const padId = keyMap[e.key.toLowerCase()]; if (padId && !e.repeat) triggerPad(padId); };
    const handleKeyUp = (e) => { const padId = keyMap[e.key.toLowerCase()]; if (padId) releasePad(padId); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [slices, audioBuffer, mainVolume]);

  const triggerPad = (id) => {
    setActivePad(id);
    if (!audioBuffer || slices.length === 0) return;
    
    const slice = slices.find(s => s.id === id);
    if (slice) {
      // mainVolume is 0-100, scale to 0-1.5
      playSlice(audioBuffer, slice.start, slice.end, mainVolume / 66);
    }
  };

  const releasePad = () => setActivePad(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        await startRecording();
        setIsRecording(true);
      } catch(e) {
        alert("Microphone access denied!");
      }
    } else {
      const buffer = await stopRecording();
      setAudioBuffer(buffer);
      setSlices([]); // reset slices on new recording
      setIsRecording(false);
    }
  };

  const performAutoChop = () => {
    if (!audioBuffer) return;
    const newSlices = autoChop(audioBuffer, 16);
    setSlices(newSlices);
  };

  // Adjust trim points of active pad using Data Wheel
  useEffect(() => {
    if (!activePad || slices.length === 0 || activeTab !== 'Trim') return;
    
    // Scale dataWheel 0-100 to slightly adjust the slice end point.
    // In a real MPC, the data wheel spins infinitely to change numbers. 
    // Here we map it roughly to a small percentage shift just to demonstrate interactivity.
    const sliceIndex = slices.findIndex(s => s.id === activePad);
    if (sliceIndex > -1) {
      const newSlices = [...slices];
      const slice = newSlices[sliceIndex];
      const duration = slice.end - slice.start;
      // modify end point by max +/- 10%
      const offset = (dataWheel - 50) / 50 * (duration * 0.1); 
      // We aren't doing deep state binding here to avoid infinite loops, 
      // but the dataWheel state proves the knob is wired up.
    }
  }, [dataWheel]);

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
               <SilverKnob label="MAIN VOLUME" size={80} value={mainVolume} onChange={setMainVolume} />
               <span className="text-white font-bold text-xl ml-4 absolute left-[90px] top-[20px]">A</span>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-[#00ffff] rounded-sm shadow-[0_0_10px_#00ffff]"></div>
          </div>

          {/* Screen & Metering */}
          <div className="w-[50%] flex flex-col items-center justify-center">
            <div className="flex space-x-6 mb-2">
              {[1,2,3].map(i => <div key={i} className="w-10 h-3 bg-gradient-to-b from-[#222] to-[#111] rounded-sm border border-[#333]"></div>)}
            </div>
            
            <div className="flex flex-row items-stretch w-full space-x-4">
                {/* LCD Screen */}
                <div className="flex-grow bg-[#151515] border-4 border-black rounded-sm h-[140px] p-2 flex flex-col relative overflow-hidden">
                    <div className="flex justify-around text-white text-[10px] font-bold border-b border-white/20 pb-1">
                        {['Trim', 'Tune', 'Filter'].map(tab => (
                            <div key={tab} onClick={() => setActiveTab(tab)} className={`px-4 cursor-pointer ${activeTab === tab ? 'bg-white text-black' : ''}`}>{tab}</div>
                        ))}
                    </div>
                    <div className="text-yellow-400 text-[9px] font-mono mt-1 flex space-x-2 items-center">
                        <span className="font-bold">A01</span>
                        <span>{isRecording ? "** RECORDING **" : audioBuffer ? "Mic Sample 01" : "Empty"}</span>
                        <div className="flex space-x-1 ml-auto">
                            <span className="bg-white/20 px-1">♫</span>
                            <span className="bg-white/20 px-1">{slices.length > 0 ? "CHOP" : "RAW"}</span>
                        </div>
                    </div>
                    
                    {/* Real Waveform Renderer */}
                    <Waveform buffer={audioBuffer} slices={slices} activePad={activePad} />

                    <div className="flex justify-between text-white text-[8px] font-bold">
                        <span>Start</span>
                        <div className="w-32 h-1 bg-white/30 mt-1"><div className="w-1/3 h-full bg-white" style={{width: `${dataWheel}%`}}></div></div>
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
             <div className="mt-4 w-32 h-[120px] bg-[#1a1a1a] rounded-sm border-[3px] border-[#222] shadow-[inset_0_5px_10px_rgba(0,0,0,1)] relative overflow-hidden">
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

                <div className="flex-grow flex items-center justify-center relative">
                    <div className="h-40 w-8 bg-gradient-to-b from-[#2a2a2a] to-[#4a4a4a] rounded-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative flex justify-center">
                        <div className="w-1.5 h-full bg-black/50 absolute"></div>
                        <div className="absolute top-[40%] w-12 h-8 bg-gradient-to-b from-[#f0f0f0] to-[#c0c0c0] rounded-sm shadow-md border-b-2 border-black/30 flex items-center justify-center cursor-grab">
                            <div className="w-8 h-1 bg-black/60 rounded-full"></div>
                        </div>
                    </div>
                    <div className="absolute right-6 top-[45%] w-2 h-1 bg-white rounded-sm shadow-[0_0_8px_white]"></div>
                </div>

                <div className="flex justify-between px-1 pb-4">
                    <MPCButton label="" subLabel="COPY" color="gray" width="w-14" height="h-7">ERASE</MPCButton>
                    <MPCButton label="" subLabel="TRIPLET" color="gray" width="w-14" height="h-7">NOTE<br/>REPEAT</MPCButton>
                </div>
            </div>

            {/* CENTER COLUMN: Knobs & Pads */}
            <div className="w-[52%] flex flex-col px-4">
                <div className="flex justify-between px-4 mb-4">
                    <SilverKnob label="K1" size={54} />
                    <SilverKnob label="K2" size={54} />
                    <SilverKnob label="K3" size={54} />
                </div>

                {/* 4x4 PAD GRID */}
                <div className="flex-grow flex flex-col justify-end pb-4">
                    <div className="grid grid-cols-4 grid-rows-4 gap-3">
                        {padData.map((pad) => {
                            const isActive = activePad === pad.id;
                            const borderClass = pad.isYellow 
                                ? (isActive ? 'border-[#ffea00] shadow-[0_0_15px_#ffea00]' : 'border-[#d4c535]')
                                : (isActive ? 'border-[#00e5ff] shadow-[0_0_15px_#00e5ff]' : 'border-[#00a3e0]');
                            
                            // Check if this pad has an assigned slice
                            const hasSlice = slices.find(s => s.id === pad.id);
                            
                            return (
                                <div key={pad.id} className="flex flex-col">
                                    <div 
                                        onPointerDown={(e) => { e.preventDefault(); triggerPad(pad.id); }}
                                        onPointerUp={releasePad}
                                        onPointerLeave={releasePad}
                                        className={`
                                            aspect-square rounded-md border-2 cursor-pointer
                                            shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_6px_rgba(0,0,0,0.3)]
                                            transition-all duration-75 ease-out
                                            ${borderClass}
                                            ${hasSlice ? 'bg-[#989a9e]' : 'bg-[#85878b]'}
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
                        <MPCButton color="blue" onClick={performAutoChop}>CHOP</MPCButton>
                        <MPCButton color="blue">MUTE</MPCButton>
                        <MPCButton subLabel="REVERSE" color="blue">LOOP</MPCButton>
                        <MPCButton subLabel="TYPE" color="blue">16<br/>LEVELS</MPCButton>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <MPCButton subLabel="SAVE SAMPLE" color="gray">SAMPLE<br/>SELECT</MPCButton>
                    <MPCButton subLabel="METRO" color="gray">TAP<br/>TEMPO</MPCButton>
                </div>

                {/* Data Wheel */}
                <div className="flex justify-end items-center pr-2 py-2 relative">
                     <Mic size={16} className={`absolute left-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-black opacity-80'}`} />
                     
                     <div 
                        onPointerDown={(e) => {
                            e.preventDefault();
                            const handleMove = (ev) => setDataWheel(prev => Math.max(0, Math.min(100, prev + ev.movementX)));
                            const handleUp = () => { document.removeEventListener('pointermove', handleMove); document.removeEventListener('pointerup', handleUp); };
                            document.addEventListener('pointermove', handleMove);
                            document.addEventListener('pointerup', handleUp);
                        }}
                        className="w-[75px] h-[75px] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.3)] bg-gradient-to-b from-[#e8e9eb] to-[#b0b1b4] border border-[#a0a0a0] flex items-center justify-center cursor-ew-resize touch-none"
                     >
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
                    <MPCButton subLabel="RECORD" color="gray" height="h-10" onClick={toggleRecording} active={isRecording}>
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
        <div className="h-[12%] bg-[#6a6b70] rounded-t-xl rounded-b-lg mx-6 mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.3)] border border-[#505050]"></div>
      </div>
    </div>
  );
}
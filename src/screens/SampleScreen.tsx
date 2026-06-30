// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import type { Slice, PadSettings, SampleColumn1, SampleColumn2, SampleColumn3, ActiveSampleColumn, PlayMode } from '../types';

interface SampleScreenProps {
  audioBuffer: AudioBuffer | null;
  activePad: number;
  padBank: string;
  padAssignments: string[];
  sampleCol1: SampleColumn1;
  sampleCol2: SampleColumn2;
  sampleCol3: SampleColumn3;
  activeSampleCol: ActiveSampleColumn;
  padSettings: PadSettings;
  trimStart: number;
  trimEnd: number;
  loopStart: number;
  chopMode: boolean;
  chopType: string;
  chopMarkers: number[];
  selectedChopMarker: number;
  playMode: PlayMode;
  sixteenLevels: boolean;
  sixteenLevelsType: string;
  isReversed: boolean;
  onWaveformClick: (pos: number) => void;
}

const Waveform: React.FC<{
  audioBuffer: AudioBuffer | null;
  trimStart: number;
  trimEnd: number;
  loopStart: number;
  chopMode: boolean;
  chopMarkers: number[];
  selectedChopMarker: number;
  onClick: (pos: number) => void;
}> = ({ audioBuffer, trimStart, trimEnd, loopStart, chopMode, chopMarkers, selectedChopMarker, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, x / rect.width));
    onClick(pos);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke();
    }

    if (!audioBuffer) {
      ctx.fillStyle = '#555';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No sample loaded', w / 2, h / 2);
      return;
    }

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const mid = h / 2;

    ctx.beginPath();
    ctx.strokeStyle = '#ffef00';
    ctx.lineWidth = 1;

    for (let i = 0; i < w; i++) {
      const start = i * step;
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step && start + j < data.length; j++) {
        const val = data[start + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      ctx.moveTo(i, mid + min * mid);
      ctx.lineTo(i, mid + max * mid);
    }
    ctx.stroke();

    if (!chopMode) {
      // Draw trim markers
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(trimStart * w, 0); ctx.lineTo(trimStart * w, h); ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(trimEnd * w, 0); ctx.lineTo(trimEnd * w, h); ctx.stroke();
      // Draw loop marker if loop != start
      if (Math.abs(loopStart - trimStart) > 0.01) {
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(loopStart * w, 0); ctx.lineTo(loopStart * w, h); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, trimStart * w, h);
      ctx.fillRect(trimEnd * w, 0, w - (trimEnd * w), h);
    } else {
      chopMarkers.forEach((pos, idx) => {
        ctx.strokeStyle = idx === selectedChopMarker ? '#00e5ff' : '#ffffff80';
        ctx.lineWidth = idx === selectedChopMarker ? 1.5 : 0.8;
        ctx.beginPath(); ctx.moveTo(pos * w, 0); ctx.lineTo(pos * w, h); ctx.stroke();
      });
    }
  }, [audioBuffer, trimStart, trimEnd, loopStart, chopMode, chopMarkers, selectedChopMarker]);

  return (
    <canvas ref={canvasRef} onPointerDown={handlePointerDown} className="w-full rounded-sm cursor-crosshair flex-1 min-h-0" />
  );
};

const SampleScreen: React.FC<SampleScreenProps> = ({
  audioBuffer, activePad, padBank, padAssignments,
  sampleCol1, sampleCol2, sampleCol3, activeSampleCol,
  padSettings, trimStart, trimEnd, loopStart,
  chopMode, chopType, chopMarkers, selectedChopMarker,
  playMode, sixteenLevels, sixteenLevelsType, isReversed, onWaveformClick
}) => {
  const padName = padAssignments[(activePad || 1) - 1] || 'Empty';
  const padLabel = `${padBank}${String(activePad || 1).padStart(2, '0')}`;

  const renderTopBar = () => (
    <div className="flex justify-between px-1 pt-1 pb-0.5 border-b border-[#2a2a2a] mb-1 bg-[#111]">
      <div className={`text-[9px] px-1 py-[1px] ${activeSampleCol === 1 ? 'bg-[#ffef00] text-black font-bold border border-black' : 'text-white/80'}`}>{sampleCol1}</div>
      <div className={`text-[9px] px-1 py-[1px] ${activeSampleCol === 2 ? 'bg-[#ffef00] text-black font-bold border border-black' : 'text-white/80'}`}>{sampleCol2}</div>
      <div className={`text-[9px] px-1 py-[1px] ${activeSampleCol === 3 ? 'bg-[#ffef00] text-black font-bold border border-black' : 'text-white/80'}`}>{sampleCol3}</div>
    </div>
  );

  const renderInfoBar = () => (
    <div className="flex items-center justify-between px-1 mb-1 bg-[#151515]">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white font-bold px-1 border border-[#333]">{padLabel}</span>
        <span className="text-[10px] text-white font-bold truncate max-w-[80px]">{padName}</span>
      </div>
      <div className="flex gap-1 items-center">
        {playMode === 'NOTE ON' && <span className="text-[8px] bg-white text-black px-1 font-bold">NOTE ON</span>}
        {isReversed && <span className="text-[8px] bg-white text-black px-1 font-bold">REV</span>}
        {playMode === 'LOOP' && <span className="text-[8px] bg-white text-black px-1 font-bold">LOOP</span>}
        {sixteenLevels && <span className="text-[8px] bg-[#ffef00] text-black px-1 font-bold">16Lvl</span>}
      </div>
    </div>
  );

  const renderBottomBar = () => {
    let p1 = '', p2 = '', p3 = '';
    let v1 = '', v2 = '', v3 = '';

    if (chopMode) {
      p1 = 'Start'; v1 = '';
      p2 = 'End'; v2 = '';
      p3 = 'Chop Type'; v3 = chopType;
    } else {
      if (activeSampleCol === 1) {
        if (sampleCol1 === 'Trim') {
          p1 = 'Start'; v1 = '';
          p2 = 'End'; v2 = '';
          p3 = 'Loop'; v3 = '';
        } else if (sampleCol1 === 'Mix') {
          p1 = 'Volume'; v1 = `${padSettings.volume.toFixed(0)} dB`;
          p2 = 'Kit Vol'; v2 = '0 dB';
          p3 = 'Pan'; v3 = padSettings.pan === 0 ? 'C' : padSettings.pan < 0 ? `${Math.abs(padSettings.pan)}L` : `${padSettings.pan}R`;
        } else if (sampleCol1 === 'Amp Env') {
          p1 = 'Attack'; v1 = padSettings.attack.toFixed(2);
          p2 = playMode === 'NOTE ON' ? 'Release' : 'Decay'; v2 = playMode === 'NOTE ON' ? padSettings.release.toFixed(2) : padSettings.decay.toFixed(2);
          p3 = 'Vel Sens'; v3 = '127';
        }
      } else if (activeSampleCol === 2) {
        if (sampleCol2 === 'Tune') {
          p1 = 'Semi Tune'; v1 = padSettings.tune.toString();
          p2 = 'Fine Tune'; v2 = '0';
          p3 = 'Warp'; v3 = 'Off';
        } else if (sampleCol2 === 'Play') {
          p1 = 'Polyphony'; v1 = 'Poly';
          p2 = 'Mute Grp'; v2 = 'Off';
          p3 = 'Offset'; v3 = '0';
        }
      } else if (activeSampleCol === 3) {
        if (sampleCol3 === 'Filter') {
          p1 = 'Cutoff'; v1 = padSettings.filterFreq.toFixed(0);
          p2 = 'Reso'; v2 = padSettings.filterRes.toFixed(0);
          p3 = 'Type'; v3 = padSettings.filterType;
        } else if (sampleCol3 === 'Filt Env') {
          p1 = 'Attack'; v1 = '0';
          p2 = 'Decay'; v2 = '0';
          p3 = 'Depth'; v3 = '0';
        }
      }
    }

    return (
      <div className="flex justify-between px-1 mt-1 pb-1 bg-[#111] border-t border-[#333]">
        <div className="flex flex-col flex-1 border-r border-[#333] pl-1 justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">{p1}</span>
          <span className="text-[11px] text-white font-bold leading-none mt-1">{v1}</span>
        </div>
        <div className="flex flex-col flex-1 pl-2 border-r border-[#333] justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">{p2}</span>
          <span className="text-[11px] text-white font-bold leading-none mt-1">{v2}</span>
        </div>
        <div className="flex flex-col flex-1 pl-2 justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">{p3}</span>
          <span className="text-[11px] text-white font-bold leading-none mt-1">{v3}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col font-mono">
      {renderTopBar()}
      {renderInfoBar()}
      <Waveform 
        audioBuffer={audioBuffer} trimStart={trimStart} trimEnd={trimEnd} loopStart={loopStart} 
        chopMode={chopMode} chopMarkers={chopMarkers} selectedChopMarker={selectedChopMarker} onClick={onWaveformClick} 
      />
      {renderBottomBar()}
    </div>
  );
};

export default SampleScreen;

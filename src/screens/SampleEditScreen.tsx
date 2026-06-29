// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import type { SampleEditTab, Slice } from '../types';

interface SampleEditScreenProps {
  audioBuffer: AudioBuffer | null;
  slices: Slice[];
  activePad: number;
  activeSubTab: SampleEditTab;
  setActiveSubTab: (tab: SampleEditTab) => void;
  trimStart: number;
  trimEnd: number;
  chopMarkers: number[];
  selectedChopMarker: number;
  padAssignments: string[];
}

const TABS: SampleEditTab[] = ['Trim', 'Chop', 'Program'];

const Waveform: React.FC<{
  audioBuffer: AudioBuffer | null;
  trimStart?: number;
  trimEnd?: number;
  chopMarkers?: number[];
  selectedChopMarker?: number;
  mode: 'trim' | 'chop';
}> = ({ audioBuffer, trimStart = 0, trimEnd = 1, chopMarkers = [], selectedChopMarker = -1, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      const x = (w / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    if (!audioBuffer) {
      ctx.fillStyle = '#555';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No sample loaded', w / 2, h / 2);
      return;
    }

    // Draw waveform
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
      const yMin = mid + min * mid;
      const yMax = mid + max * mid;
      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();

    if (mode === 'trim') {
      // Start marker (green)
      const startX = trimStart * w;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, h);
      ctx.stroke();

      // End marker (red)
      const endX = trimEnd * w;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, h);
      ctx.stroke();

      // Dim regions outside trim
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, startX, h);
      ctx.fillRect(endX, 0, w - endX, h);
    }

    if (mode === 'chop') {
      chopMarkers.forEach((pos, idx) => {
        const x = pos * w;
        ctx.strokeStyle = idx === selectedChopMarker ? '#00e5ff' : '#ffffff80';
        ctx.lineWidth = idx === selectedChopMarker ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      });
    }
  }, [audioBuffer, trimStart, trimEnd, chopMarkers, selectedChopMarker, mode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-sm"
      style={{ height: '55px' }}
    />
  );
};

const SampleEditScreen: React.FC<SampleEditScreenProps> = ({
  audioBuffer,
  slices,
  activePad,
  activeSubTab,
  setActiveSubTab,
  trimStart,
  trimEnd,
  chopMarkers,
  selectedChopMarker,
  padAssignments,
}) => {
  return (
    <div className="w-full h-full flex flex-col font-mono px-2 py-1 select-none">
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`text-[8px] px-2 py-0.5 border transition-colors ${
              activeSubTab === tab
                ? 'border-yellow-500/60 text-[#ffef00] bg-yellow-500/10'
                : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto text-[7px] text-gray-600">
          PAD: {String(activePad + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col">
        {activeSubTab === 'Trim' && (
          <>
            <Waveform
              audioBuffer={audioBuffer}
              trimStart={trimStart}
              trimEnd={trimEnd}
              mode="trim"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[7px] text-green-400">
                START: {(trimStart * 100).toFixed(1)}%
              </span>
              <span className="text-[7px] text-red-400">
                END: {(trimEnd * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {activeSubTab === 'Chop' && (
          <>
            <Waveform
              audioBuffer={audioBuffer}
              chopMarkers={chopMarkers}
              selectedChopMarker={selectedChopMarker}
              mode="chop"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[7px] text-gray-400">Auto</span>
              <span className="text-[7px] text-gray-600">|</span>
              <span className="text-[7px] text-gray-400">Manual</span>
              <span className="text-[7px] text-gray-600">|</span>
              <span className="text-[7px] text-cyan-400">
                Markers: {chopMarkers.length}
              </span>
            </div>
          </>
        )}

        {activeSubTab === 'Program' && (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-4 gap-[2px] flex-1">
              {padAssignments.slice(0, 16).map((name, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center border px-0.5 py-0.5 ${
                    i === activePad
                      ? 'border-cyan-400/70 bg-cyan-400/10'
                      : 'border-gray-700/60 bg-transparent'
                  }`}
                >
                  <span className="text-[7px] text-gray-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[6px] truncate max-w-[80px] ${
                      i === activePad ? 'text-cyan-300' : name ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {name || '---'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SampleEditScreen;

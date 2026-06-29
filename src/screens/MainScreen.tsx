// @ts-nocheck
import React from 'react';
import type { PadBank } from '../types';

interface MainScreenProps {
  bpm: number;
  currentSeq: number;
  isPlaying: boolean;
  isSeqRecording: boolean;
  padBank: PadBank;
  programName: string;
  padAssignments: string[];
}

const MainScreen: React.FC<MainScreenProps> = ({
  bpm,
  currentSeq,
  isPlaying,
  isSeqRecording,
  padBank,
  programName,
  padAssignments,
}) => {
  const transportIcon = isSeqRecording ? '●' : isPlaying ? '▶' : '■';
  const transportLabel = isSeqRecording ? 'RECORDING' : isPlaying ? 'PLAYING' : 'STOPPED';
  const transportColor = isSeqRecording
    ? 'text-red-500'
    : isPlaying
      ? 'text-green-400'
      : 'text-gray-400';

  const seqStr = String(currentSeq).padStart(3, '0');

  return (
    <div className="w-full h-full flex flex-col justify-between font-mono px-2 py-1 select-none">
      {/* Top row: program name */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold truncate max-w-[200px]"
          style={{ color: '#ffef00' }}
        >
          {programName}
        </span>
        <span className="text-[8px] text-gray-500 uppercase tracking-wider">
          MPC Sample
        </span>
      </div>

      {/* Middle section */}
      <div className="flex items-center justify-between flex-1 py-1">
        {/* Left: BPM + Transport */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] text-white font-bold leading-none">
              {bpm.toFixed(1)}
            </span>
            <span className="text-[7px] text-gray-500">BPM</span>
          </div>
          <div className={`flex items-center gap-1 text-[9px] ${transportColor}`}>
            <span className={isSeqRecording ? 'animate-pulse' : ''}>
              {transportIcon}
            </span>
            <span>{transportLabel}</span>
          </div>
          <span className="text-[8px] text-gray-600">
            SEQ: {seqStr}
          </span>
        </div>

        {/* Center: Mini pad grid */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500 mb-0.5">PADS</span>
          <div className="grid grid-cols-4 gap-[2px]">
            {padAssignments.map((name, i) => (
              <div
                key={i}
                className={`w-[8px] h-[8px] border ${
                  name
                    ? 'border-yellow-500/60 bg-yellow-500/40'
                    : 'border-gray-700 bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Bank indicator */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] text-gray-500">BANK</span>
          <span
            className="text-[22px] font-bold leading-none"
            style={{ color: '#ffef00' }}
          >
            {padBank}
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-0.5">
        <span className="text-[8px] text-gray-400">
          Seq: {seqStr}
        </span>
        <span className="text-[8px] text-gray-600">|</span>
        <span className="text-[8px] text-gray-400">
          Bar: 1/4
        </span>
        <span className="text-[8px] text-gray-600">|</span>
        <span className="text-[8px] text-gray-400">
          Bank: {padBank}
        </span>
      </div>
    </div>
  );
};

export default MainScreen;

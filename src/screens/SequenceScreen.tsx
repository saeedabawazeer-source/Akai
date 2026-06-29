// @ts-nocheck
import React from 'react';

interface SequenceTrack {
  padId: number;
  steps: boolean[];
}

interface SequenceScreenProps {
  tracks: SequenceTrack[];
  currentStep: number;
  isPlaying: boolean;
  seqLength: number;
  bpm: number;
  currentSeq: number;
  onToggleStep: (trackIndex: number, stepIndex: number) => void;
  totalSequences: number;
}

const SequenceScreen: React.FC<SequenceScreenProps> = ({
  tracks,
  currentStep,
  isPlaying,
  seqLength,
  bpm,
  currentSeq,
  onToggleStep,
  totalSequences,
}) => {
  const visibleTracks = tracks.slice(0, 4);
  const seqStr = String(currentSeq).padStart(3, '0');
  const bars = Math.ceil(seqLength / 16);

  return (
    <div className="w-full h-full flex flex-col font-mono px-1.5 py-1 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-gray-400">
          SEQ: <span style={{ color: '#ffef00' }}>{seqStr}</span>
        </span>
        <span className="text-[8px] text-gray-400">
          BPM: <span className="text-white">{bpm.toFixed(0)}</span>
        </span>
        <span className="text-[8px] text-gray-400">
          BARS: <span className="text-white">{bars}</span>
        </span>
        <span className="text-[8px] text-gray-400">
          {isPlaying ? (
            <span className="text-green-400">▶</span>
          ) : (
            <span className="text-gray-600">■</span>
          )}
        </span>
      </div>

      {/* Step numbers header */}
      <div className="flex gap-[1px] mb-[2px] ml-[28px]">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 text-center text-[5px] ${
              i === currentStep && isPlaying ? 'text-cyan-400' : 'text-gray-700'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Step grid */}
      <div className="flex flex-col gap-[1px] flex-1">
        {visibleTracks.map((track, tIdx) => (
          <div key={tIdx} className="flex gap-[1px] items-center">
            {/* Pad label */}
            <span className="text-[6px] text-gray-500 w-[26px] text-right pr-1 shrink-0">
              P{String(track.padId + 1).padStart(2, '0')}
            </span>
            {/* Steps */}
            {track.steps.slice(0, 16).map((active, sIdx) => {
              const isCurrent = sIdx === currentStep && isPlaying;
              return (
                <button
                  key={sIdx}
                  onClick={() => onToggleStep(tIdx, sIdx)}
                  className={`flex-1 h-[16px] border transition-colors ${
                    isCurrent
                      ? active
                        ? 'border-cyan-400/60 bg-cyan-400/70'
                        : 'border-cyan-400/40 bg-cyan-400/15'
                      : active
                        ? 'border-yellow-500/40 bg-yellow-500/50'
                        : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/50'
                  }`}
                  style={
                    active && !isCurrent
                      ? { backgroundColor: 'rgba(255,239,0,0.35)' }
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: pad labels */}
      <div className="flex items-center justify-between border-t border-gray-700/40 pt-0.5 mt-0.5">
        {visibleTracks.map((track, i) => (
          <span
            key={i}
            className="text-[6px] text-gray-500"
          >
            PAD {track.padId + 1}
          </span>
        ))}
        <span className="text-[6px] text-gray-600">
          {totalSequences} SEQ
        </span>
      </div>
    </div>
  );
};

export default SequenceScreen;

// @ts-nocheck
import React from 'react';

interface SongScreenProps {
  songSequences: number[];
  currentSongStep: number;
  isPlaying: boolean;
  totalSequences: number;
}

const SongScreen: React.FC<SongScreenProps> = ({
  songSequences,
  currentSongStep,
  isPlaying,
  totalSequences,
}) => {
  return (
    <div className="w-full h-full flex flex-col font-mono px-2 py-1 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-bold tracking-[0.15em]"
          style={{ color: '#ffef00' }}
        >
          SONG MODE
        </span>
        <span className="text-[7px] text-gray-600">
          {songSequences.length} STEPS
          {isPlaying && (
            <span className="text-green-400 ml-1">▶</span>
          )}
        </span>
      </div>

      {/* Sequence list */}
      <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-[1px]">
        {songSequences.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[8px] text-gray-600">No sequences added</span>
          </div>
        ) : (
          songSequences.map((seqIdx, i) => {
            const isCurrent = i === currentSongStep;
            return (
              <div
                key={i}
                className={`flex items-center px-1.5 py-[2px] border transition-colors ${
                  isCurrent
                    ? 'border-cyan-400/50 bg-cyan-400/10'
                    : 'border-transparent hover:border-gray-700/40'
                }`}
              >
                <span
                  className={`text-[8px] w-[20px] ${
                    isCurrent ? 'text-cyan-400' : 'text-gray-600'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}:
                </span>
                <span
                  className={`text-[8px] ml-1 ${
                    isCurrent ? 'text-cyan-300' : 'text-gray-400'
                  }`}
                >
                  Seq {String(seqIdx + 1).padStart(3, '0')}
                </span>
                {isCurrent && isPlaying && (
                  <span className="text-[6px] text-cyan-500 ml-auto">◀</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-1 mt-0.5">
        <span className="text-[7px] text-gray-500 border border-gray-700 px-1.5 py-[1px] cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-colors">
          + ADD
        </span>
        <span className="text-[7px] text-gray-500 border border-gray-700 px-1.5 py-[1px] cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-colors">
          - DEL
        </span>
        <span className="text-[7px] text-gray-500 border border-gray-700 px-1.5 py-[1px] cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-colors">
          ▲ UP
        </span>
        <span className="text-[7px] text-gray-500 border border-gray-700 px-1.5 py-[1px] cursor-pointer hover:text-gray-300 hover:border-gray-500 transition-colors">
          ▼ DN
        </span>
      </div>
    </div>
  );
};

export default SongScreen;

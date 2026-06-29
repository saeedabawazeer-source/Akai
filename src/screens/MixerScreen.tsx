// @ts-nocheck
import React from 'react';
import { PadSettings } from '../types';

interface MixerScreenProps {
  padSettings: PadSettings[];
  activePad: number;
  onUpdateVolume: (padIndex: number, volume: number) => void;
  onUpdatePan: (padIndex: number, pan: number) => void;
  onToggleMute: (padIndex: number) => void;
  onToggleSolo: (padIndex: number) => void;
}

const MixerScreen: React.FC<MixerScreenProps> = ({
  padSettings,
  activePad,
  onUpdateVolume,
  onUpdatePan,
  onToggleMute,
  onToggleSolo,
}) => {
  const activePadSettings = padSettings[activePad];
  const panValue = activePadSettings?.pan ?? 0;
  const panLabel = panValue === 0 ? 'C' : panValue < 0 ? `L${Math.abs(panValue)}` : `R${panValue}`;

  return (
    <div className="w-full h-full bg-[#151515] font-mono flex flex-col px-2 py-1">
      {/* Title */}
      <div className="text-[10px] text-yellow-400 tracking-widest text-center mb-1">
        MIXER
      </div>

      {/* 16 Mini-faders */}
      <div className="flex-1 flex gap-[2px] items-end">
        {padSettings.slice(0, 16).map((pad, i) => {
          const vol = (pad.volume / 100) * 100;
          const isActive = i === activePad;
          const isMuted = pad.muted;
          const isSoloed = pad.soloed;

          // Determine fader color
          let barColor = 'from-gray-600 to-gray-400';
          if (isMuted) barColor = 'from-red-700 to-red-500';
          else if (isSoloed) barColor = 'from-yellow-600 to-yellow-400';
          else if (isActive) barColor = 'from-cyan-700 to-cyan-400';

          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center gap-[1px] ${
                isActive ? '' : ''
              }`}
            >
              {/* Mute / Solo indicators */}
              <div className="flex gap-[1px]">
                <button
                  onClick={() => onToggleMute(i)}
                  className={`text-[5px] w-[8px] h-[7px] flex items-center justify-center rounded-sm cursor-pointer ${
                    isMuted ? 'bg-red-600 text-white' : 'bg-[#222] text-gray-600'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo(i)}
                  className={`text-[5px] w-[8px] h-[7px] flex items-center justify-center rounded-sm cursor-pointer ${
                    isSoloed ? 'bg-yellow-500 text-black' : 'bg-[#222] text-gray-600'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Fader track */}
              <div
                className={`w-[10px] h-[60px] bg-[#111] rounded-sm border relative overflow-hidden ${
                  isActive ? 'border-cyan-500/50' : 'border-[#2a2a2a]'
                }`}
              >
                <div
                  className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${barColor} transition-all duration-100`}
                  style={{ height: `${vol}%` }}
                />
              </div>

              {/* Pad number label */}
              <span
                className={`text-[6px] ${
                  isActive ? 'text-cyan-400' : isMuted ? 'text-red-400' : isSoloed ? 'text-yellow-400' : 'text-gray-500'
                }`}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom: Pan value for selected pad */}
      <div className="text-[7px] text-gray-400 text-center mt-1">
        Pad {activePad + 1} Pan: <span className="text-white">{panLabel}</span>
      </div>
    </div>
  );
};

export default MixerScreen;

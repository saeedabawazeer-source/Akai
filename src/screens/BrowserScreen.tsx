// @ts-nocheck
import React from 'react';
import { PresetKit } from '../types';

interface BrowserScreenProps {
  presetKits: PresetKit[];
  selectedKit: number;
  selectedPad: number;
  onSelectKit: (index: number) => void;
  onLoadKit: (index: number) => void;
}

const BrowserScreen: React.FC<BrowserScreenProps> = ({
  presetKits,
  selectedKit,
  selectedPad,
  onSelectKit,
  onLoadKit,
}) => {
  const kit = presetKits[selectedKit];

  return (
    <div className="w-full h-full bg-[#151515] font-mono flex flex-col px-2 py-1">
      {/* Title */}
      <div className="text-[10px] text-yellow-400 tracking-widest text-center mb-1">
        BROWSER
      </div>

      {/* Main panels */}
      <div className="flex-1 flex gap-[4px] overflow-hidden">
        {/* Left panel: kit list */}
        <div className="w-[120px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm overflow-y-auto">
          {presetKits.map((k, i) => {
            const isSelected = i === selectedKit;
            return (
              <button
                key={i}
                onClick={() => onSelectKit(i)}
                className={`w-full text-left text-[7px] px-1 py-[3px] flex items-center gap-[3px] transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-900/40 text-cyan-300'
                    : 'text-gray-400 hover:bg-[#222] hover:text-gray-200'
                }`}
              >
                <span className={`text-[7px] ${isSelected ? 'text-cyan-400' : 'text-transparent'}`}>
                  ▸
                </span>
                <span className="truncate">{k.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right panel: pad preview */}
        <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm p-1 overflow-hidden">
          <div className="text-[7px] text-gray-500 mb-[3px]">
            {kit?.name || 'No kit'} — 16 Pads
          </div>
          <div className="grid grid-cols-4 gap-[2px]">
            {(kit?.pads || []).slice(0, 16).map((pad, i) => (
              <div
                key={i}
                className={`text-[6px] px-[3px] py-[2px] rounded-sm border truncate ${
                  i === selectedPad
                    ? 'bg-cyan-900/40 border-cyan-500/40 text-cyan-300'
                    : 'bg-[#151515] border-[#2a2a2a] text-gray-500'
                }`}
              >
                {pad.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={() => onLoadKit(selectedKit)}
          className="text-[8px] text-yellow-400 border border-yellow-400/40 rounded-sm px-2 py-[1px] hover:bg-yellow-400/10 transition-colors cursor-pointer"
        >
          [LOAD]
        </button>
        <span className="text-[7px] text-gray-600">
          Data Wheel: Browse
        </span>
      </div>
    </div>
  );
};

export default BrowserScreen;

// @ts-nocheck
import React from 'react';
import { PadFXSlot } from '../types';

interface PadFXScreenProps {
  effects: PadFXSlot[];
  activeFXPad: number | null;
  onToggleEffect: (index: number) => void;
}

const PadFXScreen: React.FC<PadFXScreenProps> = ({ effects, activeFXPad, onToggleEffect }) => {
  return (
    <div className="w-full h-full bg-[#151515] font-mono flex flex-col px-2 py-1">
      {/* Title */}
      <div className="text-[10px] text-yellow-400 tracking-widest text-center mb-1">
        PAD FX
      </div>

      {/* 2x4 Grid */}
      <div className="flex-1 grid grid-rows-2 grid-cols-4 gap-[3px]">
        {effects.slice(0, 8).map((fx, i) => {
          const isTriggered = activeFXPad === i;
          return (
            <button
              key={i}
              onClick={() => onToggleEffect(i)}
              className={`
                flex flex-col items-center justify-center rounded-sm border
                transition-colors duration-100 cursor-pointer
                ${isTriggered
                  ? 'bg-cyan-900/60 border-cyan-500/60'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                }
              `}
            >
              {/* Active indicator dot */}
              <div
                className={`w-[5px] h-[5px] rounded-full mb-[2px] ${
                  fx.active ? 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]' : 'bg-[#333]'
                }`}
              />
              {/* Effect name */}
              <span
                className={`text-[7px] leading-tight text-center ${
                  isTriggered ? 'text-cyan-300' : 'text-gray-400'
                }`}
              >
                {fx.name}
              </span>
              {/* Effect type */}
              <span className="text-[6px] text-gray-600 uppercase">
                {fx.type}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="text-[7px] text-gray-600 text-center mt-1">
        Tap pad to trigger effect
      </div>
    </div>
  );
};

export default PadFXScreen;

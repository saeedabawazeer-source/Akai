// @ts-nocheck
import React from 'react';
import { KnobMapping } from '../types';

interface KnobFXScreenProps {
  knobMappings: KnobMapping[];
}

const KNOB_LABELS = ['K1', 'K2', 'K3'];

const KnobFXScreen: React.FC<KnobFXScreenProps> = ({ knobMappings }) => {
  return (
    <div className="w-full h-full bg-[#151515] font-mono flex flex-col px-2 py-1">
      {/* Title */}
      <div className="text-[10px] text-yellow-400 tracking-widest text-center mb-1">
        KNOB FX
      </div>

      {/* Three columns */}
      <div className="flex-1 flex gap-[6px]">
        {knobMappings.slice(0, 3).map((knob, i) => {
          const pct = ((knob.value - knob.min) / (knob.max - knob.min)) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center bg-[#1a1a1a] rounded-sm border border-[#2a2a2a] px-1 py-1"
            >
              {/* Knob label */}
              <span className="text-[9px] text-cyan-400 font-bold">
                {KNOB_LABELS[i]}
              </span>

              {/* Parameter label */}
              <span className="text-[7px] text-gray-400 mt-[2px] truncate w-full text-center">
                {knob.label}
              </span>

              {/* Param name */}
              <span className="text-[6px] text-gray-600 uppercase truncate w-full text-center">
                {knob.param}
              </span>

              {/* Visual bar */}
              <div className="w-full flex-1 flex items-end mt-1 mb-1">
                <div className="w-full h-full bg-[#111] rounded-sm border border-[#2a2a2a] relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-400/70 transition-all duration-150"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Numeric value */}
              <span className="text-[8px] text-white tabular-nums">
                {knob.value.toFixed(knob.max >= 100 ? 0 : 1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="text-[7px] text-gray-600 text-center mt-1">
        Turn knobs to adjust
      </div>
    </div>
  );
};

export default KnobFXScreen;

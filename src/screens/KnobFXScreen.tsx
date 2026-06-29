// @ts-nocheck
import React from 'react';

interface KnobFXScreenProps {
  knobMappings: { label: string; value: number }[];
  activeEffect: string;
}

const KNOB_FX_LIST = [
  'LP Filter', 'BP Filter', 'Bus Compressor', 'Limiter', 
  'Pumper', 'Transient', 'Noise Gate', 'Amp Sim'
];

const KnobFXScreen: React.FC<KnobFXScreenProps> = ({ knobMappings, activeEffect }) => {
  return (
    <div className="w-full h-full bg-[#151515] font-mono text-white flex flex-col justify-between">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between px-2 py-0.5 border-b border-[#2a2a2a] mb-1">
        <div className="text-[10px] text-orange-400 font-bold">{activeEffect}</div>
        <div className="text-[8px] bg-[#333] text-white px-1">All Pads</div>
        <div className="text-[8px] border border-white px-1">Bypass</div>
      </div>

      <div className="px-2 flex-grow flex flex-col overflow-hidden">
        {KNOB_FX_LIST.map((fx, i) => (
          <div 
            key={i} 
            className={`text-[8px] flex items-center gap-1 ${
              fx === activeEffect 
                ? 'text-orange-400' 
                : 'text-gray-400'
            }`}
          >
            <span className="text-[6px]">✥</span>
            {fx}
          </div>
        ))}
      </div>

      {/* Bottom Bar matching K1, K2, K3 */}
      <div className="flex justify-between px-1 mt-1 pb-1 border-t border-[#2a2a2a] pt-1">
        <div className="flex flex-col flex-1 border-r border-[#222]">
          <span className="text-[7px] text-white">Frequency</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
        <div className="flex flex-col flex-1 pl-1 border-r border-[#222]">
          <span className="text-[7px] text-white">Resonance</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
        <div className="flex flex-col flex-1 pl-1">
          <span className="text-[7px] text-white">-</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
      </div>
    </div>
  );
};

export default KnobFXScreen;

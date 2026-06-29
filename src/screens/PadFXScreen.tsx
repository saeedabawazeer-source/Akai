// @ts-nocheck
import React from 'react';

interface PadFXScreenProps {
  knobMappings: { label: string; value: number }[];
  activeEffectIndex: number | null;
}

const PAD_FX_LIST = [
  'Beat Repeat', 'Rev Stepper', 'Delay', 'Reverb',
  'Ring Mod', 'LoFi', 'Color', 'Granulator',
  'Comb Filter', 'LP Filter', 'HP Filter', 'BP Filter',
  'Half Speed', 'Chorus', 'Flanger', 'Phaser'
];

const PadFXScreen: React.FC<PadFXScreenProps> = ({ knobMappings, activeEffectIndex }) => {
  return (
    <div className="w-full h-full bg-[#151515] font-mono text-white flex flex-col justify-between">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between px-2 py-0.5 border-b border-[#2a2a2a] mb-1">
        <div className="text-[8px] bg-white text-black font-bold px-1 border border-white">Latch</div>
        <div className="text-[8px] text-gray-400 px-1"></div>
        <div className="text-[8px] text-gray-400 px-1"></div>
      </div>

      <div className="px-2 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-4 grid-rows-4 gap-[2px] h-[80px]">
          {PAD_FX_LIST.map((fx, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-center text-[5px] text-center border ${
                activeEffectIndex === i 
                  ? 'border-orange-500 text-orange-400 bg-orange-900/30' 
                  : 'border-[#333] text-orange-600'
              }`}
            >
              {fx}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar matching K1, K2, K3 */}
      <div className="flex justify-between px-1 mt-1 pb-1 border-t border-[#2a2a2a] pt-1">
        <div className="flex flex-col flex-1 border-r border-[#222]">
          <span className="text-[7px] text-white">Feedback</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
        <div className="flex flex-col flex-1 pl-1 border-r border-[#222]">
          <span className="text-[7px] text-white">Speed</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
        <div className="flex flex-col flex-1 pl-1">
          <span className="text-[7px] text-white">Range</span>
          <span className="text-[7px] text-[#ffef00]"></span>
        </div>
      </div>
    </div>
  );
};

export default PadFXScreen;

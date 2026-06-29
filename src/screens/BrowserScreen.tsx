// @ts-nocheck
import React from 'react';
import { PresetKit } from '../types';

interface BrowserScreenProps {
  presetKits: PresetKit[];
  selectedKit: number;
  isPreviewOn: boolean;
  drive: 'Internal' | 'External';
}

const BrowserScreen: React.FC<BrowserScreenProps> = ({
  presetKits,
  selectedKit,
  isPreviewOn,
  drive,
}) => {
  return (
    <div className="w-full h-full flex flex-col font-mono text-white">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between px-2 py-0.5 border-b border-[#2a2a2a] mb-1">
        <div className="text-[8px] text-gray-400">{'< Back'}</div>
        <div className="text-[8px] bg-white text-black font-bold px-1">{drive}</div>
        <div className={`text-[8px] ${isPreviewOn ? 'bg-white text-black font-bold' : 'text-gray-400'} px-1`}>Preview</div>
      </div>

      {/* Main List */}
      <div className="flex-1 flex flex-col px-2 overflow-hidden gap-[1px]">
        {presetKits.map((k, i) => {
          const isSelected = i === selectedKit;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-1 text-[8px] ${
                isSelected ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              {/* Folder Icon Approximation */}
              <span className="text-[7px]">📁</span>
              <span className="truncate">{k.name}</span>
            </div>
          );
        })}
      </div>
      
      {/* Footer path */}
      <div className="px-2 pb-1 text-[7px] text-gray-500">
        Samples/ <span className="text-white">Kits</span>
      </div>
    </div>
  );
};

export default BrowserScreen;

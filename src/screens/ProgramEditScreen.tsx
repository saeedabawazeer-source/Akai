// @ts-nocheck
import React from 'react';
import { PadSettings, ProgramEditTab } from '../types';

interface ProgramEditScreenProps {
  activePad: number;
  padSettings: PadSettings;
  activeSubTab: ProgramEditTab;
  setActiveSubTab: (tab: ProgramEditTab) => void;
  onUpdatePadSetting: (key: keyof PadSettings, value: any) => void;
}

const SUB_TABS: ProgramEditTab[] = ['Layer', 'Tune', 'Filter', 'Amp'];

const BarControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
}> = ({ label, value, min, max, unit = '', decimals = 2 }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-1 mb-[3px]">
      <span className="text-[7px] text-gray-400 w-[42px] text-right shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-[7px] bg-[#111] rounded-sm border border-[#2a2a2a] relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-700 to-cyan-400 transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[7px] text-white w-[36px] text-right tabular-nums shrink-0">
        {value.toFixed(decimals)}{unit}
      </span>
    </div>
  );
};

const ProgramEditScreen: React.FC<ProgramEditScreenProps> = ({
  activePad,
  padSettings,
  activeSubTab,
  setActiveSubTab,
  onUpdatePadSetting,
}) => {
  const renderContent = () => {
    switch (activeSubTab) {
      case 'Layer':
        return (
          <div className="flex flex-col gap-[2px]">
            <div className="text-[8px] text-cyan-400 mb-[2px]">
              Pad {activePad + 1}
            </div>
            {padSettings.layers.length > 0 ? (
              padSettings.layers.map((layer, i) => (
                <div
                  key={i}
                  className="text-[7px] text-gray-300 bg-[#1e1e1e] rounded-sm px-1 py-[2px] border border-[#2a2a2a]"
                >
                  Layer {i + 1}: Sample #{layer}
                </div>
              ))
            ) : (
              <div className="text-[7px] text-gray-500 italic">No layers</div>
            )}
            <button
              onClick={() => onUpdatePadSetting('layers', [...padSettings.layers, 0])}
              className="text-[7px] text-yellow-400 border border-yellow-400/30 rounded-sm px-1 py-[2px] mt-[2px] hover:bg-yellow-400/10 transition-colors cursor-pointer w-fit"
            >
              [+ Add Layer]
            </button>
          </div>
        );

      case 'Tune':
        return (
          <div className="flex flex-col gap-1">
            <div className="text-[8px] text-cyan-400 mb-[2px]">Tuning</div>
            <BarControl
              label="Tune"
              value={padSettings.tune}
              min={-24}
              max={24}
              unit="st"
              decimals={0}
            />
            <div className="text-[7px] text-gray-500 text-center mt-1">
              {padSettings.tune > 0 ? '+' : ''}{padSettings.tune} semitones
            </div>
          </div>
        );

      case 'Filter':
        return (
          <div className="flex flex-col gap-[2px]">
            <div className="text-[8px] text-cyan-400 mb-[2px]">Filter</div>
            {/* Filter type selector */}
            <div className="flex gap-[3px] mb-[3px]">
              {(['lowpass', 'highpass', 'bandpass'] as const).map((type) => {
                const labels = { lowpass: 'LP', highpass: 'HP', bandpass: 'BP' };
                const isActive = padSettings.filterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => onUpdatePadSetting('filterType', type)}
                    className={`text-[7px] px-2 py-[2px] rounded-sm border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-900/50 border-cyan-500/50 text-cyan-300'
                        : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            <BarControl
              label="Cutoff"
              value={padSettings.filterFreq}
              min={20}
              max={20000}
              unit="Hz"
              decimals={0}
            />
            <BarControl
              label="Reso"
              value={padSettings.filterRes}
              min={0}
              max={20}
              decimals={1}
            />
          </div>
        );

      case 'Amp':
        return (
          <div className="flex flex-col gap-[2px]">
            <div className="text-[8px] text-cyan-400 mb-[2px]">Amp Envelope</div>
            <BarControl label="Attack" value={padSettings.attack} min={0} max={2} unit="s" />
            <BarControl label="Decay" value={padSettings.decay} min={0} max={2} unit="s" />
            <BarControl label="Sustain" value={padSettings.sustain} min={0} max={1} />
            <BarControl label="Release" value={padSettings.release} min={0} max={5} unit="s" />
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-[#151515] font-mono flex flex-col px-2 py-1">
      {/* Sub-tab bar */}
      <div className="flex gap-[2px] mb-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`text-[8px] px-2 py-[2px] rounded-sm border transition-colors cursor-pointer ${
              activeSubTab === tab
                ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400'
                : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto text-[7px] text-gray-600">
          Pad {activePad + 1}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProgramEditScreen;

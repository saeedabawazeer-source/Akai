// @ts-nocheck
import React from 'react';

interface SequenceScreenProps {
  bpm: number;
  currentSeq: number;
  seqLength: number;
  isPlaying: boolean;
  currentStep: number;
}

const SequenceScreen: React.FC<SequenceScreenProps> = ({
  bpm,
  currentSeq,
  seqLength,
  isPlaying,
  currentStep,
}) => {
  const seqStr = String(currentSeq).padStart(2, '0');
  const bar = Math.floor(currentStep / 16) + 1;
  const beat = Math.floor((currentStep % 16) / 4) + 1;
  const tick = Math.floor((currentStep % 4) * 240); // 960 ppqn approx

  return (
    <div className="w-full h-full font-mono flex flex-col justify-between">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between px-1 pt-1 pb-0.5 border-b border-[#2a2a2a] mb-1 bg-[#111]">
        <div className="text-[10px] text-[#00e5ff] font-bold px-1">{bpm.toFixed(2)}</div>
        <div className="flex gap-2">
          <div className="text-[8px] bg-white text-black font-bold px-1 border border-[#333]">BPM: SEQ</div>
          <div className="text-[8px] bg-white text-black font-bold px-1 border border-[#333]">Rec Quant</div>
        </div>
      </div>

      <div className="px-2 flex-grow flex flex-col justify-center gap-1 bg-[#151515]">
        <div className="flex justify-between items-center">
          <div className="text-[14px] text-[#ffef00] font-bold tracking-wide">Seq A{seqStr}</div>
          <div className="text-[10px] text-white/70">Sequence {currentSeq}</div>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] text-[#ffef00] mt-1">
          <span className="bg-[#111] px-1 border border-[#333]">4/4</span>
          <span className="flex items-center gap-1 bg-[#111] px-1 border border-[#333]">
            <span className="text-[8px] text-black bg-white px-0.5 rounded-sm">M</span>
            <span>On</span>
          </span>
          <span className="text-black bg-white font-bold tracking-widest text-[8px] px-1">1 2 3 4</span>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="w-5 h-5 bg-[#111] flex items-center justify-center border border-[#333] shadow-inner">
            <span className={isPlaying ? 'text-[#00ff00]' : 'text-[#333]'}>
              {isPlaying ? '▶' : '■'}
            </span>
          </div>
          <div className="text-[16px] font-bold text-white tracking-widest">
            {String(bar).padStart(3, '0')} . {String(beat).padStart(2, '0')} <span className="text-[12px] text-white/70 ml-1">{String(tick).padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar matching K1, K2, K3 */}
      <div className="flex justify-between px-1 mt-1 pb-1 bg-[#111] border-t border-[#333]">
        <div className="flex flex-col flex-1 border-r border-[#333] pl-1 justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">Length</span>
          <span className="text-[11px] text-white font-bold leading-none mt-1">{Math.ceil(seqLength / 16)} Bars</span>
        </div>
        <div className="flex flex-col flex-1 pl-2 border-r border-[#333] justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">Quantize</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="bg-[#ffef00] text-black px-0.5 font-bold text-[9px] leading-none">Q</span>
            <span className="text-[11px] text-white font-bold leading-none">1/16</span>
          </div>
        </div>
        <div className="flex flex-col flex-1 pl-2 justify-center h-[34px]">
          <span className="text-[9px] text-white/70 leading-none">Swing</span>
          <span className="text-[11px] text-white font-bold leading-none mt-1">50%</span>
        </div>
      </div>
    </div>
  );
};

export default SequenceScreen;

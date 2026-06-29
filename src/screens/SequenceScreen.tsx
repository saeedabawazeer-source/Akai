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
    <div className="w-full h-full bg-[#151515] font-mono text-white flex flex-col justify-between">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between px-2 py-0.5 border-b border-[#2a2a2a] mb-1">
        <div className="text-[10px] text-cyan-400 font-bold">{bpm.toFixed(2)}</div>
        <div className="text-[8px] bg-white text-black font-bold px-1 border border-white">BPM: SEQ</div>
        <div className="text-[8px] bg-white text-[#ff4444] font-bold px-1 border border-white">Rec Quant</div>
      </div>

      <div className="px-2 flex-grow flex flex-col justify-center gap-1">
        <div className="text-[12px] text-[#ffef00]">Seq A{seqStr}</div>
        
        <div className="flex items-center gap-4 text-[10px] text-[#ffef00]">
          <span>4/4</span>
          <span className="flex items-center gap-1">
            <span className="text-[8px] text-white border border-white px-0.5 rounded-sm">M</span>
            <span>On</span>
          </span>
          <span className="text-[#ff4444] tracking-widest text-[8px]">1 2 3 4</span>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-4 h-4 bg-[#333] flex items-center justify-center border border-[#555]">
            <span className={isPlaying ? 'text-green-400' : 'text-gray-400'}>
              {isPlaying ? '▶' : '■'}
            </span>
          </div>
          <div className="text-[12px] font-bold">
            {String(bar).padStart(3, '0')} . {String(beat).padStart(2, '0')} <span className="text-[10px] ml-1">{String(tick).padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar matching K1, K2, K3 */}
      <div className="flex justify-between px-2 py-1 text-[8px] border-t border-[#2a2a2a]">
        <div>{Math.ceil(seqLength / 16)} Bars</div>
        <div className="flex items-center gap-1">
          <span className="bg-white text-black px-0.5 font-bold">Q</span>
          <span>1/16</span>
        </div>
        <div className="flex items-center gap-1">
          <span>RT Swing</span>
        </div>
      </div>
    </div>
  );
};

export default SequenceScreen;

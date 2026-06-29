// @ts-nocheck
import React from 'react';

interface SampleRecordScreenProps {
  isRecording: boolean;
  recordingTime: number;
  inputLevel: number;
}

const SampleRecordScreen: React.FC<SampleRecordScreenProps> = ({
  isRecording,
  recordingTime,
  inputLevel,
}) => {
  const minutes = Math.floor(recordingTime / 60);
  const seconds = Math.floor(recordingTime % 60);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Level meter segmentation
  const levelPct = Math.min(Math.max(inputLevel, 0), 100);
  const segments = 20;
  const filledSegments = Math.round((levelPct / 100) * segments);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between font-mono px-3 py-1.5 select-none">
      {/* Title */}
      <div className="flex items-center justify-between w-full">
        <span
          className="text-[10px] font-bold tracking-[0.2em]"
          style={{ color: '#ffef00' }}
        >
          SAMPLER
        </span>
        <span className="text-[7px] text-gray-600">MIC IN</span>
      </div>

      {/* Recording status + timer */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          {isRecording && (
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-red-500 animate-pulse" />
          )}
          <span
            className={`text-[9px] font-bold ${
              isRecording ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {isRecording ? 'RECORDING' : 'STANDBY'}
          </span>
        </div>
        <span className="text-[24px] text-white font-bold leading-none tracking-wider">
          {timeStr}
        </span>
      </div>

      {/* Input level meter */}
      <div className="w-full flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-gray-500">INPUT LEVEL</span>
          <span className="text-[7px] text-gray-500">
            {levelPct.toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-[1px] w-full h-[6px]">
          {Array.from({ length: segments }).map((_, i) => {
            const ratio = i / segments;
            let color: string;
            if (ratio < 0.6) color = '#22c55e';
            else if (ratio < 0.8) color = '#eab308';
            else color = '#ef4444';

            const isFilled = i < filledSegments;

            return (
              <div
                key={i}
                className="flex-1 rounded-[1px]"
                style={{
                  backgroundColor: isFilled ? color : '#1a1a1a',
                  transition: 'background-color 0.08s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom label */}
      <div className="flex items-center justify-between w-full border-t border-gray-700/50 pt-0.5">
        <span className="text-[7px] text-gray-500">SOURCE: MIC IN</span>
        <span className="text-[7px] text-gray-600">
          {isRecording ? '● REC' : '○ IDLE'}
        </span>
      </div>
    </div>
  );
};

export default SampleRecordScreen;

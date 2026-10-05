import React from 'react';

export interface ProgressBarProps {
  percent: number;
  color: string;
  trackColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, color, trackColor = '#c9c9ce' }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-[7px] flex-1 overflow-hidden rounded-[5px]" style={{ backgroundColor: trackColor }}>
      <div className="h-full rounded-[5px]" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </div>
  );
};

export default ProgressBar;

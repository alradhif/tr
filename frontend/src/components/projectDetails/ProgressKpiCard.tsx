import React from 'react';
import ProgressBar from './ProgressBar';

export interface ProgressKpiCardProps {
  percent: number;
  badgeLabel?: string;
}

const TrendIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#17b26a" strokeWidth={2.5}>
    <path d="M4 17 10 11 14 15 20 8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProgressKpiCard: React.FC<ProgressKpiCardProps> = ({ percent, badgeLabel = 'على المسار' }) => {
  return (
    <div className="project-detail__card project-detail__progress-card" dir="rtl">
      <div className="project-detail__progress-head">
        <h3 className="m-0 text-[15px] font-semibold text-[#96989f]">نسبة التقدم</h3>
        <TrendIcon />
      </div>
      <div className="mt-[9px] flex items-center justify-between">
        <span
          className="inline-block rounded-[9px] px-2 py-[3px] text-[9px]"
          style={{ background: '#d1f0e1', color: '#17b26a' }}
        >
          {badgeLabel}
        </span>
        <strong className="block text-[34px] leading-[38px] text-black">{percent}%</strong>
      </div>
      <div className="mt-[9px] flex items-center gap-2" dir="ltr">
        <ProgressBar percent={percent} color="#17b26a" />
      </div>
    </div>
  );
};

export default ProgressKpiCard;

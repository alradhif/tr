import React from 'react';

export interface TimeKpiCardProps {
  daysRemaining: number;
}

const TimeKpiCard: React.FC<TimeKpiCardProps> = ({ daysRemaining }) => {
  return (
    <div className="project-detail__card project-detail__remaining-card" dir="rtl">
      <h3 className="m-0 mb-[9px] text-[15px] font-semibold text-[#96989f]">الوقت المتبقي</h3>
      <div className="flex items-baseline gap-1.5">
        <strong className="block text-[34px] leading-[38px] text-black">{daysRemaining}</strong>
        <span className="text-[10px] text-[#96989f]">يوم</span>
      </div>
      <div className="mt-[18px] h-[7px] rounded-[5px]" style={{ background: '#2e90fa' }} />
    </div>
  );
};

export default TimeKpiCard;

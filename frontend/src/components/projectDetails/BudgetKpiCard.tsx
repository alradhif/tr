import React from 'react';
import ProgressBar from './ProgressBar';

export interface BudgetKpiCardProps {
  spent: number;
  remaining: number;
}

const formatAmount = (value: number) => value.toLocaleString('en-US');

const BudgetKpiCard: React.FC<BudgetKpiCardProps> = ({ spent, remaining }) => {
  const total = spent + remaining;
  const percentSpent = total > 0 ? (spent / total) * 100 : 0;

  return (
    <div className="project-detail__card project-detail__budget-card" dir="rtl">
      <h3 className="m-0 mb-[9px] text-[15px] font-semibold text-[#96989f]">الميزانية</h3>
      <div className="flex items-center justify-between text-[12px] font-bold text-[#0c0c0d]">
        <span className="text-[#96989f] font-medium">المتبقي</span>
        <span className="text-[#96989f] font-medium">المصروف</span>
      </div>
      <div className="my-[9px]">
        <ProgressBar percent={percentSpent} color="#f79009" trackColor="#e8e8eb" />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#96989f]">
        <strong className="text-[14px] text-[#111214]">{formatAmount(remaining)}</strong>
        <strong className="text-[14px] text-[#111214]">{formatAmount(spent)}</strong>
      </div>
    </div>
  );
};

export default BudgetKpiCard;

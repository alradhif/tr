import React from 'react';
import ProgressKpiCard from './ProgressKpiCard';
import TimeKpiCard from './TimeKpiCard';
import BudgetKpiCard from './BudgetKpiCard';
import RisksKpiCard from './RisksKpiCard';
import type { RiskBreakdown } from '../../types/projectDetails';

export interface KpiGridProps {
  progressPercent: number;
  daysRemaining: number;
  budgetSpent: number;
  budgetRemaining: number;
  risks: RiskBreakdown;
}

const KpiGrid: React.FC<KpiGridProps> = ({ progressPercent, daysRemaining, budgetSpent, budgetRemaining, risks }) => {
  return (
    <div className="project-detail__stats-grid" dir="rtl">
      <ProgressKpiCard percent={progressPercent} />
      <TimeKpiCard daysRemaining={daysRemaining} />
      <BudgetKpiCard spent={budgetSpent} remaining={budgetRemaining} />
      <RisksKpiCard risks={risks} />
    </div>
  );
};

export default KpiGrid;

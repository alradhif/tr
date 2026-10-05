import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { RiskBreakdown } from '../../types/projectDetails';
import '../ui/ui.css';

export interface RisksKpiCardProps {
  risks: RiskBreakdown;
}

const RisksKpiCard: React.FC<RisksKpiCardProps> = ({ risks }) => {
  const { high, medium, low } = risks;

  const data = [
    { name: 'مرتفع', value: high, color: '#F04438' },
    { name: 'متوسط', value: medium, color: '#F79009' },
    { name: 'منخفض', value: low, color: '#17B26A' },
  ];

  return (
    <div
      className="project-detail__card widget-open-risks"
      dir="rtl"
      style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}
    >
      <p className="widget-title widget-open-risks__title" style={{ marginBottom: 0, fontSize: 15 }}>المخاطر</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <div className="legend-list" style={{ flex: 1, fontSize: 13 }}>
          {data.map((item) => (
            <div key={item.name} className="legend-item">
              <span className="legend-item__left">
                <span className="legend-item__dot" style={{ background: item.color, width: 10, height: 10 }} />
                <span style={{ color: item.color, fontWeight: 700 }}>{item.name}</span>
              </span>
              <span className="legend-item__value" style={{ fontSize: 13 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 92, height: 92, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={24}
                outerRadius={42}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RisksKpiCard;

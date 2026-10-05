import React from 'react';
import type { TabItem } from '../../types/projectDetails';

const tabs: TabItem[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'projectStages', label: 'مراحل المشروع' },
  { id: 'outputs', label: 'المخرجات' },
  { id: 'risks', label: 'المخاطر' },
  { id: 'changeRequests', label: 'طلبات التغيير' },
  { id: 'whatIf', label: 'ماذا لو ؟' },
];

export interface TabsNavProps {
  activeTabId?: string;
  onChange?: (id: string) => void;
}

const TabsNav: React.FC<TabsNavProps> = ({ activeTabId = 'overview', onChange }) => {
  return (
    <div
      className="project-detail__tabs"
      style={{ background: 'rgba(255,255,255,.35)' }}
      dir="rtl"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={isActive ? 'is-active' : ''}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabsNav;

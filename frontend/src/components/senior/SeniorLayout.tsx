

import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Sidebar } from '../layout/Sidebar';
import type { SeniorPageId } from './SeniorSidebar';
import { SeniorAIAssistantPanel } from './SeniorAIAssistantPanel';
import type { UserRole } from '../../types/auth';
import '../layout/layout.css';

interface SeniorLayoutProps {
  children: ReactNode;
  role: UserRole;
  activePage: SeniorPageId;
  onNavigate: (page: SeniorPageId) => void;
  onSignOut?: () => void;
}

export function SeniorLayout({ children, role, activePage, onNavigate, onSignOut }: SeniorLayoutProps) {
  if (role !== 'senior_management') {
    return (
      <div className="app-shell" dir="rtl">
        <div className="app-shell__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#71717a' }}>
            <ShieldAlert size={32} style={{ margin: '0 auto 12px' }} />
            <p>هذه الصفحة مخصصة لحسابات الإدارة العليا فقط</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        role="senior_management"
        activePage={activePage as any}
        settingsActive={activePage === 'settings'}
        onSettings={() => onNavigate('settings')}
        onNavigate={(page) => {
          if (page === 'dashboard' || page === 'companies' || page === 'goals' || page === 'projects' || page === 'departments') {
            onNavigate(page);
          }
        }}
        onSignOut={onSignOut}
        profile={{ name: 'أحمد محمد / مدير النظام', role: 'مدير النظام', initial: 'أ' }}
      />
      <div className="app-shell__main">{children}</div>
      {activePage !== 'settings' && <SeniorAIAssistantPanel />}
    </div>
  );
}

import type { ReactNode } from 'react';
import './ui.css';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: ReactNode;
}

export function Badge({ children, variant = 'neutral', icon }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant}`}>
      {icon && <span className="ui-badge__icon">{icon}</span>}
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';
import { commonAssets } from '@/assets';
import { AssetIcon } from '../ui/AssetIcon';
import './subpage-header.css';

export interface SubpageHeaderProps {
  
  parent: string;
  
  title: string;
  
  onBack: () => void;
  
  onParentClick?: () => void;
  
  ancestors?: string[];
  
  subtitle?: string;
  
  actions?: ReactNode;
  backLabel?: string;
}

export function SubpageHeader({
  parent,
  title,
  onBack,
  onParentClick,
  ancestors,
  subtitle,
  actions,
  backLabel = 'الرجوع للصفحة السابقة',
}: SubpageHeaderProps) {
  return (
    <header className="subpage-header">
      <button
        type="button"
        className="subpage-header__back"
        onClick={onBack}
        aria-label={backLabel}
      >
        <AssetIcon src={commonAssets.chevronLeft} size={24} className="asset-icon subpage-header__back-icon" />
      </button>

      <nav className="subpage-header__nav" aria-label="مسار التنقل">
        <div className="subpage-header__breadcrumb">
          <button
            type="button"
            className="subpage-header__parent"
            onClick={onParentClick ?? onBack}
          >
            {parent}
          </button>
          <span className="subpage-header__separator" aria-hidden>/</span>
          {ancestors?.map((crumb) => (
            <span className="subpage-header__crumb" key={crumb}>
              <span className="subpage-header__text">{crumb}</span>
              <span className="subpage-header__separator" aria-hidden>/</span>
            </span>
          ))}
          <span className="subpage-header__current">{title}</span>
        </div>
        {subtitle && <p className="subpage-header__subtitle">{subtitle}</p>}
      </nav>

      {actions && <div className="subpage-header__actions">{actions}</div>}
    </header>
  );
}

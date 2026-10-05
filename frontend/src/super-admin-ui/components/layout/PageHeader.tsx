import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import './layout.css';

export interface BreadcrumbSegment {
  
  label: string;
  
  onClick?: () => void;
}

interface PageHeaderProps {
  
  title: string;

  
  subtitle?: string;

  
  breadcrumbs?: BreadcrumbSegment[];

  
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  const isSubpage = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header className="page-header" dir="rtl">
      {}
      <div className="page-header__title-block">
        {isSubpage ? (
          
          <div className="page-header__breadcrumb">
            {breadcrumbs.map((seg, idx) => (
              <span key={idx} className="page-header__breadcrumb-segment">
                {seg.onClick ? (
                  <button
                    type="button"
                    className="page-header__breadcrumb-link"
                    onClick={seg.onClick}
                  >
                    {seg.label}
                  </button>
                ) : (
                  <span className="page-header__breadcrumb-static">{seg.label}</span>
                )}
                {}
                <ChevronRight
                  size={20}
                  strokeWidth={2}
                  className="page-header__breadcrumb-chevron"
                  aria-hidden
                />
              </span>
            ))}
            {}
            <h1 className="page-header__title page-header__title--current">{title}</h1>
          </div>
        ) : (
          
          <>
            <h1 className="page-header__title">{title}</h1>
            {subtitle && (
              <p className="page-header__subtitle">{subtitle}</p>
            )}
            {}
            {!subtitle && (
              <p className="page-header__subtitle page-header__subtitle--placeholder" aria-hidden>
                &nbsp;
              </p>
            )}
          </>
        )}
      </div>

      {}
      <div className="page-header__action">
        {action ?? null}
      </div>
    </header>
  );
}

import type { ReactElement } from 'react';
import './layout.css';
import './placeholder-page.css';

interface PlaceholderPageProps {
  title: string;
  icon: () => ReactElement;
  description: string;
}

export function PlaceholderPage({ title, icon: Icon, description }: PlaceholderPageProps) {
  return (
    <div className="dashboard-page">
      <header className="header" dir="rtl">
        <h1 className="header__title">{title}</h1>
      </header>
      <div className="placeholder-page">
        <div className="placeholder-page__icon">
          <Icon />
        </div>
        <h2 className="placeholder-page__title">{title}</h2>
        <p className="placeholder-page__description">{description}</p>
      </div>
    </div>
  );
}

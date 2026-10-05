import './ui.css';

interface ProgressBarProps {
  value: number;
  className?: string;
  
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

export function ProgressBar({ value, className = '', tone = 'success' }: ProgressBarProps) {
  return (
    <div className={`ui-progress ${className}`.trim()} dir="rtl">
      <div className="ui-progress__track">
        <div className={`ui-progress__fill ui-progress__fill--${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

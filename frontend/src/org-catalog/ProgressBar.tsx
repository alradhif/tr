type ProgressBarProps = {
  value: number
  className?: string
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

export function ProgressBar({ value, className = '', tone = 'success' }: ProgressBarProps) {
  const width = Math.min(100, Math.max(0, value))
  const fill = tone === 'neutral' ? 'info' : tone
  return (
    <div className={`ui-progress ${className}`.trim()} dir="rtl">
      <div className="ui-progress__track">
        <div className={`ui-progress__fill ui-progress__fill--${fill}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

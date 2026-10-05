import './trend-kpi-card.css';

export type TrendKpiCardProps = {
  label: string;
  value: string | number;
  delta: string;
  up: boolean;
};

export function TrendKpiCard({ label, value, delta, up }: TrendKpiCardProps) {
  return (
    <div className="trend-kpi-card">
      <div className="trend-kpi-card__badge-col">
        <div className={`trend-kpi-card__badge ${up ? 'is-up' : 'is-down'}`}>
          <div className="trend-kpi-card__badge-icon">
            <svg
              width="18.750001907348633"
              height="12.000001907348633"
              viewBox="0 0 18.750001907348633 12.000001907348633"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              style={{
                left: '9.4%',
                top: '25%',
                right: '12.5%',
                bottom: '25%',
                width: '78.1%',
                height: '50%',
                position: 'absolute',
              }}
            >
              <path
                d="M10.4323 2.4117L18.75 0 16.6797 8.4092 14.0971 5.9298 9.931 10.2694C9.7896 10.4167 9.5942 10.5 9.39 10.5 9.1858 10.5 8.9904 10.4167 8.849 10.2694L5.79 7.083 1.291 11.7694C1.0042 12.0682 0.5294 12.0779 0.2306 11.791-0.0682 11.5042-0.0779 11.0294 0.209 10.7306L5.249 5.4806C5.3904 5.3333 5.5858 5.25 5.79 5.25 5.9942 5.25 6.1896 5.3333 6.331 5.4806L9.39 8.667 13.015 4.891 10.4323 2.4117Z"
                style={{ fillRule: 'evenodd', fill: up ? '#17b26a' : '#f04438' }}
              />
            </svg>
          </div>
        </div>
        <span className="trend-kpi-card__delta">{delta}</span>
      </div>
      <div className="trend-kpi-card__info">
        <span className="trend-kpi-card__label">{label}</span>
        <span className="trend-kpi-card__value">{value}</span>
      </div>
    </div>
  );
}

export function TrendKpiRow({ stats }: { stats: TrendKpiCardProps[] }) {
  return (
    <div className="trend-kpi-row">
      {stats.map((s) => (
        <TrendKpiCard key={s.label} {...s} />
      ))}
    </div>
  );
}

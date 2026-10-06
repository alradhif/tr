const COLORS = ['oklch(0.75 0.17 65)', 'oklch(0.7 0.17 155)', 'oklch(0.62 0.22 27)', 'oklch(0.6 0.15 280)', 'oklch(0.7 0.12 230)']

export type CityCount = { label: string; count: number }

/** Count of records per city; cities past the fourth are grouped as "أخرى". */
export function cityDistribution(cities: string[]): (CityCount & { color: string })[] {
  const counts = new Map<string, number>()
  cities.forEach((city) => counts.set(city, (counts.get(city) ?? 0) + 1))
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 4).map(([label, count]) => ({ label, count }))
  const rest = sorted.slice(4).reduce((sum, [, count]) => sum + count, 0)
  if (rest) top.push({ label: 'أخرى', count: rest })
  return top.map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }))
}

export function CityDonutCard({ title, items }: { title: string; items: (CityCount & { color: string })[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const radius = 26
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="finance-card finance-card--donut">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="oklch(0.95 0.006 150)" strokeWidth="17" />
        <g transform="rotate(-90 36 36)">
          {total > 0
            ? items.map((item) => {
                const length = (item.count / total) * circumference
                const segment = (
                  <circle
                    key={item.label}
                    cx="36"
                    cy="36"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="17"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += length
                return segment
              })
            : null}
        </g>
      </svg>
      <div style={{ flex: 1 }}>
        <span className="finance-card__label">{title}</span>
        <ul className="finance-donut__legend">
          {items.map((item) => (
            <li key={item.label} className="finance-donut__item">
              <span className="finance-donut__name" style={{ color: item.color }}>
                <span className="finance-donut__dot" style={{ background: item.color }} />
                {item.label}
              </span>
              <span className="finance-donut__count">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

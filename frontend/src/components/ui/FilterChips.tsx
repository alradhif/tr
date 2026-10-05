export type FilterChip = {
  key: string
  label: string
  count?: number
}

export type FilterChipsProps = {
  items: FilterChip[]
  value: string
  onChange: (key: string) => void
  className?: string
}

export function FilterChips({ items, value, onChange, className }: FilterChipsProps) {
  return (
    <div className={`filter-chips${className ? ` ${className}` : ''}`}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`filter-chip ${value === item.key ? 'filter-chip--active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.count == null ? item.label : `${item.label}(${item.count})`}
        </button>
      ))}
    </div>
  )
}

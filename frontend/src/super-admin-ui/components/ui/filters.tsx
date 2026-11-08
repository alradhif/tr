import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, FolderOpen, X } from 'lucide-react';
import './filters.css';

/** A trigger with its popover; closes on an outside click or Escape. */
function FilterShell({
  label,
  value,
  count,
  children,
}: {
  label: string;
  value: string;
  count?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const highlighted = open || Boolean(count);
  return (
    <div className="sa-filter" ref={ref}>
      <button
        type="button"
        className={`sa-filter__trigger${highlighted ? ' sa-filter__trigger--active' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="sa-filter__label">{label}:</span>
        <span className="sa-filter__value">{value}</span>
        {count ? <span className="sa-filter__count">{count}</span> : null}
        <ChevronDown size={16} className={open ? 'sa-filter__chevron--open' : undefined} />
      </button>
      {open ? <div className="sa-filter__menu">{children(() => setOpen(false))}</div> : null}
    </div>
  );
}

export interface MultiOption {
  value: string;
  label: string;
  count?: number;
}

/** Several choices that only take effect when "تطبيق" is pressed. */
export function MultiSelectFilter({
  label,
  options,
  selected,
  onApply,
}: {
  label: string;
  options: MultiOption[];
  selected: string[];
  onApply: (values: string[]) => void;
}) {
  const value = selected.length
    ? options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.label)
        .join('، ')
    : 'الكل';
  return (
    <FilterShell label={label} value={value} count={selected.length}>
      {(close) => (
        <MultiSelectMenu
          label={label}
          options={options}
          selected={selected}
          onCancel={close}
          onApply={(values) => {
            onApply(values);
            close();
          }}
        />
      )}
    </FilterShell>
  );
}

function MultiSelectMenu({
  label,
  options,
  selected,
  onApply,
  onCancel,
}: {
  label: string;
  options: MultiOption[];
  selected: string[];
  onApply: (values: string[]) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(selected);
  const toggle = (value: string) =>
    setDraft((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  return (
    <>
      <p className="sa-filter__heading">{label} — اختيار متعدد</p>
      {options.map((option) => {
        const checked = draft.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            className={`sa-filter__option${checked ? ' sa-filter__option--checked' : ''}`}
            onClick={() => toggle(option.value)}
          >
            <span className="sa-filter__box">{checked ? <Check size={14} strokeWidth={3} /> : null}</span>
            <span className="sa-filter__option-label">{option.label}</span>
            {option.count !== undefined ? <span className="sa-filter__option-count">{option.count}</span> : null}
          </button>
        );
      })}
      <p className="sa-filter__hint">لن تُطبق الاختيارات حتى تضغط «تطبيق».</p>
      <div className="sa-filter__actions">
        <button type="button" className="sa-filter__apply" onClick={() => onApply(draft)}>
          تطبيق{draft.length ? ` (${draft.length})` : ''}
        </button>
        <button type="button" className="sa-filter__cancel" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </>
  );
}

/** One choice that applies immediately. */
export function SingleSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: MultiOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FilterShell label={label} value={options.find((option) => option.value === value)?.label ?? ''}>
      {(close) =>
        options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`sa-filter__option${option.value === value ? ' sa-filter__option--checked' : ''}`}
            onClick={() => {
              onChange(option.value);
              close();
            }}
          >
            <span className="sa-filter__option-label">{option.label}</span>
          </button>
        ))
      }
    </FilterShell>
  );
}

export type DateRangeValue =
  | { kind: 'any' }
  | { kind: 'within'; days: number }
  | { kind: 'custom'; from: string; to: string };

export function dateRangeLabel(value: DateRangeValue) {
  if (value.kind === 'any') return 'أي وقت';
  if (value.kind === 'within') return `خلال ${value.days} يومًا`;
  return `${value.from} – ${value.to}`;
}

/** True when an ISO date falls inside the range, counting "within" from today. */
export function matchesDateRange(iso: string | undefined, value: DateRangeValue) {
  if (value.kind === 'any') return true;
  if (!iso) return false;
  const date = iso.slice(0, 10);
  if (value.kind === 'custom') return date >= value.from && date <= value.to;
  const today = new Date();
  const end = new Date(today.getTime() + value.days * 24 * 60 * 60 * 1000);
  return date >= today.toISOString().slice(0, 10) && date <= end.toISOString().slice(0, 10);
}

export function DateRangeFilter({
  label,
  value,
  onApply,
}: {
  label: string;
  value: DateRangeValue;
  onApply: (value: DateRangeValue) => void;
}) {
  return (
    <FilterShell label={label} value={dateRangeLabel(value)} count={value.kind === 'any' ? 0 : 1}>
      {(close) => (
        <DateRangeMenu
          label={label}
          value={value}
          onCancel={close}
          onApply={(next) => {
            onApply(next);
            close();
          }}
        />
      )}
    </FilterShell>
  );
}

function DateRangeMenu({
  label,
  value,
  onApply,
  onCancel,
}: {
  label: string;
  value: DateRangeValue;
  onApply: (value: DateRangeValue) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DateRangeValue>(
    value.kind === 'any' ? { kind: 'custom', from: '', to: '' } : value,
  );
  const invalid = draft.kind === 'custom' && Boolean(draft.from && draft.to) && draft.to <= draft.from;
  const incomplete = draft.kind === 'custom' && (!draft.from || !draft.to);
  const presets: Array<{ label: string; next: DateRangeValue; active: boolean }> = [
    { label: 'مخصص', next: { kind: 'custom', from: '', to: '' }, active: draft.kind === 'custom' },
    { label: 'خلال 30 يومًا', next: { kind: 'within', days: 30 }, active: draft.kind === 'within' && draft.days === 30 },
    { label: 'خلال 90 يومًا', next: { kind: 'within', days: 90 }, active: draft.kind === 'within' && draft.days === 90 },
  ];

  return (
    <div className="sa-filter__range">
      <p className="sa-filter__heading">{label} — نطاق</p>
      <div className="sa-filter__presets">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`sa-filter__preset${preset.active ? ' sa-filter__preset--active' : ''}`}
            onClick={() => setDraft(preset.next)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {draft.kind === 'custom' ? (
        <div className="sa-filter__dates">
          <label>
            <span>من</span>
            <input
              type="date"
              value={draft.from}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
            />
          </label>
          <label className={invalid ? 'sa-filter__date--invalid' : undefined}>
            <span>إلى</span>
            <input
              type="date"
              value={draft.to}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            />
          </label>
        </div>
      ) : null}
      {invalid ? <p className="sa-filter__error">تاريخ «إلى» يجب أن يكون بعد تاريخ «من».</p> : null}
      <div className="sa-filter__actions">
        <button type="button" className="sa-filter__apply" disabled={invalid || incomplete} onClick={() => onApply(draft)}>
          تطبيق
        </button>
        <button type="button" className="sa-filter__cancel" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

export interface StatusChip<T extends string> {
  id: T;
  label: string;
  count: number;
}

export function StatusChips<T extends string>({
  chips,
  active,
  onChange,
}: {
  chips: Array<StatusChip<T>>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="sa-chips" role="tablist">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          role="tab"
          aria-selected={chip.id === active}
          className={`sa-chip${chip.id === active ? ' sa-chip--active' : ''}`}
          onClick={() => onChange(chip.id)}
        >
          {chip.label}
          <span className="sa-chip__count">{chip.count}</span>
        </button>
      ))}
    </div>
  );
}

export function AppliedTags({
  tags,
  onClearAll,
}: {
  tags: Array<{ key: string; label: string; onRemove: () => void }>;
  onClearAll: () => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="sa-applied">
      <span className="sa-applied__title">الفلاتر المطبّقة:</span>
      {tags.map((tag) => (
        <span className="sa-applied__tag" key={tag.key}>
          {tag.label}
          <button type="button" aria-label={`إزالة ${tag.label}`} onClick={tag.onRemove}>
            <X size={12} />
          </button>
        </span>
      ))}
      <button type="button" className="sa-applied__clear" onClick={onClearAll}>
        مسح الكل
      </button>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="sa-pagination">
      <span className="sa-pagination__summary">
        عرض {from}–{to} من {total}
      </span>
      <div className="sa-pagination__pages">
        <button type="button" aria-label="الصفحة السابقة" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronRight size={16} />
        </button>
        {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            aria-current={number === page ? 'page' : undefined}
            className={number === page ? 'sa-pagination__current' : undefined}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
        <button type="button" aria-label="الصفحة التالية" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

/** Empty, no-results and error messages shown in place of a list. */
export function PageState({
  tone = 'empty',
  title,
  body,
  actionLabel,
  onAction,
}: {
  tone?: 'empty' | 'error';
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`sa-state sa-state--${tone}`}>
      <span className="sa-state__icon">{tone === 'error' ? '!' : <FolderOpen size={22} />}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

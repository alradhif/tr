import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { searchPortal, tokenForPath, type SearchResult } from '../../api/me'
import './portal-search.css'

const KIND_LABEL: Record<string, string> = {
  project: 'مشروع',
  department: 'إدارة',
  company: 'شركة',
  goal: 'هدف',
  org: 'جهة',
  client: 'عميل',
  invoice: 'فاتورة',
  sector: 'قطاع',
  tenant: 'مستأجر',
  user: 'مستخدم',
}

type PortalSearchProps = {
  /** Renders the input; the component adds the results dropdown under it. */
  renderInput: (props: {
    value: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onFocus: () => void
  }) => React.ReactNode
  className?: string
}

/** Searches the signed-in portal's own records on the server and links to them. */
export function PortalSearch({ renderInput, className }: PortalSearchProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const token = tokenForPath(location.pathname)
    if (!token) return
    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      searchPortal(token, q)
        .then((data) => {
          if (!cancelled) setResults(data.results)
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, location.pathname])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const go = (link: string) => {
    setOpen(false)
    setQuery('')
    navigate(link)
  }

  return (
    <div className={`portal-search ${className ?? ''}`} ref={wrapRef}>
      {renderInput({
        value: query,
        onChange: (event) => {
          setQuery(event.target.value)
          setOpen(true)
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' && results[0]) go(results[0].link)
          if (event.key === 'Escape') setOpen(false)
        },
        onFocus: () => setOpen(true),
      })}
      {open && query.trim().length >= 2 ? (
        <div className="portal-search__results" role="listbox" dir="rtl">
          {loading && results.length === 0 ? <div className="portal-search__empty">جاري البحث...</div> : null}
          {!loading && results.length === 0 ? <div className="portal-search__empty">لا توجد نتائج</div> : null}
          {results.map((result, index) => (
            <button
              type="button"
              role="option"
              aria-selected={false}
              key={`${result.link}-${index}`}
              className="portal-search__item"
              onClick={() => go(result.link)}
            >
              <span className="portal-search__kind">{KIND_LABEL[result.kind] ?? result.kind}</span>
              <span className="portal-search__label">{result.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

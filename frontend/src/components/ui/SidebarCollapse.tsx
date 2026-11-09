import { useEffect, useState, type ReactElement } from 'react'
import { Tooltip } from 'antd'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import '../../design/sidebar-collapse.css'

const STORAGE_KEY = 'trackplus.sidebar.collapsed'

/** Used when no transition runs, as with reduced motion or at the fixed mobile width. */
const FALLBACK_MS = 400

/** Dashboard grids only measure on window resize, so tell them once the sidebar has settled. */
function remeasureAfterTransition() {
  const sidebar = document.querySelector('.sidebar')
  const announce = () => {
    window.clearTimeout(fallback)
    sidebar?.removeEventListener('transitionend', onEnd)
    window.dispatchEvent(new Event('resize'))
  }
  const onEnd = (event: Event) => {
    if (event.target === sidebar && (event as TransitionEvent).propertyName === 'width') announce()
  }
  const fallback = window.setTimeout(announce, FALLBACK_MS)
  sidebar?.addEventListener('transitionend', onEnd)
}

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** The sidebar's open/closed state, remembered for this browser. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    // On the root element so panels rendered on <body> can follow the sidebar's width.
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open'
    return () => {
      delete document.documentElement.dataset.sidebar
    }
  }, [collapsed])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // Without storage the choice simply lasts for this visit.
    }
    remeasureAfterTransition()
  }

  return { collapsed, toggle }
}

export function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? 'فتح القائمة الجانبية' : 'طي القائمة الجانبية'
  return (
    <Tooltip title={label} placement="left" mouseEnterDelay={0.3}>
      <button type="button" className="sidebar-toggle" aria-label={label} aria-expanded={!collapsed} onClick={onToggle}>
        {collapsed ? <ChevronLeft size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
      </button>
    </Tooltip>
  )
}

/** Names an icon-only item while the sidebar is collapsed; adds nothing while it is open. */
export function SidebarTip({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactElement }) {
  return (
    <Tooltip title={collapsed ? label : undefined} placement="left" trigger={['hover', 'focus']}>
      {children}
    </Tooltip>
  )
}

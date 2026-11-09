import { useEffect, useState, type ReactElement } from 'react'
import { Tooltip } from 'antd'
import { PanelRightClose } from 'lucide-react'
import '../../design/sidebar-collapse.css'

const STORAGE_KEY = 'trackplus.sidebar.collapsed'

/** Slightly longer than the sidebar's width animation. */
const SETTLE_MS = 300
const PULSE_MS = 50

/** Dashboard grids only measure on window resize, so keep them following the sidebar as it moves. */
function remeasureWhileMoving() {
  const started = performance.now()
  const pulse = () => {
    window.dispatchEvent(new Event('resize'))
    if (performance.now() - started < SETTLE_MS) window.setTimeout(pulse, PULSE_MS)
  }
  window.setTimeout(pulse, PULSE_MS)
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
    remeasureWhileMoving()
  }

  return { collapsed, toggle }
}

/** Covers the logo area, so clicking the logo opens and closes the sidebar. */
export function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? 'فتح القائمة الجانبية' : 'طي القائمة الجانبية'
  return (
    <Tooltip title={label} placement="left" mouseEnterDelay={0.3}>
      <button type="button" className="sidebar-toggle" aria-label={label} aria-expanded={!collapsed} onClick={onToggle}>
        {collapsed ? null : <PanelRightClose size={18} strokeWidth={2} aria-hidden />}
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

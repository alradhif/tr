import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Input } from 'antd'
import { MoreOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons'
import { LogOut, MoreVertical, Search } from 'lucide-react'
import { PortalSearch } from '../search/PortalSearch'
import { NotificationsButton } from '../notifications/NotificationsButton'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrackLogo } from '../TrackLogo'
import '../../super-admin-ui/components/layout/sidebar-dropdown.css'
import './app-sidebar-design.css'

export type AppNavItem = {
  key: string
  label: string
  icon: ReactNode
}

export type AppSidebarProps = {
  navItems: AppNavItem[]
  settingsPath: string
  userName?: string
  userRole: string
  showMore?: boolean
  variant?: 'default' | 'catalog'
  brand?: ReactNode
  settingsIcon?: ReactNode
  onSignOut?: () => void
}

function SignOutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div
      className="signout-backdrop"
      role="dialog"
      aria-modal="true"
      dir="rtl"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className="signout-modal">
        <div className="signout-modal__icon-wrap">
          <LogOut size={22} className="signout-modal__icon" />
        </div>
        <h2 className="signout-modal__title">تسجيل الخروج</h2>
        <p className="signout-modal__body">هل أنت متأكد من تسجيل الخروج؟</p>
        <div className="signout-modal__actions">
          <button type="button" className="signout-modal__btn signout-modal__btn--danger" onClick={onConfirm}>
            تسجيل الخروج
          </button>
          <button type="button" className="signout-modal__btn signout-modal__btn--ghost" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({
  navItems,
  settingsPath,
  userName,
  userRole,
  showMore = false,
  variant = 'default',
  brand,
  settingsIcon,
  onSignOut,
}: AppSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const avatarLetter = userName?.trim()?.charAt(0) || '—'
  const catalog = variant === 'catalog'
  const settingsActive = location.pathname.startsWith(settingsPath)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current?.contains(target) || moreButtonRef.current?.contains(target)) return
      setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const renderItem = (item: AppNavItem) => {
    const active = location.pathname.startsWith(item.key)
    return (
      <button
        key={item.key}
        type="button"
        className={`sidebar__nav-item ${active ? 'sidebar__nav-item--active' : ''} app-sidebar__item ${active ? 'app-sidebar__item--active' : ''}`}
        onClick={() => navigate(item.key)}
      >
        {catalog ? (
          <>
            <span className="sidebar__nav-icon app-sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </>
        ) : (
          <>
            <span>{item.label}</span>
            <span className="app-sidebar__icon">{item.icon}</span>
          </>
        )}
      </button>
    )
  }

  const settingsButton = (
    <button
      type="button"
      className={`sidebar__nav-item ${settingsActive ? 'sidebar__nav-item--active' : ''} app-sidebar__item ${settingsActive ? 'app-sidebar__item--active' : ''}`}
      onClick={() => navigate(settingsPath)}
    >
      {catalog ? (
        <>
          <span className="sidebar__nav-icon app-sidebar__icon">{settingsIcon ?? <SettingOutlined />}</span>
          <span>{t('settings')}</span>
        </>
      ) : (
        <>
          <span>{t('settings')}</span>
          <span className="app-sidebar__icon">
            <SettingOutlined />
          </span>
        </>
      )}
    </button>
  )

  const moreControl = onSignOut ? (
    <div className="sidebar__profile-menu-wrap">
      <button
        ref={moreButtonRef}
        type="button"
        className={`sidebar__profile-menu ${dropdownOpen ? 'sidebar__profile-menu--active' : ''}`}
        aria-label="المزيد من الخيارات"
        aria-expanded={dropdownOpen}
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        {catalog ? <MoreVertical size={18} strokeWidth={2.5} /> : <MoreOutlined />}
      </button>
      {dropdownOpen ? (
        <div ref={dropdownRef} className="profile-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            className="profile-dropdown__item profile-dropdown__item--danger"
            onClick={() => {
              setDropdownOpen(false)
              setShowSignOutModal(true)
            }}
          >
            <LogOut size={15} strokeWidth={2} aria-hidden />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      ) : null}
    </div>
  ) : showMore ? (
    catalog ? (
      <span className="app-sidebar__more">
        <MoreVertical size={18} strokeWidth={2.5} aria-hidden />
      </span>
    ) : (
      <MoreOutlined className="app-sidebar__more" />
    )
  ) : null

  return (
    <aside className={catalog ? 'sidebar app-sidebar app-sidebar--catalog' : 'app-sidebar'} dir="rtl">
      <div className="sidebar__logo app-sidebar__logo">{brand ?? <TrackLogo size="sm" />}</div>
      {catalog ? null : <div className="app-sidebar__divider" />}
      <div className={`sidebar__search app-sidebar__search${catalog ? ' app-sidebar__search--catalog' : ''}`}>
        {catalog ? (
          <>
            <Search size={18} strokeWidth={2.5} className="sidebar__search-icon app-sidebar__search-icon" aria-hidden />
            <PortalSearch
              className="app-sidebar__search-box"
              renderInput={(props) => <input type="search" placeholder={t('search')} aria-label={t('search')} {...props} />}
            />
          </>
        ) : (
          <PortalSearch
            renderInput={(props) => <Input placeholder={t('search')} prefix={<SearchOutlined />} allowClear {...props} />}
          />
        )}
      </div>

      <nav className="sidebar__nav app-sidebar__nav">{navItems.map(renderItem)}</nav>

      <div className="sidebar__footer app-sidebar__footer">
        <NotificationsButton
          catalog={catalog}
          className="sidebar__nav-item app-sidebar__item notifications-nav-item"
        />
        {settingsButton}

        <div className="sidebar__profile app-sidebar__profile">
          {catalog ? (
            <>
              {moreControl}
              <div className="app-sidebar__meta">
                <div className="app-sidebar__name">{userName || t('noUserYet')}</div>
                <div className="app-sidebar__role">{userRole}</div>
              </div>
              <div className="app-sidebar__avatar">{avatarLetter}</div>
            </>
          ) : (
            <>
              <div className="app-sidebar__avatar">{avatarLetter}</div>
              <div className="app-sidebar__meta">
                <div className="app-sidebar__name">{userName || t('noUserYet')}</div>
                <div className="app-sidebar__role">{userRole}</div>
              </div>
              {moreControl}
            </>
          )}
        </div>
      </div>
      {showSignOutModal && onSignOut ? (
        <SignOutModal
          onConfirm={() => {
            setShowSignOutModal(false)
            onSignOut()
          }}
          onCancel={() => setShowSignOutModal(false)}
        />
      ) : null}
    </aside>
  )
}

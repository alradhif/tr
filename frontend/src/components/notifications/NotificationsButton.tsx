import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  tokenForPath,
  type AppNotification,
} from '../../api/me'
import './notifications.css'

const POLL_MS = 60_000

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  return new Date(value).toLocaleDateString('ar-SA')
}

/** Sidebar entry with the unread count; opens the signed-in user's notifications from the server. */
export function NotificationsButton({ className, catalog }: { className: string; catalog?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const token = tokenForPath(location.pathname)
    if (!token) return
    try {
      const data = await getNotifications(token)
      setItems(data.notifications)
      setUnread(data.unreadCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الإشعارات')
    }
  }, [location.pathname])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!open) return
    void load()
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, load])

  const openItem = async (item: AppNotification) => {
    const token = tokenForPath(location.pathname)
    if (token && !item.isRead) {
      await markNotificationRead(token, item.id).catch(() => undefined)
      await load()
    }
    if (item.link) {
      setOpen(false)
      navigate(item.link)
    }
  }

  const markAll = async () => {
    const token = tokenForPath(location.pathname)
    if (!token) return
    await markAllNotificationsRead(token).catch(() => undefined)
    await load()
  }

  const badge = unread > 0 ? <span className="notifications-badge">{unread > 99 ? '99+' : unread}</span> : null

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {catalog ? (
          <>
            <span className="sidebar__nav-icon app-sidebar__icon">
              <Bell size={18} strokeWidth={2} />
            </span>
            <span>الإشعارات</span>
            {badge}
          </>
        ) : (
          <>
            <span>الإشعارات</span>
            {badge}
            <span className="app-sidebar__icon">
              <Bell size={16} strokeWidth={2} />
            </span>
          </>
        )}
      </button>
      {open ? (
        <div className="notifications-panel" ref={panelRef} dir="rtl" role="dialog" aria-label="الإشعارات">
          <header className="notifications-panel__header">
            <h2>الإشعارات</h2>
            <div className="notifications-panel__actions">
              <button type="button" onClick={() => void markAll()} disabled={unread === 0}>
                <CheckCheck size={14} /> تعليم الكل كمقروء
              </button>
              <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </header>
          {error ? <p className="notifications-panel__empty">{error}</p> : null}
          {!error && items.length === 0 ? <p className="notifications-panel__empty">لا توجد إشعارات</p> : null}
          <ul className="notifications-panel__list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`notifications-panel__item ${item.isRead ? '' : 'is-unread'} is-${item.type.toLowerCase()}`}
                  onClick={() => void openItem(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <em>{timeAgo(item.createdAt)}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}

import { type ReactElement, useEffect, useRef, useState } from 'react';
import { LogOut, MoreVertical, Search } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { PortalSearch } from '../../../components/search/PortalSearch';
import { brandAssets } from '@/assets';
import { getSuperAdminUser } from '../../../auth/superAdminAuth';
import {
  AuditLogIcon,
  CompaniesIcon,
  DashboardIcon,
  SidebarSettingsIcon,
  SubscriptionsIcon,
  TenantsIcon,
  UsersNavIcon,
} from './SidebarIcons';
import './layout.css';
import './sidebar-dropdown.css';

export type PageId = 'dashboard' | 'companies' | 'tenants' | 'users' | 'subscriptions' | 'audit-log' | 'settings';

const ADMIN_ROUTABLE_PAGES: PageId[] = ['dashboard', 'companies'];

interface SuperadminNavItem {
  id: PageId;
  label: string;
  icon: () => ReactElement;
}

const SUPERADMIN_NAV_ITEMS: SuperadminNavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: DashboardIcon },
  { id: 'tenants', label: 'إدارة المستأجرين', icon: TenantsIcon },
  { id: 'users', label: 'المستخدمون', icon: UsersNavIcon },
  { id: 'subscriptions', label: 'الاشتراكات والباقات', icon: SubscriptionsIcon },
  { id: 'audit-log', label: 'سجل التدقيق', icon: AuditLogIcon },
];

const ADMIN_NAV_ITEMS: SuperadminNavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: DashboardIcon },
  { id: 'companies', label: 'الشركات', icon: CompaniesIcon },
];

interface SidebarProps {
  role: UserRole;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  
  onSignOut?: () => void;
}

interface SignOutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function SignOutModal({ onConfirm, onCancel }: SignOutModalProps) {
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    
    <div
      className="signout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      dir="rtl"
      onClick={(e) => {
        
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="signout-modal">
        {}
        <div className="signout-modal__icon-wrap">
          <LogOut size={24} strokeWidth={2} className="signout-modal__icon" />
        </div>

        {}
        <h2 id="signout-modal-title" className="signout-modal__title">
          تسجيل الخروج
        </h2>
        <p className="signout-modal__body">
          هل أنت متأكد أنك تريد تسجيل الخروج؟
        </p>

        {}
        <div className="signout-modal__actions">
          <button
            type="button"
            className="signout-modal__btn signout-modal__btn--cancel"
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="signout-modal__btn signout-modal__btn--confirm"
            onClick={onConfirm}
            autoFocus
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ role, activePage, onNavigate, onSignOut }: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const items: SuperadminNavItem[] =
    role === 'superadmin' ? SUPERADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS
  const sessionUser = getSuperAdminUser()
  const profileName = sessionUser?.name?.trim() || '—'
  const profileRole = role === 'superadmin' ? 'مدير النظام' : 'مدير'
  const profileInitial = profileName.charAt(0) || '—'

  
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSignOutClick = () => {
    setDropdownOpen(false);
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    document.cookie = 'authToken=; Max-Age=0; path=/';
    
    onSignOut?.();
  };

  return (
    <>
      <aside className="sidebar" dir="rtl">
        <div className="sidebar__logo">
          <img src={brandAssets.logoFull} alt="TrackPlus" className="sidebar__logo-full" />
        </div>

        <div className="sidebar__search">
          <Search size={18} strokeWidth={2.5} className="sidebar__search-icon" />
          <PortalSearch
            className="sidebar__search-box"
            renderInput={(props) => <input type="search" placeholder="البحث" aria-label="بحث" {...props} />}
          />
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => {
            const Icon = item.icon;
            const isRoutable = role === 'superadmin' || ADMIN_ROUTABLE_PAGES.includes(item.id);
            return (
              <a
                key={item.id}
                href={`/super-admin/${item.id === 'dashboard' ? '' : item.id}`}
                className={`sidebar__nav-item ${
                  item.id === activePage ? 'sidebar__nav-item--active' : ''
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  if (isRoutable) {
                    onNavigate(item.id);
                  }
                }}
              >
                <Icon />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <a
            href="/super-admin/settings"
            className={`sidebar__nav-item ${activePage === 'settings' ? 'sidebar__nav-item--active' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate('settings');
            }}
          >
            <SidebarSettingsIcon />
            <span>الإعدادات</span>
          </a>

          <div className="sidebar__profile">
            {}
            <div className="sidebar__profile-menu-wrap">
              <button
                ref={moreButtonRef}
                type="button"
                className={`sidebar__profile-menu ${dropdownOpen ? 'sidebar__profile-menu--active' : ''}`}
                aria-label="المزيد من الخيارات"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <MoreVertical size={18} strokeWidth={2.5} />
              </button>

              {}
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="profile-dropdown"
                  role="menu"
                  aria-label="خيارات المستخدم"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="profile-dropdown__item profile-dropdown__item--danger"
                    onClick={handleSignOutClick}
                  >
                    <LogOut size={15} strokeWidth={2} aria-hidden />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">{profileName}</span>
              <span className="sidebar__profile-role">{profileRole}</span>
            </div>
            <div className="sidebar__avatar">{profileInitial}</div>
          </div>
        </div>
      </aside>

      {}
      {showSignOutModal && (
        <SignOutModal
          onConfirm={handleConfirmSignOut}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}
    </>
  );
}

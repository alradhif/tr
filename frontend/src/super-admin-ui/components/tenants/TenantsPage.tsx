import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CredentialsModal } from '../../../components/settings/CredentialsModal';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import GridLayout, { WidthProvider, type Layout, type LayoutItem } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PageHeader } from '../layout/PageHeader';
import { AddTenantPage, type TenantFormData } from './AddTenantPage';
import { ReviewTenantPage } from './ReviewTenantPage';
import { TenantDetailsPage } from './TenantDetailsPage';
import { useTenantMutations, useTenants, type Tenant } from '../../context/TenantContext';
import {
  createTenant,
  getPackages,
  getSectors,
  resolveBackendPackageId,
} from '../../../api/superAdmin';
import { getSuperAdminToken } from '../../../auth/superAdminAuth';
import { clientToTenant, jodaynToTenant, orgToTenant, tenantToRow } from '../../lib/mapAccounts';
import { isTenantType, type TenantType } from '../../lib/tenantTypes';
import { dashboardDataAssets } from '@/assets';
import { AssetIcon } from '../../../components/ui/AssetIcon';
import {
  type TenantRow,
  type TenantRowStatus,
} from '../../data/tenantsPage';
import '../layout/layout.css';
import '../dashboard/dashboard.css';
import './tenants.css';

const ResponsiveGrid = WidthProvider(GridLayout);

const statusVariant: Record<TenantRowStatus, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
};

interface StatCardProps {
  iconSrc: string;
  label: string;
  value: number;
  unit: string;
}

function StatCard({ iconSrc, label, value, unit }: StatCardProps) {
  return (
    <Card className="tenants-stat-card">
      <div className="widget-icon-header">
        <span className="widget-icon-badge">
          <AssetIcon src={iconSrc} size={16} />
        </span>
        <p className="widget-title">{label}</p>
      </div>
      <div className="widget-stat-block widget-stat-inline">
        <span className="widget-stat-value">{value}</span>
        <span className="widget-stat-label">{unit}</span>
      </div>
    </Card>
  );
}

type StatId = 'total' | 'active' | 'trial' | 'suspended';

const DEFAULT_STATS_LAYOUT: LayoutItem[] = [
  { i: 'total',     x: 9, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'active',    x: 6, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'trial',     x: 3, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
  { i: 'suspended', x: 0, y: 0, w: 3, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 4 },
];

const DEFAULT_TABLE_LAYOUT: LayoutItem[] = [
  { i: 'table', x: 0, y: 0, w: 12, h: 7, minW: 6, maxW: 12, minH: 3, maxH: 16 },
];

type TenantsView = 'list' | 'add' | 'review' | 'details';

const BLANK_DRAFT: TenantFormData = {
  tenantType: '',
  entityName: '',
  entityType: 'حكومية',
  unifiedId: '',
  region: '',
  subdomain: '',
  managerName: '',
  managerEmail: '',
  managerPhone: '',
  managerTitle: '',
  planId: '',
  userLimit: '',
  storageLimit: '',
  subscriptionStart: '',
  subscriptionRenewal: '',
};

export function TenantsPage() {
  const [view, setView] = useState<TenantsView>('list');
  const [draft, setDraft] = useState<TenantFormData>(BLANK_DRAFT);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; temporaryPassword: string } | null>(null);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const contextTenants = useTenants();
  const { addTenant, refreshTenants } = useTenantMutations();
  const [tenants, setTenants] = useState<TenantRow[]>([]);

  useEffect(() => {
    setTenants(contextTenants.map(tenantToRow));
  }, [contextTenants]);

  
  const [activeFilter, setActiveFilter] = useState<'all' | TenantType>('all');
  const typeFilterTabs: Array<{ id: 'all' | TenantType; label: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'ORG', label: 'Organization' },
    { id: 'CLIENT', label: 'Client' },
    { id: 'JODAYN', label: 'Jodayn' },
  ];
  const query = search.trim().toLowerCase();
  const visibleTenants = tenants
    .filter((tenant) => activeFilter === 'all' || tenant.tenantType === activeFilter)
    .filter((tenant) => !query || tenant.name.toLowerCase().includes(query));

  // Global search links here with ?id=org-<id>; open that tenant directly.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (id && tenants.some((tenant) => tenant.id === id)) {
      setSelectedTenantId(id);
      setView('details');
    }
  }, [location.search, tenants]);

  
  
  
  
  
  const isEditMode = false;
  const [statsLayout, setStatsLayout] = useState<LayoutItem[]>(DEFAULT_STATS_LAYOUT);
  const [tableLayout, setTableLayout] = useState<LayoutItem[]>(DEFAULT_TABLE_LAYOUT);

  const handleStatsLayoutChange = useCallback(
    (newLayout: Layout) => { if (isEditMode) setStatsLayout([...newLayout]); },
    [isEditMode],
  );

  const handleTableLayoutChange = useCallback(
    (newLayout: Layout) => { if (isEditMode) setTableLayout([...newLayout]); },
    [isEditMode],
  );

  
  const summary = {
    total:     tenants.length,
    active:    tenants.filter((t) => t.status === 'active').length,
    trial:     tenants.filter((t) => t.status === 'trial').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
  };

  const statCards: Record<StatId, StatCardProps> = {
    total:     { iconSrc: dashboardDataAssets.totalTenants, label: 'إجمالي المستأجرين', value: summary.total,     unit: 'مستأجر' },
    active:    { iconSrc: dashboardDataAssets.active,       label: 'نشط',                value: summary.active,    unit: 'مستأجر نشط' },
    trial:     { iconSrc: dashboardDataAssets.trial,        label: 'تجربة مجانية',       value: summary.trial,     unit: 'تجارب' },
    suspended: { iconSrc: dashboardDataAssets.suspended,    label: 'معلق',               value: summary.suspended, unit: 'مستأجر' },
  };

  
  const handleFormNext = (data: TenantFormData) => {
    setDraft(data);
    setView('review');
  };

  
  const handleReviewBack = () => {
    setView('add');
    
  };

  
  const handleConfirm = async () => {
    const token = getSuperAdminToken();
    if (!token) {
      setConfirmError('يجب تسجيل الدخول أولاً');
      return;
    }
    if (!isTenantType(draft.tenantType)) {
      setConfirmError('نوع المستأجر مطلوب: Organization أو Client أو Jodayn');
      return;
    }

    setConfirming(true);
    setConfirmError('');
    try {
      const [{ sectors }, { packages }] = await Promise.all([
        getSectors(token),
        getPackages(token),
      ]);

      let sectorId: string | undefined;
      if (draft.tenantType === 'ORG' || draft.tenantType === 'CLIENT') {
        sectorId = sectors[0]?.id;
        if (!sectorId) {
          setConfirmError('أنشئ قطاعاً أولاً من بوابة جودين قبل إضافة مستأجر');
          return;
        }
      }

      const packageId = resolveBackendPackageId(packages, draft.planId);
      if (draft.planId && !packageId) {
        setConfirmError('تعذر ربط نوع الباقة. تأكد من وجود الباقات في النظام ثم أعد المحاولة.');
        return;
      }

      const created = await createTenant(token, {
        tenantType: draft.tenantType,
        name: draft.entityName,
        domain: draft.subdomain || undefined,
        entityType: draft.entityType || undefined,
        region: draft.region || undefined,
        phone: draft.managerPhone || undefined,
        crNumber: draft.unifiedId || undefined,
        sectorId,
        packageId,
        managerName: draft.managerName || undefined,
        managerEmail: draft.managerEmail || undefined,
        userLimit: draft.userLimit ? Number(draft.userLimit) : undefined,
        storageLimitGb: draft.storageLimit ? Number(draft.storageLimit) : undefined,
        subscriptionStart: draft.subscriptionStart || undefined,
      });
      if (created.temporaryPassword) {
        setCreatedCredentials({
          name: created.manager?.name || created.jodaynUser?.name || draft.managerName,
          email: created.manager?.email || created.jodaynUser?.email || draft.managerEmail,
          temporaryPassword: created.temporaryPassword,
        });
      }

      let detail: Tenant | null = null;
      if (created.tenantType === 'ORG' && created.org) {
        detail = orgToTenant(created.org);
      } else if (created.tenantType === 'CLIENT' && created.client) {
        detail = clientToTenant(created.client);
      } else if (created.tenantType === 'JODAYN' && created.jodaynUser) {
        detail = jodaynToTenant(created.jodaynUser);
      }

      if (detail) {
        addTenant({
          ...detail,
          adminName: draft.managerName || detail.adminName,
          email: draft.managerEmail || detail.email,
          phone: draft.managerPhone || detail.phone,
          crNumber: draft.unifiedId || detail.crNumber,
          region: draft.region || detail.region,
          entityType: draft.entityType || detail.entityType,
        });
      }
      await refreshTenants();
      setDraft(BLANK_DRAFT);
      setView('list');
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'تعذر إنشاء المستأجر');
    } finally {
      setConfirming(false);
    }
  };

  
  const handleCancel = () => {
    setDraft(BLANK_DRAFT);
    setView('list');
  };

  
  const handleOpenDetails = (id: string) => {
    setSelectedTenantId(id);
    setView('details');
  };

  
  const handleDetailsBack = () => {
    setSelectedTenantId(null);
    setView('list');
  };

  
  const handleDetailsDeleted = () => {
    if (selectedTenantId) {
      setTenants((prev) => prev.filter((t) => t.id !== selectedTenantId));
    }
    setSelectedTenantId(null);
    setView('list');
  };

  
  if (view === 'add') {
    return (
      <AddTenantPage
        initialData={draft.entityName || draft.planId || draft.tenantType ? draft : undefined}
        onCancel={handleCancel}
        onNext={handleFormNext}
      />
    );
  }

  if (view === 'review') {
    return (
      <>
        <ReviewTenantPage
          formData={draft}
          onConfirm={() => {
            void handleConfirm();
          }}
          onBack={handleReviewBack}
          onCancel={handleCancel}
        />
        {(confirmError || confirming) && (
          <p style={{ textAlign: 'center', color: confirmError ? '#b91c1c' : '#666', marginTop: 8 }}>
            {confirming ? 'جاري الحفظ...' : confirmError}
          </p>
        )}
      </>
    );
  }

  if (view === 'details' && selectedTenantId) {
    return (
      <TenantDetailsPage
        tenantId={selectedTenantId}
        onBack={handleDetailsBack}
        onDeleted={handleDetailsDeleted}
      />
    );
  }

  
  return (
    <div className="dashboard-page">
      <PageHeader
        title="إدارة المستأجرين"
        subtitle="جميع الجهات المسجلة على منصة track+"
      />

      <div className="tenants-body" dir="rtl">
        <button type="button" className="tenants-add-btn" onClick={() => setView('add')}>
          <Plus size={16} strokeWidth={2.5} />
          إضافة مستأجر جديد
        </button>

        <div className="dashboard-grid tenants-stats-grid">
          <ResponsiveGrid
            className="dashboard-grid__layout"
            layout={statsLayout}
            cols={12}
            rowHeight={54}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            onLayoutChange={handleStatsLayoutChange}
            compactType={null}
            useCSSTransforms
          >
            {(Object.keys(statCards) as StatId[]).map((id) => (
              <div key={id} className="dashboard-grid__item">
                <div
                  dir="rtl"
                  className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
                >
                  <StatCard {...statCards[id]} />
                </div>
              </div>
            ))}
          </ResponsiveGrid>
        </div>

        <div className="tenants-toolbar-row">
          <div className="tenants-search">
            <Search size={16} strokeWidth={2.5} className="tenants-search__icon" />
            <input
              type="search"
              placeholder="البحث"
              aria-label="بحث"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="tenants-filter-tabs">
            {typeFilterTabs.map((tab) => {
              const count =
                tab.id === 'all'
                  ? tenants.length
                  : tenants.filter((tenant) => tenant.tenantType === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tenants-filter-tab ${
                    activeFilter === tab.id ? 'tenants-filter-tab--active' : ''
                  }`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="dashboard-grid tenants-table-grid">
          <ResponsiveGrid
            className="dashboard-grid__layout"
            layout={tableLayout}
            cols={12}
            rowHeight={54}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={false}
            isResizable={isEditMode}
            resizeHandles={['s', 'w', 'e', 'sw', 'se']}
            onLayoutChange={handleTableLayoutChange}
            compactType={null}
            useCSSTransforms
          >
            <div key="table" className="dashboard-grid__item">
              <div
                dir="rtl"
                className={`widget-wrapper ${isEditMode ? 'widget-wrapper--edit' : ''}`}
              >
                <Card className="tenants-table-card">
                  <div className="tenants-table">
                    <div className="tenants-table__row tenants-table__row--head">
                      <span className="tenants-table__cell tenants-table__cell--name">الجهة</span>
                      <span className="tenants-table__cell">نوع المستأجر</span>
                      <span className="tenants-table__cell">الحالة</span>
                      <span className="tenants-table__cell">الباقة</span>
                      <span className="tenants-table__cell">المستخدمون</span>
                      <span className="tenants-table__cell">تاريخ الانتهاء</span>
                      <span className="tenants-table__cell tenants-table__cell--nav" aria-hidden />
                    </div>

                    <div className="tenants-table__body">
                      {visibleTenants.map((tenant) => (
                        <div className="tenants-table__row" key={tenant.id}>
                          <span className="tenants-table__cell tenants-table__cell--name">
                            {tenant.name}
                          </span>
                          <span className="tenants-table__cell">{tenant.typeLabel || '—'}</span>
                          <span className="tenants-table__cell">
                            <Badge
                              variant={statusVariant[tenant.status]}
                              icon={<span className="tenants-status-dot" />}
                            >
                              {tenant.statusLabel}
                            </Badge>
                          </span>
                          <span className="tenants-table__cell">{tenant.plan}</span>
                          <span className="tenants-table__cell">{tenant.users}</span>
                          <span className="tenants-table__cell">{tenant.expiresAt}</span>
                          <span className="tenants-table__cell tenants-table__cell--nav">
                            <button
                              type="button"
                              className="tenants-table__nav-btn"
                              aria-label="عرض التفاصيل"
                              onClick={() => handleOpenDetails(tenant.id)}
                            >
                              <ChevronLeft size={14} />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </ResponsiveGrid>
        </div>
      </div>
      {createdCredentials ? (
        <CredentialsModal
          name={createdCredentials.name}
          email={createdCredentials.email}
          temporaryPassword={createdCredentials.temporaryPassword}
          onClose={() => setCreatedCredentials(null)}
        />
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CredentialsModal } from '../../../components/settings/CredentialsModal';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { Card } from '../ui/Card';
import {
  AppliedTags,
  DateRangeFilter,
  dateRangeLabel,
  matchesDateRange,
  MultiSelectFilter,
  PageState,
  Pagination,
  StatusChips,
  type DateRangeValue,
} from '../ui/filters';
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
import { isTenantType } from '../../lib/tenantTypes';
import { dashboardDataAssets } from '@/assets';
import { AssetIcon } from '../../../components/ui/AssetIcon';
import {
  type TenantRow,
  type TenantRowStatus,
} from '../../data/tenantsPage';
import '../layout/layout.css';
import '../dashboard/dashboard.css';
import './tenants.css';

const PAGE_SIZE = 8;
const PLAN_ORDER = ['Enterprise', 'Premium', 'Basic', 'Demo', 'Free'];

const plural = (count: number, one: string, many: string) => (count > 2 && count <= 10 ? many : one);

const statusVariant: Record<TenantRowStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
  pending: 'info',
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

type StatusFilter = 'all' | TenantRowStatus;

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
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; temporaryPassword: string; emailSent?: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const contextTenants = useTenants();
  const { addTenant, refreshTenants, loading, loadFailed } = useTenantMutations();
  const [tenants, setTenants] = useState<TenantRow[]>([]);

  useEffect(() => {
    setTenants(contextTenants.map(tenantToRow));
  }, [contextTenants]);

  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [planFilter, setPlanFilter] = useState<string[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<DateRangeValue>({ kind: 'any' });
  const [page, setPage] = useState(1);

  const query = search.trim().toLowerCase();
  const matchesSearchAndMenus = (tenant: TenantRow) =>
    (!query || tenant.name.toLowerCase().includes(query) || tenant.domain?.toLowerCase().includes(query)) &&
    (planFilter.length === 0 || planFilter.includes(tenant.plan)) &&
    matchesDateRange(tenant.expiresAt, expiryFilter);
  const visibleTenants = tenants.filter(
    (tenant) => matchesSearchAndMenus(tenant) && (statusFilter === 'all' || tenant.status === statusFilter),
  );
  const pageCount = Math.max(1, Math.ceil(visibleTenants.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTenants = visibleTenants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const planOptions = useMemo(
    () =>
      PLAN_ORDER.map((plan) => ({
        value: plan,
        label: plan,
        count: tenants.filter((tenant) => tenant.plan === plan).length,
      })),
    [tenants],
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPlanFilter([]);
    setExpiryFilter({ kind: 'any' });
    setPage(1);
  };

  // Global search links here with ?id=org-<id>; open that tenant directly.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (id && tenants.some((tenant) => tenant.id === id)) {
      setSelectedTenantId(id);
      setView('details');
    }
  }, [location.search, tenants]);

  
  
  
  
  
  const summary = {
    total:     tenants.length,
    active:    tenants.filter((t) => t.status === 'active').length,
    trial:     tenants.filter((t) => t.status === 'trial').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
    pending:   tenants.filter((t) => t.status === 'pending').length,
  };

  const statCards: Array<StatCardProps & { id: string }> = [
    { id: 'total', iconSrc: dashboardDataAssets.totalTenants, label: 'إجمالي المستأجرين', value: summary.total, unit: plural(summary.total, 'مستأجرًا', 'مستأجرين') },
    { id: 'active', iconSrc: dashboardDataAssets.active, label: 'نشط', value: summary.active, unit: plural(summary.active, 'مستأجرًا', 'مستأجرين') },
    { id: 'trial', iconSrc: dashboardDataAssets.trial, label: 'تجربة مجانية', value: summary.trial, unit: plural(summary.trial, 'تجربة', 'تجارب') },
    { id: 'suspended', iconSrc: dashboardDataAssets.suspended, label: 'معلّق', value: summary.suspended, unit: 'مستأجر' },
  ];

  const statusChips: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'الكل', count: summary.total },
    { id: 'active', label: 'نشط', count: summary.active },
    { id: 'trial', label: 'تجربة', count: summary.trial },
    { id: 'suspended', label: 'معلّق', count: summary.suspended },
    { id: 'pending', label: 'بانتظار التفعيل', count: summary.pending },
  ];

  const appliedTags = [
    ...(statusFilter === 'all'
      ? []
      : [{
          key: 'status',
          label: `الحالة: ${statusChips.find((chip) => chip.id === statusFilter)?.label}`,
          onRemove: () => setStatusFilter('all'),
        }]),
    ...planFilter.map((plan) => ({
      key: plan,
      label: `الباقة: ${plan}`,
      onRemove: () => setPlanFilter((current) => current.filter((item) => item !== plan)),
    })),
    ...(expiryFilter.kind === 'any'
      ? []
      : [{
          key: 'expiry',
          label: `تاريخ الانتهاء: ${dateRangeLabel(expiryFilter)}`,
          onRemove: () => setExpiryFilter({ kind: 'any' }),
        }]),
  ];

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
          emailSent: created.emailSent,
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

        {loadFailed && tenants.length === 0 ? (
          <PageState
            tone="error"
            title="تعذّر تحميل قائمة المستأجرين"
            body="حدث خطأ في الاتصال بالخادم. أعد المحاولة بعد قليل."
            actionLabel="إعادة المحاولة"
            onAction={() => void refreshTenants()}
          />
        ) : !loading && tenants.length === 0 ? (
          <PageState
            title="لا يوجد مستأجرون بعد"
            body="أضف أول جهة لتبدأ إدارة الاشتراكات والمستخدمين والباقات."
            actionLabel="إضافة مستأجر جديد"
            onAction={() => setView('add')}
          />
        ) : (
          <>
            <div className="tenants-stats">
              {statCards.map(({ id, ...card }) => (
                <StatCard key={id} {...card} />
              ))}
            </div>

            <div className="tenants-toolbar-row">
              <div className="tenants-search">
                <Search size={16} strokeWidth={2.5} className="tenants-search__icon" />
                <input
                  type="search"
                  placeholder="ابحث باسم الجهة أو النطاق"
                  aria-label="بحث"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <MultiSelectFilter
                label="الباقة"
                options={planOptions}
                selected={planFilter}
                onApply={(values) => {
                  setPlanFilter(values);
                  setPage(1);
                }}
              />
              <DateRangeFilter
                label="تاريخ الانتهاء"
                value={expiryFilter}
                onApply={(value) => {
                  setExpiryFilter(value);
                  setPage(1);
                }}
              />
            </div>

            <div className="tenants-chips-row">
              <StatusChips
                chips={statusChips}
                active={statusFilter}
                onChange={(id) => {
                  setStatusFilter(id);
                  setPage(1);
                }}
              />
              <span className="tenants-result-count">
                عرض {pageTenants.length} من {tenants.length} {plural(tenants.length, 'مستأجرًا', 'مستأجرين')}
              </span>
            </div>

            <AppliedTags tags={appliedTags} onClearAll={clearFilters} />

            {!loading && visibleTenants.length === 0 ? (
              <PageState
                title="لا توجد نتائج مطابقة"
                body={
                  query
                    ? `لم نجد مستأجرًا يطابق «${search.trim()}» مع الفلاتر الحالية. جرّب اسمًا آخر أو امسح البحث.`
                    : 'لم نجد مستأجرًا يطابق الفلاتر الحالية.'
                }
                actionLabel="مسح البحث والفلاتر"
                onAction={clearFilters}
              />
            ) : (
              <Card className="tenants-table-card">
                <div className="tenants-table">
                  <div className="tenants-table__row tenants-table__row--head">
                    <span className="tenants-table__cell tenants-table__cell--name">الجهة</span>
                    <span className="tenants-table__cell">الحالة</span>
                    <span className="tenants-table__cell">الباقة</span>
                    <span className="tenants-table__cell">المستخدمون</span>
                    <span className="tenants-table__cell">تاريخ الانتهاء</span>
                    <span className="tenants-table__cell tenants-table__cell--nav" aria-hidden />
                  </div>
                  {loading && tenants.length === 0
                    ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                        <div className="tenants-table__row" key={index}>
                          {Array.from({ length: 5 }, (__, cell) => (
                            <span className="tenants-table__cell" key={cell}>
                              <span className="tenants-skeleton" />
                            </span>
                          ))}
                          <span />
                        </div>
                      ))
                    : pageTenants.map((tenant) => (
                        <div
                          className="tenants-table__row tenants-table__row--link"
                          key={tenant.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenDetails(tenant.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleOpenDetails(tenant.id);
                          }}
                        >
                          <span className="tenants-table__cell tenants-table__cell--name">{tenant.name}</span>
                          <span className="tenants-table__cell">
                            <Badge variant={statusVariant[tenant.status]} icon={<span className="tenants-status-dot" />}>
                              {tenant.statusLabel}
                            </Badge>
                          </span>
                          <span className="tenants-table__cell">{tenant.plan}</span>
                          <span className="tenants-table__cell">
                            {tenant.userLimit ? `${tenant.users} من ${tenant.userLimit}` : tenant.users}
                          </span>
                          <span className="tenants-table__cell">{tenant.expiresAt}</span>
                          <span className="tenants-table__cell tenants-table__cell--nav">
                            <ChevronLeft size={20} aria-hidden />
                          </span>
                        </div>
                      ))}
                </div>
                <Pagination page={currentPage} pageSize={PAGE_SIZE} total={visibleTenants.length} onChange={setPage} />
              </Card>
            )}
          </>
        )}
      </div>
      {createdCredentials ? (
        <CredentialsModal
          name={createdCredentials.name}
          email={createdCredentials.email}
          temporaryPassword={createdCredentials.temporaryPassword}
          emailSent={createdCredentials.emailSent}
          onClose={() => setCreatedCredentials(null)}
        />
      ) : null}
    </div>
  );
}

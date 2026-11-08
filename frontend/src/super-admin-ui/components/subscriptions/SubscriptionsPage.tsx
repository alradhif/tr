import { useEffect, useState } from 'react';
import { getPlatformUsers } from '../../../api/superAdmin';
import { getSuperAdminToken } from '../../../auth/superAdminAuth';
import { useTenants } from '../../context/TenantContext';
import { ChevronLeft, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AddPackagePage, type NewPackageData } from './AddPackagePage';
import { PackageDetailsPage } from './PackageDetailsPage';
import {
  usePackages,
  usePackageMutations,
  type Package as PackageModel,
} from '../../context/PackageContext';
import { PageHeader } from '../layout/PageHeader';
import { dashboardDataAssets } from '@/assets';
import { AssetIcon } from '../../../components/ui/AssetIcon';
import '../layout/layout.css';
import '../dashboard/dashboard.css';
import '../tenants/tenants.css';
import './subscriptions.css';

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
        <span className="widget-icon-badge widget-icon-badge--lg">
          <AssetIcon src={iconSrc} size={17} />
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

function buildStatCards(packages: PackageModel[], totalUsers: number, activeTenants: number): StatCardProps[] {
  const activeCount = packages.filter((pkg) => pkg.status === 'active').length;
  return [
    {
      iconSrc: dashboardDataAssets.totalPackages,
      label: 'إجمالي الباقات',
      value: packages.length,
      unit: 'باقات',
    },
    {
      iconSrc: dashboardDataAssets.active,
      label: 'الباقات المفعلة',
      value: activeCount,
      unit: 'باقات مفعلة',
    },
    {
      iconSrc: dashboardDataAssets.totalUsers,
      label: 'إجمالي المستخدمين',
      value: totalUsers,
      unit: 'مستخدمًا',
    },
    {
      iconSrc: dashboardDataAssets.activeEntities,
      label: 'الجهات النشطة',
      value: activeTenants,
      unit: 'جهات',
    },
  ];
}

type SubscriptionsView = 'list' | 'add' | 'details' | 'edit';

function formatStorageValue(storage: string): string {
  return storage.match(/\d+(\.\d+)?/)?.[0] ?? storage;
}

export function SubscriptionsPage() {
  const packages = usePackages();
  const { addPackage, updatePackage, deletePackage } = usePackageMutations();
  const tenants = useTenants();
  const [totalUsers, setTotalUsers] = useState(0);
  useEffect(() => {
    const token = getSuperAdminToken();
    if (!token) return;
    getPlatformUsers(token)
      .then((data) => setTotalUsers(data.count))
      .catch(() => setTotalUsers(0));
  }, []);

  const [view, setView] = useState<SubscriptionsView>('list');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const openPackage = (id: string) => {
    setSelectedPackageId(id);
    setView('details');
  };

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

  
  const toInput = (data: NewPackageData) => ({
    label: data.name,
    packageType: data.planType,
    billingCycle: (data.period === 'شهري' ? 'MONTHLY' : 'YEARLY') as 'MONTHLY' | 'YEARLY',
    storageGb: data.storageLimit ? Number(data.storageLimit) : undefined,
    maxUsers: Number(data.userLimit) || undefined,
    price: data.price !== '' ? Number(data.price) : undefined,
    features: data.permissions,
    isActive: data.isActive,
  });

  const handleSavePackage = async (data: NewPackageData) => {
    await addPackage(toInput(data));
    setView('list');
  };

  const handleUpdatePackage = async (data: NewPackageData) => {
    if (!selectedPackageId) return;
    await updatePackage(selectedPackageId, toInput(data));
    setView('details');
  };

  const handleDeletePackage = async () => {
    if (!selectedPackageId) return;
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الباقة؟');
    if (!confirmed) return;
    try {
      await deletePackage(selectedPackageId);
      setSelectedPackageId(null);
      setView('list');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر حذف الباقة');
    }
  };

  
  if (view === 'add') {
    return <AddPackagePage onCancel={() => setView('list')} onSave={handleSavePackage} />;
  }

  if (view === 'details' && selectedPackage) {
    return (
      <PackageDetailsPage
        pkg={selectedPackage}
        onBack={() => {
          setSelectedPackageId(null);
          setView('list');
        }}
        onEdit={() => setView('edit')}
        onDelete={() => void handleDeletePackage()}
      />
    );
  }

  if (view === 'edit' && selectedPackage) {
    return (
      <AddPackagePage
        mode="edit"
        initialData={{
          name: selectedPackage.name,
          isActive: selectedPackage.status === 'active',
          planType: selectedPackage.packageType,
          userLimit: String(selectedPackage.userLimit),
          storageLimit: selectedPackage.storage,
          period: selectedPackage.duration,
          price: String(selectedPackage.priceValue),
          permissions: selectedPackage.permissions
            .filter((p) => p.granted)
            .map((p) => p.name),
        }}
        onCancel={() => setView('details')}
        onSave={handleUpdatePackage}
      />
    );
  }

  const statCards = buildStatCards(packages, totalUsers, tenants.filter((tenant) => tenant.status === 'active').length);

  return (
    <div className="dashboard-page">
      <PageHeader title="الاشتراكات والباقات" />

      <div className="tenants-body" dir="rtl">
        <div className="subscriptions-title-row">
          <h1 className="subscriptions-title">الاشتراكات والباقات</h1>
          <button type="button" className="tenants-add-btn" onClick={() => setView('add')}>
            <Plus size={16} strokeWidth={2.5} />
            إضافة باقة
          </button>
        </div>

        <div className="subscriptions-stats-row">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <Card className="tenants-table-card">
          <div className="tenants-table subscriptions-table">
            <div className="tenants-table__row tenants-table__row--head subscriptions-table__row">
              <span className="tenants-table__cell tenants-table__cell--name">اسم الباقة</span>
              <span className="tenants-table__cell">السعر</span>
              <span className="tenants-table__cell">المدة</span>
              <span className="tenants-table__cell">مساحة التخزين</span>
              <span className="tenants-table__cell">عدد المستخدمين</span>
              <span className="tenants-table__cell">الحالة</span>
              <span className="tenants-table__cell">عدد المستأجرين</span>
              <span className="tenants-table__cell tenants-table__cell--nav" aria-hidden />
            </div>

            <div className="tenants-table__body">
              {packages.map((pkg) => (
                <div
                  className="tenants-table__row tenants-table__row--link subscriptions-table__row"
                  key={pkg.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPackage(pkg.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') openPackage(pkg.id);
                  }}
                >
                  <span className="tenants-table__cell tenants-table__cell--name">
                    {pkg.name}
                  </span>
                  <span className="tenants-table__cell">{pkg.price}</span>
                  <span className="tenants-table__cell">{pkg.duration}</span>
                  <span className="tenants-table__cell">GB {formatStorageValue(pkg.storage)}</span>
                  <span className="tenants-table__cell">
                    حتى {pkg.userLimit} {pkg.userLimit > 2 && pkg.userLimit <= 10 ? 'مستخدمين' : 'مستخدمًا'}
                  </span>
                  <span className="tenants-table__cell">
                    <Badge
                      variant={pkg.status === 'active' ? 'success' : 'danger'}
                      icon={<span className="tenants-status-dot" />}
                    >
                      {pkg.statusLabel}
                    </Badge>
                  </span>
                  <span className="tenants-table__cell">{pkg.tenants}</span>
                  <span className="tenants-table__cell tenants-table__cell--nav">
                    <ChevronLeft size={20} aria-hidden />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

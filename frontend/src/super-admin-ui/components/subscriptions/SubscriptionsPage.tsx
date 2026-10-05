import { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AddPackagePage, PERMISSION_OPTIONS, type NewPackageData } from './AddPackagePage';
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

function buildStatCards(packages: PackageModel[]): StatCardProps[] {
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
      value: 140,
      unit: 'مستخدم',
    },
    {
      iconSrc: dashboardDataAssets.activeEntities,
      label: 'الجهات النشطة',
      value: 30,
      unit: 'جهة',
    },
  ];
}

type SubscriptionsView = 'list' | 'add' | 'details' | 'edit';

function formatPrice(priceValue: number, duration: string): string {
  const periodLabel = duration === 'شهري' ? 'شهر' : 'سنة';
  return `${priceValue.toLocaleString('en-US')} ر.س / ${periodLabel}`;
}

function formatStorageValue(storage: string): string {
  return storage.match(/\d+(\.\d+)?/)?.[0] ?? storage;
}

export function SubscriptionsPage() {
  const packages = usePackages();
  const { addPackage, updatePackage, deletePackage } = usePackageMutations();

  const [view, setView] = useState<SubscriptionsView>('list');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

  
  const handleSavePackage = (data: NewPackageData) => {
    const duration = (data.period || 'سنوي') as PackageModel['duration'];
    const priceValue = Number(data.price) || 0;
    const newPkg: PackageModel = {
      id: `pkg-${Date.now()}`,
      name: data.planType,
      price: formatPrice(priceValue, duration),
      priceValue,
      duration,
      storage: data.storageLimit ? `${data.storageLimit} GB` : 'غير محدد',
      users: Number(data.userLimit) || 0,
      status: 'active',
      statusLabel: 'مفعلة',
      tenants: 0,
      userLimit: Number(data.userLimit) || 0,
      packageType: data.planType,
      permissions: PERMISSION_OPTIONS.map((name) => ({
        name,
        granted: data.permissions.includes(name),
      })),
    };
    addPackage(newPkg);
    setView('list');
  };

  
  const handleUpdatePackage = (data: NewPackageData) => {
    if (!selectedPackageId || !selectedPackage) return;
    const duration = (data.period || selectedPackage.duration) as PackageModel['duration'];
    const priceValue =
      data.price !== '' ? Number(data.price) || selectedPackage.priceValue : selectedPackage.priceValue;
    updatePackage(selectedPackageId, {
      name: data.planType,
      price: formatPrice(priceValue, duration),
      priceValue,
      duration,
      storage: data.storageLimit ? `${data.storageLimit} GB` : selectedPackage.storage,
      users: Number(data.userLimit) || selectedPackage.users,
      userLimit: Number(data.userLimit) || selectedPackage.userLimit,
      packageType: data.planType,
      permissions: PERMISSION_OPTIONS.map((name) => ({
        name,
        granted: data.permissions.includes(name),
      })),
    });
    setView('details');
  };

  
  const handleDeletePackage = () => {
    if (!selectedPackageId) return;
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الباقة؟');
    if (!confirmed) return;
    deletePackage(selectedPackageId);
    setSelectedPackageId(null);
    setView('list');
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
        onDelete={handleDeletePackage}
      />
    );
  }

  if (view === 'edit' && selectedPackage) {
    return (
      <AddPackagePage
        mode="edit"
        initialData={{
          planType: selectedPackage.name,
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

  const statCards = buildStatCards(packages);

  return (
    <div className="dashboard-page">
      <PageHeader
        title="الاشتراكات والباقات"
        subtitle="إدارة باقات الاشتراك وصلاحياتها"
      />

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
              <span className="tenants-table__cell">مساحة التخزين (GB)</span>
              <span className="tenants-table__cell">عدد المستخدمين</span>
              <span className="tenants-table__cell">الحالة</span>
              <span className="tenants-table__cell">عدد المستأجرين</span>
              <span className="tenants-table__cell tenants-table__cell--nav" aria-hidden />
            </div>

            <div className="tenants-table__body">
              {packages.map((pkg) => (
                <div className="tenants-table__row subscriptions-table__row" key={pkg.id}>
                  <span className="tenants-table__cell tenants-table__cell--name">
                    {pkg.name}
                  </span>
                  <span className="tenants-table__cell">{pkg.price}</span>
                  <span className="tenants-table__cell">{pkg.duration}</span>
                  <span className="tenants-table__cell">{formatStorageValue(pkg.storage)}</span>
                  <span className="tenants-table__cell">{pkg.users}</span>
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
                    <button
                      type="button"
                      className="tenants-table__nav-btn"
                      aria-label="عرض التفاصيل"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setView('details');
                      }}
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
  );
}

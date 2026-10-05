import {
  Box,
  CheckCircle2,
  FileText,
  HardDrive,
  Pencil,
  ShieldCheck,
  Tag,
  Target,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { PageHeader } from '../layout/PageHeader';
import './package-details.css';

interface PackagePermission {
  name: string;
  granted: boolean;
}

export interface PackageDetailsData {
  id: string;
  name: string;
  priceValue: number;
  duration: string;
  storage: string;
  users: number;
  status: 'active' | 'inactive';
  statusLabel: string;
  userLimit: number;
  packageType: string;
  permissions: PackagePermission[];
}

interface PackageDetailsPageProps {
  pkg: PackageDetailsData;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface DataCellProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function DataCell({ icon, label, value }: DataCellProps) {
  return (
    <div className="package-data-cell">
      <div className="package-data-cell__label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="package-data-cell__value">{value}</div>
    </div>
  );
}

export function PackageDetailsPage({ pkg, onBack, onEdit, onDelete }: PackageDetailsPageProps) {
  return (
    <div className="dashboard-page">
      <PageHeader
        title={`باقة ${pkg.name}`}
        breadcrumbs={[{ label: 'الاشتراكات والباقات', onClick: onBack }]}
      />

      <div className="tenant-form-body" dir="rtl">
        <div className="package-details-title-row">
          <h1 className="package-form-title package-form-title--tight">باقة {pkg.name}</h1>
          <div className="package-details-actions">
            <button type="button" className="package-details-btn package-details-btn--edit" onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.25} />
              تعديل الباقة
            </button>
            <button
              type="button"
              className="package-details-btn package-details-btn--delete"
              onClick={onDelete}
            >
              <Trash2 size={15} strokeWidth={2.25} />
              حذف الباقة
            </button>
          </div>
        </div>

        {}
        <Card className="package-details-card">
          {}
          <div className="package-details-card__header">
            <div className="package-details-card__heading">
              <span className="package-details-icon-badge">
                <FileText size={16} />
              </span>
              <h2>الباقة الاساسية</h2>
              {}
              <span
                className={`package-status-pill${
                  pkg.status === 'active' ? ' package-status-pill--active' : ' package-status-pill--inactive'
                }`}
              >
                <CheckCircle2 size={12} strokeWidth={2.5} />
                {pkg.statusLabel}
              </span>
            </div>
          </div>

          {}
          <div className="package-data-grid package-data-grid--full">
            <DataCell icon={<Tag size={16} />} label="السعر" value={pkg.priceValue} />
            <DataCell icon={<Target size={16} />} label="المدة" value={pkg.duration} />
            <DataCell icon={<Users size={16} />} label="عدد المستخدمين" value={pkg.users} />
          </div>

          {}
          <div className="package-data-row-divider" />

          {}
          <div className="package-data-grid package-data-grid--full">
            <DataCell icon={<CheckCircle2 size={16} />} label="حد المستخدمين" value={pkg.userLimit} />
            <DataCell icon={<HardDrive size={16} />} label="حد التخزين" value={pkg.storage} />
            <DataCell icon={<Box size={16} />} label="نوع الباقة" value={pkg.packageType} />
          </div>
        </Card>

        {}
        <Card className="package-details-card">
          <div className="package-details-card__header">
            <div className="package-details-card__heading">
              <span className="package-details-icon-badge">
                <ShieldCheck size={16} />
              </span>
              <h2>الصلاحيات المرتبطة</h2>
            </div>
          </div>

          <div className="package-permissions-view-list">
            {pkg.permissions.map((permission) => (
              <div className="package-permission-view-row" key={permission.name}>
                {permission.granted ? (
                  
                  <CheckCircle2
                    size={18}
                    className="package-permission-view-row__icon--granted"
                  />
                ) : (
                  
                  <XCircle
                    size={18}
                    className="package-permission-view-row__icon--denied"
                  />
                )}
                <span>{permission.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

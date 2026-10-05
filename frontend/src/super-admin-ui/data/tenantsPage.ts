export const tenantsSummary = {
  total: 12,
  active: 10,
  trial: 4,
  suspended: 3,
};

export type TenantRowStatus = 'active' | 'trial' | 'suspended';

export interface TenantRow {
  id: string;
  name: string;
  tenantType?: 'ORG' | 'CLIENT' | 'JODAYN';
  typeLabel?: string;
  status: TenantRowStatus;
  statusLabel: string;
  plan: string;
  users: number;
  expiresAt: string;
}

export const tenantsList: TenantRow[] = [
  {
    id: '1',
    name: 'جودين',
    status: 'active',
    statusLabel: 'نشط',
    plan: 'Enterprise',
    users: 4,
    expiresAt: '2027-03-12',
  },
  {
    id: '2',
    name: 'وزارة الموارد البشرية',
    status: 'active',
    statusLabel: 'نشط',
    plan: 'Enterprise',
    users: 2,
    expiresAt: '2027-03-12',
  },
  {
    id: '3',
    name: 'شركة تطوير',
    status: 'trial',
    statusLabel: 'تجربة',
    plan: 'Demo',
    users: 6,
    expiresAt: '2027-03-12',
  },
  {
    id: '4',
    name: 'جامعة حائل',
    status: 'suspended',
    statusLabel: 'معلق',
    plan: 'Enterprise',
    users: 2,
    expiresAt: '2027-03-12',
  },
];

export type TenantFilterId = 'overdue' | 'on-track' | 'all';

export interface TenantFilterTab {
  id: TenantFilterId;
  label: string;
  count: number;
}

export const tenantFilterTabs: TenantFilterTab[] = [
  { id: 'all', label: 'الكل', count: 5 },
  { id: 'on-track', label: 'على المسار', count: 2 },
  { id: 'overdue', label: 'متأخر', count: 2 },
];

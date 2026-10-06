

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createPackage,
  deletePackage as deletePackageApi,
  getAllPackages,
  updatePackage as updatePackageApi,
  type PackageInput,
  type PlatformPackage,
} from '../../api/superAdmin';
import { getSuperAdminToken } from '../../auth/superAdminAuth';

export interface PackagePermission {
  name: string;
  granted: boolean;
}

export type PackageDuration = 'شهري' | 'سنوي';

export interface Package {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  
  duration: PackageDuration;
  storage: string;
  users: number;
  status: 'active' | 'inactive';
  statusLabel: string;
  tenants: number;
  userLimit: number;
  packageType: string;
  permissions: PackagePermission[];
}

export const PERMISSION_NAMES = ['إدارة الحسابات', 'تصدير البيانات', 'إدارة الفوترة'];

function toUiPackage(pkg: PlatformPackage): Package {
  const duration: PackageDuration = pkg.billingCycle === 'MONTHLY' ? 'شهري' : 'سنوي';
  const priceValue = Number(pkg.price) || 0;
  const features = Array.isArray(pkg.features) ? pkg.features : [];
  const active = pkg.isActive !== false;
  return {
    id: pkg.id,
    name: pkg.label || pkg.name,
    price: `${priceValue.toLocaleString('en-US')} ر.س / ${duration === 'شهري' ? 'شهر' : 'سنة'}`,
    priceValue,
    duration,
    storage: `${pkg.storageGb ?? 0} GB`,
    users: pkg.maxUsers,
    status: active ? 'active' : 'inactive',
    statusLabel: active ? 'مفعلة' : 'غير مفعلة',
    tenants: pkg.tenants ?? 0,
    userLimit: pkg.maxUsers,
    packageType: pkg.packageType || '—',
    permissions: PERMISSION_NAMES.map((name) => ({ name, granted: features.includes(name) })),
  };
}

interface PackageContextValue {
  packages: Package[];
  loading: boolean;
  error: string | null;
  refreshPackages: () => Promise<void>;
  addPackage: (data: PackageInput) => Promise<Package>;
  updatePackage: (id: string, data: PackageInput) => Promise<Package>;
  deletePackage: (id: string) => Promise<void>;
  getPackageById: (id: string) => Package | undefined;
}

const PackageContext = createContext<PackageContextValue | null>(null);

function requireToken() {
  const token = getSuperAdminToken();
  if (!token) throw new Error('يجب تسجيل الدخول أولاً');
  return token;
}

export function PackageProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPackages = useCallback(async () => {
    const token = getSuperAdminToken();
    if (!token) {
      setPackages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAllPackages(token);
      setPackages(data.packages.map(toUiPackage));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الباقات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPackages();
  }, [refreshPackages]);

  const addPackage = useCallback(async (data: PackageInput) => {
    const result = await createPackage(requireToken(), data);
    const pkg = toUiPackage(result.package);
    setPackages((prev) => [...prev, pkg]);
    return pkg;
  }, []);

  const updatePackage = useCallback(async (id: string, data: PackageInput) => {
    const result = await updatePackageApi(requireToken(), id, data);
    const pkg = toUiPackage(result.package);
    setPackages((prev) => prev.map((item) => (item.id === id ? pkg : item)));
    return pkg;
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    await deletePackageApi(requireToken(), id);
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  }, []);

  const getPackageById = useCallback(
    (id: string) => packages.find((pkg) => pkg.id === id),
    [packages],
  );

  return (
    <PackageContext.Provider
      value={{ packages, loading, error, refreshPackages, addPackage, updatePackage, deletePackage, getPackageById }}
    >
      {children}
    </PackageContext.Provider>
  );
}

export function usePackages(): Package[] {
  const ctx = useContext(PackageContext);
  if (!ctx) throw new Error('usePackages must be used inside <PackageProvider>');
  return ctx.packages;
}

export function usePackageMutations() {
  const ctx = useContext(PackageContext);
  if (!ctx) throw new Error('usePackageMutations must be used inside <PackageProvider>');
  const { addPackage, updatePackage, deletePackage, getPackageById, refreshPackages, loading, error } = ctx;
  return { addPackage, updatePackage, deletePackage, getPackageById, refreshPackages, loading, error };
}

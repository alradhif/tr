

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

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

const SEED_PACKAGES: Package[] = [
  {
    id: 'pkg-free',
    name: 'Free',
    price: '0 ر.س / سنة',
    priceValue: 0,
    duration: 'سنوي',
    storage: '5 جيجابايت',
    users: 5,
    status: 'active',
    statusLabel: 'مفعلة',
    tenants: 15,
    userLimit: 5,
    packageType: 'Basic',
    permissions: [
      { name: 'إدارة الحسابات', granted: true },
      { name: 'تصدير البيانات', granted: false },
      { name: 'إدارة الفوترة', granted: false },
    ],
  },
  {
    id: 'pkg-demo',
    name: 'Demo',
    price: '0 ر.س / سنة',
    priceValue: 0,
    duration: 'سنوي',
    storage: '10 جيجابايت',
    users: 10,
    status: 'active',
    statusLabel: 'مفعلة',
    tenants: 8,
    userLimit: 10,
    packageType: 'Basic',
    permissions: [
      { name: 'إدارة الحسابات', granted: true },
      { name: 'تصدير البيانات', granted: true },
      { name: 'إدارة الفوترة', granted: false },
    ],
  },
  {
    id: 'pkg-basic',
    name: 'Basic',
    price: '999 ر.س / سنة',
    priceValue: 999,
    duration: 'سنوي',
    storage: '50 جيجابايت',
    users: 20,
    status: 'active',
    statusLabel: 'مفعلة',
    tenants: 6,
    userLimit: 15,
    packageType: 'Business',
    permissions: [
      { name: 'إدارة الحسابات', granted: true },
      { name: 'تصدير البيانات', granted: true },
      { name: 'إدارة الفوترة', granted: false },
    ],
  },
  {
    id: 'pkg-premium',
    name: 'Premium',
    price: '4000 ر.س / شهر',
    priceValue: 4000,
    duration: 'شهري',
    storage: '50 GB',
    users: 100,
    status: 'active',
    statusLabel: 'مفعلة',
    tenants: 1,
    userLimit: 6,
    packageType: 'Enterprise',
    permissions: [
      { name: 'إدارة الحسابات', granted: true },
      { name: 'تصدير البيانات', granted: true },
      { name: 'إدارة الفوترة', granted: false },
    ],
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise',
    price: '7,999 ر.س / سنة',
    priceValue: 7999,
    duration: 'سنوي',
    storage: '1 تيرابايت',
    users: 250,
    status: 'inactive',
    statusLabel: 'غير مفعلة',
    tenants: 0,
    userLimit: 250,
    packageType: 'Enterprise',
    permissions: [
      { name: 'إدارة الحسابات', granted: true },
      { name: 'تصدير البيانات', granted: true },
      { name: 'إدارة الفوترة', granted: true },
    ],
  },
];

const STORAGE_KEY = 'trackplus_packages_v1';

function loadFromStorage(): Package[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_PACKAGES;
    const parsed = JSON.parse(raw) as Package[];
    
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    
  }
  return SEED_PACKAGES;
}

function saveToStorage(packages: Package[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
  } catch {
    
  }
}

interface PackageContextValue {
  packages: Package[];
  addPackage: (pkg: Package) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  getPackageById: (id: string) => Package | undefined;
}

const PackageContext = createContext<PackageContextValue | null>(null);

export function PackageProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<Package[]>(loadFromStorage);

  
  useEffect(() => {
    saveToStorage(packages);
  }, [packages]);

  const addPackage = useCallback((pkg: Package) => {
    setPackages((prev) => [...prev, pkg]);
  }, []);

  const updatePackage = useCallback((id: string, updates: Partial<Package>) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, ...updates } : pkg)),
    );
  }, []);

  const deletePackage = useCallback((id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  }, []);

  const getPackageById = useCallback(
    (id: string) => packages.find((pkg) => pkg.id === id),
    [packages],
  );

  return (
    <PackageContext.Provider
      value={{ packages, addPackage, updatePackage, deletePackage, getPackageById }}
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
  const { addPackage, updatePackage, deletePackage, getPackageById } = ctx;
  return { addPackage, updatePackage, deletePackage, getPackageById };
}

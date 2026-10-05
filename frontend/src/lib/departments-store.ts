

import { useSyncExternalStore } from 'react';

export type StatusClass = 'delay' | 'blocked' | 'done' | 'track';

export type DepartmentProject = {
  id: string;
  name: string;
  progress: number;
  status: string;
  statusClass: StatusClass;
  company?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
};

export type Department = {
  id: number;
  name: string;
  description: string;
  manager: string;
  owner: string;
  section: string;
  projects: number;
  progress: number;
  status: string;
  statusClass: StatusClass;
  lastActivity: string;
  sector: string;
  performance: string;
  email: string;
  phone: string;
  outputs: number;
  team: TeamMember[];
  projectsList: DepartmentProject[];
};

const defaultProjectsList: DepartmentProject[] = [
  { id: 'p1', name: 'إطلاق حملة تسويقية جديدة', progress: 20, status: 'تأخير', statusClass: 'delay' },
  { id: 'p2', name: 'تحسين واجهة المستخدم لموقع الويب', progress: 10, status: 'متعثر', statusClass: 'blocked' },
  { id: 'p3', name: 'تحسين واجهة المستخدم لموقع الويب', progress: 100, status: 'مكتمل', statusClass: 'done' },
  { id: 'p4', name: 'تطوير تطبيق موبايل', progress: 50, status: 'على المسار', statusClass: 'track' },
  { id: 'p5', name: 'إطلاق حملة تسويقية جديدة', progress: 100, status: 'مكتمل', statusClass: 'done' },
];

const defaultTeam: TeamMember[] = [
  { id: 't1', name: 'سارة محمد', role: 'مدير المشروع', email: 'salwa@aljoud.com', phone: '+966 50 4567 123' },
];

const initialDepartments: Department[] = [
  { id: 1, name: 'تطوير البرمجيات', description: 'إدارة مسؤولة عن تطوير الأنظمة، بناء المنتجات التقنية، وصيانة المنصات الداخلية والخارجية.', manager: 'عبدالعزيز سالم', owner: 'أحمد العمري', section: 'التقنية', projects: 12, progress: 80, status: 'على المسار', statusClass: 'track', lastActivity: '12/04/2026', sector: 'الخدمات المدارة', performance: 'ممتاز', email: 'salwa@aljoud.com', phone: '+966 50 4567 123', outputs: 28, team: defaultTeam, projectsList: defaultProjectsList },
  { id: 2, name: 'إدارة المالية', description: 'إدارة مسؤولة عن التخطيط المالي، إعداد الموازنات، ومتابعة الإيرادات والمصروفات.', manager: 'عبدالعزيز سالم', owner: 'أحمد العمري', section: 'المالية', projects: 30, progress: 50, status: 'على المسار', statusClass: 'track', lastActivity: '12/04/2026', sector: 'الخدمات المالية', performance: 'جيد', email: 'finance@aljoud.com', phone: '+966 50 1234 567', outputs: 18, team: defaultTeam, projectsList: defaultProjectsList },
  { id: 3, name: 'إدارة المالية', description: 'إدارة مسؤولة عن التخطيط المالي، إعداد الموازنات، ومتابعة الإيرادات والمصروفات.', manager: 'عبدالعزيز سالم', owner: 'أحمد العمري', section: 'المالية', projects: 30, progress: 50, status: 'على المسار', statusClass: 'track', lastActivity: '12/04/2026', sector: 'الخدمات المالية', performance: 'جيد', email: 'finance2@aljoud.com', phone: '+966 50 1234 567', outputs: 18, team: defaultTeam, projectsList: defaultProjectsList },
  { id: 4, name: 'إدارة المالية', description: 'إدارة مسؤولة عن التخطيط المالي، إعداد الموازنات، ومتابعة الإيرادات والمصروفات.', manager: 'عبدالعزيز سالم', owner: 'أحمد العمري', section: 'المالية', projects: 30, progress: 50, status: 'على المسار', statusClass: 'track', lastActivity: '12/04/2026', sector: 'الخدمات المالية', performance: 'جيد', email: 'finance3@aljoud.com', phone: '+966 50 1234 567', outputs: 18, team: defaultTeam, projectsList: defaultProjectsList },
];

let departments: Department[] = initialDepartments;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDepartments() {
  return useSyncExternalStore(
    subscribe,
    () => departments,
    () => departments,
  );
}

export function useDepartment(id: number) {
  return useDepartments().find((d) => d.id === id);
}

export function addDepartment(department: Department) {
  departments = [department, ...departments];
  emit();
  return department;
}

export function updateDepartment(id: number, patch: Partial<Department>) {
  departments = departments.map((d) => (d.id === id ? { ...d, ...patch } : d));
  emit();
}

export function deleteDepartment(id: number) {
  departments = departments.filter((d) => d.id !== id);
  emit();
}

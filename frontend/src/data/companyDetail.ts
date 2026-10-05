export type ProjectStatus = "delayed" | "stalled" | "done" | "on-track";

export type CompanyProject = {
  id: string;
  name: string;
  progress: number;
  status: ProjectStatus;
};

export type CompanyDetails = {
  registration: string;
  performance: string;
  sector: string;
  owner: string;
  phone: string;
  email: string;
  description: string;
};

export const defaultDetails: CompanyDetails = {
  registration: "1010XXXXXX",
  performance: "ممتاز",
  sector: "خدمات تقنية",
  owner: "أحمد العمري",
  phone: "+966 50 4567 123",
  email: "salwa@aljoud.com",
  description: "متخصصة في تطوير الأنظمة وتكامل الحلول التقنية للقطاع الحكومي",
};

export const companyStats = [
  { label: "عدد المشاريع", value: "12", delta: "+5%" },
  { label: "متوسط التقدم", value: "80%", delta: "+5%" },
  { label: "عدد المخرجات", value: "28", delta: "+5%", down: true },
];

export const companyProjects: CompanyProject[] = [
  { id: "p1", name: "إطلاق حملة تسويقية جديدة", progress: 20, status: "delayed" },
  { id: "p2", name: "تحسين واجهة المستخدم لموقع الويب", progress: 10, status: "stalled" },
  { id: "p3", name: "تحسين واجهة المستخدم لموقع الويب", progress: 100, status: "done" },
  { id: "p4", name: "تطوير تطبيق موبايل", progress: 50, status: "on-track" },
  { id: "p5", name: "إطلاق حملة تسويقية جديدة", progress: 100, status: "done" },
  { id: "p6", name: "تطوير تطبيق موبايل", progress: 20, status: "stalled" },
  { id: "p7", name: "تحديث قاعدة بيانات المستخدمين", progress: 70, status: "on-track" },
];

export const projectStatusMeta: Record<ProjectStatus, { label: string; pill: string; bar: string }> = {
  delayed: { label: "تأخير", pill: "bg-warning-soft text-warning-foreground", bar: "bg-warning" },
  stalled: { label: "متعثر", pill: "bg-danger-soft text-destructive", bar: "bg-destructive" },
  done: { label: "مكتمل", pill: "bg-success-soft text-success", bar: "bg-success" },
  "on-track": { label: "على المسار", pill: "bg-info-soft text-info-foreground", bar: "bg-info" },
};

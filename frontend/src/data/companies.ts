export type CompanyStatus = "on-track" | "delayed";

export type Company = {
  id: string;
  name: string;
  description: string;
  contracts: number;
  progress: number;
  status: CompanyStatus;
  logoText: string;
  logoClass: string;
};

export const companies: Company[] = [
  {
    id: "jodayn",
    name: "شركة جودين",
    description: "وصف تفصيلي للشركة",
    contracts: 10,
    progress: 50,
    status: "on-track",
    logoText: "جودين",
    logoClass: "text-success",
  },
  {
    id: "nafidh",
    name: "شركة نافذ للتقنية",
    description: "وصف تفصيلي للشركة",
    contracts: 12,
    progress: 50,
    status: "delayed",
    logoText: "نافذ",
    logoClass: "text-foreground",
  },
  {
    id: "rawasi",
    name: "مجموعة رواسي للحلول",
    description: "وصف تفصيلي للشركة",
    contracts: 8,
    progress: 50,
    status: "on-track",
    logoText: "رواسي",
    logoClass: "text-info-foreground",
  },
  {
    id: "masar",
    name: "شركة مسار الرقمي",
    description: "وصف تفصيلي للشركة",
    contracts: 3,
    progress: 50,
    status: "on-track",
    logoText: "مسار",
    logoClass: "text-muted-foreground",
  },
  {
    id: "dherwa",
    name: "شركة ذروة للبرمجيات",
    description: "وصف تفصيلي للشركة",
    contracts: 4,
    progress: 50,
    status: "delayed",
    logoText: "ذروة",
    logoClass: "text-warning-foreground",
  },
  {
    id: "wasl",
    name: "مؤسسة وصل التقنية",
    description: "وصف تفصيلي للشركة",
    contracts: 2,
    progress: 50,
    status: "delayed",
    logoText: "وصل",
    logoClass: "text-foreground",
  },
  {
    id: "manara",
    name: "شركة منارة للأمن السيبراني",
    description: "وصف تفصيلي للشركة",
    contracts: 11,
    progress: 50,
    status: "on-track",
    logoText: "منارة",
    logoClass: "text-foreground",
  },
  {
    id: "itqan",
    name: "مجموعة إتقان للبنية التحتية",
    description: "وصف تفصيلي للشركة",
    contracts: 9,
    progress: 50,
    status: "on-track",
    logoText: "إتقان",
    logoClass: "text-foreground",
  },
  {
    id: "ufuq",
    name: "شركة أفق للذكاء الاصطناعي",
    description: "وصف تفصيلي للشركة",
    contracts: 5,
    progress: 50,
    status: "on-track",
    logoText: "أفق",
    logoClass: "text-foreground",
  },
];

export function deleteCompany(id: string) {
  const index = companies.findIndex((c) => c.id === id);
  if (index !== -1) companies.splice(index, 1);
}

export const teamMembers = [
  {
    id: "salwa",
    initial: "س",
    role: "مدير المشروع",
    name: "سارة محمد",
    phone: "+966 50 4567 123",
    email: "salwa@aljoud.com",
  },
];

export const linkedProjects = [
  {
    id: "cms",
    name: "نظام إدارة المحتوى",
    company: "شركة A",
    status: "على المسار",
    progress: 45,
  },
];

import type { LayoutItem } from 'react-grid-layout/legacy';
import type { ComponentType } from 'react';
import { ActiveTenantsWidget } from '../components/dashboard/widgets/ActiveTenantsWidget';
import { TotalRevenueWidget } from '../components/dashboard/widgets/TotalRevenueWidget';
import { SubscriptionsEndingWidget } from '../components/dashboard/widgets/SubscriptionsEndingWidget';
import { TenantStatusDonutWidget } from '../components/dashboard/widgets/TenantStatusDonutWidget';
import { SubscriptionsRevenueChartWidget } from '../components/dashboard/widgets/SubscriptionsRevenueChartWidget';
import { TenantsByPlanDonutWidget } from '../components/dashboard/widgets/TenantsByPlanDonutWidget';
import { TenantAlertsWidget } from '../components/dashboard/widgets/TenantAlertsWidget';
import { LatestActionsWidget } from '../components/dashboard/widgets/LatestActionsWidget';
import { LatestTenantsWidget } from '../components/dashboard/widgets/LatestTenantsWidget';
import { ActiveProjectsWidget } from '../components/dashboard/widgets/ActiveProjectsWidget';
import { AvgProgressWidget } from '../components/dashboard/widgets/AvgProgressWidget';
import { UpcomingDeliverablesWidget } from '../components/dashboard/widgets/UpcomingDeliverablesWidget';
import { OpenRisksDonutWidget } from '../components/dashboard/widgets/OpenRisksDonutWidget';
import { RisksByLevelChartWidget } from '../components/dashboard/widgets/RisksByLevelChartWidget';
import { ProjectStatusDonutWidget } from '../components/dashboard/widgets/ProjectStatusDonutWidget';
import { TodayAlertsWidget } from '../components/dashboard/widgets/TodayAlertsWidget';
import { DeliverablesListWidget } from '../components/dashboard/widgets/DeliverablesListWidget';
import { ProjectsListWidget } from '../components/dashboard/widgets/ProjectsListWidget';

export type WidgetId =
  
  | 'active-tenants'
  | 'total-revenue'
  | 'subscriptions-ending'
  | 'tenant-status-donut'
  | 'subscriptions-revenue-chart'
  | 'tenant-plan-donut'
  | 'tenant-alerts'
  | 'latest-actions'
  | 'latest-tenants'
  
  
  | 'active-projects'
  | 'avg-progress'
  | 'upcoming-deliverables'
  | 'open-risks-donut'
  | 'risks-by-level'
  | 'project-status-donut'
  | 'today-alerts'
  | 'deliverables-list'
  | 'projects-list';

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  minW: number;
  minH: number;
  component: ComponentType;
  
  autoHeight?: boolean;
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
  'active-tenants': {
    id: 'active-tenants',
    title: 'المستأجرون النشطون',
    minW: 3,
    minH: 2,
    component: ActiveTenantsWidget,
  },
  'total-revenue': {
    id: 'total-revenue',
    title: 'إجمالي الايرادات',
    minW: 3,
    minH: 2,
    component: TotalRevenueWidget,
  },
  'subscriptions-ending': {
    id: 'subscriptions-ending',
    title: 'اشتراكات تنتهي خلال 30 يوم',
    minW: 3,
    minH: 2,
    component: SubscriptionsEndingWidget,
  },
  'tenant-status-donut': {
    id: 'tenant-status-donut',
    title: 'إجمالي المستأجرين',
    minW: 3,
    minH: 2,
    component: TenantStatusDonutWidget,
  },
  'subscriptions-revenue-chart': {
    id: 'subscriptions-revenue-chart',
    title: 'الاشتراكات والإيرادات',
    minW: 5,
    minH: 4,
    component: SubscriptionsRevenueChartWidget,
  },
  'tenant-plan-donut': {
    id: 'tenant-plan-donut',
    title: 'توزيع المستأجرين حسب الباقة',
    minW: 4,
    minH: 4,
    component: TenantsByPlanDonutWidget,
  },
  'tenant-alerts': {
    id: 'tenant-alerts',
    title: 'تنبيهات اليوم',
    minW: 6,
    minH: 3,
    component: TenantAlertsWidget,
    autoHeight: true,
  },
  'latest-actions': {
    id: 'latest-actions',
    title: 'أحدث الإجراءات',
    minW: 4,
    minH: 3,
    component: LatestActionsWidget,
  },
  'latest-tenants': {
    id: 'latest-tenants',
    title: 'أحدث المستأجرين',
    minW: 4,
    minH: 3,
    component: LatestTenantsWidget,
  },
  'active-projects': {
    id: 'active-projects',
    title: 'المشاريع النشطة',
    minW: 3,
    minH: 2,
    component: ActiveProjectsWidget,
  },
  'avg-progress': {
    id: 'avg-progress',
    title: 'متوسط تقدم المشاريع',
    minW: 3,
    minH: 2,
    component: AvgProgressWidget,
  },
  'upcoming-deliverables': {
    id: 'upcoming-deliverables',
    title: 'مخرجات قادمة',
    minW: 3,
    minH: 2,
    component: UpcomingDeliverablesWidget,
  },
  'open-risks-donut': {
    id: 'open-risks-donut',
    title: 'المخاطر المفتوحة',
    minW: 3,
    minH: 2,
    component: OpenRisksDonutWidget,
  },
  'risks-by-level': {
    id: 'risks-by-level',
    title: 'المخاطر المفتوحة حسب المستوى',
    minW: 5,
    minH: 4,
    component: RisksByLevelChartWidget,
  },
  'project-status-donut': {
    id: 'project-status-donut',
    title: 'توزيع حالات المشاريع',
    minW: 4,
    minH: 4,
    component: ProjectStatusDonutWidget,
  },
  'today-alerts': {
    id: 'today-alerts',
    title: 'تنبيهات اليوم',
    minW: 6,
    minH: 3,
    component: TodayAlertsWidget,
    autoHeight: true,
  },
  'deliverables-list': {
    id: 'deliverables-list',
    title: 'المخرجات',
    minW: 4,
    minH: 3,
    component: DeliverablesListWidget,
  },
  'projects-list': {
    id: 'projects-list',
    title: 'المشاريع',
    minW: 4,
    minH: 3,
    component: ProjectsListWidget,
  },
};

export const ALL_WIDGET_IDS = Object.keys(WIDGET_REGISTRY) as WidgetId[];

export const SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS: WidgetId[] = [
  'active-tenants',
  'total-revenue',
  'subscriptions-ending',
  'tenant-status-donut',
  'subscriptions-revenue-chart',
  'tenant-plan-donut',
  'project-status-donut',
  'tenant-alerts',
  'latest-actions',
  'latest-tenants',
];

export const ADMIN_DEFAULT_ACTIVE_WIDGET_IDS: WidgetId[] = [
  'active-projects',
  'avg-progress',
  'upcoming-deliverables',
  'open-risks-donut',
  'risks-by-level',
  'project-status-donut',
  'today-alerts',
  'deliverables-list',
  'projects-list',
];

/** Packed layout for Org/Client/Jodayn dashboards (admin widgets only). */
export const ADMIN_PORTAL_LAYOUT: LayoutItem[] = [
  { i: 'active-projects', x: 9, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'avg-progress', x: 6, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'upcoming-deliverables', x: 3, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'open-risks-donut', x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'risks-by-level', x: 6, y: 2, w: 6, h: 4, minW: 5, minH: 4 },
  { i: 'project-status-donut', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 4 },
  { i: 'today-alerts', x: 0, y: 6, w: 12, h: 3, minW: 6, minH: 3 },
  { i: 'deliverables-list', x: 6, y: 9, w: 6, h: 3, minW: 4, minH: 3 },
  { i: 'projects-list', x: 0, y: 9, w: 6, h: 3, minW: 4, minH: 3 },
];

export const DEFAULT_ACTIVE_WIDGET_IDS = SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS;

export const DEFAULT_LAYOUT: LayoutItem[] = [
  
  { i: 'active-tenants', x: 9, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'total-revenue', x: 6, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'subscriptions-ending', x: 3, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'tenant-status-donut', x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'subscriptions-revenue-chart', x: 6, y: 2, w: 6, h: 4, minW: 5, minH: 4 },
  { i: 'tenant-plan-donut', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 4 },
  { i: 'tenant-alerts', x: 0, y: 6, w: 12, h: 3, minW: 6, minH: 3 },
  { i: 'latest-actions', x: 6, y: 9, w: 6, h: 3, minW: 4, minH: 3 },
  { i: 'latest-tenants', x: 0, y: 9, w: 6, h: 3, minW: 4, minH: 3 },
  { i: 'project-status-donut', x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 4 },
  
  
  
  { i: 'active-projects', x: 9, y: 20, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'avg-progress', x: 6, y: 20, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'upcoming-deliverables', x: 3, y: 20, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'open-risks-donut', x: 0, y: 20, w: 3, h: 2, minW: 3, minH: 2 },
  { i: 'risks-by-level', x: 6, y: 22, w: 6, h: 4, minW: 5, minH: 4 },
  { i: 'today-alerts', x: 0, y: 26, w: 12, h: 3, minW: 6, minH: 3 },
  { i: 'deliverables-list', x: 6, y: 29, w: 6, h: 3, minW: 4, minH: 3 },
  { i: 'projects-list', x: 0, y: 29, w: 6, h: 3, minW: 4, minH: 3 },
];

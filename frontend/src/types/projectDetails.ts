

import type { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export interface TabItem {
  id: string;
  label: string;
}

export interface RiskBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface ContractDetails {
  contractNumber: string;
  signDate: string;
  startDate: string;
  endDate: string;
  contractor: string;
  status: 'active' | 'expired' | 'pending';
}

export interface BudgetDetails {
  spent: number;
  remaining: number;
  total: number;
  currency: string;
}

export interface ProjectSummary {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  title: string;
  subtitle: string;
  tags: string[];
}

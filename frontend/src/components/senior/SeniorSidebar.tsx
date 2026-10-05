import type { PageId } from '../layout/Sidebar';

export type SeniorPageId = Extract<PageId, 'dashboard' | 'companies' | 'goals' | 'projects' | 'departments'> | 'settings';

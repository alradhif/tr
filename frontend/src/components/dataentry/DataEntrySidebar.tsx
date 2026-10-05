import type { PageId } from '../layout/Sidebar';

export type DataEntryPageId = Extract<PageId, 'dashboard' | 'companies' | 'goals' | 'projects' | 'departments'> | 'settings';

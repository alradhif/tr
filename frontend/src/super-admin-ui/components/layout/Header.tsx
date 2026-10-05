import { EditGridIcon } from './EditGridIcon';
import { PageHeader } from './PageHeader';
import type { UserRole } from '../../types/auth';
import './layout.css';

interface HeaderProps {
  role: UserRole;
  isEditMode: boolean;
  onToggleEdit: () => void;
}

export function Header({ role: _role, isEditMode, onToggleEdit }: HeaderProps) {
  return (
    <PageHeader
      title="لوحة التحكم"
      subtitle="نظرة عامة على أداء المنصة"
      action={
        <button
          type="button"
          className={`header__edit-btn ${isEditMode ? 'header__edit-btn--active' : ''}`}
          onClick={onToggleEdit}
        >
          <EditGridIcon size={16} className="header__edit-icon" />
          <span>{isEditMode ? 'إنهاء التحرير' : 'تحرير'}</span>
        </button>
      }
    />
  );
}

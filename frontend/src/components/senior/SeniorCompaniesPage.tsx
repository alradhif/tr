import { useState } from 'react';
import { companies } from '../../data/companies';
import { CompaniesListPage, type ListNotice } from './CompaniesListPage';
import { NewCompanyPage } from './NewCompanyPage';
import { CompanyDetailPage } from './CompanyDetailPage';
import { SeniorPptxPage } from './SeniorPptxPage';

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'detail'; id: string } | { kind: 'pptx'; id: string };

export function SeniorCompaniesPage() {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [notice, setNotice] = useState<ListNotice>(undefined);

  if (view.kind === 'new') {
    return (
      <NewCompanyPage
        onBack={() => setView({ kind: 'list' })}
        onSubmit={(name) => {
          if (!name.trim()) {
            setNotice('error');
            setView({ kind: 'list' });
            return;
          }
          companies.unshift({
            id: `com-${Date.now()}`,
            name: name.trim(),
            description: 'وصف تفصيلي للشركة',
            contracts: 0,
            progress: 0,
            status: 'on-track',
            logoText: name.trim().replace('شركة ', '').slice(0, 6),
            logoClass: 'text-foreground',
          });
          setNotice('success');
          setView({ kind: 'list' });
        }}
      />
    );
  }

  if (view.kind === 'detail') {
    return (
      <CompanyDetailPage
        companyId={view.id}
        onBack={() => setView({ kind: 'list' })}
        onDeleted={() => {
          setNotice('deleted');
          setView({ kind: 'list' });
        }}
        onOpenPptx={() => setView({ kind: 'pptx', id: view.id })}
      />
    );
  }

  if (view.kind === 'pptx') {
    const company = companies.find((c) => c.id === view.id);
    return (
      <SeniorPptxPage
        companyName={company?.name}
        onBack={() => setView({ kind: 'detail', id: view.id })}
      />
    );
  }

  return (
    <CompaniesListPage
      notice={notice}
      onCloseNotice={() => setNotice(undefined)}
      onNewCompany={() => setView({ kind: 'new' })}
      onOpenCompany={(id) => setView({ kind: 'detail', id })}
    />
  );
}

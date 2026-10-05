

import { PageHeader } from '../layout/PageHeader';
import { SubpageHeader } from '../layout/SubpageHeader';
import '../layout/layout.css';
import './dataentry-pptx.css';

export function DataEntryPptxPage({
  companyName,
  onBack,
}: {
  
  companyName?: string;
  
  onBack?: () => void;
}) {
  return (
    <div className="dataentry-pptx-page" dir="rtl">
      {onBack ? (
        <SubpageHeader
          parent="الشركات"
          ancestors={companyName ? [companyName] : []}
          title="عروض التقديمية"
          onBack={onBack}
        />
      ) : (
        <PageHeader
          title="مولّد العروض التقديمية"
          subtitle="أنشئ عروض PowerPoint مخصصة من بيانات المنصة"
        />
      )}
      <div className="dataentry-pptx-page__frame-wrap">
        <iframe
          src="/companies-app/index.html"
          title="مولّد العروض التقديمية"
          className="dataentry-pptx-page__frame"
          allowFullScreen
        />
      </div>
    </div>
  );
}



import { PageHeader } from '../layout/PageHeader';
import { SubpageHeader } from '../layout/SubpageHeader';
import '../layout/layout.css';
import './senior-pptx.css';

export function SeniorPptxPage({
  companyName,
  onBack,
}: {
  
  companyName?: string;
  
  onBack?: () => void;
}) {
  return (
    <div className="senior-pptx-page" dir="rtl">
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
      <div className="senior-pptx-page__frame-wrap">
        <iframe
          src="/companies-app/index.html"
          title="مولّد العروض التقديمية"
          className="senior-pptx-page__frame"
          allowFullScreen
        />
      </div>
    </div>
  );
}

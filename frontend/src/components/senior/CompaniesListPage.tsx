import { AlertTriangle, ChevronLeft, HelpCircle, ListFilter, Plus } from "lucide-react";

import { FeedbackBanner } from "../ui/FeedbackBanner";
import { TrendKpiRow } from "./TrendKpiCard";
import { companies, type Company } from "../../data/companies";
import './senior-companies.css';

export type ListNotice = "success" | "error" | "deleted" | undefined;

const listStats = [
  { label: "عدد الشركات",   value: String(companies.length), delta: "+5%",  up: true  },
  { label: "متوسط التقدم",  value: "80%",                    delta: "+5%",  up: true  },
  { label: "إجمالي العقود", value: "64",                     delta: "+5%",  up: false },
];

function StatusPill({ status }: { status: Company["status"] }) {
  if (status === "delayed") {
    return (
      <span className="sc-status-pill sc-status-pill--warning">
        <AlertTriangle className="sc-status-pill__icon" />
        تأخير
      </span>
    );
  }
  return (
    <span className="sc-status-pill sc-status-pill--track">
      <HelpCircle className="sc-status-pill__icon" />
      على المسار
    </span>
  );
}

export function CompaniesListPage({
  notice,
  onCloseNotice,
  onNewCompany,
  onOpenCompany,
}: {
  notice: ListNotice;
  onCloseNotice: () => void;
  onNewCompany: () => void;
  onOpenCompany: (id: string) => void;
}) {
  return (
    <div className="sc-page" dir="rtl">
      
      <div className="sc-shell-title">
        <h1>الشركات</h1>
      </div>

      
      {notice === "success" && (
        <FeedbackBanner tone="success" onClose={onCloseNotice}>
          تم إضافة الشركة بنجاح
        </FeedbackBanner>
      )}
      {notice === "deleted" && (
        <FeedbackBanner tone="success" onClose={onCloseNotice}>
          تم حذف الشركة بنجاح
        </FeedbackBanner>
      )}
      {notice === "error" && (
        <FeedbackBanner tone="error" onClose={onCloseNotice}>
          حدث خطأ ما ، يرجى المحاولة مرة أخرى
        </FeedbackBanner>
      )}

      <div className="sc-content">
        
        <div className="sc-list-header">
          <div className="sc-page-heading">
            <h2>قائمة الشركات</h2>
          </div>
          
          <div className="sc-toolbar">
            <button
              type="button"
              className="sc-btn-primary"
              onClick={onNewCompany}
            >
              <Plus size={18} />
              <span>إضافة شركة جديدة</span>
            </button>
            <button type="button" className="sc-btn-outline">
              <ListFilter size={17} />
              <span>تصفية</span>
            </button>
          </div>
        </div>

        
        <TrendKpiRow stats={listStats} />

        
        <div className="sc-table-wrap">
          
          <div className="sc-table-head">
            <span className="sc-col-name">الإدارة</span>
            <span className="sc-col-center">عدد العقود</span>
            <span className="sc-col-center">نسبة الإنجاز</span>
            <span className="sc-col-center">الحالة</span>
            <span />
          </div>

          
          <ul className="sc-table-body">
            {companies.map((company, i) => (
              <li
                key={company.id}
                className={`sc-table-row ${i % 2 === 0 ? "sc-row-even" : "sc-row-odd"}`}
              >
                
                <div className="sc-company-cell">
                  <span className="sc-logo-box">
                    <span className={`sc-logo-text ${company.logoClass}`}>
                      {company.logoText}
                    </span>
                  </span>
                  <div className="sc-company-info">
                    <p className="sc-company-name">{company.name}</p>
                    <p className="sc-company-desc">{company.description}</p>
                  </div>
                </div>

                
                <div className="sc-col-center">
                  <span className="sc-contracts-count">{company.contracts}</span>
                </div>

                
                <div className="sc-progress-cell">
                  <div className="sc-progress-track">
                    <div
                      className="sc-progress-fill"
                      style={{ width: `${company.progress}%` }}
                    />
                  </div>
                  <span className="sc-progress-text">{company.progress}%</span>
                </div>

                
                <div className="sc-col-center">
                  <StatusPill status={company.status} />
                </div>

                
                <button
                  type="button"
                  onClick={() => onOpenCompany(company.id)}
                  aria-label={`تفاصيل ${company.name}`}
                  className="sc-btn-action"
                >
                  <ChevronLeft size={20} />
                </button>
              </li>
            ))}

            {companies.length === 0 && (
              <li className="sc-empty">لا توجد شركات حالياً</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

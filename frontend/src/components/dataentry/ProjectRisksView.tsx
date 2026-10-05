import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  User,
  Phone,
  Mail,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText,
} from 'lucide-react';
import './detail-header-card.css';

type Level = 'عالي' | 'متوسط' | 'منخفض';
type Status = 'نشط' | 'قيد المعالجه' | 'معالج';

export interface Risk {
  id: string;
  title: string;
  category: string;
  level: Level;
  status: Status;
  owner: string;
  date: string;
  avatar: string;
  description: string;
  mitigation: string[];
  phone: string;
  email: string;
}

interface Comment {
  id: string;
  author: string;
  role: string;
  time: string;
  body: string;
}

const levelClass: Record<Level, string> = {
  عالي: 'bg-level-high-bg text-level-high',
  متوسط: 'bg-level-medium-bg text-level-medium',
  منخفض: 'bg-level-low-bg text-level-low',
};

const statusClass: Record<Status, string> = {
  نشط: 'bg-level-low-bg text-level-low',
  'قيد المعالجه': 'bg-muted text-foreground',
  معالج: 'bg-brand-soft text-brand-strong',
};

const seedRows: Array<Omit<Risk, 'id' | 'description' | 'mitigation' | 'phone' | 'email'>> = [
  { title: 'انقطاع الخدمة أثناء الإطلاق', category: 'بنية تحتية • المرحلة 3', level: 'عالي', status: 'نشط', owner: 'سارة خالد', date: '12 april 2026', avatar: 'س' },
  { title: 'ثغرات أمنية في الـ API', category: 'أمن سيبراني • المرحلة 2', level: 'عالي', status: 'قيد المعالجه', owner: 'أحمد خالد', date: '12 april 2026', avatar: 'أ' },
  { title: 'تجاوز الميزانية في مرحلة التطوير', category: 'مالي • المرحلة 2', level: 'متوسط', status: 'نشط', owner: 'نواف محمد', date: '12 april 2026', avatar: 'ن' },
  { title: 'تأخر اعتماد متطلبات المرحلة 2', category: 'إداري • المرحلة 2', level: 'منخفض', status: 'معالج', owner: 'سارة خالد', date: '12 april 2026', avatar: 'س' },
  { title: 'تعارض إصدارات المكتبات التقنية', category: 'تقني • المرحلة 2', level: 'عالي', status: 'قيد المعالجه', owner: 'رهف احمد', date: '12 april 2026', avatar: 'ر' },
  { title: 'تغيير متطلبات واجهة المستخدم', category: 'نطاق العمل • المرحلة 1', level: 'متوسط', status: 'نشط', owner: 'محمد عبدالله', date: '12 april 2026', avatar: 'م' },
  { title: 'انتهاء عقد أحد أعضاء الفريق', category: 'موارد بشرية • المرحلة 1', level: 'منخفض', status: 'معالج', owner: 'سارة خالد', date: '12 april 2026', avatar: 'س' },
];

function seedRisks(projectId: number): Risk[] {
  return seedRows.map((row, index) => ({
    ...row,
    id: `${projectId}-${index + 1}`,
    description: 'احتمال توقف النظام أثناء الإطلاق بسبب الضغط العالي على الخدمة وعدم كفاية سعة السيرفرات الحالية.',
    mitigation: ['تحسين البنية التحتية', 'اختبار الضغط', 'تجهيز خطة بديلة'],
    phone: '+966 50 4567 123',
    email: 'salwa@aljoud.com',
  }));
}

const initialComments: Comment[] = [
  { id: 'c1', author: 'سارة خالد', role: 'مدير المشروع', time: 'منذ يومين', body: 'تم التنسيق مع فريق البنية التحتية لزيادة سعة السيرفرات قبل موعد الإطلاق، وجاري تنفيذ اختبار ضغط خلال هذا الأسبوع.' },
  { id: 'c2', author: 'أحمد العمري', role: 'QA Lead', time: 'منذ يومين', body: 'نحتاج التأكد من وجود خطة rollback في حال حدوث انقطاع مفاجئ، واقتراح إجراء اختبار محاكاة لسيناريو الانهيار قبل الإطلاق.' },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === 'معالج') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'نشط') return <HelpCircle className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

const dhcBadgeTone: Record<string, string> = {
  عالي: 'dhc-badge--red',
  متوسط: 'dhc-badge--orange',
  منخفض: 'dhc-badge--blue',
  نشط: 'dhc-badge--red',
  'قيد المعالجه': 'dhc-badge--orange',
  معالج: 'dhc-badge--blue',
};

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="dhc-meta-item">
      <span className="dhc-meta-label">{label}</span>
      <span className={`dhc-badge ${dhcBadgeTone[value] ?? 'dhc-badge--neutral'}`}>
        <AlertTriangle />
        {value}
      </span>
    </div>
  );
}

function RiskDetailView({ risk, onBack }: { risk: Risk; onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim()) return;
    setComments((prev) => [...prev, { id: String(Date.now()), author: 'سارة خالد', role: 'مدير المشروع', time: 'الآن', body: text.trim() }]);
    setText('');
  }

  return (
    <div dir="rtl" className="tw-scope space-y-6 font-sans">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
        رجوع إلى المخاطر
      </button>

      <section className="dhc-card">
        <div className="dhc-header">
          <div className="dhc-header-icon-box dhc-header-icon-box--red">
            <ShieldAlert />
          </div>
          <h1 className="dhc-title">{risk.title}</h1>
        </div>

        <hr className="dhc-divider" />

        <div className="dhc-meta-grid">
          <MetaBadge label="التأثير" value={risk.level} />
          <MetaBadge label="الاحتمالية" value={risk.level === 'عالي' ? 'متوسط' : risk.level} />
          <MetaBadge label="الحالة" value={risk.status} />
        </div>

        <hr className="dhc-divider" />

        <div className="dhc-details-grid">
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><User /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">الشخص المسؤول</span>
              <span className="dhc-detail-value">{risk.owner}</span>
            </div>
          </div>
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><Phone /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">الهاتف</span>
              <span className="dhc-detail-value dhc-phone-number">{risk.phone}</span>
            </div>
          </div>
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><Mail /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">البريد الإلكتروني</span>
              <span className="dhc-detail-value">{risk.email}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="pb-4 text-lg font-bold text-foreground">وصف الخطر</h2>
        <p className="border-t border-border pt-4 text-sm text-foreground">{risk.description}</p>

        <h2 className="pb-4 pt-8 text-lg font-bold text-foreground">خطة التخفيف</h2>
        <ul className="list-inside list-disc space-y-1 border-t border-border pt-4 text-sm text-foreground">
          {risk.mitigation.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="pb-4 text-lg font-bold text-foreground">التعليقات</h2>

        <div className="space-y-6 border-t border-border pt-6">
          {comments.map((c) => (
            <div key={c.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{c.role}</p>
                    <p className="text-sm font-bold text-foreground">{c.author}</p>
                  </div>
                  <span className="flex w-10 h-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                    {c.author.charAt(0)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{c.time}</span>
              </div>
              <p className="mt-4 text-sm text-foreground">{c.body}</p>
              <div className="mt-4 flex gap-4 text-muted-foreground">
                <button type="button" aria-label="إعجاب"><ThumbsUp className="w-4 h-4" /></button>
                <button type="button" aria-label="عدم إعجاب"><ThumbsDown className="w-4 h-4" /></button>
                <button type="button" aria-label="رد"><MessageSquare className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">مدير المشروع</p>
              <p className="text-sm font-bold text-foreground">سارة خالد</p>
            </div>
            <span className="flex w-10 h-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">س</span>
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">إضافة تعليق</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="مثال"
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
          />
          <div className="mt-4 flex justify-start gap-3">
            <button type="button" onClick={submit} className="rounded-lg bg-foreground px-8 py-2.5 text-sm font-semibold text-background hover:opacity-90">إرسال</button>
            <button type="button" onClick={() => setText('')} className="rounded-lg border border-border bg-card px-8 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">إلغاء</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export interface RiskDraft {
  name: string;
  status: string;
  impact: string;
  probability: string;
  owner: string;
  email: string;
  description: string;
}

const emptyDraft: RiskDraft = { name: '', status: '', impact: '', probability: '', owner: '', email: '', description: '' };

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function AddRiskDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (draft: RiskDraft) => void }) {
  const [draft, setDraft] = useState<RiskDraft>(emptyDraft);
  const set = (key: keyof RiskDraft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!open) setDraft(emptyDraft);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="project-output-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="project-output-modal__dialog" dir="rtl">
        <div className="project-output-modal__header">
          <div className="project-output-modal__title-wrap">
            <span className="project-output-modal__icon"><FileText size={22} /></span>
            <h2>إضافة مخاطر</h2>
          </div>
        </div>

        <div className="project-output-modal__divider" />

        <div className="project-output-modal__grid">
          <Field label="اسم المخاطر" value={draft.name} onChange={set('name')} />
          <Field label="الحالة" value={draft.status} onChange={set('status')} />
          <Field label="مدى التأثير" value={draft.impact} onChange={set('impact')} />
          <Field label="الاحتمالية" value={draft.probability} onChange={set('probability')} />
          <Field label="مسؤول المخاطر" value={draft.owner} onChange={set('owner')} />
          <Field label="البريد الإلكتروني" value={draft.email} onChange={set('email')} />
        </div>

        <div className="project-output-modal__files">
          <span className="project-output-modal__files-label">وصف الخطر</span>
          <textarea
            value={draft.description}
            onChange={(e) => set('description')(e.target.value)}
            rows={4}
            className="project-output-modal__textarea"
          />
        </div>

        <div className="project-output-modal__actions">
          <button type="button" className="project-output-modal__cancel" onClick={onClose}>إلغاء</button>
          <button type="button" className="project-output-modal__submit" onClick={() => onSubmit(draft)}>إضافة</button>
        </div>
      </div>
    </div>
  );
}

export function ProjectRisksView({ projectId }: { projectId: number }) {
  const [risks, setRisks] = useState<Risk[]>(() => seedRisks(projectId));
  const [selected, setSelected] = useState<Risk | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const open = () => {
      window.dispatchEvent(new CustomEvent('clear-project-banner'));
      setIsDialogOpen(true);
    };
    window.addEventListener('open-add-risk-dialog', open);
    return () => window.removeEventListener('open-add-risk-dialog', open);
  }, []);

  const levelOf = (value: string): Level => (value.includes('عالي') ? 'عالي' : value.includes('منخفض') ? 'منخفض' : 'متوسط');
  const statusOf = (value: string): Status => (value.includes('معالجه') ? 'قيد المعالجه' : value.includes('معالج') ? 'معالج' : 'نشط');

  function handleSubmit(draft: RiskDraft) {
    if (!draft.name.trim() || !draft.owner.trim() || !draft.status.trim()) {
      setIsDialogOpen(false);
      window.dispatchEvent(new CustomEvent('project-banner', { detail: { tone: 'error', message: 'حدث خطأ ما ، يرجى المحاولة مرة أخرى' } }));
      return;
    }
    setRisks((prev) => [
      {
        id: String(Date.now()),
        title: draft.name.trim(),
        category: draft.description.trim() || 'غير محدد',
        level: levelOf(draft.impact),
        status: statusOf(draft.status),
        owner: draft.owner.trim(),
        date: '12 april 2026',
        avatar: draft.owner.trim().charAt(0),
        description: draft.description.trim() || 'لا يوجد وصف',
        mitigation: ['تحديد خطة التخفيف'],
        phone: '+966 50 4567 123',
        email: draft.email.trim() || 'salwa@aljoud.com',
      },
      ...prev,
    ]);
    setIsDialogOpen(false);
    window.dispatchEvent(new CustomEvent('project-banner', { detail: { tone: 'success', message: 'تم إضافة المخاطر بنجاح' } }));
  }

  if (selected) return <RiskDetailView risk={selected} onBack={() => setSelected(null)} />;

  return (
    <div dir="rtl" className="tw-scope font-sans">
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_40px] items-center bg-muted px-6 py-4 text-sm font-semibold text-foreground">
          <span>الخطر</span>
          <span className="text-center">المستوى</span>
          <span className="text-center">الحالة</span>
          <span className="text-center">المسؤول</span>
          <span className="text-center">آخر نشاط</span>
          <span />
        </div>

        {risks.map((risk) => (
          <button
            type="button"
            key={risk.id}
            onClick={() => setSelected(risk)}
            className="grid w-full grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_40px] items-center border-t border-border px-6 py-4 text-right hover:bg-accent"
          >
            <div>
              <p className="text-sm font-bold text-foreground">{risk.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{risk.category}</p>
            </div>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold ${levelClass[risk.level]}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {risk.level}
              </span>
            </div>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold ${statusClass[risk.status]}`}>
                <StatusIcon status={risk.status} />
                {risk.status}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-foreground">{risk.owner}</span>
              <span className="flex w-7 h-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-brand-foreground">{risk.avatar}</span>
            </div>
            <span dir="ltr" className="text-center text-xs text-muted-foreground">{risk.date}</span>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      <AddRiskDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}

export default ProjectRisksView;

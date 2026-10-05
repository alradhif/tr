import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  User,
  Phone,
  Mail,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileSignature,
  Info,
  X,
} from 'lucide-react';
import './detail-header-card.css';

type Priority = 'عالية' | 'متوسطة' | 'منخفضة';
type ReqStatus = 'مقبول' | 'قيد المراجعة' | 'مرفوض';

export interface ChangeRequest {
  id: string;
  title: string;
  requester: string;
  avatar: string;
  priority: Priority;
  status: ReqStatus;
  date: string;
  schedule: string;
  cost: string;
  phone: string;
  email: string;
  description: string;
}

interface Comment {
  id: string;
  author: string;
  role: string;
  time: string;
  body: string;
}

const priorityClass: Record<Priority, string> = {
  عالية: 'bg-level-high-bg text-level-high',
  متوسطة: 'bg-level-medium-bg text-level-medium',
  منخفضة: 'bg-brand-soft text-brand-strong',
};

const statusClass: Record<ReqStatus, string> = {
  مقبول: 'bg-brand-soft text-brand-strong',
  'قيد المراجعة': 'bg-muted text-muted-foreground',
  مرفوض: 'bg-level-high-bg text-level-high',
};

const seedRows: Array<Omit<ChangeRequest, 'id' | 'schedule' | 'cost' | 'phone' | 'email' | 'description'>> = [
  { title: 'إضافة تقارير تحليلية للوحة التحكم', requester: 'سارة خالد', avatar: 'س', priority: 'عالية', status: 'قيد المراجعة', date: '12 april 2026' },
  { title: 'تغيير هوية الواجهة الرسمية', requester: 'أحمد خالد', avatar: 'أ', priority: 'متوسطة', status: 'مقبول', date: '12 april 2026' },
  { title: 'تأجيل تسليم المرحلة الثانية', requester: 'نواف محمد', avatar: 'ن', priority: 'عالية', status: 'مرفوض', date: '12 april 2026' },
  { title: 'دعم تسجيل الدخول الموحد', requester: 'رهف احمد', avatar: 'ر', priority: 'متوسطة', status: 'قيد المراجعة', date: '12 april 2026' },
  { title: 'إضافة لغة إضافية للنظام', requester: 'محمد عبدالله', avatar: 'م', priority: 'منخفضة', status: 'مقبول', date: '12 april 2026' },
  { title: 'تعديل صلاحيات المستخدمين', requester: 'سارة خالد', avatar: 'س', priority: 'منخفضة', status: 'قيد المراجعة', date: '12 april 2026' },
];

function seedRequests(projectId: number): ChangeRequest[] {
  return seedRows.map((row, index) => ({
    ...row,
    id: `${projectId}-r${index + 1}`,
    schedule: '+ 5 أيام',
    cost: '+ 25,000 ريال',
    phone: '+966 50 4567 123',
    email: 'salwa@aljoud.com',
    description:
      'طلب إضافة تقارير تحليلية جديدة إلى لوحة التحكم تتضمن مؤشرات الأداء ونسب الإنجاز لكل مرحلة، مع إمكانية تصدير التقارير بصيغة PDF.',
  }));
}

const initialComments: Comment[] = [
  { id: 'c1', author: 'سارة خالد', role: 'مدير المشروع', time: 'منذ يومين', body: 'تم الموفقة على الطلب' },
];

function StatusIcon({ status }: { status: ReqStatus }) {
  if (status === 'مقبول') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'مرفوض')
    return (
      <span className="flex w-3.5 h-3.5 items-center justify-center rounded-full bg-level-high text-background">
        <X className="w-2.5 h-2.5" />
      </span>
    );
  return <HelpCircle className="w-3.5 h-3.5" />;
}

function RequestDetailView({ request, onBack }: { request: ChangeRequest; onBack: () => void }) {
  const [decision, setDecision] = useState<ReqStatus>(request.status);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim()) return;
    setComments((prev) => [...prev, { id: String(Date.now()), author: 'سارة خالد', role: 'مدير المشروع', time: 'الآن', body: text.trim() }]);
    setText('');
  }

  function decide(next: 'مقبول' | 'مرفوض') {
    setDecision(next);
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        author: 'سارة خالد',
        role: 'مدير المشروع',
        time: 'الآن',
        body: next === 'مقبول' ? 'تم الموفقة على الطلب' : 'تم رفض الطلب',
      },
    ]);
  }

  return (
    <div dir="rtl" className="tw-scope space-y-6 font-sans">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
        رجوع إلى طلبات التغيير
      </button>

      <section className="dhc-card">
        <div className="dhc-header">
          <div className="dhc-header-icon-box dhc-header-icon-box--green">
            <FileSignature />
          </div>
          <div>
            <h1 className="dhc-title">{request.title}</h1>
            <span className={`dhc-badge ${decision === 'مقبول' ? 'dhc-badge--blue' : decision === 'مرفوض' ? 'dhc-badge--red' : 'dhc-badge--orange'}`} style={{ marginTop: 8 }}>
              <Info />
              {decision === 'مقبول' ? 'تم الموافقة' : decision === 'مرفوض' ? 'تم الرفض' : 'قيد المراجعة'}
            </span>
          </div>
        </div>

        <hr className="dhc-divider" />

        <div className="dhc-meta-grid">
          <div className="dhc-meta-item">
            <span className="dhc-meta-label">التأثير على الجدول الزمني</span>
            <span className="dhc-detail-value">{request.schedule}</span>
          </div>
          <div className="dhc-meta-item">
            <span className="dhc-meta-label">التأثير على التكلفة</span>
            <span className="dhc-detail-value">{request.cost}</span>
          </div>
          <div className="dhc-meta-item">
            <span className="dhc-meta-label">تاريخ الطلب</span>
            <span className="dhc-detail-value">{request.date}</span>
          </div>
        </div>

        <hr className="dhc-divider" />

        <div className="dhc-details-grid">
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><User /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">مقدم الطلب</span>
              <span className="dhc-detail-value">{request.requester}</span>
            </div>
          </div>
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><Phone /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">الهاتف</span>
              <span className="dhc-detail-value dhc-phone-number">{request.phone}</span>
            </div>
          </div>
          <div className="dhc-detail-item">
            <span className="dhc-detail-icon"><Mail /></span>
            <div className="dhc-detail-text">
              <span className="dhc-detail-label">البريد الإلكتروني</span>
              <span className="dhc-detail-value">{request.email}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="pb-4 text-lg font-bold text-foreground">وصف الطلب</h2>
        <p className="border-t border-border pt-4 text-sm text-foreground">{request.description}</p>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={() => decide('مقبول')} className="rounded-lg bg-foreground px-8 py-2.5 text-sm font-semibold text-background hover:opacity-90">موافقة</button>
        <button type="button" onClick={() => decide('مرفوض')} className="rounded-lg bg-level-high px-8 py-2.5 text-sm font-semibold text-background hover:opacity-90">رفض</button>
      </div>

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
              <p className="mt-4 text-sm font-bold text-foreground">{c.body}</p>
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

export interface RequestDraft {
  title: string;
  priority: string;
  owner: string;
  email: string;
  schedule: string;
  cost: string;
  description: string;
}

const emptyDraft: RequestDraft = { title: '', priority: '', owner: '', email: '', schedule: '', cost: '', description: '' };

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function AddRequestDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (draft: RequestDraft) => void }) {
  const [draft, setDraft] = useState<RequestDraft>(emptyDraft);
  const set = (key: keyof RequestDraft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));

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
            <span className="project-output-modal__icon"><FileSignature size={22} /></span>
            <h2>إضافة طلب تغيير</h2>
          </div>
        </div>

        <div className="project-output-modal__divider" />

        <div className="project-output-modal__grid">
          <Field label="عنوان الطلب" value={draft.title} onChange={set('title')} />
          <Field label="الأولوية" value={draft.priority} onChange={set('priority')} />
          <Field label="مقدم الطلب" value={draft.owner} onChange={set('owner')} />
          <Field label="البريد الإلكتروني" value={draft.email} onChange={set('email')} />
          <Field label="التأثير على الجدول الزمني" value={draft.schedule} onChange={set('schedule')} />
          <Field label="التأثير على التكلفة" value={draft.cost} onChange={set('cost')} />
        </div>

        <div className="project-output-modal__files">
          <span className="project-output-modal__files-label">وصف الطلب</span>
          <textarea
            value={draft.description}
            onChange={(e) => set('description')(e.target.value)}
            rows={4}
            className="project-output-modal__textarea"
          />
        </div>

        <div className="project-output-modal__actions">
          <button type="button" className="project-output-modal__cancel" onClick={onClose}>إلغاء</button>
          <button type="button" className="project-output-modal__submit" onClick={() => onSubmit(draft)}>إرسال</button>
        </div>
      </div>
    </div>
  );
}

export function ProjectChangeRequestsView({ projectId }: { projectId: number }) {
  const [requests, setRequests] = useState<ChangeRequest[]>(() => seedRequests(projectId));
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const open = () => {
      window.dispatchEvent(new CustomEvent('clear-project-banner'));
      setIsDialogOpen(true);
    };
    window.addEventListener('open-add-request-dialog', open);
    return () => window.removeEventListener('open-add-request-dialog', open);
  }, []);

  const priorityOf = (value: string): Priority => (value.includes('عالي') ? 'عالية' : value.includes('منخفض') ? 'منخفضة' : 'متوسطة');

  function handleSubmit(draft: RequestDraft) {
    if (!draft.title.trim() || !draft.owner.trim() || !draft.priority.trim()) {
      setIsDialogOpen(false);
      window.dispatchEvent(new CustomEvent('project-banner', { detail: { tone: 'error', message: 'حدث خطأ ما ، يرجى المحاولة مرة أخرى' } }));
      return;
    }
    setRequests((prev) => [
      {
        id: String(Date.now()),
        title: draft.title.trim(),
        requester: draft.owner.trim(),
        avatar: draft.owner.trim().charAt(0),
        priority: priorityOf(draft.priority),
        status: 'قيد المراجعة',
        date: '12 april 2026',
        schedule: draft.schedule.trim() || 'لا يوجد',
        cost: draft.cost.trim() || 'لا يوجد',
        phone: '+966 50 4567 123',
        email: draft.email.trim() || 'salwa@aljoud.com',
        description: draft.description.trim() || 'لا يوجد وصف',
      },
      ...prev,
    ]);
    setIsDialogOpen(false);
    window.dispatchEvent(new CustomEvent('project-banner', { detail: { tone: 'success', message: 'تم إرسال الطلب بنجاح' } }));
  }

  if (selected) return <RequestDetailView request={selected} onBack={() => setSelected(null)} />;

  return (
    <div dir="rtl" className="tw-scope font-sans">
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_40px] items-center bg-muted px-6 py-4 text-sm font-semibold text-foreground">
          <span>عنوان الطلب</span>
          <span className="text-center">الأولوية</span>
          <span className="text-center">الحالة</span>
          <span className="text-center">مقدم الطلب</span>
          <span className="text-center">تاريخ الطلب</span>
          <span />
        </div>

        {requests.map((request) => (
          <button
            type="button"
            key={request.id}
            onClick={() => setSelected(request)}
            className="grid w-full grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_40px] items-center border-t border-border px-6 py-4 text-right hover:bg-accent"
          >
            <p className="text-sm font-bold text-foreground">{request.title}</p>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold ${priorityClass[request.priority]}`}>
                {request.priority}
              </span>
            </div>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold ${statusClass[request.status]}`}>
                <StatusIcon status={request.status} />
                {request.status}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-foreground">{request.requester}</span>
              <span className="flex w-7 h-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">{request.avatar}</span>
            </div>
            <span dir="ltr" className="text-center text-xs text-muted-foreground">{request.date}</span>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      <AddRequestDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}

export default ProjectChangeRequestsView;

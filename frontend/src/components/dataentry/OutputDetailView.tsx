import { useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, Check, FileDown, Mail, MessageCircle, MessageSquare, Phone, Plus, ThumbsDown, ThumbsUp, UserRound, X } from 'lucide-react';
import { SubpageHeader } from '../layout/SubpageHeader';
import type { Project } from './DataEntryProjectsPage';
import type { ProjectOutput } from './DataEntryCreateProjectPage';

interface Props {
  project: Project;
  output: ProjectOutput;
  onBack: () => void;
}

interface CommentItem {
  id: number;
  role: string;
  name: string;
  text: string;
  time: string;
  tone: 'green' | 'blue';
}

const documentTemplates = [
  { suffix: 'وثيقة المتطلبات', ext: 'docx', type: 'DOC', size: '2.4 MB' },
  { suffix: 'المخطط التنفيذي', ext: 'docx', type: 'DOC', size: '1.8 MB' },
  { suffix: 'مخطط البيانات', ext: 'xlsx', type: 'XLSX', size: '3.1 MB' },
  { suffix: 'تقرير الاختبار', ext: 'pdf', type: 'PDF', size: '4.7 MB' },
  { suffix: 'التصميم التفصيلي', ext: 'fig', type: 'FIG', size: '5.2 MB' },
  { suffix: 'خطة التنفيذ', ext: 'xlsx', type: 'XLSX', size: '1.6 MB' },
  { suffix: 'تقرير المراجعة', ext: 'pdf', type: 'PDF', size: '3.8 MB' },
  { suffix: 'محضر الاعتماد', ext: 'docx', type: 'DOC', size: '1.2 MB' },
];

function commentTemplates(project: Project) {
  return [
  {
    role: 'مدير المشروع',
    tone: 'green' as const,
    text: (output: ProjectOutput) => `تمت مراجعة ${output.name} ضمن مشروع ${project.name} مع الفريق، وتم التأكد من أن المتطلبات المرتبطة بالمخرج واضحة وجاهزة للمتابعة ضمن الجدول المحدد.`,
  },
  {
    role: 'QA Lead',
    tone: 'blue' as const,
    text: (output: ProjectOutput) => `يرجى توثيق نتائج المراجعة الخاصة بـ${output.name} في مشروع ${project.name} وإرفاق آخر نسخة معتمدة قبل الانتقال إلى الخطوة التالية.`,
  },
  {
    role: 'قائد الفريق التقني',
    tone: 'green' as const,
    text: (output: ProjectOutput) => `تمت مطابقة تفاصيل ${output.name} مع النشاط المرتبط في مشروع ${project.name}، ولا توجد ملاحظات تمنع استكمال التنفيذ في المرحلة الحالية.`,
  },
  {
    role: 'محلل الأعمال',
    tone: 'blue' as const,
    text: (output: ProjectOutput) => `تحتاج ${output.name} في مشروع ${project.name} إلى مراجعة نهائية من أصحاب المصلحة قبل اعتماد النسخة الحالية كمرجع رسمي للمشروع.`,
  },
  ];
}

function stableNumber(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function uniqueOutputDetails(project: Project, output: ProjectOutput) {
  const seed = stableNumber(`${project.id}|${project.name}|${output.id}|${output.name}|${output.stage}`);
  const first = documentTemplates[seed % documentTemplates.length];
  const second = documentTemplates[(seed + 3) % documentTemplates.length];
  const safeName = output.name.trim().replace(/\s+/g, '-').replace(/[^\u0600-\u06FF\w-]/g, '').slice(0, 42) || `output-${output.id}`;
  const date = formatDate(output.endDate || output.startDate);
  const files = [first, second].map((template, index) => ({
    name: `${project.id}-${safeName}-${template.suffix}.${template.ext}`,
    date,
    size: template.size,
    type: template.type,
    key: `${output.id}-${index}-${template.ext}`,
  }));
  const comments: CommentItem[] = [0, 1].map((offset) => {
    const templates = commentTemplates(project);
    const template = templates[(seed + offset) % templates.length];
    return {
      id: seed + offset + 1,
      role: template.role,
      name: offset === 0 ? 'سارة خالد' : 'أحمد العمري',
      text: template.text(output),
      time: offset === 0 ? 'منذ يومين' : 'منذ يوم',
      tone: template.tone,
    };
  });
  return { files, comments };
}

function formatDate(value?: string) {
  if (!value) return '—';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function partyContact(project: Project) {
  const raw = project.details.parties?.[0] || '';
  const parts = raw.split('·').map((part) => part.trim()).filter(Boolean);
  return {
    name: parts[0] || 'أحمد العمري',
    phone: parts.find((part) => /\+?\d/.test(part)) || '+966 50 4567 123',
    email: parts.find((part) => part.includes('@')) || 'ahmad@aljoud.com',
  };
}

export default function OutputDetailView({ project, output, onBack }: Props) {
  const contact = useMemo(() => partyContact(project), [project]);
  const outputDetails = useMemo(() => uniqueOutputDetails(project, output), [project, output]);
  const [comments, setComments] = useState<CommentItem[]>(outputDetails.comments);
  const [comment, setComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stage = project.details.stages.find((item) => item.name === output.stage)
    || project.details.stages[Math.max(0, output.stageNumber - 1)];
  const activity = stage?.activities?.find((item) => item.name === output.name)?.name
    || stage?.activities?.[Math.max(0, output.stageNumber - 1)]?.name
    || stage?.activities?.[0]?.name
    || `نشاط مرتبط بـ ${output.name}`;
  const files = output.files?.length
    ? output.files.map((name, index) => ({
        name,
        date: formatDate(output.endDate || output.startDate),
        size: `${1 + ((stableNumber(`${project.id}-${output.id}-${index}`) % 47) / 10).toFixed(1)} MB`,
        type: name.split('.').pop()?.toUpperCase() || 'FILE',
        key: `${output.id}-${name}-${index}`,
      }))
    : outputDetails.files;

  const todayLabel = formatDate(new Date().toISOString().slice(0, 10));
  const newFiles = uploadedFiles.map((file, index) => ({
    name: file.name,
    date: todayLabel,
    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
    key: `upload-${index}-${file.name}`,
  }));
  const allFiles = [...files, ...newFiles];

  const addFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    setUploadedFiles((current) => [...current, ...Array.from(list)]);
  };

  const submitComment = () => {
    const value = comment.trim();
    if (!value) return;
    setComments((current) => [
      ...current,
      { id: Date.now(), role: 'مدير المشروع', name: contact.name, text: value, time: 'الآن', tone: 'green' },
    ]);
    setComment('');
  };

  return (
    <div className="output-detail" dir="rtl">
      <SubpageHeader
        parent="المشاريع"
        ancestors={[project.name, 'المخرجات']}
        title={output.name}
        onBack={onBack}
      />

      <main className="output-detail__body">
        <section className="output-detail__card output-detail__summary">
          <div className="output-detail__summary-main">
            <div className="output-detail__title-row">
              <div className="output-detail__title-wrap">
                <h1>{output.name}</h1>
                <span className="output-detail__badge">{output.outputType || 'وثيقة'}</span>
              </div>
              <div className="output-detail__status-icon"><Check size={24} strokeWidth={1.8} /></div>
            </div>

            <div className="output-detail__meta-grid">
              <InfoItem label="النشاط المرتبط" value={activity} icon={<MessageCircle size={21} />} />
              <InfoItem label="تاريخ استحقاق المخرج" value={formatDate(output.endDate)} icon={<CalendarDays size={21} />} />
              <InfoItem label="المرحلة" value={output.stage || `المرحلة ${output.stageNumber}`} icon={<CalendarDays size={21} />} />
            </div>
            <div className="output-detail__separator" />
            <div className="output-detail__meta-grid">
              <InfoItem label="البريد الإلكتروني" value={output.email || contact.email} icon={<Mail size={21} />} />
              <InfoItem label="الهاتف" value={contact.phone} icon={<Phone size={21} />} dir="ltr" />
              <InfoItem label="المسؤول" value={output.riskOwner || contact.name} icon={<UserRound size={21} />} />
            </div>
          </div>
        </section>

        <section className="output-detail__card output-detail__description">
          <h2>وصف المخرج</h2>
          <div className="output-detail__separator" />
          <p>{output.description || `مستندات وتفاصيل تنفيذية خاصة بمخرج ${output.name} ضمن ${output.stage || `المرحلة ${output.stageNumber}`}، وتشمل المتطلبات والمراجعات المرتبطة بهذا المخرج.`}</p>
        </section>

        <section className="output-detail__card output-detail__files">
          <div className="output-detail__section-heading">
            <h2>ملفات المخرج</h2>
            <span>{allFiles.length} ملفات</span>
          </div>
          <div className="output-detail__separator" />
          <div className="output-detail__file-list">
            {allFiles.map((file) => (
              <div className="output-detail__file" key={file.key}>
                <div className="output-detail__file-main">
                  <div className="output-detail__file-type">{file.type}</div>
                  <div className="output-detail__file-info">
                    <strong>{file.name}</strong>
                    <span>رُفع {file.date} <i /> {file.size}</span>
                  </div>
                </div>
                <div className="output-detail__file-actions">
                  <button type="button" aria-label="حذف الملف"><X size={16} /></button>
                  <button type="button" aria-label="تنزيل الملف"><FileDown size={16} /></button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="output-detail__dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
            >
              <span className="output-detail__upload-icon"><Plus size={24} strokeWidth={1.5} /></span>
              <strong>اسحب الملفات هنا أو انقر للاختيار</strong>
              <span>PDF,DOCS,XLSX,PNG,JPG,FIG</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.fig"
              className="output-detail__file-input"
              onChange={(event) => {
                addFiles(event.target.files);
                event.currentTarget.value = '';
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-card tw-scope font-sans">
          <h2 className="pb-4 text-lg font-bold text-foreground">التعليقات</h2>

          <div className="space-y-6 border-t border-border pt-6">
            {comments.map((item) => (
              <div key={item.id} className="border-b border-border pb-6 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                      <p className="text-sm font-bold text-foreground">{item.name}</p>
                    </div>
                    <span className="flex w-10 h-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-4 text-sm font-bold text-foreground">{item.text}</p>
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
                <p className="text-sm font-bold text-foreground">{contact.name}</p>
              </div>
              <span className="flex w-10 h-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                {contact.name.charAt(0)}
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">إضافة تعليق</p>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="مثال"
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
            />
            <div className="mt-4 flex justify-start gap-3">
              <button type="button" onClick={submitComment} className="rounded-lg bg-foreground px-8 py-2.5 text-sm font-semibold text-background hover:opacity-90">إرسال</button>
              <button type="button" onClick={() => setComment('')} className="rounded-lg border border-border bg-card px-8 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">إلغاء</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoItem({ label, value, icon, dir }: { label: string; value: string; icon: ReactNode; dir?: 'rtl' | 'ltr' }) {
  return (
    <div className="output-detail__info-item">
      <div>
        <small>{label}</small>
        <strong dir={dir}>{value}</strong>
      </div>
      <span>{icon}</span>
    </div>
  );
}

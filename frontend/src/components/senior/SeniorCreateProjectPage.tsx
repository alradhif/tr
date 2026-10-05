import { useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { SubpageHeader } from '../layout/SubpageHeader';
import './senior-create-project.css';

export interface ProjectActivity {
  id: number;
  name: string;
  owner: string;
  startDate: string;
  endDate: string;
}

export interface ProjectStage {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  activities: ProjectActivity[];
}

export interface ProjectOutput {
  id: number;
  name: string;
  stage: string;
  stageNumber: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'planned';
  outputType?: string;
  description?: string;
  riskOwner?: string;
  email?: string;
  files?: string[];
}

export interface CreatedProjectData {
  name: string;
  type: string;
  category: string;
  executingEntity: string;
  description: string;
  startDate: string;
  endDate: string;
  contractNumber: string;
  contractingEntity: string;
  contractDate: string;
  contractEndDate: string;
  contractStatus: string;
  contractValue: string;
  contractStartDate: string;
  totalBudget: string;
  parties: string[];
  stages: ProjectStage[];
  outputs?: ProjectOutput[];
}

interface Props {
  onBack: () => void;
  onSave: (project: CreatedProjectData) => void;
  onValidationError?: (message: string) => void;
  initialData?: CreatedProjectData;
  mode?: 'create' | 'edit';
}

const makeEmptyStage = (id: number): ProjectStage => ({
  id,
  name: '',
  status: '',
  startDate: '',
  endDate: '',
  activities: [],
});

const initialForm: CreatedProjectData = {
  name: '',
  type: '',
  category: '',
  executingEntity: '',
  description: '',
  startDate: '',
  endDate: '',
  contractNumber: '',
  contractingEntity: '',
  contractDate: '',
  contractEndDate: '',
  contractStatus: '',
  contractValue: '',
  contractStartDate: '',
  totalBudget: '',
  parties: ['سارة محمد · +966 50 4567 123 · salwa@aljoud.com'],
  stages: [makeEmptyStage(1)],
};

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'number';
  options?: string[];
}) {
  return (
    <label className="create-project__field">
      <span>{label}</span>
      {options ? (
        <div className="create-project__input-wrap create-project__select-wrap">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">اختر</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronLeft size={12} className="create-project__select-chevron" />
        </div>
      ) : (
        <div className={`create-project__input-wrap ${type === 'date' ? 'create-project__date-wrap' : ''}`}>
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => {
              if (type === 'date') {
                const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                input.showPicker?.();
              }
            }}
            onKeyDown={(e) => {
              if (type === 'date' && (e.key === 'Enter' || e.key === ' ')) {
                const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                input.showPicker?.();
              }
            }}
          />
          {type === 'date' && <CalendarDays size={15} className="create-project__date-icon" aria-hidden />}
        </div>
      )}
    </label>
  );
}

function ReviewField({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`create-project__review-field ${full ? 'create-project__review-field--full' : ''}`}>
      <span>{label}</span>
      <div>{value || 'غير محدد'}</div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ['معلومات أساسية', 'المراحل والجدول', 'مراجعة نهائية'];
  return (
    <div className="create-project__steps">
      {steps.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const complete = number < step;
        return (
          <div className="create-project__step" key={label}>
            <div className={`create-project__step-circle ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}>
              {number}
            </div>
            <span className={active ? 'is-active' : ''}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function monthPosition(date: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const daysInMonth = new Date(parsed.getFullYear(), month + 1, 0).getDate();
  return ((month + (day - 1) / daysInMonth) / 12) * 100;
}

function Timeline({ stages }: { stages: ProjectStage[] }) {
  const visibleStages = stages.filter((stage) => stage.name.trim() && stage.startDate && stage.endDate);

  return (
    <section className="create-project__timeline-card">
      <div className="create-project__timeline-title-row">
        <div className="create-project__timeline-icon">▣</div>
        <h2>تحديد الجدول الزمني</h2>
      </div>

      <div className="create-project__timeline-grid">
        <div className="create-project__timeline-months">
          {months.map((month) => <div key={month}>{month}</div>)}
        </div>
        <div className="create-project__timeline-body">
          {visibleStages.map((stage, index) => {
            const start = monthPosition(stage.startDate);
            const end = monthPosition(stage.endDate);
            if (start === null || end === null) return null;
            const left = Math.max(0, Math.min(100, start));
            const right = Math.max(left + 2, Math.min(100, end));
            const top = 18 + (index % 5) * 31;
            const colors = ['#f9d9d7', '#ccefe0', '#d5e9fe', '#a8d6a2', '#f9e2c4'];
            return (
              <div
                className="create-project__timeline-bar"
                key={stage.id}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(5, right - left)}%`,
                  top,
                  background: colors[index % colors.length],
                }}
                title={`${stage.name} — ${stage.startDate} إلى ${stage.endDate}`}
              >
                <span>{stage.startDate} - {stage.endDate}</span>
                <strong>{stage.name}</strong>
              </div>
            );
          })}
          {visibleStages.length === 0 && <div className="create-project__timeline-empty">أضف تواريخ المراحل لعرضها هنا</div>}
        </div>
      </div>
    </section>
  );
}

export function SeniorCreateProjectPage({ onBack, onSave, onValidationError, initialData, mode = 'create' }: Props) {
  const [form, setForm] = useState(initialData ?? initialForm);
  const isEdit = mode === 'edit';
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [contractFile, setContractFile] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof CreatedProjectData>(key: K, value: CreatedProjectData[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError('');
  };

  const updateStage = (stageId: number, key: keyof ProjectStage, value: string) => {
    setForm((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) => stage.id === stageId ? { ...stage, [key]: value } : stage),
    }));
    setError('');
  };

  const addParty = () => update('parties', [...form.parties, 'طرف مشروع جديد']);

  const removeParty = (index: number) => {
    if (form.parties.length === 1) return;
    update('parties', form.parties.filter((_, i) => i !== index));
  };

  const addStage = () => update('stages', [...form.stages, makeEmptyStage(Date.now())]);

  const removeStage = (stageId: number) => {
    if (form.stages.length === 1) return;
    update('stages', form.stages.filter((stage) => stage.id !== stageId));
  };

  const addActivity = (stageId: number) => {
    setForm((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) => stage.id === stageId ? {
        ...stage,
        activities: [...stage.activities, { id: Date.now(), name: '', owner: '', startDate: '', endDate: '' }],
      } : stage),
    }));
  };

  const updateActivity = (stageId: number, activityId: number, key: keyof ProjectActivity, value: string) => {
    setForm((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) => stage.id === stageId ? {
        ...stage,
        activities: stage.activities.map((activity) => activity.id === activityId ? { ...activity, [key]: value } : activity),
      } : stage),
    }));
  };

  const removeActivity = (stageId: number, activityId: number) => {
    setForm((previous) => ({
      ...previous,
      stages: previous.stages.map((stage) => stage.id === stageId ? {
        ...stage,
        activities: stage.activities.filter((activity) => activity.id !== activityId),
      } : stage),
    }));
  };

  const handleContractUpload = (file?: File) => {
    if (!file) return;
    setContractFile(file.name);
    setForm((previous) => ({
      ...previous,
      name: previous.name || file.name.replace(/\.[^/.]+$/, ''),
      contractNumber: previous.contractNumber || 'CNT-2026-001',
      contractValue: previous.contractValue || '1,250,000',
      contractStatus: previous.contractStatus || 'ساري',
      contractingEntity: previous.contractingEntity || 'الجهة المتعاقدة',
    }));
  };

  const next = () => {
    if (step === 1 && !form.name.trim()) {
      setError('يرجى إدخال اسم المشروع قبل المتابعة.');
      return;
    }
    setError('');
    setStep((current) => Math.min(3, current + 1));
  };

  const validateForSubmission = () => {
    const requiredFields: Array<[string, string]> = [
      ['name', 'اسم المشروع'],
      ['type', 'نوع المشروع'],
      ['category', 'تصنيف المشروع'],
      ['executingEntity', 'الجهة المنفذة'],
      ['description', 'وصف مختصر'],
      ['startDate', 'تاريخ بداية المشروع'],
      ['endDate', 'تاريخ نهاية المشروع'],
      ['contractNumber', 'رقم العقد'],
      ['contractingEntity', 'الجهة المتعاقد معها'],
      ['contractDate', 'تاريخ التوقيع'],
      ['contractStatus', 'حالة العقد'],
      ['contractStartDate', 'تاريخ بداية العقد'],
      ['contractEndDate', 'تاريخ نهاية العقد'],
      ['totalBudget', 'الميزانية الإجمالية'],
    ];

    const missingField = requiredFields.find(([key]) => {
      const value = form[key as keyof CreatedProjectData];
      return typeof value === 'string' ? !value.trim() : !value;
    });

    if (missingField) {
      return `يرجى استكمال ${missingField[1]} قبل حفظ المشروع.`;
    }

    const projectStart = new Date(`${form.startDate}T00:00:00`).getTime();
    const projectEnd = new Date(`${form.endDate}T00:00:00`).getTime();
    const contractStart = new Date(`${form.contractStartDate}T00:00:00`).getTime();
    const contractEnd = new Date(`${form.contractEndDate}T00:00:00`).getTime();

    if (projectEnd < projectStart) {
      return 'تاريخ نهاية المشروع يجب أن يكون بعد تاريخ البداية.';
    }

    if (contractEnd < contractStart) {
      return 'تاريخ نهاية العقد يجب أن يكون بعد تاريخ بداية العقد.';
    }

    if (form.parties.length === 0 || form.parties.some((party) => !party.trim())) {
      return 'يرجى استكمال أطراف المشروع قبل حفظ المشروع.';
    }

    if (form.stages.length === 0) {
      return 'يرجى إضافة مرحلة واحدة على الأقل قبل حفظ المشروع.';
    }

    for (let index = 0; index < form.stages.length; index += 1) {
      const stage = form.stages[index];
      if (!stage.name.trim() || !stage.status.trim() || !stage.startDate || !stage.endDate) {
        return `يرجى استكمال بيانات المرحلة ${index + 1} قبل حفظ المشروع.`;
      }

      const stageStart = new Date(`${stage.startDate}T00:00:00`).getTime();
      const stageEnd = new Date(`${stage.endDate}T00:00:00`).getTime();
      if (stageEnd < stageStart) {
        return `تاريخ نهاية المرحلة ${index + 1} يجب أن يكون بعد تاريخ البداية.`;
      }

      for (let activityIndex = 0; activityIndex < stage.activities.length; activityIndex += 1) {
        const activity = stage.activities[activityIndex];
        if (!activity.name.trim() || !activity.owner.trim() || !activity.startDate || !activity.endDate) {
          return `يرجى استكمال بيانات النشاط ${activityIndex + 1} في المرحلة ${index + 1}.`;
        }

        const activityStart = new Date(`${activity.startDate}T00:00:00`).getTime();
        const activityEnd = new Date(`${activity.endDate}T00:00:00`).getTime();
        if (activityEnd < activityStart) {
          return `تاريخ نهاية النشاط ${activityIndex + 1} في المرحلة ${index + 1} يجب أن يكون بعد تاريخ البداية.`;
        }
      }
    }

    return null;
  };

  const saveDraft = () => onSave(form);

  const submitProject = () => {
    const validationError = validateForSubmission();
    if (validationError) {
      setError(validationError);
      onValidationError?.(validationError);
      return;
    }

    setError('');
    onSave(form);
  };

  return (
    <div className="create-project" dir="rtl">
      <SubpageHeader
        parent="المشاريع"
        title={isEdit ? 'تعديل مشروع' : 'إنشاء مشروع جديد'}
        subtitle="أدخل بيانات المشروع خطوة بخطوة"
        onBack={onBack}
      />

      <div className="create-project__body">
        <Stepper step={step} />

        <section className="create-project__upload">
          <button type="button" className="create-project__upload-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(event) => handleContractUpload(event.target.files?.[0])} />
          <div className="create-project__upload-copy">
            <strong>ارفع ملف العقد وسيتم ملء الحقول تلقائياً</strong>
            <span>يدعم PDF وWord — سيتم استخراج البيانات الأساسية من العقد.</span>
            {contractFile && <small><FileText size={14} /> {contractFile}</small>}
          </div>
          <div className="create-project__upload-icon"><FileText size={24} /></div>
        </section>

        {step === 1 && (
          <>
            <section className="create-project__card">
              <h2>معلومات المشروع</h2>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <Field label="اسم المشروع" value={form.name} onChange={(v) => update('name', v)} />
                <Field label="نوع المشروع" value={form.type} onChange={(v) => update('type', v)} options={['تشغيلي', 'تقني', 'استراتيجي', 'إنشائي']} />
                <Field label="تصنيف المشروع" value={form.category} onChange={(v) => update('category', v)} options={['تقنية المعلومات', 'التطوير المؤسسي', 'الخدمات', 'البنية التحتية']} />
                <Field label="الجهة المنفذة" value={form.executingEntity} onChange={(v) => update('executingEntity', v)} options={['شركة A', 'شركة B', 'الإدارة الداخلية']} />
              </div>
              <label className="create-project__field create-project__field--full">
                <span>وصف مختصر</span>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
              </label>
              <div className="create-project__grid">
                <Field label="تاريخ البداية" value={form.startDate} onChange={(v) => update('startDate', v)} type="date" />
                <Field label="تاريخ النهاية" value={form.endDate} onChange={(v) => update('endDate', v)} type="date" />
              </div>
            </section>

            <section className="create-project__card">
              <h2>الميزانية وتفاصيل العقد</h2>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <Field label="رقم العقد" value={form.contractNumber} onChange={(v) => update('contractNumber', v)} />
                <Field label="الجهة المتعاقد معها" value={form.contractingEntity} onChange={(v) => update('contractingEntity', v)} options={['شركة A', 'شركة B', 'جهة حكومية']} />
                <Field label="تاريخ التوقيع" value={form.contractDate} onChange={(v) => update('contractDate', v)} type="date" />
                <Field label="حالة العقد" value={form.contractStatus} onChange={(v) => update('contractStatus', v)} options={['ساري', 'منتهي', 'معلق', 'ملغي']} />
                <Field label="تاريخ بداية العقد" value={form.contractStartDate} onChange={(v) => update('contractStartDate', v)} type="date" />
                <Field label="تاريخ نهاية العقد" value={form.contractEndDate} onChange={(v) => update('contractEndDate', v)} type="date" />
              </div>
              <label className="create-project__field create-project__field--full">
                <span>الميزانية الإجمالية (ر.س)</span>
                <input value={form.totalBudget} onChange={(e) => update('totalBudget', e.target.value)} type="number" />
              </label>
            </section>

            <section className="create-project__card create-project__parties">
              <h2>أطراف المشروع</h2>
              <div className="create-project__divider" />
              <div className="create-project__party-list">
                {form.parties.map((party, index) => (
                  <div className="create-project__party" key={`${party}-${index}`}>
                    <button type="button" onClick={() => removeParty(index)} aria-label="حذف الطرف" disabled={form.parties.length === 1}><Trash2 size={17} /></button>
                    <div className="create-project__party-avatar">{index === 0 ? 'س' : 'م'}</div>
                    <div className="create-project__party-copy"><strong>مدير المشروع</strong><span>{party}</span></div>
                  </div>
                ))}
              </div>
              <button type="button" className="create-project__add-party" onClick={addParty}>إضافة <Plus size={17} /></button>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <Timeline stages={form.stages} />

            <section className="create-project__stages-card">
              <h2>مراحل المشروع</h2>
              {form.stages.map((stage, index) => (
                <div className="create-project__stage-card" key={stage.id}>
                  <div className="create-project__stage-heading">
                    <button type="button" onClick={() => removeStage(stage.id)} disabled={form.stages.length === 1} aria-label="حذف المرحلة"><Trash2 size={16} /></button>
                    <div className="create-project__stage-number">{index + 1}</div>
                    <h3>{stage.name || `المرحلة ${index + 1}`}</h3>
                  </div>

                  <div className="create-project__grid">
                    <Field label="اسم المرحلة" value={stage.name} onChange={(v) => updateStage(stage.id, 'name', v)} />
                    <Field label="الحالة" value={stage.status} onChange={(v) => updateStage(stage.id, 'status', v)} options={['لم تبدأ', 'قيد التنفيذ', 'مكتملة', 'متأخرة']} />
                    <Field label="تاريخ البداية" value={stage.startDate} onChange={(v) => updateStage(stage.id, 'startDate', v)} type="date" />
                    <Field label="تاريخ النهاية" value={stage.endDate} onChange={(v) => updateStage(stage.id, 'endDate', v)} type="date" />
                  </div>

                  <div className="create-project__activities">
                    <h4>الأنشطة</h4>
                    {stage.activities.map((activity) => (
                      <div className="create-project__activity" key={activity.id}>
                        <button type="button" onClick={() => removeActivity(stage.id, activity.id)} aria-label="حذف النشاط"><Trash2 size={15} /></button>
                        <div className="create-project__activity-fields">
                          <Field label="اسم النشاط" value={activity.name} onChange={(v) => updateActivity(stage.id, activity.id, 'name', v)} placeholder="تحليل متطلبات النظام" />
                          <Field label="المسؤول" value={activity.owner} onChange={(v) => updateActivity(stage.id, activity.id, 'owner', v)} placeholder="سارة خالد" />
                          <Field label="تاريخ البداية" value={activity.startDate} onChange={(v) => updateActivity(stage.id, activity.id, 'startDate', v)} type="date" />
                          <Field label="تاريخ النهاية" value={activity.endDate} onChange={(v) => updateActivity(stage.id, activity.id, 'endDate', v)} type="date" />
                        </div>
                      </div>
                    ))}
                    <button type="button" className="create-project__add-activity" onClick={() => addActivity(stage.id)}>إضافة نشاط جديد <Plus size={18} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="create-project__add-stage" onClick={addStage}>إضافة مرحلة جديدة <Plus size={18} /></button>
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <section className="create-project__review-section">
              <div className="create-project__review-section-title">
                <h2>معلومات المشروع</h2>
                <span>مراجعة بيانات الصفحة الأولى</span>
              </div>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <ReviewField label="اسم المشروع" value={form.name} />
                <ReviewField label="نوع المشروع" value={form.type} />
                <ReviewField label="تصنيف المشروع" value={form.category} />
                <ReviewField label="الجهة المنفذة" value={form.executingEntity} />
              </div>
              <ReviewField label="وصف مختصر" value={form.description} full />
              <div className="create-project__grid">
                <ReviewField label="تاريخ البداية" value={form.startDate} />
                <ReviewField label="تاريخ النهاية" value={form.endDate} />
              </div>
            </section>

            <section className="create-project__review-section">
              <div className="create-project__review-section-title">
                <h2>الميزانية وتفاصيل العقد</h2>
                <span>بيانات العقد والميزانية</span>
              </div>
              <div className="create-project__divider" />
              <div className="create-project__grid">
                <ReviewField label="رقم العقد" value={form.contractNumber} />
                <ReviewField label="الجهة المتعاقد معها" value={form.contractingEntity} />
                <ReviewField label="تاريخ التوقيع" value={form.contractDate} />
                <ReviewField label="حالة العقد" value={form.contractStatus} />
                <ReviewField label="تاريخ بداية العقد" value={form.contractStartDate} />
                <ReviewField label="تاريخ نهاية العقد" value={form.contractEndDate} />
              </div>
              <ReviewField label="الميزانية الإجمالية (ر.س)" value={form.totalBudget} full />
            </section>

            <section className="create-project__review-section create-project__parties">
              <div className="create-project__review-section-title">
                <h2>أطراف المشروع</h2>
                <span>الأطراف المرتبطة بالمشروع</span>
              </div>
              <div className="create-project__divider" />
              <div className="create-project__party-list">
                {form.parties.map((party, index) => (
                  <div className="create-project__party" key={`${party}-${index}`}>
                    <div className="create-project__party-avatar">{index + 1}</div>
                    <span>{party || 'غير محدد'}</span>
                  </div>
                ))}
              </div>
            </section>

            <Timeline stages={form.stages} />

            <section className="create-project__stages-card create-project__review-stages">
              <div className="create-project__review-section-title">
                <h2>مراحل المشروع</h2>
                <span>مراجعة جميع المراحل والأنشطة</span>
              </div>
              {form.stages.map((stage, index) => (
                <div className="create-project__stage-card" key={stage.id}>
                  <div className="create-project__stage-heading">
                    <div className="create-project__stage-number">{index + 1}</div>
                    <h3>{stage.name || `المرحلة ${index + 1}`}</h3>
                  </div>

                  <div className="create-project__grid">
                    <ReviewField label="اسم المرحلة" value={stage.name} />
                    <ReviewField label="الحالة" value={stage.status} />
                    <ReviewField label="تاريخ البداية" value={stage.startDate} />
                    <ReviewField label="تاريخ النهاية" value={stage.endDate} />
                  </div>

                  <div className="create-project__activities">
                    <h4>الأنشطة</h4>
                    {stage.activities.length === 0 ? (
                      <div className="create-project__no-activities">لا توجد أنشطة مضافة لهذه المرحلة.</div>
                    ) : (
                      stage.activities.map((activity) => (
                        <div className="create-project__activity create-project__activity--review" key={activity.id}>
                          <div className="create-project__activity-fields">
                            <ReviewField label="اسم النشاط" value={activity.name} />
                            <ReviewField label="المسؤول" value={activity.owner} />
                            <ReviewField label="تاريخ البداية" value={activity.startDate} />
                            <ReviewField label="تاريخ النهاية" value={activity.endDate} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {error && <div className="create-project__error">{error}</div>}

        <footer className="create-project__actions">
          {step === 1 && (
            <>
              <button type="button" className="create-project__next" onClick={next}>التالي <ArrowRight size={16} /></button>
              <button type="button" className="create-project__draft" onClick={saveDraft}>حفظ كمسودة</button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" className="create-project__cancel" onClick={onBack}>إلغاء</button>
              <button type="button" className="create-project__draft" onClick={saveDraft}>حفظ كمسودة</button>
              <button type="button" className="create-project__previous" onClick={() => setStep(1)}>السابق</button>
              <button type="button" className="create-project__next" onClick={next}>التالي <ArrowRight size={16} /></button>
            </>
          )}

          {step === 3 && (
            <>
              <button type="button" className="create-project__previous" onClick={() => setStep(2)}>السابق</button>
              <button type="button" className="create-project__next create-project__save-project" onClick={submitProject}>حفظ المشروع</button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus2, Upload } from 'lucide-react';
import { FeedbackBanner } from '../ui/FeedbackBanner';
import { SubpageHeader } from '../layout/SubpageHeader';
import type { Project } from './SeniorProjectsPage';
import DepartmentCard from '../projectDetails/DepartmentCard';
import KpiGrid from '../projectDetails/KpiGrid';
import ContractDetailsCard from '../projectDetails/ContractDetailsCard';
import BudgetDetailsCard from '../projectDetails/BudgetDetailsCard';
import PartiesCard, { type ProjectParty } from '../projectDetails/PartiesCard';
import TabsNav from '../projectDetails/TabsNav';
import ProjectStagesView from './ProjectStagesView';
import ProjectOutputsView from './ProjectOutputsView';
import { SeniorCreateProjectPage } from './SeniorCreateProjectPage';
import OutputDetailView from './OutputDetailView';
import { ProjectRisksView } from './ProjectRisksView';
import { ProjectChangeRequestsView } from './ProjectChangeRequestsView';
import { ProjectWhatIfView } from './ProjectWhatIfView';
import type { ContractDetails, BudgetDetails, RiskBreakdown } from '../../types/projectDetails';
import type { ProjectOutput } from './SeniorCreateProjectPage';
import './senior-project-detail.css';

interface SeniorProjectDetailPageProps {
  project: Project;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  onDelete?: (id: number) => void;
}

const statusLabels: Record<Project['status'], string> = {
  delayed: 'تأخير',
  struggling: 'متعثر',
  completed: 'مكتمل',
  ontrack: 'على المسار',
};

const statusColors: Record<Project['status'], string> = {
  delayed: '#f79009',
  struggling: '#f04438',
  completed: '#17b26a',
  ontrack: '#2e90fa',
};

function amount(value: string) {
  return Number(String(value || '0').replace(/,/g, '')) || 0;
}

function daysUntil(date: string) {
  if (!date) return 0;
  const target = new Date(`${date}T00:00:00`).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

function contractStatus(value: string): ContractDetails['status'] {
  if (value === 'منتهي') return 'expired';
  if (value === 'قيد الانتظار') return 'pending';
  return 'active';
}

function partyFromString(value: string, index: number): ProjectParty {
  const parts = value.split('·').map((part) => part.trim()).filter(Boolean);
  return {
    role: index === 0 ? 'مدير المشروع - المورد' : 'مدير المشروع - العميل',
    contact: parts.join('  ·  '),
    tag: index === 0 ? 'مورد' : 'العميل',
    initial: (parts[0] || 'م').charAt(0),
  };
}

type OutputBanner = 'success' | 'error' | null;

interface AddOutputForm {
  name: string;
  stageId: string;
  outputType: string;
  description: string;
  riskOwner: string;
  email: string;
  files: File[];
}

const emptyOutputForm: AddOutputForm = {
  name: '',
  stageId: '',
  outputType: '',
  description: '',
  riskOwner: '',
  email: '',
  files: [],
};

function outputsFromProjectStages(stages: Project['details']['stages'], projectName: string): ProjectOutput[] {
  return stages.flatMap((stage, stageIndex) => {
    const activities = stage.activities.length
      ? stage.activities
      : [{ id: stage.id * 100, name: `مخرج المرحلة ${stageIndex + 1}`, owner: '', startDate: stage.startDate, endDate: stage.endDate }];

    return activities.map((activity, activityIndex): ProjectOutput => ({
      id: Number(`${stage.id}${activity.id}${activityIndex}`.replace(/\D/g, '').slice(0, 12)) || Date.now() + activityIndex,
      name: activity.name?.trim() || `${projectName} — مخرج ${activityIndex + 1}`,
      stage: stage.name?.trim() || `المرحلة ${stageIndex + 1}`,
      stageNumber: stageIndex + 1,
      startDate: activity.startDate || stage.startDate || '',
      endDate: activity.endDate || stage.endDate || '',
      status: completedWords.includes(stage.status) ? 'completed' : 'planned',
    }));
  }).slice(0, 12);
}

const completedWords = ['مكتمل', 'completed', 'منجز'];

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function detailsOutputs(outputs: ProjectOutput[] | undefined, stages: Project['details']['stages'], projectName: string) {
  return outputs?.length ? outputs : outputsFromProjectStages(stages, projectName);
}

export function SeniorProjectDetailPage({ project, onBack, onUpdateProject, onDelete }: SeniorProjectDetailPageProps) {
  const [activeTabId, setActiveTabId] = useState('overview');
  const initialOutputs = useMemo(
    () => detailsOutputs(project.details.outputs, project.details.stages, project.name),
    [project.details.outputs, project.details.stages, project.name],
  );
  const [projectOutputs, setProjectOutputs] = useState<ProjectOutput[]>(initialOutputs);
  const [isAddOutputOpen, setIsAddOutputOpen] = useState(false);
  const [outputForm, setOutputForm] = useState<AddOutputForm>(emptyOutputForm);
  const [outputBanner, setOutputBanner] = useState<OutputBanner>(null);
  const [actionBanner, setActionBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<ProjectOutput | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!outputBanner) return;
    const timer = window.setTimeout(() => setOutputBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [outputBanner]);

  useEffect(() => {
    if (!actionBanner) return;
    const timer = window.setTimeout(() => setActionBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [actionBanner]);

  useEffect(() => {
    const onBanner = (event: Event) => {
      const detail = (event as CustomEvent<{ tone: 'success' | 'error'; message: string }>).detail;
      if (detail) setActionBanner(detail);
    };
    const onClear = () => setActionBanner(null);
    window.addEventListener('project-banner', onBanner);
    window.addEventListener('clear-project-banner', onClear);
    return () => {
      window.removeEventListener('project-banner', onBanner);
      window.removeEventListener('clear-project-banner', onClear);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const details = project.details;
  const totalBudget = amount(details.totalBudget || details.contractValue);
  const spent = project.progress > 0 ? Math.round(totalBudget * (project.progress / 100) * 0.55) : 0;
  const remaining = Math.max(0, totalBudget - spent);
  const contractDetails: ContractDetails = {
    contractNumber: details.contractNumber || `CT-${project.id}`,
    signDate: details.contractDate || 'غير محدد',
    startDate: details.contractStartDate || details.startDate || 'غير محدد',
    endDate: details.contractEndDate || details.endDate || 'غير محدد',
    contractor: details.contractingEntity || details.executingEntity || 'الجهة المتعاقدة',
    status: contractStatus(details.contractStatus),
  };
  const budgetDetails: BudgetDetails = { spent, remaining, total: totalBudget, currency: '' };
  const riskBreakdown: RiskBreakdown = {
    high: 1 + (project.id % 4),
    medium: 2 + ((project.id * 2) % 5),
    low: 2 + ((project.id * 3) % 4),
  };
  const parties: ProjectParty[] = details.parties.map(partyFromString);
  const safeParties = parties.length ? parties : [partyFromString('مدير المشروع · +966 50 0000 000 · project@trackplus.sa', 0)];

  if (selectedOutput) {
    return <OutputDetailView project={project} output={selectedOutput} onBack={() => setSelectedOutput(null)} />;
  }

  if (isEditOpen) {
    return (
      <SeniorCreateProjectPage
        mode="edit"
        initialData={project.details}
        onBack={() => setIsEditOpen(false)}
        onSave={(data) => {
          onUpdateProject?.({
            ...project,
            name: data.name.trim() || project.name,
            details: data,
          });
          setIsEditOpen(false);
        }}
        onValidationError={() => setIsEditOpen(false)}
      />
    );
  }

  return (
    <div className="project-detail" dir="rtl">
      <SubpageHeader parent="المشاريع" title={project.name} onBack={onBack} />

      {outputBanner ? (
        <FeedbackBanner tone={outputBanner} onClose={() => setOutputBanner(null)}>
          {outputBanner === 'success' ? 'تم إضافة المخرج بنجاح' : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى'}
        </FeedbackBanner>
      ) : actionBanner ? (
        <FeedbackBanner tone={actionBanner.tone} onClose={() => setActionBanner(null)}>
          {actionBanner.message}
        </FeedbackBanner>
      ) : null}

      <main className="project-detail__body">
        <section className="project-detail__hero">
          <div className="project-detail__hero-title">
            <h1>{project.name}</h1>
            <p>{details.description || `${details.type || 'مشروع'} — ${details.category || 'إدارة المشروع'}`}</p>
            {activeTabId !== 'whatIf' && (
              <div className="project-detail__hero-status">
                <span style={{ color: statusColors[project.status] }}>● {statusLabels[project.status]}</span>
                <span className="project-detail__hero-type">● {details.type || 'مشروع'}</span>
              </div>
            )}
          </div>

          <div className="project-detail__actions">
            {activeTabId === 'outputs' ? (
              <button type="button" className="project-detail__add-output" onClick={() => { setOutputBanner(null); setActionBanner(null); setIsAddOutputOpen(true); }}>إضافة مخرج <span>＋</span></button>
            ) : activeTabId === 'risks' ? (
              <button
                type="button"
                className="project-detail__add-output"
                onClick={() => { setOutputBanner(null); window.dispatchEvent(new CustomEvent('open-add-risk-dialog')); }}
              >إضافة مخاطر <span>＋</span></button>
            ) : activeTabId === 'changeRequests' ? (
              <button
                type="button"
                className="project-detail__add-output"
                onClick={() => { setOutputBanner(null); window.dispatchEvent(new CustomEvent('open-add-request-dialog')); }}
              >طلب تغيير <span>＋</span></button>
            ) : activeTabId === 'whatIf' || activeTabId === 'projectStages' ? null : activeTabId === 'overview' ? (
              <>
                <button type="button" className="project-detail__edit" onClick={() => { setOutputBanner(null); setActionBanner(null); setIsEditOpen(true); }}>تعديل</button>
                <button
                  type="button"
                  className="project-detail__delete"
                  onClick={() => {
                    if (onDelete) onDelete(project.id);
                  }}
                >حذف</button>
              </>
            ) : null}
          </div>
        </section>

        <TabsNav activeTabId={activeTabId} onChange={setActiveTabId} />

        {activeTabId === 'overview' && (
          <>
            <DepartmentCard title={details.executingEntity || 'إدارة المشروع'} subtitle={details.description || 'إدارة وتنفيذ المشروع وفق الخطة المعتمدة'} tag={details.category || 'إدارة داخلية'} />

            <KpiGrid
              progressPercent={project.progress}
              daysRemaining={daysUntil(details.endDate || details.contractEndDate)}
              budgetSpent={budgetDetails.spent}
              budgetRemaining={budgetDetails.remaining}
              risks={riskBreakdown}
            />

            <div className="project-detail__two-columns">
              <ContractDetailsCard details={contractDetails} />
              <BudgetDetailsCard details={budgetDetails} />
            </div>

            <PartiesCard parties={safeParties} />
          </>
        )}

        {activeTabId === 'projectStages' && <ProjectStagesView stages={details.stages} projectName={project.name} />}

        {activeTabId === 'outputs' && (
          <ProjectOutputsView outputs={projectOutputs} stages={details.stages} projectName={project.name} onOpenOutput={setSelectedOutput} />
        )}

        {activeTabId === 'risks' && <ProjectRisksView projectId={project.id} />}

        {activeTabId === 'changeRequests' && <ProjectChangeRequestsView projectId={project.id} />}

        {activeTabId === 'whatIf' && <ProjectWhatIfView projectName={project.name} />}
      </main>

      {isAddOutputOpen && (
        <div
          className="project-output-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddOutputOpen(false);
          }}
        >
          <form
            className="project-output-modal__dialog"
            dir="rtl"
            onSubmit={(event) => {
              event.preventDefault();

              const stageIndex = details.stages.findIndex((stage) => String(stage.id) === outputForm.stageId);
              const stage = details.stages[stageIndex];
              const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(outputForm.email.trim());
              const formIsValid = Boolean(
                outputForm.name.trim() &&
                stage &&
                outputForm.outputType.trim() &&
                outputForm.description.trim() &&
                outputForm.riskOwner.trim() &&
                emailIsValid
              );

              if (!formIsValid) {
                setIsAddOutputOpen(false);
                setOutputBanner('error');
                return;
              }

              const createdDate = todayISO();
              const newOutput: ProjectOutput = {
                id: Date.now(),
                name: outputForm.name.trim(),
                stage: stage.name?.trim() || `المرحلة ${(stageIndex >= 0 ? stageIndex : 0) + 1}`,
                stageNumber: (stageIndex >= 0 ? stageIndex : 0) + 1,
                startDate: stage.startDate || createdDate,
                endDate: createdDate,
                status: completedWords.includes(stage.status) ? 'completed' : 'planned',
                outputType: outputForm.outputType.trim(),
                description: outputForm.description.trim(),
                riskOwner: outputForm.riskOwner.trim(),
                email: outputForm.email.trim(),
                files: outputForm.files.map((file) => file.name),
              };

              const nextOutputs = [...projectOutputs, newOutput];
              setProjectOutputs(nextOutputs);
              onUpdateProject?.({
                ...project,
                details: { ...project.details, outputs: nextOutputs },
              });
              setOutputForm(emptyOutputForm);
              setIsAddOutputOpen(false);
              setOutputBanner('success');
            }}
          >
            <div className="project-output-modal__header">
              <div className="project-output-modal__title-wrap">
                <span className="project-output-modal__icon"><FilePlus2 size={22} /></span>
                <h2>إضافة مخرج</h2>
              </div>
            </div>

            <div className="project-output-modal__divider" />

            <div className="project-output-modal__grid">
              <label>
                <span>اسم المخرج</span>
                <input
                  value={outputForm.name}
                  onChange={(event) => setOutputForm((current) => ({ ...current, name: event.target.value }))}
                  autoFocus
                />
              </label>

              <label>
                <span>المرحلة</span>
                <select
                  value={outputForm.stageId}
                  onChange={(event) => setOutputForm((current) => ({ ...current, stageId: event.target.value }))}
                >
                  <option value="">اختر المرحلة</option>
                  {details.stages.map((stage, index) => (
                    <option key={stage.id} value={stage.id}>{stage.name || `المرحلة ${index + 1}`}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>نوع المخرج</span>
                <input
                  value={outputForm.outputType}
                  onChange={(event) => setOutputForm((current) => ({ ...current, outputType: event.target.value }))}
                />
              </label>

              <label>
                <span>وصف المخرج</span>
                <input
                  value={outputForm.description}
                  onChange={(event) => setOutputForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              <label>
                <span>مسؤول المخاطر</span>
                <input
                  value={outputForm.riskOwner}
                  onChange={(event) => setOutputForm((current) => ({ ...current, riskOwner: event.target.value }))}
                />
              </label>

              <label>
                <span>البريد الإلكتروني</span>
                <input
                  type="email"
                  value={outputForm.email}
                  onChange={(event) => setOutputForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
            </div>

            <div className="project-output-modal__files">
              <span className="project-output-modal__files-label">إضافة ملفات المخرج</span>
              <button
                type="button"
                className="project-output-modal__dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const selected = Array.from(event.dataTransfer.files);
                  setOutputForm((current) => ({ ...current, files: [...current.files, ...selected] }));
                }}
              >
                <span className="project-output-modal__upload-icon"><Upload size={20} /></span>
                <strong>اسحب الملفات هنا أو انقر للاختيار</strong>
                <small>PDF,DOCS,XLSX,PNG,JPG,FIG</small>
              </button>
              <input
                ref={fileInputRef}
                className="project-output-modal__file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.fig"
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  setOutputForm((current) => ({ ...current, files: [...current.files, ...selected] }));
                  event.currentTarget.value = '';
                }}
              />
              {outputForm.files.length > 0 && (
                <div className="project-output-modal__file-list">
                  {outputForm.files.map((file, index) => (
                    <span key={`${file.name}-${index}`}>{file.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="project-output-modal__actions">
              <button type="button" className="project-output-modal__cancel" onClick={() => setIsAddOutputOpen(false)}>إلغاء</button>
              <button type="submit" className="project-output-modal__submit">إضافة</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

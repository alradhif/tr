import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import type { ProjectStage } from './DataEntryCreateProjectPage';

interface ActivityView {
  title: string;
  date: string;
  progress: number;
  status: 'completed' | 'inProgress' | 'delayed' | 'planned';
}

interface StageView {
  number: number;
  title: string;
  date: string;
  activitiesCount: number;
  progress: number;
  status: 'completed' | 'inProgress' | 'notStarted';
  activities: ActivityView[];
  startDate: string;
  endDate: string;
}

interface Props {
  stages: ProjectStage[];
  projectName: string;
}

function normalizeStatus(value: string): StageView['status'] {
  if (value === 'مكتمل' || value === 'completed') return 'completed';
  if (value === 'جارية' || value === 'قيد التنفيذ' || value === 'inProgress') return 'inProgress';
  return 'notStarted';
}

function stageProgress(status: StageView['status'], index: number, total: number) {
  if (status === 'completed') return 100;
  if (status === 'inProgress') return Math.max(10, Math.min(90, Math.round(50 + (index % 3) * 10)));
  return total > 1 && index === 0 ? 5 : 0;
}

function activityProgress(status: ActivityView['status'], index: number) {
  if (status === 'completed') return 100;
  if (status === 'inProgress') return [75, 55, 40][index % 3];
  if (status === 'delayed') return [30, 15][index % 2];
  return 0;
}

function toStageViews(stages: ProjectStage[]): StageView[] {
  return stages.map((stage, index) => {
    const status = normalizeStatus(stage.status);
    const activities = stage.activities.map((activity, activityIndex) => {
      const activityStatus: ActivityView['status'] = status === 'completed'
        ? 'completed'
        : status === 'inProgress'
          ? activityIndex % 3 === 1 ? 'delayed' : 'inProgress'
          : 'planned';
      return {
        title: activity.name || `نشاط المرحلة ${index + 1}`,
        date: [activity.startDate, activity.endDate].filter(Boolean).join(' — ') || [stage.startDate, stage.endDate].filter(Boolean).join(' — '),
        progress: activityProgress(activityStatus, activityIndex),
        status: activityStatus,
      };
    });
    return {
      number: index + 1,
      title: stage.name || `المرحلة ${index + 1}`,
      date: [stage.startDate, stage.endDate].filter(Boolean).join(' — ') || 'بدون تاريخ',
      activitiesCount: activities.length,
      progress: stageProgress(status, index, stages.length),
      status,
      activities,
      startDate: stage.startDate,
      endDate: stage.endDate,
    };
  });
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthPosition(value: string) {
  const date = parseDate(value);
  if (!date) return null;
  const month = date.getMonth();
  const day = date.getDate();
  const days = new Date(date.getFullYear(), month + 1, 0).getDate();
  return ((month + (day - 1) / days) / 12) * 100;
}

function Timeline({ stages, projectName }: { stages: StageView[]; projectName: string }) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const colors = ['#f9d9d7', '#ccefe0', '#d5e9fe', '#a8d6a2', '#f9e2c4'];
  const visible = stages.filter((stage) => stage.startDate && stage.endDate);
  return (
    <section className="project-stages__timeline" aria-label={`الجدول الزمني ${projectName}`}>
      <div className="project-stages__timeline-title"><span><CalendarDays size={22} /></span><h2>الجدول الزمني</h2></div>
      <div className="project-stages__timeline-grid">
        <div className="project-stages__timeline-months">{months.map((month) => <div key={month}>{month}</div>)}</div>
        <div className="project-stages__timeline-body">
          {visible.map((stage, index) => {
            const start = monthPosition(stage.startDate);
            const end = monthPosition(stage.endDate);
            if (start === null || end === null) return null;
            const left = Math.max(0, Math.min(100, start));
            const right = Math.max(left + 4, Math.min(100, end));
            return (
              <div key={stage.number} className="project-stages__timeline-bar" style={{ left: `${left}%`, width: `${Math.max(5, right - left)}%`, top: `${18 + (index % 5) * 42}px`, background: colors[index % colors.length] }}>
                <span>{stage.startDate} - {stage.endDate}</span><strong>{stage.title}</strong>
              </div>
            );
          })}
          {visible.length === 0 && <div className="project-stages__timeline-empty">أضف تواريخ المراحل لعرض الجدول الزمني</div>}
        </div>
      </div>
    </section>
  );
}

const stageStatus = {
  completed: { label: 'مكتمل', className: 'is-completed', Icon: CheckCircle2 },
  inProgress: { label: 'جارية', className: 'is-progress', Icon: AlertTriangle },
  notStarted: { label: 'لم يبدأ', className: 'is-not-started', Icon: AlertTriangle },
};

const activityStatus = {
  completed: { label: 'مكتمل', className: 'is-completed', Icon: CheckCircle2 },
  inProgress: { label: 'قيد التنفيذ', className: 'is-progress', Icon: CheckCircle2 },
  delayed: { label: 'تأخير', className: 'is-delayed', Icon: CheckCircle2 },
  planned: { label: 'مخطط', className: 'is-planned', Icon: Circle },
};

function ProgressMeter({ progress }: { progress: number }) {
  return <div className="project-stages__meter" aria-label={`${progress}%`}><strong>{progress}%</strong><span><i style={{ width: `${progress}%` }} /></span></div>;
}

function StatusBadge({ type, activity = false }: { type: StageView['status'] | ActivityView['status']; activity?: boolean }) {
  const config = activity ? activityStatus[type as ActivityView['status']] : stageStatus[type as StageView['status']];
  const Icon = config.Icon;
  return <span className={`project-stages__status ${config.className}`}>{config.label}<Icon size={12} strokeWidth={2} /></span>;
}

function ActivityProgress({ progress }: { progress: number }) {
  const angle = `${Math.max(0, Math.min(100, progress)) * 3.6}deg`;
  return <div className="project-stages__activity-progress"><span className="project-stages__activity-ring" style={{ background: `conic-gradient(#2e90fa 0deg ${angle}, #e7e8eb ${angle} 360deg)` }} /><b>{progress}%</b></div>;
}

export default function ProjectStagesView({ stages, projectName }: Props) {
  const stageViews = useMemo(() => toStageViews(stages), [stages]);
  const [openStages, setOpenStages] = useState<Record<number, boolean>>(() => Object.fromEntries(stageViews.map((stage, index) => [stage.number, index < 2])));

  return (
    <section className="project-stages" dir="rtl" aria-label="مراحل المشروع">
      <Timeline stages={stageViews} projectName={projectName} />
      {stageViews.map((stage) => {
        const isOpen = !!openStages[stage.number];
        return (
          <article className={`project-stages__card ${isOpen ? 'is-open' : 'is-collapsed'}`} key={stage.number}>
            <header className="project-stages__header">
              <div className="project-stages__title-group"><div className="project-stages__number">{stage.number}</div><div><h2>{stage.title}</h2><p>{stage.date} · {stage.activitiesCount} نشاطات</p></div></div>
              <div className="project-stages__summary">
                <button type="button" className="project-stages__toggle" onClick={() => setOpenStages((current) => ({ ...current, [stage.number]: !isOpen }))} aria-expanded={isOpen}>{isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
                <StatusBadge type={stage.status} /><ProgressMeter progress={stage.progress} />
              </div>
            </header>
            {isOpen && <div className="project-stages__details"><div className="project-stages__divider" /><h3>النشاطات</h3><div className="project-stages__activities">
              {stage.activities.map((activity, index) => <div className="project-stages__activity" key={`${stage.number}-${index}`}>
                <div className="project-stages__activity-status"><StatusBadge type={activity.status} activity /><span className="project-stages__outputs">{3 + (index % 2)} مخرجات</span></div>
                <div className="project-stages__activity-copy"><strong>{activity.title}</strong><span>{activity.date}</span></div>
                <span className="project-stages__activity-dot" /><ActivityProgress progress={activity.progress} />
              </div>)}
              {stage.activities.length === 0 && <div className="project-stages__empty">لا توجد نشاطات مضافة لهذه المرحلة بعد.</div>}
            </div></div>}
          </article>
        );
      })}
    </section>
  );
}

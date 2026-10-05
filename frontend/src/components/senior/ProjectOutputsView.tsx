import { ChevronLeft } from 'lucide-react';
import type { ProjectStage, ProjectOutput } from './SeniorCreateProjectPage';

interface Props {
  outputs?: ProjectOutput[];
  stages: ProjectStage[];
  projectName: string;
  onOpenOutput: (output: ProjectOutput) => void;
}

const completedWords = ['مكتمل', 'completed', 'منجز'];

function makeOutputs(stages: ProjectStage[], projectName: string): ProjectOutput[] {
  const source = stages.flatMap((stage, stageIndex): ProjectOutput[] => {
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
  });

  return source.slice(0, 12);
}

function formatDate(value: string) {
  if (!value) return '—';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function Status({ status }: { status: ProjectOutput['status'] }) {
  return (
    <span className={`project-outputs__status ${status === 'completed' ? 'is-completed' : 'is-planned'}`}>
      <span>{status === 'completed' ? 'مكتمل' : 'مخطط'}</span>
      <span className="project-outputs__status-dot">{status === 'completed' ? '✓' : '!'}</span>
    </span>
  );
}

export default function ProjectOutputsView({ outputs, stages, projectName, onOpenOutput }: Props) {
  const rows = outputs?.length ? outputs : makeOutputs(stages, projectName);

  return (
    <section className="project-outputs" dir="rtl" aria-label="المخرجات">
      <div className="project-outputs__table-card">
        <div className="project-outputs__thead" role="row">
          <div>اسم المخرج</div>
          <div>المرحلة</div>
          <div>تاريخ البدء</div>
          <div>تاريخ الإنشاء</div>
          <div>الحالة</div>
          <div aria-hidden="true" />
        </div>

        {rows.map((output, index) => (
          <div className={`project-outputs__row ${index % 2 ? 'is-alt' : ''}`} key={output.id} role="row">
            <div className="project-outputs__name">{output.name}</div>
            <div className="project-outputs__stage">
              <strong>{output.stage}</strong>
              <span>المرحلة {output.stageNumber}</span>
            </div>
            <div>{formatDate(output.startDate)}</div>
            <div>{formatDate(output.endDate)}</div>
            <div><Status status={output.status} /></div>
            <button type="button" className="project-outputs__open" aria-label={`فتح المخرج ${output.name}`} onClick={() => onOpenOutput(output)}>
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
          </div>
        ))}

        {!rows.length && <div className="project-outputs__empty">لا توجد مخرجات لهذا المشروع بعد.</div>}
      </div>
    </section>
  );
}

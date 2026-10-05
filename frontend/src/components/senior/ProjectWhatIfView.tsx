import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, FileSignature } from 'lucide-react';

const scenarioPhases = [
  'المرحلة الأولى',
  'المرحلة الثانية',
  'المرحلة الثالثة',
  'مهمة: تطوير واجهات المستخدم',
  'مهمة: اختبار الأداء',
];

const baseline = { end: '30 يونيو 2026', cost: 1300000, risk: 'متوسط', people: 12 };

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function addDays(days: number) {
  const d = new Date(2026, 5, 30);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('ar-EG-u-nu-latn', { day: '2-digit', month: 'long', year: 'numeric' });
}

function SliderRow({
  label,
  value,
  onChange,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  unit: string;
}) {
  const fmtValue = (v: number) => (unit === '%' ? `${v}%` : `${v} ${unit}`);
  const pct = (value / max) * 100;

  return (
    <div className="py-6">
      <div dir="rtl" className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      <div className="relative mt-4 h-5">
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
          <div className="absolute top-0 right-0 h-full bg-[#2196F3]" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[#2196F3] bg-card shadow-card"
          style={{ right: `${pct}%` }}
        />
        <input
          dir="rtl"
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <div dir="rtl" className="mt-2 flex items-center justify-between text-sm font-bold text-foreground">
        <span>{fmtValue(0)}</span>
        <span>{fmtValue(max)}</span>
      </div>
    </div>
  );
}

function CompareCard({ tag, tone, rows }: { tag: string; tone: 'muted' | 'brand'; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-2xl bg-card p-6 shadow-card">
      <div className="flex justify-end">
        <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tone === 'brand' ? 'bg-brand-soft text-brand-strong' : 'bg-muted text-foreground'}`}>
          {tag}
        </span>
      </div>
      <dl className="mt-4">
        {rows.map(([key, value]) => (
          <div key={key} className="flex flex-row-reverse items-center justify-between py-3">
            <dt className="text-sm text-muted-foreground">{key}</dt>
            <dd className="text-sm font-bold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ImpactCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 text-right shadow-card">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

interface Scenario {
  phase: string;
  delay: number;
  budget: number;
  resources: number;
}

function ScenarioResult({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const { phase, delay, budget, resources } = scenario;

  const newCost = Math.round(baseline.cost * (1 + budget / 100));
  const newPeople = Math.max(1, Math.round(baseline.people * (1 - resources / 100)));
  const severity =
    delay >= 10 || resources >= 25 || budget >= 15 ? 'مرتفع' : delay > 0 || budget > 0 || resources > 0 ? 'متوسط' : 'منخفض';
  const newRisks = delay >= 10 || resources >= 25 ? 3 : delay > 0 || resources > 0 ? 1 : 0;
  const phasesAffected = delay >= 10 ? 'يؤثر على مرحلتين' : delay > 0 ? 'يؤثر على مرحلة واحدة' : 'لا يؤثر على المراحل';

  const recommendations = [
    delay > 0
      ? `التأخير ${delay} أيام يؤثر على موعد تسليم مخرجات ${phase} — يُنصح بإشعار العميل مبكراً وتعديل الجدول الزمني الرسمي.`
      : 'لا يوجد تأخير في الجدول الزمني — يمكن الاستمرار بالخطة الحالية.',
    severity !== 'منخفض'
      ? 'ارتفاع مستوى المخاطر يستدعي مراجعة خطة الطوارئ وتحديث سجل المخاطر في المشروع.'
      : 'مستوى المخاطر مستقر، يكفي المتابعة الدورية الأسبوعية.',
    resources > 0
      ? `تخفيض الموارد بنسبة ${resources}% يتطلب إعادة ترتيب أولويات المهام غير الحرجة أو إضافة موارد مؤقتة للمرحلة المتأثرة.`
      : 'يمكن تعويض التأخير بإعادة ترتيب أولويات المهام غير الحرجة أو إضافة موارد مؤقتة للمرحلة المتأثرة.',
  ];

  return (
    <div dir="rtl" className="tw-scope space-y-6 font-sans">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
        رجوع إلى المحاكي
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <CompareCard
          tag="السيناريو الجديد"
          tone="brand"
          rows={[
            ['تاريخ الانتهاء', addDays(delay)],
            ['التكلفة الإجمالية', fmt(newCost)],
            ['مستوى المخاطر', severity],
            ['عدد الموارد', `${newPeople} شخص`],
          ]}
        />
        <CompareCard
          tag="الوضع الأصلي"
          tone="muted"
          rows={[
            ['تاريخ الانتهاء', baseline.end],
            ['التكلفة الإجمالية', fmt(baseline.cost)],
            ['مستوى المخاطر', baseline.risk],
            ['عدد الموارد', `${baseline.people} شخص`],
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ImpactCard
          title="تغيير مستوى المخاطر"
          value={`${baseline.risk} ← ${severity}`}
          note={newRisks > 0 ? `${newRisks} مخاطر جديدة محتملة` : 'لا مخاطر جديدة'}
        />
        <ImpactCard
          title="التأثير على التكلفة"
          value={budget > 0 ? `+${budget}%` : 'لا تغيير'}
          note={budget > 0 ? `التكلفة الجديدة ${fmt(newCost)}` : 'الميزانية محافظة'}
        />
        <ImpactCard title="التأثير على الجدول" value={delay > 0 ? `+${delay} أيام تأخير` : 'لا تأخير'} note={phasesAffected} />
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-right text-lg font-bold text-foreground">التوصيات</h2>
        <ul className="mt-4 space-y-4">
          {recommendations.map((r) => (
            <li key={r} className="flex flex-row-reverse items-start gap-3 text-right">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
              <p className="text-sm text-foreground">{r}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function ProjectWhatIfView(_props: { projectName?: string } = {}) {
  
  
  useEffect(() => {
    document.body.classList.add('whatif-hides-assistant-fab');
    return () => document.body.classList.remove('whatif-hides-assistant-fab');
  }, []);

  const [phase, setPhase] = useState<string>(scenarioPhases[0]);
  const [delay, setDelay] = useState(0);
  const [budget, setBudget] = useState(0);
  const [resources, setResources] = useState(0);
  const [applied, setApplied] = useState<Scenario | null>(null);

  function reset() {
    setPhase(scenarioPhases[0]);
    setDelay(0);
    setBudget(0);
    setResources(0);
  }

  if (applied) return <ScenarioResult scenario={applied} onBack={() => setApplied(null)} />;

  return (
    <div dir="rtl" className="tw-scope space-y-6 font-sans">
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-start gap-4">
          <span className="flex w-11 h-11 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <FileSignature className="w-5 h-5" />
          </span>
          <h2 className="text-lg font-bold text-foreground">محاكي السيناريوهات - &quot;ماذا لو&quot;</h2>
        </div>
        <div className="mt-4 text-right text-sm text-gray-600">
          إضافة نظام المصادقة استكشف تأثير التغييرات المحتملة على جدول المشروع والميزانية والمخاطر
        </div>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h3 className="text-right text-lg font-bold text-foreground">معطيات السيناريو</h3>
        <div className="mt-4">
          <label className="block text-right text-sm font-semibold text-foreground" htmlFor="whatif-phase">
            اختر المرحلة او المهمة
          </label>
          <div className="relative mt-3 flex h-12 w-full items-center">
            <ChevronDown className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <select
              id="whatif-phase"
              dir="rtl"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="h-full w-full appearance-none rounded-lg border border-border bg-card px-3 text-right text-sm text-foreground outline-none focus:ring-2 focus:ring-brand"
            >
              {scenarioPhases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-2">
          <SliderRow label="التأخير في الجدول الزمني" value={delay} onChange={setDelay} max={20} unit="يوم" />
          <SliderRow label="زيادة الميزانية" value={budget} onChange={setBudget} max={20} unit="%" />
          <SliderRow label="تخفيض الموارد البشرية" value={resources} onChange={setResources} max={40} unit="%" />
        </div>

        <div dir="rtl" className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setApplied({ phase, delay, budget, resources })}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90"
          >
            تطبيق السيناريو
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-muted px-6 py-3 text-sm font-semibold text-foreground hover:bg-border"
          >
            إعادة ضبط
          </button>
        </div>
      </section>
    </div>
  );
}

export default ProjectWhatIfView;

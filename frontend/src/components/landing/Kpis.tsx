import kpi3 from "@/assets/landingpage/kpi3.svg";
import kpi4 from "@/assets/landingpage/kpi4.svg";
import kpi5 from "@/assets/landingpage/kpi5.svg";
import { KpiCard } from "./KpiCard";

// fillStartPct / fillWidthPct read directly from each SVG's progress-bar
// rect (see KpiCard.tsx) so the reveal mask lines up pixel-for-pixel.
const cards = [
  { src: kpi5, fillStartPct: 71.36, fillWidthPct: 22.82 },
  { src: kpi4, fillStartPct: 12.86, fillWidthPct: 81.31 },
  { src: kpi3, fillStartPct: 59.22, fillWidthPct: 34.95 },
];

export function Kpis() {
  return (
    <section id="value" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          متابعة <span className="text-brand-strong">نسبة تحقيق الأهداف</span> لحظة بلحظة
        </h2>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          متابعة تقدم الأهداف الاستراتيجية وربطها بالمشاريع داخل Track+.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((c, i) => (
            <KpiCard key={i} src={c.src} fillStartPct={c.fillStartPct} fillWidthPct={c.fillWidthPct} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

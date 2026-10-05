import { useReveal } from "./useReveal";

/**
 * kpi3/4/5.svg all share the same 412x249 layout with a progress track at
 * y=177 h=10 (x 24→388) and a colored fill rect whose *right* edge is
 * pinned to 388. `fillStartPct`/`fillWidthPct` describe that colored rect
 * as a % of the artwork, taken directly from the SVG source. A white mask
 * the same size as the fill rect sits on top and shrinks away (anchored on
 * its right edge, matching the bar's fixed end) the moment the card
 * scrolls into view — revealing the bar filling to its real value, exactly
 * like .card-list .bar i in track-plus_1.html. The SVG artwork itself is
 * never modified.
 */
export function KpiCard({
  src,
  fillStartPct,
  fillWidthPct,
  delay = 0,
}: {
  src: string;
  fillStartPct: number;
  fillWidthPct: number;
  delay?: number;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="float-card relative w-full overflow-hidden">
      <img src={src} alt="بطاقة مؤشر أداء هدف استراتيجي" className="block w-full" />
      <div
        aria-hidden
        className="absolute bg-white"
        style={{
          top: "71.08%",
          height: "4.02%",
          left: `${fillStartPct}%`,
          width: `${fillWidthPct}%`,
          borderRadius: 999,
          transform: inView ? "scaleX(0)" : "scaleX(1)",
          transformOrigin: "right",
          transition: `transform 1.1s ease ${delay}s`,
        }}
      />
    </div>
  );
}

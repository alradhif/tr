import widgets from "@/assets/landingpage/groupwidgets.svg";
import { useReveal } from "./useReveal";

/**
 * groupwidgets.svg is one flat illustration made of several widget "cards"
 * collaged together (a small stat card top-right, two floating pill
 * badges, the big KPI card with a real progress bar, and a donut/wheel
 * chart). All coordinates below are read directly from the SVG source
 * (viewBox 642x339) and expressed as % so they track the rendered image
 * at any size.
 *
 * Each panel gets its own white mask that fades/rises away the moment the
 * hero scrolls into view (staggered, so the widgets appear to load in one
 * by one), the two real progress-bar fills (top-right card + big card)
 * get a right-anchored wipe mask so they visibly fill to their real value,
 * and the donut/wheel is rebuilt inline so it can genuinely spin into
 * place. The artwork itself (groupwidgets.svg) is never modified.
 */
const panels = [
  // top-right stat card
  { left: 57.79, top: 0, width: 42.13, height: 38.05, radius: 20, delay: 0.15 },
  // small pill badge, top-left
  { left: 3.43, top: 15.93, width: 33.8, height: 15.04, radius: 25, delay: 0.3 },
  // main KPI card
  { left: 20.56, top: 28.02, width: 68.22, height: 56.05, radius: 20, delay: 0 },
  // pill badge, bottom-left
  { left: 0.78, top: 72.27, width: 48.44, height: 17.7, radius: 30, delay: 0.45 },
];

const bars = [
  // top-right stat card's bar (track 391,104,230.5,9 / fill 409.5,104,212)
  { left: 63.79, top: 30.68, width: 33.02, height: 2.65, delay: 0.7 },
  // main KPI card's bar (track 156,222,390,10 / fill 210,222,336)
  { left: 32.71, top: 65.49, width: 52.34, height: 2.95, delay: 0.55 },
];

// The two small "live" status dots on the main card (358,248.5 and
// 522,248.5, each 10x10 in a 642x339 viewBox) get a soft pulsing ring on
// top of the existing dot artwork.
const dots = [
  { left: 55.76, top: 73.75 },
  { left: 81.31, top: 73.75 },
];

const DONUT_BOX = { left: 306, top: 40, size: 88 };

const donutSegments = [
  {
    d: "M394 84C394 108.301 374.301 128 350 128C325.699 128 306 108.301 306 84C306 59.6995 325.699 40 350 40C374.301 40 394 59.6995 394 84ZM323.6 84C323.6 98.5803 335.42 110.4 350 110.4C364.58 110.4 376.4 98.5803 376.4 84C376.4 69.4197 364.58 57.6 350 57.6C335.42 57.6 323.6 69.4197 323.6 84Z",
    fill: "#E7E8EB",
  },
  {
    d: "M394 84C394 76.4359 392.05 68.9995 388.338 62.4088C384.626 55.818 379.278 50.2954 372.81 46.3741C366.342 42.4528 358.972 40.2653 351.411 40.0226C343.851 39.78 336.356 41.4905 329.65 44.9889L337.79 60.5933C341.814 58.4943 346.311 57.468 350.847 57.6136C355.383 57.7592 359.805 59.0717 363.686 61.4245C367.567 63.7772 370.776 67.0908 373.003 71.0453C375.23 74.9997 376.4 79.4615 376.4 84H394Z",
    fill: "#17B26A",
  },
  {
    d: "M394 89.2951C394 96.7722 392.404 104.146 389.338 110.831C386.273 117.516 381.823 123.328 376.342 127.804C370.86 132.28 364.499 135.298 357.763 136.617C351.028 137.936 344.103 137.521 337.54 135.403L342.524 116.96C346.462 118.231 350.617 118.48 354.658 117.688C358.699 116.897 362.516 115.086 365.805 112.4C369.094 109.715 371.764 106.228 373.603 102.217C375.442 98.2057 376.4 93.7813 376.4 89.2951H394Z",
    fill: "#F79009",
  },
  {
    d: "M337.58 135.416C327.343 132.125 318.55 124.882 312.837 115.034C307.124 105.187 304.881 93.4067 306.526 81.8868L323.915 84.8501C322.929 91.7621 324.275 98.8302 327.702 104.739C331.13 110.647 336.406 114.993 342.548 116.968L337.58 135.416Z",
    fill: "#F04438",
  },
];

export function GroupWidgetsAnimated() {
  const { ref, inView } = useReveal<HTMLDivElement>(0.25);

  return (
    <div ref={ref} className="relative w-full max-w-[620px]">
      <img src={widgets} alt="لوحة مؤشرات الأهداف الاستراتيجية" className="block w-full" />

      {panels.map((p, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.width}%`,
            height: `${p.height}%`,
            borderRadius: p.radius,
            opacity: inView ? 0 : 1,
            transform: inView ? "scale(1)" : "scale(1.03)",
            transition: `opacity .8s ease ${p.delay}s, transform .8s ease ${p.delay}s`,
          }}
        />
      ))}

      {bars.map((b, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.width}%`,
            height: `${b.height}%`,
            borderRadius: 999,
            transform: inView ? "scaleX(0)" : "scaleX(1)",
            transformOrigin: "right",
            transition: `transform 1.1s ease ${b.delay}s`,
          }}
        />
      ))}

      {dots.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: "1.6%",
            height: "3%",
            animation: inView ? `tpPulse 1.6s ease-out ${1 + i * 0.3}s infinite` : "none",
          }}
        />
      ))}

      <svg
        aria-hidden
        viewBox={`0 0 ${DONUT_BOX.size} ${DONUT_BOX.size}`}
        className="pointer-events-none absolute"
        style={{
          left: `${(DONUT_BOX.left / 642) * 100}%`,
          top: `${(DONUT_BOX.top / 339) * 100}%`,
          width: `${(DONUT_BOX.size / 642) * 100}%`,
          height: `${(DONUT_BOX.size / 339) * 100}%`,
        }}
      >
        <g>
          <g transform={`translate(${-DONUT_BOX.left} ${-DONUT_BOX.top})`}>
            {donutSegments.map((s, i) => (
              <path key={i} d={s.d} fill={s.fill} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

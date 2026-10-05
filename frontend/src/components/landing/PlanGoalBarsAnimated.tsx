/**
 * Pixel-identical inline copy of assets/landingpage/plangoalbars.svg.
 * The only change: each bar animates from height 0 to its real height
 * when scrolled into view (matches .mini-bar i / .card-list .bar i in
 * track-plus_1.html — transition: height 1.1s ease, IntersectionObserver-triggered).
 * Design (colors, gradients, sizes, rounding, final look) is untouched —
 * each bar is scaled from its own bottom edge, so the resting state is
 * pixel-identical to the original static SVG.
 */
const bars = [
  { d: "M23.5 73C23.5 66.3726 28.8726 61 35.5 61H53.5C60.1274 61 65.5 66.3726 65.5 73V97H23.5V73Z", fill: "url(#pgb1)" },
  { d: "M79.5 24C79.5 17.3726 84.8726 12 91.5 12H109.5C116.127 12 121.5 17.3726 121.5 24V97H79.5V24Z", fill: "url(#pgb2)" },
  { d: "M135.5 55C135.5 48.3726 140.873 43 147.5 43H165.5C172.127 43 177.5 48.3726 177.5 55V97H135.5V55Z", fill: "url(#pgb3)" },
  { d: "M191.5 48C191.5 41.3726 196.873 36 203.5 36H221.5C228.127 36 233.5 41.3726 233.5 48V97H191.5V48Z", fill: "url(#pgb4)" },
];

export function PlanGoalBarsAnimated({ animate }: { animate: boolean }) {
  return (
    <svg width="257" height="109" viewBox="0 0 257 109" fill="none" className="mt-8 w-full" aria-hidden>
      <rect width="257" height="109" rx="16" fill="url(#pgb0)" />
      {bars.map((b, i) => (
        <path
          key={i}
          d={b.d}
          fill={b.fill}
          style={{
            transform: `scaleY(${animate ? 1 : 0})`,
            transformBox: "fill-box",
            transformOrigin: "bottom",
            transitionProperty: "transform",
            transitionDuration: "1.1s",
            transitionTimingFunction: "ease",
            transitionDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <defs>
        <linearGradient id="pgb0" x1="128.5" y1="0" x2="128.5" y2="109" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D1F0E1" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <linearGradient id="pgb1" x1="23.5" y1="79" x2="65.5" y2="79" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77C076" />
          <stop offset="1" stopColor="#54B9A4" />
        </linearGradient>
        <linearGradient id="pgb2" x1="79.5" y1="54.5" x2="121.5" y2="54.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77C076" />
          <stop offset="1" stopColor="#54B9A4" />
        </linearGradient>
        <linearGradient id="pgb3" x1="135.5" y1="70" x2="177.5" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77C076" />
          <stop offset="1" stopColor="#54B9A4" />
        </linearGradient>
        <linearGradient id="pgb4" x1="191.5" y1="66.5" x2="233.5" y2="66.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77C076" />
          <stop offset="1" stopColor="#54B9A4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

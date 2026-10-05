import type { ReactNode } from "react";
import { useReveal } from "./useReveal";

/**
 * Wraps any existing card/image and fades + rises it into place the first
 * time it scrolls into the viewport — the same IntersectionObserver-driven
 * "comes alive on scroll" behaviour as track-plus_1.html, without touching
 * the underlying markup, image, or design of what it wraps.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>(0.2);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(18px)",
        transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Wraps a static "progress style" image (e.g. projectprogress.svg) and
 * animates a left-to-right wipe over it the first time it scrolls into
 * view — a fill-in effect equivalent to the HTML's animated progress
 * bars, applied as an overlay so the underlying artwork is never modified.
 */
export function RevealWipe({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, inView } = useReveal<HTMLDivElement>(0.25);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white"
        style={{
          transform: inView ? "scaleX(0)" : "scaleX(1)",
          transformOrigin: "left",
          transition: `transform 1.1s ease ${delay}s`,
        }}
      />
    </div>
  );
}

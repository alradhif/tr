import { useState } from "react";
import kpiupdateBtn from "@/assets/landingpage/kpiupdate.svg";
import { Clock, Link2, Lock } from "lucide-react";
import { Reveal } from "./Reveal";

const points = [
  { Icon: Clock, text: "أنشئ مشروعك وحدد مراحله في دقائق" },
  { Icon: Link2, text: "اربطه بالهدف الاستراتيجي ومؤشر أدائه مباشرة" },
  { Icon: Lock, text: "تابع نسبة الإنجاز ضمن بيئة آمنة ومستقلة لكل جهة" },
];

export function LinkGoal() {
  const [pulseKey, setPulseKey] = useState(0);
  const [toast, setToast] = useState(false);
  const [pct, setPct] = useState(77);

  const handleUpdate = () => {
    if (pct >= 100) return;
    const next = Math.min(pct + 10, 100);
    setPct(next);
    setPulseKey((k) => k + 1);
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  };

  return (
    <section id="capabilities" className="px-6 py-20">
      <div className="mint-surface mx-auto grid max-w-6xl items-center gap-12 rounded-3xl px-10 py-16 lg:grid-cols-2">
        <div className="order-1">
          <Reveal>
            <div className="relative">
              {/* KPI Card — rebuilt as JSX so the percentage is live markup */}
              <div
                key={pulseKey}
                className="float-card w-full overflow-hidden rounded-3xl bg-white p-5 text-right"
                style={pulseKey ? { animation: "tpPulse 1s ease" } : undefined}
                dir="rtl"
              >
                {/* Header row */}
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-gray-800">تطوير البنية التحتية الرقمية</p>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                </div>

                {/* Dynamic percentage */}
                <div
                  className="mt-2 text-right font-bold tabular-nums transition-all duration-500"
                  style={{ fontSize: "2.25rem", color: "#101828", letterSpacing: "-0.5px" }}
                >
                  {pct}%
                </div>

                {/* On-track badge */}
                <div className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold" style={{ color: "#12B76A" }}>
                  <span>على المسار</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <polygon points="5,1 9,9 1,9" fill="#12B76A" />
                  </svg>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #17B26A, #12D571)" }}
                  />
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "نسبة رقمية", value: "KPI" },
                    { label: "من عام", value: "2025" },
                    { label: "مشاريع", value: "3" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-0.5 rounded-2xl py-2.5"
                      style={{ background: "#F2FBF6" }}
                    >
                      <span className="text-sm font-bold text-gray-800">{s.value}</span>
                      <span className="text-[11px] text-gray-400">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Update button */}
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={pct >= 100}
                  className="appearance-none border-0 bg-transparent p-0 transition-transform"
                  style={{
                    opacity: pct >= 100 ? 0.45 : 1,
                    cursor: pct >= 100 ? "not-allowed" : "pointer",
                    transform: pct >= 100 ? "none" : undefined,
                  }}
                  onMouseEnter={(e) => { if (pct < 100) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  <img src={kpiupdateBtn} alt="تحديث المؤشر" className="h-[42px] w-auto" />
                </button>
              </div>

              {/* Toast */}
              {toast && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-strong shadow-md"
                  style={{ animation: "tpToastIn .3s ease both" }}
                >
                  تم تحديث المؤشر بنجاح ✓
                </div>
              )}
            </div>
          </Reveal>
        </div>

        <div className="order-2 text-right">
          <h2 className="text-2xl leading-[1.7] font-bold md:text-3xl">
            اربط <span className="text-brand-strong">هدفك</span> و Track+ يتابع معاك خطوة بخطوة!
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            كل مشروع مرتبط مباشرة بهدفه الاستراتيجي ومؤشر أدائه
          </p>

          <ul className="mt-8 space-y-5">
            {points.map((p) => (
              <li key={p.text} className="flex items-center justify-start gap-3">
                <p.Icon className="size-4 shrink-0 text-brand-strong" aria-hidden />
                <span className="text-sm font-semibold">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

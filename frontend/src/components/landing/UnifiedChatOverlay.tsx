import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const messages = [
  { from: "user", text: "لخّص لي حالة مشروع بناء المستشفى الجديد" },
  { from: "ai", text: "المشروع منجز بنسبة 68%، ولا يوجد تأخير عن الخطة الزمنية حالياً." },
  { from: "user", text: "هل هناك مخاطر مسجّلة؟" },
  { from: "ai", text: "نعم، خطر واحد متوسط الأثر مرتبط بتوريد المعدات، وتتم متابعته." },
];

/**
 * Typing-simulation overlay matching #aiCard in track-plus_1.html:
 * clicking the "استعن بالذكاء الاصطناعي" card opens this overlay and
 * types out the chat messages one by one, with a restart action.
 */
export function UnifiedChatOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const play = () => {
    setShown(0);
    let i = 0;
    const step = () => {
      i += 1;
      setShown(i);
      if (i < messages.length) {
        timeoutRef.current = setTimeout(step, 900);
      }
    };
    timeoutRef.current = setTimeout(step, 500);
  };

  useEffect(() => {
    if (open) play();
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="float-card w-full max-w-sm p-5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold">مساعد Track+ الذكي</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-full p-1 text-muted-foreground hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col gap-3">
          {messages.slice(0, shown).map((m, i) => (
            <div
              key={i}
              className={
                m.from === "ai"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-brand/15 px-3 py-2 text-xs leading-6"
                  : "mr-auto max-w-[85%] rounded-2xl rounded-br-sm bg-black/5 px-3 py-2 text-xs leading-6"
              }
              style={{
                animation: "tpFadeUp .35s ease both",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={play}
          className="mt-4 w-full rounded-full border border-brand-strong/30 py-2 text-xs font-semibold text-brand-strong hover:bg-brand-strong/5"
        >
          إعادة العرض
        </button>
      </div>
    </div>
  );
}

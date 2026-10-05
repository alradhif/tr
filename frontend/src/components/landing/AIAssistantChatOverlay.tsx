import { useEffect, useRef, useState } from "react";
import { X, Copy } from "lucide-react";

/**
 * Structured bot message content: an intro line followed by an optional
 * bulleted breakdown (emoji + bold label + rest of line).
 */
type BotLine = { emoji?: string; label?: string; rest?: string; plain?: string };

type ChatMessage =
  | { from: "user"; text: string }
  | { from: "bot"; intro: string; lines?: BotLine[] };

const messages: ChatMessage[] = [
  { from: "user", text: "لخّص لي حالة مشروع بناء المستشفى الجديد" },
  {
    from: "bot",
    intro: "المشروع منجز بنسبة 68%، ولا يوجد تأخير عن الخطة الزمنية حالياً.",
  },
  { from: "user", text: "هل هناك مخاطر مسجّلة؟" },
  {
    from: "bot",
    intro: "نعم، خطر واحد متوسط الأثر مرتبط بتوريد المعدات، وتتم متابعته.",
  },
];

/**
 * Purple AI assistant chat overlay — replaces the previous white
 * UnifiedChatOverlay modal with the finalized purple chat design.
 * Same fixed/centered position, same z-index and dark backdrop.
 */
export function AIAssistantChatOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex((v) => (v === idx ? null : v)), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="flex w-full max-w-[450px] flex-col overflow-hidden rounded-3xl bg-white text-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-9 items-center justify-center rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #9333ea, #a855f7)",
              }}
            >
              {/* simple sparkle/assistant glyph */}
              <svg viewBox="0 0 24 24" className="size-5" fill="none">
                <path
                  d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <h4 className="text-sm font-bold text-neutral-800">المساعد الذكي</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex size-7 items-center justify-center rounded-full text-neutral-400 hover:bg-black/5 hover:text-neutral-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Chat body */}
        <div className="flex max-h-[60vh] min-h-[220px] flex-col gap-3 overflow-y-auto px-5 py-5">
          {messages.slice(0, shown).map((m, i) =>
            m.from === "user" ? (
              <div
                key={i}
                className="mr-auto max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-6 text-white"
                style={{
                  animation: "tpFadeUp .35s ease both",
                  background: "linear-gradient(135deg, #9333ea, #a855f7)",
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                key={i}
                className="ml-auto max-w-[92%] rounded-2xl bg-transparent px-1 py-1 text-sm leading-7 text-neutral-800"
                style={{ animation: "tpFadeUp .35s ease both" }}
              >
                <p>{m.intro}</p>

                {m.lines && m.lines.length > 0 && (
                  <ul className="mt-1 list-none space-y-1">
                    {m.lines.map((line, li) => (
                      <li key={li} className="flex items-start gap-1.5">
                        {line.emoji && <span className="shrink-0">{line.emoji}</span>}
                        <span>
                          {line.label && (
                            <span className="font-bold">{line.label}</span>
                          )}
                          {line.rest}
                          {line.plain}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      [m.intro, ...(m.lines?.map((l) => `${l.emoji ?? ""} ${l.label ?? ""}${l.rest ?? l.plain ?? ""}`) ?? [])].join("\n"),
                      i
                    )
                  }
                  aria-label="نسخ"
                  className="mt-2 flex size-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                >
                  <Copy className="size-3.5" />
                </button>
                {copiedIndex === i && (
                  <span className="mr-2 text-xs text-neutral-400">تم النسخ</span>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 px-5 py-4">
          <button
            type="button"
            onClick={play}
            className="w-full rounded-full py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9333ea, #a855f7)" }}
          >
            إعادة العرض
          </button>
        </div>
      </div>
    </div>
  );
}

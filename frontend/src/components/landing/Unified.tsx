import { useState } from "react";
import useAiIcon from "@/assets/landingpage/useaiicon.svg";
import projectsIcon from "@/assets/landingpage/projectprogressicon.svg";
import goalsIcon from "@/assets/landingpage/plangoalsicon.svg";
import useAi from "@/assets/landingpage/useai.svg";
import projectProgress from "@/assets/landingpage/projectprogress.svg";
import { PlanGoalBarsAnimated } from "./PlanGoalBarsAnimated";
import { RevealWipe } from "./Reveal";
import { useReveal } from "./useReveal";
import { AIAssistantChatOverlay } from "./AIAssistantChatOverlay";

const cards = [
  {
    key: "goals",
    icon: goalsIcon,
    title: "خطط أهدافك",
    body: "حدّد أهدافك الاستراتيجية ومؤشرات أدائها، واربطها مباشرة بالمشاريع المسؤولة عن تحقيقها.",
  },
  {
    key: "projects",
    icon: projectsIcon,
    title: "تابع مشاريعك",
    body: "مراحل، مخرجات، مخاطر، عقود وميزانيات كل مشروع — في مكان واحد ومحدّث لحظياً.",
  },
  {
    key: "ai",
    icon: useAiIcon,
    title: "استعن بالذكاء الاصطناعي",
    body: "مساعد ذكي يجيب على استفساراتك، ويولّد الملخصات والتقارير والعروض التقديمية فوراً.",
  },
];

export function Unified() {
  // Interactive tabs, matching #tabGrid .tab-card in track-plus_1.html:
  // clicking a card sets it active; the active card highlights and (for
  // the AI card) opens the chat simulation overlay.
  const [active, setActive] = useState<string>("goals");
  const [chatOpen, setChatOpen] = useState(false);
  const { ref: barsRef, inView: barsInView } = useReveal<HTMLDivElement>(0.3);

  const handleSelect = (key: string) => {
    setActive(key);
    if (key === "ai") setChatOpen(true);
  };

  return (
    <section className="flex min-h-screen items-center px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          كل ما يخص <span className="text-brand-strong">مشاريعك وأهدافك</span> في منصة واحدة
        </h2>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          من التخطيط الاستراتيجي إلى تنفيذ المشاريع ومتابعتها، بدون أدوات متفرقة.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cards.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => handleSelect(c.key)}
                className="float-card overflow-hidden p-6 text-right focus:outline-none"
                style={{
                  boxShadow: isActive
                    ? "0 0 0 2px var(--landing-brand-strong), var(--landing-card-shadow-lg)"
                    : undefined,
                }}
              >
                <img src={c.icon} alt="" aria-hidden className="mr-auto mb-6 size-8" />
                <h3 className="text-lg font-bold">{c.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{c.body}</p>

                {c.key === "goals" && (
                  <div ref={barsRef}>
                    <PlanGoalBarsAnimated animate={barsInView} />
                  </div>
                )}

                {c.key === "projects" && (
                  <RevealWipe delay={0.1}>
                    <img src={projectProgress} alt="" aria-hidden className="mt-8 w-full" />
                  </RevealWipe>
                )}

                {c.key === "ai" && (
                  <img src={useAi} alt="" aria-hidden className="mt-8 w-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AIAssistantChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </section>
  );
}

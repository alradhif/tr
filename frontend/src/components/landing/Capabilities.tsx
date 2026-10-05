import strategicIcon from "@/assets/landingpage/startegicgoalsicon2.svg";
import projectsIcon from "@/assets/landingpage/projectsicon.svg";
import executingCompaniesIcon from "@/assets/landingpage/executingcompanies.svg";
import companiesIcon from "@/assets/landingpage/efficiencyicon.svg";
import chatbotIcon from "@/assets/landingpage/aichatboticon.svg";
import pptxIcon from "@/assets/landingpage/pptxgenerator.svg";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { AIAssistantChatOverlay } from "./AIAssistantChatOverlay";

const items = [
  {
    icon: strategicIcon,
    title: "الأهداف الاستراتيجية",
    body: "متابعة تنفيذ الأهداف وربطها بالمشاريع المرتبطة بها مع نسبة التحقيق.",
  },
  {
    icon: projectsIcon,
    title: "المشاريع",
    body: "النظرة العامة، تفاصيل العقود، الجهات والمسؤولين، مراحل المشروع ونسبة الإنجاز.",
  },
  {
    icon: executingCompaniesIcon,
    title: "الشركات المنفذة",
    body: "ملف متكامل لكل شركة يشمل العقود والميزانيات وتفاصيل التنفيذ ونسب الإنجاز.",
  },
  {
    icon: companiesIcon,
    title: "الإدارات",
    body: "متابعة تنفيذ الأهداف وربطها بالمشاريع المرتبطة بها مع نسبة التحقيق.",
  },
  {
    key: "ai",
    icon: chatbotIcon,
    title: "الذكاء الاصطناعي — AI Chatbot",
    body: "مساعد ذكي يجيب على الاستفسارات ويستخرج ملخصات وتقارير فورية اعتماداً على بيانات المنصة.",
  },
  {
    icon: pptxIcon,
    title: "إنشاء العروض التقديمية",
    body: "إنشاء عرض تقديمي احترافي تلقائياً باختيار الأقسام وتطبيق هوية الجهة وتخصيص الألوان.",
  },
];

export function Capabilities() {
  const [chatOpen, setChatOpen] = useState(false);

  const handleChatOpen = () => {
    setChatOpen(true);
  };

  return (
    <section id="capabilities-list" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          كل ما تحتاجه <span className="text-brand-strong">لإدارة الأهداف الاستراتيجية</span>
        </h2>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          قدرات متكاملة مصممة لطبيعة العمل الحكومي والمؤسسي.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((i, idx) => {
            const isAi = i.key === "ai";
            const Card = (
              <article
                className={`float-card h-full p-7 text-right ${isAi ? "cursor-pointer" : ""}`}
                role={isAi ? "button" : undefined}
                tabIndex={isAi ? 0 : undefined}
                onClick={isAi ? handleChatOpen : undefined}
              >
                <img src={i.icon} alt="" aria-hidden className="mr-auto mb-6 size-8" />
                <h3 className="text-lg font-bold">{i.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{i.body}</p>
              </article>
            );
            return (
              <Reveal key={i.title} delay={(idx % 3) * 0.08}>
                {Card}
              </Reveal>
            );
          })}
        </div>
      </div>

      <AIAssistantChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </section>
  );
}

import safeIcon from "@/assets/landingpage/safeenviromenticon.svg";
import strategicIcon from "@/assets/landingpage/strategicicon.svg";
import efficiencyIcon from "@/assets/landingpage/efficiencyicon.svg";
import governanceIcon from "@/assets/landingpage/Governanceicon.svg";
import { Reveal } from "./Reveal";

const cards = [
  {
    icon: strategicIcon,
    title: "ربط استراتيجي",
    body: "كل مشروع مرتبط مباشرة بهدفه الاستراتيجي ومؤشر أدائه",
  },
  {
    icon: safeIcon,
    title: "بيئة آمنة",
    body: "استقلالية تامة لبيانات كل جهة ضمن بنية تحتية آمنة",
  },
  {
    icon: governanceIcon,
    title: "حوكمة شاملة",
    body: "رؤية موحدة تعزز الحوكمة وتدعم اتخاذ القرار",
  },
  {
    icon: efficiencyIcon,
    title: "كفاءة التنفيذ",
    body: "ترفع كفاءة التنفيذ وتقلل الجهد اليدوي المتكرر",
  },
];

export function Overview() {
  return (
    <section id="overview" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl leading-[1.6] font-bold md:text-4xl">
          <span className="text-brand-strong">منصة رقمية موحدة</span> لإدارة مشاريعك
          <br />
          وأهدافك الاستراتيجية
        </h2>

        <div className="mt-16 grid items-start gap-12 lg:grid-cols-2">
          <div className="order-2 grid content-start gap-6 sm:grid-cols-2">
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <article className="soft-card self-start rounded-2xl p-6 text-right">
                  <img src={c.icon} alt="" aria-hidden className="mb-6 size-8" />
                  <h3 className="text-lg font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="order-1 space-y-6 text-right text-base leading-8 text-muted-foreground md:text-lg">
            <p>
              منصة رقمية صُممت خصيصاً لتمكين الجهات الحكومية والمؤسسات من إدارة مشاريعها وأهدافها
              الاستراتيجية ضمن منصة واحدة، تُمكّن الجهات من تخطيط المشاريع ومتابعتها من البداية إلى
              النهاية، مع إدارة المراحل والمخرجات والمخاطر وطلبات التغيير والعقود والجوانب المالية.
            </p>
            <p>
              كما تربط المشاريع بالأهداف الاستراتيجية ومؤشرات الأداء، بما يوفر رؤية شاملة تعزز
              الحوكمة وتدعم اتخاذ القرار، وترفع كفاءة التنفيذ، ضمن بيئة آمنة تضمن استقلالية بيانات
              كل جهة.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

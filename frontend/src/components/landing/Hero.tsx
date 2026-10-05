import exploreBtn from "@/assets/landingpage/discoverabilities.svg";
import requestBtn from "@/assets/landingpage/request.svg";
import greenDot from "@/assets/landingpage/greendot.svg";
import { Nav } from "./Nav";
import { GroupWidgetsAnimated } from "./GroupWidgetsAnimated";
import { WaveLoop } from "./WaveLoop";

const chips = ["ذكاء اصطناعي", "دعم كامل للغة العربية", "مصممة لطبيعة العمل الحكومي"];

export function Hero() {
  return (
    <section id="hero" className="hero-surface relative flex min-h-screen flex-col overflow-hidden">
      <WaveLoop />
      <Nav />

      <div className="relative mx-auto grid max-w-7xl flex-1 items-center gap-12 px-6 pt-32 pb-16 lg:grid-cols-2">
        <div className="relative order-2 flex items-center justify-center">
          <GroupWidgetsAnimated />
        </div>

        <div className="order-1 text-right">
          <h1 className="text-4xl leading-[1.35] font-bold text-white md:text-5xl">
            من الاستراتيجية إلى التنفيذ...
            <br />
            <span className="text-brand">في</span> منصة واحدة
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-white/70">
            Track+ منصة رقمية متكاملة صُممت لتمكين الجهات الحكومية والمؤسسات من إدارة مشاريعها
            وأهدافها الاستراتيجية ضمن منصة واحدة، من التخطيط إلى المتابعة حتى الإنجاز.
          </p>

          <div className="mt-10 flex flex-nowrap justify-end gap-3">
            {chips.map((c) => (
              <span
                key={c}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-base text-white/90 md:text-lg"
              >
                <img src={greenDot} alt="" aria-hidden className="size-2" />
                {c}
              </span>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-start gap-4">
            <button
              aria-label="اطلب عرض تجريبي"
              className="appearance-none border-0 bg-transparent p-0 m-0 cursor-pointer"
            >
              <img src={requestBtn} alt="اطلب عرض تجريبي" className="h-[58px] w-auto transition-transform hover:scale-[1.03]" />
            </button>
            <button
              aria-label="استكشف القدرات"
              className="appearance-none border-0 bg-transparent p-0 m-0 cursor-pointer"
            >
              <img src={exploreBtn} alt="استكشف القدرات" className="h-[58px] w-auto transition-transform hover:scale-[1.03]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import checkIcon from "@/assets/landingpage/checkicon.svg";
import requestBtn from "@/assets/landingpage/request.svg";
import { Reveal } from "./Reveal";

const pills = ["رؤية شاملة", "كفاءة وجودة", "بيئة آمنة", "ربط الاستراتيجية", "ذكاء اصطناعي"];

export function DemoCta() {
  return (
    <section id="contact" className="px-6 py-20">
      <Reveal>
        <div className="cta-surface mx-auto max-w-4xl rounded-[24px] px-8 py-14 text-center md:px-14">
        <h2 className="mx-auto max-w-2xl text-2xl leading-[1.6] font-bold text-white md:text-3xl">
          <span className="text-white">تابع مشاريعك،</span>{" "}
          <span className="text-cta-accent">وحقّق أهدافك الاستراتيجية!</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 font-semibold text-white">
          تواصل معنا لحجز عرض تجريبي واكتشاف كيف يمكن لـ Track+ أن يرفع كفاءة إدارة مشاريعكم
          الاستراتيجية.
        </p>

        <ul className="mt-9 flex list-none flex-wrap items-center justify-center gap-3 p-0">
          {pills.map((p) => (
            <li
              key={p}
              className="cta-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white md:text-sm"
            >
              <img src={checkIcon} alt="" aria-hidden className="size-5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex justify-center">
          <button
            type="button"
            aria-label="اطلب عرض تجريبي"
            className="cursor-pointer appearance-none border-0 bg-transparent p-0 transition-transform hover:scale-[1.03]"
          >
            <img src={requestBtn} alt="اطلب عرض تجريبي" className="h-[58px] w-auto" />
          </button>
        </div>
      </div>
      </Reveal>
    </section>
  );
}

import n1 from "@/assets/landingpage/1.svg";
import n2 from "@/assets/landingpage/2.svg";
import n3 from "@/assets/landingpage/3.svg";
import n4 from "@/assets/landingpage/4.svg";
import n5 from "@/assets/landingpage/5.svg";
import n6 from "@/assets/landingpage/6.svg";
import n7 from "@/assets/landingpage/7.svg";
import n8 from "@/assets/landingpage/8.svg";
import { Reveal } from "./Reveal";

const items = [
  { icon: n1, text: "منصة موحدة لإدارة المشاريع والأهداف الاستراتيجية" },
  { icon: n2, text: "ربط مباشر بين الأهداف والمشاريع والتنفيذ" },
  { icon: n3, text: "متابعة لحظية لمؤشرات الأداء" },
  { icon: n4, text: "تحسين كفاءة إدارة المحافظ والمشاريع الاستراتيجية" },
  { icon: n5, text: "دعم الإدارة العليا بمؤشرات وتقارير تنفيذية لحظية" },
  { icon: n6, text: "دعم الإدارة العليا بمؤشرات وتقارير تنفيذية لحظية" },
  { icon: n7, text: "دعم الإدارة العليا بمؤشرات وتقارير تنفيذية لحظية" },
  { icon: n8, text: "دعم الإدارة العليا بمؤشرات وتقارير تنفيذية لحظية" },
];

export function PlatformValue() {
  return (
    <section id="platform-value" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          <span className="text-brand-strong">القيمة</span> التي تقدمها المنصة
        </h2>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          قدرات متكاملة مصممة لطبيعة العمل الحكومي والمؤسسي.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i, idx) => (
            <Reveal key={idx} delay={(idx % 4) * 0.08}>
              <article className="float-card flex h-[210px] w-full flex-col items-center justify-center gap-5 px-6 py-7 text-center">
                <img
                  src={i.icon}
                  alt=""
                  aria-hidden
                  className="size-[52px]"
                />

                <p className="text-sm leading-7 font-bold">
                  {i.text}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
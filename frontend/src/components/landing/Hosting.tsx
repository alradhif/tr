import { useState } from "react";
import cloudIcon from "@/assets/landingpage/cloudicon.svg";
import privateCloudIcon from "@/assets/landingpage/privatecloudicon.svg";
import onPremisesIcon from "@/assets/landingpage/onpremisesicon.svg";
import { Reveal } from "./Reveal";

const options = [
  {
    icon: cloudIcon,
    eyebrow: "وصول فوري",
    title: "الاستضافة السحابية",
    body: "حل سحابي مشترك (SaaS) جاهز للاستخدام من اليوم التالي مباشرة. مستضاف داخل المملكة العربية السعودية ضمن فئة الخدمة C، وقابل للتهيئة ليتماشى تماماً مع احتياجات عملك.",
  },
  {
    icon: privateCloudIcon,
    eyebrow: "حصري وقابل للتخصيص",
    title: "السحابة الخاصة",
    body: "بيئة مخصصة (Instance) مستضافة على سحابة خاصة، تتيح مستوى أعلى من التخصيص والتفصيل الدقيق بما يتناسب مع تفضيلاتك ومتطلباتك التشغيلية الخاصة.",
  },
  {
    icon: onPremisesIcon,
    eyebrow: "تحكّم كامل، وأمان بأعلى درجاته",
    title: "الاستضافة المحلية (On-Premises)",
    body: "نشر أنظمتنا مباشرة على بنيتك التحتية الخاصة، تحكّم كامل في بيئة الاستضافة، مع أعلى مستوى من الأمان والتكامل مع أنظمتك الحالية.",
  },
];

export function Hosting() {
  // Matches .host-card in track-plus_1.html: clicking a card toggles its
  // selected state. Design (card shape/spacing/icons/copy) is unchanged —
  // selection is shown purely via the existing float-card shadow ring.
  const [selected, setSelected] = useState(0);

  return (
    <section id="hosting" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          استضافة <span className="text-brand-strong">سحابية ومحلية</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-8 text-muted-foreground">
          إدراكاً منّا بأن لكل جهة احتياجاتها الخاصة، نوفّر ثلاثة خيارات مرنة لنشر منصاتنا. اختر
          الخيار الأنسب لاحتياجاتك التشغيلية ومتطلبات الأمان لديك.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {options.map((o, i) => (
            <Reveal key={o.title} delay={i * 0.08}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                className="float-card w-full p-7 text-right focus:outline-none"
                style={{
                  boxShadow:
                    selected === i
                      ? "0 0 0 2px var(--landing-brand-strong), var(--landing-card-shadow-lg)"
                      : undefined,
                }}
              >
                <img src={o.icon} alt="" aria-hidden className="mr-auto mb-7 size-[59px]" />
                <p className="text-xs font-semibold text-brand-strong">{o.eyebrow}</p>
                <h3 className="mt-2 text-xl font-bold">{o.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{o.body}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

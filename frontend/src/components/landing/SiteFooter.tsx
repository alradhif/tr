const columns = [
  {
    title: "المنصة",
    links: ["المزايا", "القدرات الرئيسية", "القيمة"],
  },
  {
    title: "قانوني",
    links: ["شروط الاستخدام", "سياسة ملفات تعريف الارتباط"],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer px-6 py-16 text-right">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-start gap-16">
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-base font-bold text-white">{c.title}</h3>
              <ul className="mt-6 list-none space-y-5 p-0">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-white/75 no-underline transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-white/80">© Track+ 2026. جميع الحقوق محفوظة.</p>
          <p className="text-sm font-bold text-white">
            من تطوير <span className="text-cta-accent">جودين - JODAYN</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

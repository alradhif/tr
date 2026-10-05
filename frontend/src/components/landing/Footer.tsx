import logo from "@/assets/landingpage/logo.svg";

export function Footer() {
  return (
    <footer id="contact" className="hero-surface px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <img src={logo} alt="Track+ by JODAYN" className="h-14 w-auto" />
        <p className="max-w-xl text-sm leading-8 text-white/70">
          جاهز تنقل جهتك من الاستراتيجية إلى التنفيذ؟ تواصل معنا واحصل على عرض تجريبي مخصص لطبيعة
          عملك.
        </p>
        <button className="rounded-full bg-brand px-10 py-4 text-sm font-medium text-hero transition-transform hover:scale-[1.03]">
          اطلب عرض تجريبي
        </button>
        <span className="text-xs text-white/40">© 2026 Track+ by JODAYN</span>
      </div>
    </footer>
  );
}

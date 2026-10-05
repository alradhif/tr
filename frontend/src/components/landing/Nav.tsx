import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "@/assets/landingpage/logo.svg";
import signin from "@/assets/landingpage/signin.svg";

const links = [
  { id: "hero", label: "الرئيسية" },
  { id: "overview", label: "نظرة عامة" },
  { id: "capabilities", label: "القدرات الرئيسية" },
  { id: "platform-value", label: "القيمة" },
  { id: "contact", label: "تواصل" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function Nav() {
  const navigate = useNavigate();
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [activeId, setActiveId] = useState(links[0].id);

  /*
   * Detect when the user leaves the Hero section.
   * Once they scroll past it, the navbar gets
   * the dark green background.
   */
  useEffect(() => {
    const hero = document.getElementById("hero");

    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolledPastHero(!entry.isIntersecting);
      },
      {
        rootMargin: "-64px 0px 0px 0px",
        threshold: 0,
      }
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  /*
   * Scrollspy:
   * highlight the section currently in view.
   */
  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => !!element);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);

        if (visible.length === 0) return;

        const closestToTop = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );

        setActiveId(closestToTop.target.id);
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`
        fixed inset-x-0 top-0 z-30
        transition-all duration-300
        ${
          scrolledPastHero
            ? "bg-[rgba(28,51,46,0.94)] backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }
      `}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        
        {/* Logo */}
        <img
          src={logo}
          alt="Track+ by JODAYN"
          className="h-14 w-auto"
        />

        {/* Navigation Links */}
        <ul className="hidden flex-1 list-none items-center justify-between gap-6 px-14 text-sm md:flex">
          {links.map((link) => (
            <li
              key={link.id}
              className="list-none"
            >
              <button
                onClick={() => scrollTo(link.id)}
                className={`
                  m-0 cursor-pointer
                  appearance-none
                  border-0
                  bg-transparent
                  p-0
                  transition-colors
                  duration-200

                  ${
                    activeId === link.id
                      ? "text-[#4CAF62]"
                      : "text-white hover:text-[#4CAF62]"
                  }
                `}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Sign In */}
        <button
          type="button"
          aria-label="تسجيل الدخول"
          onClick={() => navigate('/login')}
          className="
            m-0
            cursor-pointer
            appearance-none
            border-0
            bg-transparent
            p-0
          "
        >
          <img
            src={signin}
            alt="تسجيل الدخول"
            className="
              h-[52px]
              w-auto
              transition-transform
              duration-200
              hover:scale-[1.03]
            "
          />
        </button>
      </nav>
    </header>
  );
}
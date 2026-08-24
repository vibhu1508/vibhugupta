"use client";

import { useEffect, useState } from "react";
import { SECTIONS, profile, type Lang, type SectionId } from "@/content/profile";

export default function Nav({
  active,
  progress,
  scrolled,
  lang,
  onLang,
  status,
  live,
}: {
  active: SectionId | "hero";
  progress: number;
  scrolled: boolean;
  lang: Lang;
  onLang: () => void;
  status: string;
  live: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Escape closes it, and a resize into desktop must not leave the panel
  // mounted invisibly over the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onWide = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ width: "100%", transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <nav className="nav" data-scrolled={scrolled}>
        <a href="#hero" className="flex shrink-0 items-baseline gap-2.5">
          <span className="display text-sm tracking-tight">{profile.name.split(" ")[0]}</span>
          <span className="machine hidden sm:inline">{profile.location}</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="nav-link" data-active={active === s.id}>
                {s.label[lang]}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <button onClick={onLang} className="nav-link" aria-label="Switch language">
            {lang === "en" ? "EN·हिं" : "हिं·EN"}
          </button>

          <span
            className="machine hidden items-center gap-1.5 sm:inline-flex"
            style={{ color: live ? "var(--color-human)" : "var(--color-signal)" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
            {status}
          </span>

          {/* Under md the section links have nowhere else to live. */}
          <button
            className="menu-btn md:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span data-open={open} />
            <span data-open={open} />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className="mobile-menu md:hidden" data-open={open} aria-hidden={!open}>
        <ul>
          {SECTIONS.map((s, i) => (
            <li key={s.id} style={{ "--i": i } as React.CSSProperties}>
              <a
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                data-active={active === s.id}
                tabIndex={open ? 0 : -1}
              >
                <span className="machine">{String(i + 1).padStart(2, "0")}</span>
                {s.label[lang]}
              </a>
            </li>
          ))}
        </ul>
        <p className="machine mt-6" style={{ color: live ? "var(--color-human)" : "var(--color-signal)" }}>
          ● {status}
        </p>
      </div>
    </>
  );
}

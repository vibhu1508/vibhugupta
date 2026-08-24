"use client";

import { profile, type Lang } from "@/content/profile";
import { useReveal } from "@/lib/useReveal";
import Avatar from "./Avatar";
import Logo from "./Logo";

/**
 * The bio, given room to breathe.
 *
 * It was sitting over the sphere in the hero, where the point cloud showed
 * through the counters of the type and made it hard to read. Body copy needs
 * a flat ground; the hero is where the sphere earns its space.
 */
export default function AboutSection({ lang }: { lang: Lang }) {
  const { ref, seen } = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">01 — {lang === "en" ? "About" : "परिचय"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Who's writing the code." : "कोड कौन लिख रहा है।"}
        </h2>
      </div>

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-8">
          <Avatar size={132} className="shrink-0" />
          <p className="text-[1.05rem] leading-[1.8] text-[var(--color-ink-soft)] sm:text-lg">
            {profile.bio[lang]}
          </p>
        </div>

        <aside className="space-y-4">
          <p className="machine">{lang === "en" ? "Education" : "शिक्षा"}</p>
          {profile.education.map((e) => (
            <div key={e.degree} className="card-surface flex gap-3 p-4">
              <Logo slug={e.logo} name={e.org} size={40} />
              <div>
              <p className="text-sm font-medium leading-snug">{e.degree}</p>
              <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{e.org}</p>
              <p className="machine mt-2">{e.period} · {e.detail}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

"use client";

import { profile, type Lang } from "@/content/profile";
import { useReveal } from "@/lib/useReveal";
import TechIcon from "./TechIcon";

export default function StackSection({ lang }: { lang: Lang }) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const groups = Object.entries(profile.skills);

  return (
    <section id="stack" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">06 — {lang === "en" ? "Stack" : "स्टैक"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "What I actually reach for." : "जो मैं वास्तव में उपयोग करता हूँ।"}
        </h2>
      </div>

      <dl className="mt-12 divide-y divide-[var(--color-hairline)]">
        {groups.map(([group, items], i) => (
          <div key={group} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <dt className="machine pt-1">{group}</dt>
            <dd className="flex flex-wrap gap-2" style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
              {items.map((s) => (
                <span key={s} className="chip chip--logo">
                  <TechIcon name={s} size={16} />
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

"use client";

import { achievements, awards, type Lang } from "@/content/profile";
import { useReveal } from "@/lib/useReveal";
import GitHubGraph from "./GitHubGraph";

function Stat({ item, i }: { item: (typeof achievements)[number]; i: number }) {
  const { ref, seen } = useReveal<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="card-surface reveal p-6"
      data-seen={seen}
      style={{ "--d": `${(i % 4) * 90}ms` } as React.CSSProperties}
    >
      <p className="display text-[clamp(1.5rem,3.2vw,2.25rem)] text-[var(--color-signal)]">{item.value}</p>
      <p className="mt-3 text-sm leading-snug">{item.label.en}</p>
      <p className="machine mt-3">{item.source}</p>
    </div>
  );
}

export default function ImpactSection({ lang }: { lang: Lang }) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  return (
    <section id="impact" className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">05 — {lang === "en" ? "Impact" : "प्रभाव"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Numbers, not adjectives." : "संख्याएँ, विशेषण नहीं।"}
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((a, i) => (
          <Stat key={a.value + a.source} item={a} i={i} />
        ))}
      </div>

      {/* Recognition — the things that aren't a number. */}
      <div className="mt-16">
        <p className="machine">{lang === "en" ? "Recognition & leadership" : "मान्यता और नेतृत्व"}</p>
        <ul className="mt-5 divide-y divide-[var(--color-hairline)]">
          {awards.map((a) => (
            <li key={a.title.en} className="grid gap-1.5 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
              <div>
                <h3 className="text-base font-medium">{a.title[lang]}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{a.org}</p>
                {a.note && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {a.note[lang]}
                  </p>
                )}
              </div>
              <span className="machine sm:text-right">{a.year}</span>
            </li>
          ))}
        </ul>
      </div>

      <GitHubGraph lang={lang} />
    </section>
  );
}

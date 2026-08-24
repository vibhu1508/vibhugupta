"use client";

import { useEffect, useRef } from "react";
import { useRailEdges } from "@/lib/useRailEdges";
import Link from "next/link";
import Logo from "./Logo";
import { projects, type Lang } from "@/content/profile";
import { useReveal } from "@/lib/useReveal";

/**
 * A horizontal snap rail rather than a rotating 3D ring.
 *
 * The ring looked good standalone but fought the page: dragging it and
 * scrolling the document are the same gesture on a trackpad and on touch.
 * A snap rail keeps the motion and the depth (cards tilt and lift on hover)
 * without ever stealing a scroll.
 */
export default function ProjectsSection({
  lang,
  activeId,
  onActive,
}: {
  lang: Lang;
  activeId: string | null;
  onActive: (id: string) => void;
}) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const rail = useRailEdges<HTMLDivElement>();
  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  const mounted = useRef(false);

  useEffect(() => {
    // Skip the first run: on mount the rail is already showing card 0, and
    // animating on load is noise.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!activeId) return;
    const railEl = rail.current;
    const card = railEl?.querySelector<HTMLElement>(`[data-card="${activeId}"]`);
    if (!railEl || !card) return;

    /* Drive scrollLeft directly instead of scrollIntoView.
       scrollIntoView walks up to the document and will scroll the PAGE
       vertically to reveal an off-screen card — even with block:"nearest".
       That is what was yanking the page down to Work on load. Setting
       scrollLeft moves the rail and nothing else, ever. */
    railEl.scrollTo({
      left: card.offsetLeft - (railEl.clientWidth - card.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [activeId, rail]);

  return (
    <section id="projects" className="w-full py-24 sm:py-32">
      <div ref={ref} className="reveal mx-auto max-w-4xl px-6" data-seen={seen}>
        <p className="machine">03 — {lang === "en" ? "Projects" : "प्रोजेक्ट्स"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Things I built end to end." : "जो मैंने पूरा बनाया।"}
        </h2>
      </div>

      <div
        ref={rail}
        className="rail no-bar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 sm:px-[max(1.5rem,calc(50vw-32rem))]"
        style={{ perspective: "1200px" }}
      >
        {projects.map((p, i) => (
          <button
            key={p.id}
            data-card={p.id}
            onClick={() => onActive(p.id)}
            data-active={p.id === active.id}
            className="card-surface card-surface--interactive group w-[min(84vw,340px)] shrink-0 snap-center p-6 text-left"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="flex items-baseline justify-between">
              <span className="machine">{String(i + 1).padStart(2, "0")}</span>
              <span className="machine opacity-0 transition-opacity group-hover:opacity-100">focus</span>
            </div>
            <h3 className="display mt-4 flex items-center gap-3 text-2xl">
              <Logo slug={p.logo} name={p.name} size={42} />
              {p.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{p.tagline[lang]}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {p.stack.slice(0, 4).map((s) => (
                <li key={s} className="chip">{s}</li>
              ))}
              {p.stack.length > 4 && <li className="chip">+{p.stack.length - 4}</li>}
            </ul>
          </button>
        ))}
      </div>

      {/* Detail panel — stable height region so nothing below it jumps. */}
      <div className="mx-auto mt-10 max-w-4xl px-6">
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="display text-xl">{active.name}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {active.stack.map((s) => (
                <li key={s} className="chip">{s}</li>
              ))}
            </ul>
          </div>
          <ul className="mt-5 space-y-3">
            {active.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <span className="mt-2 h-px w-4 shrink-0 bg-[var(--color-signal-dim)]" />
                {h}
              </li>
            ))}
          </ul>
          <Link href={`/projects/${active.id}`} className="btn btn--primary mt-6">
            Full case study →
          </Link>
        </div>
      </div>
    </section>
  );
}

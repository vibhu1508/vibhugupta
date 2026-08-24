"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "./Logo";
import MediaStrip from "./MediaStrip";
import { roles, type Lang } from "@/content/profile";
import { useReveal, useScrollFill } from "@/lib/useReveal";

function Row({ role, open, onToggle }: { role: (typeof roles)[number]; open: boolean; onToggle: () => void }) {
  const { ref, seen } = useReveal<HTMLDivElement>(0.25);
  const el = useRef<HTMLDivElement>(null);

  const mounted = useRef(false);

  // Deep-linked from voice: bring the opened role into view — but only if it
  // is actually off-screen. Re-centring a row the visitor just clicked on,
  // which they can already see, reads as the page fighting them.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!open) return;
    const node = el.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const visible = r.top >= 72 && r.bottom <= window.innerHeight - 120;
    if (!visible) node.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [open]);

  return (
    <div ref={el} id={`role-${role.id}`} className="relative pl-12">
      <div ref={ref} className="timeline-item reveal" data-seen={seen}>
        <span className="timeline-dot" aria-hidden />

        {/* The card is a plain container. The toggle and the link are
            siblings inside it — a <button> may not contain ANY interactive
            descendant, anchors included, and nesting them breaks keyboard
            activation as well as being invalid HTML. */}
        <div
          className="card-surface card-surface--interactive overflow-hidden"
          data-active={open}
        >
          <button
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`role-panel-${role.id}`}
            className="w-full cursor-pointer p-5 text-left sm:p-6"
          >
            {/* The mark is its own column so a 54px plate balances against a
                two-line text block instead of towering over a single line. */}
            <div className="flex items-start gap-4">
              <Logo slug={role.logo} name={role.company} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-medium">
                    {role.company}
                    <span className="ml-2 text-[var(--color-ink-soft)]">· {role.title}</span>
                  </h3>
                  <span className="machine shrink-0">{role.period}</span>
                </div>

                <p className="machine mt-1.5">
                  {role.location} · {role.mode}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {role.highlights[0]}
            </p>

            <span className="machine mt-3 inline-block text-[var(--color-signal)]">
              {open ? "− less" : "+ more"}
            </span>
          </button>

          {/* Grid-rows trick: animates height without measuring anything. */}
          <div
            id={`role-panel-${role.id}`}
            className="grid transition-all duration-500 ease-out"
            style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <ul className="space-y-2.5">
                  {role.highlights.slice(1).map((h) => (
                    <li key={h} className="flex gap-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      <span className="mt-2 h-px w-4 shrink-0 bg-[var(--color-signal-dim)]" />
                      {h}
                    </li>
                  ))}
                </ul>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {role.stack.map((t) => (
                    <li key={t} className="chip">{t}</li>
                  ))}
                </ul>

                <MediaStrip media={role.photos} />

                <Link
                  href={`/work/${role.id}`}
                  tabIndex={open ? 0 : -1}
                  className="machine mt-5 inline-block text-[var(--color-signal)] hover:underline"
                >
                  Read the full story →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkSection({
  lang,
  openId,
  onOpen,
}: {
  lang: Lang;
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const { ref: fillRef, fill } = useScrollFill<HTMLDivElement>();
  const { ref, seen } = useReveal<HTMLDivElement>();

  return (
    <section id="work" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">02 — {lang === "en" ? "Experience" : "अनुभव"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Where I've shipped." : "मैंने कहाँ काम किया।"}
        </h2>
      </div>

      <div
        ref={fillRef}
        className="timeline mt-12 space-y-4"
        style={{ "--fill": fill } as React.CSSProperties}
      >
        {roles.map((r) => (
          <Row key={r.id} role={r} open={openId === r.id} onToggle={() => onOpen(openId === r.id ? null : r.id)} />
        ))}
      </div>
    </section>
  );
}

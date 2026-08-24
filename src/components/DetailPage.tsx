import Link from "next/link";
import MediaStrip from "./MediaStrip";
import type { Detail, Photo } from "@/content/profile";

/**
 * Shared chrome for every work and project detail page.
 *
 * Deliberately a server component: these pages are static, text-heavy and
 * the first thing a recruiter's search will surface, so there is no reason
 * to ship JS for them.
 */
export default function DetailPage({
  kicker,
  title,
  subtitle,
  meta,
  stack,
  highlights,
  detail,
  photos,
  links,
  backHref,
  backLabel,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  meta?: string[];
  stack: string[];
  highlights: string[];
  detail?: Detail;
  photos?: Photo[];
  links?: { label: string; href: string }[];
  backHref: string;
  backLabel: string;
}) {
  return (
    <article className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <Link href={backHref} className="machine transition-colors hover:text-[var(--color-ink)]">
        ← {backLabel}
      </Link>

      <header className="mt-10">
        <p className="machine">{kicker}</p>
        <h1 className="display mt-4 text-[clamp(2rem,6vw,3.75rem)]">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-[var(--color-ink-soft)]">{subtitle}</p>}
        {meta && meta.length > 0 && (
          <p className="machine mt-5">{meta.join(" · ")}</p>
        )}
      </header>

      {detail?.metrics && detail.metrics.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {detail.metrics.map((m) => (
            <div key={m.label} className="card-surface p-4">
              <p className="display text-xl text-[var(--color-signal)]">{m.value}</p>
              <p className="mt-1.5 text-xs leading-snug text-[var(--color-ink-soft)]">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {detail?.body && detail.body.length > 0 && (
        <div className="mt-12 space-y-5">
          {detail.body.map((p, i) => (
            <p key={i} className="text-[0.975rem] leading-[1.75] text-[var(--color-ink-soft)]">
              {p}
            </p>
          ))}
        </div>
      )}

      <MediaStrip media={photos} size="lg" />

      <section className="mt-12">
        <h2 className="machine">What I did</h2>
        <ul className="mt-5 space-y-3.5">
          {highlights.map((h) => (
            <li key={h} className="flex gap-3.5 text-[0.975rem] leading-[1.7] text-[var(--color-ink-soft)]">
              <span className="mt-2.5 h-px w-5 shrink-0 bg-[var(--color-signal-dim)]" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {detail?.sections?.map((sec) => (
        <section key={sec.heading} className="mt-12">
          <h2 className="section-title text-2xl">{sec.heading}</h2>
          <div className="mt-4 space-y-4">
            {sec.body.map((p, i) => (
              <p key={i} className="text-[0.975rem] leading-[1.75] text-[var(--color-ink-soft)]">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="machine">Stack</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {stack.map((s) => (
            <li key={s} className="chip">{s}</li>
          ))}
        </ul>
      </section>

      {links && links.length > 0 && (
        <section className="mt-12 flex flex-wrap gap-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="btn">
              {l.label} ↗
            </a>
          ))}
        </section>
      )}

      <footer className="mt-20 border-t border-[var(--color-hairline)] pt-6">
        <Link href={backHref} className="machine transition-colors hover:text-[var(--color-ink)]">
          ← {backLabel}
        </Link>
      </footer>
    </article>
  );
}

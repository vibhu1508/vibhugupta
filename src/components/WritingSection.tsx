"use client";

import Link from "next/link";
import { sortedPosts, formatDate, type Post } from "@/content/blog";
import { useReveal } from "@/lib/useReveal";
import type { Lang } from "@/content/profile";

function Row({ post, lang, i }: { post: Post; lang: Lang; i: number }) {
  const { ref, seen } = useReveal<HTMLLIElement>(0.25);

  const external = post.kind === "external";
  const href = external ? post.url : `/blog/${post.slug}`;
  const label = external ? post.platform : "Here";

  const inner = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="machine">{formatDate(post.date, lang)}</span>
        <span className="machine" style={{ color: external ? undefined : "var(--color-signal)" }}>
          · {label}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-medium transition-colors group-hover:text-[var(--color-signal-warm)]">
        {post.title}
        <span className="ml-2 inline-block text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-1">
          {external ? "↗" : "→"}
        </span>
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {post.summary}
      </p>
      {post.tags && post.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <li key={t} className="chip">{t}</li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <li
      ref={ref}
      className="reveal border-b border-[var(--color-hairline)] last:border-0"
      data-seen={seen}
      style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
    >
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group block py-6">
          {inner}
        </a>
      ) : (
        <Link href={href} className="group block py-6">
          {inner}
        </Link>
      )}
    </li>
  );
}

export default function WritingSection({ lang }: { lang: Lang }) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const latest = sortedPosts.slice(0, 3);

  return (
    <section id="writing" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">04 — {lang === "en" ? "Writing" : "लेखन"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Things I've written down." : "जो मैंने लिखा है।"}
        </h2>
      </div>

      <ul className="mt-10">
        {latest.map((p, i) => (
          <Row key={p.slug} post={p} lang={lang} i={i} />
        ))}
      </ul>

      {sortedPosts.length > 3 && (
        <Link href="/blog" className="btn mt-8">
          {lang === "en" ? "All writing" : "सारा लेखन"} →
        </Link>
      )}
    </section>
  );
}

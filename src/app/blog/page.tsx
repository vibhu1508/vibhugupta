import type { Metadata } from "next";
import Link from "next/link";
import { sortedPosts, formatDate } from "@/content/blog";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: `Writing — ${profile.name}`,
  description: `Posts and articles by ${profile.name}, here and elsewhere.`,
};

/** Server component: static text, so no JS ships for it. */
export default function BlogIndex() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <Link href="/#writing" className="machine transition-colors hover:text-[var(--color-ink)]">
        ← Back
      </Link>

      <header className="mt-10">
        <p className="machine">Writing</p>
        <h1 className="display mt-4 text-[clamp(2rem,6vw,3.5rem)]">Everything I&apos;ve written.</h1>
        <p className="mt-4 text-[var(--color-ink-soft)]">
          Posts hosted here, and links to what I&apos;ve published elsewhere.
        </p>
      </header>

      <ul className="mt-12">
        {sortedPosts.map((post) => {
          const external = post.kind === "external";
          const body = (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="machine">{formatDate(post.date)}</span>
                <span className="machine" style={{ color: external ? undefined : "var(--color-signal)" }}>
                  · {external ? post.platform : "Here"}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-medium transition-colors group-hover:text-[var(--color-signal-warm)]">
                {post.title}{" "}
                <span className="text-[var(--color-ink-faint)]">{external ? "↗" : "→"}</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{post.summary}</p>
            </>
          );
          return (
            <li key={post.slug} className="border-b border-[var(--color-hairline)] last:border-0">
              {external ? (
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="group block py-6">
                  {body}
                </a>
              ) : (
                <Link href={`/blog/${post.slug}`} className="group block py-6">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

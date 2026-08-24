import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { nativePosts, formatDate } from "@/content/blog";
import { profile } from "@/content/profile";

/* Only natively-hosted posts get a page here. External ones live on their
   own platform and are linked out to, never mirrored. */
export function generateStaticParams() {
  return nativePosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = nativePosts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: `${post.title} — ${profile.name}`, description: post.summary };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = nativePosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <Link href="/blog" className="machine transition-colors hover:text-[var(--color-ink)]">
        ← All writing
      </Link>

      <header className="mt-10">
        <p className="machine">{formatDate(post.date)}</p>
        <h1 className="display mt-4 text-[clamp(1.9rem,5vw,3rem)]">{post.title}</h1>
        {post.lede && (
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-soft)]">{post.lede}</p>
        )}
      </header>

      <div className="mt-12 space-y-10">
        {post.body.map((section, i) => (
          <section key={i}>
            {section.heading && <h2 className="section-title text-2xl">{section.heading}</h2>}
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-[1.0125rem] leading-[1.8] text-[var(--color-ink-soft)]">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {post.tags && post.tags.length > 0 && (
        <ul className="mt-14 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <li key={t} className="chip">{t}</li>
          ))}
        </ul>
      )}

      <footer className="mt-16 border-t border-[var(--color-hairline)] pt-6">
        <Link href="/blog" className="machine transition-colors hover:text-[var(--color-ink)]">
          ← All writing
        </Link>
      </footer>
    </article>
  );
}

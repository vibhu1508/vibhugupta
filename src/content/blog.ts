import type { Lang } from "./profile";

/**
 * Writing — hosted here and elsewhere, in one list.
 *
 * Two kinds:
 *   - "native": written and hosted on this site, rendered at /blog/<slug>.
 *     No CMS, no MDX toolchain — the body is structured data, same as every
 *     other content file in the project.
 *   - "external": published on LinkedIn, Medium, dev.to. Only a link is
 *     stored; the post itself stays where it lives.
 *
 * The section shows both, sorted newest first, so the reading list doesn't
 * fragment by platform.
 */

export type Platform = "LinkedIn" | "Medium" | "Dev.to" | "Substack";

type Base = {
  slug: string;
  title: string;
  /** One or two sentences. Yours, not generated. */
  summary: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags?: string[];
};

export type Post =
  | (Base & { kind: "external"; platform: Platform; url: string })
  | (Base & {
      kind: "native";
      /** Optional lead paragraph shown above the body. */
      lede?: string;
      body: { heading?: string; paragraphs: string[] }[];
    });

export const posts: Post[] = [
  /* ── Published on LinkedIn ────────────────────────────────────────
     URLs resolved from the lnkd.in short links; dates decoded from the
     LinkedIn post IDs, which are snowflake-style (high 41 bits are a ms
     timestamp) — they line up with the corresponding internships.

     Headlines and summaries are written from the posts themselves, in first
     person to match the rest of the site. They summarise; they don't
     reproduce. Colleagues named in the originals are deliberately left out —
     third parties don't need to appear on your portfolio. */
  {
    kind: "external",
    slug: "update-2026-05",
    title: "An update after four quiet months",
    summary:
      "The India AI Impact Summit in Delhi, a deep dive into AI memory and knowledge graphs with FalkorDB and Neo4j, and LLM Colosseum — a tool I built to compare local models side by side. Plus why I think the ecosystem needs more foundational research, not just more automation.",
    date: "2026-05-16",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/posts/vibhugupta1508_its-been-so-long-since-i-posted-an-update-ugcPost-7461403788285968385-_mYH/",
    tags: ["Knowledge Graphs", "Local LLMs", "Conference"],
  },
  {
    kind: "external",
    slug: "nse-internship-reflections",
    title: "Building an offline AI platform inside NSE",
    summary:
      "An on-premise, MCP-based system for document querying, summarisation, analysis and deck generation — with nothing leaving the building. What I learned about designing AI for environments where access controls and audits come first.",
    date: "2026-01-29",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/posts/vibhugupta1508_internship-learning-ai-ugcPost-7422541614323167232-06U0/",
    tags: ["On-prem", "RAG", "MCP"],
  },
  {
    kind: "external",
    slug: "shoppers-stop-internship",
    title: "Niyukti AI: an HR screener that went live",
    summary:
      "Built the resume screening, one-click interview scheduling and AI-led pre-screening behind Shoppers Stop's internal recruitment tool. My first time shipping something a company actually runs day to day.",
    date: "2025-07-11",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/posts/vibhugupta1508_internship-ai-ml-ugcPost-7349528976354115584-2Pgg/",
    tags: ["HR Tech", "Vertex AI", "Shipping"],
  },

  {
    kind: "external",
    slug: "smlra-code-to-impact",
    title: "From Code to Impact: teaching ML end to end",
    summary:
      "Ran SMLRA's hands-on workshop covering sentiment analysis, OCR, and actually deploying the result with Flask and Render. The first event we delivered with a properly structured team — which mattered more than the syllabus did.",
    date: "2025-01-27",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/posts/vibhugupta1508_ai-machinelearning-smlra-activity-7289533503325573122-gpWC",
    tags: ["Teaching", "OCR", "Deployment"],
  },
  {
    kind: "external",
    slug: "cracking-the-code-of-llms",
    title: "Cracking the Code of LLMs — my first seminar",
    summary:
      "My first time presenting at SMLRA: GPT-3.5, OpenAI's Sora, and the Indian models starting to appear next to them — Krutrim and Sarvam. It's what got me onto the council.",
    date: "2024-03-09",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/posts/vibhugupta1508_ai-gpt3-openai-activity-7172287675297738752-x55F",
    tags: ["LLMs", "Speaking", "SMLRA"],
  },

  /* ── Hosted here ──────────────────────────────────────────────────
     Add a native post by copying this shape. It gets its own page at
     /blog/<slug> automatically — no route to write, no build step. Delete
     this example once you have a real one. */
  // {
  //   kind: "native",
  //   slug: "why-on-prem-rag",
  //   title: "Why on-prem RAG is a different problem",
  //   summary: "What changes when the documents are not allowed to leave the building.",
  //   date: "2026-06-01",
  //   tags: ["RAG", "On-prem"],
  //   lede: "The constraint at NSE was never cost. It was that nothing could leave.",
  //   body: [
  //     { heading: "The constraint", paragraphs: ["...", "..."] },
  //     { heading: "What broke first", paragraphs: ["..."] },
  //   ],
  // },
];

/** Newest first. */
export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const nativePosts = posts.filter(
  (p): p is Extract<Post, { kind: "native" }> => p.kind === "native"
);

export function formatDate(iso: string, lang: Lang = "en") {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    lang === "hi" ? "hi-IN" : "en-GB",
    { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }
  );
}

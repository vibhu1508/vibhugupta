import { NextResponse } from "next/server";
import { complete, type ChatMessage } from "@/lib/llm/providers";
import { NAV_VIEWS, systemPrompt, TOOLS } from "@/lib/llm/context";
import { stripReasoning } from "@/lib/llm/sanitize";
import { screenInput, screenOutput } from "@/lib/llm/guard";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { projects, roles } from "@/content/profile";

export const runtime = "nodejs";
/* Never cached: the answer depends on the question. */
export const dynamic = "force-dynamic";

/* Same source as the tool schema — the server-side check and the enum the
   model sees must agree, or valid navigation gets thrown away. */
const VALID_VIEWS = new Set(NAV_VIEWS);
const VALID_PROJECTS = new Set(projects.map((p) => p.id));
const VALID_ROLES = new Set(roles.map((r) => r.id));

type Body = { question?: unknown; lang?: unknown };

export async function POST(req: Request) {
  /* ── guardrail 1: rate limit ─────────────────────────────
     The API key lives only on this server, so the only way to drain it is
     through this route. 20/min per IP is generous for a human and useless
     for a scraper. */
  const gate = rateLimit(`ask:${clientIp(req)}`, { limit: 20, windowMs: 60_000 });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Slow down a moment." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  /* ── guardrail 2: bound the input ────────────────────────
     A 50KB "question" is an attack on our token budget, not a question. */
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 600) : "";
  if (!question) {
    return NextResponse.json({ error: "Empty question" }, { status: 400 });
  }
  const lang = body.lang === "hi" ? "hi" : "en";

  /* Screen before spending a token. A blocked request costs nothing and
     answers instantly, so this is a cost control as much as a guard. */
  const screened = screenInput(question);
  if (!screened.ok) {
    console.info(`[ask] blocked (${screened.kind}) from ${clientIp(req)}`);
    return NextResponse.json({ answer: screened.reply[lang] });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(lang) },
    { role: "user", content: `VISITOR: ${screened.clean}` },
  ];

  try {
    const out = await complete(messages, TOOLS);

    /* ── guardrail 3: validate every tool call ──────────────
       The enum in the schema is a request, not a guarantee. Anything the
       model invents is dropped here rather than trusted downstream. */
    const action: {
      view?: string;
      project?: string;
      role?: string;
      detail?: { type: "work" | "project"; id: string };
    } = {};
    for (const call of out.toolCalls) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (call.function.name === "navigate" && typeof args.view === "string" && VALID_VIEWS.has(args.view)) {
        action.view = args.view;
      }
      if (call.function.name === "open_project" && typeof args.project === "string" && VALID_PROJECTS.has(args.project)) {
        action.project = args.project;
      }
      if (call.function.name === "open_role" && typeof args.role === "string" && VALID_ROLES.has(args.role)) {
        action.role = args.role;
      }
      /* Detail routing is a real navigation, so the id is checked against the
         set that matches its own type — a project id with type:"work" would
         otherwise produce a 404 route. */
      if (call.function.name === "open_detail" && typeof args.id === "string") {
        const t = args.type === "work" ? "work" : args.type === "project" ? "project" : null;
        const ok = t === "work" ? VALID_ROLES.has(args.id) : t === "project" ? VALID_PROJECTS.has(args.id) : false;
        if (t && ok) action.detail = { type: t, id: args.id };
      }
    }

    /* Last line of defence: this text gets spoken aloud, so nothing that
       looks like deliberation may reach the client. */
    const answer = screenOutput(stripReasoning(out.text));
    if (out.text && !answer) {
      console.warn("[ask] dropped a leaked reasoning trace from", out.provider);
    }

    return NextResponse.json(
      {
        answer,
        action: Object.keys(action).length ? action : undefined,
      },
      { headers: { "Server-Timing": `llm;dur=${out.ms};desc="${out.provider}"` } }
    );
  } catch (e) {
    // Every provider is down or unconfigured. The client degrades to the
    // local grammar, so the site stays usable.
    console.error("[ask]", (e as Error).message);
    return NextResponse.json({ error: "Model unavailable" }, { status: 503 });
  }
}

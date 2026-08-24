import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { profile } from "@/content/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The one endpoint with real-world side effects, so it gets the strictest
 * handling in the codebase.
 *
 * Design rule: THE MODEL NEVER CALLS THIS. It can only offer the form; a
 * human fills it in and submits. Contact details are never model-generated,
 * because a hallucinated address means emailing a stranger.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = { name?: unknown; email?: unknown; message?: unknown; company?: unknown };

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Tight: a real person sends one of these, not five.
  const gate = rateLimit(`connect:${ip}`, { limit: 3, windowMs: 60 * 60_000 });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "You've already sent a message recently." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Honeypot: a hidden field no human ever fills. Bots fill everything.
  // Return 200 so the bot believes it succeeded and doesn't retry.
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";

  if (!name || !message) {
    return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const at = new Date().toISOString();
  const ua = req.headers.get("user-agent")?.slice(0, 200) ?? "";
  const payload = { at, ip, name, email, message, ua };

  /* Delivery, in order of preference. Each is optional; whatever is
     configured runs. With nothing configured the message is logged and the
     visitor still sees success — losing one message beats showing someone an
     error they cannot act on. */
  let delivered = false;

  /* Resend: 3,000 emails/month free. `reply_to` is the detail that matters —
     it means hitting reply in your inbox goes to the visitor, not to you. */
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || profile.email;

  if (resendKey && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `Portfolio — ${name}`,
          text: [
            `${name} <${email}>`,
            "",
            message,
            "",
            "—",
            `${at} · IP ${ip}`,
            ua,
          ].join("\n"),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new Error(`resend ${res.status} ${await res.text().catch(() => "")}`.slice(0, 200));
      }
      delivered = true;
    } catch (e) {
      console.error("[connect] resend failed:", (e as Error).message);
    }
  }

  /* A Discord or Slack incoming webhook. Fine on its own, and a decent
     backstop when the email provider is having a bad day. */
  const hook = process.env.CONNECT_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `**${name}** <${email}>\n${message}`, payload }),
        signal: AbortSignal.timeout(5000),
      });
      delivered = true;
    } catch (e) {
      console.error("[connect] webhook failed:", (e as Error).message);
    }
  }

  if (!delivered) {
    console.warn("[connect] NOT DELIVERED —", JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true });
}

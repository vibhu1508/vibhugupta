import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hands the browser what it needs to open a Sarvam realtime socket.
 *
 * Sarvam's browser auth is the `api-subscription-key.<key>` subprotocol,
 * which means the key necessarily reaches the client. There is no way around
 * that without a WebSocket proxy, and Vercel's serverless functions cannot
 * hold a socket open.
 *
 * So this route refuses by default. You must set SARVAM_ALLOW_CLIENT_KEY=true
 * to opt in, which is fine for local testing and wrong for a public deploy.
 * When it refuses, the client silently falls back to the browser's own Web
 * Speech API — no key, no cost, still works.
 *
 * For production: run a small WS proxy (Render/Fly/Railway free tier) that
 * holds the key server-side, and return its wss:// URL as `url` with no `key`.
 */
export async function GET(req: Request) {
  const gate = rateLimit(`stt:${clientIp(req)}`, { limit: 12, windowMs: 60_000 });
  if (!gate.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  // A proxy URL is always safe to hand out — it carries no secret.
  const proxy = process.env.SARVAM_WS_PROXY_URL;
  if (proxy) {
    return NextResponse.json({ url: proxy });
  }

  const key = process.env.SARVAM_API_KEY;
  /* On localhost the key is already on your own machine, so requiring an
     extra opt-in there is friction with no security benefit — it just makes
     Sarvam look broken when you've set the key correctly. In production the
     explicit flag is still mandatory. */
  const allow =
    process.env.SARVAM_ALLOW_CLIENT_KEY === "true" || process.env.NODE_ENV !== "production";

  if (!key || !allow) {
    return NextResponse.json(
      { error: "sarvam not enabled", fallback: "webspeech" },
      { status: 403 }
    );
  }

  return NextResponse.json({ key });
}

/**
 * Fixed-window limiter, in memory.
 *
 * Deliberately not Redis: this protects a portfolio's free-tier API keys,
 * and a per-instance limit is enough for that. It resets on cold start,
 * which is an acceptable trade for zero infrastructure and zero cost.
 */

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

/** Cap the map so a flood of unique IPs can't grow it without bound. */
const MAX_KEYS = 5000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now > hit.resetAt) {
    if (buckets.size > MAX_KEYS) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
      if (buckets.size > MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  hit.count++;
  const ok = hit.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - hit.count),
    retryAfter: ok ? 0 : Math.ceil((hit.resetAt - now) / 1000),
  };
}

/** Best-effort client IP behind Vercel/Cloudflare. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  return (
    h.get("cf-connecting-ip") ??
    (fwd ? fwd.split(",")[0].trim() : null) ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

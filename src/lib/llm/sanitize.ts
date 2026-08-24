/**
 * Strip any reasoning a model leaks into its answer.
 *
 * This is not belt-and-braces paranoia. The answer is read aloud in a cloned
 * voice, so leaked chain-of-thought isn't a cosmetic bug — it narrates the
 * model's deliberation to a visitor. Provider flags help but are per-vendor
 * and can silently stop working; this runs on every response regardless of
 * which provider served it.
 */

/** <think>…</think>, <thinking>…</thinking>, and unclosed variants. */
const THINK_TAGS = /<\s*(think|thinking|reasoning|scratchpad)\s*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const OPEN_TAG = /<\s*(think|thinking|reasoning|scratchpad)\s*>[\s\S]*$/i;

/** First-person planning voice — how a leaked trace reads. */
const PLANNING = [
  /\bwe need to\b/i,
  /\bwe should\b/i,
  /\bwe must\b/i,
  /\blet me (think|check|see)\b/i,
  /\bthe (question|user) (is|wants|asks)\b/i,
  /\bthe answer should\b/i,
  /\bi should (answer|respond|mention)\b/i,
];

/** Where a trace hands off to its conclusion. Global so we can take the
 *  LAST one: a trace usually says "we need to answer:" long before it says
 *  "thus answer:", and slicing at the first match keeps all the reasoning. */
const HANDOFF = /(?:^|[\s\n])(?:thus,?\s+|so,?\s+)?(?:the\s+)?(?:final\s+)?answer\s*[:\-—]\s*/gi;

export function stripReasoning(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const text = raw.replace(THINK_TAGS, "").replace(OPEN_TAG, "").trim();
  if (!text) return null;

  const leaked = PLANNING.filter((re) => re.test(text)).length;
  if (leaked === 0) return text;

  // A trace that reached a conclusion: keep only what follows the LAST handoff.
  const matches = [...text.matchAll(HANDOFF)];
  const last = matches.at(-1);
  if (last?.index !== undefined) {
    const after = text.slice(last.index + last[0].length).trim();
    // Traces often trail off with meta-commentary ("But need 2-3 sentences").
    const cleaned = after.replace(/\bbut (need|should|keep)\b[\s\S]*$/i, "").trim();
    if (cleaned.length > 20 && !PLANNING.some((re) => re.test(cleaned))) return cleaned;
  }

  /* Reasoning with no recoverable answer. Returning null makes the client
     show its graceful fallback — which is a better outcome than reading a
     wall of deliberation to someone. */
  return null;
}

import type { Lang } from "@/content/profile";

/**
 * Input and output screening for the ask route.
 *
 * Scope note: this app has no database, no ORM and no shell, so SQL and
 * command injection have no surface here. React escapes every interpolated
 * string, so the answer path is not an XSS sink either. The real risks are
 * narrower:
 *
 *   1. Prompt injection - rewriting the persona, extracting the system
 *      prompt, or coaxing the model into disparaging Vibhu.
 *   2. Free-compute abuse - using a portfolio API key as a general
 *      assistant. This is the one with a running cost attached.
 *
 * Both are screened BEFORE the model call, so a blocked request spends zero
 * tokens. That makes this a cost control as much as a security control.
 */

export type Screen =
  | { ok: true; clean: string }
  | { ok: false; kind: "injection" | "abuse"; reply: Record<Lang, string> };

/* Zero-width and bidi controls are a genuine smuggling vector: instructions
   hidden in them are invisible to a reviewer and legible to the model.
   Written as escapes deliberately - literal invisible characters in source
   cannot be reviewed. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g;

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget|override)\b[^.?!]{0,40}\b(previous|prior|above|earlier|all)\b[^.?!]{0,20}\b(instruction|prompt|rule|direction)/i,
  /\b(what|show|print|reveal|repeat|tell me|give me)\b[^.?!]{0,30}\b(your|the)\s+(system\s+)?(prompt|instructions?|rules|guidelines)\b/i,
  /\brepeat\b[^.?!]{0,20}\b(everything|all|text)\b[^.?!]{0,20}\babove\b/i,
  /\b(you are now|from now on,? you|act as (if|a)|pretend (to be|you)|roleplay as|simulate being)\b/i,
  /\b(developer|debug|god|admin)\s+mode\b/i,
  /\bjailbreak\b|\bDAN\b(?!\w)/,
  /<\|?\s*(im_start|im_end|system|endoftext)\s*\|?>/i,
  /\bnew\s+(instructions?|rules?|system\s+prompt)\s*[:\-]/i,
];

/* Deliberately narrow. "Can you write Python?" and "what is your SQL
   experience?" are legitimate interview questions and must pass - only
   imperative do-work-for-me requests are caught. */
const ABUSE: RegExp[] = [
  /\bwrite\b[^.?!]{0,20}\b(a|an|me|some)\b[^.?!]{0,25}\b(script|program|function|code|essay|poem|story|song|email|letter|article|blog)\b/i,
  /\b(translate|summari[sz]e|paraphrase|rewrite|proofread)\b[^.?!]{0,25}\b(this|the following|the text|below|for me)\b/i,
  /\b(solve|calculate|compute)\b[^.?!]{0,20}[\d(]/i,
  /```[\s\S]*```/,
  /\b(what'?s|what is)\s+the\s+(weather|time|news|capital|population)\b/i,
  /\b(debug|fix|refactor|optimi[sz]e)\b[^.?!]{0,15}\b(my|this|the following)\b[^.?!]{0,15}\b(code|function|script|query)\b/i,
];

const DECLINE: Record<"injection" | "abuse", Record<Lang, string>> = {
  injection: {
    en: "Nice try. I would rather talk about the work - ask me about the on-prem RAG build at NSE, or anything else I have shipped.",
    hi: "अच्छी कोशिश। मैं अपने काम के बारे में बात करना पसंद करूँगा।",
  },
  abuse: {
    en: "I am not a general assistant - I only talk about my own work. Ask me what I have built, or how something was done.",
    hi: "मैं एक सामान्य असिस्टेंट नहीं हूँ - मैं सिर्फ़ अपने काम की बात करता हूँ।",
  },
};

export function screenInput(raw: string): Screen {
  const clean = raw.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();

  if (INJECTION.some((re) => re.test(clean))) {
    return { ok: false, kind: "injection", reply: DECLINE.injection };
  }
  if (ABUSE.some((re) => re.test(clean))) {
    return { ok: false, kind: "abuse", reply: DECLINE.abuse };
  }
  return { ok: true, clean };
}

/* Structural markers from the system prompt. If any appear in a reply the
   model has begun quoting its own instructions - drop the whole answer
   rather than trying to trim around it. */
const LEAK = /\b(DOSSIER|SECURITY|HOW HE SOUNDS|ROUTING|VISITOR:|system prompt)\b/;

export function screenOutput(text: string | null): string | null {
  if (!text) return null;
  return LEAK.test(text) ? null : text;
}

/**
 * LOCAL INTENT GRAMMAR — Path A.
 *
 * Runs on every interim speech result and every keystroke. Zero network,
 * zero cost, zero API key. It handles most real usage and is the reason the
 * site still navigates when every free tier is down.
 *
 * Entity patterns are generated from profile.ts, so adding a project or a
 * job automatically makes it addressable by voice — no pattern to maintain.
 */

import { projects, roles } from "@/content/profile";

export type NavSection = "hero" | "about" | "work" | "projects" | "writing" | "impact" | "stack" | "connect";

export type Intent =
  | { kind: "navigate"; section: NavSection }
  /* Full page, not just the card: "tell me about X in detail" should leave
     the one-pager and land on /work/:id or /projects/:id. */
  | { kind: "open_detail"; type: "work" | "project"; id: string }
  | { kind: "open_project"; id?: string; ordinal?: number }
  | { kind: "open_role"; id: string }
  | { kind: "set_lang"; lang: "en" | "hi" }
  | { kind: "stop" };

export type Match = {
  intent: Intent;
  confidence: number;
  /** Fired before the sentence finished. Roll back if the final disagrees. */
  speculative: boolean;
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[.,!?;:'"()]/g, " ").replace(/\s+/g, " ").trim();

/* ── Entity aliases ────────────────────────────────────────────
   Hand-written where speech recognition mangles a name, generated
   otherwise. Romanised Hindi is included because browser STT and
   Sarvam's translit mode both return Latin script for spoken Hindi. */

const ROLE_ALIASES: Record<string, string[]> = {
  nse: ["nse", "national stock exchange", "stock exchange", "n s e"],
  "tata-elxsi": ["tata elxsi", "tata", "elxsi", "elsxi", "smart executor", "qoetient"],
  "shoppers-stop": ["shoppers stop", "shopper stop", "shoppersstop", "niyukti"],
  partnr: ["partnr", "partner networks", "global placement"],
  teamlease: ["teamlease", "team lease"],
  "google-crowdsource": ["google crowdsource", "crowdsource", "google"],
  smlra: ["smlra", "somaiya machine learning", "council lead", "research association"],
};

const PROJECT_ALIASES: Record<string, string[]> = {
  rememly: ["rememly", "remembly", "second brain", "knowledge graph"],
  amlguard: ["amlguard", "aml guard", "aml", "money laundering", "fraud detection"],
  stocksage: ["stocksage", "stock sage", "options", "nse data", "trading"],
};

/* Every role/project id is addressable by its own name even if not aliased. */
for (const r of roles) {
  (ROLE_ALIASES[r.id] ??= []).push(r.company.toLowerCase());
}
for (const p of projects) {
  (PROJECT_ALIASES[p.id] ??= []).push(p.name.toLowerCase());
}

const SECTIONS: { section: NavSection; patterns: RegExp[] }[] = [
  {
    section: "about",
    patterns: [
      /\b(about|who are you|tell me about (your ?self|him|them)|background|education|study|studies|college)\b/,
      /\b(apne? bare? me|aap kaun|padhai)\b/,
      /अपने बारे|कौन ह|पढ़ाई/,
    ],
  },
  {
    section: "work",
    patterns: [
      /\b(work|experience|job|internship|career|employment|resume)\b/,
      /\b(anubhav|kaam|naukri)\b/,
      /अनुभव|काम/,
    ],
  },
  {
    section: "projects",
    patterns: [/\b(projects?|built|build|portfolio work|what have you made)\b/, /\b(project dikha)/, /प्रोजेक्ट/],
  },
  {
    section: "writing",
    patterns: [
      /\b(blogs?|writing|writes?|written|wrote|articles?|posts?|essays?|newsletter|publications?)\b/,
      /\b(likha|lekh|blog padh)\b/,
      /लेख|ब्लॉग/,
    ],
  },
  {
    section: "impact",
    patterns: [/\b(impact|results?|numbers?|metrics|achievements?|awards?|outcomes?)\b/, /\b(natije|uplabdhi)\b/, /उपलब्धि|परिणाम/],
  },
  {
    section: "stack",
    patterns: [/\b(stack|skills?|tech|technolog(y|ies)|tools?|languages?)\b/, /\b(kaushal|takneek)\b/, /कौशल|तकनीक/],
  },
  {
    section: "connect",
    patterns: [/\b(contact|connect|reach|email|hire|get in touch|talk to you)\b/, /\b(sampark|baat kar)\b/, /संपर्क/],
  },
  {
    section: "hero",
    patterns: [/\b(home|top|start over|beginning)\b/, /\b(shuru|upar)\b/, /होम|शुरू/],
  },
];

const ORDINALS: Record<string, number> = {
  first: 1, one: 1, pehla: 1, pehle: 1,
  second: 2, two: 2, dusra: 2, doosra: 2,
  third: 3, three: 3, teesra: 3, tisra: 3,
  last: -1, aakhri: -1,
};

/** Longest alias first, so "national stock exchange" beats a stray "stock". */
function findEntity(text: string, table: Record<string, string[]>): { id: string; len: number } | null {
  let best: { id: string; len: number } | null = null;
  for (const [id, aliases] of Object.entries(table)) {
    for (const alias of aliases) {
      if (!text.includes(alias)) continue;
      // Guard against a 2-3 char alias matching inside a longer word.
      if (alias.length < 4 && !new RegExp(`\\b${alias}\\b`).test(text)) continue;
      if (!best || alias.length > best.len) best = { id, len: alias.length };
    }
  }
  return best;
}

export function matchIntent(transcript: string, isFinal = false): Match | null {
  const text = normalize(transcript);
  if (text.length < 2) return null;

  const spec = !isFinal;

  if (/\b(stop|cancel|quiet|shut up|never ?mind)\b|\b(ruko|band karo|chup)\b|रुको/.test(text)) {
    return { intent: { kind: "stop" }, confidence: 0.95, speculative: spec };
  }
  if (/\b(hindi|हिंदी|hindee)\b/.test(text)) {
    return { intent: { kind: "set_lang", lang: "hi" }, confidence: 0.9, speculative: spec };
  }
  if (/\b(english|अंग्रेज़ी|angrezi)\b/.test(text)) {
    return { intent: { kind: "set_lang", lang: "en" }, confidence: 0.9, speculative: spec };
  }

  /* ── Entities beat sections ───────────────────────────────
     "tell me about the NSE work" must open NSE, not dump the whole
     experience list. Naming a thing is a stronger signal than naming
     the section that contains it — this is the bug from the screenshots. */
  const role = findEntity(text, ROLE_ALIASES);
  const project = findEntity(text, PROJECT_ALIASES);

  /* "in detail", "full story", "deep dive", "everything about" — the visitor
     is asking to leave the summary, so send them to the page rather than
     expanding a card in place. */
  const wantsDetail =
    /\b(in detail|detailed|full (story|case study|details?)|case study|deep ?dive|everything about|more about|tell me all)\b/.test(text) ||
    /\b(vistaar se|detail me|pura batao|vistrit)\b/.test(text) ||
    /विस्तार|पूरा बता/.test(text);

  if (role && (!project || role.len >= project.len)) {
    return {
      intent: wantsDetail
        ? { kind: "open_detail", type: "work", id: role.id }
        : { kind: "open_role", id: role.id },
      confidence: 0.92,
      speculative: spec,
    };
  }
  if (project) {
    return {
      intent: wantsDetail
        ? { kind: "open_detail", type: "project", id: project.id }
        : { kind: "open_project", id: project.id },
      confidence: 0.92,
      speculative: spec,
    };
  }

  // "open the second one"
  const ord = Object.entries(ORDINALS).find(([w]) => new RegExp(`\\b${w}\\b`).test(text));
  if (ord && /\b(open|show|that|one|wala|kholo|dikha)\b/.test(text)) {
    return { intent: { kind: "open_project", ordinal: ord[1] }, confidence: 0.82, speculative: spec };
  }

  let best: Match | null = null;
  for (const s of SECTIONS) {
    for (let i = 0; i < s.patterns.length; i++) {
      if (!s.patterns[i].test(text)) continue;
      const specificity = 1 - i * 0.1;
      const coverage = Math.min(1, text.length / 18);
      const score = Math.min(0.96, specificity * (0.55 + coverage * 0.45));
      if (!best || score > best.confidence) {
        best = { intent: { kind: "navigate", section: s.section }, confidence: score, speculative: spec };
      }
    }
  }

  if (!best) return null;

  /* A wrong speculative jump is visible to the visitor, so mid-sentence
     firing needs a much higher bar than a settled transcript. */
  const threshold = isFinal ? 0.45 : 0.74;
  return best.confidence >= threshold ? best : null;
}

/** Local fuzzy autocomplete. No API call, no latency. */
export function suggest(input: string, bank: string[], limit = 5): string[] {
  const q = normalize(input);
  if (!q) return [];
  return bank
    .map((candidate) => {
      const c = normalize(candidate);
      let score = 0;
      if (c.startsWith(q)) score = 100;
      else if (c.includes(q)) score = 60;
      else {
        // Subsequence: "wht r u prd of" still finds the question.
        let qi = 0;
        for (let ci = 0; ci < c.length && qi < q.length; ci++) if (c[ci] === q[qi]) qi++;
        if (qi === q.length) score = 30;
      }
      // Word-prefix bonus: typing "nse" should rank "…at NSE?" highly.
      if (score && c.split(" ").some((w) => w.startsWith(q))) score += 25;
      return { candidate, score: score - c.length * 0.04 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.candidate);
}

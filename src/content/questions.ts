import { projects, roles, type Lang, type SectionId } from "./profile";

/**
 * The question bank.
 *
 * Two jobs: it drives autocomplete (local fuzzy match, zero API cost) and it
 * is the render list for the pre-generated voice cache — each entry gets a
 * cloned-voice clip rendered offline, so the common path has no TTS latency.
 *
 * Curating these is a feature, not a limitation: it steers visitors toward
 * the questions that show the work best, and it means the answers people
 * hear most are the ones that were reviewed by a human.
 */

export type Question = {
  q: Localized;
  /** Where this question is most useful — powers context-aware suggestions. */
  context: SectionId | "any";
  /** Weight for ranking; higher surfaces sooner on an empty input. */
  weight: number;
};

type Localized = Record<Lang, string>;

const base: Question[] = [
  // Opening moves — what a recruiter actually asks first.
  { q: { en: "What are you most proud of?", hi: "आपको किस पर सबसे ज़्यादा गर्व है?" }, context: "any", weight: 10 },
  { q: { en: "Give me the 30-second version", hi: "तीस सेकंड में बताइए" }, context: "any", weight: 9 },
  { q: { en: "What are you looking for right now?", hi: "आप अभी क्या ढूंढ रहे हैं?" }, context: "any", weight: 9 },
  { q: { en: "When do you graduate?", hi: "आप कब ग्रेजुएट हो रहे हैं?" }, context: "any", weight: 6 },

  // Depth — the questions that separate a real engineer from a resume.
  { q: { en: "What's the hardest bug you've fixed?", hi: "सबसे मुश्किल बग कौन सा था?" }, context: "any", weight: 8 },
  { q: { en: "Have you shipped anything to production?", hi: "क्या आपने कुछ प्रोडक्शन में भेजा है?" }, context: "work", weight: 8 },
  { q: { en: "Where have you worked with real constraints?", hi: "असली बाधाओं के साथ कहाँ काम किया?" }, context: "work", weight: 7 },
  { q: { en: "What would you build differently today?", hi: "आज आप क्या अलग बनाते?" }, context: "projects", weight: 6 },

  // Technical — the stack questions.
  { q: { en: "How deep is your RAG experience?", hi: "RAG का अनुभव कितना गहरा है?" }, context: "stack", weight: 9 },
  { q: { en: "Have you run LLMs on-premise?", hi: "क्या आपने ऑन-प्रेम LLM चलाए हैं?" }, context: "stack", weight: 8 },
  { q: { en: "What do you know about MCP?", hi: "MCP के बारे में क्या जानते हैं?" }, context: "stack", weight: 8 },
  { q: { en: "Vector search or knowledge graphs?", hi: "वेक्टर सर्च या नॉलेज ग्राफ़?" }, context: "stack", weight: 7 },
  { q: { en: "How do you evaluate a retrieval system?", hi: "रिट्रीवल सिस्टम का मूल्यांकन कैसे करते हैं?" }, context: "stack", weight: 7 },
  { q: { en: "Are you a backend or an ML person?", hi: "आप बैकएंड हैं या ML?" }, context: "stack", weight: 6 },

  // Impact — the numbers.
  { q: { en: "What's your biggest measurable impact?", hi: "सबसे बड़ा मापने योग्य प्रभाव क्या है?" }, context: "impact", weight: 9 },
  { q: { en: "How did you cut query time to 90 seconds?", hi: "क्वेरी समय 90 सेकंड कैसे किया?" }, context: "impact", weight: 8 },

  // Closing.
  { q: { en: "How do I reach you?", hi: "आपसे कैसे संपर्क करें?" }, context: "connect", weight: 8 },
  { q: { en: "Are you open to relocating?", hi: "क्या आप रीलोकेट कर सकते हैं?" }, context: "connect", weight: 6 },
];

/* Generated per-entity questions — every role and project earns its own,
   so the bank grows automatically as profile.ts grows. */
const generated: Question[] = [
  ...roles.map((r) => ({
    q: {
      en: `What did you do at ${r.company}?`,
      hi: `${r.company} में आपने क्या किया?`,
    },
    context: "work" as const,
    weight: 7,
  })),
  ...projects.map((p) => ({
    q: {
      en: `Tell me about ${p.name}`,
      hi: `${p.name} के बारे में बताइए`,
    },
    context: "projects" as const,
    weight: 7,
  })),
];

export const QUESTIONS: Question[] = [...base, ...generated];

/**
 * Suggestions for the current context.
 * On an empty input we show the highest-weighted questions for wherever the
 * visitor is standing — so the prompts are always relevant to what's on screen.
 */
export function suggestionsFor(
  section: SectionId | "hero",
  lang: Lang,
  limit = 6
): string[] {
  const ctx = section === "hero" ? "any" : section;
  return [...QUESTIONS]
    .map((q) => ({
      text: q.q[lang],
      // In-context questions outrank generic ones, but generics stay available.
      score: q.weight + (q.context === ctx ? 6 : q.context === "any" ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((q) => q.text);
}

/** Flat list for fuzzy matching while typing. */
export function allQuestions(lang: Lang): string[] {
  return QUESTIONS.map((q) => q.q[lang]);
}

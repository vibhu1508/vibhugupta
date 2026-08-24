import type { Lang } from "./profile";

/**
 * The pre-rendered answer bank.
 *
 * Every line here gets a clip generated offline in Vibhu's cloned voice and
 * shipped as a static file. That is the whole latency trick: the questions
 * people actually ask are answered with zero synthesis time and zero cost,
 * and only genuinely novel questions fall through to live speech.
 *
 * It is also a quality control. You hear each of these before it ships and
 * can regenerate a bad take — live TTS gives you exactly one attempt.
 *
 * `key` becomes the filename: public/audio/en/<key>.mp3 and audio/hi/<key>.mp3.
 *
 * TODO(vibhu): these are drafted from the dossier. Read them aloud before
 * generating — anything that doesn't sound like you in your own mouth should
 * be rewritten, because you are about to hear it in your own voice.
 */
export type VoiceLine = { key: string; text: Record<Lang, string> };

export const voiceLines: VoiceLine[] = [
  {
    key: "greeting",
    text: {
      en: "Hey. Ask me anything about my work.",
      hi: "नमस्ते। मेरे काम के बारे में कुछ भी पूछिए।",
    },
  },
  {
    key: "proudest",
    text: {
      en: "The on-prem AI server at NSE. Everything had to run inside the building, so I built an MCP layer to orchestrate the RAG tools, and hybrid retrieval took document queries from three minutes to under ninety seconds.",
      hi: "NSE का ऑन-प्रेम AI सर्वर। सब कुछ बिल्डिंग के अंदर चलना था, तो मैंne MCP लेयर बनाई और क्वेरी टाइम तीन मिनट से नब्बे सेकंड तक ले आया।",
    },
  },
  {
    key: "thirty-second",
    text: {
      en: "Final year computer science at KJ Somaiya, and a data science degree at IIT Madras at the same time. I build AI systems that run where the data isn't allowed to leave — on-prem RAG, agent orchestration over MCP, retrieval that survives enterprise constraints.",
      hi: "KJ सोमैया से CS में अंतिम वर्ष, साथ में IIT मद्रास से डेटा साइंस। मैं ऐसे AI सिस्टम बनाता हूँ जो वहीं चलें जहाँ डेटा बाहर नहीं जा सकता।",
    },
  },
  {
    key: "hardest-problem",
    text: {
      en: "Making retrieval accurate enough to trust inside a regulated environment. Pure vector search kept missing exact identifiers, so I combined BM25 with vector search — the hybrid held up where neither did alone.",
      hi: "रेगुलेटेड माहौल में रिट्रीवल को भरोसेमंद बनाना। सिर्फ़ वेक्टर सर्च exact identifiers मिस कर रहा था, तो मैंने BM25 और वेक्टर सर्च मिलाए।",
    },
  },
  {
    key: "availability",
    text: {
      en: "Yes — I'm looking for AI engineering work. The easiest way to reach me is the form at the bottom of this page, or email directly.",
      hi: "हाँ — मैं AI इंजीनियरिंग का काम ढूँढ रहा हूँ। नीचे दिए फ़ॉर्म से या सीधे ईमेल से संपर्क करें।",
    },
  },
  {
    key: "unknown",
    text: {
      en: "I don't have that detail to hand — but ask me about the work itself and I can go deep.",
      hi: "यह जानकारी मेरे पास नहीं है — लेकिन काम के बारे में पूछिए, उस पर विस्तार से बता सकता हूँ।",
    },
  },
];

export const voiceKeys = voiceLines.map((v) => v.key);

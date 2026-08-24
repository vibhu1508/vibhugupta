/**
 * SINGLE SOURCE OF TRUTH — sourced from Vibhu's resume (Aug 2026).
 *
 * Feeds: the HUD, the 3D carousel, and the agent's cached system prompt.
 * Rule: if a fact isn't here, the agent structurally cannot say it.
 *
 * NOTE: phone number deliberately omitted. Email only — a public site
 * with a scrapeable phone number invites spam calls.
 */

export type Lang = "en" | "hi";
export type Localized = Record<Lang, string>;

/** `key` is the lowercased filename in /public/media/work, resolved through
 *  the build-time manifest. Never a hardcoded path. */
export type Photo = { key: string; alt: string; caption?: string };

export type Detail = {
  /** Long-form paragraphs for the detail page. Written by you, not an LLM. */
  body?: string[];
  /** Named sections: problem / architecture / what broke / what I'd change. */
  sections?: { heading: string; body: string[] }[];
  metrics?: { value: string; label: string }[];
  images?: Photo[];
};

export type Project = {
  id: string;
  logo?: string;
  photos?: Photo[];
  name: string;
  tagline: Localized;
  stack: string[];
  highlights: string[];
  links?: { label: string; href: string }[];
  detail?: Detail;
};

export type Role = {
  id: string;
  /** Basename in /public/logos/org — falls back to a monogram if absent. */
  logo?: string;
  /** Photos from this role: /public/media/work/… */
  photos?: Photo[];
  company: string;
  title: string;
  location: string;
  mode: "On-Site" | "Remote" | "Hybrid";
  period: string;
  stack: string[];
  highlights: string[];
  detail?: Detail;
};

export const profile = {
  name: "Vibhu Gupta",
  handle: "vibhu1508",
  location: "Mumbai, India",
  email: "guptavibhu1710@gmail.com",
  /* Which photo in /public/media is the portrait. vg1 is 1280x1280, so it
     crops cleanly to the circle; vg2/vg3/vg4 are also available. */
  portraitKey: "vg1",

  role: {
    en: "AI engineer — RAG systems, agents, and on-prem LLM infrastructure",
    hi: "AI इंजीनियर — RAG सिस्टम, एजेंट्स, और ऑन-प्रेम LLM इंफ्रास्ट्रक्चर",
  } satisfies Localized,

  greeting: {
    en: "Ask me anything about my work.",
    hi: "मेरे काम के बारे में कुछ भी पूछिए।",
  } satisfies Localized,

  // TODO(vibhu): rewrite this in your own words before launch.
  // Everything else here is factual from the resume — this is the one
  // place the writing should unmistakably be yours.
  bio: {
    en: "Final-year CS student at KJ Somaiya, simultaneously doing a BS in Data Science at IIT Madras. I build AI systems that run where the data can't leave — on-prem RAG at NSE, agent orchestration over MCP, retrieval that actually holds up under enterprise constraints.",
    hi: "KJ सोमैया से CS में अंतिम वर्ष, साथ ही IIT मद्रास से डेटा साइंस में BS। मैं ऐसे AI सिस्टम बनाता हूँ जो वहीं चलें जहाँ डेटा बाहर नहीं जा सकता।",
  } satisfies Localized,

  education: [
    { degree: "B.Tech, Computer Science", org: "KJ Somaiya College of Engineering", logo: "kjsce", period: "2023–2027", detail: "8.4 GPA · Final year" },
    { degree: "BS, Data Science (Diploma Level)", org: "IIT Madras", logo: "iitm", period: "2023–2027", detail: "8.03 GPA" },
  ],

  socials: [
    { label: "GitHub", href: "https://github.com/vibhu1508" },
    { label: "LinkedIn", href: "https://linkedin.com/in/vibhugupta1508" },
  ],

  /* Grouped the way Vibhu presents it on his GitHub profile — this is the
     real working stack, not the subset that fitted on a resume. */
  skills: {
    Languages: ["Python", "SQL", "TypeScript"],
    Frontend: ["Streamlit", "Angular", "Flutter"],
    Backend: ["FastAPI", "Django", "Flask", "Model Context Protocol"],
    "AI / ML": [
      "LangChain", "LlamaIndex", "Scikit-learn", "TensorFlow", "PyTorch",
      "NumPy", "Pandas", "Matplotlib", "Strands Agents", "Vertex AI",
    ],
    "LLMs & tooling": [
      "Google Gemini", "Anthropic", "OpenAI", "Meta Llama",
      "HuggingFace", "Ollama", "Firecrawl",
    ],
    "Data & vector": [
      "Qdrant", "ChromaDB", "FalkorDB", "Neo4j", "BM25",
      "PostgreSQL", "MySQL", "Supabase", "BigQuery", "Redis",
    ],
    "Cloud & DevOps": [
      "Google Cloud Platform", "AWS", "Azure", "Render", "Vercel",
      "Docker", "Git", "GitLab CI/CD", "n8n",
    ],
  } as Record<string, string[]>,
} as const;

export const roles: Role[] = [
  {
    id: "tata-elxsi",
    photos: [
      { key: "tata-frontdesk", alt: "Tata Elxsi office front desk, Chennai" },
    ],
    logo: "tata-elxsi",
    company: "Tata Elxsi",
    title: "GenAI Intern",
    location: "Chennai",
    mode: "Hybrid",
    period: "Jun 2026 – Jul 2026",
    stack: ["Python", "Tauri", "Kotlin", "FastAPI", "NVIDIA NIM", "WebSockets"],
    highlights: [
      "Improved the Smart Executor test-automation system on the QoEtient MCVA team.",
      "Revamped the Android test automation pipeline, raising test-case pass rate by 40%.",
    ],
  },
  {
    id: "nse",
    logo: "nse",
    photos: [
      { key: "nse-me", alt: "At the National Stock Exchange of India" },
      { key: "nse-id", alt: "NSE access badge" },
    ],
    company: "National Stock Exchange of India",
    title: "AI Intern",
    location: "Mumbai",
    mode: "On-Site",
    period: "Dec 2025 – Jan 2026",
    stack: ["Python", "Ollama", "FastAPI", "HuggingFace", "Qdrant", "BM25", "MCP", "Strands Agents", "Angular"],
    highlights: [
      "Built a secure on-premise AI server using MCP to orchestrate RAG tools across sensitive enterprise workflows — 100% data privacy, zero cloud dependency.",
      "Hybrid retrieval (BM25 + vector) with local LLMs via Ollama cut document query time from 3 minutes to under 90 seconds and reduced manual audit effort by 40%.",
      "Shipped AI services across 4+ enterprise use cases: Q&A, summarisation, chart generation, report automation.",
    ],
  },
  {
    id: "shoppers-stop",
    photos: [
      { key: "ssl-me", alt: "At Shoppers Stop" },
      { key: "ssl-desk", alt: "My workstation at Shoppers Stop" },
      { key: "ssl-meeting", alt: "A working session with the Shoppers Stop team" },
      { key: "ssl-id", alt: "Shoppers Stop access badge" },
      { key: "ssl-desk-vid", alt: "Clip from the desk at Shoppers Stop" },
    ],
    logo: "shoppers-stop",
    company: "Shoppers Stop",
    title: "AI/ML DIT Consultant",
    location: "Mumbai",
    mode: "On-Site",
    period: "May 2025 – Jul 2025",
    stack: ["Python", "Vertex AI", "BigQuery", "Streamlit", "Docker", "GitLab CI/CD", "MS Graph API"],
    highlights: [
      "Architected 'Niyukti AI', an end-to-end recruitment platform projected to reduce annual hiring costs by INR 35 million.",
      "Cut hiring turnaround time by 50% with a context-aware resume-ranking system using Vertex AI, NLP and NER.",
      "Automated interview scheduling via MS Graph API, reducing manual effort by 90%; built an AI preliminary HR interviewer for autonomous first-round screening calls.",
    ],
  },
  {
    id: "partnr",
    logo: "partnr",
    company: "Partnr Networks",
    title: "GenAI Intern (Part-time)",
    location: "Bangalore",
    mode: "Remote",
    period: "Jan 2025 – Sep 2025",
    stack: ["Python", "Google Gemini", "RAG", "NER"],
    highlights: [
      "Designed the core architecture for the Global Placement Program, establishing GenAI pipeline foundations across 50+ job listings.",
      "Led the AI/ML engineering team; built a job recommendation engine using GitHub repository analysis and SkillGraphs, hitting 75% recruiter acceptance on matched candidates.",
    ],
  },
  {
    id: "google-crowdsource",
    photos: [
      { key: "google-goodies", alt: "Google Crowdsource event kit" },
      { key: "google-goodie-distribution1", alt: "Handing out kits at a Crowdsource session" },
      { key: "google-goodie-distribution2", alt: "Students at a Crowdsource session" },
      { key: "google-goodie-distribution3", alt: "Crowdsource community meetup" },
    ],
    logo: "google",
    company: "Google Crowdsource",
    title: "Community Influencers Head",
    location: "Mumbai",
    mode: "On-Site",
    period: "Aug 2025 – Oct 2025",
    stack: ["Public Speaking", "AI Ethics", "Community Leadership"],
    highlights: [
      "Engaged 500+ students on human-in-the-loop feedback for Google Gemini.",
      "Led technical seminars on AI ethics, speech recognition and computer vision data pipelines.",
    ],
  },
  {
    id: "teamlease",
    logo: "teamlease",
    photos: [
      { key: "tl-me", alt: "At TeamLease Services" },
      { key: "tl-me2", alt: "At the TeamLease office" },
    ],
    company: "TeamLease Services",
    title: "ML Intern",
    location: "Bangalore",
    mode: "On-Site",
    period: "May 2024 – Jul 2024",
    stack: ["Python", "Feature Engineering", "Predictive Modelling"],
    highlights: [
      "Analysed 500,000+ records to build predictive models for infant attrition.",
      "Achieved a 16% attrition reduction in mock deployment via a 26-factor matching algorithm.",
    ],
  },
  {
    id: "smlra",
    photos: [
      { key: "smlra-me", alt: "Leading a session as SMLRA Council Lead" },
      { key: "smlra-team-2024-25", alt: "The SMLRA council team, 2024-25" },
      { key: "smlra-first-move", alt: "The First Move 2.0, SMLRA's flagship competition" },
      { key: "smlra-reel-shoot", alt: "Shooting content for SMLRA" },
      { key: "smlra-event1", alt: "Clip from an SMLRA event" },
      { key: "smlra-pod-vid", alt: "SMLRA podcast recording" },
    ],
    logo: "smlra",
    company: "Somaiya ML Research Association",
    title: "Council Lead",
    location: "Mumbai",
    mode: "On-Site",
    period: "Sep 2023 – May 2026",
    stack: ["Leadership", "MLOps", "LLM Architectures"],
    highlights: [
      "Executed 20+ workshops on LLM architectures, MLOps and No-Code AI for 3,000+ participants.",
      "Secured industry sponsorships worth INR 5 million and led flagship competitions.",
    ],
  },
];

export const projects: Project[] = [
  {
    id: "rememly",
    logo: "rememly",
    name: "Rememly.ai",
    tagline: {
      en: "A second brain that turns PDFs, video and the web into a personal knowledge graph.",
      hi: "एक 'सेकंड ब्रेन' जो PDF, वीडियो और वेब को नॉलेज ग्राफ़ में बदलता है।",
    },
    stack: ["Flutter", "FalkorDB", "Google Gemini", "Qdrant", "Firecrawl", "Flask", "PostgreSQL"],
    highlights: [
      "Multi-format ingestion (PDF, video, web) into an interconnected personal knowledge graph.",
      "Graph-based RAG returning curated, source-backed answers over heterogeneous user data.",
    ],
  },
  {
    id: "amlguard",
    logo: "amlguard",
    name: "AMLGuard",
    tagline: {
      en: "Anti-money-laundering fraud detection with sub-30ms inference and explainable alerts.",
      hi: "मनी लॉन्ड्रिंग डिटेक्शन — 30ms से कम inference और explainable अलर्ट।",
    },
    stack: ["Python", "Flask", "Angular", "XGBoost", "Autoencoder", "SHAP", "Scikit-learn"],
    highlights: [
      "Benchmarked 7 techniques (Random Forest, KNN, Decision Trees, Logistic Regression, XGBoost, Autoencoders) across 23 engineered features on JPMC synthetic datasets.",
      "Real-time simulation streaming with a live latency view and AI-generated explanations for each detected fraud.",
      "Held sub-30ms inference — fast enough to sit inside an active payment pipeline.",
    ],
  },
  {
    id: "stocksage",
    logo: "stocksage",
    name: "StockSage India",
    tagline: {
      en: "Real-time NSE analysis with an options strategy builder and live Greeks.",
      hi: "रियल-टाइम NSE विश्लेषण, ऑप्शंस स्ट्रैटेजी बिल्डर और लाइव Greeks।",
    },
    stack: ["Angular", "Flutter", "FastAPI", "DhanHQ API", "Redis", "PostgreSQL", "Google OAuth"],
    highlights: [
      "FastAPI backend processing real-time NSE market data through the DhanHQ API.",
      "Options strategy builder with 38+ presets, live option chains and Greek calculations for retail investors.",
    ],
  },
];

/** Curated question bank — powers local autocomplete AND the pre-rendered voice cache. */
export const questionBank: Localized[] = [
  { en: "What are you most proud of?", hi: "आपको किस पर सबसे ज़्यादा गर्व है?" },
  { en: "Show me your projects", hi: "अपने प्रोजेक्ट दिखाइए" },
  { en: "Tell me about the NSE work", hi: "NSE के काम के बारे में बताइए" },
  { en: "What's your experience with RAG?", hi: "RAG का आपका अनुभव क्या है?" },
  { en: "Are you looking for a role?", hi: "क्या आप नौकरी ढूंढ रहे हैं?" },
  { en: "What have you shipped to production?", hi: "आपने प्रोडक्शन में क्या भेजा है?" },
  { en: "How do I contact you?", hi: "आपसे संपर्क कैसे करें?" },
];

/** Headline numbers, pulled from the work above. The stat wall. */
export const achievements: { value: string; label: Localized; source: string }[] = [
  { value: "INR 35M", label: { en: "Projected annual hiring cost reduction", hi: "अनुमानित वार्षिक हायरिंग लागत में कमी" }, source: "Niyukti AI · Shoppers Stop" },
  { value: "3min → 90s", label: { en: "Enterprise document query time", hi: "एंटरप्राइज़ डॉक्युमेंट क्वेरी समय" }, source: "On-prem RAG · NSE" },
  { value: "3,000+", label: { en: "Engineers trained across 20+ workshops", hi: "20+ वर्कशॉप में प्रशिक्षित इंजीनियर" }, source: "Council Lead · SMLRA" },
  { value: "INR 5M", label: { en: "Industry sponsorships secured", hi: "इंडस्ट्री स्पॉन्सरशिप" }, source: "SMLRA" },
  { value: "< 30ms", label: { en: "Fraud inference, payment-pipeline ready", hi: "फ्रॉड इनफेरेंस लेटेंसी" }, source: "AMLGuard" },
  { value: "75%", label: { en: "Recruiter acceptance on matched candidates", hi: "मैच किए गए कैंडिडेट्स पर स्वीकृति" }, source: "Partnr Networks" },
  { value: "500K+", label: { en: "Records modelled for attrition prediction", hi: "अट्रिशन प्रेडिक्शन के लिए रिकॉर्ड" }, source: "TeamLease" },
  { value: "40%", label: { en: "Android test-case pass rate lift", hi: "टेस्ट-केस पास रेट में वृद्धि" }, source: "Smart Executor · Tata Elxsi" },
];

/**
 * PERSONA — how the agent should sound, and what it may draw on.
 *
 * This is the file to fill in with your own words. Everything else here is
 * resume fact; this is the part that makes a specific answer sound like you
 * rather than like a brochure. The agent is instructed to lean on `takes`
 * and `stories` for depth, and to decline anything it can't ground here.
 */
export const persona = {
  /** How you actually talk. Written as instructions to the agent. */
  voice: [
    "Direct and specific. Lead with the concrete thing that happened, not an adjective about it.",
    "Comfortable saying what didn't work or what you'd do differently — it reads as confidence, not weakness.",
    "Never oversell. If a number is projected rather than measured, say projected.",
    "Engineer-to-engineer by default; drop the jargon only if the visitor clearly isn't technical.",
  ],

  /** TODO(vibhu): opinions you'd actually defend in an interview. */
  takes: [
    // e.g. "On-prem beats API-first whenever the data is regulated — at NSE
    //       the constraint wasn't cost, it was that documents could not leave
    //       the building, and that changes every architecture decision."
    // e.g. "Hybrid BM25 + vector beats pure vector on enterprise docs because
    //       exact identifiers matter more than semantic similarity."
  ] as string[],

  /** TODO(vibhu): short anecdotes. What broke, what you tried, what you learned. */
  stories: [
    // { q: "hardest bug", a: "..." }
  ] as { q: string; a: string }[],

  /** What you're looking for — asked constantly, so answer it well. */
  seeking: {
    en: "TODO: the kind of role, team and problem you want next.",
    hi: "TODO",
  } as Record<Lang, string>,
} as const;

/** Recognition and leadership — the things that aren't a number. */
export const awards: { title: Localized; org: string; year: string; note?: Localized }[] = [
  {
    title: { en: "Council Lead, Somaiya ML Research Association", hi: "काउंसिल लीड, सोमैया ML रिसर्च एसोसिएशन" },
    org: "KJ Somaiya College of Engineering",
    year: "2023 – 2026",
    note: { en: "Led campus-wide AI/ML initiatives and the flagship competitions 'The First Move' and 'From Code to Impact'.", hi: "कैंपस-व्यापी AI/ML पहल और प्रमुख प्रतियोगिताओं का नेतृत्व।" },
  },
  {
    title: { en: "Community Influencers Head", hi: "कम्युनिटी इन्फ्लुएंसर्स हेड" },
    org: "Google Crowdsource",
    year: "2025",
    note: { en: "Led seminars on AI ethics, speech recognition and computer vision data pipelines.", hi: "AI नैतिकता और स्पीच रिकग्निशन पर सेमिनार।" },
  },
  {
    title: { en: "Dual degree — B.Tech CS + BS Data Science", hi: "दोहरी डिग्री" },
    org: "KJ Somaiya · IIT Madras",
    year: "2023 – 2027",
    note: { en: "Running both programmes concurrently, 8.4 and 8.03 GPA.", hi: "दोनों कार्यक्रम एक साथ।" },
  },
];

/** Section registry — single source for the nav, the scroll spy and the agent. */
export const SECTIONS = [
  { id: "about", label: { en: "About", hi: "परिचय" } },
  { id: "work", label: { en: "Work", hi: "अनुभव" } },
  { id: "projects", label: { en: "Projects", hi: "प्रोजेक्ट्स" } },
  { id: "writing", label: { en: "Writing", hi: "लेखन" } },
  { id: "impact", label: { en: "Impact", hi: "प्रभाव" } },
  { id: "stack", label: { en: "Stack", hi: "स्टैक" } },
  { id: "connect", label: { en: "Connect", hi: "संपर्क" } },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

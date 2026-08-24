/**
 * Provider cascade.
 *
 * Groq, Cerebras and NVIDIA NIM all speak the OpenAI chat-completions wire
 * format, so one adapter covers all three — only the base URL, model id and
 * env var differ. That is the whole point: when a free tier rate-limits us
 * at 2am, failover is the next array element, not a rewrite.
 *
 * Ordered fastest-first. Cerebras leads on tokens/sec, Groq is the most
 * reliable, NIM is the backstop.
 */

export type Provider = {
  id: string;
  baseUrl: string;
  model: string;
  envKey: string;
  /** Provider-specific body fields. Scoped so one vendor's flag never
   *  reaches another that would reject it. */
  extraBody?: Record<string, unknown>;
};

export const PROVIDERS: Provider[] = [
  {
    id: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama-3.3-70b",
    envKey: "CEREBRAS_API_KEY",
  },
  {
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    envKey: "GROQ_API_KEY",
  },
  {
    id: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    /* Hybrid Mamba-2 + latent MoE: 30B total but only ~3B active per token,
       so it answers at small-model speed. Explicitly post-trained on tool
       calling and structured outputs, which is what this route needs — a
       malformed tool call is the one failure the guardrails can't fix.
       Open weights (GGUF/NVFP4), so it survives the free tier disappearing. */
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    envKey: "NVIDIA_NIM_API_KEY",
    /* Nemotron reasons by default and writes the chain of thought straight
       into `content`. On a page that SPEAKS the answer aloud that is not a
       cosmetic problem — it reads paragraphs of "We need to answer…" to the
       visitor. NIM's documented switch is chat_template_kwargs. */
    extraBody: { chat_template_kwargs: { enable_thinking: false } },
  },
];

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
};

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

export type Completion = {
  provider: string;
  text: string;
  toolCalls: ToolCall[];
  ms: number;
};

/** Single provider call. Throws on any non-2xx so the cascade can move on. */
async function callOne(
  p: Provider,
  key: string,
  messages: ChatMessage[],
  tools: ToolDef[],
  signal: AbortSignal
): Promise<Completion> {
  const started = Date.now();

  const res = await fetch(p.baseUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: p.model,
      messages,
      tools,
      tool_choice: "auto",
      // Hard ceiling: this answer gets spoken aloud. Nobody wants a monologue.
      max_tokens: 320,
      temperature: 0.4,
      ...p.extraBody,
    }),
  });

  if (!res.ok) {
    throw new Error(`${p.id} ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  }

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
        /* Some providers split reasoning into its own field. We never read
           it — it exists here only to document that it is deliberately
           ignored rather than overlooked. */
        reasoning_content?: string | null;
        tool_calls?: ToolCall[];
      };
    }[];
  };
  const msg = data.choices?.[0]?.message;

  return {
    provider: p.id,
    text: (msg?.content ?? "").trim(),
    toolCalls: msg?.tool_calls ?? [],
    ms: Date.now() - started,
  };
}

/**
 * Try each configured provider in order. Providers with no key are skipped
 * silently, so a half-configured .env still works.
 */
export async function complete(
  messages: ChatMessage[],
  tools: ToolDef[],
  { timeoutMs = 8000 }: { timeoutMs?: number } = {}
): Promise<Completion> {
  const errors: string[] = [];
  const available = PROVIDERS.filter((p) => process.env[p.envKey]);

  if (!available.length) {
    throw new Error("No provider keys configured. Set CEREBRAS_API_KEY, GROQ_API_KEY or NVIDIA_NIM_API_KEY.");
  }

  for (const p of available) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      return await callOne(p, process.env[p.envKey]!, messages, tools, ac.signal);
    } catch (e) {
      errors.push(`${p.id}: ${(e as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`All providers failed — ${errors.join(" | ")}`);
}

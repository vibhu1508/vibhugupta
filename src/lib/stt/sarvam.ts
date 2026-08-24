/**
 * Sarvam Saaras v3-realtime — WebSocket STT.
 *
 * Wire format verified against docs.sarvam.ai (Aug 2026):
 *   wss://api.sarvam.ai/speech-to-text-realtime/ws
 *   client → { event: "audio_input", audio: <base64 PCM16> }
 *   server → { event: "transcript.partial" | "transcript.final", text, utterance_idx }
 *
 * Why this over the browser's Web Speech API:
 *   - `mode: "codemix"` is built for Hindi-English code-switching, which is
 *     how people here actually speak. Web Speech forces one locale per session.
 *   - `silence_duration_ms` is directly tunable. Endpointing — not model
 *     speed — is the single biggest contributor to perceived latency, and the
 *     browser gives you no control over it at all.
 *
 * KEY EXPOSURE — read before enabling.
 * The browser can only authenticate via the `api-subscription-key.<key>`
 * subprotocol, which means the key ships to the client. That is fine for
 * local development and unacceptable in production. For a public site,
 * terminate this on a small WebSocket proxy you control (Render/Fly/Railway
 * free tier — Vercel serverless functions cannot hold a WS connection) and
 * point `url` at that proxy instead. Until then the site defaults to Web
 * Speech, which needs no key at all.
 */

export type SarvamOptions = {
  /** Your proxy's wss:// URL. Only pass a raw key for local development. */
  url?: string;
  key?: string;
  lang: "en" | "hi" | "auto";
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (msg: string) => void;
  onOpen?: () => void;
};

const DEFAULT_URL = "wss://api.sarvam.ai/speech-to-text-realtime/ws";
export const SARVAM_SAMPLE_RATE = 16000;

const LOCALE = { en: "en-IN", hi: "hi-IN", auto: "auto" } as const;

export type SarvamSession = {
  /** Feed one chunk of mono Float32 PCM at SARVAM_SAMPLE_RATE. */
  push(frame: Float32Array): void;
  /** Retune endpointing mid-stream; applies immediately in VAD mode. */
  tune(opts: { silence_duration_ms?: number; threshold?: number }): void;
  close(): void;
};

function floatToPcm16Base64(frame: Float32Array): string {
  const pcm = new Int16Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    const s = Math.max(-1, Math.min(1, frame[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  // Chunked: spreading a large frame into String.fromCharCode blows the
  // argument limit and throws on long utterances.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function openSarvam(opts: SarvamOptions): SarvamSession {
  const params = new URLSearchParams({
    model: "saaras:v3-realtime",
    language_code: LOCALE[opts.lang],
    // codemix keeps Hindi-English switching intact instead of forcing one.
    mode: "codemix",
    stream_type: "fast",
    endpointing: "vad",
    encoding: "linear16",
    sample_rate: String(SARVAM_SAMPLE_RATE),
    // Default is 500ms. 280 is noticeably snappier and still tolerates the
    // pause most people take mid-sentence.
    silence_duration_ms: "280",
    min_speech_duration_ms: "200",
    threshold: "0.3",
  });

  const url = `${opts.url ?? DEFAULT_URL}?${params}`;
  const ws = opts.key
    ? new WebSocket(url, [`api-subscription-key.${opts.key}`])
    : new WebSocket(url);

  let open = false;
  const queue: string[] = [];

  ws.onopen = () => {
    open = true;
    for (const m of queue.splice(0)) ws.send(m);
    opts.onOpen?.();
  };

  ws.onmessage = (e) => {
    let msg: { event?: string; text?: string; message?: string };
    try {
      msg = JSON.parse(String(e.data)) as typeof msg;
    } catch {
      return;
    }
    if (msg.event === "transcript.partial" && msg.text) opts.onPartial(msg.text);
    else if (msg.event === "transcript.final" && msg.text) opts.onFinal(msg.text);
    else if (msg.event === "error") opts.onError?.(msg.message ?? "sarvam error");
  };

  ws.onerror = () => opts.onError?.("connection failed");

  const send = (obj: unknown) => {
    const s = JSON.stringify(obj);
    if (open && ws.readyState === WebSocket.OPEN) ws.send(s);
    else if (queue.length < 40) queue.push(s);
  };

  return {
    push(frame) {
      send({ event: "audio_input", audio: floatToPcm16Base64(frame) });
    },
    tune(o) {
      send({ event: "config.update", ...o });
    },
    close() {
      send({ event: "end" });
      // Let the final transcript land before tearing the socket down.
      setTimeout(() => ws.close(), 250);
    },
  };
}

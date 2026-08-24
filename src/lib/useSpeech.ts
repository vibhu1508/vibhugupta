"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { field } from "./voiceField";
import { openSarvam, SARVAM_SAMPLE_RATE, type SarvamSession } from "./stt/sarvam";

export type SpeechStatus = "idle" | "starting" | "listening" | "denied" | "unsupported";
export type SpeechEngine = "none" | "sarvam" | "webspeech";

type Options = {
  lang: "en" | "hi";
  /** Fires on every interim result — this is what makes the UI feel instant. */
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
};

/* en-IN beats en-US on Indian-accented English and tolerates code-switching;
   hi-IN beats a generic 'hi' in Chrome. Only used on the Web Speech path —
   Sarvam handles both at once via codemix. */
const LOCALE: Record<"en" | "hi", string> = { en: "en-IN", hi: "hi-IN" };

/** Linear resample. Chrome honours a 16kHz AudioContext; Safari often doesn't. */
function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    out[i] = (input[i0] ?? 0) * (1 - frac) + (input[i0 + 1] ?? input[i0] ?? 0) * frac;
  }
  return out;
}

export function useSpeech({ lang, onPartial, onFinal }: Options) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [engine, setEngine] = useState<SpeechEngine>("none");

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const sarvamRef = useRef<SarvamSession | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const wantRef = useRef(false);

  // Keep callbacks fresh without tearing down recognition on every render.
  const cbRef = useRef({ onPartial, onFinal });
  cbRef.current = { onPartial, onFinal };

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    sarvamRef.current?.close();
    sarvamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    field.release();
    setStatus("idle");
    setEngine("none");
  }, []);

  /** Sarvam realtime. Returns false so the caller can fall back. */
  const startSarvam = useCallback(
    async (stream: MediaStream): Promise<boolean> => {
      let creds: { url?: string; key?: string };
      try {
        const res = await fetch("/api/stt/session");
        if (!res.ok) return false;
        creds = (await res.json()) as typeof creds;
      } catch {
        return false;
      }
      if (!creds.url && !creds.key) return false;

      try {
        const Ctor: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor({ sampleRate: SARVAM_SAMPLE_RATE });
        ctxRef.current = ctx;
        await ctx.audioWorklet.addModule("/pcm-worklet.js");

        /* Wait for the socket to actually open before committing.
           Returning true optimistically meant a bad key or a failed
           handshake left us with no transcription AND no fallback — the
           worst of both. Now a failure here falls through to Web Speech. */
        const connected = await new Promise<boolean>((resolve) => {
          const timer = window.setTimeout(() => resolve(false), 4000);
          const settle = (ok: boolean) => {
            window.clearTimeout(timer);
            resolve(ok);
          };

          const session = openSarvam({
            url: creds.url,
            key: creds.key,
            // codemix handles Hindi and English in one utterance, so we
            // don't force a locale the way Web Speech makes us.
            lang: "auto",
            onPartial: (t) => cbRef.current.onPartial?.(t),
            onFinal: (t) => cbRef.current.onFinal?.(t),
            onOpen: () => {
              setStatus("listening");
              settle(true);
            },
            onError: (msg) => {
              console.warn("[stt] sarvam failed, falling back to Web Speech:", msg);
              settle(false);
            },
          });
          sarvamRef.current = session;
        });

        if (!connected) {
          sarvamRef.current?.close();
          sarvamRef.current = null;
          void ctx.close().catch(() => {});
          ctxRef.current = null;
          return false;
        }
        const session = sarvamRef.current!;

        const src = ctx.createMediaStreamSource(stream);
        const node = new AudioWorkletNode(ctx, "pcm-processor");
        node.port.onmessage = (e: MessageEvent<Float32Array>) => {
          if (!wantRef.current) return;
          session.push(resample(e.data, ctx.sampleRate, SARVAM_SAMPLE_RATE));
        };
        src.connect(node);
        // Worklets need a sink to be pulled; a zero-gain node keeps it silent.
        const mute = ctx.createGain();
        mute.gain.value = 0;
        node.connect(mute).connect(ctx.destination);

        setEngine("sarvam");
        return true;
      } catch {
        void ctxRef.current?.close().catch(() => {});
        ctxRef.current = null;
        return false;
      }
    },
    []
  );

  /** Browser Web Speech API. Free, no key, one locale per session. */
  const startWebSpeech = useCallback((): boolean => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return false;

    const rec = new Ctor();
    rec.lang = LOCALE[lang];
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setStatus("listening");
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) cbRef.current.onFinal?.(r[0].transcript.trim());
        else interim += r[0].transcript;
      }
      if (interim) cbRef.current.onPartial?.(interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setStatus("denied");
      }
      // 'no-speech' and 'aborted' are routine; onend handles the restart.
    };
    rec.onend = () => {
      // Chrome ends recognition after a pause; restart unless we were stopped.
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          setStatus("idle");
        }
      } else {
        setStatus("idle");
      }
    };

    recRef.current = rec;
    rec.start();
    setEngine("webspeech");
    return true;
  }, [lang]);

  const start = useCallback(async () => {
    setStatus("starting");
    wantRef.current = true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      // The sphere analyses the same audio the recogniser hears.
      await field.listenTo(stream);
    } catch {
      wantRef.current = false;
      setStatus("denied");
      return;
    }

    if (await startSarvam(stream)) return;
    if (startWebSpeech()) return;

    wantRef.current = false;
    setStatus("unsupported");
  }, [startSarvam, startWebSpeech]);

  useEffect(() => stop, [stop]);

  return { status, engine, start, stop };
}

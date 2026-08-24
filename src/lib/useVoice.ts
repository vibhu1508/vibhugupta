"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import manifest from "@/content/logoManifest.json";
import { field } from "./voiceField";
import type { Lang } from "@/content/profile";

const CLIPS = manifest as Record<string, Record<string, string>>;

/**
 * Speaks an answer.
 *
 * Two paths, in order:
 *
 *   1. A pre-rendered clip in Vibhu's cloned voice, generated offline and
 *      shipped as a static file. Zero synthesis latency, zero cost, and every
 *      take was listened to before it shipped.
 *   2. The browser's own SpeechSynthesis. Free and always available, but it
 *      is NOT his voice — it is the platform's. This is a deliberate
 *      fallback for genuinely novel questions, not the main path.
 *
 * Either way the sphere reacts: real clips are tapped through an analyser so
 * it follows the actual waveform; synthesised speech has no node to tap, so
 * the shell is driven from a synthetic envelope instead.
 */
export function useVoice(lang: Lang) {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    field.release();
    setSpeaking(false);
  }, []);

  /** A pre-rendered clip for this key, if one exists for this language. */
  const clipFor = useCallback(
    (key: string) => CLIPS[lang === "hi" ? "voiceHi" : "voiceEn"]?.[key.toLowerCase()],
    [lang]
  );

  const speak = useCallback(
    (text: string, key?: string) => {
      if (muted) return;
      stop();

      const src = key ? clipFor(key) : undefined;

      if (src) {
        const el = new Audio(src);
        el.crossOrigin = "anonymous";
        audioRef.current = el;
        el.onended = () => {
          field.release();
          setSpeaking(false);
        };
        // speakWith taps the element so the sphere follows the real waveform.
        field.speakWith(el);
        setSpeaking(true);
        void el.play().catch(() => {
          // Autoplay blocked until the visitor interacts. Not an error.
          field.release();
          setSpeaking(false);
        });
        return;
      }

      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) return;

      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "hi" ? "hi-IN" : "en-IN";
      u.rate = 1.02;
      u.onend = () => {
        field.release();
        setSpeaking(false);
      };
      field.beginSynthetic();
      setSpeaking(true);
      synth.speak(u);
    },
    [muted, stop, clipFor, lang]
  );

  useEffect(() => stop, [stop]);

  return { speak, stop, speaking, muted, setMuted, hasClip: clipFor };
}

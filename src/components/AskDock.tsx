"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRailEdges } from "@/lib/useRailEdges";
import MicOrb from "./MicOrb";
import { suggest } from "@/lib/grammar";
import { allQuestions, suggestionsFor } from "@/content/questions";
import type { Lang, SectionId } from "@/content/profile";

/**
 * The always-available ask bar, docked to the bottom.
 *
 * Suggestions are context-aware: with an empty input it offers the
 * highest-value questions for whatever section you're currently reading;
 * once you start typing it switches to local fuzzy match over the whole
 * bank. Both paths are pure client-side — no request fires until you submit.
 */
export default function AskDock({
  lang,
  section,
  input,
  onInput,
  onSubmit,
  live,
  onMic,
  showMic,
  thinking,
  reply,
  onDismissReply,
  muted,
  onToggleMute,
}: {
  lang: Lang;
  section: SectionId | "hero";
  input: string;
  onInput: (v: string) => void;
  onSubmit: (v: string) => void;
  live: boolean;
  onMic: () => void;
  /** The hero owns the talk affordance until it scrolls away. */
  showMic: boolean;
  thinking: boolean;
  reply: string | null;
  onDismissReply: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const bank = useMemo(() => allQuestions(lang), [lang]);
  const chips = useMemo(
    () => (input.trim() ? suggest(input, bank, 5) : suggestionsFor(section, lang, 6)),
    [input, bank, section, lang]
  );

  /* Publish the dock's real height so the rest of the page can clear it.
     A hardcoded value is always wrong here: the dock grows a row when
     suggestions show and another when an answer arrives, so the number has
     to be measured, not guessed. */
  const dockRef = useRef<HTMLDivElement>(null);
  const chipRail = useRailEdges<HTMLUListElement>();
  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const write = () =>
      document.documentElement.style.setProperty("--dock-h", `${el.offsetHeight}px`);
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--dock-h");
    };
  }, []);

  return (
    <div className="dock" ref={dockRef}>
      <div className="mx-auto w-full max-w-3xl">
        {/* The answer sits above the field so it never covers page content. */}
        {(reply || thinking) && (
          <div className="card-surface mb-3 flex items-start gap-3 p-4">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: thinking ? "var(--color-ink-faint)" : "var(--color-signal)" }}
            />
            <p className="flex-1 text-sm leading-relaxed">
              {thinking ? (lang === "en" ? "Thinking…" : "सोच रहा हूँ…") : reply}
            </p>
            {reply && (
              <button onClick={onDismissReply} className="machine shrink-0 hover:text-[var(--color-ink)]" aria-label="Dismiss">
                ✕
              </button>
            )}
          </div>
        )}

        {chips.length > 0 && (
          <ul ref={chipRail} className="rail no-bar mb-3 flex gap-2 overflow-x-auto pb-1">
            {chips.map((c) => (
              <li key={c}>
                <button className="suggest-chip" onClick={() => onSubmit(c)}>
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="dock-field"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => onInput(e.target.value)}
            placeholder={lang === "en" ? "Ask me anything about my work…" : "मेरे काम के बारे में पूछिए…"}
            aria-label="Ask a question"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          {input.trim() && (
            <button type="submit" className="machine shrink-0 px-2 text-[var(--color-signal)]">
              ↵ ask
            </button>
          )}

          {/* Audio is never a surprise. This lives in the field row, not in
              the answer card, so it is reachable BEFORE anything speaks —
              a mute you can only find after being talked at is not a mute. */}
          <button
            type="button"
            onClick={onToggleMute}
            className="machine shrink-0 px-1 hover:text-[var(--color-ink)]"
            aria-pressed={muted}
            aria-label={muted ? "Unmute voice" : "Mute voice"}
            title={muted ? "Voice off" : "Voice on"}
          >
            {muted ? "off" : "on"}
          </button>
          {showMic && (
            <MicOrb size={46} live={live} label={live ? "Stop listening" : "Start listening"} onToggle={onMic} />
          )}
        </form>
      </div>
    </div>
  );
}

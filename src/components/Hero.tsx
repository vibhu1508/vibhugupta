"use client";

import { useEffect, useRef, useState } from "react";
import MicOrb from "./MicOrb";
import { profile, type Lang } from "@/content/profile";

/**
 * Deterministic per-glyph trajectory — integer hash, not Math.sin.
 *
 * The obvious `Math.sin(seed) * 43758.5453` trick is NOT safe for SSR:
 * ECMAScript permits implementation-defined precision for transcendental
 * functions, so Node and the browser can disagree in the low bits. That
 * produced a real hydration mismatch here (…232314039 vs …232357695).
 *
 * Every operation below is integer or a power-of-two division, all of which
 * are exactly specified by the spec and therefore bit-identical everywhere.
 */
function seeded(i: number, salt: number): number {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

function ShatterText({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="shatter-char"
          /* Strings, not numbers: React serialises custom properties as
             strings during SSR but keeps numbers on the client, which is a
             mismatch on its own. Fixed precision also removes any chance of
             a float being formatted differently on the two sides. */
          style={
            {
              "--i": String(i),
              "--dx": ((seeded(i, 1) - 0.5) * 3).toFixed(4),
              "--dy": ((seeded(i, 2) - 0.5) * 2.4 - 0.4).toFixed(4),
              "--r": ((seeded(i, 3) - 0.5) * 260).toFixed(3),
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function Hero({
  lang,
  live,
  talking,
  onTalk,
  onMic,
  hint,
}: {
  lang: Lang;
  live: boolean;
  talking: boolean;
  onTalk: () => void;
  onMic: () => void;
  hint: string | null;
}) {
  /* Reassembly needs its own transient state. Simply dropping the shatter
     class would snap every glyph back into place in one frame — the return
     has to be animated deliberately, in reverse. */
  const [returning, setReturning] = useState(false);
  const wasTalking = useRef(talking);

  useEffect(() => {
    if (wasTalking.current && !talking) {
      setReturning(true);
      const t = window.setTimeout(() => setReturning(false), 1000);
      wasTalking.current = talking;
      return () => window.clearTimeout(t);
    }
    wasTalking.current = talking;
  }, [talking]);

  return (
    <section
      id="hero"
      /* Three rows: the two 1fr tracks are equal, so the name sits dead
         centre in the viewport regardless of what the other rows contain.
         The talk control lives in the bottom track, well clear of the
         sphere instead of sitting on top of it. */
      className="hero relative grid min-h-[100svh] grid-rows-[1fr_auto_1fr] px-6 text-center"
      data-talking={talking}
      data-returning={returning}
    >
      <div className="scrim" aria-hidden />

      <div className="flex items-end justify-center pb-10">
        <p className="machine hero-fade">{profile.role[lang]}</p>
      </div>

      {/* aria-label keeps the name readable to assistive tech even though
          it is rendered one <span> per glyph. */}
      <h1
        className="display name-line w-full text-[clamp(2.75rem,11vw,8.5rem)]"
        aria-label={profile.name}
      >
        <ShatterText text={profile.name} />
      </h1>

      <div
        id="talk-anchor"
        className="hero-bottom flex flex-col items-center justify-end gap-4"
      >
        {talking ? (
          <>
            <MicOrb
              live={live}
              label={live ? "Stop listening" : "Start listening"}
              onToggle={onMic}
              size={92}
            />
            <span className="machine">
              {hint ??
                (live
                  ? lang === "en"
                    ? "listening — just talk"
                    : "सुन रहा हूँ — बोलिए"
                  : lang === "en"
                    ? "tap to speak"
                    : "बोलने के लिए दबाएँ")}
            </span>
          </>
        ) : (
          <>
            <button onClick={onTalk} className="btn btn--primary text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: "var(--color-signal)" }}
              />
              {lang === "en" ? "Talk to me" : "मुझसे बात करें"}
            </button>
            <span className="machine">
              {hint ?? (lang === "en" ? "or type below" : "या नीचे लिखें")}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

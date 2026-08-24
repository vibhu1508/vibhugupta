"use client";

import { useState } from "react";
import { profile, type Lang } from "@/content/profile";
import { useReveal } from "@/lib/useReveal";

type State = "idle" | "sending" | "sent" | "error";

export default function ConnectSection({ lang }: { lang: Lang }) {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          company: form.get("company"), // honeypot
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <section id="connect" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <div ref={ref} className="reveal" data-seen={seen}>
        <p className="machine">07 — {lang === "en" ? "Connect" : "संपर्क"}</p>
        <h2 className="section-title mt-3">
          {lang === "en" ? "Let's build something." : "कुछ बनाते हैं।"}
        </h2>
        <p className="mt-4 max-w-lg text-[var(--color-ink-soft)]">
          {lang === "en"
            ? "Open to AI engineering roles and interesting problems. The fastest way to reach me is below."
            : "AI इंजीनियरिंग भूमिकाओं के लिए उपलब्ध। नीचे संपर्क करें।"}
        </p>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_320px]">
        {state === "sent" ? (
          <div className="card-surface flex flex-col items-start justify-center p-8">
            <p className="display text-xl text-[var(--color-signal)]">
              {lang === "en" ? "Message sent." : "संदेश भेज दिया गया।"}
            </p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              {lang === "en" ? "I'll get back to you shortly." : "मैं जल्द जवाब दूँगा।"}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Honeypot: hidden from people, irresistible to bots. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="machine">{lang === "en" ? "Name" : "नाम"}</span>
                <input
                  name="name"
                  required
                  maxLength={100}
                  className="mt-2 w-full rounded border border-[var(--color-hairline)] bg-[var(--color-ground-lift)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-signal-dim)]"
                />
              </label>
              <label className="block">
                <span className="machine">{lang === "en" ? "Email" : "ईमेल"}</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  className="mt-2 w-full rounded border border-[var(--color-hairline)] bg-[var(--color-ground-lift)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-signal-dim)]"
                />
              </label>
            </div>

            <label className="block">
              <span className="machine">{lang === "en" ? "Message" : "संदेश"}</span>
              <textarea
                name="message"
                required
                rows={5}
                maxLength={2000}
                className="mt-2 w-full resize-y rounded border border-[var(--color-hairline)] bg-[var(--color-ground-lift)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-signal-dim)]"
              />
            </label>

            {error && <p className="text-sm text-[var(--color-signal)]">{error}</p>}

            <button type="submit" disabled={state === "sending"} className="btn btn--primary disabled:opacity-50">
              {state === "sending" ? (lang === "en" ? "Sending…" : "भेज रहे हैं…") : lang === "en" ? "Send" : "भेजें"}
            </button>
          </form>
        )}

        <aside className="space-y-6">
          <div>
            <p className="machine">{lang === "en" ? "Direct" : "सीधे"}</p>
            <a href={`mailto:${profile.email}`} className="mt-2 block text-sm text-[var(--color-signal)] hover:underline">
              {profile.email}
            </a>
          </div>
          <div>
            <p className="machine">{lang === "en" ? "Elsewhere" : "अन्यत्र"}</p>
            <ul className="mt-2 space-y-2">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <footer className="mt-24 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-hairline)] pt-6">
        <span className="machine">© {new Date().getFullYear()} {profile.name}</span>
        <span className="machine">{lang === "en" ? "Voice answers use an AI clone of my voice" : "उत्तर मेरी AI आवाज़ में हैं"}</span>
      </footer>
    </section>
  );
}

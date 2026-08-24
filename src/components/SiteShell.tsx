"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "./Nav";
import Hero from "./Hero";
import AboutSection from "./AboutSection";
import WorkSection from "./WorkSection";
import ProjectsSection from "./ProjectsSection";
import WritingSection from "./WritingSection";
import ImpactSection from "./ImpactSection";
import StackSection from "./StackSection";
import ConnectSection from "./ConnectSection";
import AskDock from "./AskDock";
import { useSphereSlot } from "@/lib/useSphereSlot";
import { useSpherePose } from "@/lib/useSpherePose";
import { useSpeech } from "@/lib/useSpeech";
import { useVoice } from "@/lib/useVoice";
import { useScrollSpy } from "@/lib/useScrollSpy";
import { matchIntent } from "@/lib/grammar";
import { SECTIONS, projects, type Lang, type SectionId } from "@/content/profile";

const IDS = SECTIONS.map((s) => s.id);

export default function SiteShell() {
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(projects[0]?.id ?? null);
  const [reply, setReply] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);
  /* The hero owns the talk button until it scrolls off; only then does the
     dock grow one, so there are never two mics on screen at once. */
  const [pastTalk, setPastTalk] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* Open at the top on reload.
     Browsers restore the previous scroll offset by default, which on a
     one-page site drops you into whatever section you happened to be
     reading — never the hero. A deep link (#work) is still honoured, and
     the jump is instant so `scroll-behavior: smooth` doesn't animate it. */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const router = useRouter();
  const voice = useVoice(lang);
  const spy = useScrollSpy(IDS);

  /* One slot, posed continuously by scroll rather than switched at a
     threshold. The claim's opacity is fixed on purpose — changing it would
     put a CSS transition on `transform` mid-scroll and the sphere would lag
     the page. The fade is handled by the dimmer layer instead. */
  const slotRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  useSphereSlot({ opacity: 1, priority: 1 }, slotRef);
  useSpherePose(slotRef, dimRef);

  useEffect(() => {
    const el = document.getElementById("talk-anchor");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPastTalk(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goto = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Path A — local grammar. Instant, free, no backend. */
  const applyIntent = useCallback(
    (text: string, isFinal: boolean): boolean => {
      const m = matchIntent(text, isFinal);
      if (!m) return false;
      const it = m.intent;

      if (it.kind === "navigate") {
        goto(it.section === "hero" ? "hero" : it.section);
        return true;
      }
      if (it.kind === "open_detail") {
        router.push(it.type === "work" ? `/work/${it.id}` : `/projects/${it.id}`);
        return true;
      }
      if (it.kind === "open_role") {
        /* Only open it. The row's own effect scrolls it into view and it
           already checks visibility first. Calling goto("work") here as well
           started a second smooth scroll to the top of the section, and the
           two fought each other — the page would lurch and settle in the
           wrong place. */
        setOpenRole(it.id);
        return true;
      }
      if (it.kind === "open_project") {
        const id =
          it.id ??
          (it.ordinal === -1
            ? projects[projects.length - 1]?.id
            : projects[Math.max(0, (it.ordinal ?? 1) - 1)]?.id);
        if (id) setActiveProject(id);
        goto("projects");
        return true;
      }
      if (it.kind === "set_lang") {
        setLang(it.lang);
        return true;
      }
      if (it.kind === "stop") {
        abortRef.current?.abort();
        voice.stop();
        setThinking(false);
        return true;
      }
      return false;
    },
    [goto, router, voice]
  );

  /** Path B — the model. Only what the grammar could not resolve. */
  const ask = useCallback(
    async (question: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setThinking(true);
      setReply(null);
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, lang }),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          answer?: string | null;
          action?: {
            view?: string;
            project?: string;
            role?: string;
            detail?: { type: "work" | "project"; id: string };
          };
        };
        if (data.action?.detail) {
          const d = data.action.detail;
          router.push(d.type === "work" ? `/work/${d.id}` : `/projects/${d.id}`);
        } else if (data.action?.role) {
          setOpenRole(data.action.role);
        } else if (data.action?.project) {
          setActiveProject(data.action.project);
          goto("projects");
        } else if (data.action?.view) {
          goto(data.action.view);
        }
        setReply(data.answer ?? null);
        // Say it out loud. A pre-rendered clip in his own voice if one
        // exists for this line, otherwise the browser reads it.
        if (data.answer) voice.speak(data.answer);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // Every provider is down, or we're offline. Navigation still works.
          const fallback =
            lang === "en"
              ? "I can't reach my language model right now — but you can still navigate by voice, or read everything below."
              : "अभी मॉडल तक नहीं पहुँच पा रहा — आप आवाज़ से नेविगेट कर सकते हैं।";
          setReply(fallback);
          voice.speak(fallback, "unknown");
        }
      } finally {
        setThinking(false);
      }
    },
    [lang, goto, router, voice]
  );

  const submit = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setInput("");
      if (!applyIntent(t, true)) void ask(t);
    },
    [applyIntent, ask]
  );

  const speech = useSpeech({
    lang,
    onPartial: (t) => {
      setInput(t);
      applyIntent(t, false);
    },
    onFinal: (t) => submit(t),
  });

  const live = speech.status === "listening";
  const engineTag = speech.engine === "sarvam" ? " · sarvam" : speech.engine === "webspeech" ? " · webspeech" : "";
  const status = thinking
    ? "processing"
    : live
      ? "listening"
      : speech.status === "denied"
        ? "mic blocked"
        : speech.status === "unsupported"
          ? "text only"
          : "standby";

  const micHint = useMemo(() => {
    if (speech.status === "denied") return lang === "en" ? "microphone blocked — type instead" : "माइक ब्लॉक है — टाइप करें";
    if (speech.status === "unsupported") return lang === "en" ? "voice needs Chrome — type instead" : "वॉइस के लिए Chrome चाहिए";
    return null;
  }, [speech.status, lang]);

  const onMic = useCallback(() => {
    if (live) {
      speech.stop();
      // Stopping ends the conversation, so the name comes back. Without this
      // `talking` stayed true forever and the hero never recovered.
      setTalking(false);
    } else {
      void speech.start();
    }
  }, [live, speech]);

  /* A denied or unsupported mic is also an end to the conversation — don't
     strand the visitor looking at an empty hero with no name and no answer. */
  useEffect(() => {
    if (speech.status === "denied" || speech.status === "unsupported") {
      setTalking(false);
    }
  }, [speech.status]);

  return (
    <>
      {/* Sphere slot — never painted, only measured. Geometry is written
          imperatively by useSpherePose on every scroll frame. */}
      <div ref={slotRef} className="pointer-events-none fixed" aria-hidden />
      {/* Sits between the sphere (z 0) and the content (z 10), so it fades
          the sphere back as you read without dimming the type. */}
      <div ref={dimRef} className="sphere-dim" aria-hidden />

      <Nav
        active={spy.active as SectionId | "hero"}
        progress={spy.progress}
        scrolled={spy.scrolled}
        lang={lang}
        onLang={() => setLang(lang === "en" ? "hi" : "en")}
        status={status + engineTag}
        live={live}
      />

      <main className="relative z-10">
        <Hero
          lang={lang}
          live={live}
          talking={talking}
          onTalk={() => {
            setTalking(true);
            // Let the shatter get underway before the mic permission prompt
            // steals focus, or the animation is never seen.
            window.setTimeout(onMic, 420);
          }}
          onMic={onMic}
          hint={micHint}
        />
        <AboutSection lang={lang} />
        <WorkSection lang={lang} openId={openRole} onOpen={setOpenRole} />
        <ProjectsSection lang={lang} activeId={activeProject} onActive={setActiveProject} />
        <WritingSection lang={lang} />
        <ImpactSection lang={lang} />
        <StackSection lang={lang} />
        <ConnectSection lang={lang} />
      </main>

      <AskDock
        lang={lang}
        section={spy.active}
        input={input}
        /* Typed input does NOT navigate speculatively. Speculation is right
           for speech — you can't un-say a word, so jumping early feels fast.
           While typing it means the page scrolls out from under you on a
           partial match, then jumps again on submit. Intent runs on submit. */
        onInput={setInput}
        onSubmit={submit}
        live={live}
        onMic={onMic}
        showMic={pastTalk || talking}
        thinking={thinking}
        reply={reply}
        onDismissReply={() => {
          voice.stop();
          setReply(null);
        }}
        muted={voice.muted}
        onToggleMute={() => {
          if (!voice.muted) voice.stop();
          voice.setMuted(!voice.muted);
        }}
      />
    </>
  );
}

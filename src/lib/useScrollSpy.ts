"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/content/profile";

export type Spy = {
  active: SectionId | "hero";
  progress: number;
  scrolled: boolean;
};

/**
 * Which section is on screen, how far down the page we are, and whether the
 * nav should show its bottom rule. One rAF-throttled scroll listener for all
 * three — three separate listeners would each fire on every scroll event.
 */
export function useScrollSpy(ids: readonly SectionId[]): Spy {
  const [spy, setSpy] = useState<Spy>({ active: "hero", progress: 0, scrolled: false });

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;

      let active: SectionId | "hero" = "hero";
      // The section whose top has most recently passed the probe line wins.
      const probe = window.innerHeight * 0.35;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) active = id;
      }

      const progress = max > 0 ? Math.min(1, y / max) : 0;
      const scrolled = y > 12;

      /* Bail unless something meaningful moved. Without this, setState runs
         on every scroll frame and re-renders every section on the page —
         while the WebGL sphere is already using the frame budget. */
      setSpy((prev) =>
        prev.active === active &&
        prev.scrolled === scrolled &&
        Math.abs(prev.progress - progress) < 0.004
          ? prev
          : { active, progress, scrolled }
      );
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return spy;
}

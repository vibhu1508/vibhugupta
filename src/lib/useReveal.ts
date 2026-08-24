"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll. One observer per element, disconnected after it fires —
 * animating a section back out when it leaves the viewport is a well-known
 * way to make a page feel twitchy, so entrance is deliberately one-way.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, seen };
}

/**
 * How far the viewport has travelled through one element, 0..1.
 * Drives the timeline's fill line.
 */
export function useScrollFill<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top edge reaches the lower third, 1 when the bottom
      // edge clears it — so the line fills as you read, not as you arrive.
      const anchor = vh * 0.68;
      const total = r.height;
      const travelled = anchor - r.top;
      setFill(Math.max(0, Math.min(1, travelled / Math.max(total, 1))));
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
  }, []);

  return { ref, fill };
}

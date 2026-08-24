"use client";

import { useEffect, useRef } from "react";

/**
 * Marks a horizontal scroller with whether it is at its start / end.
 *
 * Used to fade only the edge that actually has more content behind it. A
 * static fade on both sides is the usual shortcut, but it dims the first
 * chip when there is nothing to its left, which reads as a rendering bug
 * rather than an affordance.
 */
export function useRailEdges<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // 2px of slack: fractional scroll offsets never land exactly on 0.
      el.dataset.atStart = String(el.scrollLeft <= 2);
      el.dataset.atEnd = String(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return ref;
}

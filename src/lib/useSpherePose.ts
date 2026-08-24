"use client";

import { useEffect, type RefObject } from "react";

/**
 * Moves the sphere continuously as you scroll, instead of snapping between
 * two fixed poses at a threshold.
 *
 * How it works: the slot element's geometry is written directly to the DOM
 * every frame. SphereLayer already re-measures its slot each rAF and uses
 * `transition: none` while scrolling, so it tracks the slot exactly — the
 * interpolation happens here and the sphere just follows.
 *
 * Two things are deliberate:
 *
 * 1. No React state. A setState per frame would re-render every section on
 *    the page while a WebGL loop is running.
 * 2. The slot *claim's* opacity stays constant. Updating it would call
 *    notify() → SphereLayer.glide(), putting a CSS transition on `transform`
 *    mid-scroll, which makes the sphere lag behind the page. The fade is done
 *    with a separate dimmer layer instead.
 */

type Pose = { size: number; cx: number; cy: number; dim: number };

/** Fractions of vmin / viewport width / viewport height. */
const HERO: Pose = { size: 0.78, cx: 0.5, cy: 0.5, dim: 0 };
const ASIDE: Pose = { size: 0.4, cx: 0.86, cy: 0.34, dim: 0.55 };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function useSpherePose(
  slot: RefObject<HTMLElement | null>,
  dimmer: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    let raf = 0;
    let last = -1;

    const apply = () => {
      raf = 0;
      const el = slot.current;
      if (!el) return;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const vmin = Math.min(W, H);

      // The migration happens over roughly the first screen of scrolling,
      // so it is finished by the time the first section is being read.
      const raw = Math.max(0, Math.min(1, window.scrollY / (H * 0.72)));
      const t = easeInOut(raw);

      // Sub-pixel churn isn't worth a DOM write.
      if (Math.abs(t - last) < 0.0015) return;
      last = t;

      const size = lerp(HERO.size, ASIDE.size, t) * vmin;
      const cx = lerp(HERO.cx, ASIDE.cx, t) * W;
      const cy = lerp(HERO.cy, ASIDE.cy, t) * H;

      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${cx - size / 2}px`;
      el.style.top = `${cy - size / 2}px`;

      const dim = dimmer.current;
      if (dim) dim.style.opacity = String(lerp(HERO.dim, ASIDE.dim, t));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slot, dimmer]);
}

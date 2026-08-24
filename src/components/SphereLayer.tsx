"use client";

import { useEffect, useRef } from "react";
import PixelSphere from "./PixelSphere";
import { getSphereSlot, onSphereSlotChange } from "@/lib/sphereSlot";

/**
 * The one and only sphere, mounted above the router.
 *
 * The canvas is a fixed square of BASE px that never resizes — moving and
 * growing it is a pure CSS transform, so a page transition costs no WebGL
 * work at all (no reallocated render targets, no dropped frames). Because
 * BASE is the largest pose either page asks for, every other pose scales
 * *down*, and the pixels stay crisp.
 */

const BASE = 780;
/* An emphasized ease: decisive but not front-loaded, so the morph never
   snaps at the start or stalls at the end. */
const GLIDE = "transform 880ms cubic-bezier(0.33, 0, 0.15, 1), opacity 620ms ease";
/* A near-identical target is a correction, not a move — settle it fast rather
   than creeping across a few pixels for the better part of a second. */
const CORRECT = "transform 200ms ease-out, opacity 300ms ease";

export default function SphereLayer() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastKey = "";
    // Last values actually written, so a retarget can tell a real move from a
    // pixel-level correction.
    let wx = 0;
    let wy = 0;
    let wk = 1;
    // 'glide' while a pose change settles, 'snap' for scrolling and resizing —
    // a transition during scroll would make the sphere lag behind the page.
    let mode: "snap" | "glide" = "snap";
    let settle = 0;

    const place = () => {
      raf = requestAnimationFrame(place);
      const node = layer.current;
      const { el, opacity } = getSphereSlot();
      if (!node) return;

      // A null slot means we are mid-navigation (or React is replaying an
      // effect). Hold the last pose — blanking here is what made the sphere
      // flicker out between routes.
      if (!el) return;

      const r = el.getBoundingClientRect();
      if (!r.width) return;

      const k = r.width / BASE;
      const x = r.left + r.width / 2 - BASE / 2;
      const y = r.top + r.height / 2 - BASE / 2;

      // Only touch the DOM when the target actually moves, so an in-flight
      // CSS transition is never restarted from under itself.
      // `mode` is deliberately not part of the key: flipping back to 'snap'
      // must not rewrite the transform and cut an in-flight transition short.
      const key = `${x.toFixed(1)}|${y.toFixed(1)}|${k.toFixed(4)}|${opacity}`;
      if (key === lastKey) return;
      lastKey = key;

      const tiny =
        Math.abs(x - wx) < 26 && Math.abs(y - wy) < 26 && Math.abs(k - wk) < 0.03;
      wx = x;
      wy = y;
      wk = k;

      node.style.transition = mode === "snap" ? "none" : tiny ? CORRECT : GLIDE;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
      node.style.opacity = String(opacity);
    };

    // Inline styles beat the global reduced-motion rule, so the glide has to
    // opt out of itself here rather than relying on the stylesheet.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const glide = () => {
      if (still.matches) return;
      mode = "glide";
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        mode = "snap";
      }, 1300);
    };
    const snap = () => {
      mode = "snap";
      window.clearTimeout(settle);
    };

    const off = onSphereSlotChange(glide);
    window.addEventListener("scroll", snap, { passive: true });
    window.addEventListener("resize", snap);
    place();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      off();
      window.removeEventListener("scroll", snap);
      window.removeEventListener("resize", snap);
    };
  }, []);

  return (
    <div
      className="sphere-layer"
      ref={layer}
      style={{ width: BASE, height: BASE }}
      aria-hidden="true"
    >
      <PixelSphere className="sphere-layer__canvas" />
    </div>
  );
}

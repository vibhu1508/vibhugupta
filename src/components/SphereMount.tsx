"use client";

import dynamic from "next/dynamic";

/**
 * The sphere costs ~315KB of three.js. Loading it eagerly would block the
 * first paint on a WebGL bundle nobody has asked to see yet.
 *
 * Deferred + ssr:false means the type, the mic and the input are interactive
 * immediately; the sphere arrives a beat later and fades in. On a slow
 * connection — or a device with no WebGL at all — the site is fully usable
 * without it, which is the same graceful-degradation rule the rest of the
 * stack follows.
 */
const SphereLayer = dynamic(() => import("./SphereLayer"), {
  ssr: false,
  loading: () => null,
});

export default function SphereMount() {
  return <SphereLayer />;
}

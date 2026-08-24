"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BANDS, field } from "@/lib/voiceField";

/**
 * A sphere of square glowing pixels that breathes with whoever is speaking.
 *
 * Every point is assigned one frequency band at build time. The band energies
 * live in a 1-D data texture the vertex shader samples, so pushing new audio
 * to the GPU each frame costs one 28-texel upload — no per-point JS work, no
 * attribute churn, and the whole cloud stays on the GPU.
 *
 * Displacement is two-part: radial (the shell inflates with loudness) and
 * tangential (each pixel drifts along its own random axis, so the surface
 * *separates* instead of merely scaling). Both relax back to the rest sphere
 * through a critically-damped spring, which is what makes the return read as
 * settling rather than snapping.
 */

/* Desktop point count. Phones get a fraction of this — see `count` below.
   6000 additive-blended points plus a bloom pass is a real load for a
   mid-range mobile GPU, and the sphere is decorative: dropping frames to
   render it is the wrong trade. */
const COUNT_DESKTOP = 6000;
const COUNT_COMPACT = 2400;

const PALETTE = {
  // Brighter idle: the sphere has to hold the frame on its own before
  // anyone speaks, and #33455f over #05060a was almost invisible.
  idle: { core: new THREE.Color("#dce6f5"), edge: new THREE.Color("#4d648c") },
  user: { core: new THREE.Color("#cfe2ff"), edge: new THREE.Color("#1b6dff") },
  agent: { core: new THREE.Color("#ffd0c0"), edge: new THREE.Color("#ff2800") },
};

const vert = /* glsl */ `
  precision highp float;

  attribute float aBand;
  attribute float aSeed;
  attribute vec3  aDrift;

  uniform sampler2D uBandTex;
  uniform float uTime;
  uniform float uLevel;
  uniform float uSpread;   // eased 0..1 — how far the shell has opened
  uniform float uBurst;    // one-shot transition impulse
  uniform float uSize;
  uniform float uScale;    // half the drawing-buffer height, in device px

  varying float vAmp;
  varying float vFacing;
  varying float vSeed;

  void main() {
    float amp = texture2D(uBandTex, vec2((aBand + 0.5) / ${BANDS}.0, 0.5)).r;

    vec3 dir = normalize(position);

    // Idle breathing keeps the sphere alive when the room is silent.
    float breathe = sin(uTime * 0.55 + aSeed * 6.2831) * 0.010;

    // Radial: loud bands push their own pixels outward.
    float radial = 1.0 + breathe + uSpread * amp * 0.55 + uSpread * uLevel * 0.12 + uBurst * 0.30;

    // Tangential: each pixel walks its own axis so neighbours part company.
    float wander = sin(uTime * 2.3 + aSeed * 12.0) * 0.5 + 0.5;
    vec3 offset = aDrift * (uSpread * amp * (0.20 + wander * 0.30) + uBurst * 0.17 * wander);

    vec3 p = dir * radial + offset;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Facing: pixels on the far side of the shell dim, so it reads as a volume.
    vec3 n = normalize(normalMatrix * dir);
    vFacing = clamp(n.z * 0.5 + 0.5, 0.0, 1.0);

    vAmp = amp;
    vSeed = aSeed;

    // World-unit size projected to device pixels — the same formula three's
    // own PointsMaterial uses, so a pixel stays a pixel at any canvas size.
    float size = uSize * (1.0 + amp * 1.30 + uBurst * 0.55) * (0.62 + vFacing * 0.62);
    gl_PointSize = max(1.0, size * uScale / max(0.001, -mv.z));
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform vec3  uCore;
  uniform vec3  uEdge;
  uniform float uTime;
  uniform float uBurst;

  varying float vAmp;
  varying float vFacing;
  varying float vSeed;

  void main() {
    // Square pixel with a one-texel chamfer — no round sprites anywhere.
    vec2 q = abs(gl_PointCoord - 0.5);
    float d = max(q.x, q.y);
    float mask = 1.0 - smoothstep(0.42, 0.5, d);
    if (mask <= 0.001) discard;

    // Hot centre, cooler rim: the pixel itself has a filament.
    float core = 1.0 - smoothstep(0.0, 0.34, d);

    vec3 col = mix(uEdge, uCore, clamp(core * 0.75 + vAmp * 0.85, 0.0, 1.0));

    // A slow per-pixel scintillation so the shell never looks like a still.
    float twinkle = 0.86 + 0.14 * sin(uTime * 1.7 + vSeed * 30.0);

    // Raised the resting floor (0.14 -> 0.30) and the quiet-state gain
    // (0.58 -> 0.82) so idle reads clearly without blowing out when loud.
    float alpha = mask * twinkle * (0.30 + vFacing * 0.62) * (0.82 + vAmp * 0.55 + uBurst * 0.5);

    gl_FragColor = vec4(col * (0.80 + vAmp * 0.80), alpha);
  }
`;

export default function PixelSphere({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    /* Treat small screens and low-core devices as compact: fewer points, a
       lower pixel-ratio cap, and a cheaper bloom. */
    const compact =
      window.matchMedia("(max-width: 767px)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    const COUNT = compact ? COUNT_COMPACT : COUNT_DESKTOP;

    /* Transparent again. Matching the page's ground colour with an opaque
       canvas did not work: UnrealBloomPass composites across the entire
       quad, lifting it slightly above whatever it was cleared to, so the
       rectangle stayed visible — just a different shade of wrong.
       The edge is killed in CSS instead, with a radial mask on the canvas
       (see .pxs canvas), which holds no matter what the bloom pass writes. */
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: compact ? "default" : "high-performance",
    });
    // DPR 3 phones would otherwise render ~9x the fragments for no visible gain.
    const ratio = Math.min(window.devicePixelRatio, compact ? 1.5 : 2);
    renderer.setPixelRatio(ratio);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    /* ── geometry: Fibonacci sphere ───────────────────────── */
    const positions = new Float32Array(COUNT * 3);
    const bands = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const drift = new Float32Array(COUNT * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      // Band by latitude, lightly dithered — low frequencies gather at the
      // poles, highs around the equator, so the shell has a readable grain.
      const lat = (y + 1) / 2;
      const b = Math.floor(Math.abs(lat - 0.5) * 2 * BANDS + (Math.random() - 0.5) * 3);
      bands[i] = Math.min(BANDS - 1, Math.max(0, b));

      seeds[i] = Math.random();

      const d = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      drift[i * 3] = d.x;
      drift[i * 3 + 1] = d.y;
      drift[i * 3 + 2] = d.z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aBand", new THREE.BufferAttribute(bands, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aDrift", new THREE.BufferAttribute(drift, 3));

    /* ── band texture: 28 × 1 float, uploaded once per frame ─ */
    const bandData = new Float32Array(BANDS);
    const bandTex = new THREE.DataTexture(bandData, BANDS, 1, THREE.RedFormat, THREE.FloatType);
    bandTex.minFilter = THREE.NearestFilter;
    bandTex.magFilter = THREE.NearestFilter;
    bandTex.needsUpdate = true;

    const uniforms = {
      uBandTex: { value: bandTex },
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uSpread: { value: 0 },
      uBurst: { value: 0 },
      // Fewer points need to be slightly larger to keep the shell reading solid.
      uSize: { value: compact ? 0.082 : 0.064 },
      uScale: { value: 300 },
      uCore: { value: PALETTE.idle.core.clone() },
      uEdge: { value: PALETTE.idle.edge.clone() },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const cloud = new THREE.Points(geo, mat);
    scene.add(cloud);

    /* ── bloom ────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      compact ? 0.34 : 0.45,
      0.5,
      0.26
    );
    composer.addPass(bloom);

    /* ── sizing ───────────────────────────────────────────── */
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.resolution.set(w, h);
      uniforms.uScale.value = (h * ratio) / 2;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    /* ── loop ─────────────────────────────────────────────── */
    const core = PALETTE.idle.core.clone();
    const edge = PALETTE.idle.edge.clone();
    let spread = 0;
    let spreadV = 0;
    let raf = 0;
    const clock = new THREE.Clock();

    // ADDED: honour reduced-motion by holding the sphere at rest, and stop
    // rendering entirely when the tab is hidden. A WebGL loop running in a
    // background tab is pure battery drain on a laptop.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let paused = document.hidden;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (paused) return;

      const dt = Math.min(clock.getDelta(), 1 / 30);
      const t = clock.elapsedTime;

      const active = field.speaker !== "idle" && !still.matches;
      if (!active) field.decay(0.9);

      for (let i = 0; i < BANDS; i++) bandData[i] = field.bands[i];
      bandTex.needsUpdate = true;

      // Critically damped spring toward "open" while someone speaks.
      const target = active ? 1 : 0;
      const k = 42;
      const c = 2 * Math.sqrt(k);
      spreadV += (target - spread) * k * dt - spreadV * c * dt;
      spread += spreadV * dt;

      const pal = PALETTE[field.speaker];
      core.lerp(pal.core, 1 - Math.pow(0.001, dt));
      edge.lerp(pal.edge, 1 - Math.pow(0.001, dt));

      // The transition impulse decays on its own clock, not the audio's.
      field.burst *= Math.pow(0.05, dt);
      if (field.burst < 0.001) field.burst = 0;

      uniforms.uTime.value = t;
      uniforms.uLevel.value = field.level;
      uniforms.uSpread.value = spread;
      uniforms.uBurst.value = field.burst;
      (uniforms.uCore.value as THREE.Color).copy(core);
      (uniforms.uEdge.value as THREE.Color).copy(edge);

      bloom.strength = (compact ? 0.42 : 0.55) + field.level * 0.4 + field.burst * 0.45;

      // A slow drift so the cloud never presents the same silhouette twice.
      const spin = still.matches ? 0 : dt * (0.055 + field.level * 0.1);
      cloud.rotation.y += spin;
      cloud.rotation.x = still.matches ? 0 : Math.sin(t * 0.16) * 0.14;

      composer.render();
    };
    tick();

    const onVisibility = () => {
      paused = document.hidden;
      // Swallow the elapsed hidden time, or the spring explodes on return.
      if (!paused) clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ADDED: a lost context otherwise leaves a permanently black square.
    const canvas = renderer.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      paused = true;
    };
    const onRestored = () => {
      resize();
      paused = document.hidden;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      composer.dispose();
      bloom.dispose();
      geo.dispose();
      mat.dispose();
      bandTex.dispose();
      renderer.dispose();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, []);

  return <div ref={host} className={`pxs${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

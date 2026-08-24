"use client";

import { useState } from "react";
import manifest from "@/content/logoManifest.json";

const MARKS = manifest as Record<"org" | "tech" | "media", Record<string, string>>;

/**
 * A brand mark, resolved from the build-time manifest.
 *
 * The src is correct on first paint. The previous version guessed extensions
 * and stepped through them via onError, which cannot work under SSR: the
 * browser begins fetching the guessed src while parsing the HTML, so a 404
 * fires before React hydrates and attaches the handler. The event went
 * nowhere and the image stayed broken.
 *
 * A missing mark falls back to a monogram sharing the plate's exact
 * footprint, so a row stays aligned whether the artwork exists or not.
 */
export default function Logo({
  slug,
  name,
  kind = "org",
  size = 54,
}: {
  slug?: string;
  name: string;
  kind?: "org" | "tech";
  size?: number;
}) {
  const src = slug ? MARKS[kind]?.[slug.toLowerCase()] : undefined;
  // Only reachable if a file is deleted after the manifest was generated.
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    const monogram = name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

    return (
      <span
        className="logo-fallback"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden
        title={name}
      >
        {monogram || "•"}
      </span>
    );
  }

  return (
    // Plain <img>: small, already-optimised marks on arbitrary backgrounds.
    // next/image adds cost and no benefit at this size.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="logo-img"
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}

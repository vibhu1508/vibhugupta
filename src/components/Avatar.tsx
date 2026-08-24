"use client";

import { useState } from "react";
import manifest from "@/content/logoManifest.json";
import { profile } from "@/content/profile";

const MARKS = manifest as Record<"org" | "tech" | "media", Record<string, string>>;

/**
 * Portrait, resolved from the build-time manifest like every other asset.
 * Which file is used comes from `profile.portraitKey`; drop a new image in
 * /public/media, run `npm run logos`, and point the key at it.
 */
export default function Avatar({ size = 132, className }: { size?: number; className?: string }) {
  const src = MARKS.media?.[profile.portraitKey];
  const [broken, setBroken] = useState(false);
  const initials = profile.name.split(" ").map((w) => w[0]).join("");

  if (!src || broken) {
    return (
      <span
        className={`logo-fallback ${className ?? ""}`}
        style={{ width: size, height: size, fontSize: size * 0.3, borderRadius: "50%" }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={profile.name}
      width={size}
      height={size}
      className={`portrait ${className ?? ""}`}
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}

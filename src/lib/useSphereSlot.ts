"use client";

import { useEffect, useRef, type RefObject } from "react";
import { claimSphereSlot } from "./sphereSlot";

/**
 * Claim the sphere for the lifetime of a component.
 *
 *   const slot = useSphereSlot({ opacity: 0.9, priority: 1 });
 *   return <div ref={slot} className="h-[70vmin] w-[70vmin]" />;
 *
 * The slot element is never painted — it exists only to be measured.
 */
export function useSphereSlot(
  opts: { opacity?: number; priority?: number } = {},
  external?: RefObject<HTMLDivElement | null>
) {
  const own = useRef<HTMLDivElement>(null);
  const ref = external ?? own;
  const { opacity = 1, priority = 0 } = opts;

  useEffect(() => {
    const handle = claimSphereSlot(ref.current, { opacity, priority });
    return () => handle.release();
  }, [ref, opacity, priority]);

  return ref;
}

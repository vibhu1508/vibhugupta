"use client";

import { techIcon } from "@/lib/techIcons";
import { slugify } from "@/lib/slug";
import Logo from "./Logo";

/**
 * A stack mark, resolved in three steps:
 *   1. developer-icons, if the package carries it
 *   2. /public/logos/tech/<slug>.<ext>, for anything it doesn't
 *   3. a monogram
 *
 * Note the icons take a `size` prop — NOT width/height. Passing width/height
 * puts them in `...rest`, where the component's own size default overrides
 * them, and every icon renders at its natural size (which is how a 16px chip
 * ended up with a 150px Python logo).
 */
export default function TechIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = techIcon(name);

  if (Icon) {
    return (
      <span className="tech-mark" style={{ width: size, height: size }}>
        <Icon size={size} aria-hidden focusable="false" />
      </span>
    );
  }

  return <Logo slug={slugify(name)} name={name} kind="tech" size={size} />;
}

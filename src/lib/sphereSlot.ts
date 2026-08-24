/**
 * Where the sphere should currently be.
 *
 * Sections don't render the sphere — they render an invisible, correctly
 * sized *slot* and claim it. `SphereLayer` reads the winning slot's box each
 * frame and transforms the one real canvas to match. Moving the sphere
 * across the page therefore costs a CSS transform, not a WebGL resize.
 *
 * Claims are a stack, not a variable: when a section unmounts it pops itself
 * and whatever claimed before it is restored. Without that, navigating
 * back leaves the sphere stranded at the last slot it was told about.
 */

export type SphereSlot = {
  el: HTMLElement | null;
  opacity: number;
};

type Claim = {
  id: number;
  el: HTMLElement | null;
  opacity: number;
  /** Higher wins when several slots are mounted at once. */
  priority: number;
};

let nextId = 1;
let claims: Claim[] = [];
const listeners = new Set<() => void>();

/* Held so an unmount mid-navigation doesn't blank the sphere — SphereLayer
   bails on a null `el`, and the last good pose is a better fallback than
   the centre of the screen. */
let last: SphereSlot = { el: null, opacity: 1 };

function notify() {
  for (const cb of listeners) cb();
}

function winner(): Claim | null {
  if (!claims.length) return null;
  let best = claims[0];
  for (const c of claims) {
    // Ties break toward the most recent claim.
    if (c.priority >= best.priority) best = c;
  }
  return best;
}

export function getSphereSlot(): SphereSlot {
  const w = winner();
  if (w?.el) {
    last = { el: w.el, opacity: w.opacity };
    return last;
  }
  return last;
}

export function onSphereSlotChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Claim the sphere for an element. Returns an updater and a release fn.
 * Imperative on purpose so non-React callers can drive it too.
 */
export function claimSphereSlot(
  el: HTMLElement | null,
  opts: { opacity?: number; priority?: number } = {}
) {
  const claim: Claim = {
    id: nextId++,
    el,
    opacity: opts.opacity ?? 1,
    priority: opts.priority ?? 0,
  };
  claims.push(claim);
  notify();

  return {
    update(next: { el?: HTMLElement | null; opacity?: number; priority?: number }) {
      let changed = false;
      if (next.el !== undefined && next.el !== claim.el) {
        claim.el = next.el;
        changed = true;
      }
      if (next.opacity !== undefined && next.opacity !== claim.opacity) {
        claim.opacity = next.opacity;
        changed = true;
      }
      if (next.priority !== undefined && next.priority !== claim.priority) {
        claim.priority = next.priority;
        changed = true;
      }
      if (changed) notify();
    },
    release() {
      claims = claims.filter((c) => c.id !== claim.id);
      notify();
    },
  };
}

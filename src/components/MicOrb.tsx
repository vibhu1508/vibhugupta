"use client";

type Props = {
  live: boolean;
  label: string;
  onToggle: () => void;
  /** Rendered size in px. The rings and core scale with it. */
  size?: number;
};

/**
 * The one control. A repulsor: three concentric rings, a rotating tick
 * collar, a hot core.
 *
 * Hover opens the assembly outward and spins the collar up; going live flips
 * the rings to human-blue and sets the core breathing. All of it is CSS, so
 * nothing runs on hover and it stays smooth while the sphere renders.
 */
export default function MicOrb({ live, label, onToggle, size = 108 }: Props) {
  // Ring insets and core are proportional, so one component serves the hero
  // and the dock without transform-scaling (which would blur the strokes).
  const s = size / 108;

  return (
    <button
      className="orb"
      data-live={live}
      onClick={onToggle}
      aria-pressed={live}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
    >
      <svg className="orb__ticks" viewBox="0 0 100 100" aria-hidden="true" style={{ inset: -9 * s }}>
        {Array.from({ length: 48 }, (_, i) => {
          const major = i % 4 === 0;
          return (
            <line
              key={i}
              x1="50"
              y1={major ? 2 : 4}
              x2="50"
              y2={major ? 9 : 7}
              stroke="currentColor"
              strokeWidth={major ? 0.9 : 0.45}
              transform={`rotate(${i * 7.5} 50 50)`}
              style={{ color: live ? "var(--color-human)" : "var(--color-signal)" }}
            />
          );
        })}
      </svg>

      <span className="orb__ring" />
      <span className="orb__ring orb__ring--mid" style={{ inset: 12 * s }} />
      <span className="orb__ring orb__ring--inner" style={{ inset: 24 * s }} />
      <span className="orb__core" style={{ width: 38 * s, height: 38 * s }} />
    </button>
  );
}

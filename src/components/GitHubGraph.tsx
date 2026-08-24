"use client";

import { useEffect, useState } from "react";
import { profile, type Lang } from "@/content/profile";

type Day = { d: string; c: number; l: number };
type Data = { total: number; weeks: Day[][] };

/**
 * Contribution calendar.
 *
 * Renders nothing at all when the API returns 204 (no GITHUB_TOKEN, rate
 * limit, outage). An empty grid would read as "this person doesn't commit",
 * which is worse than showing no grid.
 */
export default function GitHubGraph({ lang }: { lang: Lang }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/github")
      .then((r) => (r.status === 204 ? null : r.json()))
      .then((d: Data | null) => live && d && setData(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!data) return null;

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="machine">
          {lang === "en" ? "Commit activity" : "कमिट गतिविधि"} — {data.total.toLocaleString()}{" "}
          {lang === "en" ? "contributions this year" : "योगदान इस वर्ष"}
        </p>
        <a
          href={`https://github.com/${profile.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="machine transition-colors hover:text-[var(--color-ink)]"
        >
          @{profile.handle} ↗
        </a>
      </div>

      {/* Scrolls on narrow screens rather than squashing the cells — a
          contribution grid stops being readable below ~9px per cell. */}
      <div className="no-bar mt-4 overflow-x-auto pb-2">
        <div className="flex gap-[3px]" style={{ minWidth: "max-content" }}>
          {data.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <span
                  key={day.d}
                  className="gh-cell"
                  data-level={day.l}
                  title={`${day.c} on ${day.d}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="machine">{lang === "en" ? "less" : "कम"}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="gh-cell" data-level={l} />
        ))}
        <span className="machine">{lang === "en" ? "more" : "ज़्यादा"}</span>
      </div>
    </div>
  );
}

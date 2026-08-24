import Image from "next/image";
import manifest from "@/content/logoManifest.json";
import type { Photo } from "@/content/profile";

const WORK = (manifest as { work?: Record<string, string> }).work ?? {};

const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(decodeURIComponent(src));

/**
 * Photos and clips from a role.
 *
 * next/image for stills — several of these are 4160x3120 and over a
 * megabyte, so resizing and modern-format delivery matter here in a way they
 * never did for the logos.
 *
 * Video uses preload="metadata" deliberately: it fetches a few KB of header
 * for the duration and first frame, and nothing more until someone presses
 * play. Autoplay was the alternative and it's the wrong call — several clips
 * looping at once in a timeline is noise, and it would spend a visitor's
 * bandwidth on something they didn't ask for.
 */
export default function MediaStrip({
  media,
  size = "sm",
}: {
  media?: Photo[];
  /** sm = inline in the timeline card, lg = the detail page */
  size?: "sm" | "lg";
}) {
  const found = (media ?? [])
    .map((m) => ({ ...m, src: WORK[m.key.toLowerCase()] }))
    .filter((m): m is Photo & { src: string } => Boolean(m.src));

  if (!found.length) return null;

  const large = size === "lg";
  const stills = found.filter((m) => !isVideo(m.src)).length;
  const clips = found.length - stills;

  return (
    <figure className={large ? "mt-10" : "mt-5"}>
      <div
        className={
          large ? "grid gap-3 sm:grid-cols-2" : "no-bar flex gap-3 overflow-x-auto pb-1"
        }
      >
        {found.map((m) => (
          <div
            key={m.key}
            className={`photo-frame ${large ? "" : "w-[min(72vw,260px)] shrink-0"}`}
          >
            {isVideo(m.src) ? (
              <video
                src={m.src}
                controls
                muted
                playsInline
                preload="metadata"
                aria-label={m.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={m.src}
                alt={m.alt}
                fill
                sizes={large ? "(max-width: 640px) 100vw, 400px" : "260px"}
                className="object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {large && (
        <figcaption className="machine mt-3">
          {stills > 0 && `${stills} photo${stills > 1 ? "s" : ""}`}
          {stills > 0 && clips > 0 && " · "}
          {clips > 0 && `${clips} clip${clips > 1 ? "s" : ""}`}
        </figcaption>
      )}
    </figure>
  );
}

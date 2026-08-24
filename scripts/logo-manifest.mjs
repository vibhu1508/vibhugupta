import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

/**
 * Resolve every brand mark to its real path, once, before the app runs.
 *
 * Why this exists: the previous approach rendered <img src="…svg">, waited
 * for onError, and stepped through extensions. That cannot work with SSR —
 * the browser starts fetching the guessed src while parsing the HTML, so the
 * 404 fires BEFORE React hydrates and attaches the handler. The event is
 * lost, the chain never advances, and the image stays broken forever.
 *
 * A manifest removes the guessing entirely: correct src on first paint, no
 * 404 requests, no hydration race.
 *
 * Note: this runs at predev/prebuild. Add a file while the dev server is
 * running and you'll need to restart for it to be picked up.
 */

const ORDER = [".svg", ".webp", ".png", ".jpeg", ".jpg", ".avif"];
/* Video is listed separately: it never competes with an image for the same
   slug, and the components branch on it to pick <video> over <img>. */
const VIDEO = [".mp4", ".webm", ".mov"];
const AUDIO = [".mp3", ".wav", ".ogg", ".m4a"];
const ROOT = process.cwd();

function scan(dir, urlPrefix) {
  const abs = join(ROOT, "public", dir);
  if (!existsSync(abs)) return {};
  const out = {};
  for (const file of readdirSync(abs)) {
    const ext = extname(file).toLowerCase();
    const isVideo = VIDEO.includes(ext);
    const isAudio = AUDIO.includes(ext);
    if (!ORDER.includes(ext) && !isVideo && !isAudio) continue;
    const slug = basename(file, extname(file)).toLowerCase();
    // encodeURIComponent the filename: a space or & in a filename produces
    // a src the browser silently fails to fetch.
    const url = `${urlPrefix}/${encodeURIComponent(file)}`;
    const existing = out[slug];
    if (!existing) {
      out[slug] = url;
      continue;
    }
    if (isVideo || isAudio) continue; // an image already claimed this slug
    const rank = (u) => ORDER.indexOf(extname(decodeURIComponent(u)).toLowerCase());
    if (ORDER.indexOf(ext) !== -1 && (rank(existing) === -1 || ORDER.indexOf(ext) < rank(existing))) {
      out[slug] = url;
    }
  }
  return out;
}

const manifest = {
  org: scan("logos/org", "/logos/org"),
  tech: scan("logos/tech", "/logos/tech"),
  media: scan("media", "/media"),
  // Photos from each role, keyed by lowercased filename.
  work: scan("media/work", "/media/work"),
  /* Pre-rendered answers in Vibhu's cloned voice, one folder per language.
     Present = zero-latency playback; absent = the browser speaks it. */
  voiceEn: scan("audio/en", "/audio/en"),
  voiceHi: scan("audio/hi", "/audio/hi"),
};

const dest = join(ROOT, "src", "content");
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, "logoManifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const count = (o) => Object.keys(o).length;
console.log(
  `[assets] org ${count(manifest.org)} · tech ${count(manifest.tech)} · ` +
  `media ${count(manifest.media)} · work ${count(manifest.work)} · ` +
  `voice ${count(manifest.voiceEn)}en/${count(manifest.voiceHi)}hi`
);

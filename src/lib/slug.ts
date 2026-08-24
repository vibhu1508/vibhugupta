/** "Google Cloud Platform" -> "google-cloud-platform" — the logo filename. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

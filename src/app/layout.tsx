import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import SphereMount from "@/components/SphereMount";
import { profile } from "@/content/profile";
import "./globals.css";

/* Self-hosted at build time: no third-party connection on first paint, no
   flash of fallback text, and the font files get the app's own cache
   headers. This also silences next/no-page-custom-font. */
const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display-src", display: "swap" });
const sans = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans-src", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-src", display: "swap" });

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role.en}`,
  description: `Portfolio of ${profile.name}. Ask it anything, by voice or text.`,
};

export const viewport: Viewport = {
  themeColor: "#05060a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        {/* One sphere, mounted above the router so it survives navigation.
            Deferred so three.js never blocks first paint. */}
        <SphereMount />
        <div className="vignette" />
        <span className="bracket bracket--tl" />
        <span className="bracket bracket--tr" />
        <span className="bracket bracket--bl" />
        <span className="bracket bracket--br" />
        {children}
      </body>
    </html>
  );
}

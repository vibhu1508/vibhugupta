"use client";

import type { ComponentType } from "react";
import type { DeveloperIconProps } from "developer-icons/dist/icon";
import {
  Python, TypeScript, FastAPI, Django, FlaskLight, Angular, Flutter, Kotlin,
  Docker, Git, GitLab, GoogleCloud, AWS, Azure, VercelLight,
  PostgreSQL, MySQL, Supabase, Redis,
  NumPy, PyTorch, HuggingFace, Gemini, OpenAI, Anthropic, Meta,
} from "developer-icons";

/**
 * Explicit name -> icon map. Deliberately NOT fuzzy.
 *
 * Fuzzy matching resolves "ChromaDB" to Chrome and "Streamlit" to Stream. A
 * confidently-wrong logo beside a tool you claim to know reads worse than no
 * logo at all, so every entry here is hand-checked.
 *
 * Two deliberate omissions:
 *   - "SQL" has no entry. MySQL's dolphin is a product mark, not the
 *     language, and using it was exactly the mistake described above.
 *   - "Render" is omitted even though the package has it — that mark is
 *     near-black and vanished against this background. It falls through to
 *     /logos/tech/render.png instead.
 *
 * Anything absent falls through to a file in /public/logos/tech, then to a
 * monogram. Both are fine; neither shifts layout.
 */
const ICONS: Record<string, ComponentType<DeveloperIconProps>> = {
  python: Python,
  typescript: TypeScript,
  fastapi: FastAPI,
  django: Django,
  flask: FlaskLight,
  angular: Angular,
  flutter: Flutter,
  kotlin: Kotlin,
  docker: Docker,
  git: Git,
  "gitlab ci/cd": GitLab,
  "google cloud platform": GoogleCloud,
  aws: AWS,
  azure: Azure,
  vercel: VercelLight,
  postgresql: PostgreSQL,
  mysql: MySQL,
  supabase: Supabase,
  redis: Redis,
  numpy: NumPy,
  pytorch: PyTorch,
  huggingface: HuggingFace,
  "google gemini": Gemini,
  openai: OpenAI,
  anthropic: Anthropic,
  "meta llama": Meta,
};

export function techIcon(name: string) {
  return ICONS[name.trim().toLowerCase()];
}

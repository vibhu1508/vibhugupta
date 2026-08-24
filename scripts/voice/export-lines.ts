import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { voiceLines } from "../../src/content/voiceLines";

/**
 * Dump the answer bank to JSON so the Python generator can read it without
 * needing to parse TypeScript. Run via `npm run voice:export`.
 */
const out = join(process.cwd(), "scripts", "voice", "lines.json");
writeFileSync(out, JSON.stringify(voiceLines, null, 2) + "\n");
console.log(`[voice] exported ${voiceLines.length} lines -> scripts/voice/lines.json`);

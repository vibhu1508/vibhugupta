# Cloning your voice

Everything here runs on your machine. Your reference recording never leaves it.

## 1. Record

Recording quality dominates everything else. A great model on mediocre audio
loses to a mediocre model on clean audio, every time.

- **10–20 minutes.** More than XTTS needs, and it shows.
- **A small soft room.** Room echo is the killer — a wardrobe full of clothes
  is a genuinely good booth. A phone held ~15cm away in a soft room beats a
  good mic in a bare one.
- **Constant distance, one session.** No EQ, no compression, no noise
  reduction. The model wants your voice, not a processed version of it.
- **Both languages**, and read your own proper nouns aloud — "Rememly",
  "AMLGuard", "Somaiya", "Qdrant", "Niyukti". Those are what TTS mangles, and
  they're exactly what this site says most.

Save as mono WAV: `scripts/voice/reference.wav`
(gitignored — it should not be committed.)

## 2. Generate

    pip install TTS pydub
    npm run voice:export
    python scripts/voice/generate.py --ref scripts/voice/reference.wav
    npm run logos

Clips land in `public/audio/en/` and `public/audio/hi/` as `<key>.mp3`.
`npm run logos` rebuilds the manifest so the site can see them.

## 3. Listen to every single one

This is the part that matters and the part people skip. You are about to
publish a synthetic version of your own voice — a bad take is worse than no
audio. Regenerate one line with:

    python scripts/voice/generate.py --ref scripts/voice/reference.wav \
      --only proudest --force

## Model choice

- **XTTS v2** (what `generate.py` uses) — Hindi included, cross-lingual
  cloning from one reference, sub-200ms streaming if you ever go live.
- **Fish Speech** — Apache 2.0. The cleanest licence if this ever goes near
  anything commercial.
- **CosyVoice 2** — ~150ms streaming; worth benchmarking on your own voice.
- **Not F5-TTS** — CC-BY-NC. A portfolio that gets you hired is arguable
  commercial use, and you don't want that argument.

You already have a Sarvam key for speech-to-text, and they ship a streaming
TTS too. Whether it supports custom voices I don't know — worth ten minutes
before self-hosting, since one vendor for both halves would simplify things.

## Why the clips are pre-rendered

The alternative is synthesising at request time. Pre-rendering wins on all
three axes that matter here:

- **Latency** — a static file starts instantly. Live TTS costs 200–400ms
  before the first sound.
- **Cost** — zero. No GPU to keep running, no per-character billing.
- **Quality** — you get as many takes as you want. Live TTS gives you one,
  unheard, in front of a stranger.

Only genuinely novel questions fall through to live speech, and there the
fallback is the browser's own voice — free, always available, and audibly not
you. That asymmetry is intentional: the answers people actually ask for are
the ones in your voice.

## Disclosure

Keep the footer line saying voice answers use an AI clone of your voice. It
costs nothing and it is the difference between a persona and a deception —
more so now that the agent speaks in first person as you.

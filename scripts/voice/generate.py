#!/usr/bin/env python3
"""
Render the answer bank in your cloned voice.

Run this on your own machine, not in CI: it needs a GPU (or patience) and
your reference recording, which should never leave your laptop.

    pip install TTS pydub
    npm run voice:export
    python scripts/voice/generate.py --ref scripts/voice/reference.wav

Output lands in public/audio/en and public/audio/hi as <key>.mp3, which the
build-time manifest picks up automatically on the next `npm run logos`.

Why offline rather than at request time:
  - zero synthesis latency on the questions people actually ask
  - zero cost, and no GPU to keep running
  - you hear every take before it ships and can redo a bad one. Live TTS
    gives you exactly one attempt, unheard.
"""
import argparse, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
LINES = ROOT / "scripts" / "voice" / "lines.json"
OUT = {"en": ROOT / "public" / "audio" / "en", "hi": ROOT / "public" / "audio" / "hi"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="your reference recording (wav, mono, 10-20 min)")
    ap.add_argument("--langs", default="en,hi")
    ap.add_argument("--only", default="", help="comma-separated keys, for regenerating one line")
    ap.add_argument("--force", action="store_true", help="overwrite clips that already exist")
    args = ap.parse_args()

    ref = pathlib.Path(args.ref)
    if not ref.exists():
        print(f"reference not found: {ref}", file=sys.stderr)
        return 1
    if not LINES.exists():
        print("run `npm run voice:export` first", file=sys.stderr)
        return 1

    try:
        from TTS.api import TTS
        from pydub import AudioSegment
    except ImportError:
        print("pip install TTS pydub", file=sys.stderr)
        return 1

    lines = json.loads(LINES.read_text())
    only = {k.strip() for k in args.only.split(",") if k.strip()}
    langs = [l.strip() for l in args.langs.split(",") if l.strip()]

    # XTTS v2: 17 languages including Hindi, clones cross-lingually from one
    # reference. Give it minutes of audio, not the 6 seconds it accepts.
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

    made = skipped = 0
    for lang in langs:
        OUT[lang].mkdir(parents=True, exist_ok=True)
        for line in lines:
            key = line["key"]
            if only and key not in only:
                continue
            dest = OUT[lang] / f"{key}.mp3"
            if dest.exists() and not args.force:
                skipped += 1
                continue

            wav = dest.with_suffix(".wav")
            tts.tts_to_file(
                text=line["text"][lang],
                speaker_wav=str(ref),
                language=lang,
                file_path=str(wav),
            )
            # MP3 keeps these a few tens of KB each; the browser streams them
            # instantly and they cache like any other static asset.
            AudioSegment.from_wav(wav).export(dest, format="mp3", bitrate="96k")
            wav.unlink()
            print(f"  {lang}/{key}.mp3")
            made += 1

    print(f"\n[voice] {made} generated, {skipped} already present")
    print("Listen to every one before shipping. Regenerate a bad take with:")
    print("  python scripts/voice/generate.py --ref <ref.wav> --only <key> --force")
    print("Then: npm run logos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
caption.py — transcription + word-timing captions for the video pipeline.

Engine: faster-whisper (SYSTRAN, MIT — https://github.com/SYSTRAN/faster-whisper).
Install:  pip install faster-whisper
Runs on CPU (CTranslate2); GPU optional, not required.

Outputs next to the input file:
  <name>.srt        — subtitle file (import into any editor)
  <name>.words.json — word-level timings for kinetic/karaoke caption burn-in
  <name>.segments.json — segment list with start/end/text

Usage:
  python tools/video/caption.py promo_16x9.mp4
  python tools/video/caption.py promo_16x9.mp4 --model medium --language en
  python tools/video/caption.py promo_16x9.mp4 --words-only
"""
import argparse
import json
import sys
from pathlib import Path


def srt_time(t: float) -> str:
    h, rem = divmod(t, 3600)
    m, rem = divmod(rem, 60)
    s, ms = divmod(rem, 1)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(ms * 1000):03d}"


def main() -> int:
    ap = argparse.ArgumentParser(description="Transcribe media to SRT + word timings")
    ap.add_argument("media", help="audio or video file")
    ap.add_argument("--model", default="base",
                    help="whisper model size: tiny/base/small/medium/large-v3 (default: base)")
    ap.add_argument("--language", default=None, help="force language code, e.g. en")
    ap.add_argument("--device", default="cpu", help="cpu or cuda")
    ap.add_argument("--words-only", action="store_true",
                    help="skip SRT, emit only word timings JSON")
    args = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("FATAL: faster-whisper not installed. Run: pip install faster-whisper",
              file=sys.stderr)
        return 2

    media = Path(args.media)
    if not media.exists():
        print(f"FATAL: not found: {media}", file=sys.stderr)
        return 2

    model = WhisperModel(args.model, device=args.device, compute_type="int8")
    segments, info = model.transcribe(str(media), language=args.language,
                                      word_timestamps=True)
    segments = list(segments)
    print(f"detected language: {info.language} (p={info.language_probability:.2f}), "
          f"{len(segments)} segments")

    stem = media.with_suffix("")
    words = []
    seg_out = []
    srt_lines = []
    for i, seg in enumerate(segments, 1):
        seg_out.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
        if not args.words_only:
            srt_lines.append(
                f"{i}\n{srt_time(seg.start)} --> {srt_time(seg.end)}\n"
                f"{seg.text.strip()}\n")
        for w in (seg.words or []):
            words.append({"word": w.word.strip(), "start": w.start, "end": w.end})

    if not args.words_only:
        srt_path = stem.with_suffix(".srt")
        srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
        print(f"wrote {srt_path}")

    words_path = stem.with_suffix(".words.json")
    words_path.write_text(json.dumps(words, indent=1), encoding="utf-8")
    print(f"wrote {words_path} ({len(words)} words)")

    seg_path = stem.with_suffix(".segments.json")
    seg_path.write_text(json.dumps(seg_out, indent=1), encoding="utf-8")
    print(f"wrote {seg_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

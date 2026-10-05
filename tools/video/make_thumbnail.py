#!/usr/bin/env python3
"""
make_thumbnail.py — poster frame for a character video.

Extracts a frame at a beat-aligned timestamp, scales to 1280x720, and overlays
the character name + nickname. Reuses the visual-packet pattern from
TRIPPEDD-Production-studios- tools/visual/make_visual_packet.py (ffprobe +
ffmpeg frame pull), with the title treatment done in Pillow.

Usage:
  python3 tools/video/make_thumbnail.py --video spot_16x9.mp4 --at 12.4 \
      --name "STICK-UP" --nickname "The Enigmatic Gangster" --out thumb.jpg

Dep: ffmpeg, Pillow (HPND).
"""
import argparse, subprocess, tempfile, os
from PIL import Image, ImageDraw, ImageFont

def _pick(cands):
    for c in cands:
        if os.path.exists(c):
            return c
    raise SystemExit("no usable font found")

FONT_BOLD = _pick(["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"])
FONT_ITAL = _pick(["/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
                   "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"])

def run(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("FAILED: " + " ".join(cmd) + "\n" + r.stderr[-1500:])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--at", type=float, required=True, help="timestamp seconds")
    ap.add_argument("--name", required=True)
    ap.add_argument("--nickname", default="")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    tmp = tempfile.mkdtemp(prefix="thumb_")
    frame = os.path.join(tmp, "frame.png")
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-ss", f"{a.at:.3f}", "-i", a.video, "-frames:v", "1", frame)
    img = Image.open(frame).convert("RGB").resize((1280, 720), Image.LANCZOS)
    d = ImageDraw.Draw(img, "RGBA")
    # bottom gradient for legibility
    grad = Image.new("L", (1, 260))
    for y in range(260):
        grad.putpixel((0, y), int(200 * (y / 259) ** 1.6))
    grad = grad.resize((1280, 260))
    img.paste(Image.new("RGB", (1280, 260), (0, 0, 0)),
              (0, 460), grad)
    d = ImageDraw.Draw(img)
    fb = ImageFont.truetype(FONT_BOLD, 92)
    fi = ImageFont.truetype(FONT_ITAL, 44)
    d.text((60, 500), a.name, font=fb, fill=(245, 245, 245))
    if a.nickname:
        d.text((62, 610), "\u201c" + a.nickname + "\u201d", font=fi, fill=(200, 200, 205))
    img.save(a.out, quality=90)
    print("wrote", a.out, os.path.getsize(a.out), "bytes")

if __name__ == "__main__":
    main()

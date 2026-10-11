#!/usr/bin/env python3
"""sbs_proof.py — side-by-side v1/v2 proof composite builder.

For each fixed defect the owner gets a side-by-side shot: v1 frame on the
left, v2 frame on the right, a header naming the defect, and a footer strip
with the full checklist marking each item fixed or not, with the gate that
proves it. Proof, not claims.

Usage:
  python3 sbs_proof.py --v1 v1_frame.png --v2 v2_frame.png \\
      --title "skin flap at left shoulder" \\
      --fixes fixes.json \\
      --out proof_shoulder.png

fixes.json: [{"defect": "...", "status": "fixed|not_fixed|n/a",
              "gate": "skin_flap_area_px", "v1": "1250 px", "v2": "40 px"}]
"""
import argparse
import hashlib
import json
import os

from PIL import Image, ImageDraw, ImageFont


STATUS_COLORS = {"fixed": (46, 160, 67), "not_fixed": (207, 34, 46), "n/a": (120, 120, 120)}
STATUS_MARKS = {"fixed": "[FIXED]", "not_fixed": "[NOT FIXED]", "n/a": "[N/A]"}


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_font(size):
    for name in ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def label_bar(img, text, left=True):
    d = ImageDraw.Draw(img)
    font = load_font(28)
    tag = "v1" if left else "v2"
    x = 12 if left else img.width - 12
    anchor = "ls" if left else "rs"
    bbox = d.textbbox((0, 0), tag, font=font)
    pad = 8
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if left:
        d.rectangle([0, 0, tw + pad * 2, th + pad * 2], fill=(0, 0, 0, 180))
        d.text((pad, pad), tag, font=font, fill=(255, 255, 255), anchor="lt")
    else:
        d.rectangle([img.width - tw - pad * 2, 0, img.width, th + pad * 2], fill=(0, 0, 0, 180))
        d.text((img.width - pad, pad), tag, font=font, fill=(255, 255, 255), anchor="rt")
    return img


def main():
    ap = argparse.ArgumentParser(description="side-by-side v1/v2 proof builder")
    ap.add_argument("--v1", required=True, help="v1 frame image")
    ap.add_argument("--v2", required=True, help="v2 frame image")
    ap.add_argument("--title", required=True, help="defect title for the header")
    ap.add_argument("--fixes", required=True, help="checklist JSON file")
    ap.add_argument("--out", required=True, help="output composite PNG")
    ap.add_argument("--width", type=int, default=960, help="column width px")
    ap.add_argument("--inspected", default="",
                    help="comma-separated list of the exact check frames actually "
                    "looked at for this proof (media proof standard)")
    args = ap.parse_args()

    fixes = json.load(open(args.fixes))
    v1_sha = sha1_of(args.v1)
    v2_sha = sha1_of(args.v2)

    v1 = Image.open(args.v1).convert("RGB")
    v2 = Image.open(args.v2).convert("RGB")
    col_w = args.width
    col_h = int(col_w * max(v1.height / v1.width, v2.height / v2.width))
    v1 = v1.resize((col_w, int(col_w * v1.height / v1.width)))
    v2 = v2.resize((col_w, int(col_w * v2.height / v2.width)))
    v1 = label_bar(v1, "", left=True)
    v2 = label_bar(v2, "", left=False)

    header_h = 90
    row_h = 44
    footer_h = 60 + row_h * len(fixes) + 140  # +140: fingerprint/inspected/version lines
    total_h = header_h + col_h + footer_h
    canvas = Image.new("RGB", (col_w * 2, total_h), (16, 16, 16))
    d = ImageDraw.Draw(canvas)
    font_big = load_font(40)
    font = load_font(24)
    font_small = load_font(20)

    d.text((20, 24), args.title, font=font_big, fill=(255, 200, 40))

    canvas.paste(v1, (0, header_h))
    canvas.paste(v2, (col_w, header_h))
    d.line([(col_w, header_h), (col_w, header_h + col_h)], fill=(255, 255, 255), width=3)

    y = header_h + col_h + 12
    d.text((20, y), "FIX CHECKLIST — each item marked fixed or not, with proof",
           font=font, fill=(200, 200, 200))
    y += 48
    for f in fixes:
        status = f.get("status", "n/a")
        mark = STATUS_MARKS.get(status, "[?]")
        color = STATUS_COLORS.get(status, (120, 120, 120))
        d.rectangle([20, y, 34, y + 20], fill=color)
        line = (f"  {mark} {f.get('defect','')}  "
                f"| gate: {f.get('gate','-')}  | v1: {f.get('v1','-')} -> v2: {f.get('v2','-')}")
        d.text((20, y), line, font=font_small, fill=(230, 230, 230))
        y += row_h

    # Media proof standard: fingerprints + the frames actually inspected.
    y += 8
    d.text((20, y), f"v1 sha1: {v1_sha}  ({os.path.basename(args.v1)})",
           font=font_small, fill=(150, 200, 150))
    y += 30
    d.text((20, y), f"v2 sha1: {v2_sha}  ({os.path.basename(args.v2)})",
           font=font_small, fill=(150, 200, 150))
    y += 30
    inspected = args.inspected.strip() or "UNSPECIFIED"
    d.text((20, y), f"check frames actually inspected: {inspected}",
           font=font_small, fill=(150, 200, 150))
    y += 30
    d.text((20, y), "version, never overwrite: v1 assets untouched; this is a NEW version",
           font=font_small, fill=(150, 200, 150))

    canvas.save(args.out)
    print(f"wrote {args.out}  ({canvas.width}x{canvas.height})")
    print(f"v1 sha1: {v1_sha}")
    print(f"v2 sha1: {v2_sha}")
    print(f"inspected: {inspected}")


if __name__ == "__main__":
    main()

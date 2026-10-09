#!/usr/bin/env python3
"""
cards.py — El Toro-style title card renderer (PIL).
Replaces ffmpeg drawtext with real typography:

  - Bold italic display font (Noto Serif Display Black Italic)
  - Gold fill, thick black stroke, red outer glow
  - Thin red rule underneath the name
  - Transparent background — floats over the 3D scene (NO black panel)
  - Subtle scale/fade animation baked as PNG sequence for ffmpeg overlay

Usage:
  python3 cards.py --text "STICK UP" --sub "AMERICUS, GEORGIA" \
      --out /tmp/card/ --width 1920 --height 1080 --frames 90
"""
import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_MAIN = "/usr/share/fonts/truetype/noto/NotoSerifDisplay-BlackItalic.ttf"
FONT_SUB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

GOLD = (255, 205, 90)
GOLD_DARK = (230, 170, 60)
BLACK = (0, 0, 0)
RED = (200, 30, 20)
WHITE = (255, 255, 255)

def find_font():
    for p in (FONT_MAIN, FONT_SUB):
        if os.path.exists(p):
            return p
    raise RuntimeError("No suitable font found")

def render_card(text, sub, width, height, frame_idx, total_frames,
                style="name"):
    """
    style="name": big gold name + red rule + white sub (titantron/tagline)
    style="end":  big white name + gold glow + gold sub-line (end card)
    Returns RGBA image.
    """
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # CARD ANIMATION FIX (2026-10-08): the old code baked a 12-frame alpha
    # fade-in and scale-up into the PNG sequence. When edit.py loops the card
    # (-stream_loop), every loop restart jumps back to alpha=0 = visible
    # FLASHING. Cards now render at full opacity, static. edit.py's ffmpeg
    # fade in/out handles the entrance/exit. No baked animation = seamless loop.
    alpha = 255

    main_size = int(height * 0.16)
    sub_size = int(height * 0.055)
    try:
        f_main = ImageFont.truetype(FONT_MAIN, main_size)
    except OSError:
        f_main = ImageFont.truetype(find_font(), main_size)
    try:
        f_sub = ImageFont.truetype(FONT_SUB, sub_size)
    except OSError:
        f_sub = ImageFont.load_default()

    # auto-fit: shrink main text until it fits within frame width
    # (long names like "THE ENIGMATIC GANGSTER" must never clip)
    # GLOW-CLIP FIX (2026-10-08): the old code measured with stroke_width=10
    # and fit to 90% width, but the glow layer uses stroke_width=14 PLUS a
    # 28px Gaussian blur that extends ~28px beyond the text on each side.
    # At 480px wide, that pushed text out of bounds. Now we measure with the
    # glow's stroke width and fit to 80%, leaving room for the blur.
    fit_draw = ImageDraw.Draw(Image.new("RGBA", (8, 8), (0, 0, 0, 0)))
    while main_size > 8:
        bb = fit_draw.textbbox((0, 0), text, font=f_main, stroke_width=14)
        if bb[2] - bb[0] <= int(width * 0.80):
            break
        main_size = int(main_size * 0.92)
        try:
            f_main = ImageFont.truetype(FONT_MAIN, main_size)
        except OSError:
            f_main = ImageFont.truetype(find_font(), main_size)

    # --- glow layer (red for name, gold for end) ---
    glow_color = (255, 40, 20) if style == "name" else (255, 190, 80)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    bbox = dg.textbbox((0, 0), text, font=f_main, stroke_width=10)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx, cy = width // 2, int(height * 0.42)
    # slight italic skew is in the font already (Black Italic)
    dg.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text,
            font=f_main, fill=glow_color + (int(alpha * 0.85),),
            stroke_width=14, stroke_fill=glow_color + (int(alpha * 0.85),))
    glow = glow.filter(ImageFilter.GaussianBlur(28))

    # --- main text ---
    fill = GOLD if style == "name" else WHITE
    # gold gradient: draw twice, top lighter
    txt_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dt = ImageDraw.Draw(txt_layer)
    dt.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text,
            font=f_main, fill=fill + (alpha,),
            stroke_width=8, stroke_fill=BLACK + (alpha,))
    if style == "name":
        # highlight sweep on top half
        hl = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        dh = ImageDraw.Draw(hl)
        dh.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text,
                font=f_main, fill=(255, 240, 200, int(alpha * 0.55)),
                stroke_width=0)
        # mask to top 45% of text (feathered edge)
        mask = Image.new("L", (width, height), 0)
        dm = ImageDraw.Draw(mask)
        dm.rectangle([cx - tw / 2, cy - th / 2,
                      cx + tw / 2, cy - th / 2 + th * 0.45], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(6))
        txt_layer = Image.composite(hl, txt_layer, mask)

    # --- red rule ---
    rule = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dr = ImageDraw.Draw(rule)
    rw = int(tw * 0.62)
    ry = cy + th / 2 + int(height * 0.035)
    dr.rectangle([cx - rw / 2, ry, cx + rw / 2, ry + max(3, height // 270)],
                 fill=RED + (alpha,))

    # --- sub text ---
    sub_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    if sub:
        ds = ImageDraw.Draw(sub_layer)
        sb = ds.textbbox((0, 0), sub, font=f_sub, stroke_width=3)
        sw, sh = sb[2] - sb[0], sb[3] - sb[1]
        sy = ry + int(height * 0.045)
        sub_fill = WHITE if style == "name" else GOLD
        ds.text((cx - sw / 2 - sb[0], sy), sub, font=f_sub,
                fill=sub_fill + (alpha,),
                stroke_width=4, stroke_fill=BLACK + (alpha,))

    # composite: glow -> text -> rule -> sub
    img = Image.alpha_composite(img, glow)
    img = Image.alpha_composite(img, txt_layer)
    img = Image.alpha_composite(img, rule)
    img = Image.alpha_composite(img, sub_layer)
    # (scale animation removed 2026-10-08 — see note above; static card)
    return img

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--sub", default="")
    ap.add_argument("--style", default="name", choices=["name", "end"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--frames", type=int, default=90)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for i in range(a.frames):
        img = render_card(a.text, a.sub, a.width, a.height, i, a.frames,
                          style=a.style)
        img.save(os.path.join(a.out, f"card_{i:04d}.png"))
        if i % 30 == 0:
            print(f"  card frame {i}/{a.frames}")
    print(f"DONE: {a.frames} card frames -> {a.out}")

if __name__ == "__main__":
    main()

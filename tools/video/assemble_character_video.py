#!/usr/bin/env python3
"""
assemble_character_video.py — programmatic NLE for Bannon character videos.

Takes verified gameplay footage + a music bed + a beat grid and assembles the
roster-spot skeleton (game sting -> name card -> signature footage -> end card)
as 16:9 and 9:16 MP4 deliverables. No manual NLE work, no guessed timing: the
name-card hold snaps to the beat grid and the audio bed is loudness-normalized.

Usage:
  python3 tools/video/assemble_character_video.py \
    --footage /path/to/gameplay.mp4 \
    --audio   /path/to/track.mp3 \
    --beats   /path/to/beats.json \
    --name "STICK-UP" \
    --nicknames "The Enigmatic Gangster|The Flamboyant Flexer" \
    --billing "Americus, Georgia - 6'1\" - 155 lbs" \
    --outdir /tmp/stickup_pkg \
    --profile delivery

Deps (all open-source, licenses in TOOLS_VIDEO.md): ffmpeg, Pillow (HPND),
OpenTimelineIO NOT required here. aubio beat JSONs are produced by the
existing stickup/audio pipeline.
"""
import argparse, hashlib, json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
def _pick(cands):
    for c in cands:
        if os.path.exists(c):
            return c
    raise SystemExit("no usable font found; tried: " + ", ".join(cands))

FONT_BOLD = _pick(["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"])
FONT_REG  = _pick(["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"])
FONT_ITAL = _pick(["/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
                   "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"])

PROFILES = {
    "draft":    {"preset": "veryfast", "crf": "23"},
    "delivery": {"preset": "medium",   "crf": "18"},
    "archive":  {"preset": "slow",     "crf": "16"},
}

def run(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("FAILED: " + " ".join(cmd) + "\n" + r.stderr[-2000:])
    return r

def probe(path):
    r = run("ffprobe", "-v", "error", "-show_entries",
            "format=duration:stream=width,height,avg_frame_rate",
            "-of", "json", path)
    return json.loads(r.stdout)

def font(path_, size):
    return ImageFont.truetype(path_, size)

def card_base():
    img = Image.new("RGB", (W, H), (10, 10, 12))
    d = ImageDraw.Draw(img)
    # red accent bar top
    d.rectangle([0, 0, W, 14], fill=(178, 34, 34))
    d.rectangle([0, H - 14, W, H], fill=(178, 34, 34))
    return img, d

def centered(d, y, text, fnt, fill):
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2, y), text, font=fnt, fill=fill)

def name_card(name, nicknames, billing, out):
    img, d = card_base()
    fb, fr, fi = font(FONT_BOLD, 44), font(FONT_REG, 40), font(FONT_ITAL, 44)
    fn = font(FONT_BOLD, 150)
    centered(d, 300, "B A N N O N", fb, (200, 200, 205))
    centered(d, 430, name, fn, (245, 245, 245))
    y = 640
    for nk in nicknames:
        centered(d, y, "\u201c" + nk + "\u201d", fi, (170, 170, 175))
        y += 70
    centered(d, y + 20, billing, fr, (150, 150, 155))
    img.save(out)

def end_card(name, out):
    img, d = card_base()
    fb, fr = font(FONT_BOLD, 44), font(FONT_REG, 40)
    fn = font(FONT_BOLD, 110)
    centered(d, 380, "B A N N O N", fb, (200, 200, 205))
    centered(d, 500, name, fn, (245, 245, 245))
    centered(d, 680, "VERIFIED GAMEPLAY FOOTAGE", fr, (150, 150, 155))
    img.save(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--footage", required=True)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--nicknames", default="")
    ap.add_argument("--billing", default="")
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--profile", default="delivery", choices=PROFILES)
    ap.add_argument("--slug", default="CHARACTER")
    a = ap.parse_args()

    os.makedirs(a.outdir, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="assemble_")
    card_png = os.path.join(tmp, "namecard.png")
    end_png = os.path.join(tmp, "endcard.png")
    nicks = [n for n in a.nicknames.split("|") if n.strip()]
    name_card(a.name, nicks, a.billing, card_png)
    end_card(a.name, end_png)

    beats = json.load(open(a.beats))["beat_times_s"]
    import statistics
    ivs = [beats[i] - beats[i - 1] for i in range(1, len(beats))]
    beat_iv = statistics.median(ivs)
    # name-card hold: nearest whole beats to ~3.5s so the sting lands on a beat
    n_beats = max(4, round(3.5 / beat_iv))
    card_dur = round(n_beats * beat_iv, 3)
    end_dur = 2.0
    foot_dur = float(probe(a.footage)["format"]["duration"])
    total = card_dur + foot_dur + end_dur
    print(f"beat {beat_iv:.3f}s | name card {n_beats} beats = {card_dur}s | footage {foot_dur:.2f}s | total {total:.2f}s")

    # two-pass loudnorm on the bed (this ffmpeg prints input_*/target_offset keys)
    r = run("ffmpeg", "-hide_banner", "-i", a.audio, "-filter:a",
            "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-")
    import re
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m:
        raise SystemExit("loudnorm first pass produced no JSON")
    ln = json.loads(m.group(0))
    ln_filter = ("loudnorm=I=-14:TP=-1.5:LRA=11"
                 f":measured_I={ln['input_i']}:measured_TP={ln['input_tp']}"
                 f":measured_LRA={ln['input_lra']}:measured_thresh={ln['input_thresh']}"
                 f":offset={ln['target_offset']}:linear=true")

    prof = PROFILES[a.profile]
    vf169 = (f"[0:v]fade=t=in:st=0:d=0.4,fade=t=out:st={card_dur-0.5:.3f}:d=0.5,"
             f"format=yuv420p[v0];[v0][1:v][2:v]concat=n=3:v=1:a=0,"
             f"scale=1920:1080:force_original_aspect_ratio=decrease,"
             f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v169]")
    vf916 = (f"[0:v]fade=t=in:st=0:d=0.4,fade=t=out:st={card_dur-0.5:.3f}:d=0.5,"
             f"format=yuv420p[v0];[v0][1:v][2:v]concat=n=3:v=1:a=0,"
             f"scale=1080:1920:force_original_aspect_ratio=increase,"
             f"crop=1080:1920,setsar=1[v916]")
    af = (f"[3:a]{ln_filter},atrim=0:{total:.3f},apad=whole_dur={total:.3f},aformat=sample_fmts=fltp:channel_layouts=stereo[aout]")

    base = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-loop", "1", "-t", f"{card_dur}", "-i", card_png,
            "-i", a.footage,
            "-loop", "1", "-t", f"{end_dur}", "-i", end_png,
            "-i", a.audio]
    for aspect, vf, tag in (("16x9", vf169, "v169"), ("9x16", vf916, "v916")):
        out = os.path.join(a.outdir, f"{a.slug}_{aspect}.mp4")
        run(*(base + ["-filter_complex", vf + ";" + af,
                      "-map", f"[{tag}]", "-map", "[aout]",
                      "-c:v", "libx264", "-preset", prof["preset"], "-crf", prof["crf"],
                      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                      "-shortest", out]))
        print("wrote", out)

    # hashes
    sha = os.path.join(a.outdir, "SHA256SUMS.txt")
    with open(sha, "w") as f:
        for fn_ in sorted(os.listdir(a.outdir)):
            if fn_.endswith(".mp4"):
                p = os.path.join(a.outdir, fn_)
                h = hashlib.sha256(open(p, "rb").read()).hexdigest()
                f.write(f"{h}  {fn_}\n")
    print("wrote", sha)

if __name__ == "__main__":
    main()

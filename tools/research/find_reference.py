#!/usr/bin/env python3
"""find_reference.py — FIND and WATCH reference footage for a move, without a screen.

    python3 tools/research/find_reference.py "slide under the bottom rope into the ring"
    python3 tools/research/find_reference.py "shooting star press" --frames 12
    python3 tools/research/find_reference.py "ginga footwork capoeira" --grab --out /tmp/ref

WHY THIS EXISTS. Owner: "create something that can find and watch clips for moves and mocap and
transitions and animations and locomotion and styles etc."

The pipeline already has three ways to GET motion -- video capture (video_to_clip), text generation
(text_to_clip / MoMask) and dataset ingest (ingest_dataset). What it has never had is a way to go
LOOKING for the reference in the first place. Every capture so far came from the owner filming it
himself and uploading it. That does not scale to 400 moves, and it is why the transition phases had
no animation data at all until they were generated blind from prompts.

WHAT IT DOES
  1. SEARCH  — queries YouTube for the move and returns real candidates with duration and channel,
               so a 9-second move clip can be told apart from a 40-minute match upload.
  2. WATCH   — pulls the transcript when there is one (a tutorial explains the mechanics; a raw move
               clip will not have one), so a technique breakdown is readable as text.
  3. GRAB    — with --grab, downloads the video and samples frames, which is the thing that actually
               matters for silent move footage. The frames are ordinary images: look at them, and if
               the move is right, hand the file to tools/mocap/video_to_clip.py, which is already
               the capture path.

  So the chain becomes:  find -> look -> capture -> bake -> map. Previously step one was "ask the
  owner to film it".

LICENCE, AND THIS IS NOT OPTIONAL (owner LAW, 2026-07-27). Footage found this way is REFERENCE. It
is for looking at and for deriving OUR OWN motion from -- exactly as Bandai Namco (CC BY-NC) and
CombatMotion (from shipped commercial assets) are usable for development and refused by
--commercial-only. Downloaded video and any motion retargeted straight off it must NOT be baked into
the shipping game. Output goes to a gitignored scratch path by default for that reason. Ship-safe
sources remain: CMU, Mixamo, Truebones CC0, MoMask generation, and the owner's own camera.

Requires yt-dlp (already installed for tools/research/yt_watch.py); --frames needs ffmpeg.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

DEFAULT_OUT = os.path.join(os.environ.get('BANNON_SCRATCH', tempfile.gettempdir()), 'refclips')


def search(query, limit):
    """Real search results, with the metadata needed to judge them without opening one."""
    import yt_dlp
    opts = {'quiet': True, 'no_warnings': True, 'extract_flat': True, 'skip_download': True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info('ytsearch%d:%s' % (limit, query), download=False)
    out = []
    for e in (info.get('entries') or []):
        if not e:
            continue
        out.append({
            'id': e.get('id'),
            'title': (e.get('title') or '').strip(),
            'channel': e.get('uploader') or e.get('channel') or '?',
            'dur': int(e.get('duration') or 0),
            'url': 'https://www.youtube.com/watch?v=' + (e.get('id') or ''),
        })
    return out


def transcript(vid, outdir):
    import yt_dlp
    opts = {'skip_download': True, 'writesubtitles': True, 'writeautomaticsub': True,
            'subtitleslangs': ['en', 'en-US', 'en-orig'], 'subtitlesformat': 'vtt',
            'outtmpl': os.path.join(outdir, '%(id)s.%(ext)s'), 'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.extract_info('https://www.youtube.com/watch?v=' + vid, download=True)
    except Exception:
        return None
    cand = [f for f in os.listdir(outdir) if f.startswith(vid) and f.endswith('.vtt')]
    if not cand:
        return None
    text, prev = [], None
    for raw in open(os.path.join(outdir, cand[0]), encoding='utf-8', errors='replace'):
        line = raw.strip()
        if not line or line == 'WEBVTT' or '-->' in line or line.isdigit():
            continue
        if line.startswith(('Kind:', 'Language:', 'NOTE')):
            continue
        line = re.sub(r'<[^>]+>', '', line).strip()
        if not line or line == prev:
            continue
        prev = line
        text.append(line)
    return ' '.join(text) if text else None


def grab(vid, n, outdir):
    """Download and sample frames. This is the part that matters for silent move footage."""
    import yt_dlp
    mp4 = os.path.join(outdir, vid + '.mp4')
    if not os.path.exists(mp4):
        # smallest usable stream: this is reference, not a master
        with yt_dlp.YoutubeDL({'format': 'worstvideo[height>=360][ext=mp4]/worst[ext=mp4]/worst',
                               'outtmpl': mp4, 'quiet': True, 'no_warnings': True}) as ydl:
            ydl.download(['https://www.youtube.com/watch?v=' + vid])
    shots = os.path.join(outdir, vid + '_frames')
    os.makedirs(shots, exist_ok=True)
    dur = 0.0
    try:
        p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                            '-of', 'default=nw=1:nk=1', mp4], capture_output=True, text=True)
        dur = float((p.stdout or '0').strip() or 0)
    except Exception:
        pass
    # even coverage across the clip beats a fixed fps for a short move
    if dur > 0:
        step = max(dur / max(n, 1), 0.05)
        vf = 'fps=1/%.3f,scale=640:-1' % step
    else:
        vf = 'fps=2,scale=640:-1'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp4, '-vf', vf,
                    '-frames:v', str(n), os.path.join(shots, 'f%03d.jpg')], check=False)
    return mp4, sorted(os.path.join(shots, f) for f in os.listdir(shots)), dur


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('query')
    ap.add_argument('--limit', type=int, default=8)
    ap.add_argument('--grab', action='store_true', help='download the top hit and sample frames')
    ap.add_argument('--pick', type=int, default=1, help='which result to grab (1-based)')
    ap.add_argument('--frames', type=int, default=10)
    ap.add_argument('--max-dur', type=int, default=0,
                    help='ignore results longer than this many seconds (a move clip is short)')
    ap.add_argument('--out', default=DEFAULT_OUT)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    try:
        res = search(a.query, a.limit)
    except Exception as e:
        print('SEARCH FAILED: ' + str(e).split('\n')[0], file=sys.stderr)
        sys.exit(1)
    if a.max_dur:
        res = [r for r in res if 0 < r['dur'] <= a.max_dur] or res

    print('QUERY  ' + a.query)
    print('%d result(s)\n' % len(res))
    for i, r in enumerate(res, 1):
        m, s = divmod(r['dur'], 60)
        print('%2d. [%d:%02d] %s' % (i, m, s, r['title'][:78]))
        print('      %s   %s' % (r['channel'][:30], r['url']))
    if not res:
        return

    if not a.grab:
        print('\n--grab to download result #%d and sample %d frames to look at.' % (a.pick, a.frames))
        return

    pick = res[max(0, min(a.pick - 1, len(res) - 1))]
    print('\nGRABBING #%d  %s' % (a.pick, pick['title'][:70]))
    txt = transcript(pick['id'], a.out)
    if txt:
        print('\n-- TRANSCRIPT (%d chars) --\n%s' % (len(txt), txt[:2500]))
    else:
        print('\n-- no captions (normal for a raw move clip) --')
    try:
        mp4, frames, dur = grab(pick['id'], a.frames, a.out)
    except Exception as e:
        print('grab failed: ' + str(e).split('\n')[0], file=sys.stderr)
        sys.exit(1)
    print('\n-- VIDEO --\n   %s  (%.1fs)' % (mp4, dur))
    print('-- FRAMES (%d) --' % len(frames))
    for f in frames:
        print('   ' + f)
    print('\nIf the move is right, capture it:')
    print('   python3 tools/mocap/video_to_clip.py "%s" --name <KEY>' % mp4)
    print('REFERENCE ONLY — see the licence note at the top of this file before anything ships.')


if __name__ == '__main__':
    main()

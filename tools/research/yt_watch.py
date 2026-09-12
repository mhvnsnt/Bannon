#!/usr/bin/env python3
"""yt_watch.py — READ a YouTube video the agent cannot watch.

    python3 tools/research/yt_watch.py <url-or-id> [--full] [--frames N]

WHY THIS EXISTS. The owner sent four YouTube links about how other developers work, and the
answer was "I can't watch those". That is the kind of answer he has told me to stop giving:
"instead of telling me you can't do thing build tools and actuators that let you."

So this is the actuator. It pulls what a video actually CONTAINS, without a screen:
  * title, channel, duration, description, chapter list
  * the full transcript -- manual captions if the uploader wrote them, else auto-generated
  * optionally sampled FRAMES, so a visual demo can be looked at with the same render_clip.py
    habit the mocap work uses (OWNER LAW: see it, do not infer it)

Transcript is the high-value part: a tutorial or a talk is mostly speech, and speech is text.
For a silent visual demo, --frames is the fallback.

Requires yt-dlp (pip install yt-dlp). Frame sampling additionally needs ffmpeg.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

SCRATCH = os.environ.get('BANNON_SCRATCH', tempfile.gettempdir())


def vid_id(s):
    """Accept a bare id, a watch URL, a youtu.be link, or a shorts link."""
    s = s.strip()
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', s):
        return s
    m = re.search(r'(?:v=|youtu\.be/|/shorts/|/embed/)([A-Za-z0-9_-]{11})', s)
    return m.group(1) if m else None


def meta_and_subs(vid, outdir):
    """One yt-dlp pass for metadata + whatever caption track exists."""
    import yt_dlp
    opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-GB', 'en-orig'],
        'subtitlesformat': 'vtt',
        'outtmpl': os.path.join(outdir, '%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info('https://www.youtube.com/watch?v=' + vid, download=True)
    return info


def vtt_text(path):
    """VTT -> plain prose. Auto-captions repeat each line as a rolling window, so dedupe."""
    out, seen_last = [], None
    for raw in open(path, encoding='utf-8', errors='replace'):
        line = raw.strip()
        if not line or line == 'WEBVTT' or '-->' in line:
            continue
        if line.startswith(('Kind:', 'Language:', 'NOTE')) or line.isdigit():
            continue
        line = re.sub(r'<[^>]+>', '', line)            # inline word timings
        line = re.sub(r'\s+', ' ', line).strip()
        if not line or line == seen_last:
            continue
        seen_last = line
        out.append(line)
    # collapse the rolling-window overlap auto-captions produce
    text, prev = [], ''
    for l in out:
        if prev and (l.startswith(prev) or prev.endswith(l)):
            if len(l) > len(prev):
                text[-1] = l
                prev = l
            continue
        text.append(l)
        prev = l
    return ' '.join(text)


def sample_frames(vid, n, outdir):
    """Grab N evenly spaced frames. For demos where the point is visual, not spoken."""
    import yt_dlp
    mp4 = os.path.join(outdir, vid + '.mp4')
    if not os.path.exists(mp4):
        with yt_dlp.YoutubeDL({'format': 'worstvideo[height>=360][ext=mp4]/worst[ext=mp4]/worst',
                               'outtmpl': mp4, 'quiet': True, 'no_warnings': True}) as ydl:
            ydl.download(['https://www.youtube.com/watch?v=' + vid])
    shots = os.path.join(outdir, vid + '_frames')
    os.makedirs(shots, exist_ok=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp4,
                    '-vf', 'fps=1/%d,scale=640:-1' % max(1, n), '-frames:v', str(n),
                    os.path.join(shots, 'f%03d.jpg')], check=False)
    return sorted(os.path.join(shots, f) for f in os.listdir(shots))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url')
    ap.add_argument('--full', action='store_true', help='print the whole transcript, not the head')
    ap.add_argument('--frames', type=int, default=0, help='also sample N frames to disk')
    ap.add_argument('--outdir', default=os.path.join(SCRATCH, 'yt'))
    a = ap.parse_args()

    v = vid_id(a.url)
    if not v:
        print('not a YouTube url or id: ' + a.url, file=sys.stderr)
        sys.exit(2)
    os.makedirs(a.outdir, exist_ok=True)

    try:
        info = meta_and_subs(v, a.outdir)
    except Exception as e:
        print('FETCH FAILED: ' + str(e).split('\n')[0], file=sys.stderr)
        sys.exit(1)

    print('TITLE    ' + (info.get('title') or '?'))
    print('CHANNEL  ' + (info.get('uploader') or '?'))
    dur = info.get('duration') or 0
    print('LENGTH   %d:%02d' % (dur // 60, dur % 60))
    print('URL      https://www.youtube.com/watch?v=' + v)
    chapters = info.get('chapters') or []
    if chapters:
        print('CHAPTERS')
        for c in chapters:
            print('   %5ds  %s' % (int(c.get('start_time', 0)), c.get('title', '')))
    desc = (info.get('description') or '').strip()
    if desc:
        print('\n-- DESCRIPTION --\n' + (desc if a.full else desc[:1200]))

    cand = [f for f in os.listdir(a.outdir) if f.startswith(v) and f.endswith('.vtt')]
    # a manual caption track beats an auto one; auto files carry the a.<lang> marker
    cand.sort(key=lambda f: ('.en.' not in f, 'auto' in f))
    if cand:
        txt = vtt_text(os.path.join(a.outdir, cand[0]))
        print('\n-- TRANSCRIPT (%s, %d chars) --' % (cand[0].replace(v, ''), len(txt)))
        print(txt if a.full else txt[:6000] + ('\n... (--full for the rest)' if len(txt) > 6000 else ''))
    else:
        print('\n-- NO CAPTIONS on this video. Use --frames to look at it instead. --')

    if a.frames:
        try:
            fs = sample_frames(v, a.frames, a.outdir)
            print('\n-- FRAMES (%d) --' % len(fs))
            for f in fs:
                print('   ' + f)
        except Exception as e:
            print('frame sampling failed: ' + str(e).split('\n')[0], file=sys.stderr)


if __name__ == '__main__':
    main()

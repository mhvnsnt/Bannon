#!/usr/bin/env python3
"""scrape_clips.py — pull a wrestler's own video down and turn it into mocap, per character.

    # list what is there without downloading anything
    python3 tools/mocap/scrape_clips.py --char TARZANIAN_DEVIL \
        --source https://www.instagram.com/tarzanian_devil/ --list

    # download, newest 25, then capture every one straight into clips
    python3 tools/mocap/scrape_clips.py --char TARZANIAN_DEVIL \
        --source https://www.instagram.com/tarzanian_devil/ --limit 25 --capture

    # a single post / reel / short
    python3 tools/mocap/scrape_clips.py --char TARZANIAN_DEVIL --source <post-url> --capture

    # capture what was already downloaded earlier, naming as you go
    python3 tools/mocap/scrape_clips.py --char TARZANIAN_DEVIL --capture-existing \
        --name-map "abc123=SWANTON_WILD,def456=TILT_RANA_CROSSBODY"

WHY THIS EXISTS. Owner: "create a video scraper to assist with clip collection for mocap from his
social[s] ... that will help build more characters specific mocap per character as we go."

Up to now every capture needed the owner to find a video, film or clip it, and hand it over one at a
time. That is the bottleneck on per-character movesets: a wrestler's own feed already contains dozens
of clean, well-lit, single-move clips — exactly the shape video_to_clip wants — and there was no way
to go and get them. This walks a profile, banks the videos under the CHARACTER they belong to, and
optionally runs each one through the existing capture path.

THE CHAIN IS UNCHANGED, this just fills the front of it:
    scrape -> (look at it) -> video_to_clip -> bake -> map -> in game

PROVENANCE IS RECORDED, NOT ASSUMED. Every download writes into a per-character manifest with the
source URL, uploader, upload date and duration, plus whatever you pass as --consent. Footage of a
real performer is theirs; the manifest is what lets anyone later tell apart "the owner has an
arrangement with this performer" from "found on the internet". Downloads land under
assets/mocap/social/<CHAR>/ which is GITIGNORED by default — nothing ships until someone decides it
should, the same rule the NC-licensed motion datasets already follow.

Needs yt-dlp (already installed). Instagram and Facebook increasingly require a logged-in session for
profile listings; pass --cookies <file> (a Netscape cookies.txt) when a profile returns nothing.
Individual public post URLs usually work without one.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = os.path.join(ROOT, 'assets', 'mocap', 'social')


def slug(s):
    return re.sub(r'[^A-Za-z0-9]+', '_', str(s or '')).strip('_').upper()


def ydl_opts(char_dir, cookies=None, limit=None, flat=False):
    o = {
        'quiet': True, 'no_warnings': True, 'ignoreerrors': True,
        'outtmpl': os.path.join(char_dir, '%(id)s.%(ext)s'),
        # a phone-shot move clip does not need a master; 720p is plenty for pose tracking and
        # keeps a 40-video pull from filling the session's disk allowance
        'format': 'bv*[height<=720]+ba/b[height<=720]/b',
        'merge_output_format': 'mp4',
    }
    if flat:
        o.update({'extract_flat': 'in_playlist', 'skip_download': True})
    if cookies:
        o['cookiefile'] = cookies
    if limit:
        o['playlistend'] = int(limit)
    return o


def enumerate_source(url, cookies, limit):
    import yt_dlp
    with yt_dlp.YoutubeDL(ydl_opts('/tmp', cookies, limit, flat=True)) as y:
        info = y.extract_info(url, download=False)
    if not info:
        return []
    entries = info.get('entries')
    if entries is None:
        entries = [info]
    out = []
    for e in entries:
        if not e:
            continue
        out.append({
            'id': e.get('id'), 'title': (e.get('title') or '').strip()[:120],
            'url': e.get('url') or e.get('webpage_url') or url,
            'dur': int(e.get('duration') or 0),
            'uploader': e.get('uploader') or e.get('channel') or '',
            'date': e.get('upload_date') or '',
        })
    return out


def download(url, char_dir, cookies, limit):
    import yt_dlp
    before = set(os.listdir(char_dir)) if os.path.isdir(char_dir) else set()
    os.makedirs(char_dir, exist_ok=True)
    with yt_dlp.YoutubeDL(ydl_opts(char_dir, cookies, limit)) as y:
        y.download([url])
    after = set(os.listdir(char_dir))
    return sorted(f for f in (after - before) if f.lower().endswith(('.mp4', '.mkv', '.webm', '.mov')))


def load_manifest(char_dir):
    p = os.path.join(char_dir, 'manifest.json')
    if os.path.exists(p):
        try:
            return json.load(open(p))
        except Exception:
            pass
    return {'character': os.path.basename(char_dir), 'videos': {}}


def save_manifest(char_dir, man):
    json.dump(man, open(os.path.join(char_dir, 'manifest.json'), 'w'), indent=1)


def capture(video_path, name, extra=None):
    """Hand a downloaded video to the EXISTING capture path — do not reimplement it."""
    cmd = [sys.executable, os.path.join(ROOT, 'tools', 'mocap', 'video_to_clip.py'),
           video_path, '--name', name, '--two']
    if extra:
        cmd += extra
    p = subprocess.run(cmd, capture_output=True, text=True)
    ok = ('banked' in (p.stdout or '')) or ('written' in (p.stdout or ''))
    tail = [l for l in (p.stdout or '').splitlines() if l.strip()][-3:]
    return ok, tail


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--char', required=True, help='character key these clips belong to, e.g. TARZANIAN_DEVIL')
    ap.add_argument('--source', action='append', default=[], help='profile or post URL (repeatable)')
    ap.add_argument('--limit', type=int, default=20)
    ap.add_argument('--cookies', default=None, help='Netscape cookies.txt for logged-in profiles')
    ap.add_argument('--list', action='store_true', help='enumerate only, download nothing')
    ap.add_argument('--capture', action='store_true', help='run each new video through video_to_clip')
    ap.add_argument('--capture-existing', action='store_true', help='capture videos already downloaded')
    ap.add_argument('--name-map', default='', help='videoid=CLIP_NAME,videoid=CLIP_NAME')
    ap.add_argument('--consent', default='', help='provenance note recorded in the manifest')
    ap.add_argument('--max-dur', type=int, default=90, help='skip videos longer than this (a move clip is short)')
    a = ap.parse_args()

    char = slug(a.char)
    char_dir = os.path.join(BASE, char)
    os.makedirs(char_dir, exist_ok=True)
    man = load_manifest(char_dir)
    if a.consent:
        man['consent'] = a.consent
    names = {}
    for pair in filter(None, a.name_map.split(',')):
        if '=' in pair:
            k, v = pair.split('=', 1)
            names[k.strip()] = slug(v)

    # ---- enumerate ----
    if a.source:
        for src in a.source:
            try:
                found = enumerate_source(src, a.cookies, a.limit)
            except Exception as e:
                print('  enumerate failed for %s: %s' % (src, str(e).splitlines()[0][:110]))
                continue
            print('%s -> %d entr%s' % (src, len(found), 'y' if len(found) == 1 else 'ies'))
            for f in found:
                m, s = divmod(f['dur'], 60)
                flag = '' if (not a.max_dur or 0 < f['dur'] <= a.max_dur or f['dur'] == 0) else '  [long]'
                print('   %-12s [%d:%02d] %s%s' % (f['id'], m, s, f['title'][:60], flag))
            if a.list:
                continue
            new = download(src, char_dir, a.cookies, a.limit)
            byid = {f['id']: f for f in found}
            for fn in new:
                vid = os.path.splitext(fn)[0]
                meta = byid.get(vid, {})
                man['videos'][vid] = {
                    'file': fn, 'source': meta.get('url', src), 'title': meta.get('title', ''),
                    'uploader': meta.get('uploader', ''), 'date': meta.get('date', ''),
                    'dur': meta.get('dur', 0), 'fetched': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    'clip': None,
                }
                print('   downloaded %s' % fn)
            save_manifest(char_dir, man)

    if a.list:
        return

    # ---- capture ----
    if a.capture or a.capture_existing:
        todo = [(vid, v) for vid, v in man['videos'].items() if not v.get('clip')]
        if not todo:
            print('nothing to capture (every banked video already has a clip)')
        for vid, v in todo:
            path = os.path.join(char_dir, v['file'])
            if not os.path.exists(path):
                continue
            if a.max_dur and v.get('dur') and v['dur'] > a.max_dur:
                print('  skip %s (%ds > --max-dur)' % (vid, v['dur']))
                continue
            name = names.get(vid) or (char + '_' + slug(v.get('title') or vid))[:48]
            ok, tail = capture(path, name)
            print('  %-12s -> %-40s %s' % (vid, name, 'OK' if ok else 'FAILED'))
            for t in tail:
                print('      ' + t.strip()[:120])
            if ok:
                v['clip'] = name
                save_manifest(char_dir, man)

    print('\nmanifest: %s' % os.path.join(char_dir, 'manifest.json'))
    print('%d video(s) banked for %s, %d captured' %
          (len(man['videos']), char, sum(1 for v in man['videos'].values() if v.get('clip'))))
    print('LOOK AT THE CAPTURES before mapping them:  python3 tools/mocap/render_clip.py <NAME>')


if __name__ == '__main__':
    main()

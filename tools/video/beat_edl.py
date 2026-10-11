#!/usr/bin/env python3
"""
beat_edl.py — beat grid -> OpenTimelineIO editorial interchange.

Turns an aubio beat JSON (see stickup/audio/stickup_beats.json for the pattern)
into a .otio timeline: one video track (the footage clip), one audio track
(the music bed), markers on every beat and phrase markers every 8 beats.
OTIO is the editorial interchange truth (same contract as TRIPPEDD's
opensource/editorial/blender-vse-otio.md) — any NLE or script downstream can
read this instead of re-deriving timing.

Usage:
  python3 tools/video/beat_edl.py --beats beats.json --footage gameplay.mp4 \
      --audio track.mp3 --out timeline.otio [--name "STICK-UP spot"]
  # round-trip check:
  python3 tools/video/beat_edl.py --verify timeline.otio

Dep: OpenTimelineIO (Apache-2.0).
"""
import argparse, json, sys
import opentimelineio as otio

FPS = 30.0

def frames(sec):
    return int(round(sec * FPS))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--beats")
    ap.add_argument("--footage")
    ap.add_argument("--audio")
    ap.add_argument("--out")
    ap.add_argument("--name", default="character spot")
    ap.add_argument("--verify")
    a = ap.parse_args()

    if a.verify:
        tl = otio.adapters.read_from_file(a.verify)
        tracks = list(tl.tracks)
        markers = list(tl.tracks[0].markers) if tracks else []
        clips = [c for t in tracks for c in t if isinstance(c, otio.schema.Clip)]
        print(f"timeline: {tl.name}")
        print(f"tracks: {len(tracks)} clips: {len(clips)} markers: {len(markers)}")
        print(f"duration: {tl.duration().to_seconds():.2f}s")
        ok = len(tracks) == 2 and len(clips) == 2 and len(markers) > 0
        print("VERIFY:", "PASS" if ok else "FAIL")
        sys.exit(0 if ok else 1)

    beats = json.load(open(a.beats))["beat_times_s"]
    tl = otio.schema.Timeline(name=a.name)

    vt = otio.schema.Track(name="V1", kind=otio.schema.TrackKind.Video)
    at = otio.schema.Track(name="A1", kind=otio.schema.TrackKind.Audio)
    dur = beats[-1]
    vclip = otio.schema.Clip(
        name="footage",
        media_reference=otio.schema.ExternalReference(target_url=a.footage),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, FPS),
            duration=otio.opentime.RationalTime(frames(dur), FPS)))
    aclip = otio.schema.Clip(
        name="music bed",
        media_reference=otio.schema.ExternalReference(target_url=a.audio),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, FPS),
            duration=otio.opentime.RationalTime(frames(dur), FPS)))
    vt.append(vclip)
    at.append(aclip)
    tl.tracks.extend([vt, at])

    for i, b in enumerate(beats):
        vt.markers.append(otio.schema.Marker(
            name=f"beat {i+1}",
            marked_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(frames(b), FPS),
                duration=otio.opentime.RationalTime(1, FPS)),
            color=(otio.schema.MarkerColor.RED if i % 8 == 0
                   else otio.schema.MarkerColor.YELLOW)))
    otio.adapters.write_to_file(tl, a.out)
    print(f"wrote {a.out}: {len(beats)} beat markers, duration {dur:.2f}s")

if __name__ == "__main__":
    main()

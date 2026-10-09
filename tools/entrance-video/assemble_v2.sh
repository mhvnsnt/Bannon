#!/bin/bash
set -u
OUT="$HOME/workspace/bannon-video-pipe/out/STICKUP_V2"
TAKES="$OUT/takes"
CARDS="$OUT/cards"
AUDIO="$HOME/workspace/bannon-video-pipe/repo/stickup/audio/stickup_video_cut.mp3"
FPS=24
echo "=== building 16:9 ==="
ffmpeg -y -v error \
  -loop 1 -framerate $FPS -t 3 -i "$CARDS/intro_16x9.png" \
  -framerate $FPS -i "$TAKES/take1/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take2/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take3/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take4/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take5/frame_%04d.png" \
  -loop 1 -framerate $FPS -t 4 -i "$CARDS/end_16x9.png" \
  -i "$AUDIO" \
  -filter_complex "[0:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v0];[1:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v1];[2:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v2];[3:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v3];[4:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v4];[5:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v5];[6:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v6];[v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -map 7:a -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 160k \
  -t 50 -movflags +faststart "$OUT/STICKUP_V2_16x9.mp4"
echo "=== building 9:16 ==="
ffmpeg -y -v error \
  -loop 1 -framerate $FPS -t 3 -i "$CARDS/intro_16x9.png" \
  -framerate $FPS -i "$TAKES/take1/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take2/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take3/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take4/frame_%04d.png" \
  -framerate $FPS -i "$TAKES/take5/frame_%04d.png" \
  -loop 1 -framerate $FPS -t 4 -i "$CARDS/end_16x9.png" \
  -i "$AUDIO" \
  -filter_complex "[0:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v0];[1:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v1];[2:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v2];[3:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v3];[4:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v4];[5:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v5];[6:v]scale=1280:720:flags=lanczos,setsar=1,fps=$FPS[v6];[v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0,crop=405:720:437:0,scale=720:1280:flags=lanczos,format=yuv420p[v]" \
  -map "[v]" -map 7:a -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 160k \
  -t 50 -movflags +faststart "$OUT/STICKUP_V2_9x16.mp4"
echo "=== verify ==="
for f in "$OUT/STICKUP_V2_16x9.mp4" "$OUT/STICKUP_V2_9x16.mp4"; do
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  sha=$(sha1sum "$f" | cut -d' ' -f1)
  echo "$(basename $f) duration=$dur sha1=$sha"
done

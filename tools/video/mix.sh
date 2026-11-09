#!/bin/bash
# Uso: mix.sh <carpeta_video> <salida.mp4>
set -e
D="$1"; OUT="$2"
ffmpeg -y -loglevel error -i "$D/narration.wav" -i "$D/music.wav" -i "$D/sfx.wav" -filter_complex \
 "[1:a]volume=0.16[m];[0:a]asplit=2[v][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md];[2:a]volume=0.55[s];[v][md][s]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map "[a]" -ar 48000 -c:a aac -b:a 192k "$D/audio.m4a"
ffmpeg -y -loglevel error -i "$D/video_noaudio.mp4" -i "$D/audio.m4a" -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart "$OUT.tmp.mp4"
mv "$OUT.tmp.mp4" "$OUT"
echo "OK $OUT"

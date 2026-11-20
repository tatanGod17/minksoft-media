#!/bin/bash
# Prepara el entorno de video (voz Kokoro). Uso: bash setup.sh
set -e
pip install -q kokoro-onnx soundfile scipy numpy --break-system-packages 2>&1 | grep -v WARNING || true
K="${KOKORO_DIR:-$HOME/kokoro}"; mkdir -p "$K"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$K/$f" ] || curl -sSL -m 600 -o "$K/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
# Voces Piper (voz masculina por defecto: es_ES-davefx-medium, acento español, elegida por el usuario el 2026-11-20)
pip install -q piper-tts --break-system-packages 2>&1 | grep -v WARNING || true
P="${PIPER_DIR:-$HOME/tts}"; mkdir -p "$P"
for v in ${PIPER_VOICES:-es_ES-davefx-medium}; do
  [ -s "$P/vits-piper-$v/$v.onnx" ] || (curl -sSL -m 600 "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-$v.tar.bz2" | tar xj -C "$P")
done
ls -la "$K" "$P"; echo "OK setup (export KOKORO_DIR=$K PIPER_DIR=$P)"

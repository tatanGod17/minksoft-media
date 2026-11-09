#!/bin/bash
# Prepara el entorno de video (voz Kokoro). Uso: bash setup.sh
set -e
pip install -q kokoro-onnx soundfile scipy numpy --break-system-packages 2>&1 | grep -v WARNING || true
K="${KOKORO_DIR:-$HOME/kokoro}"; mkdir -p "$K"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$K/$f" ] || curl -sSL -m 600 -o "$K/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
ls -la "$K"; echo "OK setup (export KOKORO_DIR=$K)"

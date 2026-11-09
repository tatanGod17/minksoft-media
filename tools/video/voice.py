#!/usr/bin/env python3
"""Voz de MinkSoft: síntesis dirigida (frases, pausas, ritmo y tono por frase) con Kokoro + cadena de micrófono.

Marcado del texto ("say"):
  " | "  separa frases (pausa corta, 0.12 s)      " || " pausa dramática (0.38 s)
  "[r=1.1 p=+1] frase"  ritmo (multiplica la velocidad) y tono en semitonos para esa frase
  Puntuación natural: ¿?, ¡!, "..." (Kokoro la interpreta).
"""
import os, re, subprocess, tempfile
import numpy as np, soundfile as sf

SR = 24000
KDIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/kokoro"))
# Presets de voz. "minksoft" es la voz oficial cuando el usuario la apruebe.
PRESETS = {
    "A": {"base": "em_alex", "mix": {}, "speed": 1.06, "pitch": -0.6},
    "B": {"base": "em_alex", "mix": {"am_puck": 0.35}, "speed": 1.12, "pitch": -0.3},
    "C": {"base": "em_alex", "mix": {"am_onyx": 0.30}, "speed": 1.08, "pitch": 0.0},
    "dora": {"base": "ef_dora", "mix": {}, "speed": 0.98, "pitch": 0.0},
}
PRESETS["minksoft"] = PRESETS["B"]
MIC = ("highpass=f=75,equalizer=f=150:t=q:w=1:g=2,equalizer=f=350:t=q:w=1.2:g=-1.5,"
       "equalizer=f=3200:t=q:w=1.4:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,deesser=i=0.35,"
       "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,aecho=0.9:0.6:23|39:0.05|0.03")

_k = None
def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(KDIR, "kokoro-v1.0.onnx"), os.path.join(KDIR, "voices-v1.0.bin"))
    return _k

def style(cfg):
    k = kokoro()
    if isinstance(cfg, str): cfg = PRESETS[cfg]
    w0 = 1 - sum(cfg.get("mix", {}).values())
    s = w0 * k.get_voice_style(cfg["base"])
    for n, w in cfg.get("mix", {}).items(): s = s + w * k.get_voice_style(n)
    return s, cfg

def ff(x, af):
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, "i.wav"), os.path.join(d, "o.wav")
        sf.write(i, x, SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", i, "-af", af, "-ar", str(SR), "-ac", "1", o], check=True)
        y, _ = sf.read(o, dtype="float32")
    return y

def trim(s):
    a = np.abs(s); idx = np.where(a > 0.012)[0]
    return s[max(0, idx[0] - 200): idx[-1] + 600] if len(idx) else s

def parse(say):
    """Devuelve [(texto, rate, pitch, pausa_despues)]"""
    out = []
    parts = re.split(r"\s*(\|\|?)\s*", say.strip())
    i = 0
    while i < len(parts):
        seg = parts[i].strip(); sep = parts[i + 1] if i + 1 < len(parts) else ""
        i += 2
        if not seg: continue
        r, p = 1.0, 0.0
        m = re.match(r"\[([^\]]*)\]\s*(.*)", seg)
        if m:
            for kv in m.group(1).split():
                kk, vv = kv.split("=")
                if kk == "r": r = float(vv)
                if kk == "p": p = float(vv)
            seg = m.group(2)
        out.append((seg, r, p, 0.38 if sep == "||" else (0.12 if sep == "|" else 0.0)))
    return out

def synth(say, cfg="minksoft"):
    """Devuelve (audio float32, [{"text", "t", "d"}] tiempos de cada frase relativos al inicio)."""
    st, c = style(cfg)
    k = kokoro()
    audio, segs, t = [], [], 0.0
    for text, r, p, pause in parse(say):
        s, sr = k.create(text, voice=st, speed=c["speed"] * r, lang=c.get("lang", "es-419"))
        s = trim(s.astype(np.float32))
        tot = p + c.get("pitch", 0.0)
        if abs(tot) > 0.05:
            s = ff(s, f"rubberband=pitch={2 ** (tot / 12):.5f}:formant=preserved")
        segs.append({"text": text, "t": round(t, 3), "d": round(len(s) / SR, 3)})
        audio += [s, np.zeros(int(SR * pause), np.float32)]
        t += len(s) / SR + pause
    return np.concatenate(audio) if audio else np.zeros(1, np.float32), segs

def polish(x):
    y = ff(x, MIC)
    return (y / max(1e-6, np.abs(y).max()) * 0.89).astype(np.float32)

if __name__ == "__main__":
    import sys
    say, out = sys.argv[1], sys.argv[2]
    cfg = sys.argv[3] if len(sys.argv) > 3 else "minksoft"
    a, segs = synth(say, cfg); a = polish(a)
    sf.write(out, a, SR); print(out, round(len(a) / SR, 2), "s")

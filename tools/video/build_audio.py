#!/usr/bin/env python3
"""Genera narración (Kokoro TTS), timeline, música y efectos para un video de MinkSoft.

Uso: python3 build_audio.py <carpeta_video>
La carpeta debe tener video.json (ver README.md). Produce:
  timeline.json, narration.wav, music.wav, sfx.wav
Requiere: kokoro-onnx, soundfile, numpy y los archivos del modelo en $KOKORO_DIR
(kokoro-v1.0.onnx y voices-v1.0.bin).
"""
import json, os, re, sys
import numpy as np
import soundfile as sf

SR = 24000
d = sys.argv[1]
spec = json.load(open(os.path.join(d, "video.json"), encoding="utf-8"))
KDIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/kokoro"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as V
vcfg = spec.get("voice", "minksoft")
if isinstance(vcfg, str) and vcfg not in V.PRESETS:   # compatibilidad: nombre de voz Kokoro suelto
    vcfg = {"base": vcfg, "mix": {}, "speed": float(spec.get("speed", 1.0)), "pitch": 0.0}

def clean(txt):
    return re.sub(r"\[[^\]]*\]\s*", "", txt)

def seg_split(txt):
    return [x.strip() for x in re.split(r"\s*\|\|?\s*", clean(txt)) if x.strip()]

narr, scenes_out, sfx_events = [], [], []
t = 0.0
for i, sc in enumerate(spec["scenes"]):
    say = sc.get("say", "").strip()
    pre = float(sc.get("pre", 0.0 if i == 0 else 0.12))
    post = float(sc.get("post", 0.22))
    if say:
        audio, segs = V.synth(say, vcfg)
    else:
        audio, segs = np.zeros(int(SR * float(sc.get("dur", 2.0))), np.float32), []
    adur = len(audio) / SR
    dur = pre + adur + post
    if "min_dur" in sc: dur = max(dur, float(sc["min_dur"]))
    narr.append(np.zeros(int(SR * pre), np.float32)); narr.append(audio)
    narr.append(np.zeros(int(round(SR * dur)) - int(SR * pre) - len(audio), np.float32))
    t0 = t + pre
    # ---- palabras con tiempo (para subtítulos karaoke, golpes de cámara y entradas de objetos)
    cap_src = sc.get("caption", say)
    csegs = seg_split(cap_src) if cap_src else []
    if segs and len(csegs) != len(segs):           # no coinciden: un solo bloque sobre todo el habla
        csegs = [" ".join(csegs)]; segs = [{"t": segs[0]["t"], "d": segs[-1]["t"] + segs[-1]["d"] - segs[0]["t"]}]
    words = []
    for cs, sg in zip(csegs, segs):
        ws = cs.split(); tot = sum(len(w.strip("*")) + 1.5 for w in ws); c = t0 + sg["t"]
        for w in ws:
            wd = sg["d"] * (len(w.strip("*")) + 1.5) / tot
            key = w.startswith("*") or w.rstrip(".,;:?!…¿¡").endswith("*")
            words.append({"w": w.replace("*", ""), "t": round(c, 3), "d": round(wd, 3), "k": key, "seg": len(words) and 0})
            c += wd
        words[-1]["end"] = True
    # bloques de subtítulos (máx. cap_words palabras, corta en puntuación y fin de frase)
    chunks, cur = [], []
    mx = int(sc.get("cap_words", 3))
    for w in words:
        cur.append(w)
        if len(cur) >= mx or w.get("end") or re.search(r"[.,;:?!…]$", w["w"]):
            chunks.append({"t": cur[0]["t"], "d": round(cur[-1]["t"] + cur[-1]["d"] - cur[0]["t"], 3), "words": cur}); cur = []
    if cur: chunks.append({"t": cur[0]["t"], "d": round(cur[-1]["t"] + cur[-1]["d"] - cur[0]["t"], 3), "words": cur})
    show_caps = sc.get("captions", sc.get("type") != "hook" and sc.get("type") != "end")
    # golpes de cámara en palabras clave
    punch = []
    if sc.get("punch", True):
        for w in words:
            if w["k"] and (not punch or w["t"] - punch[-1] > 0.7): punch.append(w["t"])
    sfx_events += [("tick", p) for p in punch]
    # momento de entrada del objeto 3D principal
    hero_t = t0 + 0.05 if i else 0.0
    if sc.get("hero_at"):
        for w in words:
            if sc["hero_at"].lower() in w["w"].lower(): hero_t = w["t"] - 0.1; break
    # apariciones de elementos: al inicio de las últimas n frases, o repartidas
    n = int(sc.get("reveal", len(sc.get("items", sc.get("bars", [])))))
    ev = []
    if n:
        if len(segs) >= n and len(csegs) == len(segs):
            ev = [round(t0 + sg["t"] - 0.05, 3) for sg in segs[-n:]]
        else:
            span = max(adur - 0.4, 0.5); ev = [round(t0 + 0.2 + j * span / n, 3) for j in range(n)]
        sfx_events += [("pop", e) for e in ev]
    if i: sfx_events.append(("whoosh", t - 0.12))
    else: sfx_events.append(("impact", 0.0))
    if sc.get("type") == "stat": sfx_events += [("riser", t0 - 0.6), ("hit", t0 + 0.2)]
    if sc.get("type") == "type": sfx_events.append(("typing", t0 + 0.2, dur * float(sc.get("typeFrac", 0.55))))
    if sc.get("sfx"): sfx_events.append((sc["sfx"], t0))
    scenes_out.append({**sc, "start": round(t, 3), "dur": round(dur, 3), "events": ev, "punch": punch,
                       "hero_t": round(hero_t, 3), "chunks": chunks if show_caps else [], "words": words})
    t += dur

total = t
narration = V.polish(np.concatenate(narr))
sf.write(os.path.join(d, "narration.wav"), narration, SR)

# ---------- música sintetizada (sin derechos de terceros) ----------
rng = np.random.default_rng(7)
bpm = float(spec.get("bpm", 112)); beat = 60 / bpm
N = int(SR * (total + 0.5)); tt = np.arange(N) / SR
music = np.zeros(N, np.float32)
mood = spec.get("mood", "tech")  # tech | misterio | epico
prog = {"tech": [[57,60,64],[53,57,60],[48,52,55],[55,59,62]],
        "misterio": [[57,60,64],[57,60,65],[53,57,60],[52,56,59]],
        "epico": [[50,53,57],[46,50,53],[48,52,55],[45,49,52]]}[mood]
f = lambda m: 440 * 2 ** ((m - 69) / 12)
bar = beat * 4
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    # filtro de un polo (vectorizado por bloques sencillos)
    from scipy.signal import lfilter
    return lfilter([1-a], [1, -a], x).astype(np.float32)
for b in range(int(total / bar) + 2):
    ch = prog[b % 4]; s0 = int(b * bar * SR); s1 = min(N, int((b+1) * bar * SR))
    if s0 >= N: break
    seg = tt[s0:s1] - b*bar
    pad = sum(np.sign(np.sin(2*np.pi*f(m)*seg)) * 0.5 + np.sin(2*np.pi*f(m+12)*seg)*0.3 for m in ch)
    env = np.minimum(1, seg/0.4) * np.minimum(1, (bar - seg)/0.3)
    music[s0:s1] += (pad * env * 0.05).astype(np.float32)
    bass = np.sin(2*np.pi*f(ch[0]-12)*seg) * 0.22 * (np.exp(-(seg % (beat*2))*3))
    music[s0:s1] += bass.astype(np.float32)
music = lp(music, 0.85)
for kb in range(int(total / beat) + 1):
    s0 = int(kb * beat * SR)
    if s0 >= N: break
    L = min(int(0.25*SR), N - s0); x = np.arange(L)/SR
    if kb % 2 == 0 or mood == "epico":
        music[s0:s0+L] += (np.sin(2*np.pi*(45 + 90*np.exp(-x*30))*x) * np.exp(-x*12) * 0.45).astype(np.float32)
    h0 = int((kb + 0.5) * beat * SR)
    if h0 < N:
        Lh = min(int(0.05*SR), N-h0)
        music[h0:h0+Lh] += (rng.standard_normal(Lh) * np.exp(-np.arange(Lh)/SR*90) * 0.06).astype(np.float32)
fade = int(SR*1.2); music[-fade:] *= np.linspace(1, 0, fade)
music[:int(SR*0.3)] *= np.linspace(0, 1, int(SR*0.3))
music /= max(1e-6, np.abs(music).max()); music *= 0.9
sf.write(os.path.join(d, "music.wav"), music, SR)

# ---------- efectos ----------
sfx = np.zeros(N, np.float32)
def put(sig, at):
    s0 = int(at*SR); L = min(len(sig), N - s0)
    if L > 0: sfx[s0:s0+L] += sig[:L]
def whoosh():
    L = int(0.35*SR); x = np.arange(L)/SR
    n = rng.standard_normal(L).astype(np.float32)
    from scipy.signal import lfilter
    n = lfilter([0.3], [1, -0.7], n)
    return (n * np.sin(np.pi * x / 0.35) ** 2 * 0.5).astype(np.float32)
def pop():
    L = int(0.12*SR); x = np.arange(L)/SR
    return (np.sin(2*np.pi*(900 - 2500*x)*x) * np.exp(-x*40) * 0.5).astype(np.float32)
def ding():
    L = int(0.9*SR); x = np.arange(L)/SR
    return ((np.sin(2*np.pi*1318*x) + 0.5*np.sin(2*np.pi*1975*x)) * np.exp(-x*5) * 0.35).astype(np.float32)
def boom():
    L = int(0.8*SR); x = np.arange(L)/SR
    return (np.sin(2*np.pi*(40 + 60*np.exp(-x*8))*x) * np.exp(-x*4) * 0.9).astype(np.float32)
def glitch():
    L = int(0.25*SR)
    sq = np.sign(np.sin(2*np.pi*np.repeat(rng.integers(200, 1200, 10), L//10 + 1)[:L]*np.arange(L)/SR))
    return (sq * 0.15).astype(np.float32)
def whoosh_soft():
    w = whoosh(); return (w * 0.45).astype(np.float32)
def impact():
    L = int(1.1*SR); x = np.arange(L)/SR
    sub = np.sin(2*np.pi*(38 + 70*np.exp(-x*9))*x) * np.exp(-x*3.2)
    n = rng.standard_normal(L) * np.exp(-x*18) * 0.35
    from scipy.signal import lfilter
    n = lfilter([0.25], [1, -0.75], n)
    return ((sub + n) * 0.8).astype(np.float32)
def hit():
    L = int(0.5*SR); x = np.arange(L)/SR
    return (np.sin(2*np.pi*(55 + 40*np.exp(-x*15))*x) * np.exp(-x*7) * 0.6).astype(np.float32)
def tick():
    L = int(0.06*SR); x = np.arange(L)/SR
    return (np.sin(2*np.pi*2400*x) * np.exp(-x*90) * 0.22).astype(np.float32)
def riser():
    L = int(0.6*SR); x = np.arange(L)/SR
    from scipy.signal import lfilter
    n = lfilter([0.2], [1, -0.6], rng.standard_normal(L))
    tone = np.sin(2*np.pi*(300*x + 900*x*x))
    return ((n*0.5 + tone*0.15) * (x/0.6)**2 * 0.5).astype(np.float32)
def typing(dur):
    L = int(dur*SR); out = np.zeros(L, np.float32); c = 0.0
    while c < dur - 0.05:
        s0 = int(c*SR); Lc = int(0.02*SR); x = np.arange(Lc)/SR
        out[s0:s0+Lc] += (rng.standard_normal(Lc) * np.exp(-x*300) * 0.18).astype(np.float32)[:max(0, L-s0)]
        c += 0.06 + rng.random()*0.07
    return out
lib = {"whoosh": whoosh_soft, "pop": pop, "ding": ding, "boom": boom, "glitch": glitch, "impact": impact, "hit": hit, "tick": tick, "riser": riser}
for ev_ in sfx_events:
    name, at = ev_[0], max(0.0, ev_[1])
    if name == "typing": put(typing(ev_[2]), at)
    elif name in lib: put(lib[name](), at)
sf.write(os.path.join(d, "sfx.wav"), sfx, SR)

json.dump({"total": round(total, 3), "fps": 30, "scenes": scenes_out,
           "meta": {k2: v for k2, v in spec.items() if k2 != "scenes"}},
          open(os.path.join(d, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"OK duración total {total:.2f}s, escenas {len(scenes_out)}")

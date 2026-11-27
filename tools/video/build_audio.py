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

voice = spec.get("voice", "piper:es_ES-davefx-medium")
speed = float(spec.get("speed", 1.0))

def _eleven(voice_ref):
    """Devuelve _raw(text) con ElevenLabs, o None si no hay clave/acceso (se usa la voz de respaldo)."""
    import urllib.request, urllib.parse
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        print("AVISO: falta ELEVENLABS_API_KEY; uso la voz de respaldo", file=sys.stderr); return None
    H = {"xi-api-key": key, "Content-Type": "application/json"}
    def get(url):
        return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60))
    try:
        vid = voice_ref
        if not re.fullmatch(r"[A-Za-z0-9]{20}", voice_ref):  # nombre -> id (biblioteca propia, luego biblioteca pública)
            norm = lambda x: re.sub(r"\s+", " ", x).strip().lower()
            mine = [v for v in get("https://api.elevenlabs.io/v1/voices").get("voices", []) if norm(v["name"]).startswith(norm(voice_ref))]
            if mine: vid = mine[0]["voice_id"]
            else:
                q = urllib.parse.quote(voice_ref)
                sh = [v for v in get(f"https://api.elevenlabs.io/v1/shared-voices?search={q}&page_size=20").get("voices", []) if norm(v["name"]).startswith(norm(voice_ref))]
                if not sh: raise RuntimeError(f"voz '{voice_ref}' no encontrada en ElevenLabs")
                v = sh[0]; vid = v["voice_id"]
                try:  # agregarla a la biblioteca propia (necesario para usarla por API)
                    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/voices/add/{v['public_owner_id']}/{vid}", data=json.dumps({"new_name": v["name"]}).encode(), headers=H, method="POST")
                    vid = json.load(urllib.request.urlopen(req, timeout=60)).get("voice_id", vid)
                except Exception as e: print("AVISO al agregar la voz:", e, file=sys.stderr)
        model = spec.get("eleven_model", "eleven_multilingual_v2")
        vs = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True, "speed": speed}
        def _raw(text):
            body = json.dumps({"text": text, "model_id": model, "language_code": "es", "voice_settings": vs}).encode()
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=pcm_24000", data=body, headers=H, method="POST")
            pcm = urllib.request.urlopen(req, timeout=120).read()
            return (np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0), SR
        _raw("Hola.")  # prueba de acceso
        print(f"Voz ElevenLabs: {voice_ref} ({vid})", file=sys.stderr)
        return _raw
    except Exception as e:
        print(f"AVISO: ElevenLabs no disponible ({e}); uso la voz de respaldo", file=sys.stderr); return None

USED_VOICE = voice
if voice.startswith("eleven:"):
    _r = _eleven(voice.split(":", 1)[1])
    if _r: _raw = _r
    else:
        voice = spec.get("voice_fallback", "piper:es_ES-davefx-medium"); USED_VOICE = voice + " (respaldo)"

if voice.startswith("eleven:"):
    pass
elif voice.startswith("piper:"):
    # Voces Piper (p. ej. "piper:es_ES-davefx-medium"); modelos en $PIPER_DIR/vits-piper-<nombre>/
    from piper import PiperVoice, SynthesisConfig
    PDIR = os.environ.get("PIPER_DIR", os.path.expanduser("~/tts"))
    pname = voice.split(":", 1)[1]
    pv = PiperVoice.load(os.path.join(PDIR, "vits-piper-" + pname, pname + ".onnx"))
    pcfg = SynthesisConfig(length_scale=1.0 / speed, speaker_id=spec.get("speaker_id"))
    def _raw(text):
        ch = list(pv.synthesize(text, syn_config=pcfg))
        s = np.concatenate([c.audio_float_array for c in ch])
        sr = ch[0].sample_rate
        if sr != SR:  # remuestreo lineal a 24 kHz
            x = np.arange(0, len(s) * SR / sr) * sr / SR
            s = np.interp(x, np.arange(len(s)), s)
        return s.astype(np.float32), SR
else:
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(KDIR, "kokoro-v1.0.onnx"), os.path.join(KDIR, "voices-v1.0.bin"))
    def _raw(text):
        return k.create(text, voice=voice, speed=speed, lang="es")

def tts(text):
    s, sr = _raw(text)
    assert sr == SR
    # recorta silencios de los extremos
    a = np.abs(s); idx = np.where(a > 0.01)[0]
    if len(idx): s = s[max(0, idx[0]-240): idx[-1]+480]
    return s.astype(np.float32)

def chunks(text, maxw=4):
    """Parte el texto a mostrar en subtítulos de 2-4 palabras respetando puntuación."""
    words = text.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= maxw or re.search(r"[.,;:?!…]$", w):
            out.append(" ".join(cur)); cur = []
    if cur: out.append(" ".join(cur))
    return out

narr, scenes_out, sfx_events = [], [], []
t = 0.0
for i, sc in enumerate(spec["scenes"]):
    say = sc.get("say", "").strip()
    pre = float(sc.get("pre", 0.15 if i else 0.05))   # pausa antes de hablar
    post = float(sc.get("post", 0.30))                 # pausa después
    audio = tts(say) if say else np.zeros(int(SR*float(sc.get("dur", 2.0))), np.float32)
    adur = len(audio)/SR
    dur = pre + adur + post
    if "min_dur" in sc: dur = max(dur, float(sc["min_dur"]))
    narr.append(np.zeros(int(SR*pre), np.float32)); narr.append(audio)
    narr.append(np.zeros(int(round(SR*dur)) - int(SR*pre) - len(audio), np.float32))
    # subtítulos: reparto proporcional a caracteres dentro del audio
    caps = []
    cap_src = sc.get("caption", say)
    if cap_src and sc.get("captions", True):
        parts = chunks(cap_src, int(sc.get("cap_words", 4)))
        total = sum(len(p) + 3 for p in parts)
        c0 = t + pre
        for p in parts:
            cd = adur * (len(p) + 3) / total
            caps.append({"t": round(c0, 3), "d": round(cd, 3), "text": p}); c0 += cd
    # eventos (apariciones de elementos): repartidos dentro del habla
    n = int(sc.get("reveal", len(sc.get("items", sc.get("bars", [])))))
    ev = []
    if n:
        span = max(adur - 0.4, 0.5)
        for j in range(n):
            ev.append(round(t + pre + 0.25 + j * span / n, 3))
        sfx_events += [("pop", e) for e in ev]
    if i: sfx_events.append(("whoosh", t))
    if sc.get("sfx"): sfx_events.append((sc["sfx"], t + pre))
    scenes_out.append({**sc, "start": round(t, 3), "dur": round(dur, 3), "events": ev, "caps": caps})
    t += dur

total = t
narration = np.concatenate(narr)
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
lib = {"whoosh": whoosh, "pop": pop, "ding": ding, "boom": boom, "glitch": glitch}
for name, at in sfx_events:
    if name in lib: put(lib[name](), at)
sf.write(os.path.join(d, "sfx.wav"), sfx, SR)

json.dump({"total": round(total, 3), "fps": 30, "scenes": scenes_out,
           "meta": {k2: v for k2, v in spec.items() if k2 != "scenes"}},
          open(os.path.join(d, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"OK duración total {total:.2f}s, escenas {len(scenes_out)}, voz {USED_VOICE}")

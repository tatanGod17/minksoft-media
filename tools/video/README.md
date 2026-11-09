# Videos MinkSoft (Reels / TikTok / Shorts)

Pipeline 100 % en la nube: guion → voz (Kokoro TTS, local) → animación HTML (Playwright) → mezcla (ffmpeg).
Resultado: MP4 1080x1920, 30 fps, H.264 + AAC, ~-14 LUFS. Música y efectos sintetizados (sin derechos de terceros).

## Uso
```bash
bash tools/video/setup.sh                       # una vez por sesión (~1 min)
export KOKORO_DIR=$HOME/kokoro
mkdir -p ~/v1 && $EDITOR ~/v1/video.json        # guion (ver formato)
python3 tools/video/build_audio.py ~/v1          # voz, timeline, música, efectos
node tools/video/render.js ~/v1 --frames 1,5,9   # PNG de prueba: REVISARLOS antes del render completo
node tools/video/render.js ~/v1                  # video sin audio (~2.5 s de render por s de video)
bash tools/video/mix.sh ~/v1 ~/v1/final.mp4      # mezcla y MP4 final
```

## video.json
```json
{"voice":"ef_dora","speed":0.98,"bg":"map","focus":"bogota","floats":[],"mood":"tech|misterio|epico","bpm":112,"tag":"Dato curioso",
 "css":"(opcional, CSS extra)",
 "scenes":[{"type":"hook","emoji":"🤯","text":"Texto con *dorado* y _celeste_","say":"Lo que dice la voz","caption":"(opcional) subtítulo escrito si say usa pronunciación fonética","sfx":"boom|ding|glitch"}]}
```
Voz por defecto: `ef_dora` a 0.98 (suave y pausada, aprobada por el usuario). Alternativas: `em_alex`, `em_santa`.
Escribe `say` como se pronuncia ("punto com", "Mink Soft", "inteligencia artificial", números en palabras si son raros) y pon `caption` con la forma escrita.

Campos comunes de escena: `say`, `caption`, `captions:false`, `cap_words`, `pre`, `post`, `min_dur`, `sfx`, `emoji`, `hero`, `bg`, `floats`, `onseek` (JS: `el, lt, sc`).

### Fondos e imágenes (obligatorio: nunca dejar solo el plano azul)
- `bg` (por escena o global): `map` (mapa mundial con conexiones; `focus`: bogota, ny, sf, madrid, london, tokio, saopaulo, cdmx, sydney, dubai, lagos, mumbai), `city` (ciudad de noche), `servers` (centro de datos), `circuit` (circuito con pulsos), `code` (código en movimiento), `retro` (estética años 80), o `img:archivo.jpg` (foto propia copiada a la carpeta del video). Cambia de fondo entre escenas; hacen fundido automático.
- `hero`: imagen 3D grande sobre el texto (reemplaza a `emoji`).
- `floats`: hasta 4 íconos 3D flotando en las esquinas.
- Íconos 3D: Microsoft Fluent Emoji (licencia MIT), nombre en snake_case de la carpeta de github.com/microsoft/fluentui-emoji/tree/main/assets (p. ej. `desktop_computer`, `floppy_disk`, `globe_with_meridians`, `robot`, `rocket`, `money_bag`, `shopping_cart`, `credit_card`, `mobile_phone`, `laptop`, `locked`, `satellite_antenna`, `light_bulb`, `chart_increasing`, `package`, `brain`, `gear`, `cloud`, `magnifying_glass_tilted_left`, `warning`). render.js los descarga; si un nombre no existe, falla y lo dice. Nada de íconos de personas.
- Internet: desde la nube solo hay acceso a GitHub y npm, no a bancos de fotos; si el usuario sube fotos, úsalas con `bg: "img:..."`.

| type | campos |
|---|---|
| hook | text, emoji — palabras aparecen una a una |
| statement / emoji | text, sub, emoji |
| stat | value, prefix, suffix, decimals, label, sub, group, count (años: sin conteo ni separador) |
| bullets | title, items:[{icon, text}] — aparecen con la voz |
| compare | title, left:{title, items[]}, right:{title, items[]} |
| timeline | title, items:[{year, text}] |
| chart | title, bars:[{label, value, display, gold}], sub |
| type | style: search\|terminal, text, sub, typeFrac |
| notif | title, items:[{app, icon, text}] — teléfono con notificaciones |
| end | text, sub — logo + minksoft.co |
| custom | html (usa `var(--p)` progreso 0-1 y `var(--t)` segundos) |

Zona segura: contenido entre y≈270 y 1310; subtítulos en y≈1350; abajo queda libre para la interfaz de Reels.

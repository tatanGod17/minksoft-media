# Videos MinkSoft (Reels / TikTok / Shorts)

Pipeline 100 % en la nube: guion → voz (Kokoro TTS, local) → animación HTML (Playwright) → mezcla (ffmpeg).
Resultado: MP4 1080x1920, 30 fps, H.264 High 4.2 (CRF 14, preset slow, BT.709, hasta 20 Mbps) + AAC 192k 48 kHz, ~-14 LUFS. Calidad alta para que Instagram/TikTok no la degraden. Música y efectos sintetizados (sin derechos de terceros).

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
{"voice":"piper:es_ES-davefx-medium","speed":1.0,"bg":"map","focus":"bogota","floats":[],"mood":"tech|misterio|epico","bpm":112,"tag":"Dato curioso",
 "css":"(opcional, CSS extra)",
 "scenes":[{"type":"hook","emoji":"🤯","text":"Texto con *dorado* y _celeste_","say":"Lo que dice la voz","caption":"(opcional) subtítulo escrito si say usa pronunciación fonética","sfx":"boom|ding|glitch"}]}
```
**Voz por defecto (desde 2026-11-26, elegida por el usuario): ElevenLabs «Alberto Rodríguez»** → `"voice":"eleven:Alberto Rodríguez","voice_fallback":"piper:es_ES-davefx-medium"`. Necesita la variable `ELEVENLABS_API_KEY` y acceso de red a `api.elevenlabs.io`; build_audio.py busca la voz por nombre (biblioteca propia y luego pública, y la agrega a la cuenta) o acepta su `voice_id`. Si falta la clave o la red, usa automáticamente `voice_fallback` y lo dice al final (`voz ... (respaldo)`): en ese caso avísale al usuario. Con ElevenLabs se pueden escribir nombres en inglés tal cual (Nvidia, Bluetooth), aunque conviene oír el resultado.
Respaldo y voz anterior (2026-11-20): `"voice":"piper:es_ES-davefx-medium"`, `"speed":1.0` — masculina, acento español (Piper, se instala con setup.sh).
Otras: `piper:es_MX-ald-medium` (México), Kokoro `ef_dora` (femenina, la anterior), `em_alex`, `em_santa`. Con Piper conviene escribir en `say` los anglicismos como se pronuncian: "Blútuz", "Áutluk", "Tims", "Radio Uáier", "inteligencia artificial" en vez de "IA".
Escribe `say` como se pronuncia ("punto com", "Mink Soft", "inteligencia artificial", números en palabras si son raros) y pon `caption` con la forma escrita.

Campos comunes de escena: `say`, `caption`, `captions:false`, `cap_words`, `pre`, `post`, `min_dur`, `sfx`, `emoji`, `hero`, `bg`, `floats`, `onseek` (JS: `el, lt, sc`).

### Escenarios ilustrados (desde 2026-11-26, pedido del usuario: PRIORIDAD)
El usuario no quiere más el fondo azul cuadriculado: **cada escena debe ir sobre un escenario ilustrado** que muestre el lugar o la situación de la que se habla (como un decorado), con la paleta de la marca y animación propia. Están en `scenes.js` (SVG vectorial, sin internet) y se usan con `"bg":"<nombre>"`:

| bg | escenario | úsalo para |
|---|---|---|
| `vikingo` | fiordo con montañas nevadas, aurora, nieve cayendo y un barco vikingo con su vikingo | historia antigua, nombres de origen nórdico (Bluetooth), exploración |
| `montanas` | montañas nevadas, pinos, cabaña con humo, aurora y nieve | invierno, naturaleza, lugares remotos, "aislado" |
| `oficina` | oficina de noche: ventana con ciudad, reloj, CRT con código, lámpara, café | trabajo, empresas, productividad, años 2000 |
| `casa` | sala de noche: sofá, lámpara, router wifi con luces, laptop | internet en casa, consumidores, compras desde el sofá |
| `tienda[:TEXTO]` | fachada de tienda con toldo, vitrina con productos y letrero de neón (TEXTO, p. ej. `tienda:CYBER MONDAY`) | e-commerce, ofertas, comercio |
| `bodega` | centro logístico: estanterías, banda transportadora con cajas, dron de reparto | envíos, inventario, logística, Amazon |
| `espacio` | la Tierra girando, satélite en órbita, Luna, estrellas fugaces | satélites, internet global, futuro, escala mundial |
| `oceano` | fondo del mar: cable submarino con pulsos de datos, peces, ballena, burbujas | cables de internet, curiosidades del océano |
| `boveda` | bóveda de seguridad con rueda que gira, teclado y láseres | ciberseguridad, contraseñas, bancos, protección |
| `garaje` | garaje al atardecer (palmera, casas), banco de trabajo con computador antiguo, bombillo | origen de empresas (Apple, Google, Amazon, HP), emprendimiento |
| `cielo` | cielo de día con nubes en movimiento, sol, avión y pájaros | "la nube", viajes, aviones, optimismo |

Reglas: cambia de escenario entre escenas (fundido automático) y elige el que mejor represente lo que dice esa escena; con un escenario activo la cuadrícula y los puntos se ocultan solos. Los fondos genéricos de abajo quedan como complemento (máximo 1-2 escenas por video). Si el tema necesita un lugar que no existe (p. ej. un desierto, un estadio, una fábrica), **agrégalo a `scenes.js`** siguiendo el mismo patrón (función que devuelve `{svg, upd(Q, lt, t)}` y entrada en `LIST`) y documéntalo en esta tabla. Con escenario, usa como máximo 2 `floats` para no recargar. Los textos ya traen sombra y recuadro oscuro para leerse sobre el escenario. Probar todos: `bg` de cada escena en un video de prueba y `render.js --frames`.

### Personajes ilustrados (desde 2026-11-26, pedido del usuario)
`characters.js` dibuja personas, oficios y animales en el mismo estilo plano (SVG, paleta de la marca), con parpadeo y animaciones. Sirven para contar historias: un rey, una persona morena, un astronauta con o sin casco, un escarabajo, etc. Si el video habla de una persona concreta (p. ej. el CEO de una empresa), el usuario quiere que aparezca como personaje ilustrado (pedido del 2026-11-26): dale rasgos generales reconocibles (ropa típica, color de pelo, tono de piel) en el mismo estilo plano, con respeto y sin burla; nunca fotos. A las personas privadas involucradas en una noticia (no figuras públicas) muéstralas de forma anónima (p. ej. `espia` con gafas oscuras) y sin nombre. Ejemplo: video de Nvidia 2026-11-26 (`ceo` + `espia`).

Dos formas de usarlos en una escena:
- **Protagonista grande** sobre el texto (reemplaza al ícono 3D): `"hero":{"p":"astronauta","casco":false,"piel":"morena","pose":"saludar"}` o corto `"hero":"char:rey"`. Con personaje como hero, usa textos cortos (1-2 líneas).
- **Dentro de la escena** (encima del escenario, detrás del texto): `"chars":[{"p":"rey","x":230,"y":1330,"escala":0.6,"anim":"caminar","vel":90}, {"p":"escarabajo","x":850,"y":1300}]`. `x,y` = posición de los pies en el lienzo 1080x1920; `escala` ≈ 0.4-0.7 para personas (0.6 ≈ 450 px de alto) y 0.5-1 para animales; `voltear:true` lo mira al otro lado. Ubícalos donde no tapen el texto (laterales bajos, junto a un escenario o en escenas con poco texto) y revísalo en los fotogramas.

Opciones de personas:
- `p` (preset): `persona`, `mujer`, `ceo` (chaqueta de cuero negra), `espia` (gabardina, sombrero y gafas oscuras), `rey`, `reina`, `astronauta`, `vikingo`, `chef`, `doctor`, `cientifico`, `programador`, `hacker`, `ejecutivo`, `obrero`, `repartidor`, `estudiante`, `pirata`, `detective`.
- `piel`: `clara`, `media`, `trigueña`, `morena`, `oscura` (o un color #hex). `figura`: `hombre`/`mujer`.
- `pelo`: `corto`, `largo`, `rizado`, `afro`, `coleta`, `moño`, `calvo`; `color_pelo`: `negro`, `castaño`, `rubio`, `pelirrojo`, `canoso`, `blanco` (o #hex). `barba`: `corta`, `larga`, `bigote`, `no`.
- Ropa: `camisa`, `pantalon`, `zapatos` (#hex), `inferior`: `pantalon`/`falda`/`vestido`, `manga`: `corta`/`larga`; extras: `gafas` (`normal`/`proteccion`/`sol`), `sombrero` (`vikingo`, `chef`, `casco_obra`, `gorra`, `pirata`, `detective`), `corona` (`rey`/`reina`), `capa` (#hex), `bata`, `saco`, `corbata`, `chaqueta` (#hex, chaqueta abierta tipo cuero), `chaleco`, `panuelo` (#hex), `mochila`, `audifonos`, `capucha` (`atras`/`puesta`), `parche`.
- Astronauta: `casco:true|false`, `visor:true` (visor dorado que tapa la cara). Sin casco puede llevarlo en la mano: `"objeto":"casco"`.
- `pose`: `normal`, `saludar`, `señalar`, `celebrar`, `pensar`, `sostener`, `mostrar`. `expresion`: `feliz`, `sorpresa`, `serio`, `hablar` (boca animada). `anim`: `respirar` (por defecto), `caminar` (+`vel` px/s), `saltar`, `flotar` (astronautas), `hablar`.
- `objeto` en la mano: `cetro`, `laptop`, `caja`, `telefono`, `libro`, `lupa`, `escudo`, `cuchara`, `matraz`, `bandera`, `taza`, `catalejo`, `casco`, `tarjeta`, `corazon`, `ninguno`.

Animales y criaturas (`p`): `escarabajo` (`color` para variar; `dorado` = escarabajo egipcio), `hormiga`, `abeja`, `mariposa`, `perro`, `gato`, `pajaro` (`anim:"volar"`), `robot` (`pose:"saludar"`), `pinguino`. Miran a la derecha; `voltear:true` los gira.

Si hace falta un personaje que no existe (p. ej. un dinosaurio, un faraón, un médico con tapabocas), **agrégalo a `characters.js`**: un preset nuevo en `PRESETS` (combinando las piezas existentes) o una criatura nueva en `bicho()`, y documéntalo aquí. Para revisar: escena `custom` con varios `chars` y `render.js --frames`.

### Personajes en imágenes fijas (posts de Instagram)
`node tools/video/snap.js pagina.html salida.png 1080 1350` renderiza un HTML propio con `characters.js` y `scenes.js` ya cargados y los logos de `assets/` copiados junto a la página. Ejemplo dentro de la página (después de crear un `<svg id="scene" viewBox="0 0 1080 420">`):
```js
const r = PERSONAJES.build({p:'repartidor', piel:'morena', pose:'sostener'}); // pies en (0,0), ~760 de alto
const g = document.createElementNS('http://www.w3.org/2000/svg','g');
g.setAttribute('transform','translate(300,415) scale(0.46)'); g.innerHTML = r.svg; scene.appendChild(g);
const c = {}; r.upd(s => c[s] || (c[s] = [...g.querySelectorAll(s)]), 0.6, 0.6); // pose final
```
o `PERSONAJES.heroSvg(spec, ancho, alto).el` para un `<svg>` listo para insertar. Referencia aprobada por el usuario (2026-11-26): post «El primer mensaje de internet fue… «LO»» con dos personajes junto a computadores antiguos.

### Fondos genéricos e imágenes
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

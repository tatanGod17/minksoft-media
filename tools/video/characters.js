// Personajes ilustrados (SVG plano, paleta MinkSoft) para los videos.
// PERSONAJES.build(spec) -> {svg, upd(Q, lt, t), box:[x,y,w,h]}  (coordenadas locales: pies en (0,0), hacia arriba y negativo)
// spec: {p:"rey"|"astronauta"|"persona"|"escarabajo"|..., piel, pelo, color_pelo, barba, camisa, pantalon, inferior, pose, anim,
//        expresion, objeto, casco, visor, figura, color, voltear}
(function () {
  const C = { navy: '#101943', navy2: '#1B2A6B', cel: '#A9C8FF', oro: '#E8B03A' };
  const f = n => (+n).toFixed(1);
  const PIEL = { clara: '#f6d2b8', blanca: '#f6d2b8', media: '#e0ac83', 'trigueña': '#c98e62', triguena: '#c98e62', morena: '#8d5a3b', moreno: '#8d5a3b', oscura: '#5c3a26', negra: '#5c3a26' };
  const PELO = { negro: '#1f1a17', castano: '#5a3a22', 'castaño': '#5a3a22', rubio: '#e0b45a', pelirrojo: '#b5532a', canoso: '#c9ccd6', blanco: '#eef0f6', azul: '#5b7fd6', dorado: C.oro };
  const col = (v, map, d) => !v ? d : (map[v] || v);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); const c = x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'); return '#' + c(r) + c(g) + c(b) };
  let uid = 0;

  // ---------- presets de personas ----------
  const PRESETS = {
    persona: { camisa: '#3a4fb0', pantalon: '#1b2a6b', zapatos: '#101943', manga: 'corta', pelo: 'corto' },
    mujer: { figura: 'mujer', camisa: C.oro, pantalon: '#1b2a6b', zapatos: '#101943', manga: 'corta', pelo: 'largo', inferior: 'falda' },
    rey: { camisa: '#7a1f2b', pantalon: '#4a1520', zapatos: '#3a2a1e', capa: '#b3262e', armiño: true, corona: 'rey', barba: 'corta', objeto: 'cetro', cinturon: C.oro, pelo: 'corto', color_pelo: 'castano' },
    reina: { figura: 'mujer', camisa: '#5b3fa0', pantalon: '#5b3fa0', zapatos: '#3a2a1e', capa: '#b3262e', armiño: true, corona: 'reina', inferior: 'vestido', pelo: 'largo', color_pelo: 'castano', objeto: 'cetro', cinturon: C.oro },
    astronauta: { traje: 'astronauta', camisa: '#eef2fb', pantalon: '#eef2fb', zapatos: '#9aa7c7', casco: true, pelo: 'corto' },
    vikingo: { camisa: '#8b2f2a', pantalon: '#5a3a1e', zapatos: '#3a2a1e', capa: '#5a3a1e', sombrero: 'vikingo', barba: 'larga', color_pelo: 'pelirrojo', pelo: 'largo', cinturon: '#3a2a1e', objeto: 'escudo' },
    chef: { camisa: '#f4f6fb', pantalon: '#1f1a17', zapatos: '#101943', sombrero: 'chef', panuelo: '#d9433b', delantal: '#e6eaf5', pelo: 'corto', objeto: 'cuchara' },
    doctor: { camisa: C.cel, pantalon: '#1b2a6b', zapatos: '#101943', bata: true, estetoscopio: true, pelo: 'corto' },
    cientifico: { camisa: '#3a4fb0', pantalon: '#1b2a6b', zapatos: '#101943', bata: true, gafas: 'proteccion', pelo: 'rizado', objeto: 'matraz' },
    programador: { camisa: '#2d3f95', pantalon: '#101943', zapatos: '#f4f6fb', capucha: 'atras', audifonos: true, pelo: 'corto', objeto: 'laptop' },
    hacker: { camisa: '#1a1f3a', pantalon: '#101943', zapatos: '#101943', capucha: 'puesta', pelo: 'corto', objeto: 'laptop', expresion: 'serio' },
    ejecutivo: { camisa: '#1b2a6b', pantalon: '#1b2a6b', zapatos: '#101943', saco: true, corbata: C.oro, pelo: 'corto', objeto: 'telefono' },
    obrero: { camisa: '#3a4fb0', pantalon: '#24317a', zapatos: '#3a2a1e', sombrero: 'casco_obra', chaleco: '#f08a24', pelo: 'corto' },
    repartidor: { camisa: C.oro, pantalon: '#1b2a6b', zapatos: '#101943', manga: 'corta', sombrero: 'gorra', pelo: 'corto', objeto: 'caja' },
    estudiante: { camisa: '#5b7fd6', pantalon: '#1b2a6b', zapatos: '#f4f6fb', mochila: '#d9433b', pelo: 'corto', objeto: 'libro', manga: 'corta' },
    pirata: { camisa: '#f4f1e8', pantalon: '#1f1a17', zapatos: '#3a2a1e', sombrero: 'pirata', parche: true, barba: 'corta', color_pelo: 'negro', cinturon: '#d9433b', pelo: 'largo', objeto: 'catalejo' },
    ceo: { camisa: '#1a1a1f', pantalon: '#22242e', zapatos: '#101010', chaqueta: '#202027', pelo: 'corto', color_pelo: '#5b5d66', piel: 'media' },
    espia: { figura: 'mujer', camisa: '#2b2f45', pantalon: '#2b2f45', zapatos: '#101010', gabardina: '#6a7396', panuelo: '#d9433b', sombrero: 'detective', gafas: 'sol', pelo: 'largo', color_pelo: 'negro', expresion: 'serio' },
    detective: { camisa: '#a07850', pantalon: '#5a3a22', zapatos: '#3a2a1e', gabardina: '#a07850', sombrero: 'detective', pelo: 'corto', objeto: 'lupa' },
  };
  const POSES = { // [ángulo brazo izq, codo izq, ángulo brazo der, codo der]
    normal: [12, 0, -12, 0], saludar: [12, 0, -150, -15], señalar: [12, 0, -88, 0], senalar: [12, 0, -88, 0],
    celebrar: [150, 15, -150, -15], pensar: [12, 0, 25, 160], sostener: [18, -40, -18, 40], mostrar: [12, 0, -60, -50],
  };

  // ---------- objetos en la mano (orientación del mundo, centrados en la mano) ----------
  const ITEMS = {
    cetro: `<rect x="-6" y="-170" width="12" height="230" rx="6" fill="${C.oro}"/><circle cy="-180" r="22" fill="${C.oro}"/><circle cy="-180" r="10" fill="#d9433b"/>`,
    laptop: `<g transform="translate(-10,10)"><rect x="-80" y="-10" width="160" height="16" rx="4" fill="#c9d1e8"/><path d="M-70,-10 L-60,-110 L60,-110 L70,-10Z" fill="#d8deef"/><path d="M-58,-18 L-50,-100 L50,-100 L58,-18Z" fill="#06122e"/><circle cx="0" cy="-60" r="9" fill="${C.oro}"/></g>`,
    caja: `<g transform="translate(-20,-30)"><rect x="-70" y="-60" width="140" height="110" fill="#c98a4b"/><rect x="-12" y="-60" width="24" height="110" fill="#e8c48a"/><rect x="-55" y="-10" width="45" height="26" fill="#f4f1e8"/></g>`,
    telefono: `<rect x="-22" y="-60" width="44" height="80" rx="8" fill="#101943"/><rect x="-17" y="-53" width="34" height="62" rx="4" fill="${C.cel}"/>`,
    libro: `<rect x="-40" y="-60" width="80" height="100" rx="6" fill="#d9433b"/><rect x="-32" y="-52" width="64" height="84" fill="#f4f1e8"/><rect x="-24" y="-40" width="48" height="8" fill="#9aa7c7"/>`,
    lupa: `<line x1="0" y1="0" x2="40" y2="-60" stroke="#3a2a1e" stroke-width="12" stroke-linecap="round"/><circle cx="62" cy="-92" r="40" fill="${C.cel}" fill-opacity=".35" stroke="#5a6290" stroke-width="10"/>`,
    escudo: `<circle r="70" fill="#8a5a2b" stroke="#4a2f18" stroke-width="10"/><circle r="18" fill="#9aa7c7"/><path d="M0,-70 L0,70 M-70,0 L70,0" stroke="#4a2f18" stroke-width="6"/>`,
    cuchara: `<rect x="-5" y="-130" width="10" height="150" rx="5" fill="#9aa7c7"/><ellipse cy="-145" rx="22" ry="30" fill="#c9d1e8"/>`,
    matraz: `<path d="M-12,-90 L12,-90 L12,-50 L45,10 Q50,25 35,25 L-35,25 Q-50,25 -45,10 L-12,-50Z" fill="#e6eeff" fill-opacity=".7" stroke="#c9d1e8" stroke-width="5"/><path d="M-30,0 L30,0 L40,16 Q42,22 34,22 L-34,22 Q-42,22 -40,16Z" fill="#7CFFB2"/>`,
    bandera: `<rect x="-5" y="-220" width="10" height="250" fill="#c9d1e8"/><path d="M5,-215 L120,-185 L5,-150Z" fill="${C.oro}"/>`,
    taza: `<rect x="-26" y="-50" width="52" height="60" rx="8" fill="${C.oro}"/><path d="M26,-38 q20,0 20,18 q0,18 -20,18" stroke="${C.oro}" stroke-width="8" fill="none"/>`,
    catalejo: `<rect x="-90" y="-16" width="110" height="32" rx="8" fill="#8a5a2b" transform="rotate(-20)"/><rect x="10" y="-12" width="50" height="24" rx="6" fill="${C.oro}" transform="rotate(-20)"/>`,
    casco: `<g transform="translate(0,-40)"><circle r="68" fill="#eef2fb" stroke="#c9d1e8" stroke-width="8"/><path d="M-50,-10 A52,46 0 0 1 50,-10 L50,20 A52,30 0 0 1 -50,20Z" fill="${C.oro}" opacity=".85"/></g>`,
    tarjeta: `<rect x="-50" y="-34" width="100" height="64" rx="10" fill="${C.oro}"/><rect x="-50" y="-18" width="100" height="12" fill="#101943"/>`,
    corazon: `<path d="M0,20 C-60,-20 -40,-70 0,-45 C40,-70 60,-20 0,20Z" fill="#d9433b"/>`,
  };

  function persona(s) {
    const id = 'pj' + (uid++);
    const P = Object.assign({}, PRESETS[s.p] || PRESETS.persona, s);
    const mujer = P.figura === 'mujer';
    const skin = col(P.piel, PIEL, '#e0ac83'), skinD = shade(skin, 0.82);
    const hair = col(P.color_pelo, PELO, P.p === 'astronauta' ? '#5a3a22' : '#1f1a17');
    const shirt = P.camisa, pants = P.pantalon, shoes = P.zapatos || '#101943';
    const longSleeve = P.manga !== 'corta';
    const pose = POSES[P.pose] || POSES.normal;
    const astro = P.traje === 'astronauta';
    const helmet = astro && P.casco !== false && P.casco !== 'no';
    let back = '', body = '', front = '', top = '';
    // detrás del cuerpo
    if (P.capa) back += `<path d="M-95,-540 Q-170,-250 -150,-20 L150,-20 Q170,-250 95,-540Z" fill="${P.capa}"/>` + (P['armiño'] ? `<path d="M-150,-20 L150,-20 L152,-50 L-152,-50Z" fill="#f4f1e8"/>` : '');
    if (P.gabardina) back += `<path d="M-100,-540 L-130,-120 L130,-120 L100,-540Z" fill="${shade(P.gabardina, 0.85)}"/>`;
    if (astro) back += `<rect x="-115" y="-560" width="230" height="230" rx="30" fill="#c9d1e8"/><rect x="-100" y="-545" width="40" height="60" rx="8" fill="${C.cel}"/>`;
    if (P.mochila) back += `<rect x="-105" y="-540" width="210" height="230" rx="40" fill="${P.mochila}"/>`;
    const pelo = P.pelo;
    if (pelo === 'largo') back += `<path d="M-88,-660 Q-100,-500 -70,-470 L70,-470 Q100,-500 88,-660Z" fill="${hair}"/>`;
    if (pelo === 'afro') back += `<circle cx="0" cy="-668" r="122" fill="${hair}"/>`;
    if (pelo === 'coleta') back += `<ellipse cx="-95" cy="-610" rx="30" ry="70" fill="${hair}" transform="rotate(20 -95 -610)"/>`;
    if (P.capucha === 'puesta') back += `<path d="M-108,-650 Q-110,-770 0,-772 Q110,-770 108,-650 L112,-540 L-112,-540Z" fill="${shade(shirt, 0.8)}"/>`;
    // piernas / falda / vestido
    if (P.inferior === 'vestido') {
      body += `<path d="M-80,-330 L-150,-40 L150,-40 L80,-330Z" fill="${pants}"/><path d="M-150,-40 L150,-40 L146,-70 L-146,-70Z" fill="${shade(pants, 0.8)}"/>`;
      body += `<rect x="-62" y="-44" width="44" height="34" rx="12" fill="${skin}"/><rect x="18" y="-44" width="44" height="34" rx="12" fill="${skin}"/>`;
    } else {
      const legCol = P.inferior === 'falda' ? skin : pants;
      body += `<g class="legL"><rect x="-70" y="-320" width="56" height="300" rx="24" fill="${legCol}"/><path d="M-90,-34 L-10,-34 Q-6,0 -20,0 L-88,0 Q-98,0 -90,-34Z" fill="${shoes}"/></g>`;
      body += `<g class="legR"><rect x="14" y="-320" width="56" height="300" rx="24" fill="${legCol}"/><path d="M10,-34 L90,-34 Q98,0 88,0 L20,0 Q6,0 10,-34Z" fill="${shoes}"/></g>`;
      if (P.inferior === 'falda') body += `<path d="M-85,-330 L-120,-180 L120,-180 L85,-330Z" fill="${pants}"/>`;
      if (astro) body += `<rect x="-72" y="-120" width="58" height="22" fill="#c9d1e8"/><rect x="14" y="-120" width="58" height="22" fill="#c9d1e8"/>`;
    }
    // torso
    const torsoW = mujer ? 88 : 98;
    body += `<path d="M-${torsoW - 10},-548 Q-${torsoW},-548 -${torsoW},-520 L-${torsoW - 8},-300 L${torsoW - 8},-300 L${torsoW},-520 Q${torsoW},-548 ${torsoW - 10},-548Z" fill="${shirt}"/>`;
    if (astro) body += `<rect x="-60" y="-500" width="120" height="80" rx="14" fill="#dfe6f5"/><rect x="-45" y="-488" width="22" height="22" rx="4" fill="#d9433b"/><rect x="-14" y="-488" width="22" height="22" rx="4" fill="${C.cel}"/><rect x="17" y="-488" width="22" height="22" rx="4" fill="${C.oro}"/><rect x="-40" y="-455" width="80" height="12" rx="6" fill="#9aa7c7"/><circle cx="70" cy="-530" r="14" fill="${C.oro}"/>`;
    if (P.saco) body += `<path d="M-${torsoW},-520 L-${torsoW - 8},-300 L-10,-300 L-22,-548 Q-${torsoW},-548 -${torsoW},-520Z" fill="${shade(shirt, 0.9)}"/><path d="M${torsoW},-520 L${torsoW - 8},-300 L10,-300 L22,-548 Q${torsoW},-548 ${torsoW},-520Z" fill="${shade(shirt, 0.9)}"/><path d="M-22,-548 L22,-548 L0,-470Z" fill="#f4f6fb"/>`;
    if (P.chaqueta) { const k = P.chaqueta; body += `<path d="M-${torsoW},-520 L-${torsoW - 8},-300 L-26,-300 L-20,-548 Q-${torsoW},-548 -${torsoW},-520Z" fill="${k}"/><path d="M${torsoW},-520 L${torsoW - 8},-300 L26,-300 L20,-548 Q${torsoW},-548 ${torsoW},-520Z" fill="${k}"/><path d="M-20,-548 L-46,-548 L-30,-470Z M20,-548 L46,-548 L30,-470Z" fill="${shade(k, 1.6)}"/><path d="M-60,-500 L-66,-330 M62,-500 L58,-330" stroke="#fff" stroke-opacity=".12" stroke-width="6"/><rect x="-28" y="-470" width="4" height="160" fill="#9aa7c7" opacity=".6"/>` }
    if (P.corbata) body += `<path d="M-9,-540 L9,-540 L14,-400 L0,-380 L-14,-400Z" fill="${P.corbata}"/>`;
    if (P.bata) body += `<path d="M-${torsoW + 6},-520 L-${torsoW + 2},-170 L-18,-170 L-26,-548 Q-${torsoW},-550 -${torsoW + 6},-520Z" fill="#f4f6fb"/><path d="M${torsoW + 6},-520 L${torsoW + 2},-170 L18,-170 L26,-548 Q${torsoW},-550 ${torsoW + 6},-520Z" fill="#f4f6fb"/><rect x="40" y="-470" width="34" height="8" fill="${C.cel}"/>`;
    if (P.gabardina) body += `<path d="M-${torsoW + 6},-520 L-${torsoW + 20},-130 L-14,-130 L-26,-548 Q-${torsoW},-550 -${torsoW + 6},-520Z" fill="${P.gabardina}"/><path d="M${torsoW + 6},-520 L${torsoW + 20},-130 L14,-130 L26,-548 Q${torsoW},-550 ${torsoW + 6},-520Z" fill="${P.gabardina}"/><rect x="-${torsoW + 4}" y="-330" width="${2 * torsoW + 8}" height="18" fill="${shade(P.gabardina, 0.7)}"/>`;
    if (P.chaleco) body += `<path d="M-${torsoW},-520 L-${torsoW - 8},-300 L-24,-300 L-30,-548 Q-${torsoW},-548 -${torsoW},-520Z" fill="${P.chaleco}"/><path d="M${torsoW},-520 L${torsoW - 8},-300 L24,-300 L30,-548 Q${torsoW},-548 ${torsoW},-520Z" fill="${P.chaleco}"/><rect x="-${torsoW - 2}" y="-400" width="${torsoW - 26}" height="14" fill="#f4f6fb"/><rect x="26" y="-400" width="${torsoW - 26}" height="14" fill="#f4f6fb"/>`;
    if (P.delantal) body += `<path d="M-60,-500 L60,-500 L70,-200 L-70,-200Z" fill="${P.delantal}"/><path d="M-60,-500 L-30,-548 M60,-500 L30,-548" stroke="${P.delantal}" stroke-width="8"/>`;
    if (P.cinturon) body += `<rect x="-${torsoW - 6}" y="-330" width="${2 * torsoW - 12}" height="22" fill="${P.cinturon}"/><rect x="-14" y="-333" width="28" height="28" rx="4" fill="${C.oro}" stroke="${shade(C.oro, 0.7)}" stroke-width="4"/>`;
    if (P.mochila) body += `<path d="M-60,-548 L-70,-330 M60,-548 L70,-330" stroke="${shade(P.mochila, 0.8)}" stroke-width="16"/>`;
    if (P['armiño']) body += `<path d="M-100,-545 Q0,-470 100,-545 L100,-560 Q0,-490 -100,-560Z" fill="#f4f1e8"/>${[-60, -20, 20, 60].map(x => `<rect x="${x - 3}" y="${-528 + Math.abs(x) * 0.1}" width="6" height="12" fill="#1f1a17"/>`).join('')}`;
    if (P.panuelo) body += `<path d="M-40,-552 L40,-552 L0,-500Z" fill="${P.panuelo}"/>`;
    if (P.capucha === 'atras') body += `<path d="M-70,-560 Q0,-520 70,-560 Q60,-600 0,-602 Q-60,-600 -70,-560Z" fill="${shade(shirt, 0.82)}"/><path d="M-20,-520 L-24,-430 M20,-520 L24,-430" stroke="#f4f6fb" stroke-width="5"/>`;
    // brazos
    const sleeve = astro ? '#eef2fb' : P.chaqueta ? P.chaqueta : (P.bata ? '#f4f6fb' : P.saco ? shade(shirt, 0.9) : P.gabardina ? P.gabardina : shirt);
    const fore = longSleeve ? sleeve : skin, hand = astro ? '#9aa7c7' : skin;
    const item = (k, tot) => k && ITEMS[k] ? `<g transform="translate(0,112) rotate(${-tot})">${ITEMS[k]}</g>` : '';
    const arm = (side, a, e, it) => `<g class="arm${side}" transform="translate(${side === 'L' ? -(torsoW - 4) : torsoW - 4},-525) rotate(${a})"><line x1="0" y1="0" x2="0" y2="118" stroke="${sleeve}" stroke-width="46" stroke-linecap="round"/><g class="fore${side}" transform="translate(0,118) rotate(${e})"><line x1="0" y1="0" x2="0" y2="96" stroke="${fore}" stroke-width="40" stroke-linecap="round"/>${astro ? `<rect x="-24" y="70" width="48" height="16" fill="#c9d1e8"/>` : ''}<circle cx="0" cy="110" r="25" fill="${hand}"/>${it}</g></g>`;
    const itemR = P.objeto && P.objeto !== 'ninguno' ? P.objeto : '';
    front += arm('L', pose[0], pose[1], '') + arm('R', pose[2], pose[3], item(itemR, pose[2] + pose[3]));
    // cabeza
    let head = `<rect x="-20" y="-580" width="40" height="44" fill="${skinD}"/>`;
    if (astro) head += `<rect x="-62" y="-578" width="124" height="34" rx="16" fill="#c9d1e8"/>`;
    head += `<circle cx="-76" cy="-640" r="16" fill="${skinD}"/><circle cx="76" cy="-640" r="16" fill="${skinD}"/><ellipse cx="0" cy="-645" rx="${mujer ? 74 : 78}" ry="80" fill="${skin}"/>`;
    if (P.barba && P.barba !== 'no') {
      if (P.barba === 'larga') head += `<path d="M-74,-650 Q-82,-520 0,-470 Q82,-520 74,-650 Q60,-600 0,-596 Q-60,-600 -74,-650Z" fill="${hair}"/>`;
      else if (P.barba === 'bigote') head += `<path d="M-30,-612 Q0,-628 30,-612 Q14,-604 0,-610 Q-14,-604 -30,-612Z" fill="${hair}"/>`;
      else head += `<path d="M-74,-650 Q-74,-570 0,-562 Q74,-570 74,-650 Q62,-604 0,-600 Q-62,-604 -74,-650Z" fill="${hair}"/>`;
    }
    // cara
    const ex = P.expresion || 'feliz';
    head += `<g class="eyes"><ellipse class="eye" cx="-27" cy="-650" rx="8" ry="10" fill="#1d2240"/><ellipse class="eye" cx="27" cy="-650" rx="8" ry="10" fill="#1d2240"/><circle cx="-24" cy="-654" r="2.5" fill="#fff"/><circle cx="30" cy="-654" r="2.5" fill="#fff"/></g>`;
    head += ex === 'sorpresa' ? `<path d="M-42,-684 Q-28,-696 -14,-686 M14,-686 Q28,-696 42,-684" stroke="${shade(hair, 0.9)}" stroke-width="6" fill="none" stroke-linecap="round"/>` : `<path d="M-40,-676 Q-28,-684 -14,-676 M14,-676 Q28,-684 40,-676" stroke="${shade(hair, 0.9)}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    head += `<path d="M-4,-640 Q6,-622 -6,-618" stroke="${skinD}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (ex !== 'serio') head += `<circle cx="-46" cy="-618" r="11" fill="#ff8a8a" opacity=".3"/><circle cx="46" cy="-618" r="11" fill="#ff8a8a" opacity=".3"/>`;
    if (ex === 'sorpresa' || ex === 'hablar' || P.anim === 'hablar') head += `<ellipse class="mouth" cx="0" cy="-598" rx="13" ry="${ex === 'sorpresa' ? 16 : 9}" fill="#6b2430"/>`;
    else if (ex === 'serio') head += `<path d="M-18,-598 L18,-598" stroke="#6b2430" stroke-width="6" stroke-linecap="round"/>`;
    else head += `<path d="M-24,-606 Q0,-582 24,-606 Q0,-596 -24,-606Z" fill="#6b2430" stroke="#6b2430" stroke-width="4" stroke-linejoin="round"/>`;
    if (P.barba === 'larga' || P.barba === 'corta') head += `<path d="M-34,-612 Q0,-630 34,-612 Q16,-606 0,-612 Q-16,-606 -34,-612Z" fill="${hair}"/>`;
    // pelo delante
    if (!helmet && P.capucha !== 'puesta') {
      if (pelo === 'corto' || pelo === 'largo' || pelo === 'coleta' || pelo === 'moño' || pelo === 'mono') head += `<path d="M-82,-640 C-88,-724 -40,-738 0,-738 C40,-738 88,-724 82,-640 C74,-672 50,-690 0,-688 C-30,-688 -50,-680 -60,-668 C-66,-662 -76,-652 -82,-640Z" fill="${hair}"/>`;
      if (pelo === 'moño' || pelo === 'mono') head += `<circle cx="0" cy="-742" r="34" fill="${hair}"/>`;
      if (pelo === 'rizado') { for (let i = 0; i <= 10; i++) { const a = Math.PI * (1 + i / 10); head += `<circle cx="${f(Math.cos(a) * 74)}" cy="${f(-650 + Math.sin(a) * 78)}" r="26" fill="${hair}"/>` } head += `<circle cx="0" cy="-720" r="40" fill="${hair}"/>` }
      if (pelo === 'afro') head += `<path d="M-90,-650 Q-96,-760 0,-770 Q96,-760 90,-650 Q70,-700 0,-702 Q-70,-700 -90,-650Z" fill="${hair}"/>`;
      if (pelo === 'calvo') head += `<path d="M-80,-650 Q-82,-680 -70,-690 L-66,-640Z M80,-650 Q82,-680 70,-690 L66,-640Z" fill="${hair}"/>`;
    }
    if (P.gafas === 'proteccion') head += `<rect x="-62" y="-700" width="124" height="34" rx="16" fill="${C.cel}" fill-opacity=".6" stroke="#5a6290" stroke-width="5"/>`;
    if (P.gafas === 'sol') head += `<rect x="-52" y="-666" width="44" height="30" rx="12" fill="#101018"/><rect x="8" y="-666" width="44" height="30" rx="12" fill="#101018"/><path d="M-8,-656 L8,-656" stroke="#101018" stroke-width="5"/><rect x="-44" y="-660" width="14" height="6" rx="3" fill="#fff" opacity=".35"/><rect x="16" y="-660" width="14" height="6" rx="3" fill="#fff" opacity=".35"/>`;
    if (P.gafas === 'normal') head += `<circle cx="-27" cy="-650" r="20" fill="none" stroke="#1d2240" stroke-width="5"/><circle cx="27" cy="-650" r="20" fill="none" stroke="#1d2240" stroke-width="5"/><path d="M-7,-652 L7,-652" stroke="#1d2240" stroke-width="5"/>`;
    if (P.parche) head += `<path d="M-80,-690 L60,-620" stroke="#1f1a17" stroke-width="5"/><ellipse cx="27" cy="-650" rx="20" ry="18" fill="#1f1a17"/>`;
    if (P.audifonos) head += `<path d="M-84,-640 Q-84,-748 0,-748 Q84,-748 84,-640" stroke="#101943" stroke-width="14" fill="none"/><rect x="-100" y="-668" width="30" height="56" rx="12" fill="${C.oro}"/><rect x="70" y="-668" width="30" height="56" rx="12" fill="${C.oro}"/>`;
    if (P.capucha === 'puesta') head += `<path d="M-108,-650 Q-110,-772 0,-774 Q110,-772 108,-650 Q100,-720 0,-724 Q-100,-720 -108,-650Z" fill="${shade(shirt, 0.8)}"/><path d="M-84,-640 Q-84,-720 0,-724 Q84,-720 84,-640" stroke="${shade(shirt, 0.6)}" stroke-width="8" fill="none"/>`;
    // sombreros
    const hat = P.sombrero, crown = P.corona;
    if (crown) { const h = crown === 'reina' ? 60 : 80; top += `<path d="M-70,-706 L-70,${-706 - h} L-40,${-706 - h * 0.55} L-14,${-706 - h} L0,${-706 - h * 0.5} L14,${-706 - h} L40,${-706 - h * 0.55} L70,${-706 - h} L70,-706Z" fill="${C.oro}" stroke="${shade(C.oro, 0.75)}" stroke-width="4" stroke-linejoin="round"/><rect x="-72" y="-718" width="144" height="18" rx="4" fill="${shade(C.oro, 0.85)}"/><circle cx="0" cy="-742" r="9" fill="#d9433b"/><circle cx="-40" cy="-735" r="7" fill="${C.cel}"/><circle cx="40" cy="-735" r="7" fill="${C.cel}"/>${[-70, -14, 14, 70].map(x => `<circle cx="${x}" cy="${-706 - h - 6}" r="7" fill="#f4f1e8"/>`).join('')}` }
    if (hat === 'vikingo') top += `<path d="M-84,-680 A84,84 0 0 1 84,-680Z" fill="#9aa7c7"/><rect x="-88" y="-690" width="176" height="18" rx="6" fill="#7d8bb0"/><rect x="-8" y="-760" width="16" height="80" fill="#7d8bb0"/><path d="M-78,-700 C-120,-710 -134,-760 -118,-790 C-112,-752 -96,-730 -70,-724Z" fill="#f3ead8"/><path d="M78,-700 C120,-710 134,-760 118,-790 C112,-752 96,-730 70,-724Z" fill="#f3ead8"/>`;
    if (hat === 'chef') top += `<rect x="-60" y="-760" width="120" height="60" fill="#f4f6fb"/><circle cx="-45" cy="-780" r="40" fill="#f4f6fb"/><circle cx="0" cy="-800" r="46" fill="#f4f6fb"/><circle cx="45" cy="-780" r="40" fill="#f4f6fb"/><rect x="-64" y="-712" width="128" height="16" fill="#e6eaf5"/>`;
    if (hat === 'casco_obra') top += `<path d="M-86,-680 Q-86,-772 0,-774 Q86,-772 86,-680Z" fill="${C.oro}"/><rect x="-100" y="-690" width="200" height="18" rx="9" fill="${shade(C.oro, 0.85)}"/><rect x="-10" y="-772" width="20" height="90" fill="${shade(C.oro, 0.9)}"/>`;
    if (hat === 'gorra') top += `<path d="M-82,-672 Q-82,-758 0,-760 Q82,-758 82,-672Z" fill="${C.navy2}"/><path d="M20,-676 L140,-670 Q140,-656 120,-656 L20,-660Z" fill="${C.navy}"/><circle cx="0" cy="-760" r="8" fill="${C.oro}"/>`;
    if (hat === 'pirata') top += `<path d="M-130,-690 Q0,-650 130,-690 Q110,-790 0,-800 Q-110,-790 -130,-690Z" fill="#1f1a17"/><path d="M-20,-740 l20,-14 l20,14 l-20,14Z" fill="#f4f1e8"/>`;
    if (hat === 'detective') top += `<ellipse cx="0" cy="-696" rx="120" ry="22" fill="${shade(P.gabardina || '#a07850', 0.6)}"/><path d="M-70,-696 Q-72,-780 0,-784 Q72,-780 70,-696Z" fill="${shade(P.gabardina || '#a07850', 0.6)}"/><rect x="-70" y="-716" width="140" height="16" fill="#1f1a17"/>`;
    // casco de astronauta
    if (helmet) {
      const vis = P.visor === true || P.visor === 'si' || P.visor === 'oro';
      top += `<defs><radialGradient id="${id}gl" cx="35%" cy="30%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="${C.cel}" stop-opacity=".18"/></radialGradient><linearGradient id="${id}vi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#b98a2a"/></linearGradient></defs>`;
      top += `<circle cx="0" cy="-648" r="116" fill="url(#${id}${vis ? 'vi' : 'gl'})" stroke="#eef2fb" stroke-width="16"/><path d="M-70,-720 Q-40,-750 0,-752" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".8"/><rect x="-80" y="-548" width="160" height="26" rx="12" fill="#c9d1e8"/><circle cx="104" cy="-660" r="12" fill="${C.oro}"/>`;
    }
    const svg = `<g class="pbody">${back}${body}<g class="ph">${head}${top}</g>${front}</g>`;
    const isWave = P.pose === 'saludar', isCele = P.pose === 'celebrar';
    return {
      svg, box: [-170, -900, 340, 900], upd(Q, lt, t) {
        const an = P.anim || (astro && !helmet ? 'respirar' : astro ? 'flotar' : 'respirar');
        // parpadeo
        const bl = (t % 3.6) < 0.12 ? 0.15 : 1; Q('.eye').forEach(e => e.setAttribute('ry', f(10 * bl)));
        const m = Q('.mouth')[0]; if (m && (P.anim === 'hablar' || ex === 'hablar')) m.setAttribute('ry', f(3 + 9 * Math.abs(Math.sin(t * 11))));
        const fr = Q('.foreR')[0], fl = Q('.foreL')[0], ar = Q('.armR')[0], al = Q('.armL')[0];
        if (isWave) fr.setAttribute('transform', `translate(0,118) rotate(${f(pose[3] + 28 * Math.sin(t * 7))})`);
        if (isCele) { ar.setAttribute('transform', `translate(${torsoW - 4},-525) rotate(${f(pose[2] + 12 * Math.sin(t * 8))})`); al.setAttribute('transform', `translate(${-(torsoW - 4)},-525) rotate(${f(pose[0] - 12 * Math.sin(t * 8))})`) }
        let bob = 0, rot = 0;
        if (an === 'caminar') { const s = Math.sin(t * 7); Q('.legL')[0] && Q('.legL')[0].setAttribute('transform', `rotate(${f(s * 8)} -42 -320)`); Q('.legR')[0] && Q('.legR')[0].setAttribute('transform', `rotate(${f(-s * 8)} 42 -320)`); bob = -Math.abs(Math.cos(t * 7)) * 12; if (!isWave && !isCele) { ar.setAttribute('transform', `translate(${torsoW - 4},-525) rotate(${f(pose[2] + s * 14)})`); al.setAttribute('transform', `translate(${-(torsoW - 4)},-525) rotate(${f(pose[0] + s * 14)})`) } }
        else if (an === 'saltar' || an === 'celebrar') bob = -Math.abs(Math.sin(t * 5)) * 50;
        else if (an === 'flotar') { bob = Math.sin(t * 1.4) * 22; rot = Math.sin(t * 0.9) * 5 }
        else bob = Math.sin(t * 2) * 3;
        Q('.pbody')[0].setAttribute('transform', `translate(0,${f(bob)}) rotate(${f(rot)} 0 -400)`);
        Q('.ph')[0].setAttribute('transform', `rotate(${f(Math.sin(t * 1.3) * 2.5)} 0 -560)`);
      }
    };
  }

  // ---------- animales y criaturas (pies en 0,0; miran a la derecha) ----------
  function bicho(s) {
    const t0 = s.p; const c1 = s.color ? (PELO[s.color] || s.color) : null;
    let h = '', box = [-200, -360, 400, 370], upd = () => { };
    const eye = (x, y, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle class="pup" cx="${x + r * 0.3}" cy="${y}" r="${r * 0.55}" fill="#1d2240"/>`;
    if (t0 === 'escarabajo') {
      const sc = c1 || '#2e7d5b', sd = shade(sc, 0.7);
      const legs = (dark) => [-70, -10, 50].map((x, i) => `<g class="lg${dark ? 'b' : 'f'}" data-i="${i}" data-x="${x}"><path d="M${x},-70 L${x + (dark ? -14 : 18)},-34 L${x + (dark ? -6 : 30)},0" stroke="${dark ? '#0d1230' : '#1d2240'}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('');
      h = legs(true) + `<ellipse cx="-15" cy="-118" rx="128" ry="84" fill="${sc}"/><path d="M100,-158 Q0,-215 -138,-118" stroke="${sd}" stroke-width="7" fill="none"/><ellipse cx="-30" cy="-165" rx="60" ry="15" fill="#fff" opacity=".28" transform="rotate(-10 -30 -165)"/><ellipse cx="98" cy="-118" rx="46" ry="52" fill="${sd}"/><circle cx="142" cy="-108" r="32" fill="#1d2240"/>${eye(152, -116, 9)}<path d="M160,-130 Q180,-170 205,-188" stroke="#1d2240" stroke-width="6" fill="none"/><circle cx="208" cy="-190" r="9" fill="#1d2240"/><path d="M150,-138 Q160,-180 172,-200" stroke="#1d2240" stroke-width="5" fill="none"/><path d="M168,-96 L188,-88 L172,-80" fill="#1d2240"/>` + legs(false);
      upd = (Q, lt, t) => { ['.lgf', '.lgb'].forEach((k, j) => Q(k).forEach((e, i) => e.setAttribute('transform', `rotate(${f(Math.sin(t * 9 + i * 2 + j * 3) * 10)} ${e.dataset.x} -70)`))) };
    } else if (t0 === 'hormiga') {
      const sc = c1 || '#4a2a1a';
      h = [-60, 0, 50].map((x, i) => `<path class="lgf" data-x="${x}" d="M${x / 2},-80 L${x + 10},-40 L${x + 20},0" stroke="${sc}" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('') + `<ellipse cx="-90" cy="-95" rx="62" ry="46" fill="${sc}"/><ellipse cx="-5" cy="-95" rx="36" ry="26" fill="${sc}"/><circle cx="62" cy="-112" r="34" fill="${sc}"/>${eye(74, -120, 8)}<path d="M80,-140 Q100,-190 130,-200 M70,-142 Q80,-190 100,-215" stroke="${sc}" stroke-width="5" fill="none"/><ellipse cx="-100" cy="-118" rx="22" ry="8" fill="#fff" opacity=".25"/>`;
      upd = (Q, lt, t) => Q('.lgf').forEach((e, i) => e.setAttribute('transform', `rotate(${f(Math.sin(t * 10 + i * 2) * 12)} ${+e.dataset.x / 2} -80)`));
    } else if (t0 === 'abeja') {
      const id = 'ab' + (uid++);
      h = `<g class="fly"><defs><clipPath id="${id}"><ellipse cx="0" cy="-160" rx="92" ry="64"/></clipPath></defs><ellipse class="wg" cx="-10" cy="-225" rx="58" ry="36" fill="#e6eeff" opacity=".75" transform="rotate(-20 -10 -225)"/><path d="M-92,-160 L-130,-150 L-92,-140Z" fill="#1d2240"/><ellipse cx="0" cy="-160" rx="92" ry="64" fill="#f5c33b"/><g clip-path="url(#${id})"><rect x="-55" y="-230" width="28" height="140" fill="#1d2240"/><rect x="5" y="-230" width="28" height="140" fill="#1d2240"/></g><circle cx="92" cy="-168" r="44" fill="#1d2240"/>${eye(108, -176, 11)}<path d="M100,-206 Q110,-250 135,-262 M88,-208 Q88,-250 104,-270" stroke="#1d2240" stroke-width="5" fill="none"/><ellipse class="wg2" cx="20" cy="-228" rx="62" ry="38" fill="#fff" opacity=".85" transform="rotate(15 20 -228)"/></g>`;
      upd = (Q, lt, t) => { const k = 0.35 + 0.65 * Math.abs(Math.sin(t * 30)); Q('.wg').concat(Q('.wg2')).forEach(e => e.setAttribute('transform', `${e.getAttribute('transform').split(')')[0]}) scale(1,${f(k)})`)); Q('.fly')[0].setAttribute('transform', `translate(${f(Math.sin(t * 1.3) * 30)},${f(Math.sin(t * 2.6) * 24 - 40)})`) };
    } else if (t0 === 'mariposa') {
      const a = c1 || C.cel, b = C.oro;
      const wing = `<path d="M0,-200 C-60,-330 -230,-330 -200,-210 C-180,-150 -60,-170 0,-190Z" fill="${a}"/><path d="M0,-185 C-80,-170 -190,-110 -130,-60 C-90,-30 -30,-100 0,-170Z" fill="${b}"/><circle cx="-130" cy="-245" r="22" fill="#fff" opacity=".7"/><circle cx="-100" cy="-105" r="14" fill="#fff" opacity=".6"/>`;
      h = `<g class="fly"><g class="wl">${wing}</g><g class="wr" transform="scale(-1,1)">${wing}</g><ellipse cx="0" cy="-170" rx="14" ry="80" fill="#1d2240"/><circle cx="0" cy="-260" r="18" fill="#1d2240"/><path d="M-6,-272 Q-30,-320 -46,-330 M6,-272 Q30,-320 46,-330" stroke="#1d2240" stroke-width="5" fill="none"/></g>`;
      upd = (Q, lt, t) => { const k = 0.25 + 0.75 * Math.abs(Math.cos(t * 9)); Q('.wl')[0].setAttribute('transform', `scale(${f(k)},1)`); Q('.wr')[0].setAttribute('transform', `scale(${f(-k)},1)`); Q('.fly')[0].setAttribute('transform', `translate(${f(Math.sin(t * 1.1) * 40)},${f(Math.sin(t * 2.2) * 30 - 60)})`) };
      box = [-240, -420, 480, 430];
    } else if (t0 === 'perro' || t0 === 'gato') {
      const dog = t0 === 'perro', sc = c1 || (dog ? '#c98a4b' : '#8f96ad'), sd = shade(sc, 0.75);
      const leg = (x, k) => `<g class="lg" data-x="${x}" data-k="${k}"><rect x="${x - 14}" y="-120" width="28" height="112" rx="12" fill="${k ? sd : sc}"/><ellipse cx="${x + 4}" cy="-8" rx="20" ry="10" fill="${k ? sd : sc}"/></g>`;
      h = leg(-70, 1) + leg(60, 1) + `<path class="tail" d="M-110,-150 Q-170,-200 ${dog ? '-150,-240' : '-140,-290'}" stroke="${sc}" stroke-width="${dog ? 22 : 16}" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-150" rx="${dog ? 118 : 108}" ry="${dog ? 62 : 54}" fill="${sc}"/>` + leg(-50, 0) + leg(80, 0);
      h += `<g class="hd"><circle cx="120" cy="-215" r="${dog ? 58 : 54}" fill="${sc}"/>` + (dog ? `<ellipse cx="172" cy="-198" rx="38" ry="28" fill="${shade(sc, 1.1)}"/><circle cx="205" cy="-206" r="11" fill="#1d2240"/><path d="M92,-262 Q60,-250 70,-180 Q96,-196 104,-240Z" fill="${sd}"/><path d="M160,-176 Q168,-160 182,-170" stroke="#1d2240" stroke-width="4" fill="none"/><ellipse class="tg" cx="176" cy="-166" rx="9" ry="14" fill="#ff7a8a"/>` : `<path d="M82,-250 L92,-310 L124,-262Z M130,-266 L162,-306 L166,-246Z" fill="${sc}"/><path d="M92,-262 L96,-292 L112,-268Z M140,-266 L158,-290 L158,-254Z" fill="#ffb0c0"/><path d="M162,-206 l10,8 l-10,6Z" fill="#ff8aa0"/><path d="M168,-196 L215,-206 M168,-192 L215,-188" stroke="#e6eeff" stroke-width="3"/>`) + `${eye(140, -228, 11)}</g>`;
      h += `<rect x="72" y="-176" width="70" height="16" rx="8" fill="${C.oro}" transform="rotate(-20 107 -168)"/>`;
      upd = (Q, lt, t) => { Q('.tail')[0].setAttribute('transform', `rotate(${f(Math.sin(t * (dog ? 14 : 3)) * (dog ? 14 : 8))} -110 -150)`); Q('.hd')[0].setAttribute('transform', `rotate(${f(Math.sin(t * 1.5) * 4)} 100 -180)`); if (s.anim === 'caminar') Q('.lg').forEach((e, i) => e.setAttribute('transform', `rotate(${f(Math.sin(t * 8 + i * Math.PI / 2) * 14)} ${e.dataset.x} -120)`)) };
      box = [-200, -330, 440, 340];
    } else if (t0 === 'pajaro') {
      const sc = c1 || C.cel;
      h = `<g class="fly"><path d="M-70,-130 L-130,-150 L-120,-110Z" fill="${shade(sc, 0.75)}"/><circle cx="0" cy="-130" r="82" fill="${sc}"/><ellipse cx="18" cy="-100" rx="50" ry="42" fill="#f4f6fb"/>${eye(40, -160, 13)}<path d="M76,-150 L120,-136 L76,-122Z" fill="${C.oro}"/><ellipse class="wg" cx="-20" cy="-130" rx="56" ry="30" fill="${shade(sc, 0.8)}"/><path d="M-10,-50 L-16,0 M20,-50 L26,0" stroke="${C.oro}" stroke-width="7"/></g>`;
      upd = (Q, lt, t) => { Q('.wg')[0].setAttribute('transform', `rotate(${f(-20 + Math.sin(t * 14) * 30)} 10 -130)`); Q('.fly')[0].setAttribute('transform', `translate(0,${f(s.anim === 'volar' ? Math.sin(t * 2) * 30 - 80 : -Math.abs(Math.sin(t * 3)) * 20)})`) };
    } else if (t0 === 'robot') {
      const sc = c1 || '#e6eeff';
      h = `<g class="rb"><rect x="-70" y="-110" width="40" height="110" rx="14" fill="${shade(sc, 0.8)}"/><rect x="30" y="-110" width="40" height="110" rx="14" fill="${shade(sc, 0.8)}"/><rect x="-110" y="-330" width="220" height="230" rx="36" fill="${sc}"/><rect x="-60" y="-290" width="120" height="70" rx="12" fill="#06122e"/>${[0, 1, 2].map(i => `<circle class="lt" cx="${-30 + i * 30}" cy="-255" r="10" fill="${[C.oro, '#7CFFB2', C.cel][i]}"/>`).join('')}<g class="arL"><rect x="-150" y="-310" width="38" height="140" rx="18" fill="${shade(sc, 0.85)}"/><circle cx="-131" cy="-160" r="24" fill="${C.oro}"/></g><g class="arR"><rect x="112" y="-310" width="38" height="140" rx="18" fill="${shade(sc, 0.85)}"/><circle cx="131" cy="-160" r="24" fill="${C.oro}"/></g><rect x="-20" y="-360" width="40" height="34" fill="${shade(sc, 0.8)}"/><rect x="-100" y="-540" width="200" height="180" rx="44" fill="${sc}"/><rect x="-76" y="-512" width="152" height="110" rx="30" fill="#06122e"/><rect class="re" x="-46" y="-480" width="26" height="38" rx="13" fill="${C.cel}"/><rect class="re" x="20" y="-480" width="26" height="38" rx="13" fill="${C.cel}"/><path d="M-24,-428 Q0,-414 24,-428" stroke="${C.cel}" stroke-width="6" fill="none" stroke-linecap="round"/><line x1="0" y1="-540" x2="0" y2="-590" stroke="${shade(sc, 0.7)}" stroke-width="8"/><circle class="ant" cx="0" cy="-598" r="15" fill="${C.oro}"/></g>`;
      box = [-170, -640, 340, 650];
      upd = (Q, lt, t) => { Q('.ant')[0].setAttribute('opacity', Math.floor(t * 3) % 2 ? 1 : 0.3); const bl = (t % 3) < 0.12 ? 0.15 : 1; Q('.re').forEach(e => { e.setAttribute('height', f(38 * bl)); e.setAttribute('y', f(-480 + 19 * (1 - bl))) }); Q('.lt').forEach((e, i) => e.setAttribute('opacity', (Math.floor(t * 4) + i) % 3 ? 1 : 0.25)); Q('.arR')[0].setAttribute('transform', `rotate(${f(s.pose === 'saludar' ? -150 + Math.sin(t * 7) * 20 : Math.sin(t * 2) * 6)} 131 -300)`); Q('.rb')[0].setAttribute('transform', `translate(0,${f(Math.sin(t * 2) * 6)})`) };
    } else if (t0 === 'pinguino') {
      h = `<g class="pg"><ellipse cx="-40" cy="-8" rx="36" ry="14" fill="#f08a24"/><ellipse cx="40" cy="-8" rx="36" ry="14" fill="#f08a24"/><ellipse cx="0" cy="-200" rx="110" ry="180" fill="#1d2240"/><ellipse cx="0" cy="-170" rx="78" ry="140" fill="#f4f6fb"/><ellipse class="flL" cx="-108" cy="-200" rx="26" ry="80" fill="#1d2240"/><ellipse class="flR" cx="108" cy="-200" rx="26" ry="80" fill="#1d2240"/>${eye(-30, -300, 14)}${eye(30, -300, 14)}<path d="M-20,-272 L20,-272 L0,-246Z" fill="#f08a24"/><circle cx="-56" cy="-250" r="12" fill="#ff8a8a" opacity=".35"/><circle cx="56" cy="-250" r="12" fill="#ff8a8a" opacity=".35"/></g>`;
      box = [-170, -400, 340, 410];
      upd = (Q, lt, t) => { Q('.flL')[0].setAttribute('transform', `rotate(${f(20 + Math.sin(t * 6) * 18)} -100 -260)`); Q('.flR')[0].setAttribute('transform', `rotate(${f(-20 - Math.sin(t * 6) * 18)} 100 -260)`); Q('.pg')[0].setAttribute('transform', `rotate(${f(Math.sin(t * 4) * 5)} 0 0)`) };
    } else return null;
    return { svg: `<g>${h}</g>`, box, upd };
  }

  const CRIATURAS = ['escarabajo', 'hormiga', 'abeja', 'mariposa', 'perro', 'gato', 'pajaro', 'robot', 'pinguino'];
  window.PERSONAJES = {
    presets: Object.keys(PRESETS), criaturas: CRIATURAS, poses: Object.keys(POSES), objetos: Object.keys(ITEMS),
    build(spec) {
      if (typeof spec === 'string') spec = { p: spec.replace(/^char:/, '') };
      const s = Object.assign({}, spec); if (s.p === 'pájaro') s.p = 'pajaro'; if (s.p === 'pingüino') s.p = 'pinguino';
      return CRIATURAS.includes(s.p) ? bicho(s) : persona(s);
    },
    // crea un <svg> con el personaje; para usar como "hero"
    heroSvg(spec, w, h) {
      const r = this.build(spec); const [x, y, bw, bh] = r.box;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', `${x} ${y} ${bw} ${bh}`); el.setAttribute('width', w); el.setAttribute('height', h); el.style.overflow = 'visible';
      el.innerHTML = `<g transform="${spec.voltear ? 'scale(-1,1)' : ''}">${r.svg}</g>`;
      const cache = {}; const Q = s2 => cache[s2] || (cache[s2] = [...el.querySelectorAll(s2)]);
      return { el, upd: (lt, t) => r.upd(Q, lt, t), box: r.box };
    }
  };
})();

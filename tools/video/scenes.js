// Escenarios ilustrados animados (SVG vectorial, paleta MinkSoft) para los videos.
// Uso en video.json:  "bg":"vikingo"  |  "bg":"tienda:CYBER MONDAY"  (el texto tras ":" es opcional)
// Cada escenario devuelve {svg, upd(Q, lt, t)}: Q(selector) cachea nodos, lt = segundos dentro de la escena, t = tiempo global.
(function () {
  const W = 1080, H = 1920;
  const C = { navy: '#101943', navy2: '#1B2A6B', cel: '#A9C8FF', oro: '#E8B03A' };
  const R = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 };
  const f = n => (+n).toFixed(1);
  const pts = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
  const lg = (id, st, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${st.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] ?? 1}"/>`).join('')}</linearGradient>`;
  const rg = (id, c, a = 1) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- piezas reutilizables ----------
  function stars(r, n, ymax, x0 = 0, w = W) { let h = ''; for (let i = 0; i < n; i++) h += `<circle class="tw" cx="${f(x0 + r() * w)}" cy="${f(r() * ymax)}" r="${f(0.8 + r() * 2.2)}" fill="#fff"/>`; return h }
  function twinkle(Q, t) { Q('.tw').forEach((s, i) => s.setAttribute('opacity', (0.3 + 0.65 * Math.abs(Math.sin(t * (0.6 + (i % 7) * 0.25) + i))).toFixed(2))) }
  function flakes(r, n) { let h = ''; for (let i = 0; i < n; i++) { const s = 1.5 + r() * 4.5; h += `<circle class="fk" data-x="${f(r() * W)}" data-y="${f(r() * H)}" data-v="${f(40 + s * 22)}" r="${f(s)}" fill="#fff" opacity="${f(0.45 + r() * 0.5)}"/>` } return h }
  function snowfall(Q, t) { Q('.fk').forEach((c, i) => { const x = +c.dataset.x, y = +c.dataset.y, v = +c.dataset.v; c.setAttribute('transform', `translate(${f(x + Math.sin(t * 0.9 + i) * 26)},${f((y + t * v) % (H + 40) - 20)})`) }) }
  function ridge(r, o) {
    const { base, peaks, hmin, hmax, col, snow = '#e6eeff', shade = 0.18, x0 = -120, x1 = W + 120 } = o;
    const P = [[x0, base - r() * hmin * 0.3]], pk = [], step = (x1 - x0) / peaks;
    for (let i = 0; i < peaks; i++) { const a = x0 + i * step; P.push([a + step * (0.35 + r() * 0.3), base - (hmin + r() * (hmax - hmin))]); pk.push(P.length - 1); P.push([a + step, base - r() * hmin * 0.35]) }
    let h = `<polygon points="${pts([[x0, H + 60], ...P, [x1, H + 60]])}" fill="${col}"/>`;
    pk.forEach(k => {
      const p = P[k], A = P[k - 1], B = P[k + 1];
      h += `<polygon points="${pts([p, B, [p[0] + (B[0] - p[0]) * 0.12, H + 60]])}" fill="#000" opacity="${shade}"/>`;
      if (snow) {
        const q = 0.26 + r() * 0.12, L = [p[0] + (A[0] - p[0]) * q, p[1] + (A[1] - p[1]) * q], Rt = [p[0] + (B[0] - p[0]) * q, p[1] + (B[1] - p[1]) * q], z = [];
        for (let j = 1; j < 5; j++) z.push([L[0] + (Rt[0] - L[0]) * j / 5, L[1] + (Rt[1] - L[1]) * j / 5 + (j % 2 ? 22 + r() * 18 : -4)]);
        h += `<polygon points="${pts([p, L, ...z, Rt])}" fill="${snow}"/><polygon points="${pts([p, Rt, z[z.length - 1], [p[0] + (Rt[0] - p[0]) * 0.2, p[1] + (Rt[1] - p[1]) * 0.6]])}" fill="#8fa3d9" opacity=".45"/>`;
      }
    });
    return h;
  }
  const pine = (x, y, s, col, snow) => `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})"><rect x="-7" y="-10" width="14" height="24" fill="#2a1d14"/><path d="M0,-190 L44,-112 L24,-112 L64,-50 L38,-50 L84,12 L-84,12 L-38,-50 L-64,-50 L-24,-112 L-44,-112Z" fill="${col}"/>${snow ? `<path d="M0,-190 L22,-151 L8,-146 L-6,-153 L-22,-151Z M-24,-112 L24,-112 L40,-88 L14,-94 L-4,-86 L-36,-92Z M-38,-50 L38,-50 L56,-26 L20,-32 L-6,-24 L-50,-30Z" fill="${snow}" opacity=".9"/>` : ''}</g>`;
  function aurora(id) { let h = ''; const cols = ['#7CFFB2', '#A9C8FF', '#7CFFB2']; for (let i = 0; i < 3; i++) { const y = 260 + i * 95; h += `<path class="au" d="M-250,${y} C150,${y - 150} 350,${y + 130} 600,${y - 40} S1000,${y - 170} 1350,${y + 20}" stroke="${cols[i]}" stroke-width="${80 - i * 18}" fill="none" opacity=".3" filter="url(#${id}b)"/>` } return h }
  function auroraUpd(Q, t) { Q('.au').forEach((a, i) => { a.setAttribute('transform', `translate(${f(Math.sin(t * 0.4 + i) * 60)},${f(Math.sin(t * 0.6 + i * 2) * 22)})`); a.setAttribute('opacity', f(0.2 + 0.18 * Math.sin(t * 0.9 + i * 1.7) + 0.12)) }) }
  function skyline(r, w, base, col, lit = 0.5) { let h = '', x = -20; while (x < w) { const bw = 50 + r() * 90, bh = 120 + r() * 320, y = base - bh; h += `<rect x="${f(x)}" y="${f(y)}" width="${f(bw)}" height="${f(bh + 400)}" fill="${col}"/>`; for (let wy = y + 16; wy < base - 10; wy += 30) for (let wx = x + 10; wx < x + bw - 14; wx += 22) { const q = r(); if (q < lit) h += `<rect class="wn" x="${f(wx)}" y="${f(wy)}" width="10" height="16" fill="${q < 0.08 ? C.oro : C.cel}" opacity="${f(0.3 + q * 0.6)}"/>` } x += bw + 4 + r() * 10 } return h }
  const screenText = (x, y, w, n, col, cls = 'ln') => { let h = ''; for (let i = 0; i < n; i++) h += `<rect class="${cls}" x="${x + (i % 3) * 14}" y="${y + i * 22}" width="${f(w * (0.35 + ((i * 37) % 60) / 100))}" height="9" rx="4" fill="${col}" opacity=".85"/>`; return h };
  const camOf = (lt) => `translate(540,300) scale(${f(1.03 + 0.006 * Math.min(lt, 10))}) translate(-540,-300)`;

  // ---------- montañas nevadas (y barco vikingo) ----------
  function ship(id) {
    const stripes = [...Array(9)].map((_, i) => `<rect x="${-150 + i * 34}" y="-340" width="34" height="250" fill="${i % 2 ? '#f4f1e8' : C.oro}"/>`).join('');
    const shields = [...Array(9)].map((_, i) => `<circle cx="${-160 + i * 40}" cy="-26" r="18" fill="${[C.oro, C.cel, C.navy2][i % 3]}" stroke="#2a1d14" stroke-width="4"/><circle cx="${-160 + i * 40}" cy="-26" r="4" fill="#2a1d14"/>`).join('');
    const oars = [...Array(6)].map((_, i) => `<line class="oar" x1="${-130 + i * 52}" y1="-10" x2="${-170 + i * 52}" y2="70" stroke="#4a2f18" stroke-width="6" stroke-linecap="round"/>`).join('');
    const viking = `<g transform="translate(118,-42)"><path d="M-22,-62 L22,-62 L30,0 L-30,0Z" fill="#5a3a1e"/><rect x="-15" y="-74" width="30" height="66" rx="10" fill="#8b2f2a"/><path d="M8,-60 L46,-84" stroke="#8b2f2a" stroke-width="11" stroke-linecap="round"/><circle cx="48" cy="-86" r="6" fill="#f0c49c"/><circle cx="0" cy="-92" r="17" fill="#f0c49c"/><path d="M-15,-90 Q0,-52 17,-90 Q8,-78 1,-79 Q-7,-78 -15,-90Z" fill="#d9822b"/><path d="M-19,-96 A19,19 0 0 1 19,-96 Z" fill="#9aa7c7"/><rect x="-20" y="-99" width="40" height="6" rx="3" fill="#7d8bb0"/><path d="M-17,-100 C-34,-104 -40,-122 -33,-133 C-31,-118 -24,-110 -13,-108Z" fill="#f3ead8"/><path d="M17,-100 C34,-104 40,-122 33,-133 C31,-118 24,-110 13,-108Z" fill="#f3ead8"/><circle cx="8" cy="-94" r="2.6" fill="#1a1a2e"/></g>`;
    return `<defs><clipPath id="${id}sail"><path d="M-140,-340 L140,-340 Q156,-215 140,-92 L-140,-92 Q-124,-215 -140,-340Z"/></clipPath></defs>`
      + oars + `<rect x="-6" y="-372" width="12" height="350" fill="#4a2f18"/><rect x="-165" y="-350" width="330" height="11" rx="5" fill="#4a2f18"/>`
      + `<g clip-path="url(#${id}sail)">${stripes}</g><path d="M-140,-92 L140,-92" stroke="#4a2f18" stroke-width="6"/>`
      + viking + shields
      + `<path d="M-218,-36 L218,-36 Q172,50 0,54 Q-172,50 -218,-36Z" fill="#6b4423"/><path d="M-204,-14 Q0,44 204,-14" stroke="#8a5a2b" stroke-width="5" fill="none"/><path d="M-182,8 Q0,58 182,8" stroke="#8a5a2b" stroke-width="5" fill="none"/>`
      + `<path d="M204,-36 C242,-62 226,-134 256,-164 C272,-180 300,-166 286,-150 C276,-142 266,-146 258,-132 C244,-104 254,-62 218,-22Z" fill="#6b4423"/><circle cx="272" cy="-160" r="3.5" fill="${C.oro}"/>`
      + `<path d="M-204,-36 C-242,-72 -230,-134 -262,-150 C-276,-144 -266,-130 -252,-120 C-236,-100 -246,-62 -218,-22Z" fill="#6b4423"/>`;
  }
  function mountains(o, id, viking) {
    const r = R(viking ? 17 : 7), wl = viking ? 1380 : 1430;
    let h = `<defs>${lg(id + 's', [[0, '#060b2b'], [0.55, '#15226a'], [1, '#2d4199']])}${lg(id + 'w', [[0, '#23347f'], [1, '#080e30']])}${rg(id + 'm', '#fff2c4', 0.5)}${blur(id + 'b', 18)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}s)"/>` + stars(r, 80, 950) + aurora(id);
    h += `<circle cx="830" cy="360" r="180" fill="url(#${id}m)"/><circle cx="830" cy="360" r="62" fill="#fbeec2"/><circle cx="812" cy="348" r="10" fill="#e9d79c" opacity=".7"/><circle cx="848" cy="378" r="14" fill="#e9d79c" opacity=".6"/>`;
    h += `<g class="p1">${ridge(r, { base: wl, peaks: 4, hmin: 420, hmax: 700, col: '#2b3c8f', shade: 0.2 })}</g>`;
    h += `<g class="p2">${ridge(r, { base: wl + 30, peaks: 5, hmin: 220, hmax: 440, col: '#1d2a70', shade: 0.22 })}</g>`;
    if (viking) {
      h += `<rect y="${wl}" width="${W}" height="${H - wl}" fill="url(#${id}w)"/>`;
      let rf = ''; for (let i = 0; i < 36; i++) rf += `<rect class="rf" x="${f(r() * W)}" y="${f(wl + 14 + i * 15 + r() * 8)}" width="${f(40 + r() * 120)}" height="4" rx="2" fill="${C.cel}" opacity="${f(0.1 + r() * 0.2)}"/>`;
      for (let i = 0; i < 9; i++) rf += `<rect class="rf" x="${f(790 + r() * 30)}" y="${wl + 20 + i * 30}" width="${f(30 + r() * 60)}" height="5" rx="2.5" fill="#fbeec2" opacity="${f(0.5 - i * 0.045)}"/>`;
      h += `<g>${rf}</g><g class="ship">${ship(id)}</g>`;
      h += `<path d="M-20,${wl - 20} Q140,${wl - 60} 250,${wl + 40} Q300,${wl + 260} 120,${wl + 380} L-20,${wl + 400}Z" fill="#0e1645"/><path d="M-20,${wl - 20} Q140,${wl - 60} 250,${wl + 40} Q180,${wl - 10} 60,${wl}Z" fill="#dfe8ff" opacity=".85"/>`;
      h += `<path d="M1100,${wl + 10} Q930,${wl - 30} 860,${wl + 70} Q820,${wl + 300} 1100,${wl + 440}Z" fill="#0e1645"/><path d="M1100,${wl + 10} Q930,${wl - 30} 860,${wl + 70} Q950,${wl + 20} 1100,${wl + 40}Z" fill="#dfe8ff" opacity=".85"/>`;
      h += pine(70, wl + 10, 1.0, '#0b1340', '#dfe8ff') + pine(170, wl + 60, 0.75, '#0b1340', '#dfe8ff') + pine(990, wl + 40, 1.1, '#0b1340', '#dfe8ff') + pine(900, wl + 110, 0.8, '#0b1340', '#dfe8ff');
    } else {
      h += `<g class="p3">${ridge(r, { base: wl + 70, peaks: 3, hmin: 90, hmax: 220, col: '#141d55', shade: 0.15, snow: '#cfdcff' })}</g>`;
      h += `<path d="M-20,${wl + 40} Q270,${wl - 30} 540,${wl + 40} T1100,${wl + 20} L1100,${H} L-20,${H}Z" fill="#cdd9f5"/><path d="M-20,${wl + 110} Q300,${wl + 60} 620,${wl + 130} T1100,${wl + 100} L1100,${H} L-20,${H}Z" fill="#b5c5ec"/>`;
      let pn = ''; for (let i = 0; i < 8; i++) { const left = i < 4; pn += pine(left ? 10 + i * 75 + r() * 25 : W - 290 + (i - 4) * 85 + r() * 25, wl + 60 + r() * 90, 0.8 + r() * 0.7, '#0f1847', '#e6eeff') } h += pn;
      h += `<g transform="translate(560,${wl + 80})"><rect x="-70" y="-70" width="140" height="80" fill="#5a3a1e"/><path d="M-90,-66 L0,-130 L90,-66Z" fill="#e6eeff"/><rect x="-18" y="-40" width="36" height="50" fill="#2a1d14"/><rect class="cab" x="30" y="-50" width="26" height="26" fill="${C.oro}"/><rect x="40" y="-150" width="18" height="50" fill="#3a2a1e"/><circle class="smk" cx="49" cy="-170" r="12" fill="#c7d3f0" opacity=".5"/><circle class="smk" cx="49" cy="-170" r="16" fill="#c7d3f0" opacity=".4"/></g>`;
    }
    h += `<g>${flakes(r, 110)}</g>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t); auroraUpd(Q, t); snowfall(Q, t);
        Q('.p1')[0].setAttribute('transform', `translate(${f(-lt * 3)},0)`); Q('.p2')[0].setAttribute('transform', `translate(${f(-lt * 7)},0)`);
        if (viking) {
          Q('.ship')[0].setAttribute('transform', `translate(${f(330 + lt * 14)},${f(wl + 52 + Math.sin(t * 1.7) * 6)}) rotate(${f(Math.sin(t * 1.3) * 2)}) scale(1.15)`);
          Q('.rf').forEach((e, i) => e.setAttribute('transform', `translate(${f(Math.sin(t * 0.8 + i) * 18)},0)`));
          Q('.oar').forEach((e, i) => e.setAttribute('transform', `rotate(${f(Math.sin(t * 2.2) * 10)} ${-130 + i * 52} -10)`));
        } else {
          Q('.p3')[0].setAttribute('transform', `translate(${f(-lt * 10)},0)`);
          Q('.smk').forEach((e, i) => { const q = ((t * 0.5 + i * 0.5) % 1); e.setAttribute('transform', `translate(${f(q * 30)},${f(-q * 110)}) scale(${f(1 + q)})`); e.setAttribute('opacity', f(0.5 * (1 - q))) });
          Q('.cab')[0].setAttribute('opacity', f(0.8 + 0.2 * Math.sin(t * 7)));
        }
      }
    };
  }

  // ---------- oficina (de noche, años 2000) ----------
  function oficina(o, id) {
    const r = R(11); const wx = 90, wy = 240, ww = 640, wh = 690;
    let h = `<defs>${lg(id + 'wall', [[0, '#1f2d75'], [1, '#141d55']])}${lg(id + 'sky', [[0, '#0a1035'], [1, '#2c4096']])}${lg(id + 'cone', [[0, '#ffd27a', 0.45], [1, '#ffd27a', 0]])}${rg(id + 'g', '#7fd3ff', 0.4)}${blur(id + 'b', 10)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}wall)"/>`;
    for (let x = 0; x < W; x += 180) h += `<rect x="${x}" y="0" width="3" height="1330" fill="#2a3a8c" opacity=".55"/>`;
    h += `<rect x="110" y="40" width="360" height="16" rx="8" fill="#e6eeff"/><rect x="610" y="40" width="360" height="16" rx="8" fill="#e6eeff"/><rect x="90" y="52" width="900" height="70" fill="#e6eeff" opacity=".1" filter="url(#${id}b)"/>`;
    h += `<rect x="${wx - 18}" y="${wy - 18}" width="${ww + 36}" height="${wh + 36}" rx="10" fill="#0b1340"/><svg x="${wx}" y="${wy}" width="${ww}" height="${wh}" viewBox="0 0 ${ww} ${wh}"><rect width="${ww}" height="${wh}" fill="url(#${id}sky)"/>${stars(r, 30, 300, 0, ww)}<circle cx="500" cy="120" r="40" fill="#fbeec2"/><g class="city">${skyline(r, ww * 2, wh + 10, '#121b52', 0.45)}</g></svg>`;
    h += `<rect x="${wx + ww / 2 - 7}" y="${wy}" width="14" height="${wh}" fill="#0b1340"/><rect x="${wx}" y="${wy + wh / 2 - 7}" width="${ww}" height="14" fill="#0b1340"/><rect x="${wx - 30}" y="${wy + wh + 12}" width="${ww + 60}" height="22" rx="6" fill="#2a3a8c"/>`;
    h += `<g transform="translate(905,330)"><circle r="92" fill="#0b1340"/><circle r="80" fill="#eef3ff"/>${[...Array(12)].map((_, i) => `<rect x="-3" y="-74" width="6" height="${i % 3 ? 10 : 18}" fill="${C.navy}" transform="rotate(${i * 30})"/>`).join('')}<rect class="hh" x="-5" y="-42" width="10" height="46" rx="5" fill="${C.navy}"/><rect class="mh" x="-3" y="-64" width="6" height="68" rx="3" fill="${C.oro}"/><circle r="8" fill="${C.navy}"/></g>`;
    h += `<g transform="translate(805,500)"><rect width="210" height="290" rx="8" fill="#0b1340"/><rect x="14" y="14" width="182" height="262" fill="#eef3ff"/><rect x="30" y="34" width="110" height="12" rx="6" fill="${C.navy2}"/>${[0.5, 0.75, 0.6, 0.95].map((v, i) => `<rect class="pb" x="${34 + i * 38}" y="${250 - 170 * v}" width="26" height="${170 * v}" fill="${i === 3 ? C.oro : '#5b7fd6'}"/>`).join('')}<rect x="28" y="252" width="154" height="4" fill="${C.navy2}"/></g>`;
    h += `<polygon points="120,890 30,1330 330,1330" fill="url(#${id}cone)"/><path d="M60,1330 L150,1330 L130,1312 L80,1312Z" fill="#2a3a8c"/><path d="M105,1312 L60,1010 L130,900" stroke="#2a3a8c" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M90,870 L180,860 L170,930 L110,940Z" fill="${C.oro}"/>`;
    h += `<rect x="0" y="1330" width="${W}" height="40" fill="#3a4fb0"/><rect x="0" y="1370" width="${W}" height="560" fill="#0c1440"/><rect x="620" y="1410" width="380" height="140" rx="10" fill="#141d55"/><rect x="780" y="1470" width="60" height="10" rx="5" fill="#2a3a8c"/>`;
    h += `<ellipse cx="460" cy="1150" rx="320" ry="240" fill="url(#${id}g)"/><rect x="260" y="980" width="400" height="310" rx="28" fill="#d8deef"/><rect x="288" y="1008" width="344" height="236" rx="16" fill="#06122e"/><svg x="300" y="1018" width="320" height="216" viewBox="0 0 320 216"><g class="scr">${screenText(8, 10, 280, 20, '#7CFFB2')}</g></svg><circle cx="620" cy="1268" r="6" fill="#7CFFB2" class="pled"/><path d="M400,1290 L520,1290 L545,1330 L375,1330Z" fill="#b9c2dd"/><rect x="300" y="1334" width="330" height="22" rx="7" fill="#c9d1e8"/>`;
    h += `<path d="M736,1248 L800,1248 L796,1330 L740,1330Z" fill="${C.oro}"/><path d="M800,1264 q32,0 32,26 q0,26 -34,24" stroke="${C.oro}" stroke-width="10" fill="none"/>${[0, 1, 2].map(i => `<path class="st" d="M${752 + i * 16},1230 q-12,-20 0,-40 q12,-20 0,-40" stroke="#e6eeff" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`;
    h += `<g transform="translate(930,1330)"><path d="M-48,-80 L48,-80 L36,0 L-36,0Z" fill="#2f3f9c"/>${[-60, -30, 0, 30, 60].map((a, i) => `<ellipse class="lf" cx="0" cy="-150" rx="20" ry="70" fill="${i % 2 ? '#3fbf8a' : '#2fa077'}" transform="rotate(${a} 0 -80)"/>`).join('')}</g>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t);
        Q('.city')[0].setAttribute('transform', `translate(${f(-((t * 12) % ww))},0)`);
        Q('.mh')[0].setAttribute('transform', `rotate(${f(t * 36)})`); Q('.hh')[0].setAttribute('transform', `rotate(${f(t * 3 + 120)})`);
        Q('.scr')[0].setAttribute('transform', `translate(0,${f(-((t * 40) % 220))})`);
        Q('.st').forEach((e, i) => { const q = (t * 0.7 + i * 0.33) % 1; e.setAttribute('transform', `translate(0,${f(-q * 50)})`); e.setAttribute('opacity', f(0.6 * Math.sin(q * Math.PI))) });
        Q('.pled')[0].setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.3);
        Q('.lf').forEach((e, i) => { const a = [-60, -30, 0, 30, 60][i]; e.setAttribute('transform', `rotate(${f(a + Math.sin(t * 1.4 + i) * 4)} 0 -80)`) });
        Q('.pb').forEach((e, i) => e.setAttribute('opacity', f(0.75 + 0.25 * Math.sin(t * 2 + i))));
      }
    };
  }

  // ---------- sala de casa de noche (con router wifi) ----------
  function casa(o, id) {
    const r = R(23);
    let h = `<defs>${lg(id + 'wall', [[0, '#22307a'], [1, '#141d52']])}${lg(id + 'sky', [[0, '#070c2e'], [1, '#24378a']])}${rg(id + 'lamp', '#ffd27a', 0.55)}${rg(id + 'scr', '#A9C8FF', 0.5)}<pattern id="${id}pt" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30,10 L40,30 L30,50 L20,30Z" fill="#fff" opacity=".035"/></pattern></defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}wall)"/><rect width="${W}" height="1400" fill="url(#${id}pt)"/>`;
    h += `<rect x="580" y="240" width="420" height="620" rx="8" fill="#0b1340"/><svg x="596" y="256" width="388" height="588" viewBox="0 0 388 588"><rect width="388" height="588" fill="url(#${id}sky)"/>${stars(r, 30, 380, 0, 388)}<circle cx="290" cy="110" r="44" fill="#fbeec2"/><path d="M0,520 L60,470 L120,520 L120,588 L0,588Z M150,500 L230,440 L310,500 L310,588 L150,588Z M320,530 L388,480 L388,588 L320,588Z" fill="#0d1543"/><rect class="hw" x="190" y="520" width="26" height="30" fill="${C.oro}"/><rect class="hw" x="40" y="535" width="22" height="26" fill="${C.oro}"/></svg><rect x="782" y="256" width="16" height="588" fill="#0b1340"/>`;
    h += `<path class="cu" d="M560,220 L640,220 Q620,560 660,900 L560,900Z" fill="#b98a2a"/><path class="cu2" d="M1020,220 L940,220 Q960,560 920,900 L1020,900Z" fill="#b98a2a"/><rect x="540" y="210" width="500" height="18" rx="9" fill="#3a2a1e"/>`;
    h += `<g transform="translate(110,330)"><rect width="320" height="230" rx="8" fill="#0b1340"/><rect x="14" y="14" width="292" height="202" fill="#2c4096"/><circle cx="230" cy="70" r="26" fill="${C.oro}"/><path d="M14,216 L110,110 L170,170 L210,130 L306,216Z" fill="#1b2a6b"/><path d="M110,110 L130,132 L118,140 L100,128Z" fill="#e6eeff"/></g>`;
    h += `<rect x="110" y="900" width="340" height="16" rx="6" fill="#3a2a1e"/><g transform="translate(200,848)"><rect width="170" height="52" rx="12" fill="#e6eeff"/><rect x="18" y="-50" width="8" height="54" rx="4" fill="#c9d1e8"/><rect x="144" y="-50" width="8" height="54" rx="4" fill="#c9d1e8"/>${[0, 1, 2, 3].map(i => `<circle class="led" cx="${44 + i * 26}" cy="26" r="6" fill="${i === 0 ? '#7CFFB2' : C.oro}"/>`).join('')}${[0, 1, 2].map(i => `<path class="wf" d="M${85 - 30 - i * 26},${-40 - i * 22} A${40 + i * 36},${40 + i * 36} 0 0 1 ${85 + 30 + i * 26},${-40 - i * 22}" stroke="${C.cel}" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
    h += `<circle cx="150" cy="700" r="260" fill="url(#${id}lamp)"/><rect x="144" y="700" width="12" height="720" fill="#3a2a1e"/><path d="M90,620 L210,620 L240,720 L60,720Z" fill="${C.oro}"/><ellipse cx="150" cy="1420" rx="60" ry="12" fill="#3a2a1e"/>`;
    h += `<rect x="0" y="1390" width="${W}" height="540" fill="#0f1747"/>${[...Array(8)].map((_, i) => `<rect x="0" y="${1430 + i * 60}" width="${W}" height="3" fill="#1b2a6b"/>`).join('')}<ellipse cx="560" cy="1560" rx="470" ry="90" fill="${C.oro}" opacity=".18"/>`;
    h += `<rect x="190" y="1060" width="760" height="240" rx="50" fill="#2d3f95"/><rect x="150" y="1240" width="840" height="150" rx="40" fill="#3a4fb0"/><rect x="120" y="1150" width="110" height="240" rx="45" fill="#2d3f95"/><rect x="910" y="1150" width="110" height="240" rx="45" fill="#2d3f95"/><rect x="250" y="1125" width="190" height="150" rx="30" fill="${C.oro}" transform="rotate(-8 345 1200)"/><rect x="700" y="1125" width="190" height="150" rx="30" fill="${C.cel}" transform="rotate(7 795 1200)"/><rect x="200" y="1385" width="20" height="40" fill="#0b1340"/><rect x="920" y="1385" width="20" height="40" fill="#0b1340"/>`;
    h += `<rect x="330" y="1530" width="420" height="24" rx="10" fill="#3a2a1e"/><ellipse cx="540" cy="1460" rx="200" ry="90" fill="url(#${id}scr)"/><path d="M440,1530 L640,1530 L655,1545 L425,1545Z" fill="#c9d1e8"/><path d="M455,1528 L470,1430 L610,1430 L625,1528Z" fill="#d8deef"/><path d="M470,1520 L482,1442 L598,1442 L612,1520Z" fill="#06122e"/><path class="scrl" d="M490,1500 L590,1500 M494,1484 L560,1484 M498,1468 L580,1468" stroke="${C.cel}" stroke-width="6" stroke-linecap="round"/>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t);
        Q('.led').forEach((e, i) => e.setAttribute('opacity', ((Math.floor(t * 6) + i * 3) % 5) > 1 ? 1 : 0.25));
        Q('.wf').forEach((e, i) => { const q = ((t * 1.2 - i * 0.25) % 1 + 1) % 1; e.setAttribute('opacity', f(q < 0.6 ? 1 - q : 0.15)) });
        Q('.cu')[0].setAttribute('transform', `skewX(${f(Math.sin(t * 0.8) * 1.5)})`); Q('.cu2')[0].setAttribute('transform', `skewX(${f(Math.sin(t * 0.8 + 1) * -1.5)})`);
        Q('.scrl')[0].setAttribute('opacity', f(0.6 + 0.4 * Math.sin(t * 3)));
        Q('.hw').forEach((e, i) => e.setAttribute('opacity', (Math.floor(t * 0.5) + i) % 3 ? 1 : 0.2));
      }
    };
  }

  // ---------- fachada de tienda con letrero de neón ----------
  function tienda(o, id) {
    const r = R(31); const txt = esc((o.arg || 'OFERTAS').toUpperCase());
    const fs = Math.min(90, Math.floor(520 / Math.max(4, txt.length) * 1.6));
    let h = `<defs>${lg(id + 'sky', [[0, '#070c2e'], [1, '#1b2a6b']])}${lg(id + 'in', [[0, '#3a4fb0'], [1, '#24378a']])}${rg(id + 'warm', '#ffd27a', 0.5)}${rg(id + 'sl', '#ffd27a', 0.6)}${blur(id + 'b', 12)}<clipPath id="${id}aw"><rect x="60" y="300" width="960" height="120"/></clipPath></defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}sky)"/>${stars(r, 25, 120)}<rect x="30" y="60" width="1020" height="1390" fill="#1B2A6B"/>`;
    for (let y = 80; y < 1440; y += 36) h += `<rect x="30" y="${y}" width="1020" height="2" fill="#24317a"/>`;
    h += `<rect x="250" y="168" width="580" height="112" rx="22" fill="#0b1340" stroke="#2a3a8c" stroke-width="5"/><text class="neg" x="540" y="${220 + fs * 0.36}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="${fs}" fill="${C.oro}" filter="url(#${id}b)" opacity=".8">${txt}</text><text class="neo" x="540" y="${220 + fs * 0.36}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="${fs}" fill="#fff4d6" stroke="${C.oro}" stroke-width="3">${txt}</text>`;
    h += `<g clip-path="url(#${id}aw)">${[...Array(14)].map((_, i) => `<rect x="${60 + i * 69}" y="300" width="69" height="120" fill="${i % 2 ? '#f4f1e8' : C.oro}"/>`).join('')}</g>${[...Array(14)].map((_, i) => `<path d="M${60 + i * 69},418 a34.5,28 0 0 0 69,0Z" fill="${i % 2 ? '#f4f1e8' : C.oro}"/>`).join('')}<rect x="50" y="290" width="980" height="16" rx="8" fill="#0b1340"/>`;
    h += `<rect x="80" y="470" width="920" height="960" rx="10" fill="#0b1340"/><rect x="96" y="486" width="888" height="928" fill="url(#${id}in)"/><ellipse cx="540" cy="800" rx="460" ry="420" fill="url(#${id}warm)"/>`;
    const shelf = (y) => { let s = `<rect x="96" y="${y}" width="888" height="12" fill="#0b1340"/>`, x = 120; while (x < 900) { const k = Math.floor(r() * 3), w = 60 + r() * 60; if (k === 0) { const hh = 50 + r() * 70; s += `<rect x="${f(x)}" y="${f(y - hh)}" width="${f(w)}" height="${f(hh)}" rx="6" fill="${[C.cel, '#e6eeff', '#5b7fd6'][Math.floor(r() * 3)]}"/><rect x="${f(x + 10)}" y="${f(y - hh + 12)}" width="${f(w - 20)}" height="10" rx="5" fill="${C.navy2}" opacity=".5"/>` } else if (k === 1) { s += `<path d="M${f(x)},${y} L${f(x + 8)},${y - 90} L${f(x + w - 8)},${y - 90} L${f(x + w)},${y}Z" fill="${C.oro}"/><path d="M${f(x + w * 0.3)},${y - 90} q${f(w * 0.2)},-40 ${f(w * 0.4)},0" stroke="#0b1340" stroke-width="6" fill="none"/>` } else { s += `<rect x="${f(x)}" y="${y - 40}" width="${f(w)}" height="40" rx="18" fill="#f4f1e8"/><rect x="${f(x)}" y="${y - 14}" width="${f(w)}" height="14" rx="6" fill="${C.navy}"/>` } x += w + 18 } return s };
    h += shelf(760) + shelf(1060) + shelf(1400);
    h += [[180, 520], [900, 530]].map(([x, y], i) => `<g class="tag" data-x="${x}" data-y="${y}"><line x1="0" y1="-40" x2="0" y2="0" stroke="#e6eeff" stroke-width="3"/><path d="M-40,0 L40,0 L40,60 L0,84 L-40,60Z" fill="${i === 1 ? '#ff5a5a' : C.oro}"/><text x="0" y="52" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="40" fill="#fff">%</text></g>`).join('');
    h += `<path class="gl" d="M180,486 L300,486 L140,1414 L20,1414Z" fill="#fff" opacity=".06"/><path class="gl" d="M420,486 L470,486 L310,1414 L260,1414Z" fill="#fff" opacity=".05"/>`;
    h += `<rect x="0" y="1430" width="${W}" height="500" fill="#0c1238"/><rect x="0" y="1430" width="${W}" height="14" fill="#24317a"/><rect x="1030" y="1000" width="14" height="540" fill="#0b1340"/><circle cx="1037" cy="1010" r="170" fill="url(#${id}sl)"/><rect x="1016" y="994" width="42" height="14" rx="6" fill="#ffe6a6"/>`;
    h += `<g transform="translate(160,1560)"><path d="M0,0 L10,-120 L120,-120 L130,0Z" fill="${C.oro}"/><path d="M38,-120 q27,-50 54,0" stroke="#0b1340" stroke-width="8" fill="none"/><path d="M110,10 L118,-90 L210,-90 L218,10Z" fill="${C.cel}"/><path d="M142,-90 q22,-40 44,0" stroke="#0b1340" stroke-width="7" fill="none"/></g>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t);
        const fl = (Math.floor(t * 8) % 23 === 0) ? 0.35 : 1; Q('.neo')[0].setAttribute('opacity', fl); Q('.neg')[0].setAttribute('opacity', f((0.55 + 0.3 * Math.sin(t * 4)) * fl));
        Q('.tag').forEach((e, i) => e.setAttribute('transform', `translate(${e.dataset.x},${e.dataset.y}) rotate(${f(Math.sin(t * 1.8 + i * 1.3) * 9)} 0 -40)`));
        Q('.gl').forEach((e, i) => e.setAttribute('transform', `translate(${f(((t * 90 + i * 300) % 1300) - 300)},0)`));
      }
    };
  }

  // ---------- bodega / centro logístico con banda y dron ----------
  function bodega(o, id) {
    const r = R(41);
    let h = `<defs>${lg(id + 'wall', [[0, '#1a2563'], [1, '#121a4e']])}${lg(id + 'cone', [[0, '#e6eeff', 0.3], [1, '#e6eeff', 0]])}<pattern id="${id}hz" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="30" height="60" fill="${C.oro}"/><rect x="30" width="30" height="60" fill="#0b1340"/></pattern></defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}wall)"/><rect x="0" y="80" width="${W}" height="110" fill="${C.cel}" opacity=".12"/>${[...Array(9)].map((_, i) => `<rect x="${i * 126}" y="80" width="10" height="110" fill="#121a4e"/>`).join('')}`;
    for (const x of [30, 380, 730]) h += `<rect x="${x}" y="330" width="18" height="950" fill="#2f3f9c"/><rect x="${x + 302}" y="330" width="18" height="950" fill="#2f3f9c"/>`;
    for (const y of [520, 740, 960, 1180]) {
      h += `<rect x="30" y="${y}" width="1020" height="16" fill="${C.oro}"/>`;
      let x = 50; while (x < 1030) { const w = 70 + r() * 90, hh = 60 + r() * 110; if (x + w > 1040) break; const c = ['#c98a4b', '#b8783c', '#d9a066'][Math.floor(r() * 3)]; h += `<rect x="${f(x)}" y="${f(y - hh)}" width="${f(w)}" height="${f(hh)}" fill="${c}"/><rect x="${f(x + w / 2 - 6)}" y="${f(y - hh)}" width="12" height="${f(hh)}" fill="#e8c48a" opacity=".6"/>${r() > 0.6 ? `<rect x="${f(x + 10)}" y="${f(y - hh * 0.55)}" width="${f(w * 0.35)}" height="${f(hh * 0.25)}" fill="#f4f1e8"/>` : ''}`; x += w + 8 + r() * 14 }
    }
    for (const x of [200, 540, 880]) h += `<g class="lamp" data-x="${x}"><line x1="0" y1="0" x2="0" y2="230" stroke="#0b1340" stroke-width="4"/><path d="M-50,280 L50,280 L30,230 L-30,230Z" fill="#2f3f9c"/><polygon points="-45,280 45,280 170,820 -170,820" fill="url(#${id}cone)"/><ellipse cx="0" cy="282" rx="40" ry="8" fill="#fff6d6"/></g>`;
    h += `<rect x="0" y="1290" width="${W}" height="640" fill="#0f1747"/><rect x="0" y="1520" width="${W}" height="36" fill="url(#${id}hz)" opacity=".8"/>`;
    h += `<rect x="-20" y="1320" width="1120" height="46" rx="23" fill="#0b1340"/>${[...Array(12)].map((_, i) => `<circle class="rol" cx="${20 + i * 94}" cy="1343" r="16" fill="#2a3a8c" stroke="#3b52b8" stroke-width="4" stroke-dasharray="10 6"/>`).join('')}${[100, 400, 700, 1000].map(x => `<rect x="${x}" y="1366" width="18" height="150" fill="#2a3a8c"/>`).join('')}`;
    h += [...Array(5)].map((_, i) => { const w = 90 + (i % 3) * 30, hh = 80 + (i % 2) * 40; return `<g class="cb" data-x="${i * 280}"><rect x="0" y="${-hh}" width="${w}" height="${hh}" fill="${i % 2 ? '#c98a4b' : '#d9a066'}"/><rect x="${w / 2 - 6}" y="${-hh}" width="12" height="${hh}" fill="#e8c48a" opacity=".7"/><rect x="10" y="${-hh / 2}" width="${w * 0.35}" height="${hh * 0.25}" fill="#f4f1e8"/></g>` }).join('');
    h += `<g class="dr"><rect x="-60" y="-14" width="120" height="28" rx="14" fill="#e6eeff"/><rect x="-20" y="-6" width="40" height="12" rx="6" fill="${C.cel}"/>${[-90, 90].map(x => `<line x1="0" y1="0" x2="${x}" y2="-22" stroke="#e6eeff" stroke-width="8"/><ellipse class="rt" cx="${x}" cy="-28" rx="48" ry="7" fill="${C.cel}" opacity=".8"/>`).join('')}<line x1="0" y1="14" x2="0" y2="50" stroke="#e6eeff" stroke-width="4"/><rect x="-38" y="50" width="76" height="60" fill="#d9a066"/><rect x="-6" y="50" width="12" height="60" fill="#e8c48a"/></g>`;
    return {
      svg: h, upd(Q, lt, t) {
        Q('.lamp').forEach((e, i) => e.setAttribute('transform', `translate(${e.dataset.x},0) rotate(${f(Math.sin(t * 0.9 + i) * 2.5)})`));
        Q('.cb').forEach((e) => e.setAttribute('transform', `translate(${f(((+e.dataset.x + t * 120) % 1400) - 200)},1320)`));
        Q('.rol').forEach((e, i) => e.setAttribute('stroke-dashoffset', f(-t * 60)));
        const x = ((t * 120) % 1500) - 200; Q('.dr')[0].setAttribute('transform', `translate(${f(x)},${f(250 + Math.sin(t * 1.6) * 22)}) rotate(${f(Math.sin(t * 1.6) * 3)})`);
        Q('.rt').forEach((e, i) => e.setAttribute('rx', f(10 + 40 * Math.abs(Math.sin(t * 40 + i)))));
      }
    };
  }

  // ---------- espacio: Tierra, satélite y estrellas ----------
  function espacio(o, id) {
    const r = R(53);
    let h = `<defs>${lg(id + 'bg', [[0, '#03061c'], [1, '#101943']])}${lg(id + 'e', [[0, '#3d7be0'], [0.5, '#1d47a8'], [1, '#0d2160']])}${rg(id + 'n1', '#6a4fc8', 0.45)}${rg(id + 'n2', C.cel, 0.3)}${rg(id + 'n3', C.oro, 0.18)}${blur(id + 'b', 22)}<clipPath id="${id}ec"><circle cx="540" cy="2420" r="1160"/></clipPath></defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}bg)"/><ellipse cx="250" cy="500" rx="520" ry="300" fill="url(#${id}n1)"/><ellipse cx="850" cy="900" rx="480" ry="320" fill="url(#${id}n2)"/><ellipse cx="600" cy="300" rx="400" ry="200" fill="url(#${id}n3)"/>${stars(r, 150, H)}`;
    h += `<g transform="translate(860,330)"><circle r="80" fill="#c9d1e8"/><circle cx="-24" cy="-18" r="16" fill="#a9b3cf"/><circle cx="22" cy="20" r="22" fill="#a9b3cf"/><circle cx="30" cy="-30" r="9" fill="#a9b3cf"/><circle r="80" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/></g>`;
    h += `<line class="ss" x1="0" y1="0" x2="160" y2="60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
    h += `<circle cx="540" cy="2420" r="1180" fill="none" stroke="${C.cel}" stroke-width="40" opacity=".55" filter="url(#${id}b)"/><circle cx="540" cy="2420" r="1160" fill="url(#${id}e)"/>`;
    let land = ''; for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const x = k * 1400 + i * 160 + r() * 60, y = 1300 + r() * 380; land += `<path d="M${f(x)},${f(y)} q${f(60 + r() * 80)},-${f(40 + r() * 50)} ${f(160 + r() * 100)},0 q${f(30 + r() * 40)},${f(50 + r() * 60)} -${f(60 + r() * 60)},${f(90 + r() * 80)} q-${f(90 + r() * 60)},${f(20 + r() * 30)} -${f(120 + r() * 60)},-${f(80 + r() * 60)}Z" fill="#5fd0a0" opacity=".55"/>` }
    let cl = ''; for (let i = 0; i < 14; i++) cl += `<ellipse cx="${f(r() * 2800)}" cy="${f(1290 + r() * 420)}" rx="${f(60 + r() * 110)}" ry="${f(10 + r() * 14)}" fill="#fff" opacity=".35"/>`;
    let lights = ''; for (let i = 0; i < 70; i++) lights += `<circle cx="${f(r() * 2800)}" cy="${f(1500 + r() * 400)}" r="${f(1.5 + r() * 2.5)}" fill="${C.oro}" opacity=".8"/>`;
    h += `<g clip-path="url(#${id}ec)"><g class="land">${land}${lights}</g><g class="clouds">${cl}</g></g>`;
    h += `<g class="sat"><rect x="-26" y="-20" width="52" height="40" rx="6" fill="${C.oro}"/><rect x="-14" y="-28" width="28" height="10" fill="#c9d1e8"/><rect x="-130" y="-16" width="96" height="32" fill="#2c4fb5" stroke="${C.cel}" stroke-width="3"/><rect x="34" y="-16" width="96" height="32" fill="#2c4fb5" stroke="${C.cel}" stroke-width="3"/>${[-106, -82, -58, 58, 82, 106].map(x => `<line x1="${x}" y1="-16" x2="${x}" y2="16" stroke="${C.cel}" stroke-width="2"/>`).join('')}<line x1="-34" y1="0" x2="34" y2="0" stroke="#c9d1e8" stroke-width="4"/><path d="M0,20 L0,40 M-14,52 A20,20 0 0 0 14,52" stroke="#e6eeff" stroke-width="4" fill="none"/><circle class="sl" cx="0" cy="-34" r="5" fill="#ff5a5a"/></g>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t);
        Q('.land')[0].setAttribute('transform', `translate(${f(-((t * 18) % 1400))},0)`); Q('.clouds')[0].setAttribute('transform', `translate(${f(-((t * 30) % 1400))},0)`);
        const a = t * 0.32; Q('.sat')[0].setAttribute('transform', `translate(${f(540 + 520 * Math.cos(a))},${f(820 + 200 * Math.sin(a))}) rotate(${f(-20 + Math.sin(a) * 15)}) scale(${f(1.05 + 0.25 * Math.sin(a))})`);
        Q('.sl')[0].setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2);
        const q = (t % 5) / 1.2; const ss = Q('.ss')[0]; ss.setAttribute('opacity', q < 1 ? f(1 - q) : 0); ss.setAttribute('transform', `translate(${f(80 + q * 500)},${f(140 + q * 190)})`);
      }
    };
  }

  // ---------- fondo del mar con cable submarino ----------
  function oceano(o, id) {
    const r = R(61);
    let h = `<defs>${lg(id + 'w', [[0, '#2a6ad6'], [0.45, '#163a9a'], [1, '#081040']])}${lg(id + 'ray', [[0, '#fff', 0.22], [1, '#fff', 0]])}${blur(id + 'b', 10)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}w)"/>`;
    h += [80, 330, 560, 800].map((x, i) => `<polygon class="ray" points="${x},-20 ${x + 120},-20 ${x + 320},1500 ${x + 120},1500" fill="url(#${id}ray)" opacity=".6"/>`).join('');
    h += `<g class="wh" opacity=".22"><path d="M0,0 C80,-70 300,-80 420,-20 C470,0 500,-10 540,-50 L560,-40 L530,20 L560,70 L540,80 C500,40 470,40 420,50 C300,110 90,90 0,0Z" fill="#0b1652"/><circle cx="70" cy="-10" r="6" fill="#9fb3e6"/></g>`;
    let fish = ''; for (let i = 0; i < 14; i++) { const s = 0.6 + r() * 0.8, c = [C.oro, C.cel, '#f4f1e8'][i % 3]; fish += `<g class="fish" data-x="${f(r() * 1300)}" data-y="${f(300 + r() * 1000)}" data-v="${f(40 + r() * 70)}" data-s="${f(s)}"><ellipse cx="0" cy="0" rx="34" ry="16" fill="${c}"/><path d="M-30,0 L-56,-16 L-56,16Z" fill="${c}"/><circle cx="18" cy="-4" r="3.5" fill="#0b1340"/></g>` } h += fish;
    h += `<path d="M-20,1560 Q200,1500 420,1560 T860,1550 T1100,1540 L1100,${H} L-20,${H}Z" fill="#1a2766"/><path d="M-20,1640 Q260,1590 560,1650 T1100,1630 L1100,${H} L-20,${H}Z" fill="#141d55"/>`;
    h += [[120, 1600, 90, 40], [880, 1590, 120, 50], [520, 1660, 70, 30]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#0e1645"/>`).join('');
    h += [60, 200, 330, 760, 920, 1010].map((x, i) => `<path class="sw" data-x="${x}" d="M0,0 C-30,-90 30,-170 0,-260 C-26,-330 20,-380 0,-440" stroke="${i % 2 ? '#2fae8a' : '#3fbf8a'}" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('');
    h += [[250, 1580], [680, 1600]].map(([x, y]) => `<g transform="translate(${x},${y})"><path d="M0,0 L0,-120 M0,-60 L-40,-110 M0,-80 L36,-130 M-40,-110 L-50,-150 M36,-130 L30,-170" stroke="${C.oro}" stroke-width="14" stroke-linecap="round" fill="none"/></g>`).join('');
    const cab = 'M-60,1612 C260,1570 600,1680 1140,1600';
    h += `<path d="${cab}" stroke="#05091f" stroke-width="26" fill="none"/><path d="${cab}" stroke="#2f3f9c" stroke-width="12" fill="none"/><path class="cp" d="${cab}" stroke="${C.oro}" stroke-width="10" fill="none" stroke-linecap="round"/><path class="cp2" d="${cab}" stroke="${C.cel}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    let bub = ''; for (let i = 0; i < 30; i++) bub += `<circle class="bb" data-x="${f(r() * W)}" data-y="${f(r() * H)}" data-v="${f(50 + r() * 90)}" r="${f(4 + r() * 10)}" fill="none" stroke="#e6eeff" stroke-width="2.5" opacity=".5"/>`; h += bub;
    return {
      svg: h, upd(Q, lt, t) {
        Q('.ray').forEach((e, i) => e.setAttribute('transform', `skewX(${f(Math.sin(t * 0.5 + i) * 4)})`));
        Q('.fish').forEach((e, i) => { const x = ((+e.dataset.x + t * +e.dataset.v) % 1300) - 110; e.setAttribute('transform', `translate(${f(x)},${f(+e.dataset.y + Math.sin(t * 1.5 + i) * 18)}) scale(${e.dataset.s})`) });
        Q('.wh')[0].setAttribute('transform', `translate(${f(((t * 25) % 1800) - 600)},${f(700 + Math.sin(t * 0.5) * 30)}) scale(1.3)`);
        Q('.sw').forEach((e, i) => e.setAttribute('transform', `translate(${e.dataset.x},${1600 + (i % 3) * 10}) rotate(${f(Math.sin(t * 1.2 + i) * 6)})`));
        Q('.bb').forEach((e) => { const y = ((+e.dataset.y - t * +e.dataset.v) % H + H) % H; e.setAttribute('transform', `translate(${f(+e.dataset.x + Math.sin(t * 2 + y / 100) * 10)},${f(y)})`) });
        const cp = Q('.cp')[0], cp2 = Q('.cp2')[0]; if (!cp._l) { cp._l = cp.getTotalLength() } const L = cp._l;
        cp.style.strokeDasharray = `70 ${L}`; cp.style.strokeDashoffset = f(70 - ((t * 420) % (L + 70)));
        cp2.style.strokeDasharray = `40 ${L}`; cp2.style.strokeDashoffset = f(40 - ((t * 420 + L / 2) % (L + 70)));
      }
    };
  }

  // ---------- bóveda de seguridad (ciberseguridad) ----------
  function boveda(o, id) {
    let h = `<defs>${lg(id + 'wall', [[0, '#1c2866'], [1, '#111a4c']])}${lg(id + 'fl', [[0, '#1b2a6b'], [1, '#080e30']])}${rg(id + 'g', C.oro, 0.35)}${blur(id + 'b', 6)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}wall)"/>`;
    for (let y = 0; y < 1460; y += 240) for (let x = 0; x < W; x += 270) h += `<rect x="${x + 6}" y="${y + 6}" width="258" height="228" rx="8" fill="#1a2560" stroke="#24317a" stroke-width="3"/>${[[18, 18], [246, 18], [18, 216], [246, 216]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="5" fill="#2f3f9c"/>`).join('')}`;
    h += `<rect x="0" y="1460" width="${W}" height="460" fill="url(#${id}fl)"/>`;
    h += `<circle cx="540" cy="780" r="560" fill="url(#${id}g)"/><g transform="translate(540,780)" opacity=".95"><rect x="380" y="-260" width="80" height="120" rx="12" fill="#24317a"/><rect x="380" y="140" width="80" height="120" rx="12" fill="#24317a"/><circle r="430" fill="#0b1340"/><circle r="410" fill="#2f3f9c" stroke="#3b52b8" stroke-width="10"/><circle r="330" fill="#24317a" stroke="#1b2a6b" stroke-width="14"/><circle r="250" fill="none" stroke="#3b52b8" stroke-width="4"/>${[...Array(16)].map((_, i) => { const a = i * Math.PI / 8; return `<circle cx="${f(370 * Math.cos(a))}" cy="${f(370 * Math.sin(a))}" r="16" fill="${C.cel}"/>` }).join('')}<g class="whl">${[0, 120, 240].map(a => `<g transform="rotate(${a})"><rect x="-12" y="-230" width="24" height="230" rx="12" fill="${C.oro}"/><circle cx="0" cy="-236" r="30" fill="${C.oro}"/></g>`).join('')}<circle r="80" fill="${C.oro}"/><circle r="50" fill="#b98a2a"/><circle r="18" fill="#0b1340"/></g></g>`;
    h += `<g transform="translate(960,1260)"><rect x="-56" y="-90" width="112" height="180" rx="14" fill="#0b1340" stroke="#3b52b8" stroke-width="4"/>${[...Array(9)].map((_, i) => `<rect x="${-38 + (i % 3) * 28}" y="${-50 + Math.floor(i / 3) * 34}" width="20" height="24" rx="4" fill="#2f3f9c"/>`).join('')}<circle class="kp" cx="0" cy="-70" r="7" fill="#7CFFB2"/></g>`;
    h += [...Array(5)].map((_, i) => `<line class="lz" x1="-40" y1="${1330 + i * 70}" x2="1120" y2="${1250 + i * 90}" stroke="#ff5a5a" stroke-width="4" opacity=".6" filter="url(#${id}b)"/><line class="lz2" x1="-40" y1="${1330 + i * 70}" x2="1120" y2="${1250 + i * 90}" stroke="#ffb0b0" stroke-width="2"/>`).join('');
    return {
      svg: h, upd(Q, lt, t) {
        Q('.whl')[0].setAttribute('transform', `rotate(${f(Math.sin(t * 0.6) * 40)})`);
        Q('.kp')[0].setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.25);
        Q('.lz').forEach((e, i) => { e.setAttribute('transform', `translate(0,${f(Math.sin(t * 0.8 + i) * 40)})`); e.setAttribute('opacity', f(0.4 + 0.3 * Math.sin(t * 5 + i))) });
        Q('.lz2').forEach((e, i) => e.setAttribute('transform', `translate(0,${f(Math.sin(t * 0.8 + i) * 40)})`));
      }
    };
  }

  // ---------- garaje (origen de empresas tech) ----------
  function garaje(o, id) {
    const r = R(71);
    let h = `<defs>${lg(id + 'wall', [[0, '#1f2c70'], [1, '#141d55']])}${lg(id + 'sun', [[0, '#1b2a6b'], [0.55, '#6b3f8f'], [1, C.oro]])}${rg(id + 'bulb', '#ffd27a', 0.55)}${rg(id + 'scr', '#7CFFB2', 0.3)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}wall)"/>${[...Array(30)].map((_, i) => `<rect x="0" y="${i * 46}" width="${W}" height="2" fill="#2a3a8c" opacity=".5"/>`).join('')}`;
    h += `<rect x="190" y="230" width="700" height="760" fill="#0b1340"/><svg x="206" y="246" width="668" height="744" viewBox="0 0 668 744"><rect width="668" height="744" fill="url(#${id}sun)"/>${stars(r, 20, 200, 0, 668)}<circle cx="334" cy="620" r="130" fill="#ffd27a"/><path d="M0,560 L90,500 L180,560 L180,744 L0,744Z M470,540 L570,470 L668,540 L668,744 L470,744Z" fill="#141d55"/><rect class="hl" x="60" y="600" width="40" height="44" fill="${C.oro}"/><rect class="hl" x="540" y="580" width="40" height="44" fill="${C.oro}"/><g transform="translate(410,744)"><path d="M0,0 C6,-120 -4,-220 10,-330" stroke="#0e1645" stroke-width="16" fill="none"/><g class="palm" transform="translate(10,-330)">${[-150, -110, -60, -20, 30].map(a => `<path d="M0,0 Q60,-30 120,10 Q60,-10 0,0Z" fill="#0e1645" transform="rotate(${a}) scale(1.3)"/>`).join('')}</g></g><path d="M200,744 L290,600 L380,600 L470,744Z" fill="#2a3a8c" opacity=".6"/></svg>`;
    h += `<g class="door">${[...Array(4)].map((_, i) => `<rect x="190" y="${230 + i * 34}" width="700" height="32" fill="#2f3f9c" stroke="#24317a" stroke-width="3"/>`).join('')}</g>`;
    h += `<rect x="20" y="330" width="150" height="560" rx="8" fill="#c9a36b"/>${[...Array(60)].map((_, i) => `<circle cx="${38 + (i % 6) * 23}" cy="${350 + Math.floor(i / 6) * 52}" r="4" fill="#8a6a3a"/>`).join('')}<path d="M60,400 L60,520 M45,400 L75,400" stroke="#3b52b8" stroke-width="12" stroke-linecap="round"/><path d="M120,420 L120,560 M100,420 L140,420 L140,445 L100,445Z" stroke="#1b2a6b" stroke-width="10" fill="#1b2a6b" stroke-linejoin="round"/><path d="M95,640 L95,800" stroke="#24317a" stroke-width="14" stroke-linecap="round"/><circle cx="95" cy="630" r="22" fill="none" stroke="#24317a" stroke-width="10"/>`;
    h += `<rect x="910" y="380" width="150" height="14" fill="#3a2a1e"/><rect x="910" y="600" width="150" height="14" fill="#3a2a1e"/><rect x="925" y="300" width="60" height="80" fill="#c98a4b"/><rect x="990" y="320" width="50" height="60" fill="#d9a066"/><rect x="925" y="530" width="44" height="70" rx="6" fill="${C.cel}"/><rect x="980" y="540" width="44" height="60" rx="6" fill="${C.oro}"/>`;
    h += `<rect x="0" y="1330" width="${W}" height="600" fill="#111a4c"/><ellipse cx="700" cy="1560" rx="160" ry="30" fill="#0b1340" opacity=".7"/>`;
    h += `<rect x="40" y="1220" width="1000" height="36" fill="#8a5a2b"/><rect x="70" y="1256" width="26" height="200" fill="#6b4423"/><rect x="984" y="1256" width="26" height="200" fill="#6b4423"/><rect x="60" y="1380" width="960" height="18" fill="#6b4423"/>`;
    h += `<ellipse cx="340" cy="1080" rx="240" ry="170" fill="url(#${id}scr)"/><rect x="170" y="1140" width="340" height="80" rx="10" fill="#d8c9a3"/><rect x="200" y="1160" width="120" height="12" rx="6" fill="#a8956a"/><rect x="210" y="930" width="260" height="210" rx="20" fill="#d8c9a3"/><rect x="232" y="950" width="216" height="160" rx="10" fill="#06122e"/><svg x="240" y="956" width="200" height="148" viewBox="0 0 200 148"><g class="scr">${screenText(6, 8, 170, 16, '#7CFFB2')}</g></svg><rect x="180" y="1196" width="300" height="20" rx="5" fill="#c4b68f"/>`;
    h += `<rect x="560" y="1170" width="150" height="50" rx="6" fill="#2fa077"/>${[...Array(6)].map((_, i) => `<rect x="${572 + i * 22}" y="1182" width="12" height="12" fill="#0b1340"/>`).join('')}<path d="M760,1220 L800,1120 L830,1120" stroke="#c9d1e8" stroke-width="8" fill="none"/>`;
    h += `<rect x="760" y="1100" width="120" height="120" fill="#c98a4b"/><rect x="880" y="1130" width="110" height="90" fill="#d9a066"/><rect x="790" y="1010" width="130" height="90" fill="#b8783c"/><rect x="814" y="1040" width="60" height="20" fill="#f4f1e8"/>`;
    h += `<g class="bulb"><line x1="0" y1="0" x2="0" y2="330" stroke="#0b1340" stroke-width="5"/><circle cx="0" cy="390" r="230" fill="url(#${id}bulb)"/><rect x="-14" y="330" width="28" height="26" fill="#7d8bb0"/><circle cx="0" cy="374" r="26" fill="#fff1c2"/></g>`;
    return {
      svg: h, upd(Q, lt, t) {
        twinkle(Q, t);
        Q('.bulb')[0].setAttribute('transform', `translate(540,0) rotate(${f(Math.sin(t * 1.1) * 4)})`);
        Q('.scr')[0].setAttribute('transform', `translate(0,${f(-((t * 30) % 160))})`);
        Q('.palm')[0].setAttribute('transform', `translate(10,-330) rotate(${f(Math.sin(t * 0.9) * 4)})`);
        Q('.hl').forEach((e, i) => e.setAttribute('opacity', (Math.floor(t * 0.6) + i) % 3 ? 1 : 0.3));
      }
    };
  }

  // ---------- cielo con nubes y avión (la nube, viajes, conectividad) ----------
  function cielo(o, id) {
    const r = R(83);
    let h = `<defs>${lg(id + 'sky', [[0, '#1d3f9e'], [0.5, '#3f6fd6'], [1, '#9fc0ff']])}${rg(id + 'sun', '#ffe08a', 0.7)}</defs>`;
    h += `<rect width="${W}" height="${H}" fill="url(#${id}sky)"/><circle cx="820" cy="380" r="260" fill="url(#${id}sun)"/><circle cx="820" cy="380" r="90" fill="#ffe7a3"/>`;
    const cloud = (s, o2) => `<g opacity="${o2}"><circle cx="0" cy="0" r="${60 * s}" fill="#fff"/><circle cx="${70 * s}" cy="${-30 * s}" r="${75 * s}" fill="#fff"/><circle cx="${150 * s}" cy="0" r="${60 * s}" fill="#fff"/><rect x="0" y="0" width="${150 * s}" height="${60 * s}" fill="#fff"/><rect x="${-60 * s}" y="0" width="${270 * s}" height="${60 * s}" rx="${30 * s}" fill="#fff"/></g>`;
    let cl = ''; for (let i = 0; i < 12; i++) { const s = 0.5 + r() * 1.2; cl += `<g class="cl" data-x="${f(r() * 1500)}" data-y="${f(200 + r() * 1500)}" data-v="${f(8 + s * 18)}">${cloud(s, f(0.35 + s * 0.35))}</g>` } h += cl;
    h += `<path d="M-20,1700 Q260,1600 540,1680 T1100,1650 L1100,${H} L-20,${H}Z" fill="#e6eeff" opacity=".9"/><path d="M-20,1780 Q300,1720 600,1790 T1100,1760 L1100,${H} L-20,${H}Z" fill="#fff"/>`;
    h += `<g class="pl"><line class="ctr" x1="-600" y1="0" x2="-60" y2="0" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5"/><path d="M-70,-10 L60,-10 Q90,-8 96,0 Q90,8 60,10 L-70,10Z" fill="#f4f6ff"/><path d="M-10,-8 L-40,-70 L-20,-70 L30,-8Z M-10,8 L-40,70 L-20,70 L30,8Z" fill="#dfe6f7"/><path d="M-66,-8 L-84,-40 L-70,-40 L-50,-8Z" fill="${C.oro}"/>${[0, 1, 2, 3].map(i => `<circle cx="${-30 + i * 20}" cy="-2" r="3" fill="${C.navy2}"/>`).join('')}</g>`;
    h += [...Array(5)].map((_, i) => `<path class="bd" data-i="${i}" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" stroke="#0b1340" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
    return {
      svg: h, upd(Q, lt, t) {
        Q('.cl').forEach(e => e.setAttribute('transform', `translate(${f(((+e.dataset.x + t * +e.dataset.v) % 1500) - 300)},${e.dataset.y})`));
        Q('.pl')[0].setAttribute('transform', `translate(${f(((t * 140) % 1800) - 300)},${f(620 - ((t * 140) % 1800) * 0.12)}) rotate(-7)`);
        Q('.bd').forEach((e, i) => { const x = ((t * 60 + i * 50) % 1400) - 200; e.setAttribute('transform', `translate(${f(x)},${f(900 + i * 30 + Math.sin(t * 2 + i) * 10)}) scale(1,${f(0.6 + 0.6 * Math.abs(Math.sin(t * 8 + i)))})`) });
      }
    };
  }

  const LIST = {
    montanas: (o, id) => mountains(o, id, false),
    vikingo: (o, id) => mountains(o, id, true),
    oficina, casa, tienda, bodega, espacio, oceano, boveda, garaje, cielo,
  };
  let n = 0;
  window.ESCENAS = {
    has: k => !!LIST[String(k).split(':')[0]],
    names: Object.keys(LIST),
    build(kind) {
      const [name, ...rest] = String(kind).split(':'); const id = 'esc' + (n++) + '_';
      const sc = LIST[name]({ arg: rest.join(':') }, id);
      const L = document.createElement('div'); L.className = 'bgl esc';
      L.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;width:${W}px;height:${H}px" xmlns="http://www.w3.org/2000/svg"><g class="cam">${sc.svg}</g></svg>`;
      const cache = {}; const Q = s => cache[s] || (cache[s] = [...L.querySelectorAll(s)]);
      const cam = L.querySelector('.cam');
      return { L, upd: (lt, t) => { cam.setAttribute('transform', camOf(lt)); sc.upd(Q, lt, t) } };
    }
  };
})();

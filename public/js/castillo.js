/* =============================================================================
   castillo.js — El plano de Hogwarts del Mapa del Merodeador

     - Salas, pasillos y puertas (rectángulos en píxeles del mundo)
     - Rejilla de celdas caminables (colisiones)
     - Dibujo del plano en SVG: suelos, paredes en tinta dorada, nombres y
       decorados de cada sala

   Las paredes se calculan a partir de la rejilla: aparecen solo donde una
   celda caminable toca otra que no lo es, así que lo dibujado siempre
   coincide con lo que se puede atravesar. Entre dos salas hay siempre un
   hueco de pared y solo se pasa por las puertas.
   ============================================================================= */

(function () {
  'use strict';

  const ANCHO = 2400;
  const ALTO = 1800;
  const CELDA = 20;

  const SALAS = [
    { id: 'comun-gryffindor', nombre: 'Sala común de Gryffindor', x: 120, y: 100, w: 400, h: 280 },
    { id: 'despacho', nombre: 'Despacho del director', x: 1020, y: 80, w: 360, h: 260 },
    { id: 'torre-ravenclaw', nombre: 'Torre de Ravenclaw', x: 1880, y: 100, w: 400, h: 280 },
    { id: 'biblioteca', nombre: 'Biblioteca', x: 340, y: 620, w: 480, h: 380 },
    { id: 'gran-comedor', nombre: 'Gran Comedor', x: 960, y: 620, w: 480, h: 420 },
    { id: 'bano-myrtle', nombre: 'Baño de Myrtle la Llorona', x: 1600, y: 620, w: 380, h: 280 },
    { id: 'trofeos', nombre: 'Sala de los trofeos', x: 340, y: 1080, w: 480, h: 160 },
    { id: 'vestibulo', nombre: 'Vestíbulo', x: 1060, y: 1080, w: 280, h: 160 },
    { id: 'enfermeria', nombre: 'Enfermería', x: 1600, y: 980, w: 380, h: 260 },
    { id: 'mazmorras', nombre: 'Mazmorras', x: 140, y: 1460, w: 620, h: 280 },
    { id: 'patio', nombre: 'Patio del reloj', x: 900, y: 1460, w: 600, h: 280 },
    { id: 'invernaderos', nombre: 'Invernaderos', x: 1640, y: 1460, w: 620, h: 280 },
  ];
  const PASILLOS = [
    { x: 120, y: 440, w: 2160, h: 100 },   // pasillo norte
    { x: 120, y: 1300, w: 2160, h: 100 },  // pasillo sur
    { x: 120, y: 540, w: 120, h: 760 },    // pasillo oeste
    { x: 2160, y: 540, w: 120, h: 760 },   // pasillo este
  ];
  const PUERTAS = [
    { x: 280, y: 380, w: 80, h: 60 },      // Gryffindor ↔ norte (retrato de la Dama Gorda)
    { x: 1160, y: 340, w: 80, h: 100 },    // Despacho ↔ norte (escalera de la gárgola)
    { x: 2040, y: 380, w: 80, h: 60 },     // Ravenclaw ↔ norte
    { x: 1160, y: 540, w: 80, h: 80 },     // norte ↔ Gran Comedor
    { x: 240, y: 760, w: 100, h: 80 },     // oeste ↔ Biblioteca
    { x: 820, y: 800, w: 140, h: 60 },     // Biblioteca ↔ Gran Comedor
    { x: 1440, y: 720, w: 160, h: 60 },    // Gran Comedor ↔ Baño de Myrtle
    { x: 1980, y: 700, w: 180, h: 80 },    // Baño de Myrtle ↔ este
    { x: 1160, y: 1040, w: 80, h: 40 },    // Gran Comedor ↔ Vestíbulo
    { x: 240, y: 1120, w: 100, h: 80 },    // oeste ↔ Trofeos
    { x: 1980, y: 1080, w: 180, h: 80 },   // Enfermería ↔ este
    { x: 1160, y: 1240, w: 80, h: 60 },    // Vestíbulo ↔ sur
    { x: 400, y: 1400, w: 80, h: 60 },     // sur ↔ Mazmorras
    { x: 1160, y: 1400, w: 80, h: 60 },    // sur ↔ Patio
    { x: 1900, y: 1400, w: 80, h: 60 },    // sur ↔ Invernaderos
  ];

  /* --------------------------------------------------------------------------
     Rejilla de colisiones
     -------------------------------------------------------------------------- */
  const COLS = ANCHO / CELDA;
  const FILAS = ALTO / CELDA;
  const rejilla = new Uint8Array(COLS * FILAS);
  for (const r of [...SALAS, ...PASILLOS, ...PUERTAS]) {
    for (let cy = r.y / CELDA; cy < (r.y + r.h) / CELDA; cy++) {
      for (let cx = r.x / CELDA; cx < (r.x + r.w) / CELDA; cx++) rejilla[cy * COLS + cx] = 1;
    }
  }
  const celda = (cx, cy) => (cx >= 0 && cy >= 0 && cx < COLS && cy < FILAS ? rejilla[cy * COLS + cx] : 0);
  const caminable = (x, y) => celda(Math.floor(x / CELDA), Math.floor(y / CELDA)) === 1;

  // ¿Cabe una caja de (ancho x alto) centrada en (x, y)? Las paredes miden al
  // menos una celda, así que basta con mirar esquinas y puntos medios.
  function cabe(x, y, ancho, alto) {
    const x0 = x - ancho / 2, x1 = x + ancho / 2, y0 = y - alto / 2, y1 = y + alto / 2;
    return caminable(x0, y0) && caminable(x1, y0) && caminable(x0, y1) && caminable(x1, y1)
      && caminable(x, y0) && caminable(x, y1);
  }

  // Sala en la que está un punto (o null si es pasillo)
  const salaEn = (x, y) => SALAS.find((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) || null;

  /* --------------------------------------------------------------------------
     Paredes: bordes entre celdas caminables y no caminables, en tramos largos
     -------------------------------------------------------------------------- */
  function trazoParedes() {
    const tramos = [];
    for (let cy = 0; cy <= FILAS; cy++) {
      let desde = null;
      for (let cx = 0; cx <= COLS; cx++) {
        const borde = cx < COLS && celda(cx, cy - 1) !== celda(cx, cy);
        if (borde && desde === null) desde = cx;
        if (!borde && desde !== null) { tramos.push(`M${desde * CELDA} ${cy * CELDA}H${cx * CELDA}`); desde = null; }
      }
    }
    for (let cx = 0; cx <= COLS; cx++) {
      let desde = null;
      for (let cy = 0; cy <= FILAS; cy++) {
        const borde = cy < FILAS && celda(cx - 1, cy) !== celda(cx, cy);
        if (borde && desde === null) desde = cy;
        if (!borde && desde !== null) { tramos.push(`M${cx * CELDA} ${desde * CELDA}V${cy * CELDA}`); desde = null; }
      }
    }
    return tramos.join('');
  }

  /* --------------------------------------------------------------------------
     Decorados de cada sala (tinta dorada, con algún toque de color)
     -------------------------------------------------------------------------- */
  const rect = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
  const repetir = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

  const DECORADOS = {
    'gran-comedor': () => `
      ${rect(1010, 650, 380, 22, 'rx="4"')}
      ${repetir(4, (i) => rect([1018, 1112, 1262, 1356][i], 744, 26, 258, 'rx="5"'))}
      ${repetir(4, (i) => `<path d="M${[1010, 1104, 1254, 1348][i]} 750 V996 M${[1052, 1146, 1296, 1390][i]} 750 V996" stroke-dasharray="6 6"/>`)}
      <circle cx="1200" cy="704" r="11"/>
      <g class="velas">${repetir(16, (i) => {
        const x = 990 + (i % 8) * 60 + (i > 7 ? 30 : 0), y = 690 + (i > 7 ? 40 : 0) + (i % 3) * 6;
        return `<g class="vela" style="animation-delay:${(i * 0.37) % 2}s"><rect x="${x - 1.5}" y="${y}" width="3" height="10" fill="#e9dfc6" stroke="none"/><circle cx="${x}" cy="${y - 3}" r="3.4" fill="#ffcf6b" stroke="none"/></g>`;
      })}</g>`,
    vestibulo: () => `
      ${['#b2302f', '#2d8a4e', '#3f63b8', '#d9a62a'].map((color, i) => {
        const x = 1110 + i * 60;
        return `<path d="M${x - 11} 1100 H${x + 11} L${x} 1120 L${x + 11} 1140 H${x - 11} L${x} 1120 Z" fill="${color}" fill-opacity=".35"/>`;
      }).join('')}
      ${repetir(5, (i) => `<path d="M${1120 + i * 8} ${1180 + i * 10} H${1280 - i * 8}"/>`)}`,
    biblioteca: () => `
      ${[690, 770, 850, 930].map((y) => `${rect(380, y, 180, 16)}${rect(620, y, 160, 16)}<path d="${repetir(22, (i) => `M${384 + i * 8} ${y + 2}V${y + 14}`)}${repetir(20, (i) => `M${624 + i * 8} ${y + 2}V${y + 14}`)}" stroke-opacity=".5"/>`).join('')}
      <path d="M640 965 Q700 985 790 960" stroke-dasharray="4 5"/>
      <text x="715" y="990" class="rotulo-pequeno">Sección Prohibida</text>`,
    'comun-gryffindor': () => `
      <path d="M280 104 V146 Q320 120 360 146 V104"/>
      <path d="M300 140 Q310 118 318 136 Q322 116 332 138 Q338 124 342 140 Z" fill="#ff9b3d" fill-opacity=".55" stroke="#ffb35a"/>
      <ellipse cx="320" cy="250" rx="110" ry="58"/>
      ${rect(236, 190, 46, 40, 'rx="12"')}${rect(358, 190, 46, 40, 'rx="12"')}${rect(274, 290, 92, 30, 'rx="10"')}
      ${rect(136, 160, 26, 60, 'fill="#b2302f" fill-opacity=".35"')}`,
    despacho: () => `
      <circle cx="1200" cy="214" r="104"/><circle cx="1200" cy="214" r="86" stroke-dasharray="3 6"/>
      ${rect(1150, 132, 100, 30, 'rx="4"')}
      <path d="M1320 132 V176 M1306 134 H1334"/>
      <path d="M1312 128 Q1320 112 1330 126 Q1324 120 1318 130 Z" fill="#ff7a3d" fill-opacity=".6" stroke="#ff9a52"/>
      <circle cx="1078" cy="276" r="18"/><path d="M1068 276 q10 -10 20 0 q-10 8 -16 -2"/>
      ${repetir(5, (i) => rect(1048 + i * 64, 92, 30, 20))}`,
    'torre-ravenclaw': () => `
      <circle cx="2080" cy="246" r="92"/>
      <path d="M2020 210 L2060 236 L2104 214 L2140 260 M2060 236 L2080 290 L2124 300" stroke-dasharray="2 4"/>
      ${[[2020, 210], [2060, 236], [2104, 214], [2140, 260], [2080, 290], [2124, 300], [2040, 280]].map(([x, y]) => `<path d="M${x} ${y - 6} l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6Z" fill="#8ec5ff" fill-opacity=".7" stroke="none"/>`).join('')}
      ${rect(1900, 120, 16, 220)}${rect(2244, 120, 16, 220)}`,
    'bano-myrtle': () => `
      ${repetir(8, (i) => {
        const a = (i / 8) * Math.PI * 2, x = 1790 + Math.cos(a) * 60, y = 784 + Math.sin(a) * 52;
        return `<rect x="${(x - 9).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="18" height="14" rx="4" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      })}
      <path d="M1784 780 q6 -8 12 0 q-6 8 -12 0" stroke="#7dffb0" stroke-opacity=".6"/>
      ${repetir(7, (i) => rect(1620 + i * 50, 640, 40, 48))}
      <ellipse cx="1660" cy="860" rx="28" ry="8" fill="#5aa0ff" fill-opacity=".25" stroke="#7fb5ff" stroke-opacity=".5"/>
      <ellipse cx="1920" cy="740" rx="20" ry="6" fill="#5aa0ff" fill-opacity=".25" stroke="#7fb5ff" stroke-opacity=".5"/>`,
    enfermeria: () => `
      ${[1010, 1180].map((y) => repetir(4, (i) => `${rect(1630 + i * 88, y, 56, 30, 'rx="5"')}${rect(1634 + i * 88, y + 4, 14, 22, 'rx="4"')}`)).join('')}
      <path d="M1790 1100 h20 M1800 1090 v20" stroke="#ff8a8a" stroke-width="4"/>`,
    trofeos: () => `
      ${[1104, 1196].map((y) => repetir(6, (i) => `${rect(372 + i * 74, y, 54, 26, 'rx="3"')}<path d="M${390 + i * 74} ${y + 6} q9 14 18 0 M${399 + i * 74} ${y + 14} v8"/>`)).join('')}`,
    mazmorras: () => `
      ${[[260, 1560], [380, 1620], [500, 1560], [620, 1620]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18"/><ellipse cx="${x}" cy="${y - 6}" rx="13" ry="5" fill="#5dff7a" fill-opacity=".35" stroke="none"/><circle cx="${x - 4}" cy="${y - 16}" r="3"/><circle cx="${x + 5}" cy="${y - 22}" r="2"/>`).join('')}
      ${repetir(12, (i) => `<circle cx="${180 + i * 48}" cy="1484" r="6"/>`)}
      <path d="M160 1700 h560" stroke-dasharray="10 6"/>`,
    patio: () => `
      <circle cx="1200" cy="1612" r="62"/><circle cx="1200" cy="1612" r="42"/>
      <path d="M1170 1612 q15 -10 30 0 t30 0" stroke="#7fb5ff" stroke-opacity=".6"/>
      <circle cx="1200" cy="1500" r="22"/><path d="M1200 1500 V1486 M1200 1500 L1212 1506"/>
      ${rect(960, 1560, 80, 16, 'rx="4"')}${rect(1360, 1560, 80, 16, 'rx="4"')}${rect(960, 1680, 80, 16, 'rx="4"')}${rect(1360, 1680, 80, 16, 'rx="4"')}`,
    invernaderos: () => `
      <path d="${repetir(9, (i) => `M${1660 + i * 70} 1470 V1730`)}" stroke-opacity=".25"/>
      ${[1540, 1620, 1700].map((y) => repetir(8, (i) => `<circle cx="${1700 + i * 72}" cy="${y}" r="13"/><path d="M${1692 + i * 72} ${y - 10} q8 -16 16 0 M${1700 + i * 72} ${y - 12} v-8" stroke="#7fd27a" stroke-opacity=".75"/>`)).join('')}`,
  };

  // Antorchas en los pasillos (su brillo asoma entre las sombras)
  const ANTORCHAS = [
    [260, 452], [700, 452], [1100, 452], [1500, 452], [1900, 452], [2270, 700],
    [260, 1388], [700, 1388], [1100, 1388], [1500, 1388], [1900, 1388], [130, 900], [2270, 1100],
  ];

  /* --------------------------------------------------------------------------
     El plano completo en SVG
     -------------------------------------------------------------------------- */
  function svg() {
    const suelos = [...SALAS, ...PASILLOS, ...PUERTAS].map((r) => rect(r.x, r.y, r.w, r.h)).join('');
    const nombres = SALAS.map((s) => `<text x="${s.x + s.w / 2}" y="${s.y + 34}" class="rotulo">${s.nombre}</text>`).join('');
    const decorados = SALAS.map((s) => (DECORADOS[s.id] ? DECORADOS[s.id]() : '')).join('');
    const paredes = trazoParedes();
    return `<svg class="plano-svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}" aria-hidden="true">
      <defs>
        <pattern id="baldosas" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="#d9b566" stroke-opacity=".06" stroke-width="1"/>
        </pattern>
      </defs>
      <g class="suelos">${suelos}</g>
      <g class="suelos-baldosas">${suelos}</g>
      <g class="decorados">${decorados}</g>
      <path class="paredes-brillo" d="${paredes}"/>
      <path class="paredes" d="${paredes}"/>
      <g class="rotulos">${nombres}</g>
    </svg>`;
  }

  window.Castillo = {
    ANCHO, ALTO, CELDA, SALAS, PASILLOS, PUERTAS, ANTORCHAS,
    caminable, cabe, salaEn, svg,
  };
})();

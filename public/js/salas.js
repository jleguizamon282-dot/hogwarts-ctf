/* =============================================================================
   salas.js — Decoración de cada sala alrededor del tablero de misión

     Salas.paraMision(n) -> { id, nombre, fondo, izq, der, arriba, abajo, ambiente }

   - fondo: CSS de la pared (patrón SVG en data URI + degradados)
   - izq / der: SVG de 300×900 a cada lado del tablero (se ajusta sin recortar)
   - arriba / abajo: SVG de 1600×220 / 1600×200 (techo y suelo)
   - ambiente: tipo de partículas (gotas, chispas, brasas, polvo, estrellas,
     esporas, vapor) que mision.js reparte por la pantalla
   Las piezas (ventanas, estanterías, velas, calderos…) están en salas-piezas.js.
   ============================================================================= */

(function () {
  'use strict';

  const P = window.Piezas;

  /* --- Patrones de pared (data URI) ----------------------------------------- */
  const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  const ladrillos = (base, junta, luz) => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64">
    <rect width="120" height="64" fill="${junta}"/>
    <rect x="2" y="2" width="56" height="28" rx="2" fill="${base}"/><rect x="62" y="2" width="56" height="28" rx="2" fill="${base}"/>
    <rect x="-28" y="34" width="56" height="28" rx="2" fill="${base}"/><rect x="32" y="34" width="56" height="28" rx="2" fill="${base}"/><rect x="92" y="34" width="56" height="28" rx="2" fill="${base}"/>
    <path d="M4 4h52M64 4h52M34 36h52" stroke="${luz}" stroke-width="2" opacity=".5"/></svg>`);
  const azulejos = (a, b, junta) => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
    <rect width="48" height="48" fill="${junta}"/><rect x="1.5" y="1.5" width="21" height="21" rx="2" fill="${a}"/><rect x="25.5" y="1.5" width="21" height="21" rx="2" fill="${b}"/>
    <rect x="1.5" y="25.5" width="21" height="21" rx="2" fill="${b}"/><rect x="25.5" y="25.5" width="21" height="21" rx="2" fill="${a}"/>
    <path d="M3 3h17M27 3h17M3 27h17M27 27h17" stroke="#fff" stroke-opacity=".18" stroke-width="1.5"/></svg>`);
  const paneles = (a, b, marco) => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="220">
    <rect width="90" height="220" fill="${marco}"/><rect x="8" y="10" width="74" height="200" rx="3" fill="${a}"/>
    <rect x="16" y="20" width="58" height="180" rx="2" fill="${b}"/><path d="M18 22h54" stroke="#fff" stroke-opacity=".12" stroke-width="2"/></svg>`);
  const losas = (a, b, junta) => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">
    <rect width="160" height="120" fill="${junta}"/>
    <path d="M3 3h70l4 52h-72z" fill="${a}"/><path d="M80 3h77v40h-73z" fill="${b}"/><path d="M84 47h73v70h-76z" fill="${a}"/>
    <path d="M3 59h74l-4 58h-70z" fill="${b}"/><path d="M6 6h60M84 6h68" stroke="#fff" stroke-opacity=".1" stroke-width="2"/></svg>`);
  const cristales = (marco) => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="110" height="140">
    <rect width="110" height="140" fill="none" stroke="${marco}" stroke-width="6"/><path d="M55 0v140M0 70h110" stroke="${marco}" stroke-width="3"/>
    <path d="M10 12l26 40M66 82l24 36" stroke="#fff" stroke-opacity=".15" stroke-width="3"/></svg>`);
  const cielito = () => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
    <circle cx="20" cy="30" r="1.2" fill="#fff" opacity=".7"/><circle cx="90" cy="16" r="1" fill="#fff" opacity=".5"/><circle cx="60" cy="80" r="1.4" fill="#fff6d8" opacity=".8"/>
    <circle cx="120" cy="100" r="1" fill="#fff" opacity=".6"/><circle cx="34" cy="120" r=".8" fill="#fff" opacity=".5"/></svg>`);

  /* --- Paneles SVG ------------------------------------------------------------ */
  const lado = (id, contenido, alinear) =>
    `<svg viewBox="0 0 300 900" preserveAspectRatio="${alinear} meet" aria-hidden="true">${P.defs(id)}${contenido}</svg>`;
  const tira = (id, contenido, alto, alinear) =>
    `<svg viewBox="0 0 1600 ${alto}" preserveAspectRatio="${alinear} slice" aria-hidden="true">${P.defs(id)}${contenido}</svg>`;

  // Suelo en perspectiva para la tira de abajo
  function suelo(id, a, b, lineas, extra = '') {
    let l = '';
    for (let i = -10; i <= 26; i++) l += `<path d="M${800 + i * 70} 200 L${800 + i * 22} 40" stroke="${lineas}" stroke-width="2" opacity=".45"/>`;
    for (const y of [70, 108, 152]) l += `<path d="M0 ${y} H1600" stroke="${lineas}" stroke-width="2" opacity=".35"/>`;
    return `<defs><linearGradient id="${id}-suelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <path d="M0 40 H1600 V200 H0 Z" fill="url(#${id}-suelo)"/>${l}<path d="M0 40 H1600" stroke="#000" stroke-opacity=".5" stroke-width="6"/>${extra}`;
  }
  function alfombra(color, borde, motivo = '') {
    return `<path d="M380 70 H1220 L1300 200 H300 Z" fill="${color}" stroke="#0a0608" stroke-width="3"/>
      <path d="M410 82 H1190 L1258 194 H342 Z" fill="none" stroke="${borde}" stroke-width="5"/>
      <path d="M440 96 H1160 L1214 186 H386 Z" fill="none" stroke="${borde}" stroke-width="2" stroke-dasharray="10 8"/>${motivo}`;
  }
  // Velas flotando bajo el techo
  function velasFlotantes(id, n, y0 = 60, y1 = 170) {
    let v = '';
    P.sembrar(77);
    for (let i = 0; i < n; i++) v += P.vela(id, Math.round(40 + (i + P.azar() * 0.6) * (1520 / n)), Math.round(P.entre(y0, y1)), Math.round(P.entre(30, 52)), true);
    return v;
  }
  function vigas(color) {
    let v = `<rect x="0" y="0" width="1600" height="34" fill="${color}" stroke="#0a0604" stroke-width="3"/>`;
    for (let x = 60; x < 1600; x += 220) v += `<path d="M${x} 34 L${x + 50} 120 M${x + 160} 34 L${x + 110} 120" stroke="${color}" stroke-width="16"/>`;
    return v;
  }
  function arcos(color, junta) {
    let a = `<rect x="0" y="0" width="1600" height="30" fill="${color}"/>`;
    for (let x = 0; x < 1600; x += 260) {
      a += `<path d="M${x} 30 V150 Q${x + 10} 60 ${x + 130} 50 Q${x + 250} 60 ${x + 260} 150 V30 Z" fill="${color}" stroke="${junta}" stroke-width="4"/>`
        + `<path d="M${x + 118} 44 h24 l-4 22 h-16 Z" fill="${junta}"/>`;
    }
    return a;
  }

  /* --- Las ocho salas ------------------------------------------------------- */
  const SALAS = {
    'bano-myrtle': () => {
      P.sembrar(11);
      return {
        fondo: `linear-gradient(180deg, rgba(5,20,18,.55), rgba(2,8,8,.8)), ${azulejos('#3c5e58', '#47706a', '#16302c')}`,
        izq: lado('bi', `<path d="M60 0 V800" stroke="#9a6a32" stroke-width="12"/><path d="M60 300 h-20 M60 620 h-20" stroke="#b87a3a" stroke-width="16" stroke-linecap="round"/>
          ${P.lavabo('bi', 180, 600, true)}${P.charco(170, 820, 70)}${P.charco(70, 860, 40)}`, 'xMaxYMax'),
        der: lado('bd', `${P.cubiculo(70, 360, 104, 440)}${P.cubiculo(174, 360, 104, 440, true)}
          <rect x="60" y="340" width="230" height="22" rx="4" fill="#20302c" stroke="#0a100e" stroke-width="3"/>
          <ellipse class="niebla-sala" cx="160" cy="600" rx="120" ry="60" fill="#bff6ee" opacity=".12"/>${P.charco(150, 840, 80)}`, 'xMinYMax'),
        arriba: tira('ba', `<path d="M0 40 H1600 M0 76 H1600" stroke="#9a6a32" stroke-width="14"/>
          ${[160, 520, 880, 1240].map((x) => `<rect x="${x}" y="30" width="26" height="56" rx="5" fill="#b87a3a" stroke="#4a2a10" stroke-width="2"/><circle class="gota" cx="${x + 13}" cy="90" r="3" fill="#bff6ff"/>`).join('')}
          <circle cx="1400" cy="58" r="16" fill="#c88a4a" stroke="#4a2a10" stroke-width="3"/><path d="M1386 58h28M1400 44v28" stroke="#4a2a10" stroke-width="3"/>`, 220, 'xMidYMin'),
        abajo: tira('bb', suelo('bb', '#2c4642', '#14221f', '#5a8a80', `${P.charco(420, 150, 120)}${P.charco(1180, 120, 90)}`), 200, 'xMidYMax'),
        ambiente: 'gotas',
      };
    },

    despacho: () => {
      P.sembrar(23);
      return {
        fondo: `linear-gradient(180deg, rgba(20,10,30,.35), rgba(8,4,14,.85)), ${paneles('#3a2440', '#2c1a32', '#1a0e1e')}`,
        izq: lado('di', `${P.estanteria('di', 40, 300, 220, 480, 5)}${P.artilugio('di', 150, 296, 1.1)}`, 'xMaxYMax'),
        der: lado('dd', `${P.cuadro('dd', 96, 140, 150, 100, '#4a3a6a', '#3a5a3a')}${P.percha('dd', 120, 790)}${P.cuenco('dd', 236, 790)}`, 'xMinYMax'),
        arriba: tira('da', `<rect x="0" y="0" width="1600" height="60" fill="#2a1830"/><path d="M0 60 H1600" stroke="url(#da-oro)" stroke-width="8"/>
          ${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 100 + 50} 64 q-18 22 0 44 q18 -22 0 -44Z" fill="url(#da-oro)" opacity=".85"/>`).join('')}
          ${P.estrellas(0, 0, 1600, 56, 40, '#d9c2ff')}`, 220, 'xMidYMin'),
        abajo: tira('db', suelo('db', '#2a1a20', '#120a0e', '#4a3040', alfombra('#3a1d57', '#d9b64e',
          '<circle cx="800" cy="135" r="34" fill="none" stroke="#d9b64e" stroke-width="3"/><path d="M800 104 v62 M769 135 h62" stroke="#d9b64e" stroke-width="2"/>')), 200, 'xMidYMax'),
        ambiente: 'chispas',
      };
    },

    'comun-gryffindor': () => {
      P.sembrar(31);
      return {
        fondo: `linear-gradient(180deg, rgba(40,6,8,.4), rgba(14,2,4,.85)), ${ladrillos('#5a2226', '#2a0e10', '#7a3a3a')}`,
        izq: lado('gi', `${P.chimenea('gi', 40, 470, 230, 330)}<rect x="20" y="430" width="270" height="20" rx="3" fill="#6a2a2a" stroke="#14080a" stroke-width="2"/>
          ${P.vela('gi', 70, 430, 34)}${P.vela('gi', 240, 430, 44)}${P.estandarte(110, 120, 90, 230, '#8b1a1a', '#e8b830', 'llama')}`, 'xMaxYMax'),
        der: lado('gd', `${P.ventana('gd', 90, 150, 130, 250, { luna: true, marco: '#3a1a1c' })}${P.sillon(80, 800, '#8b1a1a', '#5a0e10')}
          ${P.estandarte(236, 110, 54, 170, '#e8b830', '#8b1a1a', 'estrella')}`, 'xMinYMax'),
        arriba: tira('ga', `${vigas('#3a2416')}${[140, 420, 1100, 1380].map((x, i) => P.estandarte(x, 40, 80, 150, i % 2 ? '#e8b830' : '#8b1a1a', i % 2 ? '#8b1a1a' : '#e8b830', i % 2 ? 'estrella' : 'llama')).join('')}`, 220, 'xMidYMin'),
        abajo: tira('gb', suelo('gb', '#3a2416', '#1a0e08', '#5a3a22', alfombra('#7a1416', '#e8b830')), 200, 'xMidYMax'),
        ambiente: 'brasas',
      };
    },

    biblioteca: () => {
      P.sembrar(41);
      return {
        fondo: `linear-gradient(180deg, rgba(20,10,4,.4), rgba(8,4,2,.88)), ${paneles('#3a2618', '#2a1a10', '#160c06')}`,
        izq: lado('li', `${P.estanteria('li', 20, 110, 270, 690, 7)}${P.escalera(180, 200, 600)}`, 'xMaxYMax'),
        der: lado('ld', `${P.estanteria('ld', 10, 110, 270, 690, 7, ['#5a1a1a', '#1a3a5a', '#1a4a2a', '#5a4a1a', '#3a1a4a', '#6a2a0a'])}`, 'xMinYMax'),
        arriba: tira('la', `${arcos('#2a1a10', '#120a04')}${velasFlotantes('la', 14, 80, 190)}`, 220, 'xMidYMin'),
        abajo: tira('lb', suelo('lb', '#3a2416', '#140a04', '#5a3a22', `${P.mesaLectura('lb', 120, 92, 300)}${P.mesaLectura('lb', 1180, 92, 300)}`), 200, 'xMidYMax'),
        ambiente: 'polvo',
      };
    },

    'torre-ravenclaw': () => {
      P.sembrar(53);
      const constelacion = '<path d="M240 70 L300 40 L360 60 L420 30 M1180 50 L1240 80 L1300 46 L1380 70" stroke="#cfe0ff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>';
      return {
        fondo: `linear-gradient(180deg, rgba(8,14,40,.35), rgba(4,6,20,.85)), ${cielito()}, ${ladrillos('#1e2c5e', '#0e1534', '#3a4c8a')}`,
        izq: lado('ri', `${P.ventana('ri', 70, 140, 170, 330, { luna: true, marco: '#24305a' })}${P.telescopio('ri', 160, 800)}`, 'xMaxYMax'),
        der: lado('rd', `${P.estanteria('rd', 40, 330, 230, 470, 5, ['#233a7a', '#c69a4e', '#1a2a5a', '#8a6a3a', '#3a4a8a'])}
          ${P.estandarte(110, 70, 90, 210, '#233a7a', '#c69a4e', 'estrella')}`, 'xMinYMax'),
        arriba: tira('ra', `<path d="M0 0 H1600 V120 Q800 230 0 120 Z" fill="#0c1438"/>${P.estrellas(0, 0, 1600, 150, 90, '#e6f0ff')}${constelacion}
          <path d="M0 120 Q800 230 1600 120" stroke="#c69a4e" stroke-width="6" fill="none"/>`, 220, 'xMidYMin'),
        abajo: tira('rb', suelo('rb', '#1e2c5e', '#0a1028', '#3a4c8a', alfombra('#16245a', '#c69a4e',
          [600, 800, 1000].map((x) => `<path d="M${x} 118 l6 14 15 1 -12 9 4 15 -13 -8 -13 8 4 -15 -12 -9 15 -1Z" fill="#c69a4e"/>`).join(''))), 200, 'xMidYMax'),
        ambiente: 'estrellas',
      };
    },

    invernaderos: () => {
      P.sembrar(67);
      return {
        fondo: `linear-gradient(180deg, rgba(40,70,60,.35), rgba(6,18,10,.85)), ${cristales('#1c3a24')}, linear-gradient(180deg, #2a4a5a, #1a3a2a 60%, #0c1a10)`,
        izq: lado('ii', `${P.enredadera(60, 0, 300)}${P.enredadera(230, 0, 220)}
          <rect x="20" y="640" width="270" height="16" rx="3" fill="#5a3a22" stroke="#1a0e06" stroke-width="2"/><path d="M40 656 v144 M270 656 v144" stroke="#3a2416" stroke-width="10"/>
          ${P.maceta('ii', 70, 640, 'flor', 0.7)}${P.maceta('ii', 150, 640, 'pinchos', 0.65)}${P.maceta('ii', 232, 640, 'hojas', 0.6, '#4a9a52')}${P.maceta('ii', 150, 800, 'raiz', 1.15)}`, 'xMaxYMax'),
        der: lado('id', `${P.enredadera(110, 0, 260, '#4a9a52')}${P.maceta('id', 150, 800, 'hojas', 1.7)}${P.regadera(250, 800)}${P.maceta('id', 60, 800, 'flor', 0.8)}`, 'xMinYMax'),
        arriba: tira('ia', `<path d="M0 0 H1600 V40 H0 Z" fill="#1c3a24"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 200} 40 L${i * 200 + 100} 200 M${i * 200 + 200} 40 L${i * 200 + 100} 200" stroke="#1c3a24" stroke-width="8"/>`).join('')}
          ${[100, 500, 900, 1300].map((x) => P.enredadera(x, 30, 150, '#4a9a52')).join('')}`, 220, 'xMidYMin'),
        abajo: tira('ib', suelo('ib', '#3a2a1a', '#140c06', '#5a4a2a', `${[260, 420, 1180, 1340].map((x, i) => P.maceta('ib', x, 120, ['flor', 'hojas', 'pinchos', 'raiz'][i], 0.55)).join('')}`), 200, 'xMidYMax'),
        ambiente: 'esporas',
      };
    },

    mazmorras: () => {
      P.sembrar(79);
      return {
        fondo: `linear-gradient(180deg, rgba(4,14,8,.45), rgba(2,6,4,.9)), ${losas('#26302a', '#1e2822', '#0c120e')}`,
        izq: lado('mi', `${P.cadena(60, 0, 14)}${P.estantePociones('mi', 40, 360, 240)}${P.estantePociones('mi', 40, 520, 240, ['#3ddc84', '#1a8a4a', '#b05cff', '#4cc3ff'])}
          ${P.estantePociones('mi', 40, 680, 240, ['#ffd23c', '#3ddc84', '#ff5c7a'])}${P.cadena(250, 0, 10)}`, 'xMaxYMax'),
        der: lado('md', `${P.antorcha('md', 210, 230)}${P.caldero('md', 140, 680, 74)}${P.cadena(40, 0, 16)}`, 'xMinYMax'),
        arriba: tira('ma', `${arcos('#1e2620', '#0a0e0b')}${[130, 650, 1170].map((x) => P.cadena(x + 130, 40, 6)).join('')}
          <circle class="gota" cx="390" cy="160" r="3" fill="#9dffbf"/><circle class="gota" cx="1040" cy="150" r="3" fill="#9dffbf"/>`, 220, 'xMidYMin'),
        abajo: tira('mb', suelo('mb', '#26302a', '#0a0e0b', '#3a4a40', `<ellipse cx="560" cy="150" rx="110" ry="18" fill="#3ddc84" opacity=".15"/>${P.frasco(1180, 150, 'redondo', '#b05cff')}${P.frasco(1230, 156, 'alto', '#3ddc84')}`), 200, 'xMidYMax'),
        ambiente: 'vapor',
      };
    },

    'gran-comedor': () => {
      P.sembrar(97);
      const mesas = [300, 1300].map((x) => `<path d="M${x - 260} 92 H${x + 260} L${x + 300} 150 H${x - 300} Z" fill="#5a3a22" stroke="#140a04" stroke-width="3"/>
        ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${x - 210 + i * 84}" cy="118" rx="18" ry="6" fill="url(#cb-oro)"/><path d="M${x - 182 + i * 84} 116 v-16 h10 v16" fill="url(#cb-oro)"/>`).join('')}`).join('');
      return {
        fondo: `linear-gradient(180deg, rgba(10,14,40,.2) 0, rgba(6,6,20,.5) 30%, rgba(4,2,10,.88)), ${cielito()}, ${ladrillos('#2a2440', '#14101e', '#4a4260')}`,
        izq: lado('ci', `${P.columna('ci', 30, 120, 60, 680)}${P.ventana('ci', 130, 110, 130, 400, { marco: '#2a2440' })}${P.antorcha('ci', 190, 600)}`, 'xMaxYMax'),
        der: lado('cd', `${P.ventana('cd', 40, 110, 130, 400, { luna: true, marco: '#2a2440' })}${P.columna('cd', 210, 120, 60, 680)}${P.antorcha('cd', 100, 600)}`, 'xMinYMax'),
        arriba: tira('ca', `<rect width="1600" height="220" fill="#0a1030" opacity=".55"/>${P.estrellas(0, 0, 1600, 200, 110, '#fff6d8')}
          ${[170, 470, 1050, 1350].map((x, i) => P.estandarte(x, 0, 86, 170, ['#8b1a1a', '#1a5c34', '#233a7a', '#e8b72a'][i], ['#e8b830', '#c0c7cc', '#c69a4e', '#2b2520'][i], ['llama', 'rombo', 'estrella', 'hoja'][i])).join('')}
          ${velasFlotantes('ca', 12, 70, 200)}`, 220, 'xMidYMin'),
        abajo: tira('cb', suelo('cb', '#3a3248', '#120e18', '#5a5070', mesas), 200, 'xMidYMax'),
        ambiente: 'chispas',
      };
    },
  };

  // Sala de cada misión (la misma que en el mapa)
  const POR_MISION = {
    1: ['bano-myrtle', 'Baño de Myrtle la Llorona'],
    2: ['despacho', 'Despacho del director'],
    3: ['comun-gryffindor', 'Sala común de Gryffindor'],
    4: ['biblioteca', 'Biblioteca'],
    5: ['torre-ravenclaw', 'Torre de Ravenclaw'],
    6: ['invernaderos', 'Invernaderos'],
    7: ['mazmorras', 'Mazmorras'],
    8: ['gran-comedor', 'Gran Comedor'],
  };

  function paraMision(n) {
    const [id, nombre] = POR_MISION[n] || POR_MISION[8];
    return { id, nombre, ...SALAS[id]() };
  }

  window.Salas = { paraMision, POR_MISION };
})();

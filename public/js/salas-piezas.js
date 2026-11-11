/* =============================================================================
   salas-piezas.js — Piezas de decorado para las pantallas de misión

   Cada función devuelve un trozo de SVG (texto). salas.js las combina para
   montar la decoración de cada sala alrededor del tablero. Las animaciones
   (llamas, burbujas, gotas, velas que flotan…) están en mision.css y se activan
   con clases: llama, flota, gira, burbuja, gota, ondea, brilla, vapor.
   ============================================================================= */

(function () {
  'use strict';

  // Azar con semilla: la misma sala siempre se dibuja igual
  let semilla = 1;
  const sembrar = (n) => { semilla = n; };
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const entre = (a, b) => a + azar() * (b - a);
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const r1 = (n) => Math.round(n * 10) / 10;

  /* --- Degradados comunes (cada panel los incluye con su prefijo) ----------- */
  const defs = (p) => `<defs>
    <radialGradient id="${p}-halo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".45" stop-color="#ff9a3c" stop-opacity=".22"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-halo-verde"><stop offset="0" stop-color="#9dffbf" stop-opacity=".7"/><stop offset=".5" stop-color="#3ddc84" stop-opacity=".18"/><stop offset="1" stop-color="#3ddc84" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-halo-azul"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".6"/><stop offset=".5" stop-color="#6aa8ff" stop-opacity=".15"/><stop offset="1" stop-color="#6aa8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}-llama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a1a"/><stop offset=".55" stop-color="#ffb43c"/><stop offset="1" stop-color="#fff3c4"/></linearGradient>
    <linearGradient id="${p}-noche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1030"/><stop offset=".7" stop-color="#22306a"/><stop offset="1" stop-color="#3b3f7a"/></linearGradient>
    <linearGradient id="${p}-madera" x1="0" x2="1"><stop offset="0" stop-color="#3a2416"/><stop offset=".5" stop-color="#5a3a22"/><stop offset="1" stop-color="#2e1c10"/></linearGradient>
    <linearGradient id="${p}-piedra" x1="0" x2="1"><stop offset="0" stop-color="#3c3648"/><stop offset=".5" stop-color="#4f4860"/><stop offset="1" stop-color="#2c2738"/></linearGradient>
    <linearGradient id="${p}-oro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset=".5" stop-color="#d9b64e"/><stop offset="1" stop-color="#8a6420"/></linearGradient>
    <linearGradient id="${p}-plata" x1="0" x2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset=".5" stop-color="#9aa6b6"/><stop offset="1" stop-color="#d6dde7"/></linearGradient>
    <linearGradient id="${p}-cristal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f2ff" stop-opacity=".35"/><stop offset=".5" stop-color="#8fc7e8" stop-opacity=".12"/><stop offset="1" stop-color="#d8f2ff" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${p}-porcelana" x1="0" x2="1"><stop offset="0" stop-color="#f4f6f2"/><stop offset=".6" stop-color="#cfd8d2"/><stop offset="1" stop-color="#9aa8a0"/></linearGradient>
    <linearGradient id="${p}-barro" x1="0" x2="1"><stop offset="0" stop-color="#9a4e2a"/><stop offset=".5" stop-color="#c46a3a"/><stop offset="1" stop-color="#7a3a1c"/></linearGradient>
  </defs>`;

  /* --- Luces ---------------------------------------------------------------- */
  const halo = (p, x, y, r, tipo = '') => `<circle class="halo" cx="${x}" cy="${y}" r="${r}" fill="url(#${p}-halo${tipo ? '-' + tipo : ''})"/>`;

  function llama(p, x, y, s = 1, retraso = 0) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path class="llama" style="animation-delay:${retraso}s" d="M0 0C-7 -6 -6 -16 0 -28C6 -16 7 -6 0 0Z" fill="url(#${p}-llama)"/>`
      + `<path class="llama" style="animation-delay:${retraso + 0.15}s" d="M0 -2C-3 -6 -3 -11 0 -17C3 -11 3 -6 0 -2Z" fill="#fff6d8"/></g>`;
  }

  function antorcha(p, x, y) {
    return `<g>${halo(p, x, y - 30, 120)}
      <path d="M${x - 14} ${y + 6} L${x + 14} ${y + 6} L${x + 7} ${y + 34} L${x - 7} ${y + 34} Z" fill="#2a1d14" stroke="#100a06" stroke-width="2"/>
      <rect x="${x - 4}" y="${y + 34}" width="8" height="46" rx="3" fill="#3a2818" stroke="#100a06" stroke-width="2"/>
      <path d="M${x - 22} ${y + 70} h44" stroke="#4a3a2a" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="${x}" cy="${y + 6}" rx="15" ry="5" fill="#1a120c"/>
      ${llama(p, x, y + 4, 1.6)}</g>`;
  }

  function vela(p, x, y, alto = 40, flotante = false) {
    const retraso = r1(entre(0, 3));
    return `<g class="${flotante ? 'flota' : ''}" style="animation-delay:-${retraso}s">
      ${halo(p, x, y - alto - 10, 34)}
      <rect x="${x - 6}" y="${y - alto}" width="12" height="${alto}" rx="2" fill="#f3ead2" stroke="#b9a983" stroke-width="1.2"/>
      <path d="M${x - 6} ${y - alto + 3} q3 7 0 12 M${x + 6} ${y - alto + 2} q-2 5 0 8" stroke="#e2d6b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M${x} ${y - alto} v-5" stroke="#2a2018" stroke-width="1.5"/>
      ${llama(p, x, y - alto - 4, 0.62, retraso)}</g>`;
  }

  /* --- Arquitectura ----------------------------------------------------------- */
  // Ventana ojival con cristal de noche, luna opcional y parteluz
  function ventana(p, x, y, w, h, { luna = false, cielo = `url(#${p}-noche)`, marco = '#2c2638' } = {}) {
    const a = h * 0.36;
    const arco = (ox, oy, ww, hh, aa) => `M${ox} ${oy + hh} L${ox} ${oy + aa} Q${ox} ${oy} ${ox + ww / 2} ${oy} Q${ox + ww} ${oy} ${ox + ww} ${oy + aa} L${ox + ww} ${oy + hh} Z`;
    let estrellas = '';
    for (let i = 0; i < 9; i++) {
      estrellas += `<circle class="brilla" style="animation-delay:-${r1(entre(0, 3))}s" cx="${r1(x + entre(12, w - 12))}" cy="${r1(y + entre(14, h * 0.7))}" r="${r1(entre(0.8, 1.8))}" fill="#fff6d8"/>`;
    }
    return `<g>
      <path d="${arco(x - 12, y - 12, w + 24, h + 20, a + 8)}" fill="${marco}" stroke="#0e0b14" stroke-width="3"/>
      <path d="${arco(x, y, w, h, a)}" fill="${cielo}"/>
      ${estrellas}
      ${luna ? `<circle cx="${x + w * 0.66}" cy="${y + h * 0.3}" r="${w * 0.13}" fill="#f4efd6"/><circle cx="${x + w * 0.62}" cy="${y + h * 0.28}" r="${w * 0.12}" fill="#26326a" opacity=".9"/>` : ''}
      <path d="${arco(x, y, w, h, a)}" fill="url(#${p}-cristal)"/>
      <path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * 0.55} H${x + w}" stroke="${marco}" stroke-width="5"/>
      <circle cx="${x + w / 2}" cy="${y + a * 0.75}" r="${w * 0.14}" fill="none" stroke="${marco}" stroke-width="4"/>
      <rect x="${x - 18}" y="${y + h + 6}" width="${w + 36}" height="12" rx="2" fill="${marco}" stroke="#0e0b14" stroke-width="2"/>
    </g>`;
  }

  // Columna de piedra con capitel
  function columna(p, x, y, w, h) {
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}-piedra)" stroke="#120e18" stroke-width="2"/>
      <path d="M${x + w * 0.3} ${y + 10} V${y + h - 10} M${x + w * 0.7} ${y + 10} V${y + h - 10}" stroke="#2a2434" stroke-width="2" opacity=".7"/>
      <rect x="${x - 10}" y="${y - 18}" width="${w + 20}" height="20" rx="3" fill="#5a5270" stroke="#120e18" stroke-width="2"/>
      <rect x="${x - 10}" y="${y + h}" width="${w + 20}" height="18" rx="3" fill="#4a4460" stroke="#120e18" stroke-width="2"/></g>`;
  }

  // Estandarte que ondea, con flecos y un emblema geométrico sencillo
  function estandarte(x, y, w, h, colorA, colorB, emblema = 'estrella') {
    const emb = {
      estrella: `<path d="M0 -16 L4.7 -5 L16 -5 L7 2 L10 14 L0 7 L-10 14 L-7 2 L-16 -5 L-4.7 -5 Z"/>`,
      luna: `<path d="M6 -16 A16 16 0 1 0 6 16 A12 12 0 1 1 6 -16 Z"/>`,
      llama: `<path d="M0 16 C-12 8 -10 -4 0 -16 C2 -8 10 -4 8 6 C7 12 4 15 0 16 Z"/>`,
      hoja: `<path d="M0 -17 C12 -8 12 8 0 17 C-12 8 -12 -8 0 -17 Z M0 -14 V14" stroke-width="2"/>`,
      rombo: `<path d="M0 -17 L13 0 L0 17 L-13 0 Z"/>`,
      ola: `<path d="M-15 4 Q-8 -8 0 4 T15 4 V10 H-15 Z M-10 -8 a4 4 0 1 0 0.1 0Z"/>`,
    }[emblema] || '';
    const fl = Math.max(4, Math.round(w / 12));
    let flecos = '';
    for (let i = 0; i < fl; i++) flecos += `<path d="M${x + (i * w) / fl + w / fl / 2} ${y + h} v10" stroke="${colorB}" stroke-width="2.5" stroke-linecap="round"/>`;
    return `<g class="ondea" style="animation-delay:-${r1(entre(0, 4))}s">
      <rect x="${x - 10}" y="${y - 8}" width="${w + 20}" height="8" rx="4" fill="#3a2a18" stroke="#120a04" stroke-width="1.5"/>
      <circle cx="${x - 10}" cy="${y - 4}" r="6" fill="#d9b64e"/><circle cx="${x + w + 10}" cy="${y - 4}" r="6" fill="#d9b64e"/>
      <path d="M${x} ${y} H${x + w} V${y + h} L${x + w / 2} ${y + h - 18} L${x} ${y + h} Z" fill="${colorA}" stroke="#120a04" stroke-width="2"/>
      <path d="M${x + 6} ${y + 4} H${x + w - 6} V${y + h - 10} L${x + w / 2} ${y + h - 26} L${x + 6} ${y + h - 10} Z" fill="none" stroke="${colorB}" stroke-width="3"/>
      <path d="M${x + w * 0.2} ${y} V${y + h - 8}" stroke="#000" stroke-opacity=".18" stroke-width="${w * 0.1}"/>
      <g transform="translate(${x + w / 2} ${y + h * 0.42}) scale(${w / 60})" fill="${colorB}" stroke="${colorB}">${emb}</g>
      ${flecos}</g>`;
  }

  // Marco dorado con un cuadro sencillo (paisaje)
  function cuadro(p, x, y, w, h, cielo = '#3a4a7a', tierra = '#2a4a32') {
    return `<g><rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="4" fill="url(#${p}-oro)" stroke="#5a4010" stroke-width="2"/>
      <rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="none" stroke="#fff2b8" stroke-opacity=".5" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cielo}"/>
      <path d="M${x} ${y + h * 0.7} Q${x + w * 0.3} ${y + h * 0.45} ${x + w * 0.55} ${y + h * 0.65} T${x + w} ${y + h * 0.55} V${y + h} H${x} Z" fill="${tierra}"/>
      <circle cx="${x + w * 0.75}" cy="${y + h * 0.28}" r="${w * 0.09}" fill="#f6e7b0" opacity=".85"/>
      <path d="M${x + w * 0.2} ${y + h * 0.72} l6 -16 l6 16 Z" fill="#1a2a1e"/></g>`;
  }

  /* --- Mobiliario ------------------------------------------------------------ */
  const LOMOS = ['#7a1f24', '#2c4f7a', '#2f6a3c', '#7a5a1f', '#4a2a6a', '#8a3a1a', '#24444a', '#6a6a2a', '#5a1a3a', '#3a3a5a'];

  function estanteria(p, x, y, w, h, filas = 5, colores = LOMOS) {
    const alto = (h - 24) / filas;
    let libros = '';
    for (let f = 0; f < filas; f++) {
      const base = y + 12 + alto * (f + 1) - 4;
      let cx = x + 14;
      while (cx < x + w - 22) {
        const ancho = entre(7, 14);
        const altoL = alto * entre(0.62, 0.9);
        const color = elegir(colores);
        const inclinado = azar() < 0.08;
        libros += `<g${inclinado ? ` transform="rotate(${r1(entre(8, 16))} ${r1(cx)} ${r1(base)})"` : ''}>`
          + `<rect x="${r1(cx)}" y="${r1(base - altoL)}" width="${r1(ancho)}" height="${r1(altoL)}" rx="1.5" fill="${color}" stroke="#120a06" stroke-width="1"/>`
          + `<path d="M${r1(cx + 1.5)} ${r1(base - altoL + 6)} h${r1(ancho - 3)} M${r1(cx + 1.5)} ${r1(base - 8)} h${r1(ancho - 3)}" stroke="#e8c870" stroke-width="1.2" opacity=".8"/></g>`;
        cx += ancho + entre(0.5, 2.5);
        if (azar() < 0.05) cx += entre(8, 18);
      }
    }
    let baldas = '';
    for (let f = 0; f <= filas; f++) baldas += `<rect x="${x + 6}" y="${r1(y + 12 + alto * f - 4)}" width="${w - 12}" height="7" fill="#4a2e1a" stroke="#1a0e06" stroke-width="1.2"/>`;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${p}-madera)" stroke="#140a04" stroke-width="3"/>
      <rect x="${x + 8}" y="${y + 10}" width="${w - 16}" height="${h - 18}" fill="#1c1008"/>${libros}${baldas}
      <path d="M${x - 6} ${y - 4} H${x + w + 6} V${y + 10} H${x - 6} Z" fill="#5a3a22" stroke="#140a04" stroke-width="2"/></g>`;
  }

  function escalera(x, y, h) {
    let p = `<g stroke="#2a1a0e" stroke-width="2"><path d="M${x} ${y} L${x + 18} ${y + h} M${x + 30} ${y} L${x + 48} ${y + h}" stroke="#6a4a2a" stroke-width="6"/>`;
    for (let i = 20; i < h; i += 34) p += `<path d="M${x + (i / h) * 18 + 1} ${y + i} H${x + 30 + (i / h) * 18 - 1}" stroke="#7a5a32" stroke-width="5"/>`;
    return p + '</g>';
  }

  function chimenea(p, x, y, w, h) {
    let ladrillos = '';
    for (let fila = 0; fila < 8; fila++) {
      for (let c = 0; c < 6; c++) {
        const bx = x + c * (w / 6) + (fila % 2 ? w / 12 : 0);
        if (bx > x + w - 10) continue;
        ladrillos += `<rect x="${r1(bx + 1)}" y="${r1(y + fila * (h / 8) + 1)}" width="${r1(w / 6 - 3)}" height="${r1(h / 8 - 3)}" rx="2" fill="#5a4a5e" opacity=".9"/>`;
      }
    }
    const bx = x + w * 0.18, bw = w * 0.64, by = y + h * 0.36, bh = h * 0.64;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a2232" stroke="#100c14" stroke-width="3"/>${ladrillos}
      <path d="M${bx} ${y + h} V${by + 30} Q${bx + bw / 2} ${by - 10} ${bx + bw} ${by + 30} V${y + h} Z" fill="#0c0806" stroke="#100c14" stroke-width="3"/>
      ${halo(p, bx + bw / 2, y + h - 34, bw * 0.95)}
      <path d="M${bx + 14} ${y + h - 8} L${bx + bw - 20} ${y + h - 22} M${bx + 20} ${y + h - 22} L${bx + bw - 12} ${y + h - 10}" stroke="#4a2a14" stroke-width="10" stroke-linecap="round"/>
      ${llama(p, bx + bw * 0.35, y + h - 16, 1.7, 0)}${llama(p, bx + bw * 0.55, y + h - 14, 2.1, 0.3)}${llama(p, bx + bw * 0.72, y + h - 16, 1.5, 0.6)}
      <rect x="${x - 16}" y="${y - 14}" width="${w + 32}" height="18" rx="3" fill="#6a5a72" stroke="#100c14" stroke-width="2"/>
      <rect x="${x - 8}" y="${y - 26}" width="${w + 16}" height="14" rx="3" fill="#7a6a84" stroke="#100c14" stroke-width="2"/></g>`;
  }

  function sillon(x, y, color, oscuro) {
    return `<g><path d="M${x} ${y} C${x} ${y - 70} ${x + 20} ${y - 96} ${x + 60} ${y - 96} C${x + 100} ${y - 96} ${x + 120} ${y - 70} ${x + 120} ${y} Z" fill="${color}" stroke="#14080a" stroke-width="3"/>
      <rect x="${x - 10}" y="${y - 44}" width="30" height="50" rx="12" fill="${oscuro}" stroke="#14080a" stroke-width="3"/>
      <rect x="${x + 100}" y="${y - 44}" width="30" height="50" rx="12" fill="${oscuro}" stroke="#14080a" stroke-width="3"/>
      <rect x="${x + 14}" y="${y - 30}" width="92" height="28" rx="10" fill="${color}" stroke="#14080a" stroke-width="2.5"/>
      <path d="M${x + 4} ${y + 6} v14 M${x + 116} ${y + 6} v14" stroke="#2a1608" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x + 40} ${y - 76} q20 -8 40 0" stroke="#ffffff" stroke-opacity=".15" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  }

  function mesaLectura(p, x, y, w) {
    return `<g><rect x="${x}" y="${y}" width="${w}" height="16" rx="3" fill="#5a3a22" stroke="#140a04" stroke-width="2"/>
      <path d="M${x + 14} ${y + 16} v70 M${x + w - 14} ${y + 16} v70" stroke="#3a2416" stroke-width="12"/>
      <g transform="translate(${x + w * 0.22} ${y})"><path d="M-30 0 L0 -6 L30 0 L0 4 Z" fill="#f1e6c8" stroke="#6a5a3a" stroke-width="1.5"/><path d="M0 -6 V4" stroke="#8a7a5a"/></g>
      <rect x="${x + w * 0.5}" y="${y - 22}" width="40" height="10" fill="#7a1f24" stroke="#140a04"/><rect x="${x + w * 0.5 + 4}" y="${y - 12}" width="36" height="12" fill="#2c4f7a" stroke="#140a04"/>
      ${vela(p, x + w * 0.85, y, 30)}</g>`;
  }

  /* --- Mazmorras y pociones --------------------------------------------------- */
  function caldero(p, x, y, r, liquido = '#3ddc84') {
    let burbujas = '';
    for (let i = 0; i < 6; i++) {
      burbujas += `<circle class="burbuja" style="animation-delay:-${r1(entre(0, 2.4))}s" cx="${r1(x + entre(-r * 0.5, r * 0.5))}" cy="${y - r * 0.55}" r="${r1(entre(3, 7))}" fill="${liquido}" opacity=".85"/>`;
    }
    return `<g>${halo(p, x, y - r * 0.6, r * 2.1, 'verde')}
      <path d="M${x - r * 0.5} ${y + r * 0.9} l-10 26 M${x + r * 0.5} ${y + r * 0.9} l10 26 M${x} ${y + r * 0.95} v26" stroke="#141218" stroke-width="7" stroke-linecap="round"/>
      ${llama(p, x - r * 0.3, y + r * 1.15, 1.2, 0.2)}${llama(p, x + r * 0.25, y + r * 1.15, 1.4, 0.5)}
      <path d="M${x - r} ${y - r * 0.55} C${x - r * 1.15} ${y + r * 0.6} ${x - r * 0.6} ${y + r} ${x} ${y + r} C${x + r * 0.6} ${y + r} ${x + r * 1.15} ${y + r * 0.6} ${x + r} ${y - r * 0.55} Z" fill="#1c1a22" stroke="#06050a" stroke-width="3"/>
      <ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r}" ry="${r * 0.25}" fill="${liquido}" stroke="#06050a" stroke-width="3"/>
      <ellipse cx="${x - r * 0.2}" cy="${y - r * 0.6}" rx="${r * 0.45}" ry="${r * 0.08}" fill="#ffffff" opacity=".35"/>
      <path d="M${x - r * 0.75} ${y - r * 0.2} q${r * 0.2} ${r * 0.5} ${r * 0.5} ${r * 0.6}" stroke="#ffffff" stroke-opacity=".12" stroke-width="5" fill="none"/>
      ${burbujas}
      <path class="vapor" d="M${x - r * 0.3} ${y - r * 0.8} q-14 -30 4 -60 q16 -28 -2 -56" stroke="${liquido}" stroke-opacity=".35" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path class="vapor" style="animation-delay:-1.4s" d="M${x + r * 0.3} ${y - r * 0.8} q14 -30 -4 -60 q-16 -28 2 -56" stroke="${liquido}" stroke-opacity=".3" stroke-width="8" fill="none" stroke-linecap="round"/></g>`;
  }

  function frasco(x, y, forma, color) {
    const brillo = `<path d="M${x - 4} ${y - 22} q-2 8 0 14" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (forma === 'redondo') {
      return `<g><circle cx="${x}" cy="${y - 14}" r="14" fill="${color}" fill-opacity=".85" stroke="#0a0a10" stroke-width="2"/>
        <rect x="${x - 4}" y="${y - 40}" width="8" height="14" fill="#c8d8e0" fill-opacity=".5" stroke="#0a0a10" stroke-width="1.5"/>
        <rect x="${x - 5}" y="${y - 45}" width="10" height="6" rx="2" fill="#8a5a2a"/>${brillo}</g>`;
    }
    if (forma === 'alto') {
      return `<g><rect x="${x - 7}" y="${y - 46}" width="14" height="46" rx="5" fill="${color}" fill-opacity=".85" stroke="#0a0a10" stroke-width="2"/>
        <rect x="${x - 4}" y="${y - 54}" width="8" height="8" rx="2" fill="#8a5a2a"/>
        <rect x="${x - 7}" y="${y - 30}" width="14" height="10" fill="#efe2bd"/>${brillo}</g>`;
    }
    return `<g><path d="M${x - 11} ${y} V${y - 26} L${x - 5} ${y - 32} V${y - 38} H${x + 5} V${y - 32} L${x + 11} ${y - 26} V${y} Z" fill="${color}" fill-opacity=".85" stroke="#0a0a10" stroke-width="2"/>
      <rect x="${x - 6}" y="${y - 43}" width="12" height="6" rx="2" fill="#8a5a2a"/>${brillo}</g>`;
  }

  function estantePociones(p, x, y, w, colores = ['#3ddc84', '#b05cff', '#ff5c7a', '#ffd23c', '#4cc3ff']) {
    let frascos = '';
    let cx = x + 18;
    while (cx < x + w - 14) {
      frascos += frasco(cx, y, elegir(['redondo', 'alto', 'cuadrado']), elegir(colores));
      cx += entre(26, 36);
    }
    return `<g>${frascos}<rect x="${x}" y="${y}" width="${w}" height="9" rx="2" fill="#3a2a1c" stroke="#120a06" stroke-width="2"/>
      <path d="M${x + 14} ${y + 9} l10 20 M${x + w - 14} ${y + 9} l-10 20" stroke="#2a1d14" stroke-width="5"/></g>`;
  }

  function cadena(x, y, eslabones = 8) {
    let c = '';
    for (let i = 0; i < eslabones; i++) {
      c += i % 2
        ? `<rect x="${x - 2}" y="${y + i * 13}" width="4" height="16" rx="2" fill="#5a5664" stroke="#141218" stroke-width="1.5"/>`
        : `<ellipse cx="${x}" cy="${y + i * 13 + 8}" rx="7" ry="9" fill="none" stroke="#6a6674" stroke-width="3.5"/>`;
    }
    return `<g class="ondea" style="animation-delay:-${r1(entre(0, 3))}s">${c}<path d="M${x - 9} ${y + eslabones * 13 + 4} a9 9 0 1 0 18 0" fill="none" stroke="#6a6674" stroke-width="4"/></g>`;
  }

  /* --- Baño ------------------------------------------------------------------- */
  function lavabo(p, x, y, serpiente = false) {
    return `<g>
      <rect x="${x - 44}" y="${y - 150}" width="88" height="96" rx="40" fill="#1a2422" stroke="#0a100e" stroke-width="3"/>
      <rect x="${x - 38}" y="${y - 144}" width="76" height="84" rx="34" fill="#4a6a66" opacity=".55"/>
      <path d="M${x - 24} ${y - 128} l18 44 M${x + 4} ${y - 134} l14 30" stroke="#d8fff6" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
      <path d="M${x - 50} ${y - 34} H${x + 50} C${x + 46} ${y - 4} ${x + 26} ${y + 6} ${x} ${y + 6} C${x - 26} ${y + 6} ${x - 46} ${y - 4} ${x - 50} ${y - 34} Z" fill="url(#${p}-porcelana)" stroke="#2a3430" stroke-width="2.5"/>
      <rect x="${x - 12}" y="${y + 4}" width="24" height="70" fill="url(#${p}-porcelana)" stroke="#2a3430" stroke-width="2.5"/>
      <path d="M${x - 4} ${y - 34} V${y - 54} H${x + 18} V${y - 46}" stroke="#b87a3a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="${x - 4}" cy="${y - 58}" r="6" fill="#c88a4a" stroke="#5a3a1a" stroke-width="1.5"/>
      ${serpiente ? `<path d="M${x + 2} ${y - 50} q4 -5 8 0 t8 0" stroke="#3a2410" stroke-width="1.6" fill="none"/>` : ''}
      <circle class="gota" cx="${x + 18}" cy="${y - 42}" r="2.6" fill="#bff6ff"/></g>`;
  }

  function cubiculo(x, y, w, h, abierta = false) {
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a3a36" stroke="#0a100e" stroke-width="3"/>
      <rect x="${x + 8}" y="${y + 14}" width="${w - 16}" height="${h - 34}" rx="3" fill="${abierta ? '#0c1210' : '#3c5650'}" stroke="#0a100e" stroke-width="2"
        ${abierta ? `transform="skewY(-8) translate(0 ${r1(w * 0.14)})"` : ''}/>
      <rect x="${x + 14}" y="${y + 22}" width="${w - 28}" height="${(h - 50) / 2 - 4}" rx="2" fill="none" stroke="#5a7a72" stroke-width="2"/>
      <rect x="${x + 14}" y="${y + 22 + (h - 50) / 2}" width="${w - 28}" height="${(h - 50) / 2 - 4}" rx="2" fill="none" stroke="#5a7a72" stroke-width="2"/>
      <circle cx="${x + w - 18}" cy="${y + h / 2}" r="4" fill="#b87a3a"/></g>`;
  }

  function charco(x, y, w) {
    return `<g><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.22}" fill="#9fe8e0" fill-opacity=".22" stroke="#bff6ff" stroke-opacity=".35" stroke-width="1.5"/>
      <ellipse class="onda-agua" cx="${x}" cy="${y}" rx="${w * 0.4}" ry="${w * 0.09}" fill="none" stroke="#dffcff" stroke-opacity=".6" stroke-width="1.5"/></g>`;
  }

  /* --- Invernadero ------------------------------------------------------------ */
  function maceta(p, x, y, tipo = 'hojas', s = 1, verde = '#3f8a46') {
    const hojas = {
      hojas: `<path d="M0 0 C-30 -20 -40 -60 -22 -88 C-14 -60 -8 -30 0 0 Z M0 0 C24 -26 40 -64 26 -96 C14 -66 6 -34 0 0 Z M0 0 C-6 -40 0 -80 4 -110 C12 -78 8 -38 0 0 Z" fill="${verde}" stroke="#0e2412" stroke-width="2"/>`,
      pinchos: `<path d="M0 0 L-26 -70 L-6 -10 L-4 -96 L6 -12 L20 -84 L8 -4 L34 -50 Z" fill="#5a9a3a" stroke="#123a10" stroke-width="2" stroke-linejoin="round"/>`,
      flor: `<path d="M0 0 C-4 -30 2 -60 0 -80" stroke="#2f6a2c" stroke-width="5" fill="none"/><path d="M0 -40 C-20 -40 -26 -56 -26 -56 C-14 -60 -4 -50 0 -40 Z M0 -50 C18 -54 26 -68 26 -68 C12 -72 2 -62 0 -50 Z" fill="${verde}"/>
        <g transform="translate(0 -86)"><circle r="8" fill="#ffd23c"/><circle cx="0" cy="-12" r="8" fill="#d0507a"/><circle cx="11" cy="-4" r="8" fill="#d0507a"/><circle cx="7" cy="10" r="8" fill="#d0507a"/><circle cx="-7" cy="10" r="8" fill="#d0507a"/><circle cx="-11" cy="-4" r="8" fill="#d0507a"/><circle r="6" fill="#ffd23c"/></g>`,
      raiz: `<path d="M0 -4 C-16 -20 -34 -24 -46 -18 C-34 -38 -14 -36 0 -14 Z M0 -4 C16 -24 36 -30 48 -22 C36 -44 12 -40 0 -16 Z M0 -8 C-4 -30 -2 -46 6 -58 C10 -40 6 -24 0 -8 Z" fill="#4a9a3a" stroke="#123a10" stroke-width="2"/>
        <ellipse cx="0" cy="-4" rx="14" ry="6" fill="#6a4a2a"/>`,
    }[tipo];
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="balancea" style="animation-delay:-${r1(entre(0, 4))}s">${hojas}</g>
      <path d="M-30 0 H30 L22 46 H-22 Z" fill="url(#${p}-barro)" stroke="#3a1a0a" stroke-width="2.5"/>
      <rect x="-34" y="-6" width="68" height="12" rx="3" fill="#b45e30" stroke="#3a1a0a" stroke-width="2.5"/>
      <ellipse cx="0" cy="-2" rx="28" ry="4" fill="#3a2414"/></g>`;
  }

  function enredadera(x, y, largo, verde = '#3f8a46') {
    let hojas = '';
    for (let i = 20; i < largo; i += 22) {
      const lado = (i / 22) % 2 ? 1 : -1;
      hojas += `<path d="M${x + Math.sin(i / 30) * 8} ${y + i} q${lado * 16} -6 ${lado * 20} 6 q${-lado * 10} 6 ${-lado * 20} -6 Z" fill="${verde}" stroke="#0e2412" stroke-width="1"/>`;
    }
    return `<g class="ondea" style="animation-delay:-${r1(entre(0, 4))}s"><path d="M${x} ${y} q12 ${largo / 4} 0 ${largo / 2} t0 ${largo / 2}" stroke="#2a5a24" stroke-width="3" fill="none"/>${hojas}</g>`;
  }

  function regadera(x, y) {
    return `<g transform="translate(${x} ${y})"><path d="M-22 0 H22 L18 -34 H-18 Z" fill="#7a8a96" stroke="#1a2228" stroke-width="2"/>
      <path d="M18 -26 L48 -46 M48 -46 l6 -2 -2 8 Z" stroke="#7a8a96" stroke-width="6" fill="#7a8a96" stroke-linecap="round"/>
      <path d="M-14 -34 q14 -26 28 0" stroke="#5a6a76" stroke-width="5" fill="none"/></g>`;
  }

  /* --- Torre y despacho ------------------------------------------------------- */
  function telescopio(p, x, y) {
    return `<g><path d="M${x} ${y - 70} L${x - 34} ${y} M${x} ${y - 70} L${x + 34} ${y} M${x} ${y - 70} V${y}" stroke="#5a3a22" stroke-width="5" stroke-linecap="round"/>
      <g transform="rotate(-32 ${x} ${y - 72})"><rect x="${x - 50}" y="${y - 84}" width="100" height="22" rx="6" fill="url(#${p}-oro)" stroke="#4a3010" stroke-width="2"/>
      <rect x="${x + 46}" y="${y - 88}" width="16" height="30" rx="4" fill="#b8862c" stroke="#4a3010" stroke-width="2"/>
      <path d="M${x - 30} ${y - 84} v22 M${x + 10} ${y - 84} v22" stroke="#7a5a1c" stroke-width="2"/></g></g>`;
  }

  function artilugio(p, x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-26 0 H26 L16 -16 H-16 Z" fill="url(#${p}-oro)" stroke="#4a3010" stroke-width="2"/>
      <path d="M0 -16 V-50" stroke="#9aa6b6" stroke-width="4"/>
      <g transform="translate(0 -74)">
        <circle r="10" fill="url(#${p}-oro)" stroke="#4a3010" stroke-width="1.5"/>
        <g class="gira"><ellipse rx="34" ry="12" fill="none" stroke="url(#${p}-plata)" stroke-width="3"/><circle cx="34" r="4.5" fill="#6aa8ff"/></g>
        <g class="gira lento"><ellipse rx="24" ry="30" fill="none" stroke="url(#${p}-plata)" stroke-width="2.5"/><circle cy="-30" r="3.5" fill="#ff8a5a"/></g>
        <g class="gira rapido"><ellipse rx="18" ry="6" fill="none" stroke="#d9b64e" stroke-width="2" transform="rotate(35)"/><circle cx="14" cy="10" r="3" fill="#9dffbf"/></g>
      </g></g>`;
  }

  // Ave de fuego en su percha
  function percha(p, x, y) {
    return `<g><path d="M${x} ${y} V${y - 150} M${x - 40} ${y - 150} H${x + 40}" stroke="url(#${p}-oro)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x - 30} ${y} H${x + 30}" stroke="#8a6420" stroke-width="9" stroke-linecap="round"/>
      <g class="flota lento" transform="translate(${x} ${y - 152})">${halo(p, 0, -30, 60)}
        <path d="M-6 -2 C-26 20 -34 52 -24 80 C-14 56 -8 40 2 22 C2 44 8 64 22 82 C20 54 14 30 8 4 Z" fill="#e0602a" stroke="#4a1a08" stroke-width="2"/>
        <path d="M-14 -20 C-16 -42 0 -58 16 -52 C30 -46 28 -24 14 -6 C6 4 -10 4 -14 -20 Z" fill="#d8402a" stroke="#4a1a08" stroke-width="2.5"/>
        <path d="M-12 -30 C-40 -40 -50 -16 -36 -2 C-30 -14 -22 -22 -10 -22 Z" fill="#f08a2a" stroke="#4a1a08" stroke-width="2"/>
        <path d="M14 -50 C20 -62 32 -64 36 -58 L24 -48 Z" fill="#ffc23c" stroke="#4a1a08" stroke-width="1.5"/>
        <circle cx="18" cy="-46" r="2.6" fill="#1a0a04"/>
        <path d="M8 -58 C6 -70 14 -76 20 -72 M14 -58 C16 -70 26 -72 28 -66" stroke="#ffc23c" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></g>`;
  }

  function cuenco(p, x, y) {
    return `<g>${halo(p, x, y - 70, 90, 'azul')}
      <path d="M${x - 24} ${y} H${x + 24} L${x + 14} ${y - 50} H${x - 14} Z" fill="url(#${p}-piedra)" stroke="#120e18" stroke-width="2"/>
      <path d="M${x - 56} ${y - 70} C${x - 50} ${y - 40} ${x + 50} ${y - 40} ${x + 56} ${y - 70} Z" fill="url(#${p}-piedra)" stroke="#120e18" stroke-width="2.5"/>
      <ellipse cx="${x}" cy="${y - 70}" rx="56" ry="11" fill="#c8e2ff" stroke="#120e18" stroke-width="2"/>
      <ellipse class="onda-agua" cx="${x}" cy="${y - 70}" rx="26" ry="5" fill="none" stroke="#ffffff" stroke-width="1.5"/>
      <path class="vapor" d="M${x - 10} ${y - 80} q-12 -26 6 -50" stroke="#dfeeff" stroke-opacity=".35" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M${x - 46} ${y - 62} q46 14 92 0" stroke="#7a7290" stroke-width="2" fill="none"/></g>`;
  }

  /* --- Ambiente: estrellas sueltas -------------------------------------------- */
  function estrellas(x, y, w, h, n, color = '#fff6d8') {
    let e = '';
    for (let i = 0; i < n; i++) {
      e += `<circle class="brilla" style="animation-delay:-${r1(entre(0, 4))}s" cx="${r1(x + entre(0, w))}" cy="${r1(y + entre(0, h))}" r="${r1(entre(0.8, 2.2))}" fill="${color}"/>`;
    }
    return e;
  }

  window.Piezas = {
    sembrar, azar, entre, elegir, defs, halo, llama, antorcha, vela, ventana, columna, estandarte, cuadro,
    estanteria, escalera, chimenea, sillon, mesaLectura, caldero, frasco, estantePociones, cadena,
    lavabo, cubiculo, charco, maceta, enredadera, regadera, telescopio, artilugio, percha, cuenco, estrellas,
  };
})();

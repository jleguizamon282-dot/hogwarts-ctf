/* =============================================================================
   avatar.js — El mago chibi en SVG (jugador y personajes del mapa)

     Avatar.svg(id, titulo)          marcado del personaje (ids únicos por copia)
     Avatar.aplicar(elemento, cfg)   colores (variables CSS) + variantes (data-*)
     Avatar.colores(elemento, cfg)   solo los colores
     Avatar.mascotaSvg(id, tipo)     una mascota suelta (p. ej. la Señora Norris)
     Avatar.sombreroSvg(id)          el Sombrero Seleccionador
     Avatar.espadaSvg(id)            la Espada de Gryffindor
     Avatar.CATALOGO                 opciones que puede elegir el jugador

   Cada copia del personaje lleva sus propios degradados (id único) y toma los
   colores de las variables CSS de su contenedor. Estilos: css/avatar.css.
   ============================================================================= */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     Catálogo (cada color: [luz, base, sombra])
     -------------------------------------------------------------------------- */
  const PIELES = {
    porcelana: { nombre: 'Porcelana', c: ['#ffeadb', '#f8d6c0', '#e6b49b'] },
    melocoton: { nombre: 'Melocotón', c: ['#ffe1c4', '#f6c49c', '#e2a27a'] },
    miel:      { nombre: 'Miel',      c: ['#f3c99b', '#e0a774', '#c58553'] },
    canela:    { nombre: 'Canela',    c: ['#dba574', '#bf8152', '#9c6438'] },
    cacao:     { nombre: 'Cacao',     c: ['#ad774e', '#8a5733', '#6a3f22'] },
    ebano:     { nombre: 'Ébano',     c: ['#80553a', '#5e3b25', '#432817'] },
  };
  const PELOS = {
    castano:   { nombre: 'Castaño',     c: ['#a0703f', '#6b4423', '#432a14'] },
    negro:     { nombre: 'Negro',       c: ['#5a4f5a', '#2a242d', '#141016'] },
    pelirrojo: { nombre: 'Pelirrojo',   c: ['#ee9550', '#c2582a', '#8c3a17'] },
    rubio:     { nombre: 'Rubio',       c: ['#f8dc94', '#dfb25a', '#b8873a'] },
    platino:   { nombre: 'Platino',     c: ['#fffaf0', '#e7dcc6', '#bfae90'] },
    rosa:      { nombre: 'Rosa chicle', c: ['#fbc0dc', '#e46fa8', '#ab3f77'] },
  };
  const OJOS = {
    verde:    { nombre: 'Verde',    c: ['#9ae8b0', '#2f9a57', '#14532d'] },
    marron:   { nombre: 'Marrón',   c: ['#d39a60', '#6e4422', '#3b230f'] },
    azul:     { nombre: 'Azul',     c: ['#a6d0ff', '#3a78d0', '#1d3f75'] },
    gris:     { nombre: 'Gris',     c: ['#e0e6ee', '#8592a3', '#4b5563'] },
    avellana: { nombre: 'Avellana', c: ['#ead07a', '#9b7a2c', '#5a4413'] },
  };
  // a = color principal, b = secundario, chispa = luz de la punta de la varita
  const CASAS = {
    Gryffindor: { a: '#8b1a1a', b: '#e8b830', chispa: '#ffb347', virtud: 'Valor',
      texto: 'fundada por Godric Gryffindor. Valentía, osadía y nobleza. Elemento: fuego.' },
    Slytherin:  { a: '#1a5c34', b: '#c0c7cc', chispa: '#7dffb0', virtud: 'Astucia',
      texto: 'fundada por Salazar Slytherin. Astucia, ambición y determinación. Elemento: agua.' },
    Ravenclaw:  { a: '#233a7a', b: '#c69a4e', chispa: '#8ec5ff', virtud: 'Sabiduría',
      texto: 'fundada por Rowena Ravenclaw. Ingenio, creatividad y sabiduría. Elemento: aire.' },
    Hufflepuff: { a: '#e8b72a', b: '#2b2520', chispa: '#ffe27a', virtud: 'Lealtad',
      texto: 'fundada por Helga Hufflepuff. Lealtad, paciencia y esfuerzo. Elemento: tierra.' },
  };
  // Colores que solo usan los personajes del mapa (no se ofrecen al jugador)
  const EXTRA = {
    piel: { palido: ['#f6f3ec', '#e0dbd0', '#bdb5a5'] },
    pelo: {
      blanco: ['#ffffff', '#ecedf2', '#b6b8c4'],
      gris: ['#c9c6c0', '#8f8b85', '#5f5b55'],
      castanoClaro: ['#bb915f', '#8a6a45', '#5e4429'],
      rubioLuna: ['#fff7d9', '#efe2aa', '#c8b47a'],
    },
    ojos: { rojo: ['#ff8a7a', '#d4231c', '#6e0a07'], negro: ['#6a5a52', '#2a1e1a', '#0d0907'] },
  };
  const TUNICAS = {
    alumno: ['#3b3947', '#17161e'],
    purpura: ['#7a4aa0', '#3b1d57'],
    negra: ['#27242d', '#09080c'],
    marron: ['#6e5845', '#3a2c20'],
  };

  const POR_DEFECTO = {
    piel: 'melocoton', colorPelo: 'castano', ojos: 'verde', pelo: '1', casa: 'Gryffindor',
    gafas: 'ninguna', varita: 'acebo', mascota: 'ninguna', cicatriz: false,
    uniforme: true, tunica: 'alumno', barba: false, sombrero: false, nariz: 'normal',
    pecas: false, pendientes: false, boca: 'sonrisa', mejillas: true, cejas: true, ceno: false,
    estado: 'normal', chispa: null,
  };

  const si = (v) => (v ? 'si' : 'no');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const buscar = (tabla, extra, clave, defecto) => (tabla[clave] && tabla[clave].c) || extra[clave] || tabla[defecto].c;

  /* --------------------------------------------------------------------------
     Aplicar una configuración a un contenedor
     -------------------------------------------------------------------------- */
  function colores(el, cfg) {
    const c = { ...POR_DEFECTO, ...cfg };
    const piel = buscar(PIELES, EXTRA.piel, c.piel, 'melocoton');
    const pelo = buscar(PELOS, EXTRA.pelo, c.colorPelo, 'castano');
    const ojos = buscar(OJOS, EXTRA.ojos, c.ojos, 'verde');
    const tunica = TUNICAS[c.tunica] || TUNICAS.alumno;
    const casa = CASAS[c.casa] || CASAS.Gryffindor;
    const variables = {
      '--piel-luz': piel[0], '--piel': piel[1], '--piel-sombra': piel[2],
      '--pelo-brillo': pelo[0], '--pelo': pelo[1], '--pelo-sombra': pelo[2],
      '--ojos-claro': ojos[0], '--ojos': ojos[1], '--ojos-oscuro': ojos[2],
      '--tunica-a': tunica[0], '--tunica-b': tunica[1],
      '--casa-a': casa.a, '--casa-b': casa.b, '--chispa': c.chispa || casa.chispa,
    };
    for (const [nombre, valor] of Object.entries(variables)) el.style.setProperty(nombre, valor);
  }

  function variantes(el, cfg) {
    const c = { ...POR_DEFECTO, ...cfg };
    el.classList.add('mago');
    Object.assign(el.dataset, {
      pelo: c.pelo, gafas: c.gafas, varita: c.varita, mascota: c.mascota, nariz: c.nariz, boca: c.boca,
      estado: c.estado, cicatriz: si(c.cicatriz), uniforme: si(c.uniforme), barba: si(c.barba),
      sombrero: si(c.sombrero), pecas: si(c.pecas), pendientes: si(c.pendientes),
      mejillas: si(c.mejillas), cejas: si(c.cejas), ceno: si(c.ceno),
    });
  }

  function aplicar(el, cfg) {
    colores(el, cfg);
    variantes(el, cfg);
  }

  /* --------------------------------------------------------------------------
     Piezas del dibujo (viewBox 0 0 320 420; el suelo está en y = 392)
     -------------------------------------------------------------------------- */
  const CONTORNO = '#2b1a12';

  const defs = (p) => `
    <defs>
      <radialGradient id="${p}-piel" cx=".42" cy=".34" r=".75"><stop class="st-piel-luz" offset="0"/><stop class="st-piel" offset=".62"/><stop class="st-piel-sombra" offset="1"/></radialGradient>
      <linearGradient id="${p}-pelo" x1=".15" y1="0" x2=".85" y2="1"><stop class="st-pelo-brillo" offset="0"/><stop class="st-pelo" offset=".45"/><stop class="st-pelo-sombra" offset="1"/></linearGradient>
      <radialGradient id="${p}-iris" cx=".5" cy=".65" r=".62"><stop class="st-ojos-claro" offset="0"/><stop class="st-ojos" offset=".6"/><stop class="st-ojos-oscuro" offset="1"/></radialGradient>
      <linearGradient id="${p}-tunica" x1="0" y1="0" x2="0" y2="1"><stop class="st-tunica-a" offset="0"/><stop class="st-tunica-b" offset="1"/></linearGradient>
      <linearGradient id="${p}-manga" x1="0" y1="0" x2="1" y2="0"><stop class="st-tunica-b" offset="0"/><stop class="st-tunica-a" offset=".5"/><stop class="st-tunica-b" offset="1"/></linearGradient>
      <pattern id="${p}-rayas" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect class="f-casa-a" width="14" height="14"/><rect class="f-casa-b" y="9" width="14" height="5"/></pattern>
      <pattern id="${p}-rayas-h" width="14" height="13" patternUnits="userSpaceOnUse"><rect class="f-casa-a" width="14" height="13"/><rect class="f-casa-b" y="8" width="14" height="5"/></pattern>
      <radialGradient id="${p}-chispa"><stop offset="0" stop-color="#fff"/><stop class="st-chispa" offset=".35"/><stop class="st-chispa" offset="1" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-plumas" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6dbe4"/></radialGradient>
      <radialGradient id="${p}-gato" cx=".4" cy=".3" r=".8"><stop class="st-gato-luz" offset="0"/><stop class="st-gato" offset="1"/></radialGradient>
      <radialGradient id="${p}-sapo" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#9db458"/><stop offset="1" stop-color="#58692b"/></radialGradient>
      <linearGradient id="${p}-serpiente" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fbf63"/><stop offset="1" stop-color="#3d6a2c"/></linearGradient>
      <linearGradient id="${p}-sombrero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9566c0"/><stop offset="1" stop-color="#3f2160"/></linearGradient>
    </defs>`;

  const RIZOS_ATRAS = [[74, 156, 28], [78, 112, 30], [104, 76, 32], [140, 56, 32], [180, 56, 32], [216, 76, 32], [242, 112, 30], [246, 156, 28], [68, 198, 22], [252, 198, 22]];
  const RIZOS_FRENTE = [[98, 104, 18], [124, 90, 20], [152, 84, 20], [180, 86, 20], [206, 96, 19], [228, 112, 16]];
  const circulos = (lista) => lista.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');

  const peloAtras = (p) => `
    <g class="pelo-atras">
      <path class="variante pelo-1 pelo-forma" fill="url(#${p}-pelo)" d="M62 188 C46 148 50 100 82 70 C102 50 128 40 150 38 L156 27 L167 38 C200 38 230 52 248 78 C268 106 272 150 258 188 Z"/>
      <path class="variante pelo-2 pelo-forma" fill="url(#${p}-pelo)" d="M60 150 C54 92 98 52 160 52 C222 52 266 92 260 150 C262 188 272 222 264 258 C258 282 236 290 222 276 C230 250 228 220 220 196 L100 196 C92 220 90 250 98 276 C84 290 62 282 56 258 C48 222 58 188 60 150 Z"/>
      <path class="variante pelo-3 pelo-forma" fill="url(#${p}-pelo)" d="M62 172 C52 108 98 56 160 54 C222 56 268 108 258 172 Z"/>
      <g class="variante pelo-4">
        <g class="rizos-contorno" fill="url(#${p}-pelo)">${circulos(RIZOS_ATRAS)}</g>
        <g fill="url(#${p}-pelo)">${circulos(RIZOS_ATRAS)}</g>
      </g>
    </g>`;

  const cuerpo = (p) => `
    <g class="cuerpo">
      <rect x="136" y="348" width="19" height="36" rx="7" fill="#2a2733" stroke="#14121a" stroke-width="2.4"/>
      <rect x="165" y="348" width="19" height="36" rx="7" fill="#2a2733" stroke="#14121a" stroke-width="2.4"/>
      <ellipse cx="143" cy="386" rx="20" ry="10" fill="#1b1922" stroke="#0d0b10" stroke-width="2.2"/>
      <ellipse cx="177" cy="386" rx="20" ry="10" fill="#1b1922" stroke="#0d0b10" stroke-width="2.2"/>
      <ellipse cx="136" cy="382" rx="6" ry="2.4" fill="#fff" opacity=".22"/>
      <ellipse cx="170" cy="382" rx="6" ry="2.4" fill="#fff" opacity=".22"/>
      <path d="M108 268 C110 248 124 236 142 234 L178 234 C196 236 210 248 212 268 L226 354 C200 368 120 368 94 354 Z" fill="url(#${p}-tunica)" stroke="#121017" stroke-width="2.6" stroke-linejoin="round"/>
      <g class="variante uniforme">
        <path d="M146 240 L174 240 L174 360 C166 362 154 362 146 360 Z" fill="#4b4e5a"/>
        <path class="trazo-casa-a" d="M146 240 C148 290 147 330 145 361 M174 240 C172 290 173 330 175 361" stroke-width="5" stroke-linecap="round"/>
        <path d="M156 252 L164 252 L170 300 L160 312 L150 300 Z" fill="url(#${p}-rayas)" stroke="#1a1418" stroke-width="1.6" stroke-linejoin="round"/>
        <path class="f-casa-a trazo-casa-b" d="M186 278 H206 V290 C206 298 200 303 196 305 C192 303 186 298 186 290 Z" stroke-width="2.2"/>
        <path class="f-casa-b" d="M196 283 L198 288 L203 288 L199 291 L201 296 L196 293 L191 296 L193 291 L189 288 L194 288 Z"/>
      </g>
      <g class="variante sin-uniforme">
        <path d="M134 234 C146 246 174 246 186 234 L186 244 C174 256 146 256 134 244 Z" fill="url(#${p}-tunica)" stroke="#121017" stroke-width="2"/>
        <path d="M160 250 V362" stroke="#000" stroke-opacity=".45" stroke-width="2.4"/>
        <g fill="#0c0b10" stroke="#5a5866" stroke-width="1">${[262, 278, 294, 310, 326].map((y) => `<circle cx="160" cy="${y}" r="3"/>`).join('')}</g>
      </g>
    </g>`;

  const bufanda = (p) => `
    <g class="variante uniforme bufanda">
      <path d="M118 246 C115 268 113 294 115 318 L138 318 C137 294 138 270 141 250 Z" fill="url(#${p}-rayas-h)" stroke="#1a1418" stroke-width="2.2" stroke-linejoin="round"/>
      <path class="trazo-casa-a" d="M118 319 v8 M123 319 v9 M128 319 v8 M133 319 v9 M137 319 v8" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M110 240 C128 226 192 226 210 240 C214 248 211 256 205 260 C186 250 134 250 115 260 C109 256 106 248 110 240 Z" fill="url(#${p}-rayas)" stroke="#1a1418" stroke-width="2.4" stroke-linejoin="round"/>
    </g>`;

  const brazos = (p) => `
    <g class="brazos">
      <path d="M120 250 C102 260 90 278 80 300 L104 312 C108 298 114 286 126 276 Z" fill="url(#${p}-manga)" stroke="#121017" stroke-width="2.4" stroke-linejoin="round"/>
      <path class="variante uniforme trazo-casa-a" d="M81 301 L103 311" stroke-width="4" stroke-linecap="round"/>
      <path d="M200 250 C218 260 230 280 238 300 L214 312 C210 298 206 286 194 276 Z" fill="url(#${p}-manga)" stroke="#121017" stroke-width="2.4" stroke-linejoin="round"/>
      <path class="variante uniforme trazo-casa-a" d="M237 301 L215 311" stroke-width="4" stroke-linecap="round"/>
    </g>`;

  const varitas = (p) => `
    <g class="varita">
      <g class="variante varita-acebo">
        <path d="M102.4 318.9 L87.2 297.9 L79.3 303.3 L93.6 325.1 Z" fill="#7a4a24" stroke="#2b1a0e" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M88 297.3 L85.2 293.2 L75.6 299.8 L78.5 303.9 Z" fill="#e2bd6e" stroke="#2b1a0e" stroke-width="1.4"/>
        <path d="M83.4 294.4 L37.2 231.1 L34.8 232.9 L77.4 298.5 Z" fill="#c68d52" stroke="#2b1a0e" stroke-width="1.4" stroke-linejoin="round"/>
      </g>
      <g class="variante varita-sauco">
        <path d="M102.1 319.2 L37.3 231.1 L34.7 232.9 L93.9 324.8 Z" fill="#bcab8e" stroke="#3a3024" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="81" cy="297.3" r="4.6" fill="#a8977c" stroke="#3a3024" stroke-width="1.4"/>
        <circle cx="68.5" cy="279.2" r="3.9" fill="#a8977c" stroke="#3a3024" stroke-width="1.4"/>
        <circle cx="56" cy="261.1" r="3.2" fill="#a8977c" stroke="#3a3024" stroke-width="1.4"/>
      </g>
      <g class="variante varita-vid">
        <path d="M102.9 318.6 L84.1 292.7 L75.6 298.6 L93.1 325.4 Z" fill="#4a2a18" stroke="#1e1008" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M101.2 316.1 L89.6 319.3 M97.8 311.2 L86.2 314.4 M94.4 306.2 L82.8 309.4 M91 301.3 L79.4 304.5 M87.6 296.4 L76 299.5" stroke="#9a6a40" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M82.6 293.7 L37.2 231.2 L34.8 232.8 L77 297.6 Z" fill="#6a4026" stroke="#1e1008" stroke-width="1.4" stroke-linejoin="round"/>
      </g>
      <g class="variante varita-tejo">
        <path d="M102.1 319.2 L37.3 231.1 L34.7 232.9 L93.9 324.8 Z" fill="#efe9da" stroke="#5a5244" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M100 322 C108 328 110 336 102 340 C104 334 100 330 94 328 Z" fill="#efe9da" stroke="#5a5244" stroke-width="1.4"/>
        <path d="M86 304 l-6 4 M74 287 l-6 4 M62 270 l-5 3" stroke="#8a8270" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g class="variante punta-varita">
        <circle class="chispa-punta" cx="36" cy="232" r="15" fill="url(#${p}-chispa)"/>
        <path class="chispitas" d="M22 214 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5Z M52 210 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1Z M18 244 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1Z" fill="#fff6d5"/>
      </g>
    </g>
    <circle cx="88" cy="306" r="12.5" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2"/>
    <circle cx="228" cy="308" r="12.5" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2"/>`;

  const PECAS = [[94, 184], [100, 190], [106, 183], [112, 189], [208, 183], [214, 189], [220, 184], [226, 190], [150, 178], [170, 178]];

  const cabeza = (p) => `
    <g class="cabeza">
      <circle cx="72" cy="168" r="15" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2.2"/>
      <circle cx="248" cy="168" r="15" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2.2"/>
      <path d="M68 162 q6 6 1 12 M252 162 q-6 6 -1 12" fill="none" stroke="#5a3a2a" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="160" cy="154" rx="90" ry="86" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2.6"/>
      <path class="variante cejas-normales trazo-ceja" d="M106 128 Q124 119 141 127 M179 127 Q196 119 214 128" stroke-width="4.5" stroke-linecap="round"/>
      <path class="variante cejas-enfado trazo-ceja" d="M104 120 L142 134 M216 120 L178 134" stroke-width="5.5" stroke-linecap="round"/>
      <g class="variante ojos-normales">
        <ellipse cx="124" cy="162" rx="18" ry="21" fill="#fff" stroke="#2b1a1a" stroke-width="2.4"/>
        <ellipse cx="196" cy="162" rx="18" ry="21" fill="#fff" stroke="#2b1a1a" stroke-width="2.4"/>
        <circle cx="127" cy="165" r="13.5" fill="url(#${p}-iris)"/>
        <circle cx="193" cy="165" r="13.5" fill="url(#${p}-iris)"/>
        <circle cx="127" cy="166" r="6.6" fill="#140c0a"/>
        <circle cx="193" cy="166" r="6.6" fill="#140c0a"/>
        <circle cx="132" cy="157" r="4.6" fill="#fff"/>
        <circle cx="198" cy="157" r="4.6" fill="#fff"/>
        <circle cx="121" cy="172" r="2.2" fill="#fff" opacity=".9"/>
        <circle cx="187" cy="172" r="2.2" fill="#fff" opacity=".9"/>
        <path d="M104 153 Q124 134 144 152 M176 152 Q196 134 216 153" fill="none" stroke="#2b1a1a" stroke-width="4.2" stroke-linecap="round"/>
        <path class="variante parpados-enfado" d="M103 147 L145 156 L145 150 L103 139 Z M217 147 L175 156 L175 150 L217 139 Z" fill="#2b1a1a"/>
      </g>
      <g class="variante ojos-x" stroke="#2b1a1a" stroke-width="6" stroke-linecap="round">
        <path d="M110 148 L138 176 M138 148 L110 176 M182 148 L210 176 M210 148 L182 176"/>
      </g>
      <g class="variante mejillas">
        <ellipse cx="100" cy="196" rx="13" ry="8" fill="#ff8a8a" opacity=".38"/>
        <ellipse cx="220" cy="196" rx="13" ry="8" fill="#ff8a8a" opacity=".38"/>
      </g>
      <g class="variante pecas" fill="#c9784a" opacity=".75">${PECAS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>
      <ellipse class="variante nariz-normal f-piel-sombra" cx="160" cy="189" rx="5" ry="3.6"/>
      <path class="variante nariz-ganchuda" d="M160 160 C153 174 148 190 153 199 C158 205 169 204 173 198 C168 196 165 189 165 176 C165 170 163 164 160 160 Z" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2"/>
      <path class="variante nariz-serpiente" d="M151 188 q3 -7 5 0 M164 188 q3 -7 5 0" fill="none" stroke="#5a4a48" stroke-width="2.6" stroke-linecap="round"/>
      <path class="variante boca-sonrisa" d="M147 204 Q160 218 173 204 Q160 209 147 204 Z" fill="#8a2e25" stroke="#5a1e18" stroke-width="1.6" stroke-linejoin="round"/>
      <path class="variante boca-seria" d="M148 209 H172" stroke="#5a1e18" stroke-width="3.2" stroke-linecap="round"/>
      <path class="variante boca-malvada" d="M143 205 Q156 214 177 200" fill="none" stroke="#3a0e0e" stroke-width="3.4" stroke-linecap="round"/>
      <g class="variante boca-lengua">
        <path d="M145 205 Q160 212 175 205" fill="none" stroke="#5a1e18" stroke-width="3" stroke-linecap="round"/>
        <path d="M151 207 C150 222 154 230 160 230 C166 230 170 222 169 207 Z" fill="#ef7a8a" stroke="#7a2a30" stroke-width="2"/>
        <path d="M160 211 V224" stroke="#c4505e" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </g>`;

  const barba = (p) => `
    <g class="variante barba">
      <path d="M106 190 C112 210 128 216 146 212 C152 206 168 206 174 212 C192 216 208 210 214 190 C222 230 214 290 188 330 C178 346 168 352 160 362 C152 352 142 346 132 330 C106 290 98 230 106 190 Z" fill="url(#${p}-pelo)" stroke="#8d8f9c" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M150 236 C146 270 150 300 156 334 M170 236 C174 270 170 300 164 334 M132 226 C130 260 138 290 146 316 M188 226 C190 260 182 290 174 316" fill="none" stroke="#9ea1ae" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
      <path d="M132 201 C142 193 155 195 160 202 C165 195 178 193 188 201 C181 212 168 212 160 207 C152 212 139 212 132 201 Z" fill="url(#${p}-pelo)" stroke="#8d8f9c" stroke-width="2"/>
    </g>`;

  const peloFrente = (p) => `
    <g class="pelo-frente">
      <g class="variante pelo-1">
        <path class="pelo-forma" fill="url(#${p}-pelo)" d="M70 136 C70 100 92 70 128 62 C160 54 204 60 230 82 C246 96 252 116 250 136 L238 120 L234 140 L220 114 L210 134 L198 108 L186 130 L174 104 L162 128 L150 104 L138 128 L128 106 L114 132 L104 110 L94 136 L86 116 Z"/>
        <path class="brillo-pelo" d="M100 84 C120 68 150 62 178 66 M198 72 C210 76 220 84 228 94"/>
      </g>
      <g class="variante pelo-2">
        <path class="pelo-forma" fill="url(#${p}-pelo)" d="M70 150 C66 104 98 64 152 58 C204 54 244 82 250 128 C236 104 210 92 180 96 C150 100 118 116 96 140 C88 150 80 162 76 176 C72 168 70 158 70 150 Z"/>
        <path class="pelo-forma" fill="url(#${p}-pelo)" d="M250 128 C256 150 254 176 248 198 C242 180 238 160 240 140 Z"/>
        <path class="brillo-pelo" d="M98 94 C122 74 156 66 186 70"/>
      </g>
      <g class="variante pelo-3">
        <path class="pelo-forma" fill="url(#${p}-pelo)" d="M130 60 C102 64 78 88 72 132 C88 112 108 100 126 94 Z"/>
        <path class="pelo-forma" fill="url(#${p}-pelo)" d="M130 60 C176 52 238 66 250 134 C236 112 210 100 180 102 C158 104 140 96 130 60 Z"/>
        <path class="brillo-pelo" d="M152 66 C182 62 212 72 232 92"/>
      </g>
      <g class="variante pelo-4">
        <g class="rizos-contorno" fill="url(#${p}-pelo)">${circulos(RIZOS_FRENTE)}</g>
        <g fill="url(#${p}-pelo)">${circulos(RIZOS_FRENTE)}</g>
        <path class="brillo-pelo fino" d="M118 84 q6 -6 12 0 M146 78 q6 -6 12 0 M174 80 q6 -6 12 0 M200 90 q6 -6 12 0 M96 98 q5 -5 10 0"/>
      </g>
    </g>`;

  const sombreroMago = (p) => `
    <g class="variante sombrero-mago">
      <path d="M84 80 C100 42 126 6 150 -22 C160 -36 178 -42 196 -34 C184 -28 176 -16 176 0 C178 28 196 58 238 80 C190 96 130 96 84 80 Z" fill="url(#${p}-sombrero)" stroke="#1e0f30" stroke-width="2.6" stroke-linejoin="round"/>
      <ellipse cx="160" cy="84" rx="104" ry="18" fill="url(#${p}-sombrero)" stroke="#1e0f30" stroke-width="2.6"/>
      <path d="M92 76 C130 90 196 90 232 76" fill="none" stroke="#d9b566" stroke-width="7"/>
      <g fill="#f3d27a">
        <path d="M134 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z M170 6 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6Z M150 56 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6Z M196 50 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z"/>
      </g>
    </g>`;

  const gafas = () => `
    <g class="gafas">
      <g class="variante gafas-redondas">
        <circle cx="124" cy="162" r="29" fill="#fff" fill-opacity=".1" stroke="#40201a" stroke-width="5"/>
        <circle cx="196" cy="162" r="29" fill="#fff" fill-opacity=".1" stroke="#40201a" stroke-width="5"/>
        <path d="M153 158 Q160 151 167 158 M95 156 L74 150 M225 156 L246 150" fill="none" stroke="#40201a" stroke-width="5" stroke-linecap="round"/>
        <path d="M104 146 Q112 138 123 136 M176 146 Q184 138 195 136" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="variante gafas-cuadradas">
        <rect x="95" y="138" width="58" height="48" rx="12" fill="#fff" fill-opacity=".1" stroke="#1d1d26" stroke-width="5"/>
        <rect x="167" y="138" width="58" height="48" rx="12" fill="#fff" fill-opacity=".1" stroke="#1d1d26" stroke-width="5"/>
        <path d="M153 156 H167 M95 152 L74 148 M225 152 L246 148" fill="none" stroke="#1d1d26" stroke-width="5" stroke-linecap="round"/>
        <path d="M104 148 L116 142 M176 148 L188 142" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="variante gafas-media-luna">
        <path d="M97 164 H151 A27 27 0 0 1 97 164 Z" fill="#fff" fill-opacity=".12" stroke="#d4a83a" stroke-width="4.2" stroke-linejoin="round"/>
        <path d="M169 164 H223 A27 27 0 0 1 169 164 Z" fill="#fff" fill-opacity=".12" stroke="#d4a83a" stroke-width="4.2" stroke-linejoin="round"/>
        <path d="M151 164 Q160 158 169 164 M97 164 L74 152 M223 164 L246 152" fill="none" stroke="#d4a83a" stroke-width="4" stroke-linecap="round"/>
      </g>
    </g>`;

  const adornos = () => `
    <g class="variante pendientes">
      <path d="M70 182 V190 M250 182 V190" stroke="#8a6a2a" stroke-width="1.6"/>
      <path d="M64 192 C64 186 76 186 76 192 C76 200 70 206 70 210 C70 206 64 200 64 192 Z M244 192 C244 186 256 186 256 192 C256 200 250 206 250 210 C250 206 244 200 244 192 Z" fill="#e2445a" stroke="#7a1e2a" stroke-width="1.4"/>
      <path d="M66 188 l4 -7 4 7 M246 188 l4 -7 4 7" fill="#5aa63a" stroke="#2f6a1f" stroke-width="1.4" stroke-linejoin="round"/>
    </g>
    <g class="variante cicatriz">
      <path d="M205 104 L196 117 L205 118 L195 132" fill="none" stroke="#f6d3bd" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M205 104 L196 117 L205 118 L195 132" fill="none" stroke="#b8433a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;

  const mascotas = (p) => `
    <g class="mascota">
      <g class="variante mascota-lechuza">
        <ellipse cx="272" cy="394" rx="26" ry="6" fill="#000" opacity=".25"/>
        <path d="M254 312 L249 298 L263 307 Z M290 312 L295 298 L281 307 Z" fill="#eef1f5" stroke="#3a3540" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M272 300 C298 300 304 330 302 352 C300 378 288 392 272 392 C256 392 244 378 242 352 C240 330 246 300 272 300 Z" fill="url(#${p}-plumas)" stroke="#3a3540" stroke-width="2.4"/>
        <path d="M246 330 C234 346 236 372 250 384 C254 366 254 346 250 330 Z M298 330 C310 346 308 372 294 384 C290 366 290 346 294 330 Z" fill="#e2e6ed" stroke="#3a3540" stroke-width="2" stroke-linejoin="round"/>
        <path d="M272 318 C286 316 296 326 294 338 C292 348 282 350 272 346 C262 350 252 348 250 338 C248 326 258 316 272 318 Z" fill="#fff"/>
        <g class="ojos-lechuza">
          <circle cx="262" cy="334" r="8.5" fill="#f5c542" stroke="#3a3540" stroke-width="1.8"/>
          <circle cx="282" cy="334" r="8.5" fill="#f5c542" stroke="#3a3540" stroke-width="1.8"/>
          <circle cx="263" cy="335" r="4.4" fill="#1a1414"/>
          <circle cx="281" cy="335" r="4.4" fill="#1a1414"/>
          <circle cx="264.6" cy="332.6" r="1.6" fill="#fff"/>
          <circle cx="282.6" cy="332.6" r="1.6" fill="#fff"/>
        </g>
        <path d="M268 342 L276 342 L272 350 Z" fill="#a3a9b2" stroke="#3a3540" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M262 364 l3 3 3 -3 M276 360 l3 3 3 -3 M266 376 l3 3 3 -3 M281 372 l3 3 3 -3" fill="none" stroke="#7f8794" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M262 390 l-4 5 m4 -5 v6 m0 -6 l4 5 M282 390 l-4 5 m4 -5 v6 m0 -6 l4 5" fill="none" stroke="#d99a3c" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="variante mascota-gato">
        <ellipse cx="272" cy="394" rx="28" ry="6" fill="#000" opacity=".25"/>
        <path class="cola-gato" d="M294 386 C320 380 318 344 302 336" fill="none" stroke="#3a2412" stroke-width="12" stroke-linecap="round"/>
        <path class="cola-gato" d="M294 386 C320 380 318 344 302 336" fill="none" stroke="url(#${p}-gato)" stroke-width="7.5" stroke-linecap="round"/>
        <path d="M272 330 C292 330 300 356 298 378 C297 390 286 394 272 394 C258 394 247 390 246 378 C244 356 252 330 272 330 Z" fill="url(#${p}-gato)" stroke="#3a2412" stroke-width="2.2"/>
        <path d="M272 344 C282 350 284 372 272 382 C260 372 262 350 272 344 Z" fill="#f7e2c6" opacity=".9"/>
        <ellipse cx="262" cy="390" rx="7" ry="4.5" fill="#f7e2c6" stroke="#3a2412" stroke-width="1.6"/>
        <ellipse cx="282" cy="390" rx="7" ry="4.5" fill="#f7e2c6" stroke="#3a2412" stroke-width="1.6"/>
        <path d="M250 316 L252 290 L268 304 Z M294 316 L292 290 L276 304 Z" fill="url(#${p}-gato)" stroke="#3a2412" stroke-width="2" stroke-linejoin="round"/>
        <path d="M254 308 L255 296 L263 304 Z M290 308 L289 296 L281 304 Z" fill="#f2a5a5"/>
        <ellipse cx="272" cy="318" rx="25" ry="21" fill="url(#${p}-gato)" stroke="#3a2412" stroke-width="2.2"/>
        <path d="M266 300 l2 8 M272 298 v9 M278 300 l-2 8" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>
        <ellipse class="f-ojos-gato" cx="263" cy="318" rx="5" ry="6" stroke="#2c3a12" stroke-width="1.4"/>
        <ellipse class="f-ojos-gato" cx="281" cy="318" rx="5" ry="6" stroke="#2c3a12" stroke-width="1.4"/>
        <ellipse cx="263" cy="318.5" rx="1.7" ry="4.6" fill="#14100a"/>
        <ellipse cx="281" cy="318.5" rx="1.7" ry="4.6" fill="#14100a"/>
        <path d="M269 325 h6 l-3 3 Z" fill="#e88a9a"/>
        <path d="M272 328 q-4 4 -8 1 M272 328 q4 4 8 1 M258 325 h-15 M258 329 l-14 4 M286 325 h15 M286 329 l14 4" fill="none" stroke="#3a2412" stroke-width="1.3" stroke-linecap="round"/>
      </g>
      <g class="variante mascota-sapo">
        <ellipse cx="272" cy="395" rx="34" ry="6" fill="#000" opacity=".25"/>
        <ellipse cx="248" cy="386" rx="15" ry="8" fill="#5f7334" stroke="#2f3a16" stroke-width="2"/>
        <ellipse cx="296" cy="386" rx="15" ry="8" fill="#5f7334" stroke="#2f3a16" stroke-width="2"/>
        <path d="M272 342 C300 342 312 362 308 380 C304 392 290 394 272 394 C254 394 240 392 236 380 C232 362 244 342 272 342 Z" fill="url(#${p}-sapo)" stroke="#2f3a16" stroke-width="2.2"/>
        <ellipse cx="272" cy="381" rx="20" ry="9" fill="#dcd69c" opacity=".85"/>
        <circle cx="256" cy="344" r="11" fill="url(#${p}-sapo)" stroke="#2f3a16" stroke-width="2"/>
        <circle cx="288" cy="344" r="11" fill="url(#${p}-sapo)" stroke="#2f3a16" stroke-width="2"/>
        <circle cx="256" cy="343" r="6.6" fill="#e8c34a" stroke="#2f3a16" stroke-width="1.2"/>
        <circle cx="288" cy="343" r="6.6" fill="#e8c34a" stroke="#2f3a16" stroke-width="1.2"/>
        <ellipse cx="256" cy="343" rx="4" ry="1.8" fill="#14100a"/>
        <ellipse cx="288" cy="343" rx="4" ry="1.8" fill="#14100a"/>
        <path d="M252 364 Q272 374 292 364" fill="none" stroke="#2f3a16" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="284" cy="356" r="2.6" fill="#45561f" opacity=".7"/>
        <circle cx="262" cy="358" r="2" fill="#45561f" opacity=".7"/>
        <circle cx="294" cy="370" r="2.2" fill="#45561f" opacity=".7"/>
        <path d="M258 384 l-6 9 M286 384 l6 9" fill="none" stroke="#2f3a16" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <g class="variante mascota-serpiente">
        <ellipse cx="272" cy="394" rx="38" ry="6" fill="#000" opacity=".25"/>
        <ellipse cx="272" cy="382" rx="35" ry="11" fill="url(#${p}-serpiente)" stroke="#1d3318" stroke-width="2.2"/>
        <ellipse cx="268" cy="371" rx="26" ry="9" fill="url(#${p}-serpiente)" stroke="#1d3318" stroke-width="2.2"/>
        <path d="M256 370 C244 344 260 320 282 316" fill="none" stroke="#1d3318" stroke-width="15" stroke-linecap="round"/>
        <path d="M256 370 C244 344 260 320 282 316" fill="none" stroke="#6a9a48" stroke-width="10" stroke-linecap="round"/>
        <path d="M278 304 C294 298 308 306 308 316 C308 326 294 330 280 326 C272 322 270 310 278 304 Z" fill="url(#${p}-serpiente)" stroke="#1d3318" stroke-width="2.2"/>
        <ellipse cx="294" cy="310" rx="3.4" ry="2.6" fill="#f2d14a"/>
        <ellipse cx="294" cy="310" rx="1" ry="2.3" fill="#140c0a"/>
        <path d="M308 318 l9 1 m-3 -1 l4 -3 m-4 3 l4 3" fill="none" stroke="#c4202f" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M248 382 l6 -4 6 4 M266 385 l6 -4 6 4 M284 382 l6 -4 6 4 M254 368 l5 -3 5 3 M272 368 l5 -3 5 3" fill="none" stroke="#2c4a22" stroke-width="1.6"/>
      </g>
    </g>`;

  /* --------------------------------------------------------------------------
     Dibujos completos
     -------------------------------------------------------------------------- */
  function svg(p, titulo) {
    return `<svg class="mago-svg" viewBox="0 0 320 420" overflow="visible" role="img" aria-label="${esc(titulo || 'Personaje')}">
      ${defs(p)}
      <ellipse class="sombra-suelo" cx="160" cy="392" rx="74" ry="11"/>
      ${peloAtras(p)}${cuerpo(p)}${bufanda(p)}${brazos(p)}${varitas(p)}
      ${cabeza(p)}${barba(p)}${peloFrente(p)}${sombreroMago(p)}${gafas()}${adornos()}
      ${mascotas(p)}
    </svg>`;
  }

  // Una mascota suelta (la Señora Norris es un gato con otros colores)
  function mascotaSvg(p, tipo) {
    return `<svg class="mago-svg" viewBox="216 286 112 112" role="img" aria-label="${esc(tipo)}">
      ${defs(p)}${mascotas(p)}
    </svg>`;
  }

  function sombreroSvg(p) {
    return `<svg class="sombrero-svg" viewBox="0 0 240 240" role="img" aria-label="Sombrero Seleccionador">
      <defs>
        <linearGradient id="${p}-tela" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a07f57"/><stop offset=".6" stop-color="#6e5234"/><stop offset="1" stop-color="#3f2d1a"/></linearGradient>
      </defs>
      <ellipse cx="120" cy="216" rx="94" ry="12" fill="#000" opacity=".3"/>
      <path d="M20 198 C40 178 200 178 220 198 C200 218 40 218 20 198 Z" fill="#5a4229" stroke="#22170c" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 196 C58 150 74 118 94 94 C100 70 104 52 118 36 C134 18 162 14 176 30 C186 42 178 58 166 56 C152 54 150 70 152 86 C160 120 178 156 192 196 C150 206 92 206 50 196 Z" fill="url(#${p}-tela)" stroke="#22170c" stroke-width="3" stroke-linejoin="round"/>
      <path d="M66 152 L94 146 L98 168 L70 174 Z M150 90 L168 86 L172 104 L154 108 Z" fill="#5d4429" stroke="#22170c" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M100 98 Q114 90 128 98 M90 120 Q108 112 126 120 M150 112 Q160 106 170 112" fill="none" stroke="#2a1d10" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M80 126 Q96 114 114 124 M130 120 Q148 108 166 118" fill="none" stroke="#22170c" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M84 138 Q97 128 110 138 Q97 144 84 138 Z M134 132 Q147 122 160 132 Q147 138 134 132 Z" fill="#160e06"/>
      <g class="sombrero-boca">
        <path d="M82 168 C100 154 142 152 162 164 C152 184 100 186 82 168 Z" fill="#160e06" stroke="#22170c" stroke-width="2"/>
        <path d="M90 168 l6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6" fill="none" stroke="#6e5234" stroke-width="2.4" stroke-linejoin="round"/>
      </g>
    </svg>`;
  }

  function espadaSvg(p) {
    return `<svg class="espada-svg" viewBox="0 0 80 300" role="img" aria-label="Espada de Gryffindor">
      <defs>
        <linearGradient id="${p}-hoja" x1="0" x2="1"><stop offset="0" stop-color="#f6f9fc"/><stop offset=".5" stop-color="#b6c1cd"/><stop offset="1" stop-color="#e9eef4"/></linearGradient>
        <linearGradient id="${p}-oro" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#b8862c"/></linearGradient>
      </defs>
      <path d="M33 92 L47 92 L47 260 L40 294 L33 260 Z" fill="url(#${p}-hoja)" stroke="#5a6470" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M40 96 V262" stroke="#8994a2" stroke-width="1.4"/>
      <text x="43" y="116" font-family="'Cinzel Decorative', Georgia, serif" font-size="6" fill="#6b7685" transform="rotate(90 43 116)" letter-spacing="1">GODRIC GRYFFINDOR</text>
      <rect x="35" y="30" width="10" height="56" rx="3" fill="#7a5a2c" stroke="#3a2a12" stroke-width="1.4"/>
      <path d="M35 40 l10 6 M35 52 l10 6 M35 64 l10 6 M35 76 l10 6" stroke="#e2bd6e" stroke-width="1.6"/>
      <path d="M6 84 Q40 98 74 84 L74 94 Q40 108 6 94 Z" fill="url(#${p}-oro)" stroke="#7a5a1c" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="18" cy="91" r="3.4" fill="#c0182a"/><circle cx="62" cy="91" r="3.4" fill="#c0182a"/><circle cx="40" cy="96" r="4" fill="#d21f35"/>
      <circle cx="40" cy="20" r="12" fill="url(#${p}-oro)" stroke="#7a5a1c" stroke-width="1.6"/>
      <circle cx="40" cy="20" r="6.5" fill="#d21f35" stroke="#7a0f1c" stroke-width="1.2"/>
      <circle cx="37.5" cy="17.5" r="2" fill="#fff" opacity=".7"/>
    </svg>`;
  }

  window.Avatar = {
    CATALOGO: { PIELES, PELOS, OJOS, CASAS },
    TUNICAS,
    svg, mascotaSvg, sombreroSvg, espadaSvg,
    aplicar, colores, variantes,
  };
})();

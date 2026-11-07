/* =============================================================================
   personalizacion.js — Creación del personaje
     1) Catálogo de opciones (colores de piel, pelo, ojos y casas)
     2) Recupera la última elección guardada (si existe y es válida)
     3) Pinta el personaje: variables CSS en #creador + data-atributos en #avatar
     4) Muestras de color y miniaturas (clonadas del propio SVG del personaje)
     5) Pestañas, botón "Sorpréndeme" y efectos al cambiar
     6) Guarda la configuración y pasa al pergamino (juramento.html)
   ============================================================================= */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1) Catálogo. Cada color: [luz, base, sombra]
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
    Gryffindor: { a: '#8b1a1a', b: '#e8b830', chispa: '#ffb347',
      texto: 'fundada por Godric Gryffindor. Valentía, osadía y nobleza. Elemento: fuego.' },
    Slytherin:  { a: '#1a5c34', b: '#c0c7cc', chispa: '#7dffb0',
      texto: 'fundada por Salazar Slytherin. Astucia, ambición y determinación. Elemento: agua.' },
    Ravenclaw:  { a: '#233a7a', b: '#c69a4e', chispa: '#8ec5ff',
      texto: 'fundada por Rowena Ravenclaw. Ingenio, creatividad y sabiduría. Elemento: aire.' },
    Hufflepuff: { a: '#e8b72a', b: '#2b2520', chispa: '#ffe27a',
      texto: 'fundada por Helga Hufflepuff. Lealtad, paciencia y esfuerzo. Elemento: tierra.' },
  };

  // Valores válidos de cada opción (sirven para validar lo guardado y para el azar)
  const VALORES = {
    piel: Object.keys(PIELES),
    colorPelo: Object.keys(PELOS),
    ojos: Object.keys(OJOS),
    pelo: ['1', '2', '3', '4'],
    gafas: ['redondas', 'cuadradas', 'media-luna', 'ninguna'],
    varita: ['acebo', 'sauco', 'vid'],
    mascota: ['lechuza', 'gato', 'sapo', 'ninguna'],
    casa: Object.keys(CASAS),
    cicatriz: [true, false],
  };
  const POR_DEFECTO = {
    piel: 'melocoton', colorPelo: 'castano', ojos: 'verde', pelo: '1', cicatriz: true,
    gafas: 'redondas', varita: 'acebo', mascota: 'lechuza', casa: 'Gryffindor',
  };

  const creador = document.getElementById('creador');
  const avatar = document.getElementById('avatar');
  const svgAvatar = avatar.querySelector('svg');
  const casaNombre = document.getElementById('stage-casa-nombre');
  const casaDescripcion = document.getElementById('casa-descripcion');
  const interruptor = document.getElementById('interruptor-cicatriz');

  /* --------------------------------------------------------------------------
     2) Última elección guardada (lo que no sea válido vuelve al valor por defecto)
     -------------------------------------------------------------------------- */
  function cargar() {
    const config = { ...POR_DEFECTO };
    try {
      const guardado = JSON.parse(localStorage.getItem('howgarts_personaje') || '{}');
      for (const clave of Object.keys(VALORES)) {
        if (VALORES[clave].includes(guardado[clave])) config[clave] = guardado[clave];
      }
    } catch { /* nada guardado o ilegible */ }
    return config;
  }
  const config = cargar();

  /* --------------------------------------------------------------------------
     3) Pintar el personaje y el estado de los controles
     -------------------------------------------------------------------------- */
  function pintar() {
    const variable = (nombre, valor) => creador.style.setProperty(nombre, valor);
    const [pielLuz, piel, pielSombra] = PIELES[config.piel].c;
    variable('--piel-luz', pielLuz); variable('--piel', piel); variable('--piel-sombra', pielSombra);
    const [peloBrillo, pelo, peloSombra] = PELOS[config.colorPelo].c;
    variable('--pelo-brillo', peloBrillo); variable('--pelo', pelo); variable('--pelo-sombra', peloSombra);
    const [ojosClaro, ojos, ojosOscuro] = OJOS[config.ojos].c;
    variable('--ojos-claro', ojosClaro); variable('--ojos', ojos); variable('--ojos-oscuro', ojosOscuro);
    const casa = CASAS[config.casa];
    variable('--casa-a', casa.a); variable('--casa-b', casa.b); variable('--chispa', casa.chispa);

    avatar.dataset.pelo = config.pelo;
    avatar.dataset.gafas = config.gafas;
    avatar.dataset.varita = config.varita;
    avatar.dataset.mascota = config.mascota;
    avatar.dataset.cicatriz = config.cicatriz ? 'si' : 'no';
    casaNombre.textContent = config.casa;
    const nombre = document.createElement('strong');
    nombre.textContent = config.casa;
    casaDescripcion.replaceChildren(nombre, ', ' + casa.texto);
    interruptor.setAttribute('aria-checked', String(config.cicatriz));

    document.querySelectorAll('[data-opcion]').forEach((grupo) => {
      const clave = grupo.dataset.opcion;
      grupo.querySelectorAll('[data-valor]').forEach((boton) => {
        const activo = boton.dataset.valor === String(config[clave]);
        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-pressed', String(activo));
      });
    });
  }

  /* --------------------------------------------------------------------------
     4a) Muestras de color, generadas desde el catálogo
     -------------------------------------------------------------------------- */
  function crearMuestras(clave, catalogo) {
    const contenedor = document.querySelector(`.muestras[data-opcion="${clave}"]`);
    for (const [valor, { nombre, c }] of Object.entries(catalogo)) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'muestra';
      boton.dataset.valor = valor;
      boton.title = nombre;
      boton.setAttribute('aria-label', nombre);
      boton.style.setProperty('--c1', c[0]);
      boton.style.setProperty('--c2', c[1]);
      boton.style.setProperty('--c3', c[2]);
      contenedor.appendChild(boton);
    }
  }

  /* --------------------------------------------------------------------------
     4b) Miniaturas: se clonan piezas del propio personaje, así siempre se
         parecen a él y toman los colores elegidos (heredan las variables CSS)
     -------------------------------------------------------------------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const SIN_MASCOTA =
    '<g fill="#7a5a36" opacity=".55"><ellipse cx="50" cy="60" rx="15" ry="12"/>' +
    '<circle cx="33" cy="43" r="6"/><circle cx="45" cy="34" r="6"/><circle cx="57" cy="34" r="6"/><circle cx="68" cy="43" r="6"/></g>' +
    '<path d="M26 76 L74 24" stroke="#7a2a20" stroke-width="5" stroke-linecap="round" opacity=".7"/>';

  function miniatura(tipo, variante) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const copiar = (selector) => {
      const pieza = svgAvatar.querySelector(selector);
      if (pieza) svg.appendChild(pieza.cloneNode(true));
    };
    if (tipo === 'pelo') {
      svg.setAttribute('viewBox', '44 12 232 232');
      copiar(`.pelo-atras .pelo-${variante}`);
      copiar('.cabeza');
      copiar(`.pelo-frente .pelo-${variante}`);
    } else if (tipo === 'gafas') {
      svg.setAttribute('viewBox', '84 92 152 152');
      copiar('.cabeza');
      if (variante !== 'ninguna') copiar(`.gafas-${variante}`);
    } else if (tipo === 'varita') {
      svg.setAttribute('viewBox', '14 206 106 106');
      copiar(`.varita-${variante}`);
      copiar('.chispa-punta');
      copiar('.chispitas');
    } else if (tipo === 'mascota') {
      if (variante === 'ninguna') {
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.innerHTML = SIN_MASCOTA;
      } else {
        svg.setAttribute('viewBox', '216 286 112 112');
        copiar(`.mascota-${variante}`);
      }
    }
    return svg;
  }

  /* --------------------------------------------------------------------------
     5) Interacción
     -------------------------------------------------------------------------- */
  // Pequeño salto del personaje al cambiar algo (o un giro con "Sorpréndeme")
  function celebrar(grande) {
    avatar.classList.remove('cambio', 'cambio-grande');
    void avatar.offsetWidth; // reinicia la animación
    avatar.classList.add(grande ? 'cambio-grande' : 'cambio');
  }

  document.querySelector('.panel').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-valor]');
    if (!boton) return;
    const clave = boton.closest('[data-opcion]').dataset.opcion;
    if (config[clave] === boton.dataset.valor) return;
    config[clave] = boton.dataset.valor;
    pintar();
    celebrar(false);
  });

  interruptor.addEventListener('click', () => {
    config.cicatriz = !config.cicatriz;
    pintar();
    celebrar(false);
  });

  // Pestañas (clic y flechas del teclado)
  const pestanas = [...document.querySelectorAll('.pestana')];
  function mostrarPestana(pestana) {
    for (const p of pestanas) {
      const activa = p === pestana;
      p.classList.toggle('activa', activa);
      p.setAttribute('aria-selected', String(activa));
      p.tabIndex = activa ? 0 : -1;
      document.getElementById(p.getAttribute('aria-controls')).hidden = !activa;
    }
  }
  pestanas.forEach((pestana, i) => {
    pestana.addEventListener('click', () => mostrarPestana(pestana));
    pestana.addEventListener('keydown', (e) => {
      const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!paso) return;
      const siguiente = pestanas[(i + paso + pestanas.length) % pestanas.length];
      mostrarPestana(siguiente);
      siguiente.focus();
    });
  });

  // Sorpréndeme: todo al azar
  const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];
  document.getElementById('btn-azar').addEventListener('click', () => {
    for (const clave of Object.keys(VALORES)) config[clave] = alAzar(VALORES[clave]);
    pintar();
    celebrar(true);
  });

  /* --------------------------------------------------------------------------
     6) Comenzar aventura: guardar y pasar al pergamino
     -------------------------------------------------------------------------- */
  document.getElementById('btn-comenzar').addEventListener('click', () => {
    const casa = CASAS[config.casa];
    const guardar = {
      ...config,
      scarfA: casa.a,
      scarfB: casa.b,
      color: casa.a, // compatibilidad con el mapa (color de túnica del jugador)
    };
    localStorage.setItem('howgarts_personaje', JSON.stringify(guardar));
    document.body.classList.add('saliendo');
    setTimeout(() => (location.href = 'juramento.html'), 400);
  });

  /* --------------------------------------------------------------------------
     Arranque
     -------------------------------------------------------------------------- */
  crearMuestras('piel', PIELES);
  crearMuestras('colorPelo', PELOS);
  crearMuestras('ojos', OJOS);
  document.querySelectorAll('.mini[data-mini]').forEach((hueco) => {
    hueco.appendChild(miniatura(hueco.dataset.mini, hueco.dataset.variante));
  });
  pintar();
})();

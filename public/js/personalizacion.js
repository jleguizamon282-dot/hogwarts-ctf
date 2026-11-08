/* =============================================================================
   personalizacion.js — Creación del personaje
     1) Opciones válidas (el catálogo de colores vive en js/avatar.js)
     2) Recupera la última elección guardada (si existe y es válida)
     3) Dibuja el personaje y lo pinta con cada elección
     4) Muestras de color y miniaturas (piezas clonadas del propio personaje)
     5) Nombre de mago, pestañas, "Sorpréndeme" y efectos al cambiar
     6) Guarda la configuración y pasa al pergamino (juramento.html)
   ============================================================================= */

(function () {
  'use strict';

  const { PIELES, PELOS, OJOS, CASAS } = Avatar.CATALOGO;

  /* --------------------------------------------------------------------------
     1) Valores válidos de cada opción (para validar lo guardado y para el azar)
     -------------------------------------------------------------------------- */
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
  const casaNombre = document.getElementById('stage-casa-nombre');
  const casaDescripcion = document.getElementById('casa-descripcion');
  const etiquetaNombre = document.getElementById('stage-nombre');
  const campoNombre = document.getElementById('nombre-mago');
  const interruptor = document.getElementById('interruptor-cicatriz');

  // El nombre solo admite letras, números, espacios, guiones y apóstrofos
  const limpiarNombre = (texto) => String(texto || '')
    .replace(/[^\p{L}\p{N} '\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);

  function nombreDelLogin() {
    try {
      const usuario = JSON.parse(localStorage.getItem('howgarts_sesion') || '{}').user.username;
      const limpio = limpiarNombre(usuario);
      return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : '';
    } catch {
      return '';
    }
  }

  /* --------------------------------------------------------------------------
     2) Última elección guardada (lo que no sea válido vuelve al valor por defecto)
     -------------------------------------------------------------------------- */
  function cargar() {
    const config = { ...POR_DEFECTO, nombre: '' };
    try {
      const guardado = JSON.parse(localStorage.getItem('howgarts_personaje') || '{}');
      for (const clave of Object.keys(VALORES)) {
        if (VALORES[clave].includes(guardado[clave])) config[clave] = guardado[clave];
      }
      config.nombre = limpiarNombre(guardado.nombre);
    } catch { /* nada guardado o ilegible */ }
    if (!config.nombre) config.nombre = nombreDelLogin();
    return config;
  }
  const config = cargar();

  /* --------------------------------------------------------------------------
     3) Dibujar y pintar
     -------------------------------------------------------------------------- */
  avatar.innerHTML = Avatar.svg('yo', 'Tu personaje');
  const svgAvatar = avatar.querySelector('svg');

  function pintar() {
    // Los colores van en #creador para que también los hereden las miniaturas
    Avatar.colores(creador, config);
    Avatar.variantes(avatar, config);

    const casa = CASAS[config.casa];
    casaNombre.textContent = config.casa;
    const nombreCasa = document.createElement('strong');
    nombreCasa.textContent = config.casa;
    casaDescripcion.replaceChildren(nombreCasa, ', ' + casa.texto);
    etiquetaNombre.textContent = config.nombre || 'Mago sin nombre';
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
     4b) Miniaturas: cada una es un pequeño mago con su variante fijada; se
         clonan piezas del personaje, así siempre se parecen a él y toman los
         colores elegidos (heredan las variables CSS de #creador)
     -------------------------------------------------------------------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const SIN_MASCOTA =
    '<g fill="#7a5a36" opacity=".55"><ellipse cx="50" cy="60" rx="15" ry="12"/>' +
    '<circle cx="33" cy="43" r="6"/><circle cx="45" cy="34" r="6"/><circle cx="57" cy="34" r="6"/><circle cx="68" cy="43" r="6"/></g>' +
    '<path d="M26 76 L74 24" stroke="#7a2a20" stroke-width="5" stroke-linecap="round" opacity=".7"/>';

  const ENCUADRE = { pelo: '44 12 232 232', gafas: '84 92 152 152', varita: '14 206 106 106', mascota: '216 286 112 112' };
  const PIEZAS = {
    pelo: ['.pelo-atras', '.cabeza', '.pelo-frente'],
    gafas: ['.cabeza', '.gafas'],
    varita: ['.varita'],
    mascota: ['.mascota'],
  };

  function miniatura(tipo, variante) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    if (tipo === 'mascota' && variante === 'ninguna') {
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.innerHTML = SIN_MASCOTA;
      return svg;
    }
    svg.setAttribute('viewBox', ENCUADRE[tipo]);
    Avatar.variantes(svg, { [tipo]: variante, varita: tipo === 'varita' ? variante : 'acebo' });
    for (const selector of PIEZAS[tipo]) svg.appendChild(svgAvatar.querySelector(selector).cloneNode(true));
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

  campoNombre.value = config.nombre;
  campoNombre.addEventListener('input', () => {
    config.nombre = limpiarNombre(campoNombre.value);
    etiquetaNombre.textContent = config.nombre || 'Mago sin nombre';
  });
  campoNombre.addEventListener('blur', () => { campoNombre.value = config.nombre; });

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

  // Sorpréndeme: todo al azar (menos el nombre)
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
    if (!config.nombre) {
      config.nombre = nombreDelLogin() || 'Mago';
      campoNombre.value = config.nombre;
    }
    const casa = CASAS[config.casa];
    const guardar = {
      ...config,
      scarfA: casa.a,
      scarfB: casa.b,
      color: casa.a, // color de la casa (lo usa el mapa)
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

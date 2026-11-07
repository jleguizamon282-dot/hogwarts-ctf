/* =============================================================================
   mapa.js — Mapa del Merodeador (logica principal)
     - Carga el personaje personalizado (localStorage)
     - Genera los 8 puntos de interes
     - Movimiento con flechas + niebla de guerra que sigue al jugador
     - Proximidad: lejos = huellas / cerca = personaje + pop-up "Iniciar mision"
     - Reto de la frase oculta -> disipa niebla + revela la Espada de Gryffindor
     - Completar mision -> anillo verde + animacion de destruccion de Horrocrux
   ============================================================================= */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     0) Datos de los 8 puntos de interes (personajes / niveles)
     -------------------------------------------------------------------------- */
  const PUNTOS = [
    { x: 15, y: 25, emoji: '🧙‍♀️', nombre: 'Prof. McGonagall', pista: 'La transfiguración abre puertas donde no las hay.' },
    { x: 40, y: 18, emoji: '🧔', nombre: 'Hagrid',             pista: 'Las criaturas del bosque guardan el segundo sello.' },
    { x: 68, y: 22, emoji: '🧙‍♂️', nombre: 'Dumbledore',        pista: 'La respuesta estaba en el espejo de Oesed.' },
    { x: 85, y: 40, emoji: '🐍', nombre: 'Prof. Snape',        pista: 'Siempre… revisa los ingredientes ocultos.' },
    { x: 22, y: 62, emoji: '🧝', nombre: 'Dobby',              pista: 'Dobby es libre… y te deja una llave bajo la alfombra.' },
    { x: 52, y: 72, emoji: '👻', nombre: 'Nick C. Decapitado', pista: 'Lo que parece atravesable, a veces esconde un muro.' },
    { x: 78, y: 66, emoji: '🦉', nombre: 'Hedwig',             pista: 'El mensaje viaja más rápido de lo que crees.' },
    { x: 38, y: 88, emoji: '🕷️', nombre: 'Aragog',             pista: 'No sigas a las arañas… sigue el rastro de datos.' },
  ];

  const FRASE_SECRETA = 'juro solemnemente que mis intenciones no son buenas';
  const RADIO_PROXIMIDAD = 90; // px para considerar "cerca"
  const VELOCIDAD = 3.2;       // px por frame

  /* --------------------------------------------------------------------------
     1) Referencias DOM + estado
     -------------------------------------------------------------------------- */
  const mundo = document.getElementById('mundo');
  const escena = document.getElementById('escena');
  const jugadorEl = document.getElementById('jugador');
  const niebla = document.getElementById('niebla');
  const popup = document.getElementById('popup-mision');

  let jugador = { x: 100, y: 100 };
  const teclas = {};
  let poiCercano = null;     // POI actualmente en rango
  let espadaObtenida = false;

  // Misiones completadas (persisten entre recargas)
  const completadas = new Set(
    JSON.parse(localStorage.getItem('howgarts_misiones') || '[]')
  );

  /* --------------------------------------------------------------------------
     2) Aplicar el personaje personalizado
     -------------------------------------------------------------------------- */
  (function aplicarPersonaje() {
    const cfg = JSON.parse(localStorage.getItem('howgarts_personaje') || '{}');
    if (cfg.color) jugadorEl.style.setProperty('--tunica', cfg.color);
  })();

  /* --------------------------------------------------------------------------
     3) Generar los 8 puntos de interes dentro de #escena
     -------------------------------------------------------------------------- */
  const poiEls = PUNTOS.map((p, i) => {
    const el = document.createElement('div');
    el.className = 'poi';
    el.dataset.idx = i;
    el.style.left = p.x + '%';
    el.style.top = p.y + '%';
    el.innerHTML = `
      <div class="anillo"></div>
      <div class="huellas">👣</div>
      <div class="personaje">${p.emoji}</div>
    `;
    if (completadas.has(i)) el.classList.add('completada');
    escena.appendChild(el);
    return el;
  });

  // Centro en px de un POI (relativo a #mundo)
  function centroPOI(i) {
    const r = poiEls[i].getBoundingClientRect();
    const rm = mundo.getBoundingClientRect();
    return { x: r.left - rm.left + r.width / 2, y: r.top - rm.top + r.height / 2 };
  }

  /* --------------------------------------------------------------------------
     4) Movimiento con flechas (loop con requestAnimationFrame)
     -------------------------------------------------------------------------- */
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      teclas[e.key] = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => { teclas[e.key] = false; });

  function posicionInicial() {
    const rm = mundo.getBoundingClientRect();
    jugador.x = rm.width / 2;
    jugador.y = rm.height / 2;
  }

  function actualizarJugador() {
    const rm = mundo.getBoundingClientRect();
    if (teclas.ArrowUp) jugador.y -= VELOCIDAD;
    if (teclas.ArrowDown) jugador.y += VELOCIDAD;
    if (teclas.ArrowLeft) jugador.x -= VELOCIDAD;
    if (teclas.ArrowRight) jugador.x += VELOCIDAD;

    // Limites
    jugador.x = Math.max(24, Math.min(rm.width - 24, jugador.x));
    jugador.y = Math.max(28, Math.min(rm.height - 28, jugador.y));

    jugadorEl.style.left = (jugador.x - 24) + 'px';
    jugadorEl.style.top = (jugador.y - 28) + 'px';

    // Niebla sigue al jugador
    niebla.style.setProperty('--fx', jugador.x + 'px');
    niebla.style.setProperty('--fy', jugador.y + 'px');
  }

  /* --------------------------------------------------------------------------
     5) Proximidad a los puntos de interes
     -------------------------------------------------------------------------- */
  function revisarProximidad() {
    let nuevoCercano = null;
    let distMin = Infinity;

    poiEls.forEach((el, i) => {
      const c = centroPOI(i);
      const d = Math.hypot(c.x - jugador.x, c.y - jugador.y);
      const cerca = d < RADIO_PROXIMIDAD;
      el.classList.toggle('cerca', cerca || espadaObtenida);

      if (cerca && d < distMin) { distMin = d; nuevoCercano = i; }
    });

    if (nuevoCercano !== poiCercano) {
      poiCercano = nuevoCercano;
      if (poiCercano !== null) {
        // Desbloquea la pista de ese personaje la primera vez
        if (window.HUD) window.HUD.desbloquearPista(poiCercano, PUNTOS[poiCercano].pista);
        mostrarPopup(poiCercano);
      } else {
        ocultarPopup();
      }
    }
  }

  /* --------------------------------------------------------------------------
     6) Pop-up "Iniciar mision"
     -------------------------------------------------------------------------- */
  function mostrarPopup(i) {
    if (window.HUD && window.HUD.estaTerminado()) return;
    document.getElementById('popup-titulo').textContent = PUNTOS[i].nombre;
    document.getElementById('popup-texto').textContent =
      completadas.has(i) ? 'Horrocrux ya destruido. ¿Repasar la misión?' : '¿Deseas iniciar esta misión?';
    popup.classList.add('visible');
  }
  function ocultarPopup() { popup.classList.remove('visible'); }

  document.getElementById('popup-aceptar').addEventListener('click', () => {
    if (poiCercano === null) return;
    const n = poiCercano + 1; // rutas 1..8
    document.body.classList.add('saliendo');
    setTimeout(() => (location.href = '/mision/' + n), 400);
  });
  document.getElementById('popup-cancelar').addEventListener('click', ocultarPopup);

  /* --------------------------------------------------------------------------
     7) Reto de la frase oculta -> disipar niebla + Espada de Gryffindor
     -------------------------------------------------------------------------- */
  const cajaSecreto = document.getElementById('caja-secreto');
  const inputSecreto = document.getElementById('input-secreto');

  function normalizar(s) {
    return (s || '').trim().toLowerCase().replace(/[.\s]+$/g, '');
  }

  async function intentarFrase() {
    if (normalizar(inputSecreto.value) === FRASE_SECRETA) {
      espadaObtenida = true;
      cajaSecreto.classList.add('resuelto');
      setTimeout(() => cajaSecreto.classList.add('oculto'), 600);

      // La oscuridad se disipa por completo
      niebla.classList.add('disipada');

      // Revela la espada (animacion)
      if (window.Animaciones) await window.Animaciones.revelarEspada();

      localStorage.setItem('howgarts_espada', '1');
    } else {
      inputSecreto.value = '';
      inputSecreto.placeholder = 'Ese no es el juramento… inspecciona la fuente 🔍';
    }
  }

  document.getElementById('btn-secreto').addEventListener('click', intentarFrase);
  inputSecreto.addEventListener('keydown', (e) => { if (e.key === 'Enter') intentarFrase(); });

  // Si ya se obtuvo la espada en una partida anterior, restaurar estado
  if (localStorage.getItem('howgarts_espada') === '1') {
    espadaObtenida = true;
    cajaSecreto.classList.add('oculto');
    niebla.classList.add('disipada');
  }

  /* --------------------------------------------------------------------------
     8) Carta de Hogwarts (abrir/cerrar el pergamino)
     -------------------------------------------------------------------------- */
  const cartaIcono = document.getElementById('carta-icono');
  function abrirCarta() { document.getElementById('modal-carta').classList.remove('oculto'); }
  cartaIcono.addEventListener('click', abrirCarta);
  cartaIcono.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrirCarta(); });

  /* --------------------------------------------------------------------------
     9) Completar mision (anillo verde + Horrocrux)
        - Se activa al volver con ?completada=N, o llamando completarMision(n).
     -------------------------------------------------------------------------- */
  async function completarMision(n) {
    const i = n - 1;
    if (i < 0 || i > 7) return;
    const yaEstaba = completadas.has(i);
    completadas.add(i);
    localStorage.setItem('howgarts_misiones', JSON.stringify([...completadas]));
    poiEls[i].classList.add('completada');

    if (!yaEstaba && window.Animaciones) {
      await window.Animaciones.destruirHorrocrux();
    }

    // ¿Todas completadas? -> confrontacion final (Avada Kedavra / Victoria)
    if (completadas.size === 8 && window.Animaciones) {
      setTimeout(() => window.Animaciones.victoria(), 600);
    }
  }
  window.completarMision = completarMision; // util para las paginas de mision

  // Procesa ?completada=N al cargar
  (function procesarRetorno() {
    const params = new URLSearchParams(location.search);
    const c = parseInt(params.get('completada'), 10);
    if (Number.isInteger(c)) {
      completarMision(c);
      // Limpia el parametro de la URL sin recargar
      history.replaceState({}, '', location.pathname);
    }
  })();

  /* --------------------------------------------------------------------------
     10) Bucle principal
     -------------------------------------------------------------------------- */
  function loop() {
    actualizarJugador();
    revisarProximidad();
    requestAnimationFrame(loop);
  }

  // Arranque
  window.addEventListener('resize', posicionInicial);
  posicionInicial();
  actualizarJugador();
  loop();

  /* --------------------------------------------------------------------------
     Ayuda rapida en consola (para pruebas del CTF)
     -------------------------------------------------------------------------- */
  console.log(
    '%c🗺️ Mapa del Merodeador',
    'font-size:16px;color:#d9b64e;font-weight:bold'
  );
  console.log('Pruebas: completarMision(1), perderVida(), Animaciones.victoria()');
})();

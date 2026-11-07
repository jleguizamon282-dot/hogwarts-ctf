/* =============================================================================
   juramento.js — El pergamino cerrado (entre "Crea tu mago" y el Mapa)
     1) Escribe el nombre del jugador en el interior del mapa
     2) Sobre lacrado -> carta de Hogwarts (modal)
     3) Conjuro: compara lo escrito con el juramento escondido en el DOM
     4) Ceremonia: la tinta se extiende, el mapa se despliega y pasamos al
        Mapa del Merodeador (mapa.html)
   ============================================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esperar = (ms) => new Promise((r) => setTimeout(r, reducido ? Math.min(ms, 120) : ms));

  const body = document.body;
  const mapa = $('#pergamino-mapa');
  const form = $('#form-conjuro');
  const input = $('#input-conjuro');
  const boton = form.querySelector('button');
  const msg = $('#conjuro-msg');
  const sobre = $('#sobre');
  const sobreWrap = $('.sobre-wrap');
  const modalCarta = $('#modal-carta');

  /* --------------------------------------------------------------------------
     1) El jugador aparece en el mapa con su nombre, como en el original
     -------------------------------------------------------------------------- */
  (function nombreEnElMapa() {
    const texto = document.getElementById('nombre-jugador');
    if (!texto) return;
    let nombre = 'Tú';
    try {
      const sesion = JSON.parse(localStorage.getItem('howgarts_sesion') || '{}');
      if (sesion.user && sesion.user.username) nombre = String(sesion.user.username).slice(0, 18);
    } catch { /* sesion ilegible: se queda "Tú" */ }
    texto.textContent = nombre; // textContent: el nombre nunca se interpreta como HTML
    const marco = texto.previousElementSibling;
    if (marco) {
      const ancho = Math.max(60, nombre.length * 8 + 22);
      marco.setAttribute('x', 600 - ancho / 2);
      marco.setAttribute('width', ancho);
    }
  })();

  /* --------------------------------------------------------------------------
     2) Carta de Hogwarts: se rompe el lacre, se abre el sobre y se lee
     -------------------------------------------------------------------------- */
  let cartaLeida = false;

  async function abrirCarta() {
    if (!sobre.classList.contains('abierto')) {
      sobre.classList.add('abierto');
      await esperar(950);
    }
    cartaLeida = true;
    sobre.classList.add('leida');
    sobreWrap.classList.add('leida');
    sobre.setAttribute('aria-label', 'Volver a leer la carta de Hogwarts');
    modalCarta.classList.remove('oculto');
    modalCarta.querySelector('.cerrar').focus();
  }

  function cerrarCarta() {
    if (modalCarta.classList.contains('oculto')) return;
    modalCarta.classList.add('oculto');
    sobre.focus();
  }

  sobre.addEventListener('click', abrirCarta);
  modalCarta.addEventListener('click', (e) => {
    if (e.target === modalCarta || e.target.closest('[data-cerrar]')) cerrarCarta();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarCarta(); });

  /* --------------------------------------------------------------------------
     3) El conjuro
        El juramento correcto NO esta escrito en este script: se lee del div
        oculto #secreto-merodeador, que el jugador debe descubrir
        inspeccionando el codigo fuente (pista de la carta).
     -------------------------------------------------------------------------- */
  const normalizar = (s) => (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')                      // sin puntuacion
    .replace(/\s+/g, ' ')
    .trim();

  const JURAMENTO = normalizar($('#secreto-merodeador').textContent);

  // Respuestas de los merodeadores cuando el juramento no es el correcto
  const BURLAS = [
    'El señor Lunático lamenta informarle de que el pergamino no reconoce ese juramento.',
    'El señor Colagusano opina que eso no lo juraría ningún merodeador.',
    'El señor Canuto bosteza. Quizá la carta tenga algo que contarte…',
    'El señor Cornamenta sugiere mirar detrás de la pantalla: en la fuente.',
  ];
  let intentos = 0;
  let enCeremonia = false;

  function mostrar(texto, tipo) {
    msg.textContent = texto;
    msg.className = 'conjuro-msg ' + (tipo || '');
  }

  function reiniciarAnimacion(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth; // fuerza reflow para poder repetir la animacion
    el.classList.add(clase);
  }

  function fallo(texto) {
    mostrar(texto, 'error');
    reiniciarAnimacion(form, 'temblor');
    input.select();
    // Tras varios intentos, el sobre llama la atencion si aun no se ha leido
    if (!cartaLeida && intentos >= 2) reiniciarAnimacion(sobre, 'reclamo');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enCeremonia) return;
    const intento = normalizar(input.value);
    if (!intento) {
      fallo('El pergamino espera tus palabras…');
      return;
    }
    if (intento !== JURAMENTO) {
      fallo(BURLAS[intentos % BURLAS.length]);
      intentos++;
      return;
    }
    revelarMapa();
  });

  /* --------------------------------------------------------------------------
     4) La ceremonia: tinta -> el mapa se despliega -> Mapa del Merodeador
     -------------------------------------------------------------------------- */
  async function revelarMapa() {
    enCeremonia = true;
    input.disabled = true;
    boton.disabled = true;
    form.classList.add('aceptado');
    mostrar('¡El pergamino reconoce tu juramento!', 'exito');

    // Paso completado: a partir de ahora mapa.html deja pasar (ver flujo.js)
    localStorage.setItem('howgarts_juramento', JSON.stringify({ ts: Date.now() }));

    await esperar(700);
    body.classList.add('ceremonia');
    mapa.classList.add('activando');
    derramarTinta();
    await esperar(1800);

    // Desplegado mide el doble de ancho: se lleva al centro de la pantalla
    // y se encoge si no cabe
    const caja = mapa.getBoundingClientRect();
    const escala = Math.min(1,
      (window.innerWidth * 0.94) / (mapa.offsetWidth * 2),
      (window.innerHeight * 0.94) / mapa.offsetHeight);
    mapa.style.setProperty('--escala-abierto', escala.toFixed(3));
    mapa.style.setProperty('--centrar-x', (window.innerWidth / 2 - (caja.left + caja.width / 2)).toFixed(1) + 'px');
    mapa.style.setProperty('--centrar-y', (window.innerHeight / 2 - (caja.top + caja.height / 2)).toFixed(1) + 'px');
    mapa.classList.add('abierto');
    revelarInterior(2400);
    await esperar(2700);

    body.classList.add('cruzando');
    mapa.classList.add('entrando');
    await esperar(1000);
    location.href = 'mapa.html';
  }

  // Lineas de tinta que salen del centro "como una telarana" sobre la portada.
  // Se dibujan iguales en las dos hojas (cada una muestra su mitad).
  function derramarTinta() {
    const capas = document.querySelectorAll('.hoja .frente .tinta');
    if (!capas.length || reducido) return;
    const NS = 'http://www.w3.org/2000/svg';
    const azar = (a, b) => a + Math.random() * (b - a);
    const ramas = [];

    function crecer(x, y, angulo, pasos, grosor, retardo, nivel) {
      const puntos = [[x, y]];
      let recorrido = 0;
      for (let i = 0; i < pasos; i++) {
        angulo += azar(-0.38, 0.38);
        const paso = azar(13, 24);
        x += Math.cos(angulo) * paso;
        y += Math.sin(angulo) * paso;
        recorrido += paso;
        puntos.push([x, y]);
        if (x < -10 || x > 610 || y < -10 || y > 1010) break;
        if (nivel < 2 && Math.random() < 0.16) {
          const giro = (Math.random() < 0.5 ? -1 : 1) * azar(0.5, 1.1);
          crecer(x, y, angulo + giro, Math.round(pasos * 0.55), grosor * 0.7, retardo + recorrido * 1.5, nivel + 1);
        }
      }
      ramas.push({ puntos, grosor, retardo, recorrido });
    }

    const RAMAS = 16;
    for (let i = 0; i < RAMAS; i++) {
      crecer(300, 592, (i / RAMAS) * Math.PI * 2 + azar(-0.2, 0.2), 28, azar(1.8, 2.8), azar(0, 120), 0);
    }

    const trazo = (pts) => pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
    for (const capa of capas) {
      for (const r of ramas) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', trazo(r.puntos));
        p.setAttribute('pathLength', '1');
        p.setAttribute('stroke-width', r.grosor.toFixed(2));
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
        capa.appendChild(p);
        p.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], {
          duration: 300 + r.recorrido * 1.6,
          delay: r.retardo,
          easing: 'cubic-bezier(.3,.6,.4,1)',
          fill: 'forwards',
        });
      }
    }
  }

  // El dibujo del castillo aparece desde el centro hacia fuera (circulo de recorte)
  function revelarInterior(duracion) {
    const circulo = document.getElementById('revelar-circulo');
    if (!circulo) return;
    const RADIO_FINAL = 900;
    if (reducido) {
      circulo.setAttribute('r', RADIO_FINAL);
      return;
    }
    const inicio = performance.now();
    (function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out
      circulo.setAttribute('r', (suave * RADIO_FINAL).toFixed(1));
      if (t < 1) requestAnimationFrame(paso);
    })(inicio);
  }

  // Al volver atras desde el mapa (cache del navegador), empezar limpio
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
})();

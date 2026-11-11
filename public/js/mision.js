/* =============================================================================
   mision.js — Pantalla de misión (/mision/N)

     1) Comprueba que la misión se puede jugar (si no, vuelve al mapa)
     2) Decora la sala de la misión alrededor del tablero (salas.js)
     3) Muestra el horrocrux, la pista, el reloj global y las vidas
     4) Envía el hechizo al servidor (POST /api/hechizo): el navegador nunca
        conoce el hechizo correcto
        · acierto -> el horrocrux se agrieta y vuelve a /mapa.html?completada=N
          (allí se ve la animación de la espada)
        · fallo   -> el rayo rebota y se pierde una vida (sin vidas: al mapa,
          que muestra el game over)
        · vacío o repetido -> aviso, sin perder vida
   ============================================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esperar = (ms) => new Promise((r) => setTimeout(r, reducido ? 0 : ms));

  const n = parseInt(location.pathname.split('/').filter(Boolean).pop(), 10);
  const final = n === Estado.FINAL;
  const datos = final ? Historia.VOLDEMORT : Historia.PERSONAJES.find((p) => p.mision === n);
  const irAlMapa = (consulta = '') => location.replace(`/mapa.html${consulta}`);

  /* --------------------------------------------------------------------------
     1) ¿Se puede jugar esta misión?
     -------------------------------------------------------------------------- */
  const partida = Estado.leer();
  const seisHechas = [1, 2, 3, 4, 5, 6].every((k) => partida.misiones[k] === 'completada');
  const cerrada = !datos
    || partida.fin
    || !partida.sombrero
    || (partida.inicio && Estado.restante(partida) <= 0)
    || partida.misiones[n] === 'completada'
    || (n === 7 && !seisHechas)
    || (final && Estado.completadas(partida) < Estado.MISIONES);
  if (cerrada) { irAlMapa(); return; }

  Estado.reanudar();          // el reloj corre también dentro de las misiones
  Estado.aceptarMision(n);
  Estado.darPista(n);

  /* --------------------------------------------------------------------------
     2) La sala
     -------------------------------------------------------------------------- */
  const sala = Salas.paraMision(n);
  document.body.classList.add(`sala-${sala.id}`);
  $('#sala-fondo').style.background = sala.fondo;
  $('#sala-izq').innerHTML = sala.izq;
  $('#sala-der').innerHTML = sala.der;
  $('#sala-arriba').innerHTML = sala.arriba;
  $('#sala-abajo').innerHTML = sala.abajo;

  function ambiente(tipo) {
    const capa = $('#ambiente');
    capa.className = `ambiente ${tipo}`;
    const total = { gotas: 26, chispas: 34, estrellas: 40, brasas: 30, polvo: 36, esporas: 32, vapor: 22 }[tipo] || 24;
    let html = '';
    for (let i = 0; i < total; i++) {
      const sube = tipo === 'brasas' || tipo === 'vapor';
      const x = Math.random() * 100;
      const y = tipo === 'gotas' ? -5 : sube ? 78 + Math.random() * 25 : Math.random() * 100;
      const t = tipo === 'vapor' ? 14 + Math.random() * 18 : 2 + Math.random() * 3.5;
      const d = tipo === 'gotas' ? 1.4 + Math.random() * 1.2 : 4 + Math.random() * 6;
      html += `<i style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--t:${t.toFixed(1)}px;--d:${d.toFixed(2)}s;--r:-${(Math.random() * d).toFixed(2)}s"></i>`;
    }
    capa.innerHTML = html;
  }
  if (!reducido) ambiente(sala.ambiente);

  /* --------------------------------------------------------------------------
     3) El tablero
     -------------------------------------------------------------------------- */
  document.title = `Misión ${n} · ${datos.horrocrux}`;
  $('#nombre-sala').textContent = sala.nombre;
  $('#titulo').textContent = datos.titulo;
  $('#icono').textContent = datos.icono;
  $('#icono').setAttribute('aria-label', datos.horrocrux);
  $('#nombre-horrocrux').textContent = final ? 'Lord Voldemort' : datos.horrocrux;
  $('#pista').textContent = datos.pista;
  $('.pista-quien').textContent = final ? `${datos.nombre} te desafía:` : `${datos.nombre} te dejó una pista:`;
  if (final) $('.pista-nota').textContent = 'Solo un hechizo puede acabar con él. Si fallas, el hechizo rebota y pierdes una vida.';

  // Pergamino con lacre junto a la pista
  $('#retrato').innerHTML = `<svg viewBox="0 0 64 80" aria-hidden="true">
    <path d="M12 10 H50 Q56 10 56 16 V64 Q56 72 48 72 H14" fill="#f1e2bc" stroke="#8a6a36" stroke-width="2.5"/>
    <path d="M14 72 Q6 72 6 64 Q6 58 12 58 H48" fill="#e2cc96" stroke="#8a6a36" stroke-width="2.5"/>
    <path d="M12 10 Q6 10 6 16 Q6 22 12 22" fill="#e2cc96" stroke="#8a6a36" stroke-width="2.5"/>
    <path d="M18 26 H48 M18 33 H44 M18 40 H47 M18 47 H38" stroke="#8a6a36" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <circle cx="44" cy="58" r="8" fill="#9b1c1c" stroke="#5a0a0a" stroke-width="1.5"/><path d="M40 58 h8 M44 54 v8" stroke="#e8a0a0" stroke-width="1.5"/></svg>`;

  // Anillo de runas que gira alrededor del horrocrux
  (function runas() {
    const GLIFOS = ['M0 -6V6M0 -6L4 -2', 'M-3 -6V6M-3 0L3 -6M-3 0L3 6', 'M0 -6V6M0 -2L4 -6M0 2L4 -2', 'M-3 6L0 -6L3 6',
      'M-4 -4L4 4M4 -4L-4 4', 'M0 -6V6M-4 -2H4', 'M-3 -6L3 0L-3 6', 'M0 -6L4 0L0 6L-4 0Z', 'M-3 -6V6M3 -6V6M-3 0H3', 'M-4 6L0 -2L4 6M0 -2V-6'];
    let svg = '<circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="78"/>';
    for (let i = 0; i < 24; i++) svg += `<path transform="rotate(${i * 15} 100 100) translate(100 13)" d="${GLIFOS[(i * 7) % GLIFOS.length]}"/>`;
    $('#runas').innerHTML = svg;
  })();

  /* --- Reloj y vidas -------------------------------------------------------- */
  let terminado = false;
  let ocupado = false;

  function formato(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  function pintarTiempo() {
    const resta = Estado.restante();
    $('#tiempo').textContent = formato(resta);
    $('#reloj').classList.toggle('urgente', resta <= 5 * 60 * 1000);
    if (resta <= 0 && !terminado) {
      terminado = true;
      bloquear();
      mensaje('Se acabó el tiempo…', 'error');
      setTimeout(() => salir(''), 1800);
    }
  }
  function pintarVidas(rota) {
    const vidas = Estado.leer().vidas;
    const corazones = document.querySelectorAll('#vidas .vida');
    corazones.forEach((c, i) => c.classList.toggle('perdida', i >= vidas));
    if (Number.isInteger(rota) && corazones[rota]) {
      const c = corazones[rota];
      c.textContent = '💔';
      c.classList.remove('rota');
      void c.offsetWidth;
      c.classList.add('rota');
    }
    $('#vidas').setAttribute('aria-label', `Vidas restantes: ${vidas}`);
  }
  pintarTiempo();
  pintarVidas();
  setInterval(pintarTiempo, 250);

  /* --------------------------------------------------------------------------
     4) Lanzar el hechizo
     -------------------------------------------------------------------------- */
  const formulario = $('#conjuro');
  const entrada = $('#hechizo');
  const boton = $('#lanzar');
  const tablero = $('#tablero');
  const altar = $('#altar');
  const capaRayo = $('#capa-rayo');

  // Igual que en el servidor: sin mayúsculas, tildes, espacios ni guiones
  const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function mensaje(texto, tipo) {
    const m = $('#mensaje');
    m.className = `mensaje ${tipo || ''}`;
    m.textContent = texto;
  }
  function sacudir(clase) {
    tablero.classList.remove('sacudida', 'sacudida-suave');
    void tablero.offsetWidth;
    tablero.classList.add(clase);
  }
  function bloquear() { boton.disabled = true; entrada.readOnly = true; }
  function liberar() { ocupado = false; boton.disabled = false; entrada.readOnly = false; entrada.focus(); entrada.select(); }

  /* --- Rayo: de la punta de la varita al horrocrux (y de vuelta si rebota) -- */
  function puntoVarita() {
    const r = $('#varita').getBoundingClientRect();
    return { x: r.left + r.width * 0.8, y: r.top + r.height * 0.2 };
  }
  function puntoAltar() {
    const r = altar.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function trazo(a, b, quiebros = 10, amplitud = 18) {
    const puntos = [a];
    const nx = -(b.y - a.y), ny = b.x - a.x, largo = Math.hypot(nx, ny) || 1;
    for (let i = 1; i < quiebros; i++) {
      const k = i / quiebros;
      const desvio = (Math.random() - 0.5) * 2 * amplitud * Math.sin(Math.PI * k);
      puntos.push({ x: a.x + (b.x - a.x) * k + (nx / largo) * desvio, y: a.y + (b.y - a.y) * k + (ny / largo) * desvio });
    }
    puntos.push(b);
    return `M${puntos.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')}`;
  }
  function rayo(desde, hasta, rojo) {
    capaRayo.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    capaRayo.classList.toggle('rojo', Boolean(rojo));
    const d = trazo(desde, hasta);
    capaRayo.innerHTML = `<path class="rayo-halo" d="${d}"/><path class="rayo-nucleo" d="${d}"/>`;
    const trazos = [...capaRayo.querySelectorAll('path')];
    const largo = trazos[1].getTotalLength();
    const animaciones = trazos.map((p) => {
      p.style.strokeDasharray = largo;
      return p.animate([{ strokeDashoffset: largo }, { strokeDashoffset: 0 }],
        { duration: reducido ? 1 : 360, easing: 'ease-in', fill: 'forwards' });
    });
    return animaciones[1].finished;
  }
  function disipar() {
    capaRayo.querySelectorAll('path').forEach((p) => p.classList.add('disipar'));
  }

  /* --- Resultados ----------------------------------------------------------- */
  async function fallo(texto, clave) {
    Estado.anotarIntento(n, clave);
    const antes = Estado.leer().vidas;
    const vidas = Estado.perderVida();
    altar.classList.add('repele');
    await rayo(puntoAltar(), puntoVarita(), true);          // el hechizo rebota
    tablero.classList.add('rebote');
    sacudir('sacudida');
    pintarVidas(antes - 1);
    disipar();
    setTimeout(() => { altar.classList.remove('repele'); tablero.classList.remove('rebote'); }, 700);
    if (vidas <= 0) {
      terminado = true;
      mensaje(`«${texto}» no era el hechizo… El rebote te deja sin vidas.`, 'error');
      setTimeout(() => salir(''), 2300);
      return;
    }
    mensaje(`«${texto}» no es el hechizo correcto: rebota y pierdes una vida (te ${vidas === 1 ? 'queda 1' : `quedan ${vidas}`}).`, 'error');
    liberar();
  }

  function acierto() {
    terminado = true;
    bloquear();
    disipar();
    altar.classList.add('roto');
    let esquirlas = '';
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 110;
      esquirlas += `<i style="--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist).toFixed(0)}px;--rot:${Math.round(Math.random() * 540)}deg;animation-delay:${(1 + Math.random() * 0.15).toFixed(2)}s"></i>`;
    }
    $('#esquirlas').innerHTML = esquirlas;
    mensaje(final ? '¡El hechizo alcanza a Lord Voldemort!' : '¡El hechizo funciona! El horrocrux se resquebraja…', 'exito');
    setTimeout(() => salir(`?completada=${n}`), reducido ? 600 : 2300);
  }

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ocupado || terminado) return;
    const texto = entrada.value.trim();
    const clave = normalizar(texto);
    if (!clave) {
      mensaje('Escribe un hechizo antes de lanzarlo.', 'aviso');
      sacudir('sacudida-suave');
      entrada.focus();
      return;
    }
    if (Estado.yaIntentado(n, clave)) {
      mensaje(`Ya probaste «${texto}» en esta misión y no funcionó. Esta vez no pierdes vida.`, 'aviso');
      sacudir('sacudida-suave');
      entrada.select();
      return;
    }
    ocupado = true;
    bloquear();
    mensaje('');
    formulario.classList.remove('lanzando');
    void formulario.offsetWidth;
    formulario.classList.add('lanzando');

    const ida = rayo(puntoVarita(), puntoAltar());
    let respuesta = null;
    try {
      const r = await fetch('/api/hechizo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mision: n, hechizo: texto }),
      });
      respuesta = await r.json();
    } catch { /* sin conexión con el servidor */ }
    await ida;
    await esperar(120);

    if (!respuesta || !respuesta.ok) {
      disipar();
      mensaje((respuesta && respuesta.mensaje) || 'La magia falla: no se pudo contactar con el castillo. Inténtalo de nuevo.', 'aviso');
      liberar();
      return;
    }
    if (respuesta.acierto) acierto();
    else fallo(texto, clave);
  });

  /* --------------------------------------------------------------------------
     Volver al mapa (sin penalización)
     -------------------------------------------------------------------------- */
  function salir(consulta) {
    document.body.classList.add('saliendo');
    setTimeout(() => irAlMapa(consulta), reducido ? 0 : 420);
  }
  $('#volver').addEventListener('click', () => { if (!terminado) salir(''); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !terminado && !ocupado) salir('');
  });

  entrada.focus();
})();

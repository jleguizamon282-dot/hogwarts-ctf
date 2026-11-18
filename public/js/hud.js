/* =============================================================================
   hud.js — Barra superior del mapa
     - Reloj global de 40 minutos (barra + cifra). Avisa a mapa.js al agotarse.
     - Vidas (3) y espada de Gryffindor
     - Lista de misiones ("???" hasta hablar con su personaje; tachadas al completar)
     - Pistas recolectadas (modal)
     - Pausa: tapa el mapa y detiene el reloj
     - Avisos breves (HUD.aviso)
   Todo se lee de Estado (js/estado.js); HUD.pintar() refresca la barra.
   ============================================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const AVISO_MS = 5 * 60 * 1000; // últimos 5 minutos en rojo

  let pausado = false;
  let agotado = false;
  let recorte = null;     // animación del reloj al llegar Voldemort { desde, t0 }
  let opciones = { alAgotarse: null, alPausar: null };

  /* --- Reloj ---------------------------------------------------------------- */
  function formato(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function pintarTiempo() {
    const partida = Estado.leer();
    const resta = Estado.restante(partida);
    const cifra = $('#temporizador');
    const barra = $('#barra-tiempo');
    if (!recorte) {
      cifra.textContent = formato(resta);
      barra.style.width = `${(resta / Estado.DURACION_MS) * 100}%`;
    }
    $('#barra').setAttribute('aria-valuenow', String(Math.round((resta / Estado.DURACION_MS) * 100)));
    const urgente = Boolean(partida.inicio) && resta <= AVISO_MS;
    barra.classList.toggle('aviso', urgente);
    cifra.classList.toggle('aviso', urgente && !partida.pausaDesde);
    if (partida.inicio && resta <= 0 && !agotado && !partida.fin) {
      agotado = true;
      if (opciones.alAgotarse) opciones.alAgotarse();
    }
  }

  // Voldemort recorta el reloj: la cifra baja de golpe hasta el nuevo valor,
  // el reloj tiembla en rojo y aparece el tiempo perdido ("−23:41").
  // Si no se quitó tiempo (ya quedaban menos de 5 min) solo tiembla.
  function recorteTiempo(quitadoMs) {
    const caja = document.querySelector('.hud-tiempo');
    caja.classList.remove('recorte');
    void caja.offsetWidth;
    caja.classList.add('recorte');
    setTimeout(() => caja.classList.remove('recorte'), 2600);
    if (!quitadoMs) return;
    const marca = document.createElement('span');
    marca.className = 'tiempo-quitado';
    marca.textContent = `−${formato(quitadoMs)}`;
    caja.appendChild(marca);
    setTimeout(() => marca.remove(), 2800);
    const cifra = $('#temporizador');
    const barra = $('#barra-tiempo');
    recorte = { desde: Estado.restante() + quitadoMs, t0: performance.now() };
    const DURA = 1300;
    (function paso(ahora) {
      const k = Math.min(1, (ahora - recorte.t0) / DURA);
      const suave = 1 - Math.pow(1 - k, 3);
      const hasta = Estado.restante();
      const valor = recorte.desde + (hasta - recorte.desde) * suave;
      cifra.textContent = formato(valor);
      barra.style.width = `${(valor / Estado.DURACION_MS) * 100}%`;
      if (k < 1) requestAnimationFrame(paso); else recorte = null;
    })(performance.now());
  }

  /* --- Misiones y pistas ---------------------------------------------------- */
  const ESTADOS = { conocida: 'Pendiente', aceptada: 'Aceptada', completada: '✓ Completada' };

  function filaMision(icono, titulo, detalle, estado, clase) {
    const li = document.createElement('li');
    if (clase) li.className = clase;
    const i = document.createElement('span');
    i.className = 'mision-icono';
    i.textContent = icono;
    const t = document.createElement('span');
    t.className = 'mision-texto';
    t.textContent = titulo;
    const d = document.createElement('small');
    d.textContent = detalle;
    t.appendChild(d);
    li.append(i, t);
    if (estado) {
      const e = document.createElement('span');
      e.className = 'mision-estado';
      e.textContent = estado;
      li.appendChild(e);
    }
    return li;
  }

  function pintarMisiones(partida) {
    const lista = $('#lista-misiones');
    lista.replaceChildren();
    for (const p of Historia.PERSONAJES) {
      const estado = partida.misiones[p.mision];
      if (!estado) {
        lista.appendChild(filaMision('❔', '???', 'Sigue las huellas y habla con quien las deja', '', 'desconocida'));
      } else {
        lista.appendChild(filaMision(p.icono, p.titulo, `${p.nombre} · ${p.sala}`, ESTADOS[estado], estado));
      }
    }
    if (Estado.completadas(partida) === Estado.MISIONES) {
      const v = Historia.VOLDEMORT;
      const estado = partida.misiones[v.mision];
      lista.appendChild(filaMision(v.icono, v.titulo, `${v.nombre} te espera en el ${v.sala}`,
        ESTADOS[estado] || '¡Ahora!', `final ${estado || ''}`));
    }
  }

  function pintarPistas(partida) {
    const lista = $('#lista-pistas');
    lista.replaceChildren();
    const todas = [...Historia.PERSONAJES, Historia.VOLDEMORT];
    for (const n of partida.pistas) {
      const p = todas.find((x) => x.mision === n);
      if (!p) continue;
      const li = document.createElement('li');
      const quien = document.createElement('strong');
      quien.textContent = `${p.icono} ${p.nombre}: `;
      li.append(quien, p.pista);
      lista.appendChild(li);
    }
    if (!partida.pistas.length) {
      const li = document.createElement('li');
      li.className = 'vacia';
      li.textContent = 'Aún no tienes pistas. Habla con los personajes que dejan huellas en el mapa.';
      lista.appendChild(li);
    }
  }

  /* --- Pintar todo ---------------------------------------------------------- */
  function pintar({ latido = false } = {}) {
    const partida = Estado.leer();
    const corazones = document.querySelectorAll('#vidas .vida');
    corazones.forEach((c, i) => c.classList.toggle('perdida', i >= partida.vidas));
    if (latido && corazones[partida.vidas]) {
      const c = corazones[partida.vidas];
      c.classList.remove('latido');
      void c.offsetWidth;
      c.classList.add('latido');
    }
    $('#vidas').setAttribute('aria-label', `Vidas restantes: ${partida.vidas}`);
    $('#hud-espada').classList.toggle('tiene', partida.espada);
    $('#contador-misiones').textContent = `${Estado.completadas(partida)}/${Estado.MISIONES}`;
    $('#contador-pistas').textContent = String(partida.pistas.length);
    pintarMisiones(partida);
    pintarPistas(partida);
    pintarTiempo();
  }

  /* --- Ventanas: misiones, pistas y pausa ----------------------------------- */
  const panelMisiones = () => $('#panel-misiones');
  const modalPistas = () => $('#modal-pistas');

  function alternarPausa(forzar) {
    const nuevo = typeof forzar === 'boolean' ? forzar : !pausado;
    if (nuevo === pausado) return;
    pausado = nuevo;
    $('#pausa').classList.toggle('oculto', !pausado);
    if (pausado) Estado.pausar(); else Estado.reanudar();
    if (opciones.alPausar) opciones.alPausar(pausado);
    if (pausado) $('#btn-reanudar').focus();
    pintarTiempo();
  }

  // Cierra la ventana abierta (misiones o pistas). Devuelve true si cerró algo.
  function cerrarVentanas() {
    let cerro = false;
    if (!panelMisiones().classList.contains('oculto')) { panelMisiones().classList.add('oculto'); cerro = true; }
    if (!modalPistas().classList.contains('oculto')) { modalPistas().classList.add('oculto'); cerro = true; }
    return cerro;
  }
  const hayVentana = () => !panelMisiones().classList.contains('oculto') || !modalPistas().classList.contains('oculto');

  /* --- Avisos breves -------------------------------------------------------- */
  function aviso(texto, tipo) {
    const el = document.createElement('div');
    el.className = 'aviso ' + (tipo || '');
    el.textContent = texto;
    $('#avisos').appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  /* --- Arranque ------------------------------------------------------------- */
  function iniciar(opts) {
    opciones = { ...opciones, ...opts };
    $('#btn-misiones').addEventListener('click', (e) => {
      e.stopPropagation();
      modalPistas().classList.add('oculto');
      panelMisiones().classList.toggle('oculto');
    });
    $('#btn-pistas').addEventListener('click', () => {
      panelMisiones().classList.add('oculto');
      pintarPistas(Estado.leer());
      modalPistas().classList.remove('oculto');
    });
    modalPistas().addEventListener('click', (e) => {
      if (e.target === modalPistas() || e.target.closest('[data-cerrar]')) modalPistas().classList.add('oculto');
    });
    document.addEventListener('click', (e) => {
      if (!panelMisiones().contains(e.target) && e.target !== $('#btn-misiones')) panelMisiones().classList.add('oculto');
    });
    $('#btn-pausa').addEventListener('click', () => alternarPausa(true));
    $('#btn-reanudar').addEventListener('click', () => alternarPausa(false));
    // Si se recarga con la pausa activa, el mapa sigue cerrado
    if (Estado.leer().pausaDesde) alternarPausaSilenciosa();
    pintar();
    setInterval(pintarTiempo, 250);
  }

  function alternarPausaSilenciosa() {
    pausado = true;
    $('#pausa').classList.remove('oculto');
    if (opciones.alPausar) opciones.alPausar(true);
  }

  window.HUD = {
    iniciar, pintar, aviso, alternarPausa, cerrarVentanas, hayVentana, recorteTiempo,
    enPausa: () => pausado,
  };
})();

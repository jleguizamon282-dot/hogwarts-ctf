/* =============================================================================
   hud.js — Barra superior del mapa
     - Temporizador de supervivencia (20:00 en cuenta regresiva)
     - Sistema de vidas (3 corazones) + funcion global perderVida()
     - Inventario de pistas (modal)
   Expone window.HUD y la funcion global perderVida().
   ============================================================================= */

(function () {
  'use strict';

  const TIEMPO_INICIAL = 20 * 60;   // segundos (20:00)
  const PENALIZACION_VIDA = 5 * 60; // -5:00 por corazon perdido

  let segundos = TIEMPO_INICIAL;
  let vidas = 3;
  let intervalo = null;
  let juegoTerminado = false;

  const elTemporizador = document.getElementById('temporizador');
  const elVidas = document.getElementById('vidas');
  const elContadorPistas = document.getElementById('pistas-contador');

  // Las 8 pistas que se desbloquean al interactuar con cada personaje.
  // Empiezan bloqueadas; mapa.js llamara a HUD.desbloquearPista(i, texto).
  const pistas = Array.from({ length: 8 }, () => null);

  /* --- Temporizador -------------------------------------------------------- */
  function formato(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function pintarTiempo() {
    elTemporizador.textContent = formato(Math.max(0, segundos));
    elTemporizador.classList.toggle('alerta', segundos <= 60);
  }

  function tick() {
    if (juegoTerminado) return;
    segundos--;
    pintarTiempo();
    if (segundos <= 0) {
      segundos = 0;
      pintarTiempo();
      terminarJuego('tiempo');
    }
  }

  function iniciar() {
    pintarTiempo();
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(tick, 1000);
  }

  /* --- Vidas --------------------------------------------------------------- */
  function pintarVidas() {
    const corazones = elVidas.querySelectorAll('.vida');
    corazones.forEach((c, i) => c.classList.toggle('perdida', i >= vidas));
  }

  // >>> Funcion GLOBAL solicitada: quita un corazon y resta 5 min al reloj <<<
  function perderVida() {
    if (juegoTerminado) return;
    vidas = Math.max(0, vidas - 1);
    pintarVidas();

    // Penalizacion inmediata de tiempo
    segundos = Math.max(0, segundos - PENALIZACION_VIDA);
    pintarTiempo();

    if (vidas <= 0) {
      terminarJuego('vidas');
    } else if (segundos <= 0) {
      terminarJuego('tiempo');
    }
  }

  /* --- Fin de juego -------------------------------------------------------- */
  function terminarJuego(motivo) {
    if (juegoTerminado) return;
    juegoTerminado = true;
    clearInterval(intervalo);
    // Dispara la cinematica de derrota (Voldemort gana).
    if (window.Animaciones) window.Animaciones.gameOver();
    console.log('[HUD] Fin del juego. Motivo:', motivo);
  }

  /* --- Pistas -------------------------------------------------------------- */
  function actualizarContador() {
    const n = pistas.filter(Boolean).length;
    elContadorPistas.textContent = `${n}/8`;
  }

  function desbloquearPista(indice, texto) {
    if (indice < 0 || indice > 7) return;
    pistas[indice] = texto;
    actualizarContador();
  }

  function abrirModalPistas() {
    const lista = document.getElementById('lista-pistas');
    lista.innerHTML = '';
    pistas.forEach((p, i) => {
      const li = document.createElement('li');
      if (p) {
        li.innerHTML = `<strong>Pista ${i + 1}:</strong> ${p}`;
      } else {
        li.className = 'bloqueada';
        li.textContent = `Pista ${i + 1}: aún por descubrir…`;
      }
      lista.appendChild(li);
    });
    document.getElementById('modal-pistas').classList.remove('oculto');
  }

  /* --- Eventos de UI ------------------------------------------------------- */
  document.getElementById('btn-pistas').addEventListener('click', abrirModalPistas);

  // Cerrar cualquier modal con boton [data-cerrar] o clic en el fondo
  document.querySelectorAll('.overlay-modal').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.dataset.cerrar) ov.classList.add('oculto');
    });
  });

  /* --- API publica --------------------------------------------------------- */
  window.perderVida = perderVida; // global, como pide el enunciado
  window.HUD = {
    iniciar,
    perderVida,
    desbloquearPista,
    estaTerminado: () => juegoTerminado,
    anadirTiempo: (s) => { segundos = Math.max(0, segundos + s); pintarTiempo(); },
    getEstado: () => ({ segundos, vidas, juegoTerminado }),
  };

  // Arranque automatico al cargar el mapa
  iniciar();
  pintarVidas();
})();

/* =============================================================================
   estado.js — Estado de la partida (se guarda en el navegador)

     vidas (3) · reloj global de 40 min · misiones · pistas · espada · posición

   Lo usan el mapa y, más adelante, las pantallas de cada misión:
     Estado.perderVida()         el jugador falla en una misión  -> quita 1 vida
     Estado.completarMision(n)   el jugador supera la misión n
   El reloj corre en tiempo real (también dentro de las misiones) y solo se
   detiene con la pausa del mapa. Recargar la página no lo reinicia.

   Nota: por ahora todo vive en localStorage (se puede editar desde la consola).
   ============================================================================= */

(function () {
  'use strict';

  const CLAVE = 'howgarts_partida';
  const DURACION_MS = 40 * 60 * 1000;
  const VIDAS = 3;
  const MISIONES = 7;   // misiones de los personajes; la 8 es el duelo final
  const FINAL = 8;

  const nueva = () => ({
    version: 1,
    vidas: VIDAS,
    inicio: null,       // momento en que empezó a correr el reloj (tras el Sombrero)
    pausado: 0,         // milisegundos acumulados en pausa
    pausaDesde: null,   // si está en pausa, desde cuándo
    sombrero: false,    // ya pasó la ceremonia del Sombrero Seleccionador
    espada: false,      // tiene la Espada de Gryffindor
    misiones: {},       // { "1": "conocida" | "aceptada" | "completada" }
    pistas: [],         // números de misión cuya pista ya tiene
    jugador: null,      // última posición en el mapa { x, y }
    fin: null,          // "derrota" | "victoria"
  });

  function leer() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado && guardado.version === 1) return { ...nueva(), ...guardado };
    } catch { /* ilegible: partida nueva */ }
    return nueva();
  }
  function guardar(estado) {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    return estado;
  }
  function cambiar(modificar) {
    const estado = leer();
    modificar(estado);
    return guardar(estado);
  }

  /* --- Reloj ---------------------------------------------------------------- */
  function transcurrido(estado, ahora = Date.now()) {
    if (!estado.inicio) return 0;
    const pausaActual = estado.pausaDesde ? ahora - estado.pausaDesde : 0;
    return Math.max(0, ahora - estado.inicio - estado.pausado - pausaActual);
  }
  const restante = (estado = leer(), ahora = Date.now()) => Math.max(0, DURACION_MS - transcurrido(estado, ahora));
  const iniciarReloj = () => cambiar((e) => { if (!e.inicio) e.inicio = Date.now(); });
  const pausar = () => cambiar((e) => { if (e.inicio && !e.pausaDesde) e.pausaDesde = Date.now(); });
  const reanudar = () => cambiar((e) => {
    if (e.pausaDesde) { e.pausado += Date.now() - e.pausaDesde; e.pausaDesde = null; }
  });

  /* --- Vidas y final -------------------------------------------------------- */
  function perderVida() {
    return cambiar((e) => {
      e.vidas = Math.max(0, e.vidas - 1);
      if (e.vidas === 0) e.fin = 'derrota';
    }).vidas;
  }
  const marcarFin = (resultado) => cambiar((e) => { e.fin = resultado; });

  /* --- Misiones y pistas ---------------------------------------------------- */
  const conocerMision = (n) => cambiar((e) => { if (!e.misiones[n]) e.misiones[n] = 'conocida'; });
  const aceptarMision = (n) => cambiar((e) => { if (e.misiones[n] !== 'completada') e.misiones[n] = 'aceptada'; });
  const completarMision = (n) => cambiar((e) => {
    e.misiones[n] = 'completada';
    if (Number(n) === FINAL) e.fin = 'victoria';
  });
  const darPista = (n) => cambiar((e) => { if (!e.pistas.includes(n)) e.pistas.push(n); });
  const completadas = (estado = leer()) =>
    Object.entries(estado.misiones).filter(([n, v]) => v === 'completada' && Number(n) <= MISIONES).length;

  const reiniciar = () => guardar(nueva());

  window.Estado = {
    CLAVE, DURACION_MS, VIDAS, MISIONES, FINAL,
    leer, guardar, cambiar, restante, iniciarReloj, pausar, reanudar,
    perderVida, marcarFin, conocerMision, aceptarMision, completarMision, darPista,
    completadas, reiniciar,
  };
})();

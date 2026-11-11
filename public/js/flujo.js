/* =============================================================================
   flujo.js — Orden de las pantallas del juego (la "ruta")

     1) index.html            Login               -> guarda howgarts_sesion
     2) personalizacion.html  Crea tu mago        -> guarda howgarts_personaje
     3) juramento.html        Pergamino + carta   -> guarda howgarts_juramento
     4) mapa.html             Mapa del Merodeador

   Cada pantalla (salvo el login) carga este script en su <head>:

       <script src="js/flujo.js" data-pagina="mapa.html"></script>

   Si falta algun paso anterior, redirige al primer paso pendiente antes de que
   la pagina llegue a pintarse. Asi nadie aterriza en el mapa sin haber
   pronunciado el juramento, ni en el juramento sin haber creado su mago.

   Nota: es un control de navegacion en el navegador (ordena el recorrido del
   juego). No es una medida de seguridad: localStorage lo puede editar cualquiera.
   ============================================================================= */

(function () {
  'use strict';

  const PASOS = [
    { pagina: 'index.html',           clave: 'howgarts_sesion' },
    { pagina: 'personalizacion.html', clave: 'howgarts_personaje' },
    { pagina: 'juramento.html',       clave: 'howgarts_juramento' },
    { pagina: 'mapa.html',            clave: null },
  ];

  function completado(clave) {
    return localStorage.getItem(clave) !== null;
  }

  /** Primer paso sin completar anterior a `pagina` (o null si esta todo en orden). */
  function pasoPendiente(pagina) {
    const indice = PASOS.findIndex((p) => p.pagina === pagina);
    for (let i = 0; i < indice; i++) {
      if (!completado(PASOS[i].clave)) return PASOS[i].pagina;
    }
    return null;
  }

  // Guardia automatica segun el atributo data-pagina del <script>.
  const pagina = document.currentScript && document.currentScript.dataset.pagina;
  if (pagina) {
    const destino = pasoPendiente(pagina);
    if (destino) location.replace('/' + destino); // ruta absoluta: también sirve desde /mision/N
  }

  window.Flujo = { PASOS, pasoPendiente };
})();

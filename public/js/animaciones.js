/* =============================================================================
   animaciones.js — Modulo de animaciones / cinematicas
   Funciones base (placeholders funcionales) para:
     - Revelar la Espada de Gryffindor
     - Destruir un Horrocrux con la espada
     - Cinematica de Game Over (Voldemort gana)
     - Cinematica de Victoria (Avada Kedavra del jugador)
   Todas estan preparadas para enriquecerse con mas arte/sprites mas adelante.
   Se exponen en window.Animaciones.
   ============================================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  function mostrar(el) { el && el.classList.remove('oculto'); }
  function ocultar(el) { el && el.classList.add('oculto'); }

  const Animaciones = {

    /* --- Espada de Gryffindor (recompensa del reto de la frase oculta) ------ */
    revelarEspada() {
      return new Promise((resolve) => {
        const esc = $('#anim-espada');
        mostrar(esc);
        // Placeholder: aqui podrian agregarse destellos, sonido, particulas…
        setTimeout(() => { ocultar(esc); resolve(); }, 3200);
      });
    },

    /* --- Destruccion de Horrocrux ------------------------------------------- */
    // Se dispara al completar una mision. El heroe golpea el horrocrux con la
    // espada y la magia oscura se diluye en el aire.
    destruirHorrocrux() {
      return new Promise((resolve) => {
        const esc = $('#anim-horrocrux');
        const humo = esc.querySelector('.humo-oscuro');
        mostrar(esc);
        // Reinicia la animacion del humo
        humo.classList.remove('activo');
        void humo.offsetWidth; // fuerza reflow
        setTimeout(() => humo.classList.add('activo'), 500);
        setTimeout(() => { ocultar(esc); resolve(); }, 2600);
      });
    },

    /* --- Cinematica de Derrota (Game Over) ---------------------------------- */
    // Voldemort lanza un hechizo y elimina a nuestro personaje.
    gameOver() {
      const esc = $('#anim-gameover');
      // Reinicia el rayo para que la animacion se vea siempre
      const rayo = esc.querySelector('.rayo-hechizo');
      rayo.style.animation = 'none'; void rayo.offsetWidth; rayo.style.animation = '';
      mostrar(esc);
    },

    /* --- Cinematica de Victoria (Avada Kedavra) ----------------------------- */
    // Mismo estilo que el Game Over pero invertido: el heroe vence a Voldemort.
    victoria() {
      const esc = $('#anim-victoria');
      const rayo = esc.querySelector('.rayo-hechizo');
      rayo.style.animation = 'none'; void rayo.offsetWidth; rayo.style.animation = '';
      mostrar(esc);
    },
  };

  window.Animaciones = Animaciones;
})();

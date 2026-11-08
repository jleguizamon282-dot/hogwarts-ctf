/* =============================================================================
   animaciones.js — Cinemáticas del Mapa del Merodeador

     Animaciones.revelarEspada()                 el Sombrero entrega la espada
     Animaciones.destruirHorrocrux(mision)       al completar una misión
     Animaciones.gameOver({ jugador, motivo })   Voldemort vence al jugador
     Animaciones.victoria({ jugador })           el jugador vence a Voldemort

   Todas devuelven una promesa. Las dos primeras se cierran solas (o con un
   clic); las de final se resuelven al pulsar su botón (Reintentar / Jugar de
   nuevo). El ritmo de cada escena está en mapa.css (sección CINEMÁTICAS).
   ============================================================================= */

(function () {
  'use strict';

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cine = () => document.getElementById('cine');

  function mostrar(html, clase) {
    const c = cine();
    c.className = 'cinematica ' + (clase || '');
    c.innerHTML = html;
    return c;
  }
  function ocultar() {
    const c = cine();
    c.className = 'cinematica oculto';
    c.innerHTML = '';
  }

  // Se cierra sola tras `ms`, o antes con un clic o Enter (pasado un mínimo)
  function hastaClicOTiempo(c, ms) {
    return new Promise((resolve) => {
      let hecho = false;
      const tecla = (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) terminar(); };
      function terminar() {
        if (hecho) return;
        hecho = true;
        document.removeEventListener('keydown', tecla);
        resolve();
      }
      setTimeout(() => {
        c.addEventListener('click', terminar, { once: true });
        document.addEventListener('keydown', tecla);
      }, reducido ? 0 : 900);
      setTimeout(terminar, reducido ? 600 : ms);
    });
  }

  /* --- La espada del Sombrero ------------------------------------------------ */
  async function revelarEspada() {
    const c = mostrar(`
      <div class="cine-espada">
        <div class="rayos"></div>
        <div class="espada-caida">${Avatar.espadaSvg('cine-espada')}</div>
        <p class="cine-titulo">Has recibido la Espada de Gryffindor</p>
        <p class="cine-sub">«Te será útil más adelante en tu estancia en Hogwarts»</p>
      </div>`, 'espada');
    await hastaClicOTiempo(c, 3800);
    ocultar();
  }

  /* --- Horrocrux destruido -------------------------------------------------- */
  async function destruirHorrocrux(mision) {
    const c = mostrar(`
      <div class="cine-horrocrux">
        <div class="aura-oscura"></div>
        <div class="objeto"></div>
        <div class="espada-golpe">${Avatar.espadaSvg('cine-golpe')}</div>
        <p class="cine-titulo">¡Horrocrux destruido!</p>
        <p class="cine-sub"></p>
      </div>`, 'horrocrux');
    c.querySelector('.objeto').textContent = mision.icono;
    c.querySelector('.cine-sub').textContent = mision.horrocrux;
    await hastaClicOTiempo(c, 3400);
    ocultar();
  }

  /* --- Duelo final (derrota o victoria) ------------------------------------- */
  // gana = 'villano' (game over) o 'heroe' (victoria)
  function duelo({ jugador, gana, titulo, texto, boton }) {
    return new Promise((resolve) => {
      const heroeGana = gana === 'heroe';
      const c = mostrar(`
        <div class="cine-duelo ${heroeGana ? 'victoria-duelo' : ''}">
          <div class="duelista izquierda villano ${heroeGana ? 'cae' : 'lanza'}"><div class="volteo"></div></div>
          <div class="rayo"></div>
          <div class="duelista heroe ${heroeGana ? 'lanza' : 'cae'}"><div class="volteo"></div></div>
          <p class="grito">¡Avada Kedavra!</p>
          <div class="fogonazo"></div>
        </div>
        <div class="cine-final">
          <h2 class="game-over ${heroeGana ? 'victoria' : ''}"></h2>
          <p class="cine-sub"></p>
          <button type="button" class="btn-magico boton-final"></button>
        </div>`, heroeGana ? 'duelo victoria' : 'duelo derrota');

      const villano = c.querySelector('.villano .volteo');
      villano.innerHTML = Avatar.svg('cine-villano', Historia.VOLDEMORT.nombre);
      Avatar.aplicar(villano, Historia.VOLDEMORT.apariencia);
      const heroe = c.querySelector('.heroe .volteo');
      heroe.innerHTML = Avatar.svg('cine-heroe', jugador.nombre || 'Tú');
      Avatar.aplicar(heroe, jugador);

      c.querySelector('.game-over').textContent = titulo;
      c.querySelector('.cine-sub').textContent = texto;
      const btn = c.querySelector('.boton-final');
      btn.textContent = boton;

      // Al recibir el hechizo: ojos en X y lengua fuera
      const [perdedor, cfg] = heroeGana ? [villano, Historia.VOLDEMORT.apariencia] : [heroe, jugador];
      setTimeout(() => Avatar.variantes(perdedor, { ...cfg, estado: 'derrotado' }), reducido ? 0 : 1750);
      setTimeout(() => btn.focus(), reducido ? 0 : 3500);
      btn.addEventListener('click', () => resolve(), { once: true });
    });
  }

  const gameOver = ({ jugador, motivo }) => duelo({
    jugador,
    gana: 'villano',
    titulo: 'GAME OVER',
    texto: motivo === 'tiempo'
      ? 'Se acabó el tiempo… y Lord Voldemort te encontró.'
      : 'Te has quedado sin vidas.',
    boton: '↻ Reintentar',
  });

  const victoria = ({ jugador }) => duelo({
    jugador,
    gana: 'heroe',
    titulo: '¡VICTORIA!',
    texto: 'Lord Voldemort ha sido derrotado. Hogwarts está a salvo.',
    boton: '✦ Jugar de nuevo',
  });

  window.Animaciones = { revelarEspada, destruirHorrocrux, gameOver, victoria, ocultar };
})();

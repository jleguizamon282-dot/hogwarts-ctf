/* =============================================================================
   animaciones.js — Cinemáticas del Mapa del Merodeador

     Animaciones.revelarEspada()                 el Sombrero entrega la espada
     Animaciones.destruirHorrocrux(mision, jugador)  al completar una misión
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
  // El mago del jugador alza la Espada de Gryffindor por detrás de la cabeza y
  // la deja caer como un hachazo: el horrocrux se parte en dos y escapan las
  // almas entre humo negro. Misión 7 (el horrocrux es el propio jugador): cae,
  // el fragmento oscuro sale de él y la Piedra de la Resurrección lo levanta.
  const ALMA = '<svg viewBox="0 0 40 70" aria-hidden="true"><path d="M20 4C31 4 36 14 35 26C34 38 30 46 26 54C24 60 26 66 22 68C20 62 16 60 14 54C10 46 5 38 5 26C4 14 9 4 20 4Z"/>'
    + '<ellipse class="hueco" cx="14.5" cy="22" rx="3" ry="4.2"/><ellipse class="hueco" cx="25.5" cy="22" rx="3" ry="4.2"/><ellipse class="hueco" cx="20" cy="34" rx="3" ry="4.8"/></svg>';
  const PIEDRA = '<svg viewBox="0 0 100 80" aria-hidden="true"><defs><radialGradient id="cine-piedra" cx=".38" cy=".32" r=".8">'
    + '<stop offset="0" stop-color="#8a95a3"/><stop offset=".55" stop-color="#3b414b"/><stop offset="1" stop-color="#14171c"/></radialGradient></defs>'
    + '<path d="M18 52C10 40 16 22 34 16C48 10 70 12 82 24C92 34 90 54 76 62C62 70 32 68 18 52Z" fill="url(#cine-piedra)" stroke="#0b0d10" stroke-width="2.5"/>'
    + '<path d="M30 27C38 20 50 18 58 20" fill="none" stroke="#c4ccd6" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round"/>'
    + '<path d="M38 48L52 39L68 45M52 39L55 28" fill="none" stroke="#0e1014" stroke-opacity=".55" stroke-width="1.6"/></svg>';
  const repetir = (html, n) => Array.from({ length: n }, () => html).join('');

  // Brazos alzados con la espada; se insertan detrás de la cabeza para que, al
  // levantarla, el filo asome por encima. Giran alrededor del pecho (160, 262).
  function brazosConEspada(p) {
    const espada = Avatar.espadaSvg(`${p}-hoja`)
      .replace('class="espada-svg"', 'class="espada-mano" x="128" y="149.6" width="64" height="240" overflow="visible"');
    return `<g class="golpe-brazos">
      <path d="M128 258 C132 236 142 216 151 202 L163 210 C156 224 150 242 148 262 Z" fill="url(#${p}-manga)" stroke="#121017" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M192 258 C188 236 178 216 169 202 L157 210 C164 224 170 242 172 262 Z" fill="url(#${p}-manga)" stroke="#121017" stroke-width="2.4" stroke-linejoin="round"/>
      <g transform="rotate(180 160 196)">${espada}</g>
      <circle cx="153" cy="203" r="11" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2"/>
      <circle cx="167" cy="191" r="11" fill="url(#${p}-piel)" stroke="#5a3a2a" stroke-width="2"/>
    </g>`;
  }

  function magoCine(contenedor, jugador, conEspada) {
    const p = conEspada ? 'cine-golpe' : 'cine-revive';
    let dibujo = Avatar.svg(p, (jugador && jugador.nombre) || 'Tú');
    if (conEspada) dibujo = dibujo.replace('<g class="cabeza">', `${brazosConEspada(p)}<g class="cabeza">`);
    contenedor.innerHTML = dibujo;
    Avatar.aplicar(contenedor, { ...(jugador || {}), varita: 'ninguna', mascota: 'ninguna' });
  }

  async function destruirHorrocrux(mision, jugador) {
    const eresTu = mision.mision === 7;
    const c = mostrar(`
      <div class="cine-horrocrux ${eresTu ? 'eres-tu' : 'con-espada'}">
        <div class="escena-golpe">
          <div class="aura-oscura"></div>
          <div class="mago-golpe"></div>
          ${eresTu ? `
            <div class="alma-oscura">${ALMA}</div>
            <div class="rayos-piedra"></div>
            <div class="haz-piedra"></div>
            <div class="piedra">${PIEDRA}</div>` : `
            <div class="sombra-objeto"></div>
            <div class="objeto"><span class="mitad arriba"></span><span class="mitad abajo"></span></div>
            <div class="tajo"></div>
            <div class="onda"></div>`}
          <div class="humo-negro">${repetir('<i></i>', 10)}</div>
          <div class="almas">${repetir(`<span class="alma">${ALMA}</span>`, eresTu ? 0 : 4)}</div>
        </div>
        <p class="cine-titulo">¡Horrocrux destruido!</p>
        <p class="cine-sub"></p>
        ${eresTu ? '<p class="cine-sub cine-sub2">La Piedra de la Resurrección te ha devuelto la vida.</p>' : ''}
      </div>`, 'horrocrux');
    magoCine(c.querySelector('.mago-golpe'), jugador, !eresTu);
    c.querySelectorAll('.mitad').forEach((m) => { m.textContent = mision.icono; });
    c.querySelector('.cine-sub').textContent = mision.horrocrux;
    await hastaClicOTiempo(c, eresTu ? 5600 : 4400);
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

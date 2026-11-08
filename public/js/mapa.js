/* =============================================================================
   mapa.js — Motor del Mapa del Merodeador
     1) Jugador (el mago de la personalización) y estado de la partida
     2) El mundo: plano del castillo, antorchas y personajes
     3) Diálogos (retrato + texto que se escribe solo + botones)
     4) Movimiento con flechas/WASD sin atravesar paredes, cámara y luz
     5) Personajes que pasean dejando huellas y aparecen al acercarse
     6) Filch y la Señora Norris: si te pillan, pierdes una vida
     7) Misiones: hablar, pistas, aceptar y volver (?completada=N / ?fallo=N)
     8) Sombrero Seleccionador, Voldemort, fin de partida y bucle principal
   El contenido (personajes, diálogos, pistas) está en historia.js y el plano
   en castillo.js.
   ============================================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const NS = 'http://www.w3.org/2000/svg';
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const { ANCHO, ALTO } = Castillo;

  const VELOCIDAD = 230;       // px por segundo del jugador
  const PIES = { w: 24, h: 12 }; // caja de colisión de los pies
  const RADIO_VER = 125;       // a esta distancia aparece el personaje
  const RADIO_HABLAR = 95;     // a esta distancia sale su bocadillo
  const RADIO_PARAR = 175;     // a esta distancia deja de pasear
  const RADIO_PILLADO = 44;    // Filch y la Señora Norris
  const PASO_HUELLA = 26;      // px entre huellas
  const INMUNIDAD = 2.5;       // segundos sin poder ser pillado otra vez

  let bloqueado = false;       // ceremonia, cinemática o saliendo hacia una misión
  let terminado = false;       // fin de partida

  /* --------------------------------------------------------------------------
     1) El jugador
     -------------------------------------------------------------------------- */
  function leerPersonaje() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('howgarts_personaje') || '{}'); } catch { /* sin datos */ }
    let nombre = String(p.nombre || '').trim();
    if (!nombre) {
      try { nombre = String(JSON.parse(localStorage.getItem('howgarts_sesion')).user.username || ''); } catch { /* sin sesión */ }
    }
    return { ...p, nombre: nombre || 'Mago', mascota: p.mascota || 'ninguna' };
  }
  const personaje = leerPersonaje();
  const nombre = personaje.nombre;

  // Claves de versiones anteriores del mapa
  localStorage.removeItem('howgarts_misiones');
  localStorage.removeItem('howgarts_espada');

  /* --------------------------------------------------------------------------
     2) El mundo
     -------------------------------------------------------------------------- */
  const vista = $('#vista');
  const capaPlano = $('#capa-plano');
  const capaAlta = $('#capa-alta');
  const niebla = $('#niebla');
  const capaHuellas = $('#huellas');
  const capaEntes = $('#entidades');

  capaPlano.innerHTML = Castillo.svg();
  $('#antorchas').innerHTML = Castillo.ANTORCHAS
    .map(([x, y], i) => `<div class="antorcha" style="left:${x}px;top:${y}px;animation-delay:${((i * 0.37) % 2).toFixed(2)}s"></div>`)
    .join('');
  $('#hud-espada').innerHTML = Avatar.espadaSvg('hud-espada');

  const HUELLAS_QUIETAS = '<svg class="huellas-quietas" viewBox="-10 -12 20 24" aria-hidden="true">'
    + '<ellipse cx="-4" cy="-3" rx="2.6" ry="4"/><ellipse cx="-4" cy="4" rx="2" ry="1.9"/>'
    + '<ellipse cx="4" cy="-6" rx="2.6" ry="4"/><ellipse cx="4" cy="1" rx="2" ry="1.9"/></svg>';

  function colocar(ente) {
    ente.el.style.transform = `translate3d(${ente.x.toFixed(1)}px, ${ente.y.toFixed(1)}px, 0)`;
  }

  function crearEnte({ id, tipo, etiqueta, figura, apariencia, x, y }) {
    const el = document.createElement('div');
    el.className = `ente ${tipo}`;
    el.dataset.id = id;
    el.innerHTML = `${HUELLAS_QUIETAS}<div class="ente-figura"><div class="ente-volteo">${figura}</div></div>`
      + '<div class="ente-nombre"></div><div class="ente-burbuja"></div>';
    el.querySelector('.ente-nombre').textContent = etiqueta;
    if (apariencia) Avatar.aplicar(el.querySelector('.ente-volteo'), apariencia);
    capaEntes.appendChild(el);
    const ente = { id, tipo, el, x, y, lado: 1, recorrido: 0, quieto: true, visible: false };
    el.classList.add('quieto');
    colocar(ente);
    return ente;
  }

  const valida = (p) => (p && Castillo.cabe(p.x, p.y, PIES.w, PIES.h) ? p : null);
  const inicio = valida(Estado.leer().jugador) || { x: Historia.INICIO[0], y: Historia.INICIO[1] };

  const jugador = crearEnte({
    id: 'jugador', tipo: 'jugador visible', etiqueta: nombre,
    figura: Avatar.svg('jugador', nombre), apariencia: personaje, x: inicio.x, y: inicio.y,
  });
  jugador.intocable = 0;

  const sombrero = crearEnte({
    id: 'sombrero', tipo: 'npc sombrero-ente', etiqueta: Historia.SOMBRERO.nombre,
    figura: Avatar.sombreroSvg('mapa-sombrero'), x: Historia.SOMBRERO.posicion[0], y: Historia.SOMBRERO.posicion[1],
  });
  Object.assign(sombrero, { datos: Historia.SOMBRERO, ruta: [] });

  const npcs = Historia.PERSONAJES.map((p) => {
    const ente = crearEnte({
      id: p.id, tipo: 'npc', etiqueta: p.nombre, figura: Avatar.svg(`npc-${p.id}`, p.nombre),
      apariencia: p.apariencia, x: p.ruta[0][0], y: p.ruta[0][1],
    });
    return Object.assign(ente, { datos: p, ruta: p.ruta, siguiente: 1, espera: Math.random() * 2, velocidad: 46 });
  });

  const V = Historia.VOLDEMORT;
  const voldemort = Object.assign(crearEnte({
    id: V.id, tipo: 'npc voldemort bloqueado', etiqueta: V.nombre, figura: Avatar.svg('npc-voldemort', V.nombre),
    apariencia: V.apariencia, x: V.ruta[0][0], y: V.ruta[0][1],
  }), { datos: V, ruta: V.ruta, siguiente: 0, espera: 0, velocidad: 0 });

  const patrullas = Historia.PATRULLAS.map((p) => {
    const figura = p.gato ? Avatar.mascotaSvg('norris', 'Señora Norris') : Avatar.svg(`patrulla-${p.id}`, p.nombre);
    const ente = crearEnte({
      id: p.id, tipo: `patrulla${p.gato ? ' gato' : ''}`, etiqueta: p.nombre, figura,
      apariencia: p.gato ? { mascota: 'gato' } : p.apariencia, x: p.ruta[0][0], y: p.ruta[0][1],
    });
    if (p.gato) { // la Señora Norris: gata gris de ojos amarillos
      const figuraGato = ente.el.querySelector('.ente-volteo');
      figuraGato.style.setProperty('--gato-luz', '#c4bcb0');
      figuraGato.style.setProperty('--gato', '#7a7166');
      figuraGato.style.setProperty('--ojos-gato', '#f2c94c');
    }
    return Object.assign(ente, { datos: p, ruta: p.ruta, siguiente: 1, espera: 0, velocidad: p.velocidad });
  });

  const conversables = [sombrero, ...npcs, voldemort];

  /* --------------------------------------------------------------------------
     3) Diálogos
     -------------------------------------------------------------------------- */
  const Dialogo = (() => {
    const caja = $('#dialogo');
    const retrato = $('#dialogo-retrato');
    const quienEl = $('#dialogo-nombre');
    const texto = $('#dialogo-texto');
    const pasos = $('#dialogo-pasos');
    const acciones = $('#dialogo-acciones');
    let abierto = false;
    let avanzar = null;
    let escapar = null;

    function abrir({ quien, figura, apariencia, lineas, botones, clase }) {
      return new Promise((resolve) => {
        abierto = true;
        caja.className = 'dialogo ' + (clase || '');
        retrato.innerHTML = figura;
        if (apariencia) {
          Avatar.aplicar(retrato, apariencia);
          const svg = retrato.querySelector('.mago-svg');
          if (svg) svg.setAttribute('viewBox', '20 -40 280 300'); // retrato: cabeza y hombros
        }
        quienEl.textContent = quien;
        let i = 0;
        let completa = false;
        let reloj = null;

        const terminarLinea = () => {
          clearInterval(reloj);
          texto.textContent = lineas[i];
          completa = true;
          retrato.classList.remove('hablando');
          if (i === lineas.length - 1) {
            acciones.replaceChildren(...botones.map((b) => {
              const boton = document.createElement('button');
              boton.type = 'button';
              boton.className = b.principal ? 'btn-magico' : 'boton-secundario';
              boton.textContent = b.texto;
              boton.addEventListener('click', (ev) => { ev.stopPropagation(); cerrar(b.id); });
              return boton;
            }));
            (acciones.querySelector('.btn-magico') || acciones.querySelector('button')).focus();
          } else {
            const seguir = document.createElement('span');
            seguir.className = 'continuar';
            seguir.textContent = 'Continuar ▸';
            acciones.replaceChildren(seguir);
          }
        };
        const mostrarLinea = () => {
          completa = false;
          texto.textContent = '';
          acciones.replaceChildren();
          pasos.textContent = `${i + 1} / ${lineas.length}`;
          retrato.classList.add('hablando');
          let letras = 0;
          clearInterval(reloj);
          reloj = setInterval(() => {
            letras += 2;
            texto.textContent = lineas[i].slice(0, letras);
            if (letras >= lineas[i].length) terminarLinea();
          }, 26);
        };
        const cerrar = (id) => {
          clearInterval(reloj);
          abierto = false;
          avanzar = null;
          escapar = null;
          caja.className = 'dialogo oculto';
          retrato.innerHTML = '';
          resolve(id);
        };
        avanzar = () => {
          if (!completa) terminarLinea();
          else if (i < lineas.length - 1) { i++; mostrarLinea(); }
        };
        // Esc solo cierra cuando ya se ven los botones y existe "cerrar"
        escapar = () => { if (completa && i === lineas.length - 1 && botones.some((b) => b.id === 'cerrar')) cerrar('cerrar'); };
        caja.onclick = () => avanzar && avanzar();
        mostrarLinea();
      });
    }
    return {
      abrir,
      abierto: () => abierto,
      avanzar: () => avanzar && avanzar(),
      escapar: () => escapar && escapar(),
    };
  })();

  /* --------------------------------------------------------------------------
     4) Movimiento, cámara y luz
     -------------------------------------------------------------------------- */
  const teclas = { izq: false, der: false, arr: false, aba: false };
  const TECLAS = {
    ArrowLeft: 'izq', a: 'izq', A: 'izq', ArrowRight: 'der', d: 'der', D: 'der',
    ArrowUp: 'arr', w: 'arr', W: 'arr', ArrowDown: 'aba', s: 'aba', S: 'aba',
  };

  function moverJugador(dt) {
    let dx = (teclas.der ? 1 : 0) - (teclas.izq ? 1 : 0);
    let dy = (teclas.aba ? 1 : 0) - (teclas.arr ? 1 : 0);
    if (!dx && !dy) { marcarQuieto(jugador, true); return; }
    const largo = Math.hypot(dx, dy);
    dx /= largo; dy /= largo;
    const paso = VELOCIDAD * dt;
    const x0 = jugador.x, y0 = jugador.y;
    // Ejes por separado: así se desliza a lo largo de las paredes
    if (Castillo.cabe(jugador.x + dx * paso, jugador.y, PIES.w, PIES.h)) jugador.x += dx * paso;
    if (Castillo.cabe(jugador.x, jugador.y + dy * paso, PIES.w, PIES.h)) jugador.y += dy * paso;
    const movido = Math.hypot(jugador.x - x0, jugador.y - y0);
    if (dx) jugador.el.classList.toggle('izquierda', dx < 0);
    marcarQuieto(jugador, movido < 0.01);
    if (movido > 0) {
      rastro(jugador, movido, Math.atan2(dy, dx), 'jugador');
      colocar(jugador);
    }
  }

  const cam = { x: 0, y: 0 };
  function camara(dt, saltar) {
    const w = vista.clientWidth;
    const h = vista.clientHeight;
    let tx = jugador.x - w / 2;
    let ty = jugador.y - 36 - h / 2;
    tx = ANCHO <= w ? (ANCHO - w) / 2 : Math.min(Math.max(tx, 0), ANCHO - w);
    ty = ALTO <= h ? (ALTO - h) / 2 : Math.min(Math.max(ty, 0), ALTO - h);
    if (saltar) { cam.x = tx; cam.y = ty; } else {
      const k = Math.min(1, dt * 7);
      cam.x += (tx - cam.x) * k;
      cam.y += (ty - cam.y) * k;
    }
    const t = `translate3d(${(-cam.x).toFixed(1)}px, ${(-cam.y).toFixed(1)}px, 0)`;
    capaPlano.style.transform = t;
    capaAlta.style.transform = t;
    // Luz "Lumos" que titila un poco alrededor del jugador
    const titileo = 200 + Math.sin(performance.now() / 260) * 5 + Math.sin(performance.now() / 97) * 2;
    niebla.style.setProperty('--fx', `${(jugador.x - cam.x).toFixed(1)}px`);
    niebla.style.setProperty('--fy', `${(jugador.y - 36 - cam.y).toFixed(1)}px`);
    niebla.style.setProperty('--radio', `${titileo.toFixed(1)}px`);
  }

  /* --------------------------------------------------------------------------
     5) Personajes que pasean, huellas y aparición al acercarse
     -------------------------------------------------------------------------- */
  function marcarQuieto(ente, quieto) {
    if (ente.quieto === quieto) return;
    ente.quieto = quieto;
    ente.el.classList.toggle('quieto', quieto);
    ente.el.classList.toggle('andando', !quieto);
  }

  function dejarHuella(ente, angulo, clase) {
    ente.lado = -ente.lado;
    const ox = -Math.sin(angulo) * 5 * ente.lado;
    const oy = Math.cos(angulo) * 5 * ente.lado;
    const huella = document.createElementNS(NS, 'use');
    huella.setAttribute('href', '#huella');
    huella.setAttribute('class', `huella ${clase}`);
    huella.setAttribute('transform',
      `translate(${(ente.x + ox).toFixed(1)} ${(ente.y + oy).toFixed(1)}) rotate(${((angulo * 180) / Math.PI + 90).toFixed(1)})`);
    capaHuellas.appendChild(huella);
    setTimeout(() => huella.remove(), 3500);
  }

  function rastro(ente, paso, angulo, clase) {
    ente.recorrido += paso;
    if (ente.recorrido >= PASO_HUELLA) {
      ente.recorrido = 0;
      dejarHuella(ente, angulo, clase);
    }
  }

  function pasear(ente, dt) {
    const esNpc = ente.tipo.includes('npc');
    if (ente.ruta.length < 2 || (esNpc && distancia(ente, jugador) < RADIO_PARAR)) { marcarQuieto(ente, true); return; }
    if (ente.espera > 0) { ente.espera -= dt; marcarQuieto(ente, true); return; }
    const [tx, ty] = ente.ruta[ente.siguiente];
    const dx = tx - ente.x, dy = ty - ente.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) {
      ente.siguiente = (ente.siguiente + 1) % ente.ruta.length;
      ente.espera = esNpc ? 1.2 + Math.random() * 2 : 0.3;
      return;
    }
    const paso = Math.min(d, ente.velocidad * dt);
    ente.x += (dx / d) * paso;
    ente.y += (dy / d) * paso;
    marcarQuieto(ente, false);
    if (Math.abs(dx) > 0.5) ente.el.classList.toggle('izquierda', dx < 0);
    rastro(ente, paso, Math.atan2(dy, dx), esNpc ? (ente === voldemort ? 'voldemort' : '') : 'patrulla');
    colocar(ente);
  }

  let candidato = null; // personaje con el bocadillo abierto

  function prepararBurbuja(ente) {
    const partida = Estado.leer();
    let frase;
    if (ente === sombrero) frase = partida.sombrero ? `¡Ya eres de ${personaje.casa || 'Gryffindor'}! Sigue las huellas…` : 'Acércate…';
    else if (ente === voldemort) frase = V.saludo(nombre);
    else if (partida.misiones[ente.datos.mision] === 'completada') frase = Historia.agradecimiento(nombre);
    else frase = Historia.saludo(nombre);
    const tecla = document.createElement('span');
    tecla.className = 'tecla';
    tecla.textContent = 'E · hablar';
    const burbuja = ente.el.querySelector('.ente-burbuja');
    burbuja.replaceChildren(document.createTextNode(frase), document.createElement('br'), tecla);
    burbuja.onclick = (ev) => { ev.stopPropagation(); hablarCon(ente); };
  }

  function actualizarCercania() {
    let mejor = null;
    let mejorDistancia = Infinity;
    for (const ente of [...conversables, ...patrullas]) {
      if (ente.el.classList.contains('bloqueado')) continue;
      const d = distancia(ente, jugador);
      const visible = d < (ente.visible ? RADIO_VER + 30 : RADIO_VER);
      if (visible !== ente.visible) {
        ente.visible = visible;
        ente.el.classList.toggle('visible', visible);
      }
      if (conversables.includes(ente) && d < RADIO_HABLAR && d < mejorDistancia) { mejor = ente; mejorDistancia = d; }
    }
    const puede = mejor && !Dialogo.abierto() && !bloqueado && !terminado && !HUD.enPausa();
    const nuevo = puede ? mejor : null;
    if (nuevo !== candidato) {
      if (candidato) candidato.el.classList.remove('hablar');
      candidato = nuevo;
      if (candidato) {
        prepararBurbuja(candidato);
        candidato.el.classList.add('hablar');
      }
    }
  }

  /* --------------------------------------------------------------------------
     6) Filch y la Señora Norris
     -------------------------------------------------------------------------- */
  function vigilar(patrulla) {
    if (jugador.intocable > 0 || distancia(patrulla, jugador) > RADIO_PILLADO) return;
    jugador.intocable = INMUNIDAD;
    jugador.el.classList.add('intocable');
    HUD.aviso(patrulla.datos.frase, 'peligro');
    [jugador.x, jugador.y] = Historia.REFUGIO;
    colocar(jugador);
    camara(0, true);
    perderVida();
  }

  function perderVida() {
    const vidas = Estado.perderVida();
    HUD.pintar({ latido: true });
    if (vidas <= 0) finDePartida('derrota', 'vidas');
    return vidas;
  }

  /* --------------------------------------------------------------------------
     7) Misiones
     -------------------------------------------------------------------------- */
  async function hablarCon(ente) {
    if (Dialogo.abierto() || bloqueado || terminado || HUD.enPausa()) return;
    if (candidato) candidato.el.classList.remove('hablar');
    candidato = null;
    if (ente === sombrero) { await charlaSombrero(); return; }

    const d = ente.datos;
    const figura = Avatar.svg(`retrato-${d.id}`, d.nombre);
    const clase = d.final ? 'voldemort' : '';
    if (Estado.leer().misiones[d.mision] === 'completada') {
      await Dialogo.abrir({
        quien: d.nombre, figura, apariencia: d.apariencia, clase,
        lineas: d.gracias(nombre), botones: [{ id: 'cerrar', texto: 'Cerrar', principal: true }],
      });
      return;
    }
    Estado.conocerMision(d.mision); // aparece en la lista aunque elija "Cerrar"
    HUD.pintar();
    const eleccion = await Dialogo.abrir({
      quien: d.nombre, figura, apariencia: d.apariencia, clase, lineas: d.lineas(nombre),
      botones: [
        { id: 'cerrar', texto: (d.acciones && d.acciones.cerrar) || 'Cerrar' },
        { id: 'aceptar', texto: (d.acciones && d.acciones.aceptar) || 'Aceptar misión', principal: true },
      ],
    });
    // La pista se entrega en los dos casos
    if (!Estado.leer().pistas.includes(d.mision)) {
      Estado.darPista(d.mision);
      HUD.aviso(`🔍 Nueva pista de ${d.nombre}. Mírala en «Pistas».`, 'exito');
    }
    HUD.pintar();
    if (eleccion === 'aceptar') irAMision(d);
  }

  function guardarPosicion() {
    if (terminado) return;
    Estado.cambiar((e) => { e.jugador = { x: Math.round(jugador.x), y: Math.round(jugador.y) }; });
  }

  function irAMision(d) {
    Estado.aceptarMision(d.mision);
    guardarPosicion();
    bloqueado = true;
    document.body.classList.add('saliendo');
    setTimeout(() => { location.href = `/mision/${d.mision}`; }, 600);
  }

  function marcarHechas() {
    const partida = Estado.leer();
    for (const n of npcs) n.el.classList.toggle('hecha', partida.misiones[n.datos.mision] === 'completada');
  }

  async function completarMision(n) {
    const partida = Estado.leer();
    if (partida.misiones[n] === 'completada' || partida.fin || terminado) return;
    if (n === Estado.FINAL) {
      Estado.completarMision(n);
      await finDePartida('victoria');
      return;
    }
    const mision = Historia.PERSONAJES.find((p) => p.mision === n);
    if (!mision) return;
    const antes = Estado.completadas(partida);
    Estado.completarMision(n);
    HUD.pintar();
    bloqueado = true;
    await Animaciones.destruirHorrocrux(mision);
    bloqueado = false;
    marcarHechas();
    HUD.aviso(`✓ ${mision.titulo}`, 'exito');
    if (antes < Estado.MISIONES && Estado.completadas() === Estado.MISIONES) llegaVoldemort(true);
  }

  async function procesarRetorno() {
    const params = new URLSearchParams(location.search);
    if (!params.has('completada') && !params.has('fallo')) return;
    const completada = parseInt(params.get('completada'), 10);
    const fallo = params.has('fallo');
    history.replaceState({}, '', location.pathname);
    if (Number.isInteger(completada) && completada >= 1 && completada <= Estado.FINAL) await completarMision(completada);
    if (fallo && !terminado) {
      HUD.aviso('Has fallado la misión… pierdes una vida.', 'peligro');
      perderVida();
    }
  }

  /* --------------------------------------------------------------------------
     8) Sombrero, Voldemort y fin de partida
     -------------------------------------------------------------------------- */
  const S = Historia.SOMBRERO;

  async function ceremonia() {
    bloqueado = true;
    await esperar(1000);
    await Dialogo.abrir({
      quien: S.nombre, figura: Avatar.sombreroSvg('retrato-sombrero'), clase: 'sombrero',
      lineas: S.lineas(nombre, personaje.casa || 'Gryffindor'),
      botones: [{ id: 'espada', texto: S.accion, principal: true }],
    });
    await Animaciones.revelarEspada();
    Estado.cambiar((e) => { e.sombrero = true; e.espada = true; });
    Estado.iniciarReloj();
    HUD.pintar();
    HUD.aviso('⏳ El reloj ha empezado: tienes 40 minutos.');
    setTimeout(() => HUD.aviso('👣 Sigue las huellas doradas y habla con quien las deja.'), 900);
    bloqueado = false;
  }

  async function charlaSombrero() {
    if (!Estado.leer().sombrero) { await ceremonia(); return; }
    await Dialogo.abrir({
      quien: S.nombre, figura: Avatar.sombreroSvg('retrato-sombrero'), clase: 'sombrero',
      lineas: [S.lineas(nombre, personaje.casa || 'Gryffindor')[2], 'Sigue las huellas doradas: cada una lleva hasta alguien que necesita tu ayuda.'],
      botones: [{ id: 'cerrar', texto: 'Cerrar', principal: true }],
    });
  }

  function llegaVoldemort(conEfecto) {
    voldemort.el.classList.remove('bloqueado');
    if (!conEfecto) return;
    document.body.classList.add('voldemort-llega');
    setTimeout(() => document.body.classList.remove('voldemort-llega'), 3300);
    HUD.aviso('💀 Lord Voldemort ha llegado al Gran Comedor…', 'peligro');
    HUD.pintar();
  }

  async function finDePartida(resultado, motivo) {
    if (terminado) return;
    terminado = true;
    if (candidato) candidato.el.classList.remove('hablar');
    Estado.marcarFin(resultado);
    if (resultado === 'victoria') await Animaciones.victoria({ jugador: personaje });
    else await Animaciones.gameOver({ jugador: personaje, motivo });
    // Se empieza desde cero (vidas, reloj, misiones y pistas); el mago se conserva
    Estado.reiniciar();
    location.reload();
  }

  /* --------------------------------------------------------------------------
     Teclado
     -------------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    const dir = TECLAS[e.key];
    if (dir) {
      teclas[dir] = true;
      if (e.key.startsWith('Arrow')) e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      if (HUD.cerrarVentanas()) return;
      if (Dialogo.abierto()) { Dialogo.escapar(); return; }
      if (!terminado && !bloqueado) HUD.alternarPausa();
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      if (!Dialogo.abierto() && !terminado && !bloqueado) HUD.alternarPausa();
      return;
    }
    if (Dialogo.abierto()) {
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        Dialogo.avanzar();
      }
      return;
    }
    if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && candidato && !HUD.enPausa()) {
      e.preventDefault();
      hablarCon(candidato);
    }
  });
  document.addEventListener('keyup', (e) => {
    const dir = TECLAS[e.key];
    if (dir) teclas[dir] = false;
  });
  window.addEventListener('blur', () => { for (const k of Object.keys(teclas)) teclas[k] = false; });
  window.addEventListener('pagehide', guardarPosicion);
  window.addEventListener('resize', () => camara(0, true));

  /* --------------------------------------------------------------------------
     Bucle principal y arranque
     -------------------------------------------------------------------------- */
  let ultimo = performance.now();
  function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    const congelado = HUD.enPausa() || Dialogo.abierto() || bloqueado || terminado;
    if (!congelado) {
      moverJugador(dt);
      for (const n of npcs) pasear(n, dt);
      for (const p of patrullas) { pasear(p, dt); vigilar(p); }
      if (jugador.intocable > 0) {
        jugador.intocable -= dt;
        if (jugador.intocable <= 0) jugador.el.classList.remove('intocable');
      }
    } else {
      marcarQuieto(jugador, true);
    }
    actualizarCercania();
    camara(dt);
    requestAnimationFrame(bucle);
  }

  HUD.iniciar({ alAgotarse: () => finDePartida('derrota', 'tiempo') });
  marcarHechas();
  if (Estado.completadas() === Estado.MISIONES) llegaVoldemort(false);
  camara(0, true);
  requestAnimationFrame(bucle);
  setInterval(guardarPosicion, 2000);

  (async () => {
    const partida = Estado.leer();
    if (partida.fin === 'victoria') { await finDePartida('victoria'); return; }
    if (partida.fin === 'derrota') { await finDePartida('derrota', partida.vidas <= 0 ? 'vidas' : 'tiempo'); return; }
    if (partida.inicio && Estado.restante(partida) <= 0) { await finDePartida('derrota', 'tiempo'); return; }
    await procesarRetorno();
    if (!terminado && !Estado.leer().sombrero) await ceremonia();
  })();

  // Ayudas para probar desde la consola del navegador
  window.perderVida = perderVida;
  window.completarMision = (n) => completarMision(Number(n));
})();

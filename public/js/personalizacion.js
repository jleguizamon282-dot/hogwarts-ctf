/* =============================================================================
   personalizacion.js — Creación del personaje
   Actualiza el avatar SVG en vivo (peinado, gafas, bufanda de casa) y guarda
   la configuración en localStorage antes de ir al pergamino (juramento.html).
   ============================================================================= */

// Colores de bufanda por casa (a = principal, b = secundario)
const CASAS = {
  Gryffindor: { a: '#7f0909', b: '#e4b835' },
  Slytherin:  { a: '#1a472a', b: '#b9bfc4' },
  Ravenclaw:  { a: '#222f5b', b: '#9a6f33' },
  Hufflepuff: { a: '#e8b72a', b: '#2b2520' },
};

const config = { pelo: '1', gafas: 'si', casa: 'Gryffindor' };

const avatar = document.getElementById('avatar');
const stageCasa = document.getElementById('stage-casa');
const toggle = document.querySelector('.toggle');

function pintar() {
  avatar.dataset.pelo = config.pelo;
  avatar.dataset.gafas = config.gafas;
  avatar.dataset.casa = config.casa;
  stageCasa.textContent = config.casa;
  toggle.dataset.sel = config.gafas; // mueve el indicador del toggle
}

/* --- Peinado (chips) --- */
document.querySelector('.chips[data-opcion="pelo"]').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chips .chip').forEach((c) => c.classList.remove('activo'));
  chip.classList.add('activo');
  config.pelo = chip.dataset.valor;
  pintar();
});

/* --- Gafas (toggle) --- */
toggle.addEventListener('click', (e) => {
  const seg = e.target.closest('.seg');
  if (!seg) return;
  toggle.querySelectorAll('.seg').forEach((s) => s.classList.remove('activo'));
  seg.classList.add('activo');
  config.gafas = seg.dataset.valor;
  pintar();
});

/* --- Casa / bufanda --- */
document.querySelector('.casas[data-opcion="casa"]').addEventListener('click', (e) => {
  const btn = e.target.closest('.casa-btn');
  if (!btn) return;
  document.querySelectorAll('.casa-btn').forEach((b) => b.classList.remove('activo'));
  btn.classList.add('activo');
  config.casa = btn.dataset.casa;
  pintar();
});

/* --- Comenzar aventura --- */
document.getElementById('btn-comenzar').addEventListener('click', () => {
  const casa = CASAS[config.casa] || CASAS.Gryffindor;
  const guardar = {
    pelo: config.pelo,
    gafas: config.gafas,
    casa: config.casa,
    scarfA: casa.a,
    scarfB: casa.b,
    color: casa.a, // compatibilidad con el mapa (color de túnica = color de casa)
  };
  localStorage.setItem('howgarts_personaje', JSON.stringify(guardar));
  document.body.classList.add('saliendo');
  setTimeout(() => (location.href = 'juramento.html'), 400);
});

pintar();

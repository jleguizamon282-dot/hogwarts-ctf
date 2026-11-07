/* =============================================================================
   personalizacion.js — Sala de creacion del personaje
   Actualiza la previsualizacion en vivo y guarda la config en localStorage.
   ============================================================================= */

// Config por defecto
const config = {
  pelo: '1',
  gafas: 'no',
  casa: 'Gryffindor',
  color: '#9b1c1c',
};

const avatar = document.getElementById('avatar');
const avatarCasa = document.getElementById('avatar-casa');

// Aplica la config actual a la previsualizacion
function pintarAvatar() {
  avatar.dataset.pelo = config.pelo;
  avatar.dataset.gafas = config.gafas;
  avatar.style.setProperty('--tunica', config.color);
  avatarCasa.textContent = config.casa;
}

// Maneja clics en cualquier grupo de chips
document.querySelectorAll('.chips').forEach((grupo) => {
  const opcion = grupo.dataset.opcion; // pelo | gafas | casa
  grupo.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    // Marcar activo
    grupo.querySelectorAll('.chip').forEach((c) => c.classList.remove('activo'));
    chip.classList.add('activo');

    // Guardar valor
    config[opcion] = chip.dataset.valor;
    if (opcion === 'casa') {
      config.casa = chip.dataset.valor;
      config.color = chip.dataset.color;
    }
    pintarAvatar();
  });
});

// Boton comenzar: guarda y va al mapa
document.getElementById('btn-comenzar').addEventListener('click', () => {
  localStorage.setItem('howgarts_personaje', JSON.stringify(config));
  document.body.classList.add('saliendo');
  setTimeout(() => (location.href = 'mapa.html'), 400);
});

pintarAvatar();

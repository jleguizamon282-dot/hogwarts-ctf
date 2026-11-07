/* =============================================================================
   login.js — Logica del inicio de sesion
   Envia las credenciales al backend (/api/login), que es VULNERABLE a SQLi
   de forma intencional. Si el acceso se concede, pasa a la personalizacion.
   ============================================================================= */

const form = document.getElementById('form-login');
const inputUser = document.getElementById('username');
const inputPass = document.getElementById('password');
const mensaje = document.getElementById('mensaje');

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = 'mensaje ' + (tipo || '');
}

function irA(url) {
  document.body.classList.add('saliendo');
  setTimeout(() => (location.href = url), 400);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarMensaje('Comprobando el registro de magos…', '');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: inputUser.value,
        password: inputPass.value,
      }),
    });
    const data = await res.json();

    if (data.ok) {
      // Guardamos una sesion muy simple en localStorage (suficiente para el juego).
      localStorage.setItem(
        'howgarts_sesion',
        JSON.stringify({ user: data.user, inyeccion: !!data.inyeccion, ts: Date.now() })
      );

      const extra = data.inyeccion
        ? ' 🪄 (¡Has colado un hechizo en la cerradura!)'
        : '';
      mostrarMensaje('✅ ' + data.mensaje + extra, 'exito');
      irA('personalizacion.html');
    } else {
      mostrarMensaje('⛔ ' + (data.mensaje || 'Acceso denegado.'), 'error');
    }
  } catch (err) {
    mostrarMensaje('No se pudo contactar con el castillo. ¿Está el servidor encendido?', 'error');
    console.error(err);
  }
});

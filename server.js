/**
 * server.js
 * -----------------------------------------------------------------------------
 * Backend Express del CTF educativo "Howgarts".
 *
 * ##########################################################################
 * #  AVISO DE SEGURIDAD                                                     #
 * #  Este servidor contiene una vulnerabilidad de INYECCION SQL INTENCIONAL #
 * #  en /api/login. Es una MECANICA DEL JUEGO para un entorno de practica   #
 * #  local y controlado. NO la parchees y NO despliegues esto en Internet.  #
 * ##########################################################################
 * -----------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
// Puerto 80 por defecto: para que el escaneo de Kali (nmap) detecte el servicio
// web HTTP estandar. Enlazar al puerto 80 requiere privilegios (ver README).
// Se puede sobreescribir:  PORT=3000 npm start
const PORT = process.env.PORT || 80;
const DB_PATH = path.join(__dirname, 'db', 'hogwarts.db');

// Si no existe la BD todavia, avisamos con instrucciones claras.
if (!fs.existsSync(DB_PATH)) {
  console.error('\n[!] No se encontro la base de datos.');
  console.error('    Ejecuta primero:  npm run initdb\n');
  process.exit(1);
}

const db = new Database(DB_PATH);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===========================================================================
 *  LOGIN  ——  VULNERABILIDAD DE INYECCION SQL (INTENCIONAL)
 * ===========================================================================
 *  La consulta concatena directamente la entrada del usuario dentro del SQL,
 *  sin usar parametros preparados (?). Por eso es inyectable.
 *
 *  Payload de ejemplo para el reto (campo usuario):
 *      ' OR 1=1 --
 *
 *  La consulta resultante queda:
 *      SELECT ... FROM users WHERE username = '' OR 1=1 --' AND password = '...'
 *  El "--" comenta el resto, "1=1" siempre es verdadero => devuelve filas
 *  => acceso concedido sin conocer ninguna contrasena.
 *
 *  >>> NO CONVERTIR A CONSULTA PARAMETRIZADA: rompe el reto del CTF. <<<
 * =========================================================================== */
app.post('/api/login', (req, res) => {
  const username = (req.body.username || '');
  const password = (req.body.password || '');

  // --- INICIO ZONA VULNERABLE (no tocar) -----------------------------------
  const query =
    "SELECT id, username, role, casa FROM users " +
    "WHERE username = '" + username + "' AND password = '" + password + "'";
  // --- FIN ZONA VULNERABLE --------------------------------------------------

  console.log('[login] SQL ejecutado =>', query);

  try {
    const filas = db.prepare(query).all();

    if (filas.length > 0) {
      // Acceso concedido (credenciales validas O inyeccion exitosa).
      return res.json({
        ok: true,
        inyeccion: /or\s+1\s*=\s*1|--/i.test(username + password),
        user: { username: filas[0].username, role: filas[0].role },
        mensaje: 'Acceso concedido. Bienvenido a Hogwarts.'
      });
    }

    // Usuario inexistente o credenciales incorrectas => denegado.
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. Ese mago no figura en nuestros registros.'
    });
  } catch (err) {
    // Un error de sintaxis SQL (ej. una comilla suelta) tambien es informacion
    // util para quien aprende: lo devolvemos a proposito.
    return res.status(500).json({
      ok: false,
      mensaje: 'El hechizo fallo (error SQL).',
      detalle: err.message
    });
  }
});

/* ===========================================================================
 *  MISIONES: pantalla del tablero y comprobacion de hechizos
 * ===========================================================================
 *  /mision/:id sirve siempre la misma pagina (public/mision.html); el propio
 *  script de la pagina lee el numero de la URL y decora el tablero con la sala
 *  de esa mision.
 *
 *  El hechizo correcto NO viaja nunca al navegador: la pagina envia lo que
 *  escribe el jugador a POST /api/hechizo y el servidor solo contesta si
 *  acierta. Ademas, los hechizos tampoco estan escritos en el servidor: se
 *  guardan cifrados (sal + scrypt) en lib/hechizos.js.
 *  Se ignoran mayusculas, tildes, espacios, guiones y guiones bajos.
 *  Para cambiar un hechizo:  npm run hechizo -- "Nuevo hechizo"
 * =========================================================================== */
const { HECHIZOS, normalizar, comprobar } = require('./lib/hechizos');

app.get('/mision/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1 || id > 8) {
    return res.status(404).send('Mision no encontrada.');
  }
  res.sendFile(path.join(__dirname, 'public', 'mision.html'));
});

/* ---------------------------------------------------------------------------
 *  PISTA DE EXPERTO (el "bombillo" de cada mision)
 *  Revela el tema real del reto (Wireshark, Burp Suite, ...). No es el hechizo,
 *  solo una ayuda muy clara. Se sirve aparte para que no este escrito en la
 *  pagina: el jugador la pide y, a cambio, pierde tiempo (el coste lo aplica el
 *  cliente en Estado, igual que el resto del reloj).
 * ------------------------------------------------------------------------- */
const TECNICAS = {
  1: { tema: 'Wireshark', detalle: 'Analisis de trafico de red y reconocimiento. Localiza rutas ocultas del sitio y abre la captura .pcap para leer lo que viajo por la red.' },
  2: { tema: 'Credenciales + SSH', detalle: 'Analisis de credenciales iniciales y acceso por SSH. Usa las credenciales del reto anterior para entrar y revisa la carpeta del usuario.' },
  3: { tema: 'Esteganografia', detalle: 'Esteganografia y analisis de metadatos de imagenes. Descarga la imagen de Slytherin y extrae lo que lleva oculto dentro.' },
  4: { tema: 'Burp Suite', detalle: 'Intercepta la peticion del formulario y modifica el POST (el campo role) antes de que llegue al servidor.' },
  5: { tema: 'Metasploit', detalle: 'Usa Metasploit para obtener acceso al usuario Bellatrix y busca el archivo en su carpeta personal.' },
  6: { tema: 'CVE (vulnerabilidad conocida)', detalle: 'Explota una vulnerabilidad conocida (CVE) de un servicio para acceder al usuario Lucius y revisa su carpeta.' },
  7: { tema: 'SUID / Kernel', detalle: 'Escalada local mediante un binario SUID o un fallo del kernel para pasar a root y abrir el archivo protegido.' },
  8: { tema: 'Escalada a root', detalle: 'Con el acceso de root del paso anterior, lee el archivo final en el directorio de root (/root).' },
};

app.get('/api/pista/:mision', (req, res) => {
  const n = parseInt(req.params.mision, 10);
  const pista = TECNICAS[n];
  if (!pista) return res.status(404).json({ ok: false, mensaje: 'Esa mision no existe.' });
  return res.json({ ok: true, ...pista });
});

app.post('/api/hechizo', async (req, res) => {
  const mision = parseInt(req.body.mision, 10);
  if (!HECHIZOS[mision]) {
    return res.status(404).json({ ok: false, mensaje: 'Esa mision no existe.' });
  }
  if (!normalizar(req.body.hechizo)) {
    return res.status(400).json({ ok: false, mensaje: 'Escribe un hechizo.' });
  }
  try {
    const acierto = await comprobar(req.body.hechizo, HECHIZOS[mision]);
    console.log(`[hechizo] mision ${mision} -> ${acierto ? 'ACIERTO' : 'fallo'}`);
    return res.json({ ok: true, acierto });
  } catch (err) {
    console.error('[hechizo] error al comprobar:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'El hechizo se ha desvanecido. Intentalo de nuevo.' });
  }
});

/* ===========================================================================
 *  Endpoint de ayuda para depurar el reto (opcional)
 * =========================================================================== */
app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'howgarts-ctf' }));

const server = app.listen(PORT, () => {
  console.log('===========================================================');
  console.log('  HOWGARTS CTF  —  laboratorio educativo (NO usar en produccion)');
  console.log(`  Servidor activo:  http://localhost:${PORT}  (puerto ${PORT})`);
  console.log('  Login vulnerable: POST /api/login');
  console.log('  Entrada legitima: usuario + contrasena validos');
  console.log("  Entrada por SQLi: usuario =  ' OR 1=1 --");
  console.log('===========================================================');
});

// Mensajes de error claros para el operador del laboratorio.
server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`\n[!] Sin privilegios para enlazar el puerto ${PORT}.`);
    console.error('    Opciones:');
    console.error('      - Ejecutar con privilegios:   sudo npm start');
    console.error('      - Permitir el puerto a node:  sudo setcap "cap_net_bind_service=+ep" "$(command -v node)"');
    console.error('      - Usar otro puerto:           PORT=3000 npm start\n');
  } else if (err.code === 'EADDRINUSE') {
    console.error(`\n[!] El puerto ${PORT} ya esta en uso. Libera el puerto o usa:  PORT=3000 npm start\n`);
  } else {
    console.error('\n[!] Error al iniciar el servidor:', err.message, '\n');
  }
  process.exit(1);
});

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
 *  acierta. Asi no se puede leer la respuesta inspeccionando el codigo fuente.
 *  Se ignoran mayusculas, tildes, espacios, guiones y guiones bajos:
 *  "Avada Kedavra", "avada_kedavra" y "AVADA-KEDAVRA" valen lo mismo.
 * =========================================================================== */
const HECHIZOS = {
  1: 'Alohomora',             // Diario de Tom Riddle
  2: 'Velamentum_Scriptura',  // Anillo de Sorvolo Gaunt
  3: 'Aparecium',             // Guardapelo de Slytherin
  4: 'Imperio',               // Copa de Helga Hufflepuff
  5: 'Bombarda',              // Diadema de Ravenclaw
  6: 'Sectumsempra',          // Nagini
  7: 'Crucio',                // El ultimo horrocrux (Harry Potter)
  8: 'Avada Kedavra',         // Lord Voldemort (duelo final)
};

const normalizarHechizo = (texto) => String(texto || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // sin tildes
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');                          // sin espacios, _ ni signos

app.get('/mision/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1 || id > 8) {
    return res.status(404).send('Mision no encontrada.');
  }
  res.sendFile(path.join(__dirname, 'public', 'mision.html'));
});

app.post('/api/hechizo', (req, res) => {
  const mision = parseInt(req.body.mision, 10);
  if (!HECHIZOS[mision]) {
    return res.status(404).json({ ok: false, mensaje: 'Esa mision no existe.' });
  }
  const intento = normalizarHechizo(req.body.hechizo);
  if (!intento) {
    return res.status(400).json({ ok: false, mensaje: 'Escribe un hechizo.' });
  }
  const acierto = intento === normalizarHechizo(HECHIZOS[mision]);
  console.log(`[hechizo] mision ${mision} -> ${acierto ? 'ACIERTO' : 'fallo'}`);
  return res.json({ ok: true, acierto });
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

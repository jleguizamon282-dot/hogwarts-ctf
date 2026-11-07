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
const PORT = process.env.PORT || 3000;
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
 *  RUTAS DE MISIONES (placeholders — se construiran mas adelante)
 * =========================================================================== */
app.get('/mision/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1 || id > 8) {
    return res.status(404).send('Mision no encontrada.');
  }
  // Placeholder: mas adelante aqui cargaremos cada reto/nivel.
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>Mision ${id}</title>
    <style>
      body{margin:0;height:100vh;display:grid;place-items:center;
           background:#0b0a1a;color:#f4e4b8;font-family:system-ui,sans-serif;text-align:center}
      a{color:#c9a84a}
    </style></head>
    <body><div>
      <h1>&#129668; Mision ${id}</h1>
      <p>Nivel en construccion. Aqui ira el reto del personaje ${id}.</p>
      <p><a href="/mapa.html">&larr; Volver al Mapa del Merodeador</a></p>
    </div></body></html>`);
});

/* ===========================================================================
 *  Endpoint de ayuda para depurar el reto (opcional)
 * =========================================================================== */
app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'howgarts-ctf' }));

app.listen(PORT, () => {
  console.log('===========================================================');
  console.log('  HOWGARTS CTF  —  entorno educativo (NO usar en produccion)');
  console.log(`  Servidor activo:  http://localhost:${PORT}`);
  console.log('  Login vulnerable: POST /api/login');
  console.log("  Reto SQLi:        usuario =  ' OR 1=1 --");
  console.log('===========================================================');
});

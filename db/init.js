/**
 * db/init.js
 * -----------------------------------------------------------------------------
 * Crea y siembra la base de datos SQLite del LABORATORIO.
 *
 * Topologia del lab:
 *   Kali (atacante) escanea la VM Ubuntu, detecta el servicio web en el
 *   PUERTO 80 y encuentra este login. Hay dos formas de entrar:
 *     1) LEGITIMA  : usuario + contrasena validos (cuentas sembradas aqui,
 *                    que INCLUYEN los usuarios de login reales de la VM Ubuntu).
 *     2) INYECCION : usuario =  ' OR 1=1 --   (brecha intencional, educativa).
 *
 * IMPORTANTE sobre las contrasenas:
 *   - Esta app guarda sus PROPIAS contrasenas de laboratorio en la BD SQLite.
 *   - NO lee /etc/shadow ni las contrasenas reales del sistema, y NO usa PAM.
 *   - Del sistema solo toma los NOMBRES de usuario de /etc/passwd (lectura
 *     publica, sin contrasenas), para que las cuentas del login coincidan con
 *     los usuarios de la VM y el recon tenga sentido.
 *
 * Config por variables de entorno (opcionales):
 *   IMPORT_SYSTEM_USERS=false   -> no importar usuarios de /etc/passwd
 *   DEFAULT_LAB_PASSWORD=xxxx   -> contrasena por defecto para usuarios importados
 *   PASSWD_FILE=/ruta/passwd    -> leer otro archivo passwd (para pruebas)
 *
 * Contrasenas por usuario: crea db/lab-users.json  (ver db/lab-users.example.json)
 *
 * Ejecutar:   npm run initdb
 * -----------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'hogwarts.db');
const DEFAULT_LAB_PASSWORD = process.env.DEFAULT_LAB_PASSWORD || 'hogwarts2024';
const IMPORTAR_SISTEMA = process.env.IMPORT_SYSTEM_USERS !== 'false';
const PASSWD_FILE = process.env.PASSWD_FILE || '/etc/passwd';

/* --- Cuentas demo de Hogwarts (siempre presentes, para pruebas y ambiente) - */
const DEMO = [
  // username        password              role       casa
  ['harry',          'expelliarmus',       'alumno',  'Gryffindor'],
  ['hermione',       'wingardium_leviosa', 'alumno',  'Gryffindor'],
  ['ron',            'quidditch99',        'alumno',  'Gryffindor'],
  ['luna',           'nargles',            'alumno',  'Ravenclaw'],
  ['cedric',         'buscador',           'alumno',  'Hufflepuff'],
  ['draco',          'serpensortia',       'alumno',  'Slytherin'],
  ['dumbledore',     'sherbet_lemon',      'director','Gryffindor'],
];

/* --- Overrides de contrasena por usuario (db/lab-users.json) --------------- */
function cargarOverrides() {
  const f = path.join(__dirname, 'lab-users.json');
  try {
    const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log(`[init] Overrides de contrasena cargados de ${f}`);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {}; // no existe el archivo: normal
  }
}

/* --- Leer usuarios de login reales de /etc/passwd -------------------------- */
// Solo nombres de cuentas con shell de login (bash, sh, zsh, ksh, fish, dash).
// Esto filtra de forma natural cuentas de servicio (nologin/false).
function leerUsuariosSistema() {
  if (!IMPORTAR_SISTEMA) return [];
  try {
    const txt = fs.readFileSync(PASSWD_FILE, 'utf8');
    const shellLogin = /\/(bash|sh|zsh|ksh|fish|dash)$/;
    const nombres = txt
      .split('\n')
      .filter(Boolean)
      .map((linea) => linea.split(':'))
      .filter((c) => c.length >= 7 && shellLogin.test((c[6] || '').trim()))
      .map((c) => c[0].trim());
    return [...new Set(nombres)];
  } catch (e) {
    console.warn(`[init] No se pudo leer ${PASSWD_FILE} (${e.code}). Se omiten usuarios del sistema.`);
    return [];
  }
}

/* --- Construir la lista final de usuarios ---------------------------------- */
const overrides = cargarOverrides();
const CASAS = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];

const usuarios = [];
const vistos = new Set();

// 1) Cuentas demo de Hogwarts
for (const [u, p, role, casa] of DEMO) {
  usuarios.push({ username: u, password: overrides[u] || p, role, casa });
  vistos.add(u);
}

// 2) Usuarios de login reales de la VM Ubuntu
const sistema = leerUsuariosSistema();
sistema.forEach((u, i) => {
  if (vistos.has(u)) return; // ya cubierto por una cuenta demo
  usuarios.push({
    username: u,
    password: overrides[u] || DEFAULT_LAB_PASSWORD,
    role: u === 'root' ? 'admin' : 'sistema',
    casa: CASAS[i % CASAS.length],
  });
  vistos.add(u);
});

/* --- Crear y poblar la base de datos --------------------------------------- */
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('[init] Base de datos anterior eliminada.');
}

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'muggle',
    casa      TEXT
  );
`);

const insert = db.prepare(
  'INSERT INTO users (username, password, role, casa) VALUES (@username, @password, @role, @casa)'
);
db.transaction((rows) => rows.forEach((r) => insert.run(r)))(usuarios);

/* --- Informe para el operador del laboratorio ------------------------------ */
console.log(`\n[init] Base de datos creada en: ${DB_PATH}`);
console.log(`[init] ${usuarios.length} usuarios sembrados ` +
  `(${DEMO.length} demo + ${usuarios.length - DEMO.length} del sistema).`);

console.log('\n  CREDENCIALES DE LABORATORIO (para el login web)');
console.log('  ' + '-'.repeat(52));
console.log('  ' + 'USUARIO'.padEnd(20) + 'CONTRASENA'.padEnd(22) + 'ROL');
console.log('  ' + '-'.repeat(52));
for (const u of usuarios) {
  console.log('  ' + u.username.padEnd(20) + String(u.password).padEnd(22) + u.role);
}
console.log('  ' + '-'.repeat(52));
console.log('  Nota: estas son contrasenas de LABORATORIO (BD del juego),');
console.log('  independientes de las contrasenas reales del sistema.');
console.log("  Tambien se puede entrar sin credenciales con:  ' OR 1=1 --\n");

db.close();

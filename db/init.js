/**
 * db/init.js
 * -----------------------------------------------------------------------------
 * Crea y siembra la base de datos SQLite del CTF.
 *
 * La tabla `users` simula las cuentas de un sistema Ubuntu (de ahi los nombres
 * de usuario tipo "root", "www-data", etc.) mezclados con personajes de
 * Hogwarts. Las contrasenas NO estan cifradas a proposito: el reto del CTF es
 * entrar SIN conocer ninguna contrasena, abusando de la inyeccion SQL del login.
 *
 * Ejecutar una sola vez:   npm run initdb
 * -----------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'hogwarts.db');

// Si ya existe, lo borramos para re-sembrar limpio.
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

// Usuarios "del sistema" + personajes. El jugador NO los conoce; existen solo
// para que la consulta tenga filas reales que devolver cuando 1=1 sea verdadero.
const usuarios = [
  // username        password              role      casa
  ['root',           'toor_s3cr3t',        'admin',   null],
  ['www-data',       'apache2',            'system',  null],
  ['daemon',         'nologin',            'system',  null],
  ['harry',          'expelliarmus',       'alumno',  'Gryffindor'],
  ['hermione',       'wingardium_leviosa', 'alumno',  'Gryffindor'],
  ['ron',            'quidditch99',        'alumno',  'Gryffindor'],
  ['luna',           'nargles',            'alumno',  'Ravenclaw'],
  ['cedric',         'buscador',           'alumno',  'Hufflepuff'],
  ['draco',          'serpensortia',       'alumno',  'Slytherin'],
  ['dumbledore',     'sherbet_lemon',      'director','Gryffindor'],
];

const insert = db.prepare(
  'INSERT INTO users (username, password, role, casa) VALUES (?, ?, ?, ?)'
);
const insertAll = db.transaction((rows) => {
  for (const r of rows) insert.run(r);
});
insertAll(usuarios);

const total = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
console.log(`[init] Base de datos creada en: ${DB_PATH}`);
console.log(`[init] ${total} usuarios sembrados.`);
console.log('[init] Pista CTF: no necesitas ninguna de esas contrasenas ;)');

db.close();

#!/usr/bin/env node
/**
 * scripts/cifrar-hechizo.js
 * -----------------------------------------------------------------------------
 * Genera la entrada cifrada de un hechizo para la tabla HECHIZOS
 * (lib/hechizos.js). El hechizo no se guarda en ningun sitio.
 *
 *     npm run hechizo -- "Nuevo hechizo"
 *
 * Imprime algo como:   { sal: '...', hash: '...' },
 * Copia esa linea en la mision que corresponda y reinicia el servidor.
 * -----------------------------------------------------------------------------
 */

const { cifrar, normalizar } = require('../lib/hechizos');

const texto = process.argv.slice(2).join(' ');
if (!normalizar(texto)) {
  console.error('Uso:  npm run hechizo -- "Nuevo hechizo"');
  process.exit(1);
}

const { sal, hash } = cifrar(texto);
console.log(`{ sal: '${sal}', hash: '${hash}' },`);

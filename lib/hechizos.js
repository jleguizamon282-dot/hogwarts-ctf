/**
 * lib/hechizos.js
 * -----------------------------------------------------------------------------
 * Hechizos de las misiones, guardados CIFRADOS.
 *
 * Ningun hechizo esta escrito en el codigo: de cada uno se guarda una "sal"
 * aleatoria y su resumen scrypt. Para comprobar un intento se calcula el mismo
 * resumen con esa sal y se compara. scrypt es lento a proposito (y usa bastante
 * memoria), asi que probar candidatos de uno en uno cuesta tiempo.
 *
 * Antes de cifrar se normaliza el texto: sin mayusculas, sin tildes y sin
 * espacios, guiones ni guiones bajos ("Wingardium Leviosa" = "wingardium_leviosa").
 *
 * Para cambiar el hechizo de una mision:
 *     npm run hechizo -- "Nuevo hechizo"
 * y pega la linea que imprime en la tabla HECHIZOS de abajo.
 * -----------------------------------------------------------------------------
 */

const crypto = require('crypto');

const PARAMETROS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const LARGO = 32;

const normalizar = (texto) => String(texto || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // sin tildes
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');                          // sin espacios, _ ni signos

/* Tabla de hechizos cifrados (sal y hash en base64) ------------------------- */
const HECHIZOS = {
  1: { sal: 'rKXEiCOCMR7ttJrDQwAkfQ==', hash: '/pOMjkUZLKnDDYYkJCw7mwb4dRIGBdXN6WaTHW5dzlY=' },  // Diario de Tom Riddle
  2: { sal: '4owan9L5HNWCEF9Dyz7MUA==', hash: 'rE6kz4D8URZRHYDM7fMrodaQqN4Inua4XE0piMVWyV8=' },  // Anillo de Sorvolo Gaunt
  3: { sal: '85sTSeD40UiJPErMSx0VlA==', hash: 'GaJ6S6CMVzUV/7pG9zW+9Fwlj1zUueku+9LfxEpj50s=' },  // Guardapelo de Slytherin
  4: { sal: 'B4HKK1tuWx4htbQCVquyjg==', hash: '0EAl8kYNWsIPps1evps8XoBC1mRfbw0yXab+bhwLo+w=' },  // Copa de Helga Hufflepuff
  5: { sal: 'hA0djOIlk7tPQGesgaMxtA==', hash: '9huVVYNzfEXnrEUB+S5ltxG1A1EVslf17NJBVAlrDrM=' },  // Diadema de Ravenclaw
  6: { sal: 'Hqft7FXhbKDP0zMBhugngA==', hash: 'D/d5Y9FLSzBmsK1LafwH1tzy9vxxmXi57a2Qms8A+Fc=' },  // Nagini
  7: { sal: 'TEhQaayGDXfVUaAgg5Drpg==', hash: 'RRTpuyocN9ZXqJzkpjXszHYtw7q4fI0DeExDD/ZJYXk=' },  // El ultimo horrocrux (Harry Potter)
  8: { sal: 'qW5ewTx3IKcd5iuTWHCynw==', hash: 'I01U5PyDV4FMiIx0JKQD5a+qLLfF8W+I6L3NqXwRsXo=' },  // Lord Voldemort (duelo final)
};

/* Cifrar (para generar entradas nuevas) -------------------------------------- */
function cifrar(texto, sal = crypto.randomBytes(16).toString('base64')) {
  const hash = crypto.scryptSync(normalizar(texto), Buffer.from(sal, 'base64'), LARGO, PARAMETROS);
  return { sal, hash: hash.toString('base64') };
}

/* Comprobar un intento (asincrono: no bloquea el servidor mientras calcula) -- */
function comprobar(texto, guardado) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(normalizar(texto), Buffer.from(guardado.sal, 'base64'), LARGO, PARAMETROS, (err, intento) => {
      if (err) return reject(err);
      const esperado = Buffer.from(guardado.hash, 'base64');
      resolve(intento.length === esperado.length && crypto.timingSafeEqual(intento, esperado));
    });
  });
}

module.exports = { HECHIZOS, normalizar, cifrar, comprobar };

#!/usr/bin/env node
/*
  Corre antes de cada build. Revisa que no quede relleno en el curriculum.
*/
import { readFileSync } from 'node:fs';

const texto = readFileSync('config/cv.ts', 'utf8');
const problemas = [];

for (const marca of ['TODO', 'FIXME', 'ejemplo.com', 'Lorem']) {
  if (texto.includes(marca)) problemas.push('config/cv.ts todavia contiene "' + marca + '"');
}

if (problemas.length) {
  console.error('\n  El build se detuvo:\n');
  for (const p of problemas) console.error('   · ' + p);
  console.error('');
  process.exit(1);
}

console.log('  check-config: sin datos de relleno.');

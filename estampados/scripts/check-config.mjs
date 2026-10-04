#!/usr/bin/env node
/*
  Corre antes de cada build.

  A diferencia de los otros cuatro proyectos, este NO exige numero de WhatsApp:
  es un panel privado y no comparte nada con nadie. Lo que si revisa es que no
  quede ningun marcador de relleno en config/site.ts.
*/
import { readFileSync } from 'node:fs';

const ARCHIVO = 'config/site.ts';
const texto = readFileSync(ARCHIVO, 'utf8');
const problemas = [];

for (const marca of ['TODO', 'FIXME', 'XXXX', 'ejemplo.com']) {
  if (texto.includes(marca)) {
    problemas.push(ARCHIVO + ' todavia contiene "' + marca + '"');
  }
}

if (problemas.length) {
  console.error('\n  El build se detuvo. Datos de relleno sin resolver:\n');
  for (const p of problemas) console.error('   · ' + p);
  console.error('');
  process.exit(1);
}

console.log('  check-config: sin datos de relleno.');

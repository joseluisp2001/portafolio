#!/usr/bin/env node
/*
  Corre antes de cada build.

  Este proyecto revisa mas que los otros, y no por gusto: enfermeria es una
  profesion regulada. Publicar un numero de incorporacion inventado, o decir que
  se hace algo sin aclarar que requiere receta, no es un error de diseno — es un
  problema legal y de seguridad para quien atiende y para quien recibe.
*/
import { readFileSync } from 'node:fs';

const ARCHIVO = 'config/site.ts';
const texto = readFileSync(ARCHIVO, 'utf8');
const problemas = [];

/**
 * Lee un campo de UN bloque concreto.
 *
 * El `bloque` importa: buscar `nombre:` suelto en todo el archivo encuentra
 * primero `site.nombre` —que siempre tiene valor— y entonces el nombre de la
 * profesional, que esta vacio, nunca se marcaba como faltante. Lo destape
 * corriendo el script: avisaba de tres cosas y deberia avisar de cuatro.
 */
const valorDe = (bloque, campo) => {
  const inicio = texto.indexOf(bloque + ':');
  if (inicio === -1) return null;

  const fin = texto.indexOf('},', inicio);
  const trozo = texto.slice(inicio, fin === -1 ? undefined : fin);

  const m = trozo.match(new RegExp(campo + "\\s*:\\s*'([^']*)'"));
  return m ? m[1] : null;
};

// --- 1. Marcadores de relleno ----------------------------------------------
for (const marca of ['TODO', 'FIXME', 'ejemplo.com', 'Lorem']) {
  if (texto.includes(marca)) problemas.push(ARCHIVO + ' todavia contiene "' + marca + '"');
}

// --- 2. Quien atiende -------------------------------------------------------
if (!valorDe('profesional', 'nombre')) {
  problemas.push('falta el nombre de quien atiende');
}

if (!valorDe('profesional', 'incorporacion')) {
  problemas.push(
    'falta el numero de incorporacion al colegio profesional.\n' +
      '        Es lo que le permite a alguien verificar que la persona que va a\n' +
      '        entrar a su casa esta habilitada. No se publica sin eso.',
  );
}

// --- 3. WhatsApp ------------------------------------------------------------
const whatsapp = valorDe('contacto', 'whatsapp');
if (!whatsapp) {
  problemas.push('falta el numero de WhatsApp: es el unico camino de contacto');
} else if (!/^506[2-8]\d{7}$/.test(whatsapp)) {
  problemas.push(
    'el numero "' + whatsapp + '" no tiene forma de celular de Costa Rica.\n' +
      '        Verificalo mandandole un mensaje desde otro telefono.',
  );
}

// --- 4. Cobertura -----------------------------------------------------------
if (/cobertura:\s*\[\s*\]/.test(texto)) {
  problemas.push(
    'la zona de cobertura esta vacia.\n' +
      '        La gente quiere ver el nombre de SU barrio, no "area metropolitana".',
  );
}

// --- 5. Precios -------------------------------------------------------------
const enCero = (texto.match(/precio:\s*0\b/g) ?? []).length;
if (enCero > 0) {
  console.warn(
    '\n  AVISO: ' + enCero + ' servicio(s) con precio en 0 ("se cotiza").\n' +
      '  No bloquea, pero quien compara dos opciones descarta la que no dice el precio.\n',
  );
}

if (problemas.length) {
  console.error('\n  El build se detuvo. Faltan datos que NO se pueden inventar:\n');
  for (const p of problemas) console.error('   · ' + p);
  console.error('');
  process.exit(1);
}

console.log('  check-config: los datos regulados estan completos.');

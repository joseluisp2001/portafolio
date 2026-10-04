#!/usr/bin/env node
/*
  Corre antes de cada build (`pnpm build`). Falla si algun dato de relleno se
  esta por publicar.

  Existe porque ya paso tres veces en esta maquina:
    · shein-los-guido salio con 4 numeros de WhatsApp inventados, incluido el
      del boton de hacer el pedido: cada pedido se perdia.
    · lash-brows-studio publica un correo que no es del estudio y un link de
      fidelidad que va a /TODO.
    · tech-services apuntaba al telefono personal, que ademas esta bloqueado en
      todos los bots.

  Ninguno se hizo a proposito: el dato real no llego y el relleno no molestaba
  a nadie hasta que fue tarde.
*/
import { readFileSync } from 'node:fs';

const archivo = 'config/site.ts';
const texto = readFileSync(archivo, 'utf8');
const problemas = [];

// 1. Marcadores de relleno que nunca deben llegar a produccion.
for (const marca of ['TODO', 'FIXME', 'XXXX', 'ejemplo.com', 'aurastudio']) {
  if (texto.includes(marca)) {
    problemas.push(`${archivo} todavia contiene "${marca}"`);
  }
}

// 2. Numeros de WhatsApp de relleno conocidos.
for (const falso of ['50600000000', '50688888888', '8888-8888', '50612345678']) {
  if (texto.includes(falso)) {
    problemas.push(`${archivo} usa el numero de relleno ${falso}`);
  }
}

// 3. El numero real tiene que existir y ser un celular de Costa Rica.
const m = texto.match(/whatsapp:\s*'([^']*)'/);
if (!m) {
  problemas.push('no se encontro el campo whatsapp en config/site.ts');
} else if (m[1] === '') {
  problemas.push(
    'falta el numero de WhatsApp. Es el unico camino a la venta: el sitio no ' +
    'deberia publicarse sin el. Ponelo en config/site.ts.'
  );
} else if (!/^506[2-8]\d{7}$/.test(m[1])) {
  problemas.push(
    `el numero "${m[1]}" no tiene forma de celular de Costa Rica ` +
    '(506 + 8 digitos). Verificalo mandandole un mensaje desde otro telefono.'
  );
}

if (problemas.length) {
  console.error('\n  El build se detuvo. Datos de relleno sin resolver:\n');
  for (const p of problemas) console.error('   · ' + p);
  console.error('');
  process.exit(1);
}

console.log('  check-config: sin datos de relleno.');

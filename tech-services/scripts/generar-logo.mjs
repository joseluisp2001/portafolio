/**
 * Genera los archivos del logo a partir de `lib/logo.ts`.
 *
 * Uso:  node scripts/generar-logo.mjs            (escribe los archivos)
 *       node scripts/generar-logo.mjs --muestra  (solo la hoja de prueba)
 *
 * Escribe:
 * - app/icon.svg        favicon; cambia de color con el tema del navegador
 * - app/apple-icon.png  180 × 180, fondo oscuro (iOS recorta las esquinas)
 * - public/logo.svg     símbolo de línea para fondo oscuro
 * - public/logo.png     512 × 512, fondo oscuro (lo sirve el sitio y lo usa el bot)
 *
 * Sin texto adentro: los SVG no dependen de que la máquina tenga Space Grotesk.
 * El nombre se escribe en HTML, en el componente `Logo`.
 */

import { writeFileSync } from 'node:fs';

import sharp from 'sharp';

import {
  LOGO_CARCASA,
  LOGO_COLORES as C,
  LOGO_PINES,
  LOGO_PIN_ACTIVO,
  LOGO_RADIO_PIN,
  LOGO_RADIO_PIN_SOLIDO,
  LOGO_TRAZO,
  LOGO_VIEWBOX,
  carcasaSolida,
} from '../lib/logo.ts';

/** Versión de línea: carcasa con trazo y pines llenos. */
function simboloLinea({ trazo, pin, activo }) {
  const pines = LOGO_PINES.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${LOGO_RADIO_PIN}" fill="${pin}"/>`).join('');
  return (
    `<path d="${LOGO_CARCASA}" fill="none" stroke="${trazo}" stroke-width="${LOGO_TRAZO}" stroke-linejoin="round"/>` +
    pines +
    `<circle cx="${LOGO_PIN_ACTIVO.x}" cy="${LOGO_PIN_ACTIVO.y}" r="${LOGO_RADIO_PIN}" fill="${activo}"/>`
  );
}

/** Versión sólida: se lee a 16 px, donde el trazo fino se pierde. */
function simboloSolido({ relleno, activo }) {
  return (
    `<path d="${carcasaSolida()}" fill="${relleno}" fill-rule="evenodd"/>` +
    `<circle cx="${LOGO_PIN_ACTIVO.x}" cy="${LOGO_PIN_ACTIVO.y}" r="${LOGO_RADIO_PIN_SOLIDO}" fill="${activo}"/>`
  );
}

const svg = (contenido, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"${extra}>${contenido}</svg>`;

/** Favicon: oscuro en pestañas claras, claro en pestañas oscuras. */
const favicon = svg(
  `<style>.c{fill:${C.oscuro}}.a{fill:${C.cianTinta}}@media (prefers-color-scheme:dark){.c{fill:${C.claro}}.a{fill:${C.cian}}}</style>` +
    `<path class="c" d="${carcasaSolida()}" fill-rule="evenodd"/>` +
    `<circle class="a" cx="${LOGO_PIN_ACTIVO.x}" cy="${LOGO_PIN_ACTIVO.y}" r="${LOGO_RADIO_PIN_SOLIDO}"/>`,
);

/** Ícono con fondo: el símbolo ocupa el 62 % del cuadro. */
async function iconoConFondo(lado) {
  const escala = 0.62;
  const offset = (32 * (1 - escala)) / 2;
  const contenido =
    `<rect width="32" height="32" fill="${C.oscuro}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${escala})">` +
    simboloLinea({ trazo: C.claro, pin: C.claro, activo: C.cian }) +
    `</g>`;
  return sharp(Buffer.from(svg(contenido, ` width="${lado}" height="${lado}"`))).png().toBuffer();
}

/** Hoja de prueba: cada variante en varios tamaños, sobre fondo oscuro y claro. */
async function muestra(destino) {
  const tamanos = [16, 24, 32, 64, 128];
  const filas = [
    { fondo: C.oscuro, simbolo: (t) => (t <= 24 ? simboloSolido({ relleno: C.claro, activo: C.cian }) : simboloLinea({ trazo: C.claro, pin: C.claro, activo: C.cian })) },
    { fondo: C.claro, simbolo: (t) => (t <= 24 ? simboloSolido({ relleno: C.oscuro, activo: C.cianTinta }) : simboloLinea({ trazo: C.oscuro, pin: C.oscuro, activo: C.cianTinta })) },
  ];
  const ancho = 40 + tamanos.reduce((s, t) => s + t + 40, 0);
  const alto = filas.length * 170;
  let cuerpo = '';
  filas.forEach((fila, i) => {
    const y0 = i * 170;
    cuerpo += `<rect y="${y0}" width="${ancho}" height="170" fill="${fila.fondo}"/>`;
    let x = 40;
    for (const t of tamanos) {
      cuerpo += `<svg x="${x}" y="${y0 + (170 - t) / 2}" width="${t}" height="${t}" viewBox="${LOGO_VIEWBOX}">${fila.simbolo(t)}</svg>`;
      x += t + 40;
    }
  });
  const hoja = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">${cuerpo}</svg>`;
  await sharp(Buffer.from(hoja)).png().toFile(destino);
  console.log(`Muestra: ${destino}`);
}

if (process.argv.includes('--muestra')) {
  await muestra(process.argv[process.argv.indexOf('--muestra') + 1] ?? 'logo-muestra.png');
} else {
  writeFileSync('app/icon.svg', favicon);
  writeFileSync('public/logo.svg', svg(simboloLinea({ trazo: C.claro, pin: C.claro, activo: C.cian })));
  writeFileSync('app/apple-icon.png', await iconoConFondo(180));
  writeFileSync('public/logo.png', await iconoConFondo(512));
  console.log('Escritos: app/icon.svg, app/apple-icon.png, public/logo.svg, public/logo.png');
}

/**
 * Genera las ilustraciones del sitio: hero, "Nosotros" y una por servicio.
 *
 * Por qué existen: no hay fotos reales del negocio y los marcadores "FOTO
 * PENDIENTE" hacían ver el sitio sin terminar. Son ilustraciones propias, con
 * la misma línea que el logo y la carga inicial (fondo de placa, pistas de
 * circuito, brillo cian). No se hacen pasar por fotos de trabajos: por eso la
 * galería "Trabajos realizados" sigue esperando fotos reales.
 *
 * Uso:  node scripts/generar-ilustraciones.mjs            (sobrescribe)
 *       node scripts/generar-ilustraciones.mjs --muestra <png>  (hoja de prueba)
 *
 * SOBRESCRIBE las imágenes de la lista. Cuando llegue una foto real de un
 * servicio, sacar ese servicio de ILUSTRACIONES antes de volver a correrlo.
 *
 * Los íconos son de Lucide (licencia ISC, ya es dependencia del sitio).
 */

import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import * as Iconos from 'lucide-react';

const C = {
  fondo: '#0F172A',
  cobre: '#3B4A60',
  via: '#475569',
  claro: '#F8FAFC',
  cian: '#06B6D4',
  punto: 'rgba(148, 163, 184, 0.10)',
};

/** Una por servicio: ruta de `config/site.ts` → ícono de Lucide. */
const ILUSTRACIONES = [
  ['/servicios/formateo.jpg', 'Laptop'],
  ['/servicios/limpieza.jpg', 'Fan'],
  ['/servicios/recuperacion.jpg', 'HardDrive'],
  ['/servicios/armado.jpg', 'Cpu'],
  ['/servicios/diagnostico.jpg', 'Stethoscope'],
  ['/servicios/bot.jpg', 'BotMessageSquare'],
  ['/servicios/web.jpg', 'AppWindow'],
  ['/servicios/n8n.jpg', 'Workflow'],
  ['/servicios/cableado.jpg', 'Cable'],
  ['/servicios/camaras.jpg', 'Cctv'],
  ['/servicios/wifi.jpg', 'Router'],
  ['/servicios/app.jpg', 'Smartphone'],
  ['/servicios/sistema.jpg', 'LayoutDashboard'],
];

/** Azar con semilla: la misma ruta da siempre el mismo dibujo. */
function azar(semilla) {
  let h = 1779033703;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function icono(nombre, lado, color) {
  const Componente = Iconos[nombre];
  if (!Componente) throw new Error(`Lucide no tiene el ícono ${nombre}`);
  return renderToStaticMarkup(createElement(Componente, { size: lado, strokeWidth: 1.25, color }));
}

/** Coloca un SVG ya armado en (x, y). */
const en = (svg, x, y) => svg.replace('<svg ', `<svg x="${x}" y="${y}" `);

function defs(ancho, alto) {
  return `<defs>
    <pattern id="grilla" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.3" fill="${C.punto}"/>
    </pattern>
    <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="h"/>
      <feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
    <radialGradient id="viñeta" cx="50%" cy="50%" r="75%">
      <stop offset="55%" stop-color="${C.fondo}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${C.fondo}" stop-opacity="0.85"/>
    </radialGradient>
  </defs>
  <rect width="${ancho}" height="${alto}" fill="${C.fondo}"/>
  <rect width="${ancho}" height="${alto}" fill="url(#grilla)"/>`;
}

function resplandor(cx, cy, r, fuerza = 0.2) {
  return `<radialGradient id="res-${cx}-${cy}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${C.cian}" stop-opacity="${fuerza}"/>
      <stop offset="100%" stop-color="${C.cian}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#res-${cx}-${cy})"/>`;
}

/**
 * Una pista que sale del borde, corre en horizontal, dobla a 45° y llega a
 * (xFin, yFin). `lado` = 1 si sale de la izquierda, -1 si de la derecha.
 */
function pista({ xIni, yIni, xDobla, xFin, yFin, lado = 1, pulso = null, via = null }) {
  const dy = yFin - yIni;
  const xFinDobla = xDobla + lado * Math.abs(dy);
  const d = `M${xIni} ${yIni}H${xDobla}L${xFinDobla} ${yFin}H${xFin}`;
  let s = `<path d="${d}" fill="none" stroke="${C.cobre}" stroke-width="3.5" stroke-linejoin="round"/>`;
  if (pulso) {
    // Un tramo encendido sobre la parte horizontal de entrada.
    const a = xIni + lado * pulso.desde;
    s += `<path d="M${a} ${yIni}H${a + lado * pulso.largo}" stroke="${C.cian}" stroke-width="5" stroke-linecap="round" filter="url(#brillo)"/>`;
  }
  if (via != null) {
    const vx = xIni + lado * via;
    s += `<circle cx="${vx}" cy="${yIni}" r="6" fill="${C.fondo}" stroke="${C.via}" stroke-width="3"/>`;
  }
  // Pad donde la pista toca el objeto.
  s += `<circle cx="${xFin}" cy="${yFin}" r="4" fill="${C.cian}" filter="url(#brillo)"/>`;
  return s;
}

function chip(x, y, ancho = 34, alto = 18) {
  return `<g>
    <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" rx="2" fill="${C.fondo}" stroke="${C.via}" stroke-width="2.5"/>
    <rect x="${x + 2}" y="${y + 2}" width="6" height="${alto - 4}" fill="${C.via}"/>
    <rect x="${x + ancho - 8}" y="${y + 2}" width="6" height="${alto - 4}" fill="${C.via}"/>
  </g>`;
}

/**
 * Tarjeta de servicio, 800 × 600. `espejo` pone el objeto a la izquierda y las
 * pistas entrando por la derecha: alternado, la grilla no se ve de molde.
 */
function servicio(ruta, nombreIcono, espejo) {
  const r = azar(ruta);
  const W = 800;
  const H = 600;
  const lado = 230;
  const s = espejo ? -1 : 1;
  const cx = espejo ? W - 480 : 480;
  const cy = 300;
  const x0 = cx - lado / 2;
  const y0 = cy - lado / 2;

  const salidas = [-78, 0, 78];
  const llegadas = [-44, 0, 44];
  const conPulso = Math.floor(r() * 3);
  const pistas = salidas
    .map((salida, i) =>
      pista({
        xIni: espejo ? W + 10 : -10,
        yIni: cy + salida + Math.round((r() - 0.5) * 14),
        xDobla: (espejo ? W : 0) + s * (110 + Math.round(r() * 120)),
        xFin: espejo ? x0 + lado + 18 : x0 - 18,
        lado: s,
        yFin: cy + llegadas[i],
        pulso: i === conPulso ? { desde: 60 + Math.round(r() * 40), largo: 46 } : null,
        via: i !== conPulso ? 40 + Math.round(r() * 40) : null,
      }),
    )
    .join('');

  const xChip = 150 + Math.round(r() * 60);
  const extra = r() > 0.5 ? chip(espejo ? W - xChip - 34 : xChip, cy - 9 + (r() > 0.5 ? 78 : -78)) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs(W, H)}
    ${resplandor(cx, cy, 260, 0.22)}
    ${pistas}
    ${extra}
    <g filter="url(#halo)" opacity="0.55">${en(icono(nombreIcono, lado, C.cian), x0, y0)}</g>
    ${en(icono(nombreIcono, lado, C.claro), x0, y0)}
    <rect width="${W}" height="${H}" fill="url(#viñeta)"/>
  </svg>`;
}

/** Hero, 1600 × 1000: pistas en los costados, el centro libre para el texto. */
function hero() {
  const r = azar('hero');
  const W = 1600;
  const H = 1000;
  let s = '';
  for (const lado of [1, -1]) {
    const borde = lado === 1 ? -10 : W + 10;
    for (let i = 0; i < 8; i++) {
      const y = 110 + i * 110 + Math.round((r() - 0.5) * 30);
      const dobla = borde + lado * (60 + Math.round(r() * 140));
      const fin = borde + lado * (300 + Math.round(r() * 80));
      const salto = (r() > 0.5 ? 1 : -1) * (30 + Math.round(r() * 40));
      s += pista({
        xIni: borde,
        yIni: y,
        xDobla: dobla,
        xFin: fin,
        yFin: y + salto,
        lado,
        pulso: r() > 0.6 ? { desde: 20 + Math.round(r() * 40), largo: 40 } : null,
        via: r() > 0.4 ? 30 + Math.round(r() * 20) : null,
      });
    }
    s += chip(lado === 1 ? 180 : W - 214, 480);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs(W, H)}
    ${resplandor(W / 2, H / 2, 620, 0.16)}
    ${s}
    <rect width="${W}" height="${H}" fill="url(#viñeta)"/>
  </svg>`;
}

/** "Nosotros", 1200 × 1200: reparación → hardware → redes, conectados. */
function nosotros() {
  const W = 1200;
  const H = 1200;
  const lado = 200;
  const puntos = [
    ['Wrench', 290, 360],
    ['Cpu', 600, 640],
    ['Wifi', 910, 360],
  ];
  const conexiones = [
    // de la llave al procesador y del procesador a la red, con quiebres a 45°
    `M${290} ${470}V${540}L${390} ${640}H${490}`,
    `M${710} ${640}H${810}L${910} ${540}V${470}`,
  ]
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${C.cobre}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${C.cian}" stroke-width="4" stroke-linecap="round" stroke-dasharray="60 400" stroke-dashoffset="-80" filter="url(#brillo)"/>`,
    )
    .join('');
  const objetos = puntos
    .map(([n, x, y]) => {
      const x0 = x - lado / 2;
      const y0 = y - lado / 2;
      return `${resplandor(x, y, 200, 0.18)}<g filter="url(#halo)" opacity="0.5">${en(icono(n, lado, C.cian), x0, y0)}</g>${en(icono(n, lado, C.claro), x0, y0)}`;
    })
    .join('');
  const base = [
    `<path d="M600 760V900" stroke="${C.cobre}" stroke-width="4"/>`,
    `<circle cx="600" cy="910" r="10" fill="${C.fondo}" stroke="${C.via}" stroke-width="4"/>`,
    chip(560, 820, 80, 36),
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs(W, H)}
    ${conexiones}
    ${base}
    ${objetos}
    <rect width="${W}" height="${H}" fill="url(#viñeta)"/>
  </svg>`;
}

const trabajos = [
  ['/hero.jpg', hero()],
  ['/sobre-nosotros.jpg', nosotros()],
  ...ILUSTRACIONES.map(([ruta, n], i) => [ruta, servicio(ruta, n, i % 2 === 1)]),
];

async function aJpg(svg) {
  return sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}

if (process.argv.includes('--muestra')) {
  const destino = process.argv[process.argv.indexOf('--muestra') + 1] ?? 'ilustraciones-muestra.png';
  // Hoja de 4 × 4 en miniatura para revisar todo junto.
  const celdas = await Promise.all(
    trabajos.map(async ([, svg]) => sharp(Buffer.from(svg)).resize(320, 240, { fit: 'cover' }).png().toBuffer()),
  );
  const hoja = sharp({ create: { width: 4 * 330, height: Math.ceil(celdas.length / 4) * 250, channels: 3, background: '#000' } });
  await hoja
    .composite(celdas.map((input, i) => ({ input, left: (i % 4) * 330, top: Math.floor(i / 4) * 250 })))
    .png()
    .toFile(destino);
  console.log(`Muestra: ${destino}`);
} else {
  for (const [ruta, svg] of trabajos) {
    writeFileSync(`public${ruta}`, await aJpg(svg));
    console.log(`  ${ruta}`);
  }
  console.log(`${trabajos.length} ilustraciones escritas.`);
}

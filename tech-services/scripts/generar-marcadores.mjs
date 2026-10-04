/**
 * Genera los marcadores de imagen que faltan.
 *
 * Por qué existe: `public/` no tiene ninguna de las 24 imágenes que pide
 * `config/site.ts`. Publicado así, cada tarjeta de servicio y la galería entera
 * salen con el icono de imagen rota — se ve peor que no tener sitio.
 *
 * Estos marcadores usan la paleta del sitio y llevan el nombre del servicio
 * escrito. Se ven INTENCIONALES, no rotos, y dejan claro qué foto va en cada
 * lugar cuando llegue el material real.
 *
 * Uso:  node scripts/generar-marcadores.mjs
 *
 * No sobrescribe: si el archivo ya existe (foto real), lo deja intacto. Así se
 * pueden ir reemplazando de a poco.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import sharp from "sharp";

import { site } from "../config/site.ts";

// Paleta tomada de la nota del proyecto (globals.css).
const FONDO = "#0F172A"; // dark
const ACENTO = "#06B6D4"; // cyan
const TEXTO = "#F8FAFC"; // light

/** Escapa lo que va dentro del SVG, para que un `&` no rompa el XML. */
const escapar = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Parte el texto en líneas que quepan en el ancho dado. */
function enLineas(texto, porLinea) {
  const palabras = String(texto).split(" ");
  const lineas = [];
  let actual = "";
  for (const p of palabras) {
    if ((actual + " " + p).trim().length > porLinea) {
      if (actual) lineas.push(actual.trim());
      actual = p;
    } else {
      actual = (actual + " " + p).trim();
    }
  }
  if (actual) lineas.push(actual.trim());
  return lineas.slice(0, 3);
}

function svg(ancho, alto, titulo) {
  const lineas = enLineas(titulo, Math.floor(ancho / 22));
  const tamano = Math.max(18, Math.round(ancho / 20));
  const alturaLinea = Math.round(tamano * 1.35);
  const inicioY = alto / 2 - ((lineas.length - 1) * alturaLinea) / 2 + tamano / 3;

  const textos = lineas
    .map(
      (l, i) =>
        `<text x="${ancho / 2}" y="${inicioY + i * alturaLinea}" font-family="Segoe UI, Arial, sans-serif" ` +
        `font-size="${tamano}" font-weight="600" fill="${TEXTO}" text-anchor="middle">${escapar(l)}</text>`,
    )
    .join("");

  // Una retícula tenue + una barra de acento: da textura sin competir con el
  // texto, y hace evidente que es un marcador y no una foto.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
  <defs>
    <pattern id="r" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${ACENTO}" stroke-opacity="0.10" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${ancho}" height="${alto}" fill="${FONDO}"/>
  <rect width="${ancho}" height="${alto}" fill="url(#r)"/>
  <rect x="0" y="0" width="${ancho}" height="6" fill="${ACENTO}"/>
  ${textos}
  <text x="${ancho / 2}" y="${alto - 26}" font-family="Segoe UI, Arial, sans-serif"
        font-size="${Math.max(12, Math.round(ancho / 45))}" fill="${ACENTO}"
        text-anchor="middle" letter-spacing="2">FOTO PENDIENTE</text>
</svg>`;
}

/** Junta todo lo que el sitio pide: ruta → título que se dibuja encima. */
function loQueFalta() {
  const lista = new Map();
  // Sin título: el hero lleva el titular encima y un nombre grande en la foto
  // competía con él (se leía "Desamparados Tech" detrás del h1).
  lista.set(site.hero.image, [1600, 1000, ""]);
  lista.set(site.about.image, [1200, 900, "Sobre nosotros"]);
  for (const s of site.services) lista.set(s.image, [800, 600, s.name]);
  for (const g of site.gallery) lista.set(g.src, [g.width, g.height, "Trabajo realizado"]);
  return lista;
}

let hechos = 0;
let saltados = 0;

for (const [ruta, [ancho, alto, titulo]] of loQueFalta()) {
  const destino = "public" + ruta;
  if (existsSync(destino)) {
    saltados++;
    continue;
  }
  mkdirSync(dirname(destino), { recursive: true });
  const png = await sharp(Buffer.from(svg(ancho, alto, titulo)))
    .jpeg({ quality: 82 })
    .toBuffer();
  writeFileSync(destino, png);
  hechos++;
  console.log("  creado  " + ruta);
}

// El logo ya no se genera acá: lo hace scripts/generar-logo.mjs con la
// geometría de lib/logo.ts.

console.log(`\n${hechos} marcadores creados, ${saltados} ya existían (no se tocaron).`);

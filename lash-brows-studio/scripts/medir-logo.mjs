/**
 * Mide los PNG del logo y comprueba que la carga de marca siga cuadrando.
 *
 *   node scripts/medir-logo.mjs      (o: pnpm medir-logo)
 *
 * La pantalla de carga (components/Intro.tsx) pinta el MISMO PNG dos veces y
 * recorta cada copia con una máscara radial: una se queda con el aro y la otra
 * con las letras. Eso sólo funciona porque entre las letras y el aro hay una
 * banda vacía, y porque el corte cae dentro de esa banda.
 *
 * Los porcentajes están escritos en `app/globals.css`. Si alguien vuelve a
 * generar el logo con `crop-logo.mjs` y el monograma queda más grande o el aro
 * más fino, esos números dejan de servir y la carga se ve cortada — sin que
 * nada falle ni avise. Este script es ese aviso: sale con código 1.
 *
 * También dice dónde están los dos huecos del aro, que es de donde sale el
 * `from 7deg` de la máscara cónica: el trazo tiene que arrancar justo ahí.
 *
 * Mide los dos tamaños, porque el teléfono usa el de 288 (`srcSet` 1x/2x) y
 * tiene que tener la misma geometría relativa que el de 144.
 */

import sharp from "sharp";

const ARCHIVOS = ["public/logo.png", "public/logo@2x.png"];

/** Alfa mínima para contar como tinta. Por debajo es antialias. */
const TINTA = 40;

/* Lo que declara app/globals.css, en % del semilado (circle closest-side). */
const CORTE_INTERNO = 85;
const CORTE_EXTERNO = 89;
/* El centro del hueco de arriba, en coordenadas de conic-gradient. */
const ARRANQUE = 7;

/** Devuelve las medidas del logo, todas en % del semilado de la imagen. */
async function medir(archivo) {
  const { data, info } = await sharp(archivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: ancho, height: alto, channels: canales } = info;
  const alfa = (x, y) =>
    x < 0 || y < 0 || x >= ancho || y >= alto ? 0 : data[(y * ancho + x) * canales + 3];

  /* 1. El centro: la caja de la tinta, no el centro del lienzo. */
  let x0 = ancho;
  let y0 = alto;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (alfa(x, y) > TINTA) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const semilado = Math.min(ancho, alto) / 2;
  const paso = semilado / 288; // mismo detalle en los dos tamaños

  /* 2. Un barrido por grado: el radio de la tinta más externa. */
  const radio = [];
  for (let grado = 0; grado < 360; grado++) {
    const a = (grado * Math.PI) / 180;
    let r = 0;
    for (let d = semilado; d >= 0; d -= paso) {
      if (alfa(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d)) > TINTA) {
        r = d;
        break;
      }
    }
    radio.push(r);
  }

  /* 3. Separar el aro de las letras. El aro es lo que llega cerca del borde. */
  const umbralAro = semilado * 0.88;
  let aroFuera = 0;
  let aroDentro = semilado;
  let letrasHasta = 0;
  for (let grado = 0; grado < 360; grado++) {
    const a = (grado * Math.PI) / 180;
    const tinta = (d) =>
      alfa(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d)) > TINTA;
    if (radio[grado] > umbralAro) {
      aroFuera = Math.max(aroFuera, radio[grado]);
      let dentro = radio[grado];
      for (let d = radio[grado] - paso; d >= 0; d -= paso) {
        if (tinta(d)) dentro = d;
        else break;
      }
      aroDentro = Math.min(aroDentro, dentro);
      /* Lo que haya más adentro en este mismo ángulo son letras. */
      for (let d = dentro - paso * 4; d >= 0; d -= paso) {
        if (tinta(d)) {
          letrasHasta = Math.max(letrasHasta, d);
          break;
        }
      }
    } else {
      letrasHasta = Math.max(letrasHasta, radio[grado]);
    }
  }

  /* 4. Los huecos del aro, en coordenadas de conic-gradient (0 = 12 en punto). */
  const aConic = (g) => (g + 90) % 360;
  const huecos = [];
  let inicio = null;
  for (let g = 0; g < 720; g++) {
    const hay = radio[g % 360] > umbralAro;
    if (!hay && inicio === null) inicio = g;
    if (hay && inicio !== null) {
      const abre = g - inicio;
      /* El barrido da dos vueltas para no partir el hueco que cruza los 0°;
         los de la segunda vuelta son los mismos y no se repiten. */
      if (abre > 5 && abre < 180 && inicio < 360) {
        huecos.push({ centro: aConic(Math.round((inicio + g - 1) / 2) % 360), ancho: abre });
      }
      inicio = null;
    }
  }

  const pct = (r) => (r / semilado) * 100;
  return {
    ancho,
    alto,
    centro: `${cx}/${cy}`,
    letras: pct(letrasHasta),
    aroDentro: pct(aroDentro),
    aroFuera: pct(aroFuera),
    huecos,
  };
}

let fallos = 0;

for (const archivo of ARCHIVOS) {
  const m = await medir(archivo);
  console.log(`${archivo} — ${m.ancho}×${m.alto}, centro de la tinta ${m.centro}`);
  console.log(`  letras hasta      ${m.letras.toFixed(1)} %`);
  console.log(`  aro de            ${m.aroDentro.toFixed(1)} % a ${m.aroFuera.toFixed(1)} %`);
  console.log(`  banda vacía       ${m.letras.toFixed(1)} % … ${m.aroDentro.toFixed(1)} %`);
  console.log(`  corte declarado   ${CORTE_INTERNO} % … ${CORTE_EXTERNO} %   (app/globals.css)`);
  for (const h of m.huecos) {
    console.log(`  hueco del aro     centro ${h.centro.toFixed(0)}°, ancho ${h.ancho}°  (0° son las 12)`);
  }

  const problemas = [];
  if (m.letras >= CORTE_INTERNO)
    problemas.push(
      `las letras llegan al ${m.letras.toFixed(1)} % y el corte interno está en ${CORTE_INTERNO} %: la máscara del monograma las recorta`,
    );
  if (m.aroDentro <= CORTE_EXTERNO)
    problemas.push(
      `el aro empieza en el ${m.aroDentro.toFixed(1)} % y el corte externo está en ${CORTE_EXTERNO} %: la máscara del aro se lo come`,
    );
  const arriba = m.huecos.find((h) => Math.abs(((h.centro + 180) % 360) - 180) < 60);
  if (!arriba) problemas.push("el aro ya no tiene un hueco arriba: el trazo no tiene por dónde arrancar");
  else {
    const centrado = arriba.centro > 180 ? arriba.centro - 360 : arriba.centro;
    if (Math.abs(centrado - ARRANQUE) > 6)
      problemas.push(
        `el hueco de arriba está centrado en ${centrado.toFixed(0)}° y la máscara arranca en ${ARRANQUE}°: el trazo empieza torcido`,
      );
  }

  if (problemas.length) {
    fallos += problemas.length;
    console.log("");
    for (const p of problemas) console.error(`  ✗ ${p}`);
  } else {
    console.log("  ✓ la carga de marca cuadra con este logo");
  }
  console.log("");
}

if (fallos) {
  console.error("Arreglo: cambiar los porcentajes del bloque \"Carga de marca\" de");
  console.error("app/globals.css por los que dice este script, y volver a mirar la");
  console.error("pantalla de carga con el navegador.");
  process.exit(1);
}

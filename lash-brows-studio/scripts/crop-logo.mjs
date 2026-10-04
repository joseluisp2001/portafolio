/**
 * Recorta el monograma GR del logo y le saca el fondo rosa.
 *
 *   node scripts/crop-logo.mjs
 *
 * El logo original (Logo.jpeg, 1320×1321) es cuadrado, con el monograma GR
 * arriba, el nombre del estudio debajo, todo sobre un rosa sólido. Para el
 * header y el pie del sitio hace falta sólo el monograma, sin ese rosa que no
 * está en la paleta.
 *
 * El método: quitar el rosa por color, y después BUSCAR el monograma en la
 * imagen resultante en vez de recortarlo por coordenadas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ SE BUSCA EN VEZ DE USAR UNA CAJA FIJA
 *
 * Hasta el 8-9-2026 este script tenía la caja escrita a mano:
 *
 *     const CROP = { left: 462, top: 360, width: 396, height: 396 };
 *
 * Esa caja estaba MAL: se pasaba unos píxeles hacia abajo y se llevaba el borde
 * superior de la línea de texto que va bajo el círculo. En el PNG de 144px eso
 * eran 32 píxeles —el 22% de la imagen— y a los 40px a los que el logo se
 * muestra no se lee como texto: es una mancha sucia pegada al monograma. En el
 * pie, donde el logo va en blanco sobre espresso, se veía clarísimo.
 *
 * Nadie lo iba a notar leyendo el código, porque cuatro números no dicen nada
 * hasta que se miran los píxeles que producen. Ahora el script los mira.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sharp from "sharp";

const SRC = "Imagenes necesarias para el proyecto/Logo.jpeg";

/** Qué tan lejos del rosa de fondo cuenta como "esto es tinta". */
const THRESHOLD = 68;

/**
 * Los dos PNG que se escriben, del mismo recorte.
 *
 * 144 es cómodo para los 40px del encabezado en pantalla retina. El de 288 es
 * para la pantalla de carga (components/Intro.tsx), que pinta el logo hasta a
 * 148px: en un teléfono con DPR 3 eso son 444 píxeles físicos, y con el de 144
 * el aro —que es un trazo fino— se veía suave. Pesa unos 4 KB más y sólo lo
 * piden las pantallas que lo necesitan (`srcSet` 1x/2x).
 */
const SALIDAS = [
  { lado: 144, archivo: "public/logo.png", png: { compressionLevel: 9 } },
  {
    lado: 288,
    archivo: "public/logo@2x.png",
    /* Con paleta pesa 14,7 KB en vez de 41: lo mismo que el de 144, o sea que
       la pantalla de carga se ve nítida en el teléfono sin costar un byte más.
       Medido contra la versión sin paleta, compuesto sobre crema: diferencia
       media de 0,2 sobre 255 y máxima de 16,8 en un píxel suelto. */
    png: { compressionLevel: 9, palette: true },
  },
];

const original = sharp(SRC);
const meta = await original.metadata();
console.log(`Original: ${meta.width}×${meta.height}`);

/* 1. Muestrear el rosa de fondo en una esquina, lejos del monograma. */
const { data: esquina } = await original
  .clone()
  .extract({ left: 20, top: 20, width: 4, height: 4 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const fondo = { r: esquina[0], g: esquina[1], b: esquina[2] };
console.log(`Fondo rosa muestreado: rgb(${fondo.r}, ${fondo.g}, ${fondo.b})`);

/* 2. La imagen entera a RGBA crudo. Entera, no una caja: acá es donde antes se
      decidía a ciegas. */
const { data, info } = await original
  .clone()
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: ancho, height: alto } = info;

/* 3. Todo lo cercano al rosa se vuelve transparente. Distancia euclídea en RGB,
      con una franja de transición para que el borde no quede con sierra. */
let transparentes = 0;
for (let i = 0; i < data.length; i += 4) {
  const dist = Math.sqrt(
    (data[i] - fondo.r) ** 2 +
      (data[i + 1] - fondo.g) ** 2 +
      (data[i + 2] - fondo.b) ** 2,
  );
  if (dist < THRESHOLD) {
    data[i + 3] = 0;
    transparentes++;
  } else if (dist < THRESHOLD + 24) {
    data[i + 3] = Math.round(((dist - THRESHOLD) / 24) * 255);
  }
}
console.log(`Fondo quitado: ${transparentes} de ${ancho * alto} píxeles`);

/* 4. Dónde está el monograma.

      El logo tiene DOS bloques de tinta separados por una franja vacía: el
      círculo con el GR arriba, y el nombre del estudio abajo. Se cuenta cuánta
      tinta hay en cada fila y se toma el PRIMER bloque continuo — o sea el
      círculo, y nada de lo que venga después.

      Ese hueco entre los dos bloques es justo lo que la caja fija se comía. */
const tintaPorFila = new Array(alto).fill(0);
for (let y = 0; y < alto; y++) {
  for (let x = 0; x < ancho; x++) {
    if (data[(y * ancho + x) * 4 + 3] > 24) tintaPorFila[y]++;
  }
}

/*
  "Vacía" quiere decir SIN NADA de tinta, no "con poca".

  El primer intento usó `ancho * 0.005` (7 píxeles) como umbral, y cortó el
  monograma a cinco filas de alto. El motivo: el aro del círculo es fino, así
  que una fila que lo cruza por los costados toca apenas dos segmentos de unos
  pocos píxeles cada uno — menos de 7. O sea que el interior del propio círculo
  se leía como "vacío" y el bloque terminaba ahí.

  Con 0, una fila sólo cuenta como separación si de verdad no tiene un solo
  píxel, que es exactamente lo que pasa en la franja entre el círculo y el
  nombre.
*/
const umbralVacio = 0;
const HUECO = Math.max(8, Math.round(alto * 0.01)); // filas vacías seguidas = separación

const inicio = tintaPorFila.findIndex((n) => n > umbralVacio);
if (inicio < 0) throw new Error("No se encontró tinta: ¿cambió el fondo del logo?");

let fin = alto - 1;
let vacias = 0;
for (let y = inicio; y < alto; y++) {
  if (tintaPorFila[y] <= umbralVacio) {
    if (++vacias >= HUECO) {
      fin = y - vacias;
      break;
    }
  } else {
    vacias = 0;
  }
}

/* Columnas, mirando sólo las filas del círculo. */
let izq = ancho;
let der = 0;
for (let y = inicio; y <= fin; y++) {
  for (let x = 0; x < ancho; x++) {
    if (data[(y * ancho + x) * 4 + 3] > 24) {
      if (x < izq) izq = x;
      if (x > der) der = x;
    }
  }
}

console.log(`Monograma encontrado: filas ${inicio}–${fin}, columnas ${izq}–${der}`);
if (fin < alto - 1) {
  console.log(`  (debajo hay ${alto - 1 - fin}px más de tinta: el nombre, que NO entra)`);
}

/* 5. Cuadrado centrado en el monograma. Cuadrado porque el sitio lo pinta en
      una caja de 40×40: si no lo es, `object-contain` lo deja más chico de lo
      que podría y descentrado respecto al texto que lleva al lado. */
const centroX = Math.round((izq + der) / 2);
const centroY = Math.round((inicio + fin) / 2);
const lado = Math.max(der - izq + 1, fin - inicio + 1);
const conAire = Math.min(Math.round(lado * 1.08), alto, ancho);

const left = Math.max(0, Math.min(ancho - conAire, centroX - Math.round(conAire / 2)));
const top = Math.max(0, Math.min(alto - conAire, centroY - Math.round(conAire / 2)));
console.log(`Recorte: ${conAire}×${conAire} desde (${left}, ${top})`);

for (const { lado, archivo, png } of SALIDAS) {
  const { size } = await sharp(data, { raw: { width: ancho, height: alto, channels: 4 } })
    .extract({ left, top, width: conAire, height: conAire })
    .resize(lado, lado)
    .png(png)
    .toFile(archivo);
  const peso = (size / 1024).toFixed(1);
  console.log(`${archivo} listo: ${lado}×${lado}, ${peso} KB, fondo transparente.`);
}

console.log("");
console.log("Ahora corré `node scripts/medir-logo.mjs`: comprueba que las máscaras de la");
console.log("pantalla de carga sigan cuadrando con el aro y las letras nuevas.");

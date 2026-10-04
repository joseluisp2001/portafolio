/**
 * Coloca las fotos reales del estudio en su lugar y regenera los blur.
 *
 *   node scripts/place-real-images.mjs
 *
 * Las fotos vienen de "Imagenes necesarias para el proyecto/", son verticales
 * de celular y traen la marca de agua de Génesis Roca (que se conserva a
 * propósito: es su firma). Se recortan a la relación de cada hueco con
 * `position: attention`, que centra el recorte en la zona con más detalle.
 *
 * DESDE EL 8-9-2026 NO QUEDA UNA SOLA IMAGEN QUE NO SEA DEL ESTUDIO.
 *
 * Hasta ese día faltaban tres:
 *
 * - `servicios/laminado-cejas.jpg` y `servicios/henna.jpg` eran relleno de
 *   Pexels. No sólo no eran de Génesis: la de henna mostraba una depilación
 *   con hilo, que es otro servicio, en un estudio blanco que no es el suyo.
 * - `sobre-el-estudio.jpg` era una imagen GENERADA POR IA, y se notaba: la
 *   anatomía no cerraba entre el ojo, la ceja y el pincel.
 *
 * El dueño mandó las dos fotos que faltaban (laminado.jpeg, henna.jpeg) y
 * eligió para "Sobre el estudio" la del laminado con henna.
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import sharp from "sharp";

const SRC = "Imagenes necesarias para el proyecto";
const PUBLIC = "public";

/**
 * [origen, destino, ancho, alto, posición?]
 *
 * La posición es opcional y por omisión es `attention`, que deja que sharp
 * elija la zona con más detalle. Sólo se pasa a mano cuando dos huecos comparten
 * la misma foto y hace falta que no salgan idénticos.
 */
const MAP = [
  // Hero: la macro más impactante.
  [`${SRC}/Fibras tecnológicas en U.jpeg`, "hero.jpg", 1200, 1500],

  /*
    Sobre el estudio. Comparte la foto con la tarjeta de "Laminado + Henna",
    así que va recortada DESDE ARRIBA (`north`) en vez de por `attention`.

    No es un capricho: con el mismo recorte los dos archivos saldrían idénticos
    y la misma imagen aparecería dos veces en la misma página. Desde arriba
    entra además la cabina —la silla, los insumos, la diadema—, que es
    justamente de lo que habla esta sección.

    Sale 900×1125 y no 1200×1500 porque el original mide 900 de ancho. Subirla
    a 1200 sería inventar píxeles.
  */
  [`${SRC}/Laminado de cejas con henna.jpeg`, "sobre-el-estudio.jpg", 900, 1125, "north"],

  // Servicios con foto real del trabajo correspondiente.
  [`${SRC}/Volumen medio.jpeg`, "servicios/volumen-medio.jpg", 900, 1125],
  [`${SRC}/Mega volumen.jpeg`, "servicios/mega-volumen.jpg", 900, 1125],
  [`${SRC}/Efecto rímel.jpeg`, "servicios/rimel.jpg", 900, 1125],
  [`${SRC}/Efecto Wispy.jpeg`, "servicios/wispy.jpg", 900, 1125],
  [`${SRC}/Fibras tecnológicas 4D.jpeg`, "servicios/volumen-egipcio.jpg", 900, 1125],
  [`${SRC}/Fibras tecnológicas 5D.jpeg`, "servicios/volumen-ingles.jpg", 900, 1125],
  [`${SRC}/Fibras tecnológicas 6D.jpeg`, "servicios/volumen-griego.jpg", 900, 1125],
  [`${SRC}/Laminado de cejas con henna.jpeg`, "servicios/laminado-henna.jpg", 900, 1125],

  // Las dos que faltaban, mandadas por el dueño el 8-9-2026. Antes: Pexels.
  [`${SRC}/laminado.jpeg`, "servicios/laminado-cejas.jpg", 900, 1125],
  [`${SRC}/henna.jpeg`, "servicios/henna.jpg", 900, 1125],

  // Galería: las relaciones alternadas vienen del config (4:5, 3:4, 1:1).
  [`${SRC}/Powder Brows.jpeg`, "galeria/01.jpg", 800, 1000],
  [`${SRC}/Fibras tecnológicas en U.jpeg`, "galeria/02.jpg", 800, 1067],
  [`${SRC}/Mega volumen tecnológico.jpeg`, "galeria/03.jpg", 800, 800],
  [`${SRC}/Efecto Foxy.jpeg`, "galeria/04.jpg", 800, 1000],
  [`${SRC}/Fibras tecnológicas 6D.jpeg`, "galeria/05.jpg", 800, 1067],
  [`${SRC}/Volumen medio.jpeg`, "galeria/06.jpg", 800, 800],
  [`${SRC}/Efecto rímel.jpeg`, "galeria/07.jpg", 800, 1000],
  [`${SRC}/Fibras tecnológicas 5D.jpeg`, "galeria/08.jpg", 800, 1067],
];

for (const [origen, destino, width, height, position = "attention"] of MAP) {
  const salida = join(PUBLIC, destino);
  mkdirSync(dirname(salida), { recursive: true });
  await sharp(origen)
    .rotate() // respeta la orientación EXIF del celular
    .resize(width, height, { fit: "cover", position })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(salida);
  console.log(`${destino.padEnd(30)} <- ${origen.split("/").pop()}`);
}

console.log("\nListo. Regenerá los blur con: node scripts/fetch-images.mjs --blur");

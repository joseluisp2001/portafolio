/**
 * Descarga las fotos de relleno desde Pexels y genera los placeholders `blur`.
 *
 *   node scripts/fetch-images.mjs
 *
 * Se corre UNA vez, a mano. El resultado (los .jpg de public/ y el archivo
 * lib/blur-data.ts) queda versionado, así que el build no depende de la red ni
 * de que Pexels siga sirviendo estos IDs.
 *
 * Cuando el estudio mande sus fotos reales: reemplazá los archivos de public/
 * respetando el nombre y la relación de aspecto (ver docs/fotos.md) y volvé
 * a correr SOLO la parte de blur con `node scripts/fetch-images.mjs --blur`.
 *
 * Licencia: Pexels License — uso comercial permitido, sin atribución
 * obligatoria. Son un relleno digno, no la identidad del negocio.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import sharp from "sharp";

const PUBLIC = "public";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** [ruta destino, id de Pexels, ancho, alto] */
const IMAGES = [
  // Hero y "sobre el estudio": las dos grandes, 4:5.
  ["hero.jpg", 16017832, 1200, 1500],
  ["sobre-el-estudio.jpg", 35341712, 1200, 1500],

  // Servicios: 4:5, en el mismo orden que config/site.ts.
  ["servicios/volumen-medio.jpg", 33576089, 900, 1125],
  ["servicios/mega-volumen.jpg", 35013077, 900, 1125],
  ["servicios/rimel.jpg", 32039798, 900, 1125],
  ["servicios/wispy.jpg", 2440264, 900, 1125],
  ["servicios/volumen-egipcio.jpg", 14730864, 900, 1125],
  ["servicios/volumen-ingles.jpg", 33723106, 900, 1125],
  ["servicios/volumen-griego.jpg", 33637609, 900, 1125],
  ["servicios/laminado-cejas.jpg", 30809949, 900, 1125],
  ["servicios/henna.jpg", 29588096, 900, 1125],
  ["servicios/laminado-henna.jpg", 22668317, 900, 1125],

  // Galería: relaciones alternadas (4:5, 3:4, 1:1) para que el masonry
  // tenga alturas distintas y no parezca una grilla rígida.
  ["galeria/01.jpg", 33637609, 800, 1000],
  ["galeria/02.jpg", 18809795, 800, 1067],
  ["galeria/03.jpg", 3373720, 800, 800],
  ["galeria/04.jpg", 14730864, 800, 1000],
  ["galeria/05.jpg", 16120497, 800, 1067],
  ["galeria/06.jpg", 16571735, 800, 800],
  ["galeria/07.jpg", 33723106, 800, 1000],
  ["galeria/08.jpg", 22668317, 800, 1067],
];

function pexelsUrl(id, width, height) {
  return (
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg` +
    `?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`
  );
}

const blurOnly = process.argv.includes("--blur");

if (!blurOnly) {
  for (const [target, id, width, height] of IMAGES) {
    const path = join(PUBLIC, target);
    mkdirSync(dirname(path), { recursive: true });

    const response = await fetch(pexelsUrl(id, width, height), {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) {
      console.error(`FALLO ${target}: HTTP ${response.status}`);
      process.exitCode = 1;
      continue;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    // Se recomprime para bajar el peso sin que se note, y para garantizar que
    // las dimensiones sean exactamente las declaradas (cero CLS).
    await sharp(bytes)
      .resize(width, height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toFile(path);

    console.log(`${target}  <- pexels ${id}  ${width}x${height}`);
  }
}

/* -------------------------------------------------------------------------- */
/*  Placeholders blur                                                          */
/* -------------------------------------------------------------------------- */

/**
 * next/image sólo genera el blur solo cuando la imagen se importa como módulo.
 * Acá las rutas viven en config/site.ts como strings, así que el blurDataURL
 * se precalcula: una miniatura de 12px de ancho en base64. Pesa ~400 bytes y
 * evita el salto de "cuadro gris" mientras carga la foto real.
 */
const entries = [];
for (const [target] of IMAGES) {
  const path = join(PUBLIC, target);
  if (!existsSync(path)) {
    console.error(`sin archivo para blur: ${target}`);
    continue;
  }
  const buffer = await sharp(path)
    .resize(12, null, { fit: "inside" })
    .jpeg({ quality: 45 })
    .toBuffer();
  entries.push([`/${target}`, `data:image/jpeg;base64,${buffer.toString("base64")}`]);
}

const file = `/**
 * Placeholders \`blur\` precalculados. GENERADO — no editar a mano.
 * Se regenera con: node scripts/fetch-images.mjs --blur
 *
 * Existe porque las rutas de las imágenes viven en config/site.ts como strings
 * y next/image sólo calcula el blur solo cuando la imagen se importa como
 * módulo. Cada valor es una miniatura de 12px de ancho en base64.
 */

export const blurData: Record<string, string> = {
${entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")}
};

/**
 * Props de blur para una ruta de \`public/\`. Si no hay placeholder para esa
 * ruta (por ejemplo una foto nueva que el dueño agregó sin regenerar), no
 * devuelve nada y next/image simplemente no muestra blur. Nunca rompe.
 */
export function blurProps(src: string):
  | { placeholder: "blur"; blurDataURL: string }
  | Record<string, never> {
  const blurDataURL = blurData[src];
  return blurDataURL ? { placeholder: "blur", blurDataURL } : {};
}
`;

writeFileSync("lib/blur-data.ts", file);
console.log(`\nlib/blur-data.ts  <- ${entries.length} placeholders`);

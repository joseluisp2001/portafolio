/**
 * La URL pública del sitio, en un solo lugar.
 *
 * La necesitan el canonical, el Open Graph y el JSON-LD. Si hubiera dos copias
 * y una se desincronizara, Google indexaría dos dominios distintos.
 *
 * El valor que había acá era `https://Desamparados Tech.com` — el nombre de la
 * marca metido en una URL, con espacio y mayúsculas. `new URL()` lo rechazaba y
 * **el build entero fallaba** al generar la página 404.
 */

/** El dominio real. Se usa cuando no hay variable de entorno. */
const RESPALDO = "https://desamparadostech.com";

function resolver(): URL {
  try {
    // Un `new URL()` que lanza en tiempo de build tumba el deploy, así que una
    // variable mal escrita degrada al respaldo en vez de romper.
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || RESPALDO);
  } catch {
    return new URL(RESPALDO);
  }
}

/** La URL como objeto, para `metadataBase`. */
export const siteUrlObjeto = resolver();

/** La URL como texto, sin barra final. */
export function siteUrl(): string {
  return siteUrlObjeto.origin;
}

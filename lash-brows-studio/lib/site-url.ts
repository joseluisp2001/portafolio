/**
 * La URL pública del sitio, en un solo lugar.
 *
 * La necesitan el canonical y el Open Graph del layout, el JSON-LD, el sitemap
 * y robots.txt. Antes de existir este archivo la lógica estaba duplicada en el
 * layout, y bastaba con que una copia se desincronizara para que Google
 * indexara dos dominios distintos.
 *
 * No vive en `config/site.ts` porque cambia por entorno (desarrollo local vs.
 * producción), y ese archivo es para datos del negocio, no de despliegue.
 */

/** Dominio real del estudio (VPS + Let's Encrypt). */
/*
  12-9-2026: el sitio se movio a lash.desamparadostech.com. desamparadostech.com
  ahora es Tech Services, y con el respaldo viejo el canonical, el Open Graph y
  el sitemap de este sitio mandaban a Google y a WhatsApp a otro negocio.
*/
const FALLBACK = "https://lash.desamparadostech.com";

function resolve(): URL {
  try {
    // Un `new URL()` que lanza en tiempo de build tumba el deploy entero, así
    // que una variable mal escrita degrada al respaldo en vez de romper.
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK);
  } catch {
    return new URL(FALLBACK);
  }
}

export const siteUrl = resolve();

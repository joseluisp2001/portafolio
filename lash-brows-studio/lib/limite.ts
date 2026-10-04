import { createHash, randomBytes } from "node:crypto";

/**
 * Límite de peticiones por IP, compartido por los endpoints públicos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTÁ ACÁ Y NO COPIADO EN CADA RUTA
 *
 * Este código nació dentro de `app/api/resenas/route.ts`. Al necesitar lo mismo
 * en `/api/reservar` habría sido la segunda copia — y la tercera ya existe, mal,
 * en tech-services: la [[Auditoria del stack]] encontró que ese limitador NUNCA
 * libera memoria, así que cada IP que pasa se queda ahí para siempre.
 *
 * Dos copias del mismo limitador es exactamente el patrón que más caro sale en
 * este stack. Acá se podía evitar antes de que existiera la segunda.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Sal del servidor para el hash de las IP.
 *
 * SIN SAL, EL HASH NO PROTEGE NADA: sólo hay unos 4 mil millones de IPv4, así
 * que recorrerlas todas y comparar sha256 es cuestión de segundos.
 *
 * Si la variable falta se inventa una al azar al arrancar. No cuesta nada —el
 * límite vive en memoria y ya se reiniciaba con el proceso— y hace que olvidarse
 * de la variable sea una molestia y no un agujero.
 */
const SAL = process.env.RESENAS_SAL || randomBytes(32).toString("hex");

if (!process.env.RESENAS_SAL) {
  console.warn(
    "[limite] RESENAS_SAL no está definida: se usa una sal aleatoria de este " +
      "proceso. Las huellas de IP son seguras, pero cambian en cada reinicio.",
  );
}

/**
 * Huella de una IP: sirve para CONTAR, no para identificar.
 *
 * Para limitar hace falta distinguir una IP de otra, no saber cuál es.
 */
export function huellaDe(ip: string): string {
  return createHash("sha256").update(SAL + ip).digest("hex").slice(0, 16);
}

/** La IP de quien pide, leyendo la cabecera que agrega Traefik. */
export function ipDe(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  // Traefik pone la del cliente al principio de la lista.
  return reenviada?.split(",")[0]?.trim() || "desconocida";
}

interface OpcionesLimite {
  /** Ventana en milisegundos. */
  ventanaMs: number;
  /** Cuántas peticiones se permiten dentro de esa ventana. */
  tope: number;
}

/**
 * Crea un limitador con su propio contador.
 *
 * CADA ENDPOINT LLAMA A ESTO UNA VEZ y se queda con su propio `Map`. No
 * comparten cupo a propósito: dejar una reseña y apartar una cita son cosas
 * distintas, y gastar el cupo de una no tiene por qué bloquear la otra.
 *
 * En memoria: si el contenedor se reinicia se pierde, y está bien — no es
 * contabilidad, es frenar el envío repetido.
 */
export function crearLimite({ ventanaMs, tope }: OpcionesLimite) {
  const vistas = new Map<string, number[]>();

  return function pasa(huella: string): boolean {
    const ahora = Date.now();

    /*
      LA PURGA, que es lo que le falta al de tech-services.

      Se recorre todo el mapa y se saca lo que ya salió de la ventana. Sin esto,
      cada IP que pasa una vez se queda para siempre y en un proceso que corre
      semanas eso es una fuga de memoria sin techo.
    */
    for (const [clave, marcas] of vistas) {
      const vigentes = marcas.filter((t) => ahora - t < ventanaMs);
      if (vigentes.length === 0) vistas.delete(clave);
      else vistas.set(clave, vigentes);
    }

    const mias = vistas.get(huella) ?? [];
    if (mias.length >= tope) return false;

    vistas.set(huella, [...mias, ahora]);
    return true;
  };
}

import { promises as fs } from "node:fs";
import path from "node:path";

import { horarioPorOmision, normalizar, type DiaHorario } from "@/lib/horario";

/**
 * Leer y guardar el horario en disco. SOLO SERVIDOR.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTÁ SEPARADO DE `lib/horario.ts`
 *
 * La primera versión tenía todo junto. Compilaba limpio —`tsc` y `eslint` sin
 * una queja— y el sitio no levantaba:
 *
 *     the chunking context does not support external modules (request: node:fs)
 *
 * `LocationHours`, `TodayHoursCard` y `BookingForm` corren en el NAVEGADOR y
 * necesitan tipos y ayudantes del horario (`agrupar`, `enDoceHoras`). Al
 * importarlos de un archivo que arriba hacía `import fs from "node:fs"`,
 * Turbopack tenía que meter `node:fs` en el paquete del navegador, donde no
 * existe.
 *
 * Así que ahora son dos archivos, y la división no es de estilo:
 *
 *   `lib/horario.ts`        tipos y funciones puras — lo puede importar cualquiera
 *   `lib/horario-disco.ts`  toca el disco — sólo servidor
 *
 * Sólo lo importan `app/page.tsx`, `app/manager/page.tsx` y los dos endpoints.
 * Si alguna vez un componente con "use client" lo importa, el sitio deja de
 * levantar con ese mismo error. No lo agarra el compilador: hay que correrlo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ES UN SOLO ARCHIVO, a diferencia de las reseñas, que van una por archivo.
 * Allá el problema era que dos clientas escriben al mismo tiempo y una pisa a la
 * otra. Acá sólo escribe Génesis, desde un panel con clave, y siempre el horario
 * completo.
 */

const RAIZ = path.join(process.cwd(), "uploads");
const ARCHIVO = path.join(RAIZ, "horario.json");

export async function leerHorario(): Promise<DiaHorario[]> {
  try {
    const crudo = await fs.readFile(ARCHIVO, "utf8");
    return normalizar(JSON.parse(crudo));
  } catch {
    /*
      No existe todavía (nadie tocó el panel), o está ilegible. Las dos cosas se
      resuelven igual: el horario que el sitio siempre tuvo.

      Un horario roto NUNCA puede dejar la portada sin abrir. `app/page.tsx`
      llama a esto en cada visita, así que una excepción acá es un 500 en la
      página principal — el mismo modo de falla que el permiso de `uploads/` en
      el Dockerfile.
    */
    return horarioPorOmision();
  }
}

export async function guardarHorario(dias: DiaHorario[]): Promise<void> {
  await fs.mkdir(RAIZ, { recursive: true });

  /* Se normaliza ANTES de escribir, no sólo al leer: así lo que queda en disco
     ya es coherente y no hay que confiar en que quien lo lea lo arregle. */
  const normalizado = normalizar(dias);

  /*
    Escritura atómica: primero a un temporal, después `rename`.

    `rename` sobre el mismo sistema de archivos es atómico, así que un corte de
    luz a mitad de la escritura deja el horario viejo entero en vez de un JSON
    partido. Importa más que en las reseñas: acá es UN archivo, y si se parte,
    se pierde el horario completo.
  */
  const temporal = `${ARCHIVO}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(normalizado, null, 2), "utf8");
  await fs.rename(temporal, ARCHIVO);
}

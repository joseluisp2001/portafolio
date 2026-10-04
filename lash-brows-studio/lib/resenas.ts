import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Reseñas de clientas: leer, guardar, aprobar y borrar.
 *
 * UN ARCHIVO JSON POR RESEÑA, no un índice único. Con un solo archivo, dos
 * envíos al mismo tiempo lo leen, cada uno le agrega el suyo, y la segunda
 * escritura pisa a la primera: se pierde una reseña y nadie se entera.
 *
 * No se mete MySQL en este proyecto. Hoy lash no tiene base de datos, y
 * agregarle una por seis campos sería sumar una pieza más que se cae, que hay
 * que respaldar y que hay que actualizar aparte.
 *
 * La carpeta se monta como volumen en el despliegue: si no, cada `docker run`
 * borra las reseñas, igual que pasaba con las fotos de shein.
 */

export type Resena = {
  id: string;
  nombre: string;
  estrellas: number;
  servicio: string;
  comentario: string;
  estado: "pendiente" | "aprobada";
  /** Solo la fecha. La hora exacta no le sirve a nadie acá. */
  recibida: string;
  /**
   * Hash con sal de la IP.
   *
   * Para limitar por IP hace falta distinguir una de otra, NO saber cuál es.
   * Guardando el hash se puede contar y no se puede identificar a nadie — que
   * es justo lo que se necesita.
   */
  huella: string;
};

const RAIZ = path.join(process.cwd(), "uploads", "resenas");

/*
  LA HUELLA DE LA IP SE MUDÓ a `lib/limite.ts` el 9-9-2026.

  Vivía acá junto con la sal, y al necesitar el mismo límite en /api/reservar
  habría hecho falta importarla desde un archivo que se llama "resenas" para
  apartar una cita — o copiarla, que es peor. El campo `huella` de abajo sigue
  guardándose igual; lo único que cambió es quién lo calcula.
*/

async function asegurarCarpeta(): Promise<void> {
  await fs.mkdir(RAIZ, { recursive: true });
}

function rutaSegura(id: string): string | null {
  // Solo lo que este módulo genera: hexadecimal. Cualquier otra cosa se rechaza
  // antes de tocar el disco.
  if (!/^[0-9a-f]{8,32}$/.test(id)) return null;
  return path.join(RAIZ, `${id}.json`);
}

export async function guardar(resena: Resena): Promise<void> {
  await asegurarCarpeta();
  const destino = rutaSegura(resena.id);
  if (!destino) throw new Error("id inválido");
  await fs.writeFile(destino, JSON.stringify(resena, null, 2), "utf8");
}

/**
 * @param incluirPendientes solo el panel lo pone en `true`. La parte pública
 * del sitio JAMÁS lo hace: una reseña sin aprobar no se muestra ni siquiera a
 * quien la escribió.
 */
export async function listar(incluirPendientes = false): Promise<Resena[]> {
  await asegurarCarpeta();

  const archivos = (await fs.readdir(RAIZ)).filter((f) => f.endsWith(".json"));

  const leidas = await Promise.all(
    archivos.map(async (f) => {
      try {
        return JSON.parse(await fs.readFile(path.join(RAIZ, f), "utf8")) as Resena;
      } catch {
        // Un JSON roto no puede tumbar la sección entera del sitio.
        console.error("[resenas] no se pudo leer", f);
        return null;
      }
    }),
  );

  return leidas
    .filter((r): r is Resena => r !== null)
    .filter((r) => incluirPendientes || r.estado === "aprobada")
    .sort((a, b) => b.recibida.localeCompare(a.recibida));
}

export async function aprobar(id: string): Promise<boolean> {
  const destino = rutaSegura(id);
  if (!destino) return false;

  try {
    const resena = JSON.parse(await fs.readFile(destino, "utf8")) as Resena;
    await fs.writeFile(destino, JSON.stringify({ ...resena, estado: "aprobada" }, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function borrar(id: string): Promise<boolean> {
  const destino = rutaSegura(id);
  if (!destino) return false;
  try {
    await fs.unlink(destino);
    return true;
  } catch {
    return false;
  }
}

/** Promedio y cantidad, contando SOLO las aprobadas. */
export async function resumen(): Promise<{ promedio: number; cantidad: number }> {
  const aprobadas = await listar();
  if (aprobadas.length === 0) return { promedio: 0, cantidad: 0 };

  const suma = aprobadas.reduce((t, r) => t + r.estrellas, 0);
  return {
    // Una cifra decimal: "4,8" dice algo, "4,83333" no.
    promedio: Math.round((suma / aprobadas.length) * 10) / 10,
    cantidad: aprobadas.length,
  };
}

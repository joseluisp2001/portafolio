"use server";

/**
 * Las operaciones del panel, ejecutadas EN EL SERVIDOR.
 *
 * Por qué acciones de servidor y no `fetch` desde el navegador: el panel está
 * detrás de autenticación básica, y las peticiones que hace el JavaScript de la
 * página no siempre arrastran esa credencial — el panel quedaba mostrando "no
 * se pudo cargar" aunque la sesión fuera válida. Corriendo en el servidor el
 * problema desaparece: la página ya pasó por el middleware, y la URL del
 * webhook de n8n nunca llega al navegador.
 */

import { revalidatePath } from "next/cache";

export interface CitaPendiente {
  id: string;
  servicio: string;
  cliente: string;
  telefono: string;
  nota: string;
  inicioISO: string;
  cuando: string;
}

export interface Resultado {
  ok: boolean;
  mensaje: string;
}

const TIMEOUT_LECTURA_MS = 8_000;
const TIMEOUT_ACCION_MS = 15_000;

async function llamarN8n(cuerpo: unknown, timeoutMs: number): Promise<Response> {
  const webhook = process.env.N8N_APROBAR_URL ?? "";
  if (!webhook) throw new Error("Falta N8N_APROBAR_URL");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Las citas que esperan aprobación. Nunca lanza: el panel debe abrir siempre. */
export async function obtenerPendientes(): Promise<{
  citas: CitaPendiente[];
  error: string;
}> {
  try {
    const res = await llamarN8n({ comando: "json" }, TIMEOUT_LECTURA_MS);
    if (!res.ok) return { citas: [], error: "El calendario respondió " + res.status + "." };
    const data = (await res.json()) as { citas?: CitaPendiente[] };
    return { citas: Array.isArray(data.citas) ? data.citas : [], error: "" };
  } catch {
    return { citas: [], error: "No se pudo consultar el calendario. Probá de nuevo." };
  }
}

/**
 * Aprueba o rechaza. Se identifica por `eventId`, nunca por posición: entre que
 * el panel carga y se hace clic, la lista puede haber cambiado.
 */
export async function decidirCita(
  eventId: string,
  accion: "aprobar" | "rechazar",
): Promise<Resultado> {
  if (!eventId || (accion !== "aprobar" && accion !== "rechazar")) {
    return { ok: false, mensaje: "Datos inválidos." };
  }

  try {
    const res = await llamarN8n({ comando: accion, eventId }, TIMEOUT_ACCION_MS);
    if (!res.ok) {
      return { ok: false, mensaje: "El calendario respondió " + res.status + "." };
    }
    revalidatePath("/manager");
    return {
      ok: true,
      mensaje: accion === "aprobar" ? "Cita aprobada." : "Cita rechazada.",
    };
  } catch {
    /*
      Un timeout NO significa que no se hizo: n8n pudo haber tocado el
      calendario y estar tardando en responder. El mensaje pide revisar en vez
      de decir "falló", para que no se apruebe dos veces la misma cita.
    */
    revalidatePath("/manager");
    return {
      ok: false,
      mensaje: "Sin respuesta a tiempo. Actualizá la lista para ver si quedó hecho.",
    };
  }
}

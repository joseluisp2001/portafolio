/**
 * GET /api/availability?date=YYYY-MM-DD&serviceSlug=volumen-ruso
 *
 * Devuelve los espacios de inicio de un día. El sitio NUNCA habla con Google
 * Calendar: le pregunta a n8n, y n8n consulta FreeBusy. Ninguna credencial de
 * Google toca este proyecto.
 *
 * Contrato de respuesta:
 *   { "date": "2026-09-12",
 *     "slots": [ { "start": "09:00", "available": true }, ... ],
 *     "degraded": false,
 *     "source": "calendar" | "local" }
 *
 * REGLA INNEGOCIABLE: este endpoint no devuelve 500 nunca. Si n8n falla, tarda
 * o no está configurado, responde 200 con `degraded: true` y el formulario
 * sigue siendo usable. La disponibilidad es una ayuda, no un requisito: quien
 * confirma la cita de verdad es la conversación de WhatsApp.
 */

import { NextResponse } from "next/server";

import { getService, site } from "@/config/site";
import { leerHorario } from "@/lib/horario-disco";
import { generateSlots, maxBookableDate, type Slot } from "@/lib/hours";

/** Cuánto se espera a n8n antes de rendirse. */
const UPSTREAM_TIMEOUT_MS = 3_000;

/** Duración por defecto si el slug no existe: el servicio más largo. */
const FALLBACK_DURATION_MINUTES = Math.max(
  ...site.services.map((service) => service.durationMinutes),
);

interface AvailabilityResponse {
  date: string;
  slots: Slot[];
  degraded: boolean;
  source: "calendar" | "local";
}

function respond(body: AvailabilityResponse) {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      // Sólo se cachea la respuesta buena. Cachear una degradada dejaría el
      // bloque escondido 60s más de lo necesario tras un hipo de red.
      "Cache-Control": body.degraded
        ? "no-store"
        : "s-maxage=60, stale-while-revalidate=300",
    },
  });
}

/** Acepta tanto `{slots:[...]}` como un array pelado, y descarta la basura. */
function parseUpstreamSlots(payload: unknown): Slot[] | null {
  const raw = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null && "slots" in payload
      ? (payload as { slots: unknown }).slots
      : null;

  if (!Array.isArray(raw)) return null;

  const slots: Slot[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const { start, available } = entry as { start?: unknown; available?: unknown };
    if (typeof start !== "string" || !/^\d{2}:\d{2}$/.test(start)) continue;
    slots.push({ start, available: available !== false });
  }
  return slots;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const serviceSlug = searchParams.get("serviceSlug") ?? "";

  // Fecha inválida o fuera de la ventana reservable: no se molesta a n8n.
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    date > maxBookableDate()
  ) {
    return respond({ date, slots: [], degraded: true, source: "local" });
  }

  const service = getService(serviceSlug);
  const durationMinutes = service?.durationMinutes ?? FALLBACK_DURATION_MINUTES;

  // Los espacios que el horario del estudio permite en teoría. Es la base que
  // se le manda a n8n y también el resultado cuando no hay backend.
  /* El horario sale del disco, no del config: Genesis lo edita en /manager y
     tiene que valer desde el siguiente pedido, sin desplegar. */
  const horario = await leerHorario();
  const localSlots = generateSlots(date, durationMinutes, new Date(), horario);

  const webhook = process.env.N8N_AVAILABILITY_URL ?? "";

  /**
   * DECISIÓN: sin webhook configurado se devuelven los espacios locales, todos
   * disponibles, para poder ver y probar la UI sin backend — pero marcados
   * `degraded: true`, porque no son datos reales del calendario. Así se cumplen
   * a la vez las dos reglas del brief: 200 con `degraded: true` cuando la
   * variable falta, y una UI que se puede maquetar sin n8n levantado.
   */
  if (!webhook) {
    return respond({
      date,
      slots: localSlots,
      degraded: true,
      source: "local",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = new URL(webhook);
    upstream.searchParams.set("date", date);
    upstream.searchParams.set("serviceSlug", serviceSlug);
    upstream.searchParams.set("durationMinutes", String(durationMinutes));
    upstream.searchParams.set("bufferMinutes", String(site.calendar.bufferMinutes));
    upstream.searchParams.set("timezone", site.calendar.timezone);

    /**
     * Se mandan también las horas candidatas, ya calculadas desde el horario
     * que Génesis puso en el panel.
     * Así n8n no tiene que conocer el horario del estudio: sólo tacha las que
     * choquen con un evento del calendario. Sin esto habría dos copias del
     * horario —una acá y otra dentro de un nodo Code— y tarde o temprano se
     * desincronizan.
     */
    upstream.searchParams.set(
      "candidates",
      localSlots.map((slot) => slot.start).join(","),
    );

    const response = await fetch(upstream, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return respond({ date, slots: [], degraded: true, source: "local" });
    }

    const slots = parseUpstreamSlots(await response.json());
    if (!slots) {
      return respond({ date, slots: [], degraded: true, source: "local" });
    }

    return respond({ date, slots, degraded: false, source: "calendar" });
  } catch {
    // Timeout, DNS caído, JSON roto: da igual. El formulario sigue vivo.
    return respond({ date, slots: [], degraded: true, source: "local" });
  } finally {
    clearTimeout(timeout);
  }
}

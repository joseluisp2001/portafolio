/**
 * POST /api/reservar
 *
 * Aparta la cita en el calendario del estudio como **pendiente de aprobación**.
 * n8n vuelve a verificar que la hora siga libre antes de crear el evento, así
 * que si dos clientas eligen la misma hora, la segunda recibe `ocupado` en vez
 * de duplicarse la cita.
 *
 * El navegador nunca habla con n8n: la URL del webhook vive sólo acá.
 *
 * Respuestas:
 *   { ok: true }                      → cita apartada
 *   { ok: false, motivo: "ocupado" }  → alguien la tomó primero
 *   { ok: false, motivo: "error" }    → no se pudo; el formulario sigue a WhatsApp igual
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTA ERA LA RUTA QUE MENOS VALIDABA DE TODO EL PROYECTO, Y ES LA QUE ESCRIBE
 * EN EL CALENDARIO REAL DE GÉNESIS.
 *
 * Hasta el 9-9-2026 aceptaba `name`, `phone` y `notes` de cualquier largo, sin
 * validar el teléfono y sin límite por IP. `/api/lead`, que no toca nada y sólo
 * registra el interés, tenía zod completo. Estaban al revés.
 *
 * Lo concreto que permitía:
 *
 *  - Un `notes` de varios megas, que va derecho a la descripción de un evento
 *    de Google Calendar. Y un `name` sin tope, que va al TÍTULO del evento.
 *  - Un teléfono cualquiera —o ninguno—, cuando el formulario pide ocho dígitos.
 *  - Un guion suelto: nada impedía mandar cientos de POST y llenarle la agenda
 *    de citas pendientes. No hace falta ser nadie para hacerlo, sólo un rato.
 *  - Una hora que el estudio no ofrece: el regex aceptaba `99:99`, y nada
 *    comprobaba que la fecha estuviera abierta ni dentro de la ventana
 *    reservable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { getService, site } from "@/config/site";
import { leerHorario } from "@/lib/horario-disco";
import { generateSlots, maxBookableDate, minBookableDate } from "@/lib/hours";
import { crearLimite, huellaDe, ipDe } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 12_000;

/*
  Cinco reservas por hora desde la misma IP.

  Más alto que el de reseñas (tres): una clienta puede legítimamente reservar
  para ella y para una amiga, o equivocarse y volver a intentar. Cinco deja
  lugar a eso y sigue cortando el guion que quiere llenar la agenda.
*/
const pasaElLimite = crearLimite({ ventanaMs: 60 * 60 * 1000, tope: 5 });

/*
  Los mismos topes que `/api/lead`, a propósito: los dos endpoints reciben el
  MISMO formulario. Que uno acepte un nombre de 80 y el otro de cualquier largo
  no es una decisión, es un descuido.
*/
const Esquema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  serviceSlug: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${site.contact.phoneLocalDigits}}$`),
      `El teléfono debe tener ${site.contact.phoneLocalDigits} dígitos`,
    ),
  notes: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 400 });
  }

  const leido = Esquema.safeParse(body);
  if (!leido.success) {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 400 });
  }
  const { date, time, serviceSlug, name, phone, notes } = leido.data;

  const service = getService(serviceSlug);
  if (!service) {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 400 });
  }

  /*
    LA COMPROBACIÓN QUE DE VERDAD IMPORTA: que esa hora sea una que el estudio
    ofrece.

    No alcanza con que "HH:MM" tenga forma de hora. Se pide el horario real —el
    que Génesis puso en el panel— y se generan los espacios de ese día para ese
    servicio. Si la hora pedida no está entre ellos, no se aparta nada.

    Con esto quedan cubiertos de una sola vez: día cerrado, hora fuera del
    horario, hora que no cae en el intervalo, servicio que no termina antes del
    cierre, fecha pasada y `minNoticeHours`. Son las mismas reglas que ve la
    clienta en el formulario, aplicadas del lado que manda.
  */
  if (date < minBookableDate() || date > maxBookableDate()) {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 400 });
  }

  const horario = await leerHorario();
  const espacios = generateSlots(date, service.durationMinutes, new Date(), horario);
  if (!espacios.some((slot) => slot.start === time)) {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 400 });
  }

  /* El límite va DESPUÉS de validar: un pedido mal formado no debería gastarle
     el cupo a quien está reservando de verdad desde la misma red. */
  if (!pasaElLimite(huellaDe(ipDe(request)))) {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 429 });
  }

  const webhook = process.env.N8N_RESERVA_URL ?? "";
  // Sin webhook la reserva no se pierde: el formulario igual manda a la clienta
  // a WhatsApp con todos los datos, que es como funcionaba antes de existir esto.
  if (!webhook) return NextResponse.json({ ok: false, motivo: "error" }, { status: 200 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        durationMinutes: service.durationMinutes,
        bufferMinutes: site.calendar.bufferMinutes,
        serviceName: service.name,
        name,
        /* Con el código de país adelante, igual que en `/api/lead`. Antes
           viajaba tal cual lo escribió la clienta: ocho dígitos sueltos, que en
           el calendario no sirven para llamar desde afuera. */
        phone: `${site.contact.phoneCountryCode}${phone}`,
        notes,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ ok: false, motivo: "error" }, { status: 200 });

    const data = (await res.json()) as { ok?: boolean; motivo?: string };
    return NextResponse.json(
      { ok: data.ok === true, motivo: data.motivo ?? "error" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, motivo: "error" }, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}

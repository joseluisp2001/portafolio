/**
 * POST /api/lead
 *
 * Registra la intención de reserva y la reenvía a n8n (Flujo B). Este endpoint
 * NO crea el evento en Google Calendar: sólo deja constancia del lead. Quien
 * agenda de verdad es el bot de WhatsApp, porque la conversación sigue ahí.
 *
 * REGLA INNEGOCIABLE: el navegador redirige a WhatsApp pase lo que pase acá.
 * Un webhook caído no puede costar una clienta. Por eso la respuesta es 200
 * incluso cuando el reenvío falla; lo único que devuelve 400 es un cuerpo mal
 * formado, que sería un bug del propio sitio.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { getService, site } from "@/config/site";

/** Cuánto se espera a n8n antes de rendirse. */
const UPSTREAM_TIMEOUT_MS = 5_000;

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  /** Sólo dígitos locales; el código de país lo pone el servidor. */
  phone: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${site.contact.phoneLocalDigits}}$`),
      `El teléfono debe tener ${site.contact.phoneLocalDigits} dígitos`,
    ),
  serviceSlug: z.string().trim().min(1),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const service = getService(data.serviceSlug);

  /**
   * Contrato con n8n. `durationMinutes` sale de `config/site.ts` y viaja acá a
   * propósito: es lo que le permite a n8n calcular la hora de fin del evento
   * en Google Calendar sin tener que adivinarla.
   */
  const payload = {
    source: "website",
    ref: "form",
    name: data.name,
    phone: `${site.contact.phoneCountryCode}${data.phone}`,
    service: service?.name ?? data.serviceSlug,
    serviceSlug: data.serviceSlug,
    durationMinutes: service?.durationMinutes ?? null,
    preferredDate: data.preferredDate ?? null,
    preferredTime: data.preferredTime ?? null,
    timezone: site.calendar.timezone,
    notes: data.notes ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
    submittedAt: new Date().toISOString(),
  };

  const webhook = process.env.N8N_WEBHOOK_URL ?? "";
  if (!webhook) {
    // Sin webhook configurado el lead no se pierde: queda en los logs
    // del contenedor (docker logs genesis_site) y la clienta igual llega a
    // WhatsApp con todo el contexto escrito.
    console.warn("[lead] N8N_WEBHOOK_URL sin configurar; lead no reenviado", {
      serviceSlug: payload.serviceSlug,
      preferredDate: payload.preferredDate,
    });
    return NextResponse.json({ ok: true, forwarded: false });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[lead] n8n respondió", response.status);
      return NextResponse.json({ ok: true, forwarded: false });
    }

    return NextResponse.json({ ok: true, forwarded: true });
  } catch (error) {
    console.error("[lead] no se pudo reenviar a n8n", error);
    return NextResponse.json({ ok: true, forwarded: false });
  } finally {
    clearTimeout(timeout);
  }
}

"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { getService, site } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { buttonClasses } from "@/lib/button-styles";
import { cn } from "@/lib/cn";
import { formatTime12 } from "@/lib/format";
import {
  generateSlots,
  isClosedOn,
  maxBookableDate,
  minBookableDate,
  type Slot,
} from "@/lib/hours";
import type { DiaHorario } from "@/lib/horario";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Cuánto se espera a /api/availability antes de esconder el bloque. */
const AVAILABILITY_TIMEOUT_MS = 2_000;

/**
 * El campo del formulario.
 *
 * Se anima el borde y una sombra interior muy tenue al enfocar: da la sensación
 * de que el campo se "abre" para recibir texto, sin desplazar nada. Se usa
 * `focus:` además del `:focus-visible` global porque acá el estado activo
 * importa también cuando se llega con el puntero — es el único formulario del
 * sitio y conviene que se vea siempre dónde está parada la clienta.
 */
const FIELD_CLASSES =
  "w-full rounded-2xl border border-espresso/15 bg-cream px-4 py-3.5 " +
  "text-body text-espresso placeholder:text-mocha/60 " +
  "transition-[border-color,box-shadow] duration-300 ease-aura " +
  "hover:border-espresso/30 " +
  "focus:border-rose-ink/50 focus:shadow-[inset_0_1px_3px_rgba(46,36,34,0.06)]";

type Errors = Partial<
  Record<"name" | "phone" | "serviceSlug" | "date" | "time", string>
>;

/** "88887777" → "8888 7777". Sólo para mostrar; el estado guarda los dígitos. */
function maskPhone(digits: string): string {
  const half = Math.ceil(site.contact.phoneLocalDigits / 2);
  return digits.length > half
    ? `${digits.slice(0, half)} ${digits.slice(half)}`
    : digits;
}

/**
 * El CTA principal del sitio.
 *
 * El formulario NO reserva: junta contexto y empuja a WhatsApp con todo ya
 * escrito. Por eso la regla que manda acá es que la redirección ocurre pase lo
 * que pase — si /api/lead falla, el lead igual llega, porque llega como
 * conversación. Un webhook caído no puede costar una clienta.
 */
export function BookingForm({ horario }: { horario: DiaHorario[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  /** Slots que vienen del calendario. `null` = todavía no hay respuesta útil. */
  const [remoteSlots, setRemoteSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  /** Se incrementa para forzar otra consulta de disponibilidad. */
  const [recargarHoras, setRecargarHoras] = useState(0);

  const service = serviceSlug ? getService(serviceSlug) : undefined;

  /**
   * `min` y `max` se calculan una vez por montaje. Se hace en un efecto y no en
   * el render porque dependen de `new Date()`: calcularlos en el servidor y en
   * el cliente daría valores distintos y React se quejaría de la hidratación.
   */
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(
    null,
  );
  useEffect(() => {
    setBounds({ min: minBookableDate(), max: maxBookableDate() });
  }, []);

  const closedDay = date !== "" && isClosedOn(date, horario);

  /** Horas que el horario del estudio permite, sin saber de citas ya tomadas. */
  const localSlots = useMemo(() => {
    if (!date || !service || closedDay) return [];
    return generateSlots(date, service.durationMinutes, new Date(), horario);
  }, [date, service, closedDay, horario]);

  /**
   * Disponibilidad en vivo. Si el endpoint responde, sus slots mandan; si
   * tarda, falla o viene degradado, se cae de vuelta a los locales y el bloque
   * desaparece en silencio. Nunca se bloquea el envío por esto.
   */
  useEffect(() => {
    if (!date || !serviceSlug || closedDay) {
      setRemoteSlots(null);
      setLoadingSlots(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AVAILABILITY_TIMEOUT_MS,
    );
    setLoadingSlots(true);

    fetch(
      `/api/availability?date=${encodeURIComponent(date)}&serviceSlug=${encodeURIComponent(serviceSlug)}`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { slots?: Slot[]; degraded?: boolean } | null) => {
        if (!data || data.degraded || !Array.isArray(data.slots) || data.slots.length === 0) {
          setRemoteSlots(null);
          if (data?.degraded) trackEvent("availability_degraded", { date });
          return;
        }
        setRemoteSlots(data.slots);
      })
      .catch(() => {
        // Abort o red caída: se sigue con las horas locales, sin ruido.
        setRemoteSlots(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoadingSlots(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // `recargarHoras` está en las dependencias para poder volver a consultar la
    // disponibilidad sin cambiar fecha ni servicio: hace falta cuando la hora
    // elegida se ocupó mientras la clienta llenaba el formulario.
  }, [date, serviceSlug, closedDay, recargarHoras]);

  const slots = remoteSlots ?? localSlots;

  /* Si cambia la fecha o el servicio, la hora elegida puede dejar de existir. */
  useEffect(() => {
    if (time && !slots.some((slot) => slot.start === time)) setTime("");
  }, [slots, time]);

  const validate = useCallback((): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Escribí tu nombre.";
    if (phone.length !== site.contact.phoneLocalDigits) {
      next.phone = `El teléfono lleva ${site.contact.phoneLocalDigits} dígitos.`;
    }
    if (!serviceSlug) next.serviceSlug = "Elegí un servicio.";
    if (closedDay) next.date = "Ese día el estudio está cerrado. Elegí otra fecha.";
    return next;
  }, [name, phone, serviceSlug, closedDay]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    trackEvent("form_submit", { service: serviceSlug });

    const url = buildWhatsAppUrl({
      source: "form",
      name: name.trim(),
      service: service?.name,
      preferredDate: date || undefined,
      preferredTime: time || undefined,
      notes: notes.trim() || undefined,
    });

    /*
      Se aparta la cita ANTES de abrir WhatsApp. Si no, la clienta se va al chat
      creyendo que reservó y en el calendario no queda nada — que es justo lo
      que pasaba antes: el formulario sólo abría WhatsApp.

      Si la hora se ocupó mientras llenaba el formulario, se le avisa y NO se
      abre WhatsApp: mandarla a pedir una hora que ya no existe es peor que
      hacerle elegir otra.
    */
    if (date && time && serviceSlug) {
      try {
        const res = await fetch("/api/reservar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            time,
            serviceSlug,
            name: name.trim(),
            phone,
            notes: notes.trim(),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; motivo?: string };

        if (!data.ok && data.motivo === "ocupado") {
          setErrors({
            time: "Justo tomaron esa hora. Elegí otra, por favor.",
          });
          setSubmitting(false);
          setRecargarHoras((n) => n + 1);
          return;
        }
      } catch {
        // Que falle apartar NO puede costar la conversación: se sigue a WhatsApp.
        trackEvent("form_error", { service: serviceSlug });
      }
    }

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          serviceSlug,
          preferredDate: date || undefined,
          preferredTime: time || undefined,
          notes: notes.trim() || undefined,
        }),
      });
    } catch {
      trackEvent("form_error", { service: serviceSlug });
    } finally {
      // El `finally` es el punto entero de este bloque: haya pasado lo que haya
      // pasado con el webhook, la clienta termina en WhatsApp.
      trackEvent("whatsapp_click", { source: "form" });
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = url; // bloqueador de popups
      setSubmitting(false);
    }
  }

  const timeDisabled = !date || !serviceSlug || closedDay || slots.length === 0;

  return (
    <Section id="reservar" tone="sand">
      <SectionHeading
        eyebrow="Reservá tu cita"
        title="Contanos qué querés y lo agendamos"
        intro="Llená esto en un minuto y seguimos por WhatsApp con todo ya escrito. No tenés que repetir nada."
        align="center"
      />

      <Reveal className="mx-auto mt-14 max-w-xl">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={FIELD_CLASSES}
              placeholder="Ana Rodríguez"
            />
            {errors.name ? (
              <p id="name-error" role="alert" className="mt-2 text-sm text-rose-ink">
                {errors.name}
              </p>
            ) : null}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={maskPhone(phone)}
              onChange={(event) =>
                setPhone(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, site.contact.phoneLocalDigits),
                )
              }
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={FIELD_CLASSES}
              placeholder="8888 8888"
            />
            {errors.phone ? (
              <p id="phone-error" role="alert" className="mt-2 text-sm text-rose-ink">
                {errors.phone}
              </p>
            ) : null}
          </div>

          {/* Servicio */}
          <div>
            <label htmlFor="service" className="mb-2 block text-sm font-medium">
              Servicio
            </label>
            <select
              id="service"
              value={serviceSlug}
              onChange={(event) => setServiceSlug(event.target.value)}
              aria-invalid={Boolean(errors.serviceSlug)}
              aria-describedby={errors.serviceSlug ? "service-error" : undefined}
              className={FIELD_CLASSES}
            >
              <option value="">Elegí un servicio</option>
              {site.services.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.duration}
                </option>
              ))}
            </select>
            {errors.serviceSlug ? (
              <p id="service-error" role="alert" className="mt-2 text-sm text-rose-ink">
                {errors.serviceSlug}
              </p>
            ) : null}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="date" className="mb-2 block text-sm font-medium">
              Fecha preferida
            </label>
            <input
              id="date"
              type="date"
              value={date}
              min={bounds?.min}
              max={bounds?.max}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={Boolean(errors.date) || closedDay}
              aria-describedby={closedDay ? "date-error" : undefined}
              className={FIELD_CLASSES}
            />
            {/* El input date de HTML no sabe deshabilitar días sueltos, así que
                el domingo se valida acá y se avisa en texto. */}
            {closedDay ? (
              <p id="date-error" role="alert" className="mt-2 text-sm text-rose-ink">
                Ese día el estudio está cerrado. Elegí otra fecha.
              </p>
            ) : null}
            {loadingSlots ? (
              <p className="mt-2 text-sm text-mocha">Buscando espacios…</p>
            ) : null}
          </div>

          {/* Hora */}
          <div>
            <label htmlFor="time" className="mb-2 block text-sm font-medium">
              Hora preferida
            </label>
            <select
              id="time"
              value={time}
              disabled={timeDisabled}
              onChange={(event) => setTime(event.target.value)}
              className={cn(FIELD_CLASSES, timeDisabled && "opacity-60")}
            >
              <option value="">
                {timeDisabled ? "Elegí fecha y servicio" : "Elegí una hora"}
              </option>
              {slots.map((slot) => (
                <option
                  key={slot.start}
                  value={slot.start}
                  disabled={!slot.available}
                >
                  {formatTime12(slot.start)}
                  {slot.available ? "" : " — ocupado"}
                </option>
              ))}
            </select>
            {/* Aparece cuando la hora se ocupó mientras llenaba el formulario. */}
            {errors.time && (
              <p role="alert" className="mt-2 text-sm text-rose-ink">
                {errors.time}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-medium">
              Notas <span className="text-mocha">(opcional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={cn(FIELD_CLASSES, "resize-y")}
              placeholder="Es mi primera vez, tengo los ojos sensibles…"
            />
            <p className="mt-1 text-right text-xs text-mocha/70">
              {notes.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={buttonClasses(
              "primary",
              "lg",
              "w-full disabled:opacity-70",
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Te estamos llevando a WhatsApp…
              </>
            ) : (
              "Continuar por WhatsApp"
            )}
          </button>
        </form>
      </Reveal>
    </Section>
  );
}

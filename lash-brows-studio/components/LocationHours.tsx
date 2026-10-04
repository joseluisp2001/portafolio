"use client";

import { Gift, MapPin, Navigation } from "lucide-react";
import { motion } from "motion/react";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buttonClasses } from "@/lib/button-styles";
import { cn } from "@/lib/cn";
import { agrupar, enDoceHoras, type DiaHorario } from "@/lib/horario";
import { weekdayInStudioTz } from "@/lib/hours";
import { pressable } from "@/lib/motion";

const { address, coords, wazeUrl, googleMapsUrl } = site.contact;

/**
 * El endpoint `maps.google.com/maps?...&output=embed` NO necesita API key ni
 * cuenta de facturación: es el mismo iframe que entrega el botón "Compartir"
 * de Google Maps. Por eso se arma a mano con las coordenadas del config, en
 * lugar de la Maps Embed API, que obligaría a publicar una llave en el cliente.
 */
const mapSrc = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`;

/** Las cuatro líneas que ve la clienta, todas desde `site.contact.address`. */
const addressLines = [
  address.line1,
  address.line2,
  `${address.city}, ${address.province}`,
  `${address.postalCode}, ${address.country}`,
];

/**
 * Ubicación y horario: el bloque que responde "¿dónde queda?" y "¿a qué hora
 * abren?" sin obligar a nadie a escribir para preguntarlo.
 */
export function LocationHours({ horario }: { horario: DiaHorario[] }) {
  const reduced = useReducedMotion();

  /**
   * ACÁ NO HAY RIESGO DE HIDRATACIÓN, a diferencia de la tarjeta del hero.
   * `weekdayInStudioTz()` resuelve siempre contra `site.calendar.timezone`, que
   * es una zona FIJA: el servidor (que corre en UTC) y el navegador de la
   * clienta (que puede estar en cualquier huso) llegan exactamente al mismo
   * número, así que el HTML del servidor y el del cliente coinciden. El hero sí
   * tiene que esperar al montaje porque depende de la HORA — "abierto ahora"
   * cambia minuto a minuto —; esto depende sólo del DÍA.
   */
  const todayWeekday = weekdayInStudioTz();

  return (
    <Section id="ubicacion" tone="cream">
      <SectionHeading eyebrow="Dónde estamos" title="Ubicación y horario" />

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        {/* Mapa */}
        <Reveal className="rounded-3xl shadow-soft">
          <iframe
            src={mapSrc}
            title={`Mapa de ubicación de ${site.brand.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            // El borde y la sombra le dan al mapa el mismo acabado que a las
            // tarjetas de servicio. Sin ellos el iframe se ve pegado sobre el
            // fondo, como un recorte de otra página.
            className="aspect-[4/3] w-full rounded-3xl border border-espresso/10 shadow-soft"
          />
        </Reveal>

        {/* Dirección, cómo llegar y horario */}
        <Reveal delay={0.08}>
          <h3 className="text-h3 text-espresso">Dirección</h3>

          <address className="not-italic">
            {addressLines.map((line) => (
              <span key={line} className="mt-1 block text-body text-mocha">
                {line}
              </span>
            ))}
          </address>

          {/* Dos apps porque en Costa Rica media clienta navega con Waze. */}
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline")}
              {...pressable(reduced)}
            >
              <Navigation aria-hidden="true" className="h-4 w-4" />
              Abrir en Waze
            </motion.a>

            <motion.a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline")}
              {...pressable(reduced)}
            >
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Abrir en Google Maps
            </motion.a>
          </div>

          <h3 className="mt-12 text-h3 text-espresso">Horario</h3>

          <dl className="mt-4 space-y-1">
            {/* Los días se agrupan solos: si de lunes a viernes el horario es
                el mismo, se lee "Lunes a viernes" y no cinco renglones.
                Génesis los edita de a uno en el panel; acá se vuelven a
                juntar. */}
            {agrupar(horario).map((tramo) => {
              const isToday = tramo.dias.includes(todayWeekday);

              return (
                <div
                  key={tramo.etiqueta}
                  className={cn(
                    "flex items-baseline justify-between gap-4 px-3 py-2",
                    // El día de hoy lleva fondo blush Y un filete rose a la
                    // izquierda. Sólo con el fondo, la fila parecía un error de
                    // maquetación —una celda pintada de más— en vez de una
                    // marca deliberada; el filete la lee como "estás acá".
                    isToday &&
                      /* bg-blush-plano y no bg-blush/40: es el mismo color compuesto, pero
                         opaco, así el fondo ambiental no lo atraviesa y el contraste de
                         esta fila no depende de dónde esté una mancha. */
                      "rounded-xl border-l-2 border-rose-ink bg-blush-plano font-medium",
                  )}
                >
                  <dt className="text-body text-espresso">
                    {tramo.etiqueta}
                    {/* El resaltado no puede ser sólo color: quien navega con
                        lector de pantalla también tiene que oír cuál es hoy. */}
                    {isToday ? <span className="sr-only"> (hoy)</span> : null}
                  </dt>
                  {/* `text-right` para que a 375px, si el horario se parte en
                      dos líneas, siga alineado contra el borde derecho. */}
                  <dd className="text-right text-body text-mocha">
                    {tramo.abierto
                      ? `${enDoceHoras(tramo.apertura)} – ${enDoceHoras(tramo.cierre)}`
                      : "Cerrado"}
                  </dd>
                </div>
              );
            })}
          </dl>

          {site.loyalty.enabled && site.loyalty.url ? (
            <motion.a
              href={site.loyalty.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "md", "mt-8")}
              {...pressable(reduced)}
            >
              <Gift aria-hidden="true" className="h-4 w-4" />
              {site.loyalty.label}
            </motion.a>
          ) : null}
        </Reveal>
      </div>
    </Section>
  );
}

"use client";

import Image from "next/image";
import { Clock } from "lucide-react";
import { motion } from "motion/react";

import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { Service } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { REVEAL_VIEWPORT, STAGGER_STEP, revealTransition } from "@/lib/motion";

interface ServiceCardProps {
  service: Service;
  /**
   * Posición en la fila: define cuánto se atrasa la entrada de la tarjeta.
   * Sin sentido —y sin efecto— cuando `sinEntrada` está puesto.
   */
  index?: number;
  /**
   * Apaga la animación de entrada propia de la tarjeta.
   *
   * Obligatorio dentro de un carrusel. `whileInView` mira si el elemento entra
   * en la ventana, y las tarjetas que arrancan fuera de pantalla A LA DERECHA
   * no entran nunca hasta que alguien desliza: se quedarían en `opacity: 0`, o
   * sea invisibles, y aparecerían de golpe recién al empujarlas. En un carrusel
   * la entrada la hace el contenedor, una sola vez, para toda la fila.
   *
   * Es exactamente el problema que `Testimonials.tsx` ya tenía anotado y que
   * ahí se resolvió envolviendo la pista entera en un solo <Reveal>.
   */
  sinEntrada?: boolean;
}

/**
 * Una tarjeta de servicio: foto, precio y su propio botón a WhatsApp.
 *
 * La decisión que importa es que cada tarjeta lleva SU CTA con el nombre del
 * servicio dentro del intent. Así la clienta no tiene que escribir qué quiere:
 * el chat abre con el contexto ya redactado, que es justo lo que hace que la
 * conversación arranque en vez de morir en "hola".
 *
 * El escalonado vive acá y no en la grilla porque la tarjeta ya es cliente
 * (necesita `useReducedMotion` para el zoom de la foto); envolverla además en
 * un <Reveal> sería un componente cliente extra por cada servicio.
 */
export function ServiceCard({ service, index = 0, sinEntrada }: ServiceCardProps) {
  const reduced = useReducedMotion();

  /* Dentro de un carrusel no hay animación propia: se entrega quieta y visible,
     y de la entrada se encarga el contenedor. */
  const animacion = sinEntrada
    ? {}
    : {
        initial: { opacity: 0, y: reduced ? 0 : 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: REVEAL_VIEWPORT,
        transition: revealTransition(reduced, index * STAGGER_STEP),
      };

  return (
    <motion.article
      {...animacion}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl",
        "border border-espresso/10 bg-cream shadow-soft",
        // La sombra sólo se mueve en hover; durante el scroll nunca se anima.
        "transition-shadow duration-300 ease-aura hover:shadow-lifted",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={service.image}
          alt={service.imageAlt}
          fill
          /* Coincide con el ancho real de la tarjeta dentro del carrusel
             (85% / 46% / 31.5%). Si esto miente, Next descarga una foto más
             grande de la que se ve y se paga en datos móviles. */
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 46vw, 32vw"
          loading="lazy"
          className={cn(
            "object-cover",
            // El zoom es adorno, no información: con movimiento reducido la
            // foto se queda quieta y no se pierde nada.
            !reduced &&
              "transition-transform duration-400 ease-aura group-hover:scale-[1.04]",
          )}
        />

        {service.popular ? (
          <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-espresso">
            Más pedido
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-h3 text-espresso">{service.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-mocha">
          {service.description}
        </p>

        {/* `mt-auto` manda precio y botón al piso: así todas las tarjetas de la
            fila terminan alineadas aunque una descripción sea más corta. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-6">
          <span className="inline-flex items-center gap-2 text-sm text-mocha">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            {service.duration}
          </span>
          <span className="text-right">
            <span className="block font-display text-2xl text-espresso">
              {formatPrice(service.price, service.currency)}
            </span>
            {/* El retoque va debajo y más chico, igual que en la carta del
                estudio. Las cejas no llevan retoque: ahí no se dibuja nada en
                vez de escribir un guion, que obligaría a la clienta a
                interpretar qué significa. */}
            {service.maintenancePrice !== null ? (
              <span className="block text-xs text-mocha">
                Retoque {formatPrice(service.maintenancePrice, service.currency)}
              </span>
            ) : null}
          </span>
        </div>

        <WhatsAppButton
          variant="secondary"
          size="md"
          className="mt-6 w-full"
          intent={{
            source: `servicio:${service.slug}`,
            service: service.name,
          }}
        >
          Reservar este servicio
        </WhatsAppButton>
      </div>
    </motion.article>
  );
}

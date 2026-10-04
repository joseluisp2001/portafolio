"use client";

import { Expand } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Lightbox } from "@/components/Lightbox";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackEvent } from "@/lib/analytics";
import { blurProps } from "@/lib/blur-data";
import { cn } from "@/lib/cn";
import { REVEAL_VIEWPORT, STAGGER_STEP, revealTransition } from "@/lib/motion";

/** Tope del escalonado: con 8 fotos, sin esto la última esperaría medio segundo. */
const MAX_STAGGER = 0.4;

/**
 * Masonry de trabajos con visor propio.
 *
 * Se usa `columns-*` de CSS y no `grid` porque las fotos tienen alturas
 * distintas a propósito (4:5, 3:4, 1:1) y un grid las forzaría a filas
 * iguales, que es justo lo que hace que una galería parezca catálogo.
 */
export function Gallery() {
  const reduced = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /**
   * Se guarda el botón que abrió el visor para devolverle el foco al cerrar.
   * Sin esto, quien navega con teclado vuelve al principio del documento.
   */
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function open(index: number) {
    setOpenIndex(index);
    trackEvent("gallery_open", { index });
  }

  function close() {
    const previous = openIndex;
    setOpenIndex(null);
    if (previous !== null) triggerRefs.current[previous]?.focus();
  }

  return (
    <Section id="galeria" tone="cream">
      <SectionHeading
        eyebrow="Trabajos"
        title="Galería"
        intro="Cada mirada es distinta, así que ningún set se repite. Tocá una foto para verla en grande."
        align="center"
      />

      <div className="mt-16 columns-2 gap-4 md:columns-3">
        {site.gallery.map((item, index) => (
          <motion.div
            key={item.src}
            className="mb-4 break-inside-avoid"
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={REVEAL_VIEWPORT}
            transition={revealTransition(
              reduced,
              Math.min(index * STAGGER_STEP, MAX_STAGGER),
            )}
          >
            <motion.button
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              type="button"
              onClick={() => open(index)}
              aria-label={`Ampliar foto: ${item.alt}`}
              // El `layoutId` vive en el botón para que la transición al visor
              // arranque desde el recuadro exacto de la miniatura.
              layoutId={reduced ? undefined : `galeria-${index}`}
              className={cn(
                "group relative block w-full overflow-hidden rounded-2xl",
                "shadow-soft transition-shadow duration-300 hover:shadow-lifted",
              )}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 33vw"
                className={cn(
                  "h-auto w-full object-cover",
                  !reduced &&
                    "transition-transform duration-400 ease-aura group-hover:scale-[1.03]",
                )}
                {...blurProps(item.src)}
              />

              {/*
                Un velo y una lupa al pasar el puntero: sin esto, nada dice que
                la foto se puede abrir, y quien no prueba a hacer click nunca
                descubre el visor. Aparece también con `focus-visible` para que
                quien navega con teclado reciba la misma señal.

                Sólo se anima `opacity`, así que no cuesta layout. El velo es
                `espresso` de la paleta, no un negro suelto.
              */}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center",
                  "bg-espresso/25 opacity-0 transition-opacity duration-300 ease-aura",
                  "group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-cream/90 text-espresso shadow-soft">
                  <Expand className="size-4" />
                </span>
              </span>
            </motion.button>
          </motion.div>
        ))}
      </div>

      <Lightbox
        items={site.gallery}
        index={openIndex}
        onClose={close}
        onNavigate={setOpenIndex}
      />
    </Section>
  );
}

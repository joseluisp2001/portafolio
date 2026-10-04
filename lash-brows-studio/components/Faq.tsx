"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { DURATION, EASE_AURA, STAGGER_STEP } from "@/lib/motion";

/**
 * Acordeón de dudas frecuentes, hecho a mano.
 *
 * Va justo antes del CTA final a propósito: las objeciones ("¿duele?", "¿se me
 * caen las naturales?") se resuelven acá para que nadie llegue a WhatsApp con
 * miedo en vez de con una fecha en mente.
 */
export function Faq() {
  const reduced = useReducedMotion();
  // Uno solo abierto a la vez. Arranca con el primero abierto para que se vea
  // de entrada que las respuestas están ahí y no hay que cazarlas.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" tone="sand">
      <SectionHeading
        eyebrow="Dudas frecuentes"
        title="Preguntas"
        align="center"
      />

      <div className="mx-auto mt-14 max-w-3xl">
        {site.faq.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const triggerId = `faq-trigger-${index}`;

          return (
            <Reveal
              key={item.question}
              delay={index * STAGGER_STEP}
              className="border-b border-espresso/10"
            >
              {/* h3 porque el título de la sección ya es un h2: sin saltos. */}
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  // `group` para que la pregunta y el chevron reaccionen juntos:
                  // sin ninguna señal de hover, la fila no comunica que es
                  // pulsable y mucha gente sólo prueba a tocar el chevron.
                  className="group flex min-h-14 w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-display text-h3 text-espresso transition-colors duration-300 ease-aura group-hover:text-rose-ink">
                    {item.question}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-5 w-5 shrink-0 text-rose-ink transition-transform duration-300 ease-aura",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
              </h3>

              {/*
                SOBRE ANIMAR `height`: la regla de "sólo transform y opacity"
                aplica al SCROLL, donde recalcular layout en cada cuadro tira el
                rendimiento al piso. En un acordeón disparado por click es el
                único camino razonable, y motion lo resuelve con un
                ResizeObserver — mide una vez y anima —, no con layout por
                cuadro. `initial={false}` evita que los ocho paneles se colapsen
                animándose en el primer render.
              */}
              <motion.div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                // Cerrado con height 0 el texto se ve oculto, pero un lector de
                // pantalla lo seguiría leyendo. aria-hidden lo saca del árbol.
                aria-hidden={!isOpen}
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: DURATION.micro, ease: EASE_AURA }
                }
                className="overflow-hidden"
              >
                <p className="pb-6 text-body text-mocha">{item.answer}</p>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

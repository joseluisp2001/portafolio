"use client";

import { motion } from "motion/react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASE_AURA, REVEAL_VIEWPORT } from "@/lib/motion";

/**
 * La línea que une los tres pasos de "Cómo funciona".
 *
 * Se dibuja de izquierda a derecha cuando el bloque entra en pantalla, con
 * `scaleX` y `transform-origin: left`. Se anima la transformación y no el
 * `width` a propósito: `width` obliga al navegador a recalcular el layout en
 * cada cuadro; `scaleX` sólo compone, y en una línea de 1px se ve idéntico.
 *
 * Vive en su propio archivo para que `HowItWorks` siga siendo un Server
 * Component: sólo este trazo de un píxel cruza al navegador.
 *
 * Es decorativa —la secuencia ya la comunican los números y el orden de
 * lectura—, así que va `aria-hidden` y no aparece en móvil, donde los pasos se
 * apilan y una línea horizontal no conectaría nada.
 */
export function StepConnector() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[16.667%] top-7 -z-10 hidden h-px origin-left bg-espresso/15 md:block"
      initial={{ scaleX: reduced ? 1 : 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={REVEAL_VIEWPORT}
      transition={
        reduced
          ? { duration: 0 }
          : // Arranca un pelo después que los círculos para que la línea
            // parezca salir del primer número, no llegar antes que él.
            { duration: 0.9, ease: EASE_AURA, delay: DURATION.reveal * 0.4 }
      }
    />
  );
}

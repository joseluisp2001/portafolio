"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { EASE_AURA, REVEAL_VIEWPORT } from "@/lib/motion";

interface StarsProps {
  /** Estrellas llenas, de 0 a 5. */
  rating: number;
  className?: string;
  /** Tamaño del ícono en px. */
  size?: number;
}

/** Escalonado entre estrellas. Corto: cinco elementos idénticos y seguidos
 *  necesitan menos separación que las tarjetas de una grilla. */
const STAR_STEP = 0.055;

/**
 * Calificación en estrellas.
 *
 * Las estrellas se pintan con `gold-ink` (3.85:1 sobre cream, 3.31:1 sobre
 * sand) y no con `gold`, que se queda en 2.25:1 y no llega al 3:1 que pide
 * WCAG 1.4.11 para un gráfico que comunica algo.
 *
 * Entran una detrás de otra al aparecer en pantalla. No es adorno: el ojo
 * cuenta cinco estrellas cuando las ve llegar de a una, y las registra como
 * una sola mancha dorada cuando aparecen todas juntas.
 *
 * El grupo entero lleva `role="img"` con una etiqueta en texto, para que un
 * lector de pantalla anuncie "5 de 5 estrellas" una sola vez en lugar de cinco
 * íconos sueltos.
 */
export function Stars({ rating, className, size = 16 }: StarsProps) {
  const reduced = useReducedMotion();
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      role="img"
      aria-label={`${filled} de 5 estrellas`}
      className={cn("flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <motion.span
          key={index}
          className="inline-flex"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={REVEAL_VIEWPORT}
          transition={
            reduced
              ? { duration: 0.15 }
              : { duration: 0.35, ease: EASE_AURA, delay: index * STAR_STEP }
          }
        >
          <Star
            width={size}
            height={size}
            aria-hidden="true"
            className={cn(
              index < filled
                ? "fill-gold-ink text-gold-ink"
                : "fill-none text-espresso/25",
            )}
            strokeWidth={1.5}
          />
        </motion.span>
      ))}
    </div>
  );
}

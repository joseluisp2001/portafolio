"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { REVEAL_VIEWPORT, REVEAL_Y, revealTransition } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  /** Retraso en segundos. Para escalonar una grilla: `index * 0.08`. */
  delay?: number;
  className?: string;
}

/**
 * Entrada por scroll: sube `REVEAL_Y` y aparece, una sola vez.
 *
 * El desplazamiento y la ventana que la dispara viven en lib/motion.ts, no
 * acá: `ServiceCard` y `QuickLinks` animan por su cuenta y tienen que entrar
 * exactamente igual que esto.
 *
 * Con `prefers-reduced-motion: reduce` se queda en un fade de 150ms, sin
 * desplazamiento ni retraso.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : REVEAL_Y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={revealTransition(reduced, delay)}
    >
      {children}
    </motion.div>
  );
}

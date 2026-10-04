"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { REVEAL_VIEWPORT } from "@/lib/motion";

interface CountUpProps {
  /** Número al que se llega. Se cuenta desde 0. */
  value: number;
  /** Se pinta pegado antes del número, ej. "+". */
  prefix?: string;
  /** Se pinta pegado después del número, ej. "%". */
  suffix?: string;
  /** Duración en segundos. `0` o menos muestra el valor final de una. */
  duration?: number;
  className?: string;
}

/**
 * Formateador único para todo el módulo: crear un `Intl.NumberFormat` en cada
 * cuadro sería tirar basura al recolector 60 veces por segundo.
 * es-CR agrupa con punto y sólo a partir de cinco cifras, igual en Node y en
 * el navegador, así que el HTML del servidor y el de la hidratación coinciden.
 */
const NUMBER_FORMAT = new Intl.NumberFormat("es-CR");

/**
 * Arranca disparado y frena suave: es la misma sensación que EASE_AURA, pero
 * aplicada a un valor numérico en vez de a un transform.
 */
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * Número que cuenta desde 0 al entrar en pantalla, una sola vez.
 *
 * Va con `requestAnimationFrame` y no con `setInterval` porque el rAF se
 * sincroniza con el refresco de la pantalla y se pausa solo cuando la pestaña
 * queda en segundo plano; un intervalo seguiría corriendo y acumulando saltos.
 *
 * ACCESIBILIDAD: un lector de pantalla no tiene por qué escuchar el conteo, así
 * que el número que cambia va `aria-hidden` y el valor final completo vive en un
 * `sr-only` que se anuncia una sola vez.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.6,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Mismo margen que las entradas por scroll: el número ya terminó de contar
  // cuando la clienta llega a leerlo.
  const inView = useInView(ref, REVEAL_VIEWPORT);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;

    // Con movimiento reducido no se cuenta: se muestra el resultado y listo.
    if (reduced || duration <= 0) {
      setDisplayed(value);
      return;
    }

    const totalMs = duration * 1000;
    let frame = 0;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / totalMs, 1);
      setDisplayed(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    // Sin esto, desmontar a mitad del conteo dejaría un rAF vivo intentando
    // escribir estado en un componente que ya no existe.
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, duration]);

  return (
    <span
      ref={ref}
      className={cn(
        "font-display text-3xl tabular-nums text-espresso md:text-4xl",
        className,
      )}
    >
      <span aria-hidden="true">
        {prefix}
        {NUMBER_FORMAT.format(displayed)}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {NUMBER_FORMAT.format(value)}
        {suffix}
      </span>
    </span>
  );
}

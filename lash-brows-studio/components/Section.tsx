import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionProps {
  /** Ancla para la navegación del header. */
  id?: string;
  /** `sand` pinta el fondo alterno; `cream` hereda el fondo base. */
  tone?: "cream" | "sand";
  /** `false` quita el contenedor centrado, para secciones a ancho completo. */
  contained?: boolean;
  /**
   * `normal` es el ritmo del sitio. `tight` lo acorta un escalón: sirve cuando
   * dos secciones seguidas comparten tono y el aire entre ellas se suma hasta
   * parecer un hueco (Preguntas → Enlaces, por ejemplo).
   */
  space?: "normal" | "tight";
  className?: string;
  children: ReactNode;
}

/**
 * El ritmo vertical del sitio.
 *
 * Cada sección respira igual (`py-24 md:py-32`) y comparte el mismo ancho de
 * lectura (`max-w-6xl px-6`). Tenerlo en un solo lugar es lo que evita que la
 * página se vea cosida a partir de bloques sueltos.
 *
 * El `data-tone` no es decorativo: globals.css lo lee para dibujar el filete
 * de 1px cuando dos secciones seguidas cambian de fondo. Es la costura entre
 * cream y sand, y así ninguna sección tiene que acordarse de pedirla.
 *
 * `relative` va en todas para que el filete tenga de dónde colgar y para que
 * cualquier decoración absoluta se ancle siempre al mismo lugar. Si una
 * sección necesita otro posicionamiento, lo pasa por `className` y gana.
 */
export function Section({
  id,
  tone = "cream",
  contained = true,
  space = "normal",
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={cn(
        "relative",
        space === "tight" ? "py-16 md:py-24" : "py-24 md:py-32",
        /* El tono cream no pinta nada: deja ver el fondo ambiental
           (components/Fondo.tsx), que ya está sobre el cream del body. El tono
           sand sí pinta, y opaco: rose-ink sobre sand da 4.55:1 y cualquier
           tinte encima lo baja de 4,5:1 (el cálculo está en globals.css). */
        tone === "sand" ? "bg-sand" : "bg-transparent",
        className,
      )}
    >
      {contained ? (
        <div className="mx-auto max-w-6xl px-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

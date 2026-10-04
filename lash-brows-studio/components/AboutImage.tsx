"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { blurProps } from "@/lib/blur-data";

/** Desplazamiento máximo, en px. Pasado esto se nota el truco y molesta. */
const PARALLAX_RANGE = 30;

/**
 * La foto de "Sobre el estudio", con un parallax mínimo.
 *
 * Sin él, la imagen y la columna de texto son dos bloques quietos uno al lado
 * del otro, sin relación. Con 30px de deriva, la foto se mueve apenas distinto
 * al texto mientras se baja, y las dos columnas se leen como partes de la misma
 * escena en vez de dos recuadros pegados.
 *
 * Vive en su propio archivo para que `About` siga siendo un Server Component:
 * sólo esta imagen cruza al navegador.
 *
 * Se apaga en dos casos, y los dos importan: en móvil, porque las columnas se
 * apilan y el desfase no relaciona nada —además de costar cuadros en el
 * dispositivo más lento—, y con `prefers-reduced-motion`, porque el
 * desplazamiento ligado al scroll es justo lo que marea a quien pidió que no
 * se mueva.
 */
export function AboutImage() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [PARALLAX_RANGE, -PARALLAX_RANGE],
  );

  const activo = isDesktop && !reduced;

  return (
    <div
      ref={ref}
      className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-soft"
    >
      {/*
        El wrapper se estira un 12 % más alto que el marco y se centra con el
        `-top`. Ese sobrante es lo que permite que la foto derive sin dejar ver
        el fondo por arriba o por abajo.
      */}
      <motion.div
        className="absolute inset-x-0 -top-[6%] h-[112%]"
        style={activo ? { y } : undefined}
      >
        <Image
          src={site.about.image}
          alt={site.about.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          loading="lazy"
          className="object-cover"
          {...blurProps(site.about.image)}
        />
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Stars } from "@/components/Stars";
import { TodayHoursCard } from "@/components/TodayHoursCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { site } from "@/config/site";
import type { DiaHorario } from "@/lib/horario";
import { blurProps } from "@/lib/blur-data";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buttonClasses } from "@/lib/button-styles";
import { DURATION, EASE_AURA, revealTransition } from "@/lib/motion";

/** Escalonado entre palabras del titular. Más corto que el de una grilla:
 *  una frase tiene que leerse como frase, no como lista. */
const WORD_STEP = 0.05;

/**
 * El hero entra SÓLO con desplazamiento, sin fundido.
 *
 * Motion serializa el `initial` en el HTML del servidor: con `opacity: 0`,
 * el titular, el párrafo, los dos botones —el de WhatsApp incluido— y las
 * estrellas llegaban invisibles y no existían hasta que el navegador
 * hidratara. En un teléfono lento eso son cientos de milisegundos de hero en
 * blanco, y con la carga de marca (`components/Intro.tsx`) el velo se
 * levantaba justo encima de esa pantalla vacía. En un escritorio rápido
 * pasaba lo contrario: toda la entrada se jugaba detrás del velo y no la
 * veía nadie.
 *
 * Con `y` solo, el contenido llega pintado y el movimiento se juega al
 * hidratar, cuando haya hidratación. Si el JavaScript nunca corre, el hero
 * se ve igual, 18 px más abajo.
 */

/** El titular ocupa los primeros ~0.2s; el resto entra detrás de él. */
const INTRO_DELAY = {
  eyebrow: 0,
  paragraph: 0.32,
  ctas: 0.42,
  proof: 0.52,
} as const;

/** Desplazamiento máximo del parallax, en px. Más que esto y se nota el truco. */
const PARALLAX_RANGE = 40;

/**
 * Primera pantalla. Todo acá empuja hacia un solo tap: el de WhatsApp.
 *
 * No usa <Section> a propósito — el hero tiene su propio ritmo vertical y su
 * propia grilla de dos columnas, distinta a la del resto del sitio.
 */
export function Hero({
  promedio = 0,
  cantidad = 0,
  horario,
}: {
  promedio?: number;
  cantidad?: number;
  /** Sólo lo usa TodayHoursCard; el Hero lo pasa de largo. */
  horario: DiaHorario[];
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  // El parallax sólo tiene sentido en pantallas grandes: en móvil la columna
  // ocupa todo el ancho, el scroll es a dedo y el movimiento se siente como un
  // salto. Se resuelve con matchMedia y no con una clase `lg:` porque hay que
  // apagar el cálculo, no esconderlo.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const parallaxOn = isDesktop && !reduced;

  // Offset "start start" → el progreso arranca en 0 con la página sin scrollear,
  // así la foto no pega un brinco al montar: ya está donde tiene que estar.
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -PARALLAX_RANGE]);

  // El titular entra palabra por palabra. Se parte por espacios y cada palabra
  // se lleva el suyo pegado (`whitespace-pre`), porque un `inline-block` colapsa
  // los espacios que quedan entre elementos.
  const words = site.hero.headline.split(" ");

  return (
    // Sin fondo propio: el hero deja ver el fondo ambiental (components/Fondo.tsx).
    // `isolate` sigue siendo necesario para que el halo en -z-10 no caiga detrás
    // de esa capa.
    <section
      id="inicio"
      className="relative isolate overflow-hidden lg:min-h-[92svh]"
    >
      {/* Halo decorativo, sin significado. Va detrás de todo y no recibe clicks.
          Sólo desde lg, y eso es una regla de contraste, no de gusto: por debajo
          de ~900px su núcleo cae justo encima del eyebrow rose-ink de 12px
          (medido: a 375px el texto queda 136px DENTRO del círculo). Sobre el
          cream plano de antes ese apilado daba 4.54:1 y pasaba raspando; con el
          fondo ambiental debajo cae a 4.18:1 y deja de pasar AA. Desde 1024px el
          texto queda a más de 6 sigmas del borde del desenfoque, o sea fuera.
          En el teléfono la atmósfera ya la pone el fondo (components/Fondo.tsx). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 -z-10 hidden size-80 translate-x-1/3 rounded-full bg-blush/40 blur-3xl lg:block"
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 pt-14 pb-20 sm:px-6 lg:min-h-[92svh] lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* ---------------------------------------------------------------- */}
        {/*  Columna izquierda: la promesa y el tap                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="max-w-xl">
          <motion.p
            /* Espresso y no rose-ink: este eyebrow es el texto más débil que
               cae sobre el fondo ambiental, y en rose-ink era el que ponía el
               techo de los alfas (4.66:1, a 0.16 del mínimo). En espresso da
               11.71:1 y el fondo pudo subir 60 %. */
            className="text-xs font-semibold tracking-[0.25em] text-espresso uppercase"
            initial={{ y: reduced ? 0 : 12 }}
            animate={{ y: 0 }}
            transition={revealTransition(reduced, INTRO_DELAY.eyebrow)}
          >
            {site.hero.eyebrow}
          </motion.p>

          <h1 className="mt-5 font-display text-display text-espresso">
            {/* El lector de pantalla lee la frase completa, de corrido. */}
            <span className="sr-only">{site.hero.headline}</span>
            {/* Las palabras animadas son puro efecto visual: quedan ocultas
                para tecnologías de asistencia y no se anuncian sueltas. */}
            <span aria-hidden="true">
              {words.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="inline-block whitespace-pre"
                  initial={{ y: reduced ? 0 : 18 }}
                  animate={{ y: 0 }}
                  transition={revealTransition(reduced, index * WORD_STEP)}
                >
                  {index < words.length - 1 ? `${word} ` : word}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            className="mt-6 max-w-md text-body text-mocha"
            initial={{ y: reduced ? 0 : 18 }}
            animate={{ y: 0 }}
            transition={revealTransition(reduced, INTRO_DELAY.paragraph)}
          >
            {site.brand.shortDescription}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4"
            initial={{ y: reduced ? 0 : 18 }}
            animate={{ y: 0 }}
            transition={revealTransition(reduced, INTRO_DELAY.ctas)}
          >
            {/* Principal: baja al formulario, que arma el mensaje completo. */}
            <a href="#reservar" className={buttonClasses("primary", "lg")}>
              {site.hero.primaryCta}
            </a>

            {/* Secundario: WhatsApp directo, para una consulta rápida. */}
            <WhatsAppButton intent={{ source: "hero" }} variant="outline" size="lg">
              {site.hero.whatsappCta}
            </WhatsAppButton>
          </motion.div>

          <motion.div
            className="mt-8 flex items-center gap-3"
            initial={{ y: reduced ? 0 : 18 }}
            animate={{ y: 0 }}
            transition={revealTransition(reduced, INTRO_DELAY.proof)}
          >
            {/*
              LAS ESTRELLAS YA NO ESTÁN FIJAS EN 5.

              Antes acá había `<Stars rating={5} />` a secas: una calificación
              perfecta que no salía de ninguna reseña. Era el mismo problema que
              los seis testimonios inventados que se quitaron en agosto, y quedó
              anotado como pendiente en el documento del proyecto.

              Ahora sale del promedio real de las reseñas aprobadas. Y si todavía
              no hay ninguna, no se muestra nada — ni las estrellas ni el
              conteo: lo que falta se apaga, no se rellena.
            */}
            {cantidad > 0 && (
              /*
                LA PASTILLA NO ES DECORACIÓN: ES LO QUE LE SUBE EL TECHO AL FONDO.

                Las estrellas son gold-ink, un gráfico con significado, así que
                necesitan 3:1. Sobre el fondo ambiental daban 3.24 —a 0.24 del
                mínimo— y eran EL TECHO de todo el fondo: mientras estuvieran
                encima del aura, la seda del hero no podía subir un punto.
                Medido: sobre blush plano (el mismo blush ya compuesto y opaco
                que usa la fila de hoy del horario) dan 3.28 y dejan de depender
                del fondo, y con ellas fuera de la cuenta la seda pudo subir un
                60 %. El texto de al lado queda en 4.98.

                Opaca a propósito: si fuera translúcida el aura la atravesaría y
                no habría servido de nada.
              */
              <span className="flex items-center gap-2.5 rounded-full bg-blush-plano px-3.5 py-1.5">
                <Stars rating={promedio} />
                <span className="text-sm text-mocha">
                  {promedio.toLocaleString("es-CR", { minimumFractionDigits: 1 })} de {cantidad}{" "}
                  {cantidad === 1 ? "reseña" : "reseñas"}
                </span>
              </span>
            )}
          </motion.div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Columna derecha: la foto (el LCP) y el horario de hoy            */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          ref={frameRef}
          // Sólo `y`, y sólo en desktop sin reduced-motion. Si está apagado no
          // se pasa `style` para que motion ni siquiera escriba el transform.
          style={parallaxOn ? { y: parallaxY } : undefined}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-lifted">
            {/* El zoom-out vive en un wrapper aparte del parallax: así cada
                animación maneja su propio transform y no se pisan. */}
            {/*
              La imagen arranca OPACA y sólo se desescala.

              Animarla desde `opacity: 0` era un error medible, no de gusto:
              esta es la imagen LCP (por eso lleva `priority`), y el navegador
              no contabiliza como "pintado" un elemento transparente. Con el
              fundido de 1.2s, la métrica de carga se retrasaba ese tiempo
              entero aunque el archivo ya estuviera en el disco del visitante.

              El zoom-out solo conserva la sensación de que la foto se asienta,
              y no cuesta nada: `transform` no bloquea la medición.
            */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: reduced ? 1 : 1.06 }}
              animate={{ scale: 1 }}
              transition={
                reduced
                  ? { duration: DURATION.reduced }
                  : { duration: 1.4, ease: EASE_AURA }
              }
            >
              <Image
                src={site.hero.image}
                alt={site.hero.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 44vw, (min-width: 640px) 28rem, 90vw"
                className="object-cover"
                // El desenfoque previo pinta algo desde el primer cuadro, así
                // que acá ayuda al LCP en vez de estorbarlo: el hueco nunca
                // está vacío mientras baja la foto real.
                {...blurProps(site.hero.image)}
              />
            </motion.div>
          </div>

          {/* Encima de la foto, abajo a la izquierda. Se fijan los dos costados
              con `w-fit` para que la tarjeta nunca se pase del ancho del marco:
              a 375px eso sería scroll horizontal. */}
          <TodayHoursCard horario={horario} className="absolute right-4 bottom-4 left-4 w-fit sm:right-6 sm:bottom-6 sm:left-6" />
        </motion.div>
      </div>
    </section>
  );
}

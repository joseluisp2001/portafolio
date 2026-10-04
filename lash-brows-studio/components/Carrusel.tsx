"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { pressable } from "@/lib/motion";

/**
 * El navegador reporta `scrollLeft` y `scrollWidth` con decimales (zoom,
 * densidad de pantalla, subpíxeles). Sin este margen de 2px la flecha derecha
 * se queda encendida para siempre al llegar al final, porque la suma nunca
 * alcanza exactamente al ancho total.
 */
const TOLERANCIA = 2;

interface CarruselProps {
  /** Nombre de la región para lectores de pantalla. Ej: "Servicios de volumen". */
  etiqueta: string;
  /**
   * El fondo de la sección donde vive. Los degradados de los bordes tienen que
   * partir de ese color exacto o se ve un rectángulo pegado encima.
   */
  tono?: "cream" | "sand";
  className?: string;
  children: ReactNode;
}

/**
 * Una fila que se desplaza en horizontal, de a una tarjeta.
 *
 * El desplazamiento es scroll-snap NATIVO, no JS de arrastre: así se recorre
 * con el dedo en móvil, con la rueda en trackpad, con la barra y con el teclado
 * sin que tengamos que reimplementar la inercia del sistema. Las flechas son un
 * atajo extra para escritorio, donde no hay gesto táctil.
 *
 * Este componente nació de la lógica que ya vivía dentro de `Testimonials.tsx`.
 * Se sacó afuera al necesitar lo mismo en los servicios: dos copias del mismo
 * carrusel en carpetas distintas es exactamente el patrón que más caro sale en
 * este stack (ver la nota "Arreglos a medias"), y acá se podía evitar desde el
 * primer día.
 */
export function Carrusel({
  etiqueta,
  tono = "cream",
  className,
  children,
}: CarruselProps) {
  const reduced = useReducedMotion();
  const pistaRef = useRef<HTMLDivElement>(null);
  const [puedeIzquierda, setPuedeIzquierda] = useState(false);
  const [puedeDerecha, setPuedeDerecha] = useState(false);

  const sincronizar = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista) return;

    setPuedeIzquierda(pista.scrollLeft > TOLERANCIA);
    setPuedeDerecha(
      pista.scrollLeft + pista.clientWidth < pista.scrollWidth - TOLERANCIA,
    );
  }, []);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;

    // Estado inicial: con pocas tarjetas o en una pantalla muy ancha puede que
    // no haya nada que desplazar y las dos flechas nazcan apagadas. Es el caso
    // real de Volumen y Efectos en escritorio, que tienen dos servicios.
    sincronizar();

    // `passive` porque sólo leemos posiciones; nunca llamamos preventDefault.
    pista.addEventListener("scroll", sincronizar, { passive: true });
    window.addEventListener("resize", sincronizar);

    /*
      Las tarjetas traen fotos con `fill`, así que la pista cambia de ancho
      cuando terminan de cargar y de nuevo si el usuario cambia el zoom. Sin
      observar el tamaño, las flechas se quedan con el estado del primer
      render. `resize` de window no alcanza: la ventana no cambia.
    */
    const observador = new ResizeObserver(sincronizar);
    observador.observe(pista);

    return () => {
      pista.removeEventListener("scroll", sincronizar);
      window.removeEventListener("resize", sincronizar);
      observador.disconnect();
    };
  }, [sincronizar]);

  const avanzar = useCallback(
    (direccion: 1 | -1) => {
      const pista = pistaRef.current;
      if (!pista) return;

      // La distancia entre el inicio de dos tarjetas ya incluye el gap, así que
      // no hace falta conocer el valor de `gap-*` desde acá.
      const primera = pista.children[0] as HTMLElement | undefined;
      const segunda = pista.children[1] as HTMLElement | undefined;
      const paso =
        primera && segunda
          ? segunda.offsetLeft - primera.offsetLeft
          : pista.clientWidth;

      pista.scrollBy({
        left: direccion * paso,
        // El `scroll-smooth` del CSS lo apaga `prefers-reduced-motion`, pero un
        // `behavior: "smooth"` explícito le pasaría por encima. Lo respetamos.
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced],
  );

  /*
    `z-20` para quedar por encima de los degradados, que están en `z-10`.
    `pointer-fine:inline-flex` es lo que las enciende: en un teléfono no se
    pintan a ningún ancho, ni acostado, porque ahí el gesto de deslizar ya
    resuelve todo y dos botones sólo taparían tarjeta.
  */
  const clasesFlecha =
    "absolute top-1/2 z-20 hidden h-11 w-11 min-h-11 -translate-y-1/2 " +
    "items-center justify-center rounded-full " +
    "border border-espresso/10 bg-cream text-espresso shadow-lifted " +
    "transition-colors duration-300 ease-aura hover:bg-blush " +
    "pointer-fine:inline-flex";

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {/*
          Degradados en los bordes: dicen "hay más para este lado" sin gastar un
          solo byte de JS. Se pintan sobre la pista con `pointer-events-none`
          para no robarle el arrastre ni el click a las tarjetas — y eso importa
          especialmente acá, donde cada tarjeta lleva su botón a WhatsApp.

          Van como capa aparte y no como `mask-image` sobre el contenedor porque
          la máscara también recortaría el anillo de foco de las tarjetas al
          recorrerlas con el teclado, y ahí el degradado dejaría de ser una
          ayuda para volverse un problema de accesibilidad.

          Sólo se pintan del lado donde de verdad hay más: un degradado fijo a la
          izquierda cuando ya estás al principio ensucia el borde sin decir nada.
        */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-14",
            "bg-linear-to-r to-transparent transition-opacity duration-300",
            tono === "sand" ? "from-sand" : "from-cream",
            puedeIzquierda ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-14",
            "bg-linear-to-l to-transparent transition-opacity duration-300",
            tono === "sand" ? "from-sand" : "from-cream",
            puedeDerecha ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          ref={pistaRef}
          tabIndex={0}
          role="region"
          aria-label={etiqueta}
          /*
            `items-stretch` para que todas las tarjetas de la fila midan lo
            mismo de alto: la tarjeta usa `mt-auto` para mandar precio y botón
            al piso, y eso sólo alinea si la tarjeta ocupa todo el alto.

            `pb-2` deja aire para la sombra `shadow-lifted` del hover, que si no
            queda cortada por el `overflow-x`.
          */
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory items-stretch gap-6",
            "overflow-x-auto scroll-smooth pb-2",
          )}
        >
          {children}
        </div>

        {/*
          Las flechas van SUPERPUESTAS sobre los bordes de la pista, no en una
          fila encima. Dos razones, las dos medidas en el navegador:

          1. No mueven nada. Sólo se sabe si hace falta desplazar DESPUÉS de
             montar y medir, así que una fila de flechas encima aparecería
             recién ahí y empujaría hacia abajo todo lo que sigue. Superpuestas
             no ocupan espacio en el flujo: aparecen y desaparecen sin correr
             una sola tarjeta.
          2. Se muestran a quien tiene MOUSE, no a partir de un ancho. La
             primera versión usaba `lg:`, copiando el carrusel de reseñas, y eso
             deja un hueco real: entre 640 y 1024px hay tarjetas fuera de vista,
             la barra está oculta por `no-scrollbar` y las flechas todavía no
             aparecen — en una laptop con la ventana a medio ancho no queda
             ninguna forma evidente de pasar a la siguiente. `pointer-fine`
             pregunta lo que importa (si hay un puntero preciso) en vez de
             adivinarlo por el ancho.

          Se pintan sólo del lado donde de verdad hay más, así que nunca hay un
          botón apagado diciendo "acá hay algo" cuando no lo hay.
        */}
        {puedeIzquierda ? (
          <motion.button
            type="button"
            onClick={() => avanzar(-1)}
            aria-label={`Ver anteriores — ${etiqueta}`}
            className={cn(clasesFlecha, "left-0 -translate-x-1/3")}
            {...pressable(reduced)}
          >
            <ChevronLeft width={20} height={20} aria-hidden="true" />
          </motion.button>
        ) : null}
        {puedeDerecha ? (
          <motion.button
            type="button"
            onClick={() => avanzar(1)}
            aria-label={`Ver más — ${etiqueta}`}
            className={cn(clasesFlecha, "right-0 translate-x-1/3")}
            {...pressable(reduced)}
          >
            <ChevronRight width={20} height={20} aria-hidden="true" />
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Constantes de animación compartidas.
 *
 * Todo el sitio se mueve con la misma curva y los mismos tiempos. Si cada
 * componente eligiera su propio easing, el conjunto se sentiría cosido a mano;
 * con esto, se siente de una pieza.
 *
 * REGLA: sólo se animan `transform` y `opacity`. Nada de `width`, `height`,
 * `top` ni `box-shadow` durante el scroll — eso obliga al navegador a
 * recalcular layout en cada cuadro y tira el LCP al piso.
 */

import type { Transition, Variants } from "motion/react";

/** La curva de la casa: sale rápido y frena suave. */
export const EASE_AURA: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Duraciones en segundos, para lo que se anima con Motion.
 *
 * Lo que se anima con CSS (colores, bordes y sombras en hover) no usa esto:
 * usa los tokens `--duration-hover` y `--duration-lift` de globals.css, con
 * `ease-aura`. Son dos sistemas porque son dos motores, pero una sola curva.
 */
export const DURATION = {
  /** Entradas por scroll. */
  reveal: 0.6,
  /** Micro-interacciones de hover y tap. */
  micro: 0.4,
  /** Lo único que queda vivo con `prefers-reduced-motion: reduce`. */
  reduced: 0.15,
} as const;

/** Escalonado entre hijos de una grilla. */
export const STAGGER_STEP = 0.08;

/**
 * Desplazamiento de la entrada, en px.
 *
 * 24px era un salto: el bloque se leía como que llegaba de otro lado. 18px
 * alcanza para que el ojo registre el movimiento y no para que registre el
 * viaje — la sensación es que el contenido ya estaba ahí y termina de
 * asentarse.
 */
export const REVEAL_Y = 18;

/**
 * Ventana que dispara las entradas por scroll.
 *
 * El margen se lee como el `rootMargin` de IntersectionObserver: **positivo
 * agranda** la zona de observación, negativo la achica. El valor anterior
 * (`-80px`) la achicaba por los cuatro lados, así que el bloque tenía que
 * estar 80px DENTRO de la pantalla para recién empezar a aparecer; bajando a
 * velocidad normal eso dejaba huecos en blanco donde debería haber contenido.
 *
 * Con `15%` abajo la zona se estira por debajo del borde inferior: la entrada
 * arranca cuando el bloque todavía está fuera de cuadro y llega a la vista ya
 * casi resuelta. En una pantalla de 812px son ~120px de ventaja, un cuarto de
 * segundo de scroll tranquilo — suficiente para que nada aparezca de la nada,
 * poco para que la animación se sienta desconectada del gesto.
 *
 * `once` evita que la sección vuelva a animarse al subir.
 */
export const REVEAL_VIEWPORT = {
  once: true,
  margin: "0px 0px 15% 0px",
} as const;

/** Transición de entrada, o un fade corto si se pidió reducir el movimiento. */
export function revealTransition(reduced: boolean, delay = 0): Transition {
  return reduced
    ? { duration: DURATION.reduced, delay: 0 }
    : { duration: DURATION.reveal, ease: EASE_AURA, delay };
}

/** Variantes de entrada estándar: sube `REVEAL_Y` y aparece. */
export function revealVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : REVEAL_Y },
    visible: { opacity: 1, y: 0 },
  };
}

/** Contenedor que escalona a sus hijos. Usar junto a `revealVariants`. */
export function staggerContainer(reduced: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : STAGGER_STEP,
      },
    },
  };
}

/** Hover y tap de un botón. Devuelve `undefined` si se pidió reducir. */
export function pressable(reduced: boolean) {
  if (reduced) return {};
  return {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: { duration: DURATION.micro, ease: EASE_AURA },
  };
}

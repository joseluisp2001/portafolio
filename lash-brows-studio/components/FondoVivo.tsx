"use client";

import { useEffect } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Estado, Seda } from "@/lib/seda";

/**
 * El recorrido del fondo: lo único de la landing que escucha el scroll.
 *
 * No pinta nada. Hace dos cosas:
 *
 * 1. Escribe cuatro números en la capa del fondo —`--desliz`, `--avance`,
 *    `--medio` y `--salida`— y el CSS los usa para que el aura deje de ser un
 *    bucle y pase a ser un viaje: la capa se corre con el scroll y el tono
 *    cambia de sección en sección.
 * 2. Enciende la seda del hero (`lib/seda.ts`), que llega por `import()` aparte
 *    y sólo cuando conviene. Cuando la seda pinta su primer cuadro, escribe
 *    `--seda: 1` y recién ahí el aura empieza a bajar.
 *
 * Por qué así:
 * - **Los números van en `.aura`, no en `<html>`.** Son propiedades registradas
 *   y heredadas: cambiarlas en la raíz obliga al navegador a recalcular el
 *   estilo heredado de TODA la página en cada cuadro. En la capa del fondo la
 *   invalidación se queda en quince nodos.
 * - **Un solo oyente**, pasivo y limitado a un `requestAnimationFrame`: el
 *   scroll dispara decenas de eventos por segundo y acá se escribe una vez por
 *   cuadro. `scrollHeight` —la única lectura que fuerza layout— se mide al
 *   montar y en cada `resize`, nunca en el camino del scroll.
 * - **Sin JavaScript no se rompe nada.** Los valores por omisión de las
 *   `@property` (0 / 1 / 1 / 0) son exactamente el fondo anterior.
 * - **Con `prefers-reduced-motion` no hace nada de nada**: ni recorrido ni
 *   seda. Y usa el hook del proyecto, que reacciona si la preferencia cambia
 *   con la página abierta —que es el caso normal, porque se enciende JUSTO
 *   porque algo se movió.
 */
export function FondoVivo() {
  const reducido = useReducedMotion();

  useEffect(() => {
    if (reducido) return;

    const aura = document.querySelector<HTMLElement>(".aura");
    const hueco = document.querySelector<HTMLElement>(".aura-seda");
    if (!aura) return;

    const estado: Estado = { salida: 0, velocidad: 0 };
    let pedido = 0;
    let anterior = Math.max(0, window.scrollY);
    let seda: Seda | null = null;
    let vivo = true;
    let alto = window.innerHeight || 1;
    let recorrido = 1;

    const medirPagina = () => {
      alto = window.innerHeight || 1;
      recorrido = Math.max(1, document.documentElement.scrollHeight - alto);
    };
    medirPagina();

    const escribir = () => {
      pedido = 0;
      /* Math.max(0, …) por el rebote elástico de iOS: en el tope de la página
         scrollY se va a negativo, y con él el deslizamiento se invertía y
         dejaba una franja sin fondo arriba de todo. */
      const y = Math.max(0, window.scrollY);

      /* avance: 0 arriba de todo, 1 al final de la página. Retira el blush.
         medio:  1 a mitad de camino y 0 en las dos puntas — le da el centro del
                 recorrido al rose. Con seno y no con una onda triangular: los
                 mismos tres valores, sin la esquina de la mitad.
         salida: 0 mientras se ve el hero, 1 cuando ya salió. Por acá pasa el
                 cruce aura/seda, que es el cambio más grande del viaje, así que
                 va con smoothstep: mismas puntas que una rampa recta —la tabla
                 de contraste no se mueve— pero entra y sale con derivada cero. */
      const avance = Math.min(1, y / recorrido);
      const medio = Math.sin(Math.PI * avance);
      const s = Math.min(1, y / (alto * 0.9));
      const salida = s * s * (3 - 2 * s);

      /* El deslizamiento va en píxeles y atado al scroll real, no al porcentaje
         de página: en la primera pantalla ya se corrió unos 60 px mientras el
         contenido se corrió 800, y eso sí se nota. Satura suave hacia medio
         viewport; con un Math.min duro el viaje se moría de golpe a un tercio
         de la página, con la velocidad pasando de 0.08 a 0 en un cuadro. */
      const tope = alto * 0.5;
      const desliz = tope * (1 - Math.exp((-y * 0.08) / tope));

      aura.style.setProperty("--desliz", desliz.toFixed(1));
      aura.style.setProperty("--avance", avance.toFixed(3));
      aura.style.setProperty("--medio", medio.toFixed(3));
      aura.style.setProperty("--salida", salida.toFixed(3));

      /* Velocidad con signo, acotada: es lo que dobla las hebras de la seda.
         Sin tope, un scroll de rueda las manda fuera de la pantalla. El freno
         que la devuelve a cero vive en el bucle de dibujo, que es el único que
         corre aunque nadie toque el scroll. */
      const bruta = y - anterior;
      anterior = y;
      estado.velocidad = Math.max(-60, Math.min(60, bruta));
      estado.salida = salida;
      if (seda) seda.despertar();
    };

    const alScroll = () => {
      if (!pedido) pedido = requestAnimationFrame(escribir);
    };
    const alRedimensionar = () => {
      medirPagina();
      alScroll();
    };

    escribir();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alRedimensionar, { passive: true });

    /* La seda: sólo si hay con qué. `saveData` y `deviceMemory` los declara el
       teléfono; iOS no manda deviceMemory, así que `undefined < 4` da falso y
       el iPhone sí la recibe, que es lo que se quiere. */
    const red = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    const memoria = (navigator as { deviceMemory?: number }).deviceMemory;
    const flaco =
      red?.saveData === true ||
      red?.effectiveType === "2g" ||
      red?.effectiveType === "slow-2g" ||
      (typeof memoria === "number" && memoria < 4);

    /* Nunca antes de que se levante la carga de marca: detrás del velo no se
       ve, y esos 1,8 s son justo cuando Next está hidratando el hero. */
    const yaVista = document.documentElement.dataset.intro === "visto";
    const demora = yaVista ? 300 : 2000;
    let temporizador = 0;

    if (hueco && !flaco) {
      temporizador = window.setTimeout(async () => {
        if (!vivo) return;
        try {
          const modulo = await import("@/lib/seda");
          if (!vivo) return;
          const api = modulo.arrancar(hueco, estado, () => {
            /* Recién con el primer cuadro pintado. `--seda` es lo que autoriza
               al aura a bajar al 30 %: si bajara antes, el hero quedaría más
               pálido que el fondo de siempre —9,7 puntos de luminancia— hasta
               que llegara el lienzo, y en una revisita eso se ve sin velo que
               lo tape. El CSS le pone una rampa de 600 ms. */
            aura.style.setProperty("--seda", "1");
          });
          if (!api) return;
          seda = api;
          if (window.location.hostname === "localhost") {
            /* Diagnóstico para medir el costo por cuadro desde el navegador.
               Sólo en local: no es una API del sitio. */
            (window as unknown as { __seda?: unknown }).__seda = api;
          }
        } catch {
          /* Si el trozo no llega, el fondo se queda como está: con --seda en 0
             el aura nunca baja y lo que se ve es el fondo de siempre. */
        }
      }, demora);
    }

    return () => {
      vivo = false;
      if (temporizador) clearTimeout(temporizador);
      if (pedido) cancelAnimationFrame(pedido);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
      seda?.detener();
      delete (window as unknown as { __seda?: unknown }).__seda;
      for (const prop of ["--desliz", "--avance", "--medio", "--salida", "--seda"]) {
        aura.style.removeProperty(prop);
      }
    };
  }, [reducido]);

  return null;
}

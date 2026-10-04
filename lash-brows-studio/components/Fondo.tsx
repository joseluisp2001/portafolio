/**
 * Fondo ambiental (aura).
 *
 * Una sola capa fija detrás de toda la landing: tres manchas de gradiente en
 * blush, rose y sand que se desplazan muy despacio, y ocho puntos de bokeh que
 * suben. Lo que se busca es que el cream deje de leerse plano; lo que NO se
 * busca es que alguien mire el fondo.
 *
 * Por qué así:
 * - **Sólo CSS.** Server Component sin `"use client"`: cero JavaScript al
 *   navegador. Comprobado sobre el build: `aura-mancha` sólo aparece en el
 *   CSS, en ningún chunk de `.next/static/chunks/*.js`. Una animación CSS además corre fuera del hilo principal, así que
 *   sigue fluida mientras Next hidrata el hero y el carrusel.
 * - **`position: fixed` y `pointer-events: none`.** No participa del layout, no
 *   recibe un solo toque y nunca puede quedar entre la clienta y el chat.
 * - **Sólo `transform` y `opacity`.** Nada que dispare layout o pintado.
 * - **Vaivén, no vuelta al inicio.** Cada capa va y viene (`alternate`), así el
 *   loop es continuo y no tiene costura: un `infinite` normal salta del último
 *   cuadro al primero y ese salto se ve.
 * - **La curva es `--ease-vaiven`, la segunda del sitio.** La del hover
 *   (`--ease-aura`) se come el 60 % del recorrido en los primeros 5 s y deja
 *   el fondo quieto el resto: medido, el 35 % del tiempo por debajo de 1 px/s.
 * - **Con `prefers-reduced-motion` queda quieto**, no desaparece: el mesh sigue
 *   ahí como degradado estático y el bokeh se esconde. Comprobado en el DOM: las
 *   tres manchas quedan en `transform: none`, o sea en su posición declarada.
 *   **De qué depende:** el bloque global de globals.css fuerza
 *   `animation-duration: 0.001ms` con `iteration-count: 1`, y lo que devuelve
 *   cada mancha a su sitio es que NO haya `animation-fill-mode`. Si alguien le
 *   pone `forwards` o `both`, quien pide movimiento reducido se queda con el
 *   ÚLTIMO cuadro y el fondo aparece corrido.
 * - **Sólo en la landing.** Lo monta `app/page.tsx`, no el layout: /manager
 *   comparte layout y es la herramienta de trabajo de Génesis.
 *
 * Los tonos son los de la paleta, sin colores nuevos. `rose` y `blush` acá son
 * relleno decorativo, que es el único uso que la paleta les permite: nunca
 * llevan texto encima (ver la nota del proyecto).
 */
export function Fondo() {
  /* Seis divs y ocho spans, todos vacíos: la capa, las tres manchas, el hueco
     de la seda, la caja del bokeh y sus ocho puntos. */
  return (
    <div className="aura" aria-hidden="true">
      <div className="aura-mancha aura-mancha--blush" />
      <div className="aura-mancha aura-mancha--rose" />
      <div className="aura-mancha aura-mancha--sand" />
      {/* El hueco de la seda del hero. Existe siempre, pero el <canvas> lo
          mete lib/seda.ts y sólo cuando el navegador y la conexión dan: sin
          JavaScript esto es un div vacío de pantalla completa en opacidad 0. */}
      <div className="aura-seda" />
      <div className="aura-bokeh">
        {/* Ocho puntos: las posiciones y los tiempos los reparte el CSS con
            nth-child, para no traer JavaScript por ocho divs vacíos. */}
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  );
}

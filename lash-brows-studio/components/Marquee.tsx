import { Sparkle } from "@/components/icons";
import { site } from "@/config/site";

/**
 * Banda de valores entre el hero y servicios.
 *
 * Es un Server Component a propósito: el movimiento es 100 % CSS
 * (`animate-marquee`, definido en globals.css), así que no hay estado, ni
 * eventos, ni un solo byte de JS que mandar al navegador. De yapa, el
 * `@media (prefers-reduced-motion: reduce)` de globals.css ya congela la
 * animación sin que este componente tenga que preguntar nada.
 */

/**
 * El aire entre ítems vive en el `pr` de cada `<li>` y NO en un `gap` del
 * contenedor. Así el ancho de la pista es exactamente la suma de sus hijos y
 * las dos copias miden lo mismo; con el gap afuera, el `-50%` del keyframe
 * caería a mitad de camino y el corte se notaría en cada vuelta.
 */
const ITEM_CLASSES =
  "flex shrink-0 items-center gap-4 pr-4 md:gap-6 md:pr-6";

const TRACK_CLASSES = "flex w-max shrink-0 items-center";

export function Marquee() {
  // Los mismos <li> se pintan en las dos copias: un elemento de React es un
  // descriptor inmutable, así que reutilizarlo no cuesta nada.
  const items = site.values.map((value) => (
    <li key={value} className={ITEM_CLASSES}>
      <span className="font-display text-lg tracking-[0.08em] whitespace-nowrap text-espresso md:text-xl">
        {value}
      </span>
      <Sparkle className="size-4 shrink-0 text-gold-ink md:size-5" />
    </li>
  ));

  return (
    <div className="border-y border-espresso/10 bg-sand py-5">
      {/* `overflow-hidden` contiene la pista — si no, hay scroll horizontal a
          375px — y `fade-sides` la desvanece contra los bordes. */}
      <div className="fade-sides overflow-hidden">
        <div className="flex w-max animate-marquee">
          {/* `role="list"` porque el reset de Tailwind quita el bullet y con él
              las semánticas de lista en VoiceOver. */}
          <ul role="list" className={TRACK_CLASSES}>
            {items}
          </ul>
          {/* La segunda pasada es puro relleno visual: el lector de pantalla ya
              escuchó los valores en la primera. */}
          <ul role="list" className={TRACK_CLASSES} aria-hidden="true">
            {items}
          </ul>
        </div>
      </div>
    </div>
  );
}

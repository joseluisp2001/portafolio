import { AboutImage } from "@/components/AboutImage";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/config/site";
import { STAGGER_STEP } from "@/lib/motion";

/**
 * "Sobre el estudio": la sección que compra confianza antes de pedir el tap.
 *
 * La foto va a la izquierda y el texto a la derecha porque la clienta ya viene
 * bajando de la galería: primero se le muestra la cabina real, después se le
 * cuenta cómo se trabaja. En móvil la imagen queda arriba por el mismo motivo,
 * que es además el orden natural del DOM (sin `order-*`, así el teclado y el
 * lector de pantalla recorren lo mismo que se ve).
 *
 * Es marcado puro: la animación vive dentro de <Reveal> y <CountUp>, que sí son
 * componentes de cliente.
 */
export function About() {
  return (
    <Section id="estudio" tone="sand">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          {/* `fill` sobre un contenedor con relación fija: la caja ya está
              reservada antes de que baje la imagen, así el CLS queda en cero. */}
          <AboutImage />
        </Reveal>

        <div>
          <SectionHeading
            eyebrow={site.about.eyebrow}
            title={site.about.title}
          />

          <Reveal
            delay={STAGGER_STEP}
            className="mt-6 space-y-4 text-body text-mocha"
          >
            {site.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>

          <Reveal delay={STAGGER_STEP * 2}>
            {/* `role="list"` porque al quitarle las viñetas, VoiceOver deja de
                anunciar la lista como tal. */}
            <ul
              role="list"
              className="mt-10 grid grid-cols-3 border-t border-espresso/10 pt-8"
            >
              {/*
                Los separadores verticales van como borde izquierdo de cada
                columna menos la primera (`first:border-l-0`). Antes eran tres
                celdas flotando con `gap`, y el conjunto se leía como una tabla
                a la que le faltaban las líneas; con el filete, se lee como tres
                datos de la misma ficha.
              */}
              {site.about.stats.map((stat) => (
                <li
                  key={stat.label}
                  className="border-l border-espresso/10 px-3 first:border-l-0 first:pl-0 sm:px-5 sm:first:pl-0"
                >
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="block"
                  />
                  <p className="mt-2 text-xs leading-snug tracking-[0.18em] text-mocha uppercase">
                    {stat.label}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

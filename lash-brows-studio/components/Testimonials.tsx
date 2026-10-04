import { Carrusel } from "@/components/Carrusel";
import { FormularioResena } from "@/components/FormularioResena";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { Stars } from "@/components/Stars";

/** Lo que el carrusel necesita de una reseña aprobada. */
export interface Testimonial {
  /** El de `lib/resenas.ts`. Es la clave de React: los nombres se repiten. */
  id: string;
  name: string;
  service: string;
  rating: number;
  text: string;
}

/**
 * Las reseñas de clientas, y el formulario para dejar una.
 *
 * Ya no lleva `"use client"`. Toda la mecánica del carrusel —refs, medir el
 * desplazamiento, encender las flechas— vivía acá adentro; el 8-9-2026 se sacó
 * a `components/Carrusel.tsx` al necesitar lo mismo en los servicios. Dos
 * copias del mismo carrusel en archivos distintos es exactamente el patrón que
 * más caro sale en este stack (ver la nota "Arreglos a medias" del vault), y
 * acá se podía evitar.
 *
 * El efecto secundario es bueno: esta sección volvió a ser marcado puro. Las
 * tarjetas de reseña no tienen estado ni movimiento propio, así que el único
 * JS que cruza al navegador es el del carrusel y el del formulario.
 */
export function Testimonials({ resenas }: { resenas: Testimonial[] }) {
  /*
    Las aprobadas llegan del servidor y son la ÚNICA fuente: no hay lista de
    respaldo en el config. Dos fuentes para lo mismo terminan en que el
    carrusel muestre una cantidad y el promedio del hero, otra.
  */
  const hayResenas = resenas.length > 0;

  /*
    LA SECCIÓN SE RENDERIZA SIEMPRE, aunque no haya ninguna reseña aprobada.

    Antes devolvía `null` cuando la lista venía vacía, y por eso el enlace
    "Reseñas" del menú tuvo que sacarse el 30-8-2026: apuntaba a un ancla que
    no existía. Ahora el ancla existe siempre porque acá vive también el
    formulario, así que el enlace del menú nunca lleva a la nada.

    Lo que sí desaparece es el carrusel: sin reseñas no se muestra una fila
    vacía ni un "todavía no hay reseñas" — se muestra la invitación a escribir
    la primera.
  */
  return (
    <Section id="resenas" tone="sand">
      <SectionHeading
        eyebrow={hayResenas ? "Lo que dicen" : "Tu opinión"}
        title={hayResenas ? "Reseñas" : "Contá cómo te fue"}
        align="center"
      />

      {/* Una sola entrada para todo el carrusel: si cada tarjeta tuviera la
          suya, las que empiezan fuera de pantalla a la derecha aparecerían de
          golpe recién al deslizar. */}
      {hayResenas && (
        <Reveal className="mt-14">
          {/* `tono="sand"` no es decorativo: los degradados de los bordes del
              carrusel tienen que partir del fondo de ESTA sección o se ve un
              rectángulo pegado encima. */}
          <Carrusel etiqueta="Reseñas de clientas" tono="sand">
            {resenas.map((testimonial) => (
              <figure
                /*
                  Por `id`, no por nombre. Los seis testimonios de relleno
                  tenían nombres distintos garantizados porque los escribió una
                  persona; estos los escriben las clientas, y dos "Mariana" son
                  cuestión de tiempo. Con la clave repetida React reusa la
                  tarjeta equivocada al aprobar o borrar una reseña.
                */
                key={testimonial.id}
                className="w-[85%] shrink-0 snap-start rounded-3xl border border-espresso/10 bg-cream p-7 shadow-soft sm:w-[46%] lg:w-[31.5%]"
              >
                <Stars rating={testimonial.rating} />
                <blockquote className="mt-5 text-body text-mocha">
                  «{testimonial.text}»
                </blockquote>
                <figcaption className="mt-6">
                  <p className="font-display text-lg text-espresso">
                    {testimonial.name}
                  </p>
                  {/* El servicio es opcional en el formulario ("No decirlo").
                      Sin esta guarda quedaba un párrafo vacío con su margen, y
                      la tarjeta se veía descolgada respecto a las demás. */}
                  {testimonial.service && (
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-rose-ink">
                      {testimonial.service}
                    </p>
                  )}
                </figcaption>
              </figure>
            ))}
          </Carrusel>
        </Reveal>
      )}

      {/*
        El formulario va DESPUÉS del carrusel y DENTRO de la misma sección.

        Después, porque primero se lee lo que escribieron otras y recién ahí se
        escribe. Y dentro, porque antes colgaba de un `<div>` suelto en
        `page.tsx`: se saltaba el ritmo vertical del sitio y, peor, rompía la
        costura entre secciones — el filete de 1px de globals.css se dibuja con
        `[data-tone] + [data-tone]`, así que un elemento en medio de dos
        secciones hace que la línea entre ellas no se pinte nunca.

        `max-w-xl` centrado: un formulario a 1152px de ancho tiene campos de
        texto en los que se pierde el ojo al volver de línea.
      */}
      <div className={hayResenas ? "mx-auto mt-16 max-w-xl" : "mx-auto mt-10 max-w-xl"}>
        <FormularioResena />
      </div>
    </Section>
  );
}

import { Carrusel } from "@/components/Carrusel";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
import { groupedServices, site } from "@/config/site";
import { formatPrice } from "@/lib/format";

/**
 * La vitrina del estudio.
 *
 * Es marcado puro a propósito: la sección se renderiza en el servidor y sólo
 * las tarjetas cruzan al cliente, que es donde de verdad hace falta JS
 * (movimiento y el click que se mide). Así el HTML de todos los servicios,
 * con sus precios, ya viene en la primera respuesta y lo lee Google.
 *
 * Va agrupada por categoría porque así está la carta del estudio y así la leen
 * las clientas en Instagram. Una grilla plana de diez tarjetas obligaría a
 * volver a aprender dónde está cada cosa.
 */
export function Services() {
  const grupos = groupedServices();

  /*
    Antes había acá un `indiceGlobal` que escalonaba la entrada de las tarjetas
    a lo largo de todas las categorías. Se quitó al pasar a carrusel: adentro
    las tarjetas ya no animan una por una —no pueden, ver `sinEntrada` en
    ServiceCard— así que el contador no ordenaba nada y sólo quedaba como un
    argumento que había que seguir pasando.
  */

  return (
    <Section id="servicios" tone="cream">
      <SectionHeading
        eyebrow="Lo que hacemos"
        title="Servicios"
        intro="Elegí el que va con tu mirada. Si no estás segura, escribinos y lo definimos juntas antes de agendar."
        align="center"
      />

      <div className="mt-16 space-y-20">
        {grupos.map(({ category, services }) => (
          <div key={category.slug}>
            <SectionHeading
              size="group"
              rule
              align="center"
              title={category.name}
              intro={category.description}
              className="mb-10"
            />

            {/*
              Una fila que se desliza, no una grilla que baja.

              Antes era una grilla `auto-fit` que en móvil ponía una tarjeta
              debajo de la otra: diez servicios eran diez pantallas de scroll
              vertical, y para llegar a Cejas había que pasar por todo lo demás.
              Con el carrusel cada categoría ocupa una sola línea y se recorre
              con el dedo.

              En escritorio entran tres, que es justo lo que mostraba la grilla,
              así que ahí se ve prácticamente igual que antes. Volumen y Efectos
              tienen dos servicios: no hay nada que desplazar y el carrusel no
              pinta flechas. Aquel comentario sobre "una fila de dos se lee como
              rota" dejó de aplicar — ya no hay columnas vacías que llenar.

              Cada tarjeta va envuelta en su propio ancho: `shrink-0` para que
              no se aplasten al no caber, `snap-start` para que el desplazamiento
              se detenga en el borde de una tarjeta y no a mitad de camino.
              El 85% en móvil es a propósito: se asoma un pedazo de la siguiente,
              que es lo que le dice a la clienta que hay más sin tener que
              escribirlo.
            */}
            <Reveal>
              <Carrusel etiqueta={`Servicios de ${category.name}`} tono="cream">
                {services.map((service) => (
                  <div
                    key={service.slug}
                    className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]"
                  >
                    {/* La entrada la hace el <Reveal> de arriba, una sola vez
                        para toda la fila. Ver el comentario del prop. */}
                    <ServiceCard service={service} sinEntrada />
                  </div>
                ))}
              </Carrusel>
            </Reveal>
          </div>
        ))}
      </div>

      {/* Los adicionales no son una cita: son una línea al pie, como en la
          carta. Darles tarjeta propia los pondría al mismo nivel visual que un
          set de pestañas, y no lo son. */}
      <Reveal className="mt-16">
        <div className="rounded-3xl border border-espresso/10 bg-sand px-7 py-6">
          <h3 className="font-display text-h3 text-espresso">Adicionales</h3>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {site.extras.map((extra) => (
              <li
                key={extra.slug}
                className="flex items-baseline gap-2 text-body text-mocha"
              >
                <span>{extra.name}</span>
                <span className="font-display text-lg text-espresso">
                  {formatPrice(extra.price, extra.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

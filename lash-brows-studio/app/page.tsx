import { About } from "@/components/About";
import { BookingForm } from "@/components/BookingForm";
import { Faq } from "@/components/Faq";
import { Fondo } from "@/components/Fondo";
import { FondoVivo } from "@/components/FondoVivo";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Intro } from "@/components/Intro";
import { JsonLd } from "@/components/JsonLd";
import { LocationHours } from "@/components/LocationHours";
import { Marquee } from "@/components/Marquee";
import { QuickLinks } from "@/components/QuickLinks";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { leerHorario } from "@/lib/horario-disco";
import { listar, resumen } from "@/lib/resenas";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { siteUrl } from "@/lib/site-url";

/**
 * La única ruta del sitio.
 *
 * Es un Server Component a propósito: no lleva "use client". Sólo los bloques
 * que de verdad necesitan JS (movimiento, formulario, visor) cruzan al
 * navegador; el resto llega como HTML ya armado. Eso es lo que hace que en un
 * 4G del centro de San José la página aparezca de una.
 *
 * El orden no es decorativo: cada sección resuelve una objeción antes del CTA.
 * Qué hacemos → cuánto vale → quién lo hace → cómo queda → quién lo dice →
 * cómo es el proceso → reservar.
 */
/* Se lee del disco en cada visita: las resenas se aprueban desde el panel y no
   hay build de por medio. */
export const dynamic = "force-dynamic";

export default async function Page() {
  const horario = await leerHorario();
  const aprobadas = await listar();
  const { promedio, cantidad } = await resumen();

  /* El carrusel es un componente en inglés de la primera versión del sitio; lo
     que sale del disco está en español. La traducción se hace acá, una sola vez,
     en vez de repartir `r.nombre`/`testimonial.name` por dentro del carrusel. */
  const paraElCarrusel = aprobadas.map((r) => ({
    id: r.id,
    name: r.nombre,
    service: r.servicio,
    rating: r.estrellas,
    text: r.comentario,
  }));

  return (
    <>
      {/* La carga de marca va acá y no en el layout: /manager comparte ese
          layout y es la herramienta de trabajo de Génesis, no una vitrina. */}
      <Intro />
      {/* Fondo ambiental. Es una capa fija en z-index -1: se pinta encima del
          cream del body y debajo de TODO el contenido, así que no depende del
          orden de los hermanos ni de que cada bloque sea `relative` (con z-0
          le caía encima al marquee, que no lo es). Igual que la carga de marca,
          vive acá y no en el layout, para que /manager no lo herede. */}
      <Fondo />
      {/* El recorrido del fondo: escribe --avance/--medio/--salida en la capa
          de arriba y enciende la seda del hero. No pinta nada. */}
      <FondoVivo />
      <JsonLd siteUrl={siteUrl.toString()} horario={horario} />
      <Header />
      {/* El ancla #inicio la pone el propio Hero; duplicar el id acá rompería
          la navegación del header y el HTML no sería válido. */}
      <main>
        <Hero promedio={promedio} cantidad={cantidad} horario={horario} />
        <Marquee />
        <Services />
        <About />
        <Gallery />
        {/* Trae adentro el formulario para dejar una reseña: son la misma
            sección (#resenas) y el mismo tema. */}
        <Testimonials resenas={paraElCarrusel} />
        <HowItWorks />
        <BookingForm horario={horario} />
        <LocationHours horario={horario} />
        <Faq />
        <QuickLinks />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}

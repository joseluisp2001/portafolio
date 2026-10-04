import { site } from "@/config/site";
import type { DiaHorario } from "@/lib/horario";
import { openingHoursSpecification } from "@/lib/hours";

interface JsonLdProps {
  /** URL canónica. Vive en la variable de entorno, no en el config. */
  siteUrl: string;
  /** El horario que Genesis puso en el panel: de aca sale lo que Google
   *  muestra como horario de atencion. */
  horario: DiaHorario[];
}

/**
 * Datos estructurados `BeautySalon` para Google.
 *
 * Es lo que hace que el estudio pueda salir en el panel lateral con horario,
 * dirección y rango de precios en vez de sólo como un enlace azul. Todo sale de
 * `config/site.ts`: cuando el dueño corrija la dirección o el horario, esto se
 * corrige solo.
 */
export function JsonLd({ siteUrl, horario }: JsonLdProps) {
  const { address, coords } = site.contact;

  const data = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteUrl}#estudio`,
    name: site.brand.name,
    description: site.brand.shortDescription,
    url: siteUrl,
    image: `${siteUrl}${site.about.image}`,
    telephone: `+${site.contact.whatsappNumber}`,
    /*
      El correo sólo se declara si existe. Está vacío desde el 8-9-2026 (ver
      `site.contact.email`), y publicar `email: ""` en el JSON-LD es peor que no
      publicarlo: Google lo lee como una propiedad declarada y sin valor.

      El `...( && {})` se expande a nada cuando la cadena está vacía, así que la
      clave desaparece del objeto en vez de quedar con un valor falso.
    */
    ...(site.contact.email ? { email: site.contact.email } : {}),
    priceRange: site.priceRange,
    currenciesAccepted: site.services[0].currency,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${address.line1}, ${address.line2}`,
      addressLocality: address.city,
      addressRegion: address.province,
      postalCode: address.postalCode,
      addressCountry: address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: coords.lat,
      longitude: coords.lng,
    },
    openingHoursSpecification: openingHoursSpecification(horario),
    sameAs: Object.values(site.social).filter(Boolean),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Servicios de ${site.brand.name}`,
      itemListElement: site.services.map((service) => ({
        "@type": "Offer",
        price: service.price,
        priceCurrency: service.currency,
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
        },
      })),
    },
  };

  /**
   * Se escapa `<` como < porque el navegador corta un <script> en cuanto
   * ve la secuencia `</script`, aunque venga dentro de una cadena JSON. Si
   * algún día un texto del config contiene HTML, sin esto se rompería la
   * página entera.
   */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

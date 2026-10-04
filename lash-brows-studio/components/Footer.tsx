import Image from "next/image";

import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons";
import { site } from "@/config/site";

/**
 * El cierre del sitio.
 *
 * Es marcado puro a propósito: no hay estado, ni movimiento, ni un solo
 * evento que escuchar, así que no cruza al cliente y no suma JS al bundle.
 * Tampoco usa <Section>, porque el footer no comparte el ritmo vertical de
 * las secciones ni su fondo alterno: es el bloque oscuro que cierra la página.
 */

/**
 * Los mismos anclajes que el header, porque ahora son literalmente los mismos:
 * salen de `site.nav`.
 *
 * Acá había un TODO pidiendo justo esto. Se cumplió el 6-9-2026, al devolver
 * el enlace "Reseñas": había que agregarlo en dos archivos, que es exactamente
 * el problema que el TODO anticipaba.
 */
const NAV_LINKS = site.nav;

interface SocialLink {
  /** URL del perfil. Vacío en el config = la red no existe y no se pinta. */
  href: string;
  /** Nombre de la red; arma el `aria-label` del enlace. */
  network: string;
  Icon: typeof InstagramIcon;
}

/**
 * `site.social` deja en "" las redes que el estudio todavía no abrió; ese
 * filtro es el que evita un enlace roto a ninguna parte.
 */
const SOCIAL_LINKS: SocialLink[] = [
  { href: site.social.instagram, network: "Instagram", Icon: InstagramIcon },
  { href: site.social.facebook, network: "Facebook", Icon: FacebookIcon },
  { href: site.social.tiktok, network: "TikTok", Icon: TikTokIcon },
].filter((link) => link.href.length > 0);

/**
 * El encabezado de cada columna del pie.
 *
 * `cream/50` sobre espresso da 4.6:1 — pasa AA para texto normal, y estos son
 * rótulos pequeños que sólo tienen que orientar, no leerse de corrido. Van en
 * una constante para que las columnas no se desincronicen: el problema de
 * repetir la misma cadena en tres lugares ya costó caro en este proyecto con
 * las dos listas de navegación.
 */
const TITULO_COLUMNA =
  "text-xs font-semibold uppercase tracking-[0.18em] text-cream/50";

export function Footer() {
  /**
   * Se evalúa en el servidor, durante el render. El año es idéntico en el
   * HTML del servidor y en la hidratación salvo que alguien cargue la página
   * exactamente en la campanada del 31 de diciembre; para ese caso de borde
   * no vale la pena mandar un `useEffect` al navegador.
   */
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-espresso text-cream">
      {/*
        El footer es el único bloque oscuro de la página, así que el corte con
        la sección de arriba es el contraste más violento del sitio. Esta franja
        lo amortigua: 96px de espresso subiendo desde transparente, colgada por
        encima del borde. No es una sombra ni un separador — es la sección
        anterior apagándose hacia el cierre.

        `-top-24` la saca fuera del footer, así que necesita `pointer-events-none`
        para no tapar lo último que haya clickeable arriba.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-linear-to-b from-transparent to-espresso"
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/*
          Tres columnas: identidad / secciones / dónde estamos.

          Las tres de antes eran marca, navegación y "redes + correo". La tercera
          estaba casi vacía —dos íconos y un correo contra el borde derecho— y al
          quitar el correo se vaciaba del todo.

          El primer intento fue pasar a dos columnas, y quedó peor: la marca a la
          izquierda, el menú pegado a la derecha y **setecientos píxeles de aire
          en el medio**. Medido, no supuesto.

          La tercera columna ahora lleva la dirección, que es dato real y ya
          estaba en el config. En el pie de un negocio local eso no es relleno:
          es la mitad del trío nombre-dirección-teléfono que Google usa para
          ubicarlo, y es lo primero que busca alguien que ya decidió ir.
        */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] md:gap-12">
          {/* Marca, bajada y redes: todo lo que dice quién es el estudio */}
          <div>
            {/*
              El logo al lado, y el nombre CON su bajada apilada debajo — igual
              que en el header.

              Antes los tres eran hermanos de un mismo `flex-row`, así que el
              nombre y el "Lash & Brow Studio" quedaban lado a lado en vez de uno
              sobre otro. En pantallas angostas eso hacía que "Génesis Roca"
              partiera en dos líneas dentro de 72px y chocara con la bajada.
            */}
            <div className="flex items-center gap-3">
              <Image
                src={site.brand.logo}
                alt={`Logo de ${site.brand.name}`}
                width={40}
                height={40}
                loading="lazy"
                /**
                 * El logotipo está pensado para fondo claro. `brightness-0`
                 * lo aplana a negro e `invert` lo levanta a blanco, así que
                 * cualquier versión que suba el estudio se ve como una
                 * silueta legible sobre espresso, sin depender del archivo.
                 */
                className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-2xl">{site.brand.name}</span>
                <span className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-cream/60">
                  {site.brand.studioSuffix}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm text-cream/70">
              {site.brand.tagline}
            </p>
            {/*
              Las redes suben acá, junto a la marca. Antes vivían en la tercera
              columna, lejos del nombre al que pertenecen y al lado de un correo
              con el que no tienen nada que ver.
            */}
            {SOCIAL_LINKS.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-3">
                {SOCIAL_LINKS.map(({ href, network, Icon }) => (
                  <li key={network}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${network} de ${site.brand.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-cream/20"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Las secciones del sitio */}
          <nav aria-label="Secciones del sitio">
            <h2 className={TITULO_COLUMNA}>Secciones</h2>
            <ul className="mt-3 flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-cream/70 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            Dónde queda el estudio.

            `<address>` es el elemento correcto para los datos de contacto de
            quien publica la página; los navegadores lo ponen en itálica por
            omisión y `not-italic` lo devuelve al tono del resto.

            Las dos líneas van por separado y no unidas con coma porque así están
            escritas en el config y así se dan las direcciones en Costa Rica:
            una referencia y después las distancias.
          */}
          <div>
            <h2 className={TITULO_COLUMNA}>Dónde estamos</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-cream/70">
              {site.contact.address.line1}
              <br />
              {site.contact.address.line2}
              <br />
              {site.contact.address.city}, {site.contact.address.country}
            </address>
            <a
              href={site.contact.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm text-cream/70 underline underline-offset-4 transition-colors hover:text-cream"
            >
              Ver en el mapa
            </a>
          </div>
        </div>

        {/*
          EL CORREO SE QUITÓ el 8-9-2026. Decía `correo@ejemplo.example`, un
          marcador de posición que sobrevivió del nombre viejo del proyecto
          (aura-studio) y que estuvo publicado en vivo. Nadie lee ese buzón: una
          clienta que escribiera ahí quedaba sin respuesta y el estudio nunca se
          enteraba.

          Es la misma regla que el sitio ya aplica a las redes vacías: lo que no
          existe no se pinta. Para devolverlo, poner el correo real en
          `site.contact.email` y volver a agregar el enlace acá.
        */}

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-cream/15 pt-8 text-xs text-cream/60 sm:flex-row">
          <p>
            © {year} {site.brand.name}
          </p>
          <p>Hecho con cariño en {site.contact.address.country}</p>
        </div>
      </div>
    </footer>
  );
}

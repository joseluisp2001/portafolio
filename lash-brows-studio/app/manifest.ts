import type { MetadataRoute } from "next";

import { site } from "@/config/site";

/**
 * Manifiesto para cuando alguien agrega el sitio a la pantalla de inicio.
 * `display: "browser"` a propósito: esto es una landing, no una app, y abrirla
 * sin barra de direcciones sólo confundiría.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.brand.name} — ${site.brand.tagline}`,
    short_name: site.brand.name,
    description: site.brand.shortDescription,
    start_url: "/",
    display: "browser",
    background_color: "#FAF6F2", // cream
    theme_color: "#FAF6F2",
    lang: "es-CR",
    icons: [
      {
        // TODO: reemplazar por el ícono real del estudio (512x512 PNG).
        src: site.brand.logo,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

/**
 * El sitio es una sola ruta con secciones ancladas, así que el sitemap tiene
 * una sola entrada. Las anclas (#servicios, #faq…) NO van: Google las trata
 * como la misma URL y listarlas sólo ensucia el informe de cobertura.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl.toString(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

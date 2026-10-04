import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return [
    { url: urlSitio + '/', lastModified: ahora, changeFrequency: 'monthly', priority: 1 },
    /* Prioridad alta: es la que tiene que salir cuando alguien busca
       "enfermera a domicilio hoy". */
    { url: urlSitio + '/hoy', lastModified: ahora, changeFrequency: 'weekly', priority: 0.9 },
    ...site.servicios.map((s) => ({
      url: urlSitio + '/servicios/' + s.slug,
      lastModified: ahora,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}

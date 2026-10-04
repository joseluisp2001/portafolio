import type { MetadataRoute } from 'next';
import { urlSitio } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return [
    { url: `${urlSitio}/`, lastModified: ahora, changeFrequency: 'monthly', priority: 1 },
    { url: `${urlSitio}/servicios`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.8 },
    /* Prioridad alta: es la que tiene que salir cuando alguien busca
       "veterinaria emergencia desamparados" a las 11 de la noche. */
    { url: `${urlSitio}/emergencias`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.9 },
  ];
}

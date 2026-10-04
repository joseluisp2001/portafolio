import type { MetadataRoute } from 'next';
import { articulos } from '@/lib/catalogo';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';

/*
  Cada articulo va en el sitemap. Son las paginas que traen gente de Google
  buscando una medida concreta, que es como se busca en ferreteria.
*/
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  return [
    { url: `${urlSitio}/`, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
    ...site.categorias.map((c) => ({
      url: `${urlSitio}/?cat=${c.id}`,
      lastModified: ahora,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...articulos.map((a) => ({
      url: `${urlSitio}/a/${a.codigo}`,
      lastModified: ahora,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}

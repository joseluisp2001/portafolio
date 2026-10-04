import type { MetadataRoute } from 'next';
import { urlSitio } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return [
    { url: urlSitio + '/', lastModified: ahora, changeFrequency: 'monthly', priority: 1 },
    { url: urlSitio + '/reservar', lastModified: ahora, changeFrequency: 'monthly', priority: 0.8 },
  ];
}

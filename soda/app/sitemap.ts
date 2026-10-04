import type { MetadataRoute } from 'next';
import { urlSitio } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return [
    { url: `${urlSitio}/`, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
    { url: `${urlSitio}/carta`, lastModified: ahora, changeFrequency: 'weekly', priority: 0.8 },
  ];
}

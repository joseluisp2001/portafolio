import type { MetadataRoute } from 'next';

/* Panel privado: nada se indexa. Tampoco hay sitemap. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}

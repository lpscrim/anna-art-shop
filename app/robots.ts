import type { MetadataRoute } from 'next';
import { getSiteUrl } from './_lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = new URL(getSiteUrl()).origin;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/purchase/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

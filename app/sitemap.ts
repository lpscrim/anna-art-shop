import type { MetadataRoute } from 'next';
import { getSiteUrl } from './_lib/siteUrl';
import { createServerSupabase } from './_lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = new URL(getSiteUrl()).origin;
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/work`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Pull latest product update date from Supabase if available
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from('products')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.updated_at) {
      // Update /work entry with actual last modified date
      entries[1].lastModified = new Date(data.updated_at);
    }
  } catch {
    // Silently fall back to current date
  }

  return entries;
}

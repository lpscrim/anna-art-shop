import { createServerSupabase } from '@/app/_lib/supabase';
import FeaturedClient from './FeaturedClient';

async function getFeaturedProducts() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, featured')
    .order('display_date', { ascending: false })
    .order('id', { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: String(p.id),
    name: p.name ?? '',
    featured: p.featured ?? false,
  }));
}

export default async function FeaturedPage() {
  const products = await getFeaturedProducts();
  return <FeaturedClient products={products} />;
}

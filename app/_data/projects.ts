import { createServerSupabase } from '@/app/_lib/supabase';

export interface Project {
  id: number;
  title: string;
  categories: string[];
  medium: string;
  dimensions: string;
  year: string;           // derived from display_date for display
  display_date: string;   // YYYY-MM-DD, controls sort order
  featured: boolean;
  imageUrl: string;       // Supabase Storage public URL
  galleryImages?: string[];
  text: string;
  price_hw: number;       // price in pence
  stock_level: number;
  stripe_price_id: string | null;
  type: 'artwork' | 'print';
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createServerSupabase();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('hidden', false)
    .order('display_date', { ascending: false })
    .order('id', { ascending: false });

  if (error || !products) {
    console.error('Failed to fetch products from Supabase:', error);
    return [];
  }

  const projects: Project[] = await Promise.all(
    products.map(async (product) => {
      // Fetch gallery images from Supabase Storage bucket
      const galleryImages = await fetchProductGalleryImages(
        supabase,
        product.id
      );

      return {
        id: product.id,
        title: (product.name ?? ''),
        categories: product.categories ?? [],
        medium: product.medium ?? '',
        dimensions: product.dimensions ?? '',
        display_date: product.display_date ?? new Date().toISOString().slice(0, 10),
        year: (product.display_date ?? product.year ?? new Date().toISOString()).slice(0, 4),
        featured: product.featured ?? false,
        imageUrl: product.image_url ?? '',
        ...(galleryImages.length > 0 && { galleryImages }),
        text: product.description ?? '',
        price_hw: product.price_hw ?? 0,
        stock_level: product.stock_level ?? 0,
        stripe_price_id: product.stripe_price_id ?? null,
        type: (product.type === 'print' ? 'print' : 'artwork') as 'artwork' | 'print',
      };
    })
  );

  return projects;
}

/**
 * List images in the `product-images/{productId}/` folder from
 * Supabase Storage and return their public URLs.
 */
async function fetchProductGalleryImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  productId: string
): Promise<string[]> {
  const bucket = 'product-images';
  const folder = `${productId}/`;

  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(folder, { sortBy: { column: 'name', order: 'asc' } });

  if (error || !files) return [];

  return files
    .filter((f: { name: string }) => !f.name.startsWith('.'))
    .map((f: { name: string }) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(`${folder}${f.name}`);
      return data.publicUrl;
    });
}

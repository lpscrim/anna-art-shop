import { createServerSupabase } from '@/app/_lib/supabase';
import { getAdminUser } from '@/app/_lib/adminAuth';
import EditProductClient from './EditProductClient';
import type { AdminProduct } from './types';

async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = createServerSupabase();
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price_hw, stock_level, categories, year, image_url, stripe_product_id, stripe_price_id')
    .order('id', { ascending: true });

  if (error || !products) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  const adminProducts: AdminProduct[] = await Promise.all(
    products.map(async (product) => {
      const folder = `${product.id}/`;
      const { data: files } = await supabase.storage
        .from('product-images')
        .list(folder, { sortBy: { column: 'name', order: 'asc' } });

      const gallery = (files ?? [])
        .filter((f) => !f.name.startsWith('.'))
        .map((f) => {
          const path = `${folder}${f.name}`;
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
          return { path, url: urlData.publicUrl };
        });

      return {
        id: String(product.id),
        name: product.name ?? '',
        description: product.description ?? '',
        price_hw: product.price_hw ?? 0,
        stock_level: product.stock_level ?? 0,
        categories: product.categories ?? [],
        year: product.year ?? new Date().getFullYear().toString(),
        image_url: product.image_url ?? '',
        stripe_product_id: product.stripe_product_id ?? null,
        stripe_price_id: product.stripe_price_id ?? null,
        gallery,
      };
    })
  );

  return adminProducts;
}

export default async function EditProductPage() {
  const user = await getAdminUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-16">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl tracking-tight mb-4">EDIT PRODUCT</h1>
          <p className="text-sm text-muted-foreground">Sign in to access admin tools.</p>
        </div>
      </div>
    );
  }
  const products = await getAdminProducts();
  return <EditProductClient products={products} />;
}

'use server';

import { createServerSupabase } from '@/app/_lib/supabase';
import { requireAdminUser } from '@/app/_lib/adminAuth';
import { revalidatePath } from 'next/cache';

export interface UpdateFeaturedState {
  success: boolean;
  error?: string;
}

export async function updateFeatured(
  _prev: UpdateFeaturedState,
  formData: FormData
): Promise<UpdateFeaturedState> {
  try {
    await requireAdminUser();
    const supabase = createServerSupabase();

    // Get all product IDs
    const { data: all, error: fetchError } = await supabase
      .from('products')
      .select('id');

    if (fetchError || !all) {
      return { success: false, error: 'Failed to fetch products.' };
    }

    const selectedIds = new Set(formData.getAll('featured') as string[]);

    // Bulk update: set featured = true for selected, false for all others
    const updates = all.map((p) => ({
      id: p.id,
      featured: selectedIds.has(String(p.id)),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ featured: update.featured })
        .eq('id', update.id);
      if (error) {
        return { success: false, error: `Failed to update product ${update.id}: ${error.message}` };
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/featured');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/app/_lib/supabase';

export async function updateShippingRate(pence: number) {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error('Invalid shipping rate');
  }
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'shipping_rate_pence', value: String(pence) }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
}

export async function updateCategoriesVisible(visible: boolean) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'categories_visible', value: String(visible) }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
  revalidatePath('/work');
}

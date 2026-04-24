'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/app/_lib/supabase';
import { requireAdminUser } from '@/app/_lib/adminAuth';

async function upsertSetting(key: string, pence: number) {
  await requireAdminUser();
  if (!Number.isInteger(pence) || pence < 0) throw new Error('Invalid shipping rate');
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: String(pence) }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
}

export async function updatePrintShippingRate(pence: number) {
  await upsertSetting('print_shipping_rate_pence', pence);
}

export async function updateArtworkShippingRate(pence: number) {
  await upsertSetting('artwork_shipping_rate_pence', pence);
}

/** @deprecated kept for compatibility */
export async function updateShippingRate(pence: number) {
  await updateArtworkShippingRate(pence);
}

export async function updateCategoriesVisible(visible: boolean) {
  await requireAdminUser();
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'categories_visible', value: String(visible) }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
  revalidatePath('/work');
}

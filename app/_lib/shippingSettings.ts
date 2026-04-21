import { createServerSupabase } from './supabase';

export async function getShippingRatePence(): Promise<number> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'shipping_rate_pence')
    .single();
  return data ? parseInt(data.value, 10) : 0;
}

export async function getCategoriesVisible(): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'categories_visible')
    .single();
  // default to true if not set
  return data ? data.value !== 'false' : true;
}

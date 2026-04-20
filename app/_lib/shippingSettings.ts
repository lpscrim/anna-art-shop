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

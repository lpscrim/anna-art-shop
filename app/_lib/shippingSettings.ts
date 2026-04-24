import { createServerSupabase } from './supabase';

export interface ShippingRates {
  /** Rate for orders containing only prints (pence) */
  printRate: number;
  /** Rate for orders containing any artwork/painting (pence) */
  artworkRate: number;
}

export async function getShippingRates(): Promise<ShippingRates> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['print_shipping_rate_pence', 'artwork_shipping_rate_pence']);

  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  return {
    printRate: map.has('print_shipping_rate_pence') ? parseInt(map.get('print_shipping_rate_pence')!, 10) : 0,
    artworkRate: map.has('artwork_shipping_rate_pence') ? parseInt(map.get('artwork_shipping_rate_pence')!, 10) : 0,
  };
}

/** Returns the applicable shipping rate in pence given the item types in the order. */
export function resolveShippingRate(rates: ShippingRates, itemTypes: string[]): number {
  const hasArtwork = itemTypes.some((t) => t !== 'print');
  return hasArtwork ? rates.artworkRate : rates.printRate;
}

/** @deprecated Use getShippingRates + resolveShippingRate instead */
export async function getShippingRatePence(): Promise<number> {
  const rates = await getShippingRates();
  return rates.artworkRate;
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

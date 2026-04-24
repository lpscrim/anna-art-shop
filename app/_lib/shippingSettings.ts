import { createServerSupabase } from './supabase';

export interface ShippingRates {
  /** Rate for orders containing only prints (pence) */
  printRate: number;
  /** Rate for orders containing any artwork/painting (pence) */
  artworkRate: number;
}

export type ShippingRegion = 'gb' | 'eu' | 'international';

export const ALLOWED_COUNTRIES: Record<ShippingRegion, string[]> = {
  gb: ['GB'],
  eu: [
    'GB', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
    'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'IS',
  ],
  international: [
    'GB', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
    'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'IS',
    'US', 'CA', 'AU', 'NZ', 'JP', 'SG', 'HK', 'AE', 'SA',
  ],
};

export async function getShippingRegion(): Promise<ShippingRegion> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'shipping_region')
    .single();
  const val = data?.value;
  if (val === 'eu' || val === 'international') return val;
  return 'gb';
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
  return data ? data.value !== 'false' : true;
}

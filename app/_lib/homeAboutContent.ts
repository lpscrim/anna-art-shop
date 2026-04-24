import { createServerSupabase } from './supabase';

export interface HomeAboutContent {
  text: string;
  images: string[];
}

export const HOME_ABOUT_DEFAULTS: HomeAboutContent = {
  text: 'Anna Maia Zaitseva (b. 1994) is an artist based in Edinburgh, Scotland. Her work explores embodied representations of landscape shaped by a long-term engagement with the Scottish Highlands.',
  images: ['/ANNA.webp', '/art123.webp', '/About1_sm.webp', '/About2_sm.webp', '/About3_sm.webp'],
};

export async function getHomeAboutContent(): Promise<HomeAboutContent> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['home_about_text', 'home_about_images']);

    const map = new Map((data ?? []).map((r) => [r.key, r.value]));

    const text = map.get('home_about_text') ?? HOME_ABOUT_DEFAULTS.text;
    let images: string[] = HOME_ABOUT_DEFAULTS.images;
    if (map.has('home_about_images')) {
      try {
        images = JSON.parse(map.get('home_about_images')!);
      } catch {
        // fallback to defaults
      }
    }

    return { text, images };
  } catch {
    return HOME_ABOUT_DEFAULTS;
  }
}

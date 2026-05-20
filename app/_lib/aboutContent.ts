import { createServerSupabase } from './supabase';

export interface Exhibition {
  year: string;
  title: string;
  location: string;
  type: 'solo' | 'group';
}

export interface EducationItem {
  year: string;
  qualification: string;
  institution: string;
  visible?: boolean;
}

export interface ResidencyItem {
  year: string;
  title: string;
  location: string;
  visible?: boolean;
}

export interface Award {
  year: string;
  title: string;
  visible?: boolean;
}

export interface PressItem {
  year: string;
  title: string;
  publication: string;
  url?: string;
  visible?: boolean;
}

export interface AboutContent {
  statement: string;
  bio: string;
  portrait_url: string;
  exhibitions: Exhibition[];
  education: EducationItem[];
  residencies: ResidencyItem[];
  awards: Award[];
  press: PressItem[];
  gallery_images: string[];
}

const defaults: AboutContent = {
  statement: '',
  bio: '',
  portrait_url: '',
  exhibitions: [],
  education: [],
  residencies: [],
  awards: [],
  press: [],
  gallery_images: [],
};

function normalizeVisible<T extends { visible?: boolean }>(items: T[] | null | undefined): T[] {
  return (items ?? []).map((item) => ({
    ...item,
    visible: item.visible !== false,
  }));
}

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from('about_content')
      .select('statement, bio, portrait_url, exhibitions, education, residencies, awards, press, gallery_images')
      .eq('id', 1)
      .single();

    if (!data) return defaults;
    return {
      statement: data.statement ?? '',
      bio: data.bio ?? '',
      portrait_url: data.portrait_url ?? '',
      exhibitions: (data.exhibitions as Exhibition[]) ?? [],
      education: normalizeVisible((data.education as EducationItem[]) ?? []),
      residencies: normalizeVisible((data.residencies as ResidencyItem[]) ?? []),
      awards: normalizeVisible((data.awards as Award[]) ?? []),
      press: normalizeVisible((data.press as PressItem[]) ?? []),
      gallery_images: (data.gallery_images as string[]) ?? [],
    };
  } catch {
    return defaults;
  }
}

import { supabase } from "@/integrations/supabase/client";

export type SiteAd = {
  id: string;
  heading: string;
  tagline: string | null;
  link_url: string;
  image_urls: string[];
  video_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ResolvedAd = Omit<SiteAd, "image_urls" | "video_url"> & {
  images: string[]; // signed URLs ready to render
  video: string | null;
};

async function signOne(path: string): Promise<string | null> {
  // Accept either a storage path or an already-absolute URL.
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return path;
  const { data } = supabase.storage.from("ads").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchActiveAds(): Promise<ResolvedAd[]> {
  const { data, error } = await supabase
    .from("site_ads")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  const ads = data as SiteAd[];
  const resolved = await Promise.all(
    ads.map(async (a) => {
      const images = (
        await Promise.all((a.image_urls ?? []).map((p) => signOne(p)))
      ).filter((u): u is string => !!u);
      const video = a.video_url ? await signOne(a.video_url) : null;
      return {
        id: a.id,
        heading: a.heading,
        tagline: a.tagline,
        link_url: a.link_url,
        is_active: a.is_active,
        sort_order: a.sort_order,
        images,
        video,
      };
    }),
  );
  return resolved;
}

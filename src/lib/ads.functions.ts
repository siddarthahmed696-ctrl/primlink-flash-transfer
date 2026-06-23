import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";
import type { ResolvedAd, SiteAd } from "@/lib/ads";

type SbClient = ReturnType<typeof import("@supabase/supabase-js").createClient<Database>>;

async function signAdsPath(supabase: SbClient, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return path; // absolute site path (e.g. /__l5e/...)
  const { data } = await supabase.storage.from("ads").createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export const listActiveAdsSigned = createServerFn({ method: "GET" }).handler(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

  if (!SUPABASE_URL || !PUBLISHABLE_KEY) return [] satisfies ResolvedAd[];

  const { createClient } = await import("@supabase/supabase-js");
  const supabasePublic = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabasePublic
    .from("site_ads")
    .select("id,heading,tagline,link_url,image_urls,video_url,is_active,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [] satisfies ResolvedAd[];

  const ads = data as SiteAd[];
  return Promise.all(
    ads.map(async (ad) => {
      const images = (
        await Promise.all((ad.image_urls ?? []).map((path) => signAdsPath(supabasePublic, path)))
      ).filter((url): url is string => !!url);
      const video = ad.video_url ? await signAdsPath(supabasePublic, ad.video_url) : null;
      return {
        id: ad.id,
        heading: ad.heading,
        tagline: ad.tagline,
        link_url: ad.link_url,
        is_active: ad.is_active,
        sort_order: ad.sort_order,
        images,
        video,
      } satisfies ResolvedAd;
    }),
  );
});

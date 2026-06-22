import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";
import type { ResolvedAd, SiteAd } from "@/lib/ads";

async function signAdsPath(supabaseUrl: string, serviceKey: string, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const resp = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/ads/${path.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 * 60 * 6 }),
    },
  );
  if (!resp.ok) return null;
  const signed = (await resp.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = signed.signedURL || signed.signedUrl;
  return signedPath ? `${supabaseUrl}/storage/v1${signedPath}` : null;
}

export const listActiveAdsSigned = createServerFn({ method: "GET" }).handler(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_KEY) return [] satisfies ResolvedAd[];

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
        await Promise.all((ad.image_urls ?? []).map((path) => signAdsPath(SUPABASE_URL, SERVICE_KEY, path)))
      ).filter((url): url is string => !!url);
      const video = ad.video_url ? await signAdsPath(SUPABASE_URL, SERVICE_KEY, ad.video_url) : null;
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
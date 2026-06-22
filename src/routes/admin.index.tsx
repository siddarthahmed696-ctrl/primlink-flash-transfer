import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateAdMetadata } from "@/lib/admin.functions";
import {
  Activity,
  ImagePlus,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin · V Move You" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPanel,
});

type Ad = {
  id: string;
  heading: string;
  tagline: string | null;
  link_url: string;
  image_urls: string[];
  video_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

function normalizeUrl(value: string, fallback: string) {
  const trimmed = value.trim() || fallback;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function AdminPanel() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [live, setLive] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        nav({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        await supabase.auth.signOut();
        nav({ to: "/admin/login" });
        return;
      }
      setChecking(false);
      await loadAds();
      await refreshLive();
    })();
  }, [nav]);

  async function loadAds() {
    const { data } = await supabase
      .from("site_ads")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setAds((data as Ad[]) ?? []);
  }

  async function refreshLive() {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", since);
    setLive(count ?? 0);
  }

  // Realtime + interval refresh for live count
  useEffect(() => {
    if (checking) return;
    const ch = supabase
      .channel("admin-visitors")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitors" }, () =>
        refreshLive(),
      )
      .subscribe();
    const id = setInterval(refreshLive, 15_000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(id);
    };
  }, [checking]);

  async function toggleActive(ad: Ad) {
    await supabase.from("site_ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
    loadAds();
  }
  async function deleteAd(ad: Ad) {
    if (!confirm(`Delete "${ad.heading}"?`)) return;
    // best effort: clean storage too
    const paths = [...ad.image_urls, ad.video_url].filter(
      (p): p is string => !!p && !/^https?:\/\//.test(p),
    );
    if (paths.length) await supabase.storage.from("ads").remove(paths);
    await supabase.from("site_ads").delete().eq("id", ad.id);
    loadAds();
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-white">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/admin" className="font-display font-bold">
            V Move You <span className="text-primary">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-white/80">
                <span className="font-semibold">{live}</span> live visitor{live === 1 ? "" : "s"}
              </span>
            </div>
            <Link to="/" className="text-xs text-white/60 hover:text-white">
              View site
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                nav({ to: "/admin/login" });
              }}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
            >
              <LogOut className="size-3" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Activity className="size-4" />}
            label="Live visitors (last 60 s)"
            value={String(live)}
          />
          <StatCard
            icon={<ImagePlus className="size-4" />}
            label="Total ads"
            value={String(ads.length)}
          />
          <StatCard
            icon={<Video className="size-4" />}
            label="Active ads"
            value={String(ads.filter((a) => a.is_active).length)}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-4">New ad</h2>
          <AdForm onSaved={loadAds} />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-4">All ads</h2>
          <div className="space-y-3">
            {ads.length === 0 && (
              <p className="text-sm text-white/60">No ads yet. Create your first one above.</p>
            )}
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{ad.heading}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ad.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {ad.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    {ad.tagline && <p className="text-xs text-white/60 truncate">{ad.tagline}</p>}
                    <p className="text-[11px] text-white/50 truncate mt-0.5">→ {ad.link_url}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {ad.image_urls.length} image{ad.image_urls.length === 1 ? "" : "s"}
                      {ad.video_url ? " · 1 video" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId(editingId === ad.id ? null : ad.id)}
                    className="text-xs px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/5"
                  >
                    {editingId === ad.id ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => toggleActive(ad)}
                    className="text-xs px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/5"
                  >
                    {ad.is_active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteAd(ad)}
                    className="text-xs px-3 py-1.5 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10 inline-flex items-center gap-1"
                  >
                    <Trash2 className="size-3" /> Delete
                  </button>
                </div>
                {editingId === ad.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <AdEditForm
                      ad={ad}
                      onSaved={() => {
                        setEditingId(null);
                        loadAds();
                      }}
                    />
                  </div>
                )}
              </div>
            ))}


          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-2 text-white/60 text-xs">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function AdForm({ onSaved }: { onSaved: () => void }) {
  const [heading, setHeading] = useState("");
  const [tagline, setTagline] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  function pickImages(list: FileList | null) {
    if (!list) return;
    const next = [...images, ...Array.from(list)].slice(0, 20);
    setImages(next);
  }


  async function save() {
    if (images.length < 1) return toast.error("Upload at least 1 image");

    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const imagePaths: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const f = images[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${id}/img-${i}.${ext}`;
        const { error } = await supabase.storage.from("ads").upload(path, f, {
          cacheControl: "3600",
          upsert: true,
        });
        if (error) throw error;
        imagePaths.push(path);
      }
      let videoPath: string | null = null;
      if (video) {
        const ext = (video.name.split(".").pop() || "mp4").toLowerCase();
        videoPath = `${id}/video.${ext}`;
        const { error } = await supabase.storage.from("ads").upload(videoPath, video, {
          cacheControl: "3600",
          upsert: true,
        });
        if (error) throw error;
      }
      const { error: insErr } = await supabase.from("site_ads").insert({
        heading: heading.trim() || "Inspection",
        tagline: tagline.trim() || null,
        link_url: normalizeUrl(link, "https://primlink.com"),
        image_urls: imagePaths,
        video_url: videoPath,
        is_active: true,
      });
      if (insErr) throw insErr;
      toast.success("Images saved");

      setHeading("");
      setTagline("");
      setLink("");
      setImages([]);
      setVideo(null);
      onSaved();
    } catch (e: any) {
      console.error(e);
      const name = e?.name || e?.constructor?.name || "Error";
      const msg = e?.message || String(e);
      const status = e?.status ?? e?.statusCode ?? "";
      const details = [name, msg, status ? `Status ${status}` : null].filter(Boolean).join(" · ");
      toast.error(`Could not save ad: ${details}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Heading (e.g. Build faster with V Move You)"
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Destination link (https://...)"
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Tagline (optional)"
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Inspection images (1–20)
          </label>
          <div
            onClick={() => imgRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-white/15 rounded-lg p-4 text-center text-xs text-white/60 hover:bg-white/5"
          >
            <Plus className="size-4 mx-auto mb-1" />
            Click to add images ({images.length}/20)
          </div>

          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => pickImages(e.target.files)}
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((f, i) => (
                <div
                  key={i}
                  className="relative size-16 rounded-md overflow-hidden border border-white/10 group"
                >
                  <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 bg-black/70 text-white p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-white/70 block mb-1">Video (optional, max 1)</label>
          <div
            onClick={() => vidRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-white/15 rounded-lg p-4 text-center text-xs text-white/60 hover:bg-white/5"
          >
            <Video className="size-4 mx-auto mb-1" />
            {video ? video.name : "Click to add a video"}
          </div>
          <input
            ref={vidRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
          />
          {video && (
            <button
              onClick={() => setVideo(null)}
              className="mt-2 text-[11px] text-red-300 hover:text-red-200"
            >
              Remove video
            </button>
          )}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save ad
      </button>
    </div>
  );
}

function AdEditForm({ ad, onSaved }: { ad: Ad; onSaved: () => void }) {
  const updateAd = useServerFn(updateAdMetadata);
  const [heading, setHeading] = useState(ad.heading);
  const [tagline, setTagline] = useState(ad.tagline ?? "");
  const [link, setLink] = useState(ad.link_url);
  const [existingImages, setExistingImages] = useState<string[]>(ad.image_urls);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(ad.video_url);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  // Resolve previews for existing storage-path images
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const p of existingImages) {
        if (/^https?:\/\//.test(p)) {
          map[p] = p;
        } else {
          const { data } = await supabase.storage.from("ads").createSignedUrl(p, 60 * 60);
          if (data?.signedUrl) map[p] = data.signedUrl;
        }
      }
      if (!cancelled) setPreviews(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [existingImages]);

  async function save() {
    if (existingImages.length === 0 && newImages.length === 0) {
      return toast.error("Keep at least 1 image");
    }
    setSaving(true);
    try {
      const addedPaths: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const f = newImages[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${ad.id}/img-${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from("ads").upload(path, f, {
          cacheControl: "3600",
          upsert: true,
        });
        if (error) throw error;
        addedPaths.push(path);
      }

      let videoPath: string | null = existingVideo;
      if (newVideo) {
        const ext = (newVideo.name.split(".").pop() || "mp4").toLowerCase();
        videoPath = `${ad.id}/video-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("ads").upload(videoPath, newVideo, {
          cacheControl: "3600",
          upsert: true,
        });
        if (error) throw error;
      }

      // Remove images that the admin dropped (only storage paths, not external URLs)
      const removed = ad.image_urls.filter(
        (p) => !existingImages.includes(p) && !/^https?:\/\//.test(p),
      );
      if (removed.length) await supabase.storage.from("ads").remove(removed);

      await updateAd({
        data: {
          id: ad.id,
          heading: heading.trim() || ad.heading,
          tagline: tagline.trim() || null,
          link_url: normalizeUrl(link, ad.link_url),
          image_urls: [...existingImages, ...addedPaths],
          video_url: videoPath,
        },
      });

      toast.success("Ad updated");
      onSaved();
    } catch (e: any) {
      console.error(e);
      const name = e?.name || e?.constructor?.name || "Error";
      const msg = e?.message || String(e);
      const status = e?.status ?? e?.statusCode ?? "";
      const details = [name, msg, status ? `Status ${status}` : null].filter(Boolean).join(" · ");
      toast.error(`Could not update ad: ${details}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Heading"
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Destination link"
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Tagline"
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
      />

      <div>
        <label className="text-xs text-white/70 block mb-1">Images</label>
        <div className="flex flex-wrap gap-2">
          {existingImages.map((p) => (
            <div
              key={p}
              className="relative size-16 rounded-md overflow-hidden border border-white/10"
            >
              {previews[p] ? (
                <img src={previews[p]} alt="" className="size-full object-cover" />
              ) : (
                <div className="size-full bg-white/5" />
              )}
              <button
                onClick={() => setExistingImages(existingImages.filter((x) => x !== p))}
                className="absolute top-0 right-0 bg-black/70 text-white p-0.5"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {newImages.map((f, i) => (
            <div
              key={i}
              className="relative size-16 rounded-md overflow-hidden border border-primary/40"
            >
              <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
              <button
                onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))}
                className="absolute top-0 right-0 bg-black/70 text-white p-0.5"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => imgRef.current?.click()}
            className="size-16 rounded-md border-2 border-dashed border-white/15 text-white/60 hover:bg-white/5 grid place-items-center"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            setNewImages([...newImages, ...Array.from(e.target.files)]);
            e.target.value = "";
          }}
        />
      </div>

      <div>
        <label className="text-xs text-white/70 block mb-1">Video</label>
        <div className="flex items-center gap-2 flex-wrap">
          {existingVideo && !newVideo && (
            <span className="text-xs text-white/70 inline-flex items-center gap-2 px-2 py-1 rounded border border-white/10">
              <Video className="size-3" /> current video
              <button
                onClick={() => setExistingVideo(null)}
                className="text-red-300 hover:text-red-200"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {newVideo && (
            <span className="text-xs text-white/70 inline-flex items-center gap-2 px-2 py-1 rounded border border-primary/40">
              <Video className="size-3" /> {newVideo.name}
              <button onClick={() => setNewVideo(null)} className="text-red-300 hover:text-red-200">
                <X className="size-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => vidRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/5"
          >
            {existingVideo || newVideo ? "Replace video" : "Add video"}
          </button>
        </div>
        <input
          ref={vidRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setNewVideo(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </button>
    </div>
  );
}


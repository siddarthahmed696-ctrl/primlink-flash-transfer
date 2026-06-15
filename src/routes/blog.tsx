import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Primlink" },
      {
        name: "description",
        content:
          "Guides, product news and deep dives from the Primlink team on sending big files, security and Primlink.",
      },
    ],
  }),
  component: BlogPage,
});

const posts = [
  {
    title: "Welcome to Primlink — file sharing without friction",
    date: "June 12, 2026",
    read: "4 min read",
    body: [
      "Primlink was built on a single idea: sending a large file to another human should not require an account, a credit card or a download client. You drop your files, you get a link, you share it. That's it.",
      "Behind the simple front door is a serious pipeline. Every transfer is uploaded in resumable chunks straight to Primlink's edge storage, so a flaky coffee-shop Wi-Fi connection won't cost you a 9 GB re-upload. Each link is unique, expirable and revocable from your browser.",
      "We give every visitor 10 GB per transfer for free — five times what most legacy tools offer on their free tier — and we don't gate downloads behind ads, banners or signup walls. Recipients click, they get the file.",
    ],
  },
  {
    title: "Why we built Primlink",
    date: "June 10, 2026",
    read: "3 min read",
    body: [
      "Most file-sharing tools have quietly become subscription funnels. The free tier shrinks, the ads grow, the recipient experience gets worse. We wanted to flip that.",
      "Primlink is sponsored by Primlink — the platform that powers our infrastructure. That sponsorship is the entire business model. No upsells inside the product, no dark patterns, no email harvesting. The Primlink panel you see while uploading is the ad — that is what keeps the lights on.",
      "If you like what Primlink does, click through. If you don't, just send your file. Both work.",
    ],
  },
  {
    title: "Tips for sending huge files",
    date: "June 5, 2026",
    read: "5 min read",
    body: [
      "Compress smart. ZIP is universal but slow; for media-heavy folders, 7z or tar.zst usually wins. Skip compression entirely for already-compressed formats (MP4, JPG, PDF) — you'll save CPU time with no size benefit.",
      "Group by recipient, not by topic. One link per person beats one link with eight files and a confused recipient. Primlink lets you set a title and a short message per transfer to keep context attached.",
      "Always include a sender email. It's optional, but it lets the recipient reply if a file is corrupted or out of date.",
      "If you're sending sensitive material, share the link over a different channel than the password. Don't put both in the same email.",
    ],
  },
  {
    title: "How resumable uploads actually work",
    date: "May 28, 2026",
    read: "6 min read",
    body: [
      "When you upload a 10 GB file, Primlink doesn't send it as one giant HTTP request. It's split into chunks (typically 6 MB each), uploaded in parallel, and reassembled on the server.",
      "Each chunk's progress is tracked locally in your browser. If your connection drops, only the in-flight chunks need to be retried — not the entire transfer. When you reopen the tab, the upload picks up where it left off.",
      "This is the same protocol (tus) used by professional video pipelines. We use it because it's the only honest way to ship 10 GB over a real-world internet connection.",
    ],
  },
  {
    title: "Security, plainly: what Primlink does and doesn't see",
    date: "May 20, 2026",
    read: "4 min read",
    body: [
      "Your files travel over TLS from your browser to our edge, and they sit at rest encrypted on the storage layer. Share links are random 12-character codes, so they're effectively unguessable.",
      "We don't scan the content of your transfers, we don't index them, and we don't sell them. We log standard request metadata (timestamps, sizes, IPs) for abuse prevention and we expire it on a schedule.",
      "If you need stronger guarantees — end-to-end encryption, expiring passwords, audit trails — the Primlink platform offers them for teams. Primlink remains the free, no-account front door.",
    ],
  },
];

function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
        <header>
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-2">
            News, guides and engineering notes from the Primlink team.
          </p>
        </header>
        <div className="mt-10 space-y-8">
          {posts.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{p.date}</span>
                <span>·</span>
                <span>{p.read}</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{p.title}</h2>
              <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">
                {p.body.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

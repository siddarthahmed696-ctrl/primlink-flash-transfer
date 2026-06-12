import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — UTransfer" },
      { name: "description", content: "News, tips and stories from UTransfer." },
    ],
  }),
  component: BlogPage,
});

const posts = [
  {
    title: "Welcome to UTransfer",
    date: "June 12, 2026",
    excerpt:
      "A faster, friendlier way to send big files — up to 10 GB, free, with no account required.",
  },
  {
    title: "Why we built UTransfer",
    date: "June 10, 2026",
    excerpt:
      "We wanted file sharing that just works: drop, link, done. Powered by Primlink.",
  },
  {
    title: "Tips for sending huge files",
    date: "June 5, 2026",
    excerpt:
      "Best practices for compressing, organizing and sharing large transfers worldwide.",
  },
];

function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="text-muted-foreground mt-2">Stories from the UTransfer team.</p>
        <div className="mt-10 space-y-6">
          {posts.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/60 transition-colors"
            >
              <div className="text-xs text-muted-foreground">{p.date}</div>
              <h2 className="mt-1 text-2xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-muted-foreground">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

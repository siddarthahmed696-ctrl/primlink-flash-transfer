import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Globe2, ShieldCheck, Check, X, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/alternatives/wetransfer")({
  head: () => ({
    meta: [
      { title: "Best WeTransfer Alternative — 800 MB Free | V Move You" },
      {
        name: "description",
        content:
          "Looking for a WeTransfer alternative? V Move You Transfer offers 800 MB free, no account required, and instant worldwide sharing. Try it now.",
      },
      {
        property: "og:title",
        content: "Best WeTransfer Alternative — 800 MB Free | V Move You",
      },
      {
        property: "og:description",
        content:
          "Send up to 800 MB for free with V Move You. No account, no waiting — just drop files and share the link instantly.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primlink-flash-transfer.lovable.app/alternatives/wetransfer" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://primlink-flash-transfer.lovable.app/alternatives/wetransfer",
      },
    ],
  }),
  component: WeTransferAlternativePage,
});

function WeTransferAlternativePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          className="absolute inset-x-0 top-0 h-[600px] pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />

        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 lg:pt-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            WeTransfer alternative
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-3xl mx-auto">
            The <span className="text-gradient-red">best WeTransfer alternative</span> for big files.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            V Move You gives you <strong>800 MB free</strong> with no sign-up, no email verification, and instant links. Just drop files and share.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-glow transition-colors glow-red"
            >
              <Zap className="size-4" />
              Send files free
            </Link>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 border border-border bg-surface hover:bg-surface-elevated rounded-lg px-6 py-3 text-sm font-medium transition-colors"
            >
              See the comparison <ArrowRight className="size-4" />
            </a>
          </div>
        </section>

        {/* Comparison */}
        <section id="comparison" className="relative mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            V Move You vs <span className="text-gradient-red">WeTransfer</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-center max-w-xl mx-auto">
            Why users switch to V Move You for free file transfers.
          </p>

          <div className="mt-10 rounded-2xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 px-6 py-4 text-sm font-medium border-b border-border bg-surface">
              <div>Feature</div>
              <div className="text-center text-primary">V Move You</div>
              <div className="text-center text-muted-foreground">WeTransfer</div>
            </div>

            <ComparisonRow
              feature="Free file limit"
              primlink="800 MB"
              wetransfer="2 GB"
              highlight
            />
            <ComparisonRow
              feature="Account required"
              primlink="None"
              wetransfer="Email / sign-up"
            />
            <ComparisonRow
              feature="Download speed"
              primlink="Fast global CDN"
              wetransfer="Standard"
            />
            <ComparisonRow
              feature="Download limits"
              primlink="Unlimited"
              wetransfer="Limited on free tier"
            />
            <ComparisonRow
              feature="Link expiry"
              primlink="7 days"
              wetransfer="7 days (free)"
            />
            <ComparisonRow
              feature="Ads / branding"
              primlink="None"
              wetransfer="Branded emails (free)"
            />
            <ComparisonRow
              feature="Mobile friendly"
              primlink="Fully responsive"
              wetransfer="App required for some features"
            />
          </div>
        </section>

        {/* Why switch */}
        <section className="relative mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            Why users call us the <span className="text-gradient-red">top WeTransfer alternative</span>
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            <ReasonCard
              icon={<Zap className="size-5" />}
              title="Fast free transfers"
              body="V Move You lets you send up to 800 MB without paying a cent — perfect for documents, images, small videos, and everyday sharing."
            />
            <ReasonCard
              icon={<Globe2 className="size-5" />}
              title="No borders, no accounts"
              body="Recipients don't need to create an account or verify an email. Open the link, click download, and the file is yours. It works the same in every country."
            />
            <ReasonCard
              icon={<ShieldCheck className="size-5" />}
              title="Private by default"
              body="Your files are encrypted in transit and stored securely. We don't scan your content, sell your data, or force you into a subscription to remove branding."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="relative mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            <FaqItem
              question="Is V Move You really a free WeTransfer alternative?"
              answer="Yes. V Move You is completely free for transfers up to 800 MB. Larger transfers can move to a subscription plan."
            />
            <FaqItem
              question="Do recipients need an account to download?"
              answer="No. Anyone with the share link can download your files instantly — no sign-up, no login wall, no verification email."
            />
            <FaqItem
              question="How does download speed compare to WeTransfer?"
              answer="V Move You uses a global CDN to deliver files quickly from the nearest edge location. Most users see comparable or faster download speeds than traditional transfer services."
            />
            <FaqItem
              question="Is there a file type restriction?"
              answer="No. You can upload any file type — videos, RAW photos, ZIP archives, design files, documents, and more."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to switch from <span className="text-gradient-red">WeTransfer</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Join thousands of users who moved to V Move You for bigger free limits and zero friction.
            </p>
            <div className="mt-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:bg-primary-glow transition-colors glow-red"
              >
                <Zap className="size-4" />
                Start your first 800 MB transfer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10 border-b border-border/60 backdrop-blur bg-background/60">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <Zap className="size-4" />
          </span>
          V Move You<span className="text-primary">.</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#comparison" className="hover:text-foreground transition-colors">Comparison</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-12">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} V Move You Transfer</div>
        <div>Built for speed. Made for the world.</div>
      </div>
    </footer>
  );
}

function ComparisonRow({
  feature,
  primlink,
  wetransfer,
  highlight,
}: {
  feature: string;
  primlink: string;
  wetransfer: string;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 px-6 py-4 text-sm border-b border-border/50 items-center">
      <div className="font-medium">{feature}</div>
      <div className={`text-center font-semibold ${highlight ? "text-primary" : ""}`}>{primlink}</div>
      <div className="text-center text-muted-foreground">{wetransfer}</div>
    </div>
  );
}

function ReasonCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/60 transition-colors">
      <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card px-6 py-4 open:bg-surface transition-colors">
      <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm sm:text-base">
        {question}
        <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">
          <ArrowRight className="size-4 rotate-90" />
        </span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </details>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CreditCard } from "lucide-react";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription — V Move You" },
      {
        name: "description",
        content: "Upgrade V Move You for larger file transfers beyond the free 800 MB limit.",
      },
      { property: "og:title", content: "Subscription — V Move You" },
      {
        property: "og:description",
        content: "Upgrade V Move You for larger file transfers beyond the free 800 MB limit.",
      },
    ],
    links: [{ rel: "canonical", href: "https://primlink-flash-transfer.lovable.app/subscription" }],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to transfer
        </Link>

        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Subscription</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
              Send larger files with V Move You Pro
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Free transfers support up to 800 MB. Upgrade when you need bigger uploads,
              faster sharing, and more room for video, design, and business files.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Pro transfer</h2>
                <p className="mt-1 text-sm text-muted-foreground">For files above the free limit</p>
              </div>
              <div className="rounded-full bg-primary p-3 text-primary-foreground">
                <CreditCard className="size-5" />
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Larger file transfer support",
                "Private share links",
                "Recipient download access",
                "Priority transfer experience",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="size-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-7 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              onClick={() => alert("Subscription checkout is coming soon.")}
            >
              Continue to subscription
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
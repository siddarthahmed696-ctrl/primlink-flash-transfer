import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { title: "Acceptable Use Policy — V Move You" },
      { name: "description", content: "Acceptable use policy for V Move You." },
    ],
  }),
  component: PolicyPage,
});

function PolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
        <h1 className="text-4xl font-bold">Acceptable Use Policy</h1>
        <p className="mt-4 text-muted-foreground">
          V Move You is built for legitimate sharing. You agree NOT to use it to:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Distribute malware, viruses or harmful code.</li>
          <li>Share content that infringes copyright or other intellectual property.</li>
          <li>Send illegal, harassing, or abusive material.</li>
          <li>Attempt to overload, attack or reverse-engineer the service.</li>
        </ul>
        <h2 className="mt-8 text-2xl font-semibold">Enforcement</h2>
        <p className="mt-2 text-muted-foreground">
          We may remove transfers and block users who violate this policy, with or without notice.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

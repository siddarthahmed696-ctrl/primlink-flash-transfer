import { createFileRoute, redirect } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/legal")({
  beforeLoad: () => {
    throw redirect({ to: "/privacy" });
  },
  head: () => ({
    meta: [
      { title: "Legal — V Move You" },
      { name: "description", content: "Legal information and terms for using V Move You." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12 prose prose-invert">
        <h1 className="text-4xl font-bold">Legal</h1>
        <p className="mt-4 text-muted-foreground">
          V Move You is a file-transfer service operated by V Move You. By using this site you agree
          to use it lawfully and not to upload content that violates any law or third-party right.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Terms of use</h2>
        <p className="mt-2 text-muted-foreground">
          Files are stored temporarily and automatically deleted after their expiry. We may remove
          content that violates these terms. The service is provided “as is” without warranties.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Liability</h2>
        <p className="mt-2 text-muted-foreground">
          To the maximum extent permitted by law, V Move You and V Move You are not liable for any
          indirect or consequential damages arising from your use of the service.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Contact</h2>
        <p className="mt-2 text-muted-foreground">
          For legal inquiries, contact us via the V Move You website.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

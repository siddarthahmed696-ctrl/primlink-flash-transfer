import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — UTransfer" },
      { name: "description", content: "How UTransfer handles your data and privacy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
        <h1 className="text-4xl font-bold">Privacy</h1>
        <p className="mt-4 text-muted-foreground">
          We respect your privacy. UTransfer requires no account to send files. We collect the
          minimum data needed to operate the service.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">What we store</h2>
        <p className="mt-2 text-muted-foreground">
          Uploaded files and metadata (file name, size, optional message and email) are stored
          temporarily and deleted automatically when the transfer expires.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Cookies</h2>
        <p className="mt-2 text-muted-foreground">
          We use only essential cookies needed for the service to function.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Your rights</h2>
        <p className="mt-2 text-muted-foreground">
          You may request deletion of any transfer you created by contacting us via UTransfer.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

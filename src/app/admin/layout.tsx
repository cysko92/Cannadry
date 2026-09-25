import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/viewer";

export const metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireAdmin();
  return (
    <>
      <AppHeader
        home="/admin"
        badge="Admin"
        userName={viewer.profile?.full_name ?? ""}
        nav={[
          { href: "/admin/requests", label: "Access requests" },
          { href: "/admin/companies", label: "Companies" },
          { href: "/shop", label: "Preview shop" },
        ]}
      />
      <main id="main" className="flex-1 bg-fog">
        {children}
      </main>
    </>
  );
}

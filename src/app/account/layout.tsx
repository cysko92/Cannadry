import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getViewer } from "@/lib/viewer";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");
  const isAdmin = !!viewer.profile?.is_admin;
  if (!isAdmin && viewer.company?.status !== "approved") redirect("/pending");
  return (
    <>
      <AppHeader
        home={isAdmin ? "/admin" : "/shop"}
        badge={isAdmin ? "Admin" : undefined}
        userName={viewer.profile?.full_name ?? ""}
        companyName={viewer.company?.legal_name}
        nav={
          isAdmin
            ? [
                { href: "/admin", label: "Dashboard" },
                { href: "/admin/orders", label: "Orders" },
                { href: "/admin/products", label: "Products" },
                { href: "/admin/requests", label: "Access requests" },
              ]
            : [
                { href: "/shop", label: "Catalogue" },
                { href: "/shop/orders", label: "Orders" },
                { href: "/shop/cart", label: "Cart" },
              ]
        }
      />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}

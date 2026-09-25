import { AppHeader } from "@/components/app-header";
import { requireBuyer } from "@/lib/viewer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireBuyer();
  const isAdmin = !!viewer.profile?.is_admin;
  return (
    <>
      <AppHeader
        home="/shop"
        badge={isAdmin ? "Staff preview" : undefined}
        userName={viewer.profile?.full_name ?? viewer.user.email ?? ""}
        companyName={viewer.company?.legal_name}
        nav={[
          { href: "/shop", label: "Catalogue" },
          { href: "/shop/orders", label: "Orders" },
          { href: "/shop/cart", label: "Cart" },
          ...(isAdmin ? [{ href: "/admin", label: "Back to admin" }] : []),
        ]}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}

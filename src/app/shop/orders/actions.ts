"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/form";
import { emails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";

export async function cancelOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireBuyer();
  const id = String(formData.get("order_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { errors: { reason: ["Give a reason for cancelling."] } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", { p_order_id: id, p_status: "cancelled", p_note: reason });
  if (error) return { message: error.message };
  const { data: o } = await supabase.from("orders").select("po_number").eq("id", id).single();
  if (o) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (to) await emails.orderStatus(to, o.po_number, "cancelled by the buyer", reason);
  }
  revalidatePath(`/shop/orders/${id}`);
  return { ok: true, message: "Order cancelled." };
}

/** Adds the lines of a past order back to the cart, using the same lot or another lot of the same product. */
export async function reorder(formData: FormData) {
  const viewer = await requireBuyer();
  if (viewer.profile?.is_admin || !viewer.company) redirect("/shop");
  const id = String(formData.get("order_id") ?? "");
  const supabase = await createClient();
  const { data: items } = await supabase.from("order_items").select("product_id, lot_id, quantity_units").eq("order_id", id);

  let added = 0;
  let skipped = 0;
  for (const item of items ?? []) {
    const { data: lots } = await supabase
      .from("product_lots")
      .select("id, stock_units, coa_path, product:products(status)")
      .eq("product_id", item.product_id)
      .eq("active", true)
      .gte("stock_units", item.quantity_units)
      .not("coa_path", "is", null);
    const candidates = (lots ?? []).filter((l) => l.product?.status === "published");
    const lot = candidates.find((l) => l.id === item.lot_id) ?? candidates[0];
    if (!lot) {
      skipped++;
      continue;
    }
    const { data: existing } = await supabase.from("cart_items").select("id").eq("lot_id", lot.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("cart_items").update({ quantity_units: item.quantity_units }).eq("id", existing.id)
      : await supabase.from("cart_items").insert({
          user_id: viewer.user.id,
          company_id: viewer.company.id,
          lot_id: lot.id,
          quantity_units: item.quantity_units,
        });
    if (error) skipped++;
    else added++;
  }
  revalidatePath("/shop", "layout");
  redirect(`/shop/cart?reordered=${added}&skipped=${skipped}`);
}

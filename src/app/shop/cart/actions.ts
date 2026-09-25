"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/form";
import { emails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";

async function buyerContext() {
  const viewer = await requireBuyer();
  if (viewer.profile?.is_admin || !viewer.company) {
    return { error: "Staff accounts preview the shop but cannot place orders." } as const;
  }
  return { viewer, companyId: viewer.company.id, companyName: viewer.company.legal_name } as const;
}

async function lotRules(lotId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_lots")
    .select("id, stock_units, active, coa_path, product:products(name, units_per_case, min_order_units, status)")
    .eq("id", lotId)
    .maybeSingle();
  return data;
}

export async function addToCart(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await buyerContext();
  if ("error" in ctx) return { message: ctx.error };
  const lotId = String(formData.get("lot_id") ?? "");
  const cases = Number(formData.get("cases"));
  if (!lotId) return { errors: { lot_id: ["Choose a lot."] } };
  if (!Number.isInteger(cases) || cases < 1) return { errors: { cases: ["Enter a whole number of cases."] } };

  const lot = await lotRules(lotId);
  if (!lot?.product || !lot.active || !lot.coa_path || lot.product.status !== "published") {
    return { message: "This lot is no longer available." };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity_units")
    .eq("lot_id", lotId)
    .maybeSingle();

  const units = cases * lot.product.units_per_case + (existing?.quantity_units ?? 0);
  if (units < lot.product.min_order_units) {
    return { errors: { cases: [`The minimum order is ${lot.product.min_order_units} units.`] } };
  }
  if (units > lot.stock_units) {
    return { errors: { cases: [`Only ${lot.stock_units} units of this lot are in stock.`] } };
  }

  const { error } = existing
    ? await supabase.from("cart_items").update({ quantity_units: units }).eq("id", existing.id)
    : await supabase
        .from("cart_items")
        .insert({ user_id: ctx.viewer.user.id, company_id: ctx.companyId, lot_id: lotId, quantity_units: units });
  if (error) return { message: "Could not add to cart. Please try again." };

  revalidatePath("/shop", "layout");
  return { ok: true, message: `Added. ${units} units of this lot are in your cart.` };
}

export async function updateCartItem(formData: FormData) {
  const ctx = await buyerContext();
  if ("error" in ctx) return;
  const id = String(formData.get("id") ?? "");
  const cases = Number(formData.get("cases"));
  const supabase = await createClient();
  const { data: item } = await supabase.from("cart_items").select("lot_id").eq("id", id).maybeSingle();
  if (!item) return;
  const lot = await lotRules(item.lot_id);
  if (!lot?.product || !Number.isInteger(cases) || cases < 0) return;
  if (cases === 0) await supabase.from("cart_items").delete().eq("id", id);
  else await supabase.from("cart_items").update({ quantity_units: cases * lot.product.units_per_case }).eq("id", id);
  revalidatePath("/shop", "layout");
}

export async function removeCartItem(formData: FormData) {
  await requireBuyer();
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/shop", "layout");
}

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await buyerContext();
  if ("error" in ctx) return { message: ctx.error };
  if (formData.get("confirm") !== "on") {
    return { errors: { confirm: ["Please confirm that your licence permits this purchase."] } };
  }
  const notes = String(formData.get("notes") ?? "").slice(0, 1000);
  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("place_order", { p_notes: notes || undefined });
  if (error || !orderId) return { message: error?.message ?? "Could not place the order." };

  const { data: order } = await supabase
    .from("orders")
    .select("po_number, subtotal_cents")
    .eq("id", orderId)
    .single();
  if (order) {
    await Promise.all([
      emails.orderPlaced(ctx.viewer.user.email!, order.po_number, ctx.companyName, order.subtotal_cents),
      emails.adminNewOrder(order.po_number, ctx.companyName, orderId),
    ]);
  }
  revalidatePath("/shop", "layout");
  redirect(`/shop/orders/${orderId}?placed=1`);
}

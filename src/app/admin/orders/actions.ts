"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form";
import { emails } from "@/lib/email";
import { MAX_UPLOAD_BYTES } from "@/lib/licence";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/viewer";

const LABEL: Record<string, string> = {
  accepted: "accepted",
  rejected: "rejected",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

async function buyerEmail(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("po_number, company:companies(contact_email), placed_by")
    .eq("id", orderId)
    .single();
  if (!data) return null;
  const { data: placer } = await supabase.from("profiles").select("email").eq("id", data.placed_by).maybeSingle();
  return { po: data.po_number, to: [...new Set([placer?.email, data.company?.contact_email].filter(Boolean) as string[])] };
}

export async function changeOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!(status in LABEL)) return { message: "Unknown action." };
  if ((status === "rejected" || status === "cancelled") && !note) {
    return { errors: { note: ["Give a reason. It is sent to the buyer."] } };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order_id: id,
    p_status: status as "accepted",
    p_note: note || undefined,
  });
  if (error) return { message: error.message };

  const b = await buyerEmail(id);
  if (b?.to.length) await emails.orderStatus(b.to, b.po, LABEL[status], note || null);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Order ${LABEL[status]}. The buyer has been emailed.` };
}

export async function uploadInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("order_id") ?? "");
  const file = formData.get("invoice");
  if (!(file instanceof File) || file.size === 0) return { errors: { invoice: ["Choose the invoice PDF."] } };
  if (file.type !== "application/pdf") return { errors: { invoice: ["The invoice must be a PDF."] } };
  if (file.size > MAX_UPLOAD_BYTES) return { errors: { invoice: ["The file must be 4 MB or smaller."] } };

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("company_id, po_number").eq("id", id).single();
  if (!order) return { message: "Order not found." };
  const path = `${order.company_id}/${order.po_number}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  const up = await supabase.storage.from("invoices").upload(path, file, { contentType: "application/pdf" });
  if (up.error) return { message: up.error.message };
  const { error } = await supabase.rpc("set_order_invoice", { p_order_id: id, p_path: path });
  if (error) return { message: error.message };

  const b = await buyerEmail(id);
  if (b?.to.length) await emails.invoiceAvailable(b.to, b.po);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Invoice attached. The buyer has been emailed." };
}

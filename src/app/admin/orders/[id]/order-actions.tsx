"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { Field, FormMessage, type FormState, TextAreaField, inputClass, keepValuesOnSubmit } from "@/components/form";
import { changeOrderStatus, uploadInvoice } from "../actions";

const NEXT: Record<string, { status: string; label: string; variant?: "primary" | "secondary" | "danger" }[]> = {
  submitted: [
    { status: "accepted", label: "Accept" },
    { status: "rejected", label: "Reject", variant: "danger" },
  ],
  accepted: [
    { status: "shipped", label: "Mark shipped" },
    { status: "cancelled", label: "Cancel", variant: "danger" },
  ],
  shipped: [{ status: "delivered", label: "Mark delivered" }],
};

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changeOrderStatus, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  const options = NEXT[status] ?? [];
  if (!options.length) return <p className="text-sm text-ink-muted">No further actions for a {status} order.</p>;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="order_id" value={orderId} />
      <TextAreaField
        name="note"
        label="Note"
        optional
        hint="Required to reject or cancel. Shipping: carrier and tracking number. Sent to the buyer."
        errors={state.errors?.note}
      />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={o.status} type="submit" name="status" value={o.status} variant={o.variant ?? "primary"} disabled={pending}>
            {o.label}
          </Button>
        ))}
      </div>
    </form>
  );
}

export function InvoiceForm({ orderId, hasInvoice }: { orderId: string; hasInvoice: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadInvoice, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="order_id" value={orderId} />
      <Field name="invoice" label={hasInvoice ? "Replace invoice (PDF)" : "Invoice (PDF)"} hint="Up to 4 MB. The buyer can download it from their order." errors={state.errors?.invoice}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            name="invoice"
            type="file"
            accept="application/pdf"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={`${inputClass(invalid)} file:mr-3 file:rounded-sm file:border-0 file:bg-forest file:px-3 file:py-1 file:text-sm file:text-fog`}
          />
        )}
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Uploading…" : "Upload invoice"}</Button>
    </form>
  );
}

"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextAreaField, keepValuesOnSubmit } from "@/components/form";
import { cancelOrder } from "../actions";

export function CancelForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(cancelOrder, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <details className="rounded-sm border border-stone/60 bg-paper p-5">
      <summary className="cursor-pointer text-sm font-medium">Cancel this order</summary>
      <form action={action} onSubmit={onSubmit} className="mt-4 space-y-4">
        <FormMessage state={state} />
        <input type="hidden" name="order_id" value={orderId} />
        <TextAreaField name="reason" label="Reason" errors={state.errors?.reason} />
        <Button type="submit" variant="danger" disabled={pending}>{pending ? "Cancelling…" : "Cancel order"}</Button>
      </form>
    </details>
  );
}

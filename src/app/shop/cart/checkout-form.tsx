"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextAreaField, keepValuesOnSubmit } from "@/components/form";
import { placeOrder } from "./actions";

export function CheckoutForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  const err = state.errors?.confirm;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <TextAreaField name="notes" label="Notes for CannaDry" optional hint="Delivery instructions, your internal PO reference, etc." maxLength={1000} />
      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="confirm" required aria-describedby={err ? "confirm-err" : undefined} className="mt-1 h-4 w-4 shrink-0 accent-forest" />
          <span>I confirm our Health Canada licence permits the purchase of these products.</span>
        </label>
        {err && <p id="confirm-err" className="mt-1 pl-7 text-sm text-danger">{err.join(" ")}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending || disabled}>
        {pending ? "Submitting…" : "Submit purchase order"}
      </Button>
      <p className="text-xs text-ink-muted">No payment now. CannaDry confirms the order and issues an invoice.</p>
    </form>
  );
}

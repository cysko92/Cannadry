"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextField, keepValuesOnSubmit } from "@/components/form";
import { updateProfile } from "./actions";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  const e = state.errors ?? {};
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5">
      <FormMessage state={state} />
      <TextField name="full_name" label="Full name" autoComplete="name" defaultValue={fullName} errors={e.full_name} />
      <TextField name="phone" type="tel" label="Phone" optional autoComplete="tel" defaultValue={phone} errors={e.phone} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

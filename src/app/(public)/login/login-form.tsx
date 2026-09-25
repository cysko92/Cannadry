"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextField, keepValuesOnSubmit } from "@/components/form";
import { signIn } from "@/app/auth/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <TextField name="email" type="email" label="Email" autoComplete="email" defaultValue={state.values?.email} />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" />
      <div className="flex items-center justify-between gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <Link href="/forgot-password" className="text-sm underline underline-offset-2">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

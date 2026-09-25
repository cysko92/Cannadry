"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextField } from "@/components/form";
import { updatePassword } from "@/app/auth/actions";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  const e = state.errors ?? {};
  return (
    <div className="container-page flex justify-center py-20">
      <div className="w-full max-w-md">
        <title>Choose a new password · CannaDry</title>
        <h1 className="text-4xl">Choose a new password</h1>
        <form action={action} className="mt-8 space-y-5">
          <FormMessage state={state} />
          <TextField name="password" type="password" label="New password" autoComplete="new-password" hint="At least 10 characters." errors={e.password} />
          <TextField name="password_confirm" type="password" label="Confirm new password" autoComplete="new-password" errors={e.password_confirm} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

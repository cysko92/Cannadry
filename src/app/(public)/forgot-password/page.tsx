"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextField } from "@/components/form";
import { sendPasswordReset } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendPasswordReset, {});
  return (
    <div className="container-page flex justify-center py-20">
      <div className="w-full max-w-md">
        <title>Reset password · CannaDry</title>
        <h1 className="text-4xl">Reset your password</h1>
        <p className="mt-3 text-ink-muted">We will email you a link to choose a new password.</p>
        <form action={action} className="mt-8 space-y-5">
          <FormMessage state={state} />
          <TextField name="email" type="email" label="Email" autoComplete="email" />
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  );
}

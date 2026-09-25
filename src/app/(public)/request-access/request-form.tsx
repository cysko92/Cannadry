"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { Field, FormMessage, type FormState, SelectField, TextField, inputClass, keepValuesOnSubmit } from "@/components/form";
import { LICENCE_TYPES, PROVINCES } from "@/lib/licence";
import { requestAccess } from "./actions";

export function RequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestAccess, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="rounded-sm border border-moss bg-success-tint p-8" role="status">
        <h2 className="text-2xl">Request received</h2>
        <p className="mt-3 leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-10" noValidate>
      <FormMessage state={state} />

      <fieldset className="space-y-5">
        <legend className="font-serif text-2xl">Company and licence</legend>
        <TextField name="legal_name" label="Company legal name" autoComplete="organization" defaultValue={v.legal_name} errors={e.legal_name} />
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField name="licence_type" label="Licence type" options={LICENCE_TYPES} defaultValue={v.licence_type} errors={e.licence_type} />
          <TextField name="licence_number" label="Health Canada licence number" defaultValue={v.licence_number} errors={e.licence_number} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField name="province" label="Province or territory" options={PROVINCES} defaultValue={v.province} errors={e.province} />
          <TextField name="address" label="Licensed site address" autoComplete="street-address" defaultValue={v.address} errors={e.address} />
        </div>
        <Field
          name="licence_document"
          label="Licence document"
          hint="A copy of your Health Canada licence. PDF, JPG or PNG, up to 4 MB."
          errors={e.licence_document}
        >
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              name="licence_document"
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={`${inputClass(invalid)} file:mr-4 file:rounded-sm file:border-0 file:bg-forest file:px-3 file:py-1.5 file:text-sm file:text-fog`}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-serif text-2xl">Contact person</legend>
        <TextField name="contact_name" label="Full name" autoComplete="name" defaultValue={v.contact_name} errors={e.contact_name} />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="email" type="email" label="Work email" autoComplete="email" defaultValue={v.email} errors={e.email} hint="This is also your sign-in." />
          <TextField name="phone" type="tel" label="Phone" autoComplete="tel" defaultValue={v.phone} errors={e.phone} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="password" type="password" label="Password" autoComplete="new-password" hint="At least 10 characters." errors={e.password} />
          <TextField name="password_confirm" type="password" label="Confirm password" autoComplete="new-password" errors={e.password_confirm} />
        </div>
      </fieldset>

      {/* Honeypot for bots; hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="space-y-4">
        <legend className="sr-only">Declarations</legend>
        <Checkbox name="confirm_authority" errors={e.confirm_authority}>
          I am 19 or older and authorised to act for this company, and the licence information above is accurate.
        </Checkbox>
        <Checkbox name="accept_terms" errors={e.accept_terms}>
          I accept the{" "}
          <Link href="/terms" className="underline underline-offset-2" target="_blank">
            terms of use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2" target="_blank">
            privacy policy
          </Link>
          .
        </Checkbox>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit request"}
        </Button>
        <p className="text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

function Checkbox({ name, errors, children }: { name: string; errors?: string[]; children: React.ReactNode }) {
  const errId = errors?.length ? `f-${name}-err` : undefined;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          name={name}
          required
          aria-describedby={errId}
          aria-invalid={errId ? true : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-forest"
        />
        <span>{children}</span>
      </label>
      {errId && (
        <p id={errId} className="mt-1 pl-7 text-sm text-danger">
          {errors!.join(" ")}
        </p>
      )}
    </div>
  );
}

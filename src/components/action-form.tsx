"use client";

import { useActionState, useTransition } from "react";
import { Button } from "./button";
import {
  Field,
  FormMessage,
  type FormState,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
  keepValuesOnSubmit,
} from "./form";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "textarea" | "select" | "checkbox" | "file" | "hidden";
  defaultValue?: string | number | boolean | null;
  hint?: string;
  optional?: boolean;
  options?: { value: string; label: string }[];
  accept?: string;
  step?: string;
  min?: number;
  max?: number;
  wide?: boolean; // span both columns
};

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Generic two-column form driven by field specs, for admin screens. */
export function ActionForm({
  action,
  fields,
  submitLabel,
  submitName,
  submitValue,
  variant = "primary",
}: {
  action: Action;
  fields: FieldSpec[];
  submitLabel: string;
  submitName?: string;
  submitValue?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(dispatch, startTransition);
  const err = state.errors ?? {};

  return (
    <form action={dispatch} onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f) => {
          const dv = f.defaultValue == null ? undefined : String(f.defaultValue);
          const span = f.wide || f.type === "textarea" ? "md:col-span-2" : "";
          switch (f.type) {
            case "hidden":
              return <input key={f.name} type="hidden" name={f.name} value={dv ?? ""} />;
            case "textarea":
              return (
                <div key={f.name} className={span}>
                  <TextAreaField name={f.name} label={f.label} hint={f.hint} optional={f.optional} defaultValue={dv} errors={err[f.name]} />
                </div>
              );
            case "select":
              return (
                <div key={f.name} className={span}>
                  <SelectField name={f.name} label={f.label} hint={f.hint} options={f.options ?? []} defaultValue={dv ?? ""} errors={err[f.name]} />
                </div>
              );
            case "checkbox":
              return (
                <label key={f.name} className={`flex items-center gap-2 self-end pb-2 text-sm ${span}`}>
                  <input type="checkbox" name={f.name} defaultChecked={f.defaultValue === true} className="h-4 w-4 accent-forest" />
                  {f.label}
                </label>
              );
            case "file":
              return (
                <div key={f.name} className={span}>
                  <Field name={f.name} label={f.label} hint={f.hint} optional={f.optional} errors={err[f.name]}>
                    {({ id, describedBy, invalid }) => (
                      <input
                        id={id}
                        name={f.name}
                        type="file"
                        accept={f.accept}
                        aria-describedby={describedBy}
                        aria-invalid={invalid || undefined}
                        className={`${inputClass(invalid)} file:mr-3 file:rounded-sm file:border-0 file:bg-forest file:px-3 file:py-1 file:text-sm file:text-fog`}
                      />
                    )}
                  </Field>
                </div>
              );
            default:
              return (
                <div key={f.name} className={span}>
                  <TextField
                    name={f.name}
                    label={f.label}
                    type={f.type ?? "text"}
                    hint={f.hint}
                    optional={f.optional}
                    defaultValue={dv}
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    errors={err[f.name]}
                  />
                </div>
              );
          }
        })}
      </div>
      <Button type="submit" variant={variant} name={submitName} value={submitValue} disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

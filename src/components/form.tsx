import type { ComponentProps, FormEvent, ReactNode } from "react";

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

const inputBase =
  "block w-full rounded-sm border bg-paper px-3 py-2.5 text-base text-forest placeholder:text-ink-muted/70 focus:border-forest focus:outline-2 focus:outline-offset-0 focus:outline-forest";

export function inputClass(invalid?: boolean) {
  return `${inputBase} ${invalid ? "border-danger" : "border-stone"}`;
}

export function Field({
  name,
  label,
  hint,
  errors,
  children,
  optional,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  optional?: boolean;
}) {
  const id = `f-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = errors?.length ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children({ id, describedBy, invalid: !!errId })}</div>
      {errId && (
        <p id={errId} className="mt-1.5 text-sm text-danger">
          {errors!.join(" ")}
        </p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  errors,
  optional,
  ...input
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  optional?: boolean;
} & Omit<ComponentProps<"input">, "name" | "id">) {
  return (
    <Field name={name} label={label} hint={hint} errors={errors} optional={optional}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={!optional}
          className={inputClass(invalid)}
          {...input}
        />
      )}
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  errors,
  options,
  placeholder = "Select…",
  ...select
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  options: readonly string[] | readonly { value: string; label: string }[];
  placeholder?: string;
} & Omit<ComponentProps<"select">, "name" | "id">) {
  return (
    <Field name={name} label={label} hint={hint} errors={errors}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required
          className={inputClass(invalid)}
          {...select}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      )}
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  errors,
  optional,
  ...rest
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  optional?: boolean;
} & Omit<ComponentProps<"textarea">, "name" | "id">) {
  return (
    <Field name={name} label={label} hint={hint} errors={errors} optional={optional}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={!optional}
          rows={3}
          className={inputClass(invalid)}
          {...rest}
        />
      )}
    </Field>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-sm border px-4 py-3 text-sm ${
        state.ok ? "border-moss bg-success-tint" : "border-danger/40 bg-danger-tint text-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

/**
 * Submit handler for forms using useActionState that keeps what the user typed
 * (React resets uncontrolled forms after a form action; that loses input on errors).
 * The `action` prop stays on the form so it still works without JavaScript.
 */
export function keepValuesOnSubmit(
  action: (formData: FormData) => void,
  startTransition: (fn: () => void) => void,
) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) data.set(submitter.name, submitter.value);
    startTransition(() => action(data));
  };
}

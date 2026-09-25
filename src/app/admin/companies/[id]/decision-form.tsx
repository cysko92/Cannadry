"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, TextAreaField, keepValuesOnSubmit } from "@/components/form";
import type { Enums } from "@/lib/supabase/database.types";
import { decideCompany } from "./actions";

export function DecisionForm({ companyId, status }: { companyId: string; status: Enums<"company_status"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideCompany, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);

  if (status === "rejected") {
    return <p className="text-sm text-ink-muted">This request was rejected. The applicant can submit a new request.</p>;
  }

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="company_id" value={companyId} />
      <TextAreaField
        name="note"
        label={status === "pending" ? "Note" : "Reason"}
        optional={status !== "approved"}
        hint={
          status === "pending"
            ? "Required when rejecting. Sent to the applicant."
            : status === "approved"
              ? "Required when suspending. Sent to the company."
              : undefined
        }
        errors={state.errors?.note}
      />
      <div className="flex flex-wrap gap-3">
        {status === "pending" && (
          <>
            <Button type="submit" name="decision" value="approve" disabled={pending}>
              Approve
            </Button>
            <Button type="submit" name="decision" value="reject" variant="danger" disabled={pending}>
              Reject
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button type="submit" name="decision" value="suspend" variant="danger" disabled={pending}>
            Suspend account
          </Button>
        )}
        {status === "suspended" && (
          <Button type="submit" name="decision" value="reactivate" disabled={pending}>
            Reactivate account
          </Button>
        )}
      </div>
    </form>
  );
}

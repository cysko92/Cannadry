"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState } from "@/components/form";
import { setProductStatus } from "../../catalogue-actions";

export function StatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setProductStatus, {});
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {status !== "published" && (
          <Button type="submit" name="status" value="published" disabled={pending}>Publish</Button>
        )}
        {status === "published" && (
          <Button type="submit" name="status" value="draft" variant="secondary" disabled={pending}>Unpublish</Button>
        )}
        {status !== "archived" && (
          <Button type="submit" name="status" value="archived" variant="secondary" disabled={pending}>Archive</Button>
        )}
        {status === "archived" && (
          <Button type="submit" name="status" value="draft" variant="secondary" disabled={pending}>Restore to draft</Button>
        )}
      </div>
    </form>
  );
}

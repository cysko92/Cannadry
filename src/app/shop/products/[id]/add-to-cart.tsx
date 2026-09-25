"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/button";
import { FormMessage, type FormState, keepValuesOnSubmit } from "@/components/form";
import { formatMoney } from "@/lib/format";
import { addToCart } from "../../cart/actions";

type Lot = { id: string; lot_number: string; stock_units: number; orderable: boolean };

export function AddToCart({
  lots,
  unitsPerCase,
  minUnits,
  pricePerUnitCents,
  disabledReason,
}: {
  lots: Lot[];
  unitsPerCase: number;
  minUnits: number;
  pricePerUnitCents: number;
  disabledReason?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(addToCart, {});
  const [, startTransition] = useTransition();
  const onSubmit = keepValuesOnSubmit(action, startTransition);
  const orderable = lots.filter((l) => l.orderable);
  const minCases = Math.max(1, Math.ceil(minUnits / unitsPerCase));
  const [cases, setCases] = useState(minCases);

  if (disabledReason) return <p className="text-sm text-ink-muted">{disabledReason}</p>;
  if (!orderable.length) return <p className="font-medium text-danger">Out of stock.</p>;

  const casesErr = state.errors?.cases;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      {state.ok && (
        <p className="text-sm">
          <Link href="/shop/cart" className="underline underline-offset-2">View cart</Link>
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-medium">Lot</legend>
        <div className="mt-2 space-y-2">
          {orderable.map((l, i) => (
            <label key={l.id} className="flex items-center justify-between gap-3 rounded-sm border border-stone bg-paper px-3 py-2 text-sm has-[:checked]:border-forest">
              <span className="flex items-center gap-2">
                <input type="radio" name="lot_id" value={l.id} defaultChecked={i === 0} className="accent-forest" />
                {l.lot_number}
              </span>
              <span className="text-ink-muted">{l.stock_units.toLocaleString("en-CA")} units</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="cases" className="text-sm font-medium">Cases</label>
        <p id="cases-hint" className="text-sm text-ink-muted">
          {unitsPerCase} units per case. Minimum {minUnits} units ({minCases} {minCases === 1 ? "case" : "cases"}).
        </p>
        <input
          id="cases"
          name="cases"
          type="number"
          min={1}
          step={1}
          value={cases}
          onChange={(e) => setCases(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          aria-describedby={`cases-hint${casesErr ? " cases-err" : ""}`}
          aria-invalid={casesErr ? true : undefined}
          className="mt-1.5 w-32 rounded-sm border border-stone bg-paper px-3 py-2"
        />
        {casesErr && <p id="cases-err" className="mt-1 text-sm text-danger">{casesErr.join(" ")}</p>}
      </div>
      <p className="text-sm">
        {cases * unitsPerCase} units · <span className="font-medium">{formatMoney(cases * unitsPerCase * pricePerUnitCents)}</span>
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add to cart"}</Button>
    </form>
  );
}

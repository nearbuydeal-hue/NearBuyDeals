"use client";

import { useActionState } from "react";
import { completeGoogleShopSignupAction } from "@/app/actions/auth";
import { ShopDetailsFields } from "@/components/auth/ShopDetailsFields";
import type { FormActionState } from "@/app/actions/auth";

const initialState: FormActionState = {};

export function GoogleShopSetupForm() {
  const [state, action, pending] = useActionState(
    completeGoogleShopSignupAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-5">
      <ShopDetailsFields />
      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Submitting shop…" : "Submit shop for review"}
      </button>
    </form>
  );
}

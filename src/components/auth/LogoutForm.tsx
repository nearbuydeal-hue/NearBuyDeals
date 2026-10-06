"use client";

import { useActionState } from "react";
import { logoutAction, type FormActionState } from "@/app/actions/auth";

const initialState: FormActionState = {};

export function LogoutForm() {
  const [state, action, pending] = useActionState(logoutAction, initialState);

  return (
    <form action={action}>
      {state.error ? (
        <p role="alert" className="mb-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Signing out…" : "Log out"}
      </button>
    </form>
  );
}

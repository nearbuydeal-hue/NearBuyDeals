"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/app/actions/auth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ShopDetailsFields } from "@/components/auth/ShopDetailsFields";

const initialState = { error: undefined, success: undefined };
const inputClassName =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
const labelClassName = "grid gap-2 text-sm font-medium text-slate-700";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <div className="grid gap-5">
      <form action={action} className="grid gap-5">
        <ShopDetailsFields />
        <div className="grid gap-4">
          <label className={`${labelClassName} sm:col-span-2`}>
            Email
            <input
              className={inputClassName}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
            />
          </label>
          <label className={`${labelClassName} sm:col-span-2`}>
            Password
            <input
              className={inputClassName}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              aria-describedby="password-hint"
            />
            <span id="password-hint" className="font-normal text-slate-500">
              Use at least 12 characters.
            </span>
          </label>
        </div>

      <div aria-live="polite" aria-atomic="true">
        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {state.success}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Creating account…" : "Create shop-owner account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Log in
        </Link>
      </p>
      </form>
      <p className="text-center text-sm text-slate-500">or</p>
      <GoogleAuthButton />
    </div>
  );
}

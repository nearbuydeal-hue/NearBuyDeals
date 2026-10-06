"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormActionState } from "@/app/actions/auth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const initialState: FormActionState = {};
const inputClassName =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";

export function LoginForm({
  notice,
  authError,
}: {
  notice?: string;
  authError?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <>
      <form action={action} className="grid gap-5">
        {notice ? (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {notice}
          </p>
        ) : null}
        {authError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {authError}
          </p>
        ) : null}
        <label className="grid gap-2 text-sm font-medium text-slate-700">
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
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={72}
            required
          />
        </label>

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
          {pending ? "Signing in…" : "Log in"}
        </button>
        <p className="text-center text-sm text-slate-600">
          New to NearbyDeals?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Sign up your shop
          </Link>
        </p>
      </form>
      <p className="my-5 text-center text-sm text-slate-500">or</p>
      <GoogleAuthButton />
    </>
  );
}

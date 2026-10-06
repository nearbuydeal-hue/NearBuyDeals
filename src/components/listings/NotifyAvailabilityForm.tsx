"use client";

import { useActionState } from "react";
import { requestAvailabilityAction } from "@/app/actions/notify-requests";
import type { NotifyRequestActionState } from "@/lib/validation/notify-requests";

const initialState: NotifyRequestActionState = {};

export function NotifyAvailabilityForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(
    requestAvailabilityAction,
    initialState,
  );

  return (
    <form action={action} className="mt-5 border-t border-slate-100 pt-4">
      <input type="hidden" name="listingId" value={listingId} />
      <div
        aria-hidden="true"
        className="absolute left-[-10000px] top-auto size-px overflow-hidden"
      >
        <label htmlFor={`website-${listingId}`}>Leave this field empty</label>
        <input
          id={`website-${listingId}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <p className="text-sm font-semibold text-emerald-950">
        Notify me when available
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Contact method
          <select
            name="contactMethod"
            required
            defaultValue="whatsapp"
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          WhatsApp number or email
          <input
            name="contactValue"
            type="text"
            required
            maxLength={320}
            autoComplete="off"
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Request"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-3 text-sm text-emerald-900">
          {state.success}
        </p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Your contact details are stored for this request only. No message will
        be sent automatically.
      </p>
    </form>
  );
}

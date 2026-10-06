"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateShopAction, type FormActionState } from "@/app/actions/auth";
import type { ShopDetails } from "@/lib/validation/auth";

const initialState: FormActionState = {};
const inputClassName =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
const labelClassName = "grid gap-2 text-sm font-medium text-slate-700";

export function ShopEditForm({ shop }: { shop: ShopDetails }) {
  const [state, action, pending] = useActionState(
    updateShopAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${labelClassName} sm:col-span-2`}>
          Shop name
          <input
            className={inputClassName}
            name="shopName"
            type="text"
            autoComplete="organization"
            maxLength={120}
            defaultValue={shop.shopName}
            required
          />
        </label>
        <label className={labelClassName}>
          Shop type
          <select
            className={inputClassName}
            name="shopType"
            defaultValue={shop.shopType}
            required
          >
            <option value="pharmacy">Pharmacy</option>
            <option value="grocery">Grocery</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </label>
        <label className={labelClassName}>
          Phone
          <input
            className={inputClassName}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            defaultValue={shop.phone}
            required
          />
        </label>
        <label className={labelClassName}>
          WhatsApp <span className="font-normal text-slate-500">(optional)</span>
          <input
            className={inputClassName}
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            defaultValue={shop.whatsapp ?? ""}
          />
        </label>
        <label className={`${labelClassName} sm:col-span-2`}>
          Address
          <input
            className={inputClassName}
            name="address"
            type="text"
            autoComplete="street-address"
            maxLength={300}
            defaultValue={shop.address}
            required
          />
        </label>
        <label className={labelClassName}>
          Area
          <input
            className={inputClassName}
            name="area"
            type="text"
            autoComplete="address-level3"
            maxLength={120}
            defaultValue={shop.area}
            required
          />
        </label>
        <label className={labelClassName}>
          City
          <input
            className={inputClassName}
            name="city"
            type="text"
            autoComplete="address-level2"
            maxLength={120}
            defaultValue={shop.city}
            required
          />
        </label>
        <label className={`${labelClassName} sm:col-span-2`}>
          Full name
          <input
            className={inputClassName}
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={120}
            defaultValue={shop.fullName}
            required
          />
        </label>
      </div>

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save shop information"}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-900/20 px-6 py-3 text-base font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState, type FormEvent } from "react";
import {
  moderateShopAction,
  type AdminActionState,
} from "@/app/actions/admin";
import type { ShopApprovalStatus } from "@/types/database";

const initialState: AdminActionState = {};

type AdminShopActionFormProps = {
  shopId: string;
  status: ShopApprovalStatus;
};

export function AdminShopActionForm({
  shopId,
  status,
}: AdminShopActionFormProps) {
  const [state, action, pending] = useActionState(
    moderateShopAction,
    initialState,
  );

  const actions =
    status === "pending"
      ? [
          { status: "approved", label: "Approve" },
          { status: "rejected", label: "Reject" },
        ]
      : status === "approved"
        ? [{ status: "suspended", label: "Suspend" }]
        : [{ status: "approved", label: "Re-approve" }];

  function confirmAction(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const status =
      submitter instanceof HTMLButtonElement ? submitter.value : "";
    const actionLabel =
      status === "approved"
        ? "approve this shop"
        : status === "rejected"
          ? "reject this shop"
          : "suspend this shop";

    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={action}
      onSubmit={confirmAction}
      className="mt-5 border-t border-slate-100 pt-4"
    >
      <input type="hidden" name="shopId" value={shopId} />
      {state.error ? (
        <p role="alert" className="mb-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {actions.map((item) => (
          <button
            key={item.status}
            type="submit"
            name="status"
            value={item.status}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Saving…" : item.label}
          </button>
        ))}
      </div>
    </form>
  );
}

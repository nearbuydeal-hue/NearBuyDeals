"use client";

import { useState } from "react";
import { recordShopContactAction } from "@/app/actions/metrics";

type TrackedContactLinksProps = {
  shopId: string;
  listingId: string;
  phone: string;
  whatsapp: string | null;
};

export function TrackedContactLinks({
  shopId,
  listingId,
  phone,
  whatsapp,
}: TrackedContactLinksProps) {
  const [trackingError, setTrackingError] = useState(false);

  function recordContact(contactType: "phone" | "whatsapp") {
    void recordShopContactAction({
      shopId,
      listingId,
      contactType,
    }).then((result) => {
      setTrackingError(Boolean(result.error));
    });
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href={`tel:${phone}`}
          onClick={() => recordContact("phone")}
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Call shop
        </a>
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => recordContact("whatsapp")}
            className="inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
      {trackingError ? (
        <p role="status" className="mt-2 text-xs text-amber-900">
          The contact option still works, but we could not count this action.
        </p>
      ) : null}
    </>
  );
}

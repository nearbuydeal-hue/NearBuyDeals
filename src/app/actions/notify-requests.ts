"use server";

import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  notifyRequestSchema,
  type NotifyRequestActionState,
} from "@/lib/validation/notify-requests";

export async function requestAvailabilityAction(
  _previousState: NotifyRequestActionState,
  formData: FormData,
): Promise<NotifyRequestActionState> {
  const parsed = notifyRequestSchema.safeParse({
    listingId: formData.get("listingId"),
    contactMethod: formData.get("contactMethod"),
    contactValue: formData.get("contactValue"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Check your contact details and try again.",
    };
  }

  if (!hasSupabaseServerConfig()) {
    return {
      error: "Availability requests are temporarily unavailable.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("request_listing_availability", {
    _listing_id: parsed.data.listingId,
    _contact_method: parsed.data.contactMethod,
    _contact_value: parsed.data.contactValue,
  });

  if (error) {
    console.error("Availability request failed:", error.code);
    const errorMessage =
      error.code === "P0001"
        ? "A recent request was already recorded for this contact, or the request limit was reached."
        : error.code === "P0002"
          ? "This item is no longer available for an availability request."
          : "We could not record your request. The item may no longer be available for requests.";

    return {
      error: errorMessage,
    };
  }

  return {
    success:
      "Your request was recorded. NearbyDeals is not sending notifications yet.",
  };
}

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shopContactSchema } from "@/lib/validation/metrics";

export async function recordShopContactAction(input: {
  shopId: string;
  listingId: string | null;
  contactType: "phone" | "whatsapp";
}): Promise<{ error?: string }> {
  const parsed = shopContactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "This contact action could not be counted." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shop_contacts").insert({
    shop_id: parsed.data.shopId,
    listing_id: parsed.data.listingId,
    contact_type: parsed.data.contactType,
  });

  if (error) {
    console.error("Shop contact event insert failed:", error.code);
    return { error: "This contact action could not be counted." };
  }

  return {};
}

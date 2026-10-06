"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  getFirstValidationError,
  listingFormSchema,
} from "@/lib/validation/listings";

function getFormValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(
    [...formData.entries()].filter(([name]) => !name.startsWith("$ACTION_")),
  );
}

async function getAuthenticatedShopOwner() {
  if (!hasSupabaseServerConfig()) {
    redirect("/dashboard/listings?error=not-configured");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Listing access profile query failed:", profileError.code);
    redirect("/dashboard/listings?error=access");
  }

  if (profile?.role !== "shop_owner") {
    redirect("/dashboard/listings?error=shop-owner");
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, approval_status")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (shopError) {
    console.error("Listing access shop lookup failed:", shopError.code);
    redirect("/dashboard/listings?error=access");
  }

  if (!shop) {
    redirect("/dashboard/listings?error=no-shop");
  }

  if (shop.approval_status !== "approved") {
    redirect("/dashboard/listings?error=approval");
  }

  return { supabase, shop };
}

export async function createListingAction(formData: FormData) {
  const parsed = listingFormSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    redirect(`/dashboard/listings?error=${encodeURIComponent(getFirstValidationError(parsed.error))}`);
  }

  const { supabase, shop } = await getAuthenticatedShopOwner();

  const { error } = await supabase.from("listings").insert({
    shop_id: shop.id,
    item_name: parsed.data.itemName,
    description: parsed.data.description ?? null,
    category: parsed.data.category ?? null,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    price: parsed.data.price ?? null,
    expiry_date: parsed.data.expiryDate ?? null,
    status: "active",
  });

  if (error) {
    console.error("Listing creation failed:", error.code);
    redirect("/dashboard/listings?error=save");
  }

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings?success=created");
}

export async function updateListingAction(formData: FormData) {
  const parsed = listingFormSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    redirect(`/dashboard/listings?error=${encodeURIComponent(getFirstValidationError(parsed.error))}`);
  }

  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) {
    redirect("/dashboard/listings?error=missing");
  }

  const { supabase, shop } = await getAuthenticatedShopOwner();

  const { data: listing, error: lookupError } = await supabase
    .from("listings")
    .select("id, shop_id")
    .eq("id", listingId)
    .maybeSingle();

  if (lookupError) {
    console.error("Listing lookup failed:", lookupError.code);
    redirect("/dashboard/listings?error=access");
  }

  if (!listing || listing.shop_id !== shop.id) {
    redirect("/dashboard/listings?error=access");
  }

  const { error } = await supabase
    .from("listings")
    .update({
      item_name: parsed.data.itemName,
      description: parsed.data.description ?? null,
      category: parsed.data.category ?? null,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      price: parsed.data.price ?? null,
      expiry_date: parsed.data.expiryDate ?? null,
      status: parsed.data.status ?? "active",
    })
    .eq("id", listingId)
    .eq("shop_id", shop.id);

  if (error) {
    console.error("Listing update failed:", error.code);
    redirect("/dashboard/listings?error=save");
  }

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings?success=updated");
}

export async function removeListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) {
    redirect("/dashboard/listings?error=missing");
  }

  const { supabase, shop } = await getAuthenticatedShopOwner();

  const { data: listing, error: lookupError } = await supabase
    .from("listings")
    .select("id, shop_id")
    .eq("id", listingId)
    .maybeSingle();

  if (lookupError) {
    console.error("Listing lookup failed:", lookupError.code);
    redirect("/dashboard/listings?error=access");
  }

  if (!listing || listing.shop_id !== shop.id) {
    redirect("/dashboard/listings?error=access");
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId)
    .eq("shop_id", shop.id);

  if (error) {
    console.error("Listing removal failed:", error.code);
    redirect("/dashboard/listings?error=save");
  }

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings?success=removed");
}

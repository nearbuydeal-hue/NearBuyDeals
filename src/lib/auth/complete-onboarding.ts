import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseShopOwnerSignupMetadata,
  type ShopDetails,
} from "@/lib/validation/auth";

export const genericSetupError =
  "Your account was created, but shop setup could not be completed. Sign in again or contact support.";

export async function completeShopOwnerSignup(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  shopDetails: ShopDetails,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("complete_shop_owner_signup", {
    _full_name: shopDetails.fullName,
    _phone: shopDetails.phone,
    _shop_name: shopDetails.shopName,
    _shop_type: shopDetails.shopType,
    _whatsapp: shopDetails.whatsapp ?? null,
    _address: shopDetails.address,
    _area: shopDetails.area,
    _city: shopDetails.city,
  });

  if (error) {
    console.error("Shop-owner onboarding RPC failed:", error.code);
    return { error: genericSetupError };
  }

  return clearOnboardingMetadata(supabase);
}

export async function finishOnboardingFromMetadata(
  user: User,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<{ completed: boolean; error: string | null }> {
  const metadata = user.user_metadata?.shop_onboarding;
  if (metadata === undefined || metadata === null) {
    return { completed: false, error: null };
  }

  const shopDetails = parseShopOwnerSignupMetadata(metadata);
  if (!shopDetails) {
    console.error("Shop onboarding metadata failed server-side validation.");
    return { completed: false, error: genericSetupError };
  }

  const result = await completeShopOwnerSignup(supabase, shopDetails);
  return { completed: !result.error, error: result.error };
}

async function clearOnboardingMetadata(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<{ error: string | null }> {
  const { error: updateError } = await supabase.auth.updateUser({
    data: { shop_onboarding: null },
  });

  if (updateError) {
    console.error(
      "Could not clear completed shop onboarding metadata:",
      updateError.code,
    );
    return { error: genericSetupError };
  }

  return { error: null };
}

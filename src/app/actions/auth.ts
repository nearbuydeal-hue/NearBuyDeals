"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  completeShopOwnerSignup,
  finishOnboardingFromMetadata,
  genericSetupError,
} from "@/lib/auth/complete-onboarding";
import {
  getFirstValidationError,
  loginSchema,
  shopOwnerSignupSchema,
  shopDetailsSchema,
} from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormActionState = {
  error?: string;
  success?: string;
};

const genericSignupError =
  "We couldn’t create your account. Check your details and try again.";

function getFormValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

export async function signupAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = shopOwnerSignupSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (!origin) {
    return { error: "Refresh the page and try signing up again." };
  }

  let emailRedirectTo: string;
  try {
    const parsedOrigin = new URL(origin);
    if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
      return { error: "Refresh the page and try signing up again." };
    }
    emailRedirectTo = new URL("/auth/callback", parsedOrigin.origin).toString();
  } catch {
    return { error: "Refresh the page and try signing up again." };
  }

  const { data, error } = await (
    await createSupabaseServerClient()
  ).auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        shop_onboarding: {
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          shopName: parsed.data.shopName,
          shopType: parsed.data.shopType,
          whatsapp: parsed.data.whatsapp ?? "",
          address: parsed.data.address,
          area: parsed.data.area,
          city: parsed.data.city,
        },
      },
    },
  });

  if (error) {
    console.error("Supabase signup failed:", error.code);
    return { error: genericSignupError };
  }

  if (data.session) {
    const result = await completeShopOwnerSignup(parsed.data);
    if (result.error) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
      return { error: result.error };
    }
    redirect("/dashboard");
  }

  return {
    success:
      "Check your email for a confirmation link. Your shop setup will finish after you confirm your address.",
  };
}

export async function loginAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = loginSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    if (error) {
      console.error("Supabase login failed:", error.code);
    }
    return { error: "Email or password is incorrect. Try again." };
  }

  const onboarding = await finishOnboardingFromMetadata(data.user);
  if (onboarding.error) {
    await supabase.auth.signOut();
    return { error: onboarding.error };
  }

  if (!onboarding.completed) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Could not verify the signed-in profile:", profileError.code);
      await supabase.auth.signOut();
      return { error: "We couldn’t verify this account. Try again later." };
    }

    if (profile?.role !== "shop_owner") {
      await supabase.auth.signOut();
      return {
        error: "This account does not have shop-owner access. Sign up as a shop owner to continue.",
      };
    }
  }

  redirect("/dashboard");
}

export async function logoutAction(
  _previousState: FormActionState,
  _formData: FormData,
): Promise<FormActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout failed:", error.code);
    return { error: "We couldn’t sign you out. Please try again." };
  }

  redirect("/login?message=signed-out");
}

export async function updateShopAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = shopDetailsSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Your session has expired. Sign in again to continue." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Could not verify shop-owner access:", profileError.code);
    return { error: "We couldn’t verify shop-owner access. Try again later." };
  }

  if (profile?.role !== "shop_owner") {
    return { error: "This account does not have shop-owner access." };
  }

  const { data: updatedShop, error: updateError } = await supabase
    .from("shops")
    .update({
      name: parsed.data.shopName,
      shop_type: parsed.data.shopType,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp ?? null,
      address: parsed.data.address,
      area: parsed.data.area,
      city: parsed.data.city,
    })
    .eq("owner_id", userData.user.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Could not update shop information:", updateError.code);
    return { error: "We couldn’t save your shop details. Try again later." };
  }

  if (!updatedShop) {
    return { error: "Your shop could not be found. Contact support for help." };
  }

  return { success: "Shop information saved." };
}
